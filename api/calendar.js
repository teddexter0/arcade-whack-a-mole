export default function handler(req,res){
 const now=new Date(),year=req.query.year===undefined?now.getUTCFullYear():Number(req.query.year),month=req.query.month===undefined?now.getUTCMonth()+1:Number(req.query.month);
 if(!Number.isInteger(year)||year<1900||year>2100||!Number.isInteger(month)||month<1||month>12)return res.status(400).json({error:'Year must be 1900-2100 and month must be 1-12.'});
 const date=new Date(Date.UTC(year,month-1,1)),count=new Date(Date.UTC(year,month,0)).getUTCDate(),days=Array.from({length:count},(_,i)=>({day:i+1,date:`${year}-${String(month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,weekday:(new Date(Date.UTC(year,month-1,i+1)).getUTCDay()+6)%7+1}));
 res.setHeader('Cache-Control','no-store');return res.status(200).json({year,month,label:date.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}),offset:(date.getUTCDay()+6)%7,days});
}
