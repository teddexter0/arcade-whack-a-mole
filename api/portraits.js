import {favouriteNames} from '../src/data/favourites.js';
const cache=new Map();
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Use GET.'});
 const name=typeof req.query.name==='string'?req.query.name:'';
 if(!favouriteNames.includes(name))return res.status(400).json({error:'Choose a person from the IMDb roster.'});
 const token=process.env.TMDB_API_KEY;
 if(!token)return res.status(503).json({error:'Portrait service is not configured.'});
 try{
  let person=cache.get(name);if(!person){
   const url=new URL('https://api.themoviedb.org/3/search/person');url.searchParams.set('query',name);url.searchParams.set('include_adult','false');url.searchParams.set('api_key',token);
   const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('TMDB unavailable');
   const data=await response.json(),matches=(data.results||[]).filter(p=>p.name.toLowerCase()===name.toLowerCase()&&p.profile_path);
   const result=matches.sort((a,b)=>(b.popularity||0)-(a.popularity||0))[0];
   if(!result)return res.status(404).json({error:'No exact-name portrait found. Use a sourced event photo.'});
   person={name:result.name,id:result.id,image:'https://image.tmdb.org/t/p/w500'+result.profile_path,source:'https://www.themoviedb.org/person/'+result.id,credit:'TMDB — image rights belong to their respective owners.',kind:'Profile portrait; event and attire not identified'};cache.set(name,person);
  }
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');return res.status(200).json(person);
 }catch{return res.status(502).json({error:'Portrait lookup failed. Please try again.'});}
}
