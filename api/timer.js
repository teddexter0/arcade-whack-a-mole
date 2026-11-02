export default function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST with JSON.'});}
 let body=req.body;try{if(typeof body==='string')body=JSON.parse(body);}catch{return res.status(400).json({error:'Invalid JSON.'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({error:'Expected a JSON object.'});
 const focus=body.focus??25,rest=body.rest??5;if(!Number.isInteger(focus)||!Number.isInteger(rest)||focus<1||focus>120||rest<1||rest>60)return res.status(400).json({error:'Focus: 1-120 integer minutes. Break: 1-60 integer minutes.'});
 res.setHeader('Cache-Control','no-store');return res.status(200).json({focusSeconds:focus*60,restSeconds:rest*60,generatedAt:Math.floor(Date.now()/1000)});
}
