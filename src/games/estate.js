import {estateCast} from '../data/estate-cast.js';
import {castPicker} from '../portraits.js';
import {el,button,layout,random,store,session} from '../core.js';
import {assets} from '../assets.js';
import {allPhotos,photoFigure,photoLibrary} from '../photo-library.js';
import {workbench} from '../workbench.js';
import {newEstate,prepareEstate,rollEstate,buyEstate,nextEstate,buildEstate,mortgageEstate,settleDebt,bankruptEstate,tradeEstate,useJailCard,groupColors,rentFor,record} from './estate-rules.js';
export function estate(root,skin='heroes'){
  const scope=session();
  const{stage,side}=layout(root,'Local pass-and-play for 2–4 people. Roll, buy or auction, collect rent, complete colour sets, build evenly, trade, mortgage, and manage jail. Click a tile to inspect it. No AI opponents. Saved automatically in this browser.');
  const key='estate.'+skin;let s=store.get(key,null);if(!s||s.version!==1||s.skin!==skin||s.tiles?.length!==40||!Array.isArray(s.players)||s.players.length<2||s.players.length>4||!s.players.every(p=>p&&Number.isFinite(p.cash)&&Number.isInteger(p.pos)&&p.pos>=0&&p.pos<40))s=newEstate(2,skin);prepareEstate(s);let selected=0,auction=null,rolling=false;
  const setup=el('div',{class:'controls'}),count=el('select',{'aria-label':'Player count'},[2,3,4].map(n=>el('option',{value:n,text:n+' players'}))),board=el('div',{class:'monopoly-wrap'}),players=el('div',{class:'player-list'}),status=el('p',{class:'status','aria-live':'polite'}),actions=el('div',{class:'controls'}),property=el('div',{class:'property-panel'}),event=el('img',{class:'event-image',alt:'Artwork for the most recent board event'}),log=el('div',{class:'log'}),trade=el('details'),feedback=el('p',{class:'hint'});
  const dice=el('div',{class:'estate-dice','aria-label':'Dice'});
  const portraits=new Map();
  const pictures=estateCast[skin];
  const photoByTile=new Map(s.tiles.filter(tile=>tile.type==='property').map((tile,i)=>[tile.id,pictures[i]]));
  const controller=new AbortController();
  scope.cleanup(()=>controller.abort());
  const announce=(message)=>{feedback.textContent=message;};
  function mutate(fn){const ok=fn();if(ok===false)announce('Action unavailable: check cash, ownership, turn phase, and even building across the set.');else announce('');render();}
  function reset(){s=newEstate(Number(count.value),skin);s.players.forEach(p=>p.cash=startingCash);auction=null;selected=0;render();}let resetArmed=false;const resetButton=button('New table',()=>{if(!resetArmed){resetArmed=true;resetButton.textContent='Confirm new table';return;}resetArmed=false;resetButton.textContent='New table';reset();});setup.append(count,resetButton);stage.append(setup,board,status,actions,feedback);side.append(players,property,event,el('h4',{text:'Table log'}),log,trade);
  function auctionStart(){let tile;if(s.phase==='end'&&s.auctionQueue.length){tile=s.auctionQueue.shift();s.pending=tile;}else if(s.phase==='purchase')tile=s.pending;else return;const bidder=s.players.findIndex((p,i)=>!p.out&&i>=s.turn);auction={tile,price:0,leader:null,turn:bidder<0?s.players.findIndex(p=>!p.out):bidder,passed:[]};s.phase='auction';render();}
  function auctionAdvance(){const active=s.players.map((p,i)=>!p.out&&!auction.passed.includes(i)?i:null).filter(i=>i!==null);
    const challengers=active.filter(i=>i!==auction.leader);
    if(!challengers.length){const t=s.tiles[auction.tile];if(auction.leader!==null){t.owner=auction.leader;s.players[auction.leader].cash-=auction.price;record(s,`${s.players[auction.leader].name} wins ${t.name} for $${auction.price}.`,'purchase');}else record(s,'No auction bids. Property stays with the bank.');s.pending=null;s.phase='end';auction=null;render();return;}
    do{auction.turn=(auction.turn+1)%s.players.length;}while(s.players[auction.turn].out||auction.passed.includes(auction.turn)||auction.turn===auction.leader);render();
  }
  const eventPhotos=skin==='hollywood'?allPhotos():[];
  function render(){
    // Auctions stay in memory while open; close/reload restarts the pending purchase.
    store.set(key,s.phase==='auction'?{...s,phase:'purchase'}:s);
    board.replaceChildren();if(skin==='heroes')board.append(el('img',{src:assets.board,alt:'Avengers board centre',class:'monopoly-bg'}));
    board.append(el('div',{class:'monopoly-core'},[el('small',{text:skin==='heroes'?'MCU / DCU':'HOLLYWOOD'}),el('span',{text:skin==='heroes'?'MULTIVERSE':'THE A-LIST'}),el('small',{text:'ESTATE CIRCUIT'}),dice]));
    s.tiles.forEach((tile,i)=>{
      const angle=i/40*Math.PI*2-Math.PI/2;
      const name=photoByTile.get(i);
      const photo=eventPhotos.find(photo=>photo.tiles.includes(i));
      const image=portraits.get(name)||photo?.image;
      const cell=el('button',{
        class:'tile'+(selected===i?' selected':''),
        style:'--tile-color:'+(groupColors[tile.group]||'#cfdfad')+';left:'+(50+43*Math.cos(angle))+'%;top:'+(50+44*Math.sin(angle))+'%',
        title:i+': '+tile.name+(name?' / '+name:''),
        'aria-label':tile.name,
        onClick:()=>{if(!rolling){selected=i;render();}}
      },[
        ...(image?[el('img',{src:image,alt:'',class:'estate-portrait'})]:[]),
        el('span',{class:'estate-tile-label',text:tile.name}),
        el('span',{class:'tokens',text:s.players.map((p,n)=>!p.out&&p.pos===i?String(n+1):'').join(' ')})
      ]);
      board.append(cell);
    });
    players.replaceChildren(...s.players.map((p,i)=>el('div',{class:'player-row'+(i===s.turn?' current':'')},[el('b',{text:`${['●','◆','▲','★'][i]} ${p.name} · $${p.cash}`}),el('div',{text:p.out?'Bankrupt':p.jailed?`Jail · ${p.jail} failed rolls`:`${s.tiles[p.pos].name} · ${s.tiles.filter(t=>t.owner===i).length} deeds`})])));
    status.textContent=s.winner!==null?`${s.players[s.winner].name} wins!`: `${s.players[s.turn].name} · ${s.phase==='roll'?'Roll the dice':s.phase==='purchase'?'Buy or start an auction':s.phase==='debt'?'Raise cash to cover the debt':s.phase==='auction'?'Auction in progress':s.extra?'Doubles: roll again after resolving this turn':'End your turn'}`;
    actions.replaceChildren();if(s.winner===null){
      if(s.phase==='roll'){actions.append(button('Roll dice',roll,true));if(s.players[s.turn].jailed){actions.append(button('Pay $50 bail',()=>mutate(()=>{const p=s.players[s.turn];if(p.cash<50)return false;p.cash-=50;p.jailed=false;p.jail=0;record(s,'Bail paid.');return true;})));if(s.players[s.turn].jailCards.length)actions.append(button('Use jail-free card',()=>mutate(()=>useJailCard(s))));}}
      if(s.phase==='purchase')actions.append(button(`Buy $${s.tiles[s.pending].price}`,()=>mutate(()=>buyEstate(s)),true),button('Auction property',auctionStart));
      if(s.phase==='end'){if(s.auctionQueue.length)actions.append(button(`Auction returned deeds (${s.auctionQueue.length})`,auctionStart,true));else actions.append(button(s.extra?'Roll again':'End turn',()=>mutate(()=>nextEstate(s)),true));}
      if(s.phase==='debt')actions.append(button('Debt covered — continue',()=>mutate(()=>settleDebt(s))),button('Declare bankruptcy',()=>mutate(()=>bankruptEstate(s))));
      if(s.phase==='auction'&&auction){const p=s.players[auction.turn];actions.append(el('p',{text:`${p.name} bids · current $${auction.price}${auction.leader!==null?' by '+s.players[auction.leader].name:''}`}),button('Bid +$10',()=>{if(p.cash<auction.price+10){announce('Not enough cash. Pass instead.');return;}auction.price+=10;auction.leader=auction.turn;auctionAdvance();}),button('Pass',()=>{auction.passed.push(auction.turn);auctionAdvance();}));}
    }
    const t=s.tiles[selected];property.replaceChildren(el('h4',{text:`${selected}. ${t.name}`}),el('p',{class:'rules',text:t.price?`Price $${t.price} · Rent $${rentFor(s,t,s.lastDice||7)} · ${t.owner===null?'Bank-owned':s.players[t.owner].name}${t.mortgaged?' · Mortgaged':''}${t.type==='property'?' · Buildings '+t.houses+' · Build $'+t.buildCost:''}`:t.type==='parking'?'Free parking has no payout.':t.type==='go'?'Collect $200 when passing or landing.':'Follow the landing event.'}));
    if(t.owner===s.turn&&s.winner===null){property.append(button(t.mortgaged?'Redeem mortgage':'Mortgage deed',()=>mutate(()=>mortgageEstate(s,t.id))));if(t.type==='property')property.append(button('Build house / hotel',()=>mutate(()=>buildEstate(s,t.id))),button('Sell building',()=>mutate(()=>buildEstate(s,t.id,true))));}
    const portrait=portraits.get(photoByTile.get(selected));
    if(portrait)property.append(el('img',{class:'event-image',src:portrait,alt:photoByTile.get(selected)}));
    if(skin==='hollywood'){const photo=allPhotos().find(photo=>photo.tiles.includes(selected));if(photo)property.append(photoFigure(photo));}
    if(s.event&&assets[s.event]&&skin==='heroes'){event.src=assets[s.event];event.hidden=false;}else event.hidden=true;
    log.replaceChildren(...s.log.slice(0,12).map(text=>el('div',{text})));renderTrade();
  }
  function roll(){
    if(rolling||s.phase!=='roll')return;
    rolling=true;
    actions.inert=true;
    setup.inert=true;
    side.inert=true;
    const first=random(6)+1,second=random(6)+1;
    const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    const show=(a,b)=>dice.replaceChildren(el('span',{text:faces[a-1]}),el('span',{text:faces[b-1]}));
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const finish=()=>{
      rolling=false;
      actions.inert=false;
      setup.inert=false;
      side.inert=false;
      dice.classList.toggle('rolling',false);
      show(first,second);
      dice.setAttribute('aria-label','Rolled '+first+' and '+second);
      mutate(()=>{const result=rollEstate(s,first,second);selected=s.players[s.turn].pos;return result;});
    };
    if(reduced){finish();return;}
    dice.classList.add('rolling');
    show(random(6)+1,random(6)+1);
    for(let i=1;i<=7;i++)scope.timeout(()=>show(random(6)+1,random(6)+1),i*90);
    scope.timeout(finish,720);
  }
  function renderTrade(){trade.replaceChildren(el('summary',{text:'Offer a trade'}));if(s.winner!==null||!['roll','end'].includes(s.phase)){trade.append(el('p',{class:'hint',text:'Trading opens before a roll or after landing is resolved.'}));return;}
    const to=el('select',{'aria-label':'Trade partner'},s.players.flatMap((p,i)=>i!==s.turn&&!p.out?[el('option',{value:i,text:p.name})]:[]));const give=el('select',{'aria-label':'Property you give'}),take=el('select',{'aria-label':'Property you receive'}),cash=el('input',{type:'number',value:'0',step:'1','aria-label':'Cash offered; negative requests cash'});
    function options(){give.replaceChildren(el('option',{value:'',text:'Give: no deed'}),...s.tiles.filter(t=>t.owner===s.turn&&!t.mortgaged&&!t.houses).map(t=>el('option',{value:t.id,text:t.name})));take.replaceChildren(el('option',{value:'',text:'Receive: no deed'}),...s.tiles.filter(t=>t.owner===Number(to.value)&&!t.mortgaged&&!t.houses).map(t=>el('option',{value:t.id,text:t.name})));}to.addEventListener('change',options);options();
    const proposal=el('div');trade.append(el('p',{class:'hint',text:'Positive cash is paid by you. Negative cash is requested. Built colour sets and mortgaged deeds cannot be traded in this ruleset.'}),to,give,take,cash,button('Review offer',()=>{const offer={to:Number(to.value),give:give.value===''?null:Number(give.value),take:take.value===''?null:Number(take.value),cash:Number(cash.value)};proposal.replaceChildren(el('p',{class:'rules',text:`${s.players[offer.to].name}: receive ${offer.give===null?'no deed':s.tiles[offer.give].name}, give ${offer.take===null?'no deed':s.tiles[offer.take].name}. Cash to you: $${offer.cash}.`}),button('Partner accepts',()=>mutate(()=>tradeEstate(s,offer.to,offer.give,offer.take,offer.cash)),true),button('Reject offer',()=>proposal.replaceChildren()));}),proposal);
  }
  const disposeCast=castPicker(side);
  if(skin==='hollywood'&&globalThis.__DEX_OWNER__)photoLibrary(root,{getTiles:()=>s.tiles,onChange:()=>render()});
  workbench(root,{title:'Inspect your board economy',source:'src/games/estate.js (view) -> src/games/estate-rules.js (money, ownership and turns)',getState:()=>structuredClone(s),parameters:[{label:'Starting cash for the next new table',min:200,max:5000,step:100,get:()=>1500,set:n=>{startingCash=n;}}]});
  let startingCash=1500;
  render();
  if(typeof window.location!=='undefined'){
    const queue=[...new Set(pictures)];
    let cursor=0;
    const loadPortraits=async()=>{
      while(cursor<queue.length&&!controller.signal.aborted){
        const name=queue[cursor++];
        try{
          const response=await fetch('/api/portraits?name='+encodeURIComponent(name),{signal:controller.signal});
          if(response.ok)portraits.set(name,(await response.json()).image);
        }catch{/* Sourced art and labels remain usable. */}
      }
    };
    Promise.all(Array.from({length:4},loadPortraits)).then(()=>{if(!controller.signal.aborted&&!rolling)render();});
  }
  return()=>{scope.dispose();disposeCast();};
}
