import {el,button,$,store,setGamePaused,gamePaused} from './core.js';
import {games,artwork,lessonFor} from './catalog.js';
import {assets,missingArt} from './assets.js';
import {favouriteNames} from './data/favourites.js';
import {eventPhotos} from './data/photos.js';
import site from '../site-config.js';
const OWNER=globalThis.__DEX_OWNER__===true;
const app=$('#app'),dialog=$('#game-dialog');let cleanup=()=>{},viewCleanup=()=>{},selectedGame=null,generation=0;
function pause(paused){
 setGamePaused(paused);
 const content=$("#game-content");content.inert=paused;
 for(const animation of content.getAnimations({subtree:true})){if(paused)animation.pause();else animation.play();}
 $("#pause-screen").hidden=!paused;
 $("#game-pause").textContent=paused?"Resume":"Pause";
 $("#game-pause").setAttribute("aria-pressed",String(paused));
 if(paused)$("#resume-game").focus();
}
$("#game-pause").onclick=()=>pause(!gamePaused());
$("#resume-game").onclick=()=>{pause(false);$("#game-pause").focus();};
function closeGame(){pause(false);document.body.classList.remove("controls-open");generation++;cleanup();cleanup=()=>{};selectedGame=null;if(dialog.open)dialog.close();}
$('#game-settings')?.addEventListener('click',()=>document.body.classList.toggle('controls-open'));
$('#game-fullscreen')?.addEventListener('click',()=>{if(!document.fullscreenElement)dialog.requestFullscreen?.();else document.exitFullscreen?.();});
$('#close-game').addEventListener('click',closeGame);dialog.addEventListener('cancel',()=>closeGame());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGame();}});
$('#game-learn').hidden=!OWNER;
document.querySelectorAll('[data-owner]').forEach(node=>node.hidden=!OWNER);
$('#game-learn').textContent='Build mode';
$('#game-learn').addEventListener('click',()=>{const bench=$('#game-content .build-workbench');if(bench){bench.open=!bench.open;if(bench.open)bench.scrollIntoView({block:'start',behavior:'smooth'});}else{const id=lessonFor[selectedGame]||'collision';closeGame();location.hash='learn/'+id;}});
async function openGame(game){closeGame();const token=++generation;selectedGame=game.id;$('#game-title').textContent=game.name;$('#game-category').textContent=game.category+' / '+game.tag;const content=$('#game-content');content.replaceChildren(el('p',{text:'Setting up your game…'}));content.dataset.game=game.id;dialog.showModal();
 try{let mount;
  if(['merge','sudoku','pop','unblock'].includes(game.id)){const mod=await import('./games/puzzles.js');mount=mod[game.id];}
  else if(['rps','mole','hop'].includes(game.id)){const mod=await import('./games/quick.js');mount=mod[game.id];}
  else if(['estate','hollywood'].includes(game.id)){const mod=await import('./games/estate.js');mount=root=>mod.estate(root,game.id==='estate'?'heroes':'hollywood');}
  else if(['jigsaw','stickman'].includes(game.id)){const mod=await import('./games/'+game.id+'.js');mount=mod[game.id];}
  else{const mod=await import('./games/arcade.js');mount={tetris:mod.tetris,pinball:mod.pinball,whale:root=>mod.flight(root,true),flappy:root=>mod.flight(root),pac:root=>mod.snake(root,true),snake:root=>mod.snake(root)}[game.id];}
  if(token!==generation)return;content.replaceChildren();cleanup=mount(content)||(()=>{});content.querySelector('canvas')?.focus();store.set('lastGame',game.id);
 }catch(error){if(token!==generation)return;content.replaceChildren(el('p',{class:'notice',text:'Could not start the game: '+error.message}));console.error(error);}
}
function arcade(){
 app.append(el('section',{class:'hero'},[el('div',{},[el('span',{class:'eyebrow',text:'YOUR BROWSER. YOUR PLAYGROUND.'}),el('h1',{},['Small games.',el('br'),'Big ',el('em',{text:'replay.'})]),el('p',{text:'Old-school favourites, a few wild remixes, and worlds worth getting lost in. Pick something. Get a little lost.'}),el('div',{class:'hero-links'},[el('a',{href:'#collection',class:'pill',text:'Find your next game ↓'}),el('a',{href:OWNER?'#build':'#collection',text:OWNER?'Build as you play':'Explore the collection'})])]),el('div',{class:'hero-art','aria-hidden':'true'},[el('div',{class:'orbit'}),el('div',{class:'orbit two'}),el('div',{class:'hero-disc'},[el('div',{class:'controller'})]),el('span',{class:'float-tile one',text:'2048'}),el('span',{class:'float-tile two',text:'↗'}),el('span',{class:'tiny-star',text:'✳'}),el('span',{class:'hero-note',text:'insert curiosity, not coins.'})])]));
 const shelf=el('section',{id:'collection'}),head=el('div',{class:'shelf-head'},[el('h2',{text:'The good stuff.'}),el('small',{text:games.length+' games / no sign-up / all yours'})]),filters=el('div',{class:'filters'}),grid=el('div',{class:'game-grid'}),search=el('input',{class:'search',type:'search',placeholder:'Find a game…','aria-label':'Search games'});let active='All games';const filterButtons=[];
 for(const category of['All games','Arcade','Puzzles','Quick play','Tabletop']){const b=button(category,()=>{active=category;render();});filterButtons.push([category,b]);filters.append(b);}filters.append(search);search.addEventListener('input',render);
 function render(){
  filterButtons.forEach(([cat,b])=>{b.classList.toggle('active',cat===active);b.setAttribute('aria-pressed',cat===active);});
  const visible=games.filter(game=>(!site.game||game.id===site.game)&&(active==='All games'||game.category===active)&&(game.name+' '+game.description).toLowerCase().includes(search.value.toLowerCase()));
  grid.replaceChildren(...visible.map(game=>{
   const art=el('div',{class:'card-art',style:'--card-color:'+game.color});art.innerHTML=artwork(game.art);
   art.append(el('span',{class:'card-num',text:String(games.indexOf(game)+1).padStart(2,'0')}),el('span',{class:'card-arrow',text:'↗'}));
   return el('button',{class:'game-card','aria-label':'Play '+game.name,onClick:()=>openGame(game)},[
    art,el('div',{class:'card-info'},[
     el('div',{},[el('h3',{text:game.name}),el('p',{text:game.description})]),
     el('span',{class:'card-tag',text:game.tag})
    ])
   ]);
  }));
  if(!visible.length)grid.append(el('p',{class:'empty',text:'Nothing here yet. Try a different name or category.'}));
 }
 shelf.append(head,filters,grid);app.append(shelf);if(OWNER)app.append(el('section',{class:'lab-banner'},[el('h3',{text:'Your private workshop'}),el('a',{href:'#build',text:'Open live build mode'})]));render();
}
function credits(){
 const page=el('section',{class:'section-page'});app.append(page);page.append(el('span',{class:'eyebrow',text:'SOURCE CHECK / ASSET AUDIT'}),el('h1',{text:'The receipts.'}),el('p',{text:'Your supplied filenames are treated as instructions. These nine files are preserved in place. Their original creators and licenses were not supplied; provenance is recorded as user-supplied rather than inventing a Pinterest credit.'}));
 const table=el('table',{class:'asset-table'},[el('thead',{},[el('tr',{},['Image','File / event','Source status'].map(text=>el('th',{text})))]),el('tbody',{},Object.entries(assets).map(([event,path])=>el('tr',{},[el('td',{},[el('img',{src:path,alt:event,loading:'lazy'})]),el('td',{},[el('b',{text:event}),el('br'),el('span',{text:path.split('/').pop()})]),el('td',{text:'User-supplied · original source unknown'})])))]);page.append(table,el('h2',{text:'Artwork still needed'}),el('p',{text:missingArt.join(' · '),class:'rules'}),el('h2',{text:'Implementation notes'}));
 for(const [title,body]of[
 ['Sky Whale','Fan-built browser game with doughnut flight, clouds, banked coins, an upgrade shop, scuba recovery, Sugar Rush, timed combos, three altitude worlds and optional sound. It uses original local code and canvas artwork, not Nickelodeon’s original executable or extracted assets.'],
 ['Kenyan hop–step–and–jump','The opening round establishes the longest jumper as extender. Later final landings must be beyond the final stick; landing on it or short fails. A longer successful jump moves the stick. First/second-stick penalties default to warnings and can be set to deductions or failed attempts.'],
 ['Talking Tom references','The clarified numbered-tile game uses equal-number merges, new tiles after successful moves, and loss when no legal moves remain. Current art is original; it does not claim to be Talking Tom’s extracted executable.'],
 ['Monopoly ruleset','Two local board skins share one economy. It supports buying, rent, cash auctions, even building, limited house/hotel supply, trading unmortgaged undeveloped deeds, mortgage redemption, jail, doubles, debt and bankruptcy. Cards use finite shuffled decks, including held jail-free cards. Bank-owned bankruptcy deeds enter an auction queue. Differences from full classic rules: no mortgage-transfer trading/interest or building-scarcity auctions. Only the current player manages their deeds. Not a full official implementation.'],
 ['Hollywood people and events',`All ${favouriteNames.length} IMDb favourites were read in the browser after the text-fetch route failed. ${eventPhotos.length} event-photo references are wired to relevant tiles with source credits. Property tiles use sourced event images or TMDB cast portraits. Award and career tiles are thematic; scandal cards are fictional and are not allegations about real people.`],
 ['Branding','The orange rounded wordmark and monochrome buttons are original treatments inspired by your visual direction. Exact Nickelodeon and Cartoon Network typefaces were not supplied. Display typography uses Baloo 2 and Outfit.'],
 ['Saves and accounts','Game saves, best scores, lesson progress, calendar notes and completed focus counts stay in this browser. No accounts, analytics, AI services, paid APIs, or online multiplayer. Local storage can be edited or cleared.']])page.append(el('h3',{text:title}),el('p',{text:body,class:'rules'}));
 page.append(el('h2',{text:'References checked'}),el('p',{class:'rules'},[el('a',{href:'https://apps.apple.com/mu/app/sky-whale-a-game-shakers-app/id969247886',target:'_blank',rel:'noopener',text:'Official Sky Whale listing ↗'}),' · ',el('a',{href:'https://www.hasbro.com/common/instruct/Monopoly.pdf',target:'_blank',rel:'noopener',text:'Hasbro Monopoly rules ↗'}),' · ',el('a',{href:'https://www.hsx.com/about/',target:'_blank',rel:'noopener',text:'Hollywood Stock Exchange precedent ↗'}),' · ',el('a',{href:'https://boardgamegeek.com/boardgame/56787/monopoly-hollywood-edition',target:'_blank',rel:'noopener',text:'Monopoly: Hollywood Edition (1997) ↗'})]));
}
async function route(){closeGame();viewCleanup();viewCleanup=()=>{};app.replaceChildren();const hash=location.hash.slice(1);document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(hash.startsWith('learn')||hash==='build'?'learn':hash==='tools'?'tools':'play')));
 if(hash.startsWith('learn')&&OWNER){const{learning}=await import('./learn.js');if(location.hash.slice(1)!==hash)return;viewCleanup=learning(app,hash.split('/')[1]);}
 else if(hash==='tools'){const{tools}=await import('./tools.js');if(location.hash.slice(1)!==hash)return;viewCleanup=tools(app);}
 else if(hash==='credits')credits();else arcade();
 if(hash==='build'&&OWNER){
  const game=games.find(game=>game.id===store.get('lastGame','merge'))||games.find(game=>game.id==='merge');
  await openGame(game);
  const bench=$('#game-content .build-workbench');if(bench)bench.open=true;
 }
 if(site.game&&!hash){const game=games.find(g=>g.id===site.game);if(game)await openGame(game);}
 if(hash==='collection')document.getElementById('collection')?.scrollIntoView();else window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);route();
