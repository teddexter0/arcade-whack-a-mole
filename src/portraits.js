import {el,button} from './core.js';
import {favouriteNames} from './data/favourites.js';
import {photoFigure} from './photo-library.js';
export function castPicker(parent){
 let alive=true;const select=el('select',{'aria-label':'Hollywood cast'},favouriteNames.map(name=>el('option',{value:name,text:name}))),display=el('div'),status=el('p',{class:'status','aria-live':'polite'});
 const load=button('Show TMDB portrait',async()=>{load.disabled=true;status.textContent='Finding exact-name portrait…';try{const response=await fetch('/api/portraits?name='+encodeURIComponent(select.value)),person=await response.json();if(!alive)return;if(!response.ok)throw new Error(person.error||'Portrait unavailable.');display.replaceChildren(photoFigure({...person,person:person.name,event:person.kind}));status.textContent='';}catch(error){if(alive)status.textContent=error.message;}finally{if(alive)load.disabled=false;}});
 parent.append(el('h3',{text:'Hollywood cast'}),select,load,status,display,el('p',{class:'hint',text:'This product uses the TMDB API but is not endorsed or certified by TMDB.'}),el('a',{href:'https://www.themoviedb.org/',target:'_blank',rel:'noopener noreferrer','aria-label':'The Movie Database'},[el('img',{src:'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8c2e106c72a9a610b6f7d92fa799839b61c1665b49349cde8cc297fbe3dc0d66.svg',alt:'TMDB',width:'90'})]));return()=>{alive=false;};
}
