// A self-contained local board-game economy. Both skins use this same model.
const marvel=['Gotham Alley','Hell’s Kitchen','Daily Planet','Stark Lab','Wayne Tower','Wakanda Market','Asgard Gate','Atlantis Pier','Kamar-Taj','Xavier School','Avengers Tower','Themyscira','Baxter Building','Sanctum','Watchtower','Knowhere','S.H.I.E.L.D. HQ','Batcave','Wakanda Palace','Hall of Justice','Asgard Palace','Stark Industries'];
const hollywood=['Indie Premiere','Open Mic','Sundance','Cannes','Venice','Streaming Hit','Red Carpet','Met Gala','Fashion Week','Grammy Night','Platinum Record','World Tour','Emmy Night','Golden Globe','Oscar Night','Super Bowl','Ballon d’Or','Global Icon','Studio Empire','Brand Portfolio','Forbes Cover','Billionaire Row'];
const propertyIndices=[1,3,6,8,9,11,13,14,16,18,19,21,23,24,26,27,29,31,32,34,37,39];
const prices=[60,60,100,100,120,140,140,160,180,180,200,220,220,240,260,260,280,300,300,320,350,400];
const rents=[[2,10,30,90,160,250],[4,20,60,180,320,450],[6,30,90,270,400,550],[6,30,90,270,400,550],[8,40,100,300,450,600],[10,50,150,450,625,750],[10,50,150,450,625,750],[12,60,180,500,700,900],[14,70,200,550,750,950],[14,70,200,550,750,950],[16,80,220,600,800,1000],[18,90,250,700,875,1050],[18,90,250,700,875,1050],[20,100,300,900,1100,1150],[22,110,330,800,975,1150],[22,110,330,800,975,1150],[24,120,360,850,1025,1200],[26,130,390,900,1100,1275],[26,130,390,900,1100,1275],[28,150,450,1000,1200,1400],[35,175,500,1100,1300,1500],[50,200,600,1400,1700,2000]];
const groups=[0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7];
export const groupColors=['#a47652','#9ccde3','#be78ae','#f09b42','#e97d6a','#ecd66a','#83ae7f','#7799d3'];
export function makeTiles(skin='heroes'){
  const names=skin==='hollywood'?hollywood:marvel;
  return Array.from({length:40},(_,i)=>{const p=propertyIndices.indexOf(i);if(p>=0)return{id:i,name:names[p],type:'property',price:prices[p],rents:rents[p],group:groups[p],buildCost:50*(1+Math.floor(groups[p]/2)),owner:null,houses:0,mortgaged:false};
    if([5,15,25,35].includes(i))return{id:i,name:(skin==='hollywood'?['Studio Lot','Record Label','Sports Agency','Fashion House']:['Bifrost','Batmobile','Quinjet','Boom Tube'])[[5,15,25,35].indexOf(i)],type:'station',price:200,owner:null,houses:0,mortgaged:false};
    if([12,28].includes(i))return{id:i,name:i===12?'Power Grid':'Water Works',type:'utility',price:150,owner:null,houses:0,mortgaged:false};
    const special={0:['GO','go'],2:['Headlines','chest'],4:['Income tax','tax'],7:['Chance','chance'],10:['Jail / Visiting','jail'],17:['Headlines','chest'],20:['Free parking','parking'],22:['Chance','chance'],30:['Go to jail','goJail'],33:['Headlines','chest'],36:['Chance','chance'],38:['Luxury tax','tax']};return{id:i,name:special[i][0],type:special[i][1]};});
}
export function newEstate(count=2,skin='heroes') { return{version:1,skin,tiles:makeTiles(skin),players:Array.from({length:count},(_,i)=>({name:`Player ${i+1}`,cash:1500,pos:0,jail:0,jailed:false,out:false,jailCards:[]})),turn:0,phase:'roll',doubles:0,lastDice:0,extra:false,pending:null,debtTo:null,auctionQueue:[],decks:{chance:shuffledDeck(),chest:shuffledDeck()},log:['New table. Each player starts with $1,500.'],event:null,winner:null}; }
function shuffledDeck(){const result=headlines.map((_,i)=>i);for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function prepareEstate(s){s.auctionQueue??=[];s.decks??={chance:shuffledDeck(),chest:shuffledDeck()};for(const p of s.players)p.jailCards??=[];return s;}
export function ownsGroup(s,t){return t.type==='property'&&s.tiles.filter(x=>x.type==='property'&&x.group===t.group).every(x=>x.owner===t.owner);}
export function rentFor(s,t,dice=7){if(t.owner===null||t.mortgaged)return 0;if(t.type==='station')return 25*2**(s.tiles.filter(x=>x.type==='station'&&x.owner===t.owner).length-1);if(t.type==='utility')return dice*(s.tiles.filter(x=>x.type==='utility'&&x.owner===t.owner).length===2?10:4);return t.rents[t.houses]*(t.houses===0&&ownsGroup(s,t)?2:1);}
export function record(s,message,event=null){s.log.unshift(message);s.log=s.log.slice(0,40);if(event)s.event=event;}
function transfer(s,amount,to=null){const p=s.players[s.turn];p.cash-=amount;if(to!==null)s.players[to].cash+=amount;if(p.cash<0){s.debtTo=to;s.phase='debt';}record(s,`${p.name} pays $${amount}${to===null?' to the bank':' to '+s.players[to].name}.`);}
function jail(s){const p=s.players[s.turn];p.pos=10;p.jailed=true;p.jail=0;s.extra=false;s.doubles=0;s.phase='end';record(s,`${p.name} goes to jail. No GO salary.`,'jail');}
function advance(s,distance){const p=s.players[s.turn];const total=p.pos+distance;if(total>=40){p.cash+=200;record(s,`${p.name} passes GO: +$200.`,'go');}p.pos=((total%40)+40)%40;}
export const headlines=[
  {text:'Award-season success. Collect $150.',cash:150},
  {text:'A major brand renews your contract. Collect $200.',cash:200},
  {text:'A fictional tabloid rumour requires crisis PR. Pay $100.',cash:-100},
  {text:'A fictional co-star feud delays production. Pay $80.',cash:-80},
  {text:'Old posts cost your fictional studio a campaign. Pay $150.',cash:-150},
  {text:'Met Gala invitation mix-up. Pay $50 for new travel.',cash:-50},
  {text:'Record-label dispute settled. Collect $100.',cash:100},
  {text:'Your fictional character receives a court order. Go to jail.',jail:true},
  {text:'Pay every other player $50 for contract settlements.',others:50},
  {text:'Return to GO and collect $200.',go:true},
  {text:'Vacation booking refund. Collect $50.',cash:50},
  {text:'A fictional divorce settlement. Pay $200.',cash:-200},
  {text:'Your lawyer secures release. Keep this Get Out of Jail Free card.',jailFree:true},
  {text:'Property maintenance: pay $25 per house and $100 per hotel.',repairs:true},
  {text:'A successful premiere. Collect $75.',cash:75},
  {text:'Studio accounting refund. Collect $40.',cash:40}
];
export function land(s,cardIndex){prepareEstate(s);const p=s.players[s.turn],t=s.tiles[p.pos];s.phase='end';if(t.price){if(t.owner===null){s.pending=t.id;s.phase='purchase';record(s,`${p.name} lands on ${t.name}. Buy for $${t.price} or auction.`);}else if(t.owner!==s.turn){const rent=rentFor(s,t,s.lastDice);if(rent)transfer(s,rent,t.owner);record(s,`${t.name}: rent $${rent}.`);}return;}
  if(t.type==='goJail'){jail(s);return;}if(t.type==='tax'){transfer(s,t.id===4?200:100);record(s,`${t.name} paid.`,'tax');}
  if(['chance','chest'].includes(t.type)){
    const deckType=t.type==='chance'?'chance':'chest',deck=s.decks[deckType];
    if(!deck.length)deck.push(...shuffledDeck().filter(i=>!headlines[i].jailFree||!s.players.some(p=>p.jailCards.includes(deckType))));
    const index=cardIndex===undefined?deck.shift():cardIndex%headlines.length,card=headlines[index];
    if(cardIndex===undefined&&!card.jailFree)deck.push(index);
    record(s,card.text);
    if(card.jailFree)p.jailCards.push(deckType);
    else if(card.repairs){const owned=s.tiles.filter(t=>t.owner===s.turn),amount=owned.reduce((sum,t)=>sum+(t.houses===5?100:(t.houses||0)*25),0);if(amount)transfer(s,amount);}
    else if(card.jail)jail(s);
    else if(card.go){p.pos=0;p.cash+=200;record(s,'Advance to GO: +$200.','go');}
    else if(card.others){const others=s.players.map((other,i)=>({other,i})).filter(({other,i})=>i!==s.turn&&!other.out),amount=card.others*others.length;const available=Math.max(0,p.cash);p.cash-=amount;others.forEach(({other})=>other.cash+=card.others);if(p.cash<0){s.phase='debt';s.debtTo=null;s.multiDebt={recipients:others.map(({i})=>i),each:card.others,unpaid:amount-available};}record(s,'Settlement payments completed.','payPlayers');}
    else if(card.cash<0)transfer(s,-card.cash);else p.cash+=card.cash;
  }
}
export function rollEstate(s,d1,d2,card){if(s.phase!=='roll'||s.winner!==null)return false;if(![d1,d2].every(n=>Number.isInteger(n)&&n>=1&&n<=6))return false;const p=s.players[s.turn],double=d1===d2;s.lastDice=d1+d2;s.extra=double;record(s,`${p.name} rolls ${d1} + ${d2}.`);
  if(p.jailed){p.jail++;s.extra=false;if(double){p.jailed=false;p.jail=0;}else if(p.jail<3){s.phase='end';return true;}else{p.jailed=false;p.jail=0;transfer(s,50);if(s.phase==='debt'){s.pending={move:s.lastDice,card};return true;}}}
  else{s.doubles=double?s.doubles+1:0;if(s.doubles===3){jail(s);return true;}}
  advance(s,s.lastDice);land(s,card);return true;
}
export function buyEstate(s){if(s.phase!=='purchase')return false;const t=s.tiles[s.pending],p=s.players[s.turn];if(p.cash<t.price)return false;p.cash-=t.price;t.owner=s.turn;s.pending=null;s.phase='end';record(s,`${p.name} buys ${t.name}.`,'purchase');return true;}
export function nextEstate(s){if(s.phase!=='end'||s.winner!==null||s.auctionQueue?.length)return false;if(s.extra&&!s.players[s.turn].out){s.phase='roll';s.extra=false;return true;}do{s.turn=(s.turn+1)%s.players.length;}while(s.players[s.turn].out);s.doubles=0;s.phase='roll';s.extra=false;s.pending=null;return true;}
export function useJailCard(s){prepareEstate(s);const p=s.players[s.turn];if(s.phase!=='roll'||!p.jailed||!p.jailCards.length)return false;const deck=p.jailCards.pop();s.decks[deck].push(headlines.findIndex(card=>card.jailFree));p.jailed=false;p.jail=0;record(s,`${p.name} uses a Get Out of Jail Free card.`);return true;}
export function buildEstate(s,id,sell=false){const t=s.tiles[id],p=s.players[s.turn];if(!t||t.type!=='property'||t.owner!==s.turn||s.winner!==null||s.phase==='auction')return false;const set=s.tiles.filter(x=>x.group===t.group&&x.type==='property');
  if(sell){if(!t.houses||set.some(x=>x.houses>t.houses))return false;if(t.houses===5&&32-s.tiles.reduce((a,x)=>a+(x.houses<5?(x.houses||0):0),0)<4)return false;t.houses--;p.cash+=t.buildCost/2;record(s,`Sold a building on ${t.name}.`);return true;}
  if(!ownsGroup(s,t)||set.some(x=>x.mortgaged)||t.houses===5||set.some(x=>x.houses<t.houses)||p.cash<t.buildCost)return false;
  const houses=s.tiles.reduce((a,x)=>a+(x.houses<5?(x.houses||0):0),0),hotels=s.tiles.filter(x=>x.houses===5).length;if(t.houses<4&&houses>=32||t.houses===4&&hotels>=12)return false;
  p.cash-=t.buildCost;t.houses++;record(s,`Built ${t.houses===5?'a hotel':'a house'} on ${t.name}.`,t.houses===5?'hotel':null);return true;
}
export function mortgageEstate(s,id){const t=s.tiles[id],p=s.players[s.turn];if(!t?.price||t.owner!==s.turn||s.winner!==null||s.phase==='auction')return false;
  if(t.type==='property'&&s.tiles.some(x=>x.type==='property'&&x.group===t.group&&x.houses))return false;
  if(t.mortgaged){const cost=Math.ceil(t.price/2*1.1);if(p.cash<cost)return false;p.cash-=cost;t.mortgaged=false;record(s,`Redeemed ${t.name} for $${cost}.`);}else{p.cash+=t.price/2;t.mortgaged=true;record(s,`Mortgaged ${t.name}.`,'tax');}return true;
}
export function settleDebt(s){if(s.phase!=='debt'||s.players[s.turn].cash<0)return false;s.phase='end';s.debtTo=null;s.multiDebt=null;if(s.pending&&typeof s.pending==='object'){const pending=s.pending;s.pending=null;advance(s,pending.move);land(s,pending.card);}return true;}
export function bankruptEstate(s){if(s.phase!=='debt')return false;const p=s.players[s.turn],creditor=s.debtTo;p.out=true; // Creditor already received the booked payment; reverse its unpaid part.
  prepareEstate(s);
  if(creditor!==null)s.players[creditor].cash+=p.cash;
  else if(s.multiDebt){const recipients=s.multiDebt.recipients;for(const id of recipients)s.players[id].cash+=p.cash/recipients.length;s.multiDebt=null;}
  p.cash=0;s.tiles.forEach(t=>{if(t.owner===s.turn){t.owner=creditor;t.houses=0;if(creditor===null){t.mortgaged=false;s.auctionQueue.push(t.id);}}});
  if(creditor!==null)s.players[creditor].jailCards.push(...p.jailCards);else for(const deck of p.jailCards)s.decks[deck].push(headlines.findIndex(card=>card.jailFree));p.jailCards=[];
  record(s,`${p.name} is bankrupt.`);s.extra=false;s.phase='end';s.pending=null;s.debtTo=null;const alive=s.players.map((v,i)=>v.out?null:i).filter(v=>v!==null);if(alive.length===1){s.winner=alive[0];s.auctionQueue=[];record(s,`${s.players[s.winner].name} wins the table.`);}return true;
}
export function tradeEstate(s,to,give,take,cash){
  if(!['roll','end'].includes(s.phase)||s.winner!==null||to===s.turn||!s.players[to]||s.players[to].out||!Number.isInteger(cash))return false;
  const p=s.players[s.turn],q=s.players[to];if(p.cash<Math.max(0,cash)||q.cash<Math.max(0,-cash)||give===take&&give!==null)return false;
  for(const[id,owner]of[[give,s.turn],[take,to]])if(id!==null){const t=s.tiles[id];if(!t?.price||t.owner!==owner||t.mortgaged||t.houses||t.type==='property'&&s.tiles.some(x=>x.type==='property'&&x.group===t.group&&x.houses))return false;}
  if(give!==null)s.tiles[give].owner=to;if(take!==null)s.tiles[take].owner=s.turn;p.cash-=cash;q.cash+=cash;record(s,`${p.name} and ${q.name} accept a trade.`,'deal');return true;
}
