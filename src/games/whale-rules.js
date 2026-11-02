export const whaleUpgrades = [
  {id:'bag',name:'Doughnut satchel',cost:30,max:3,description:'+4 starting doughnuts per level.'},
  {id:'bounce',name:'Cloud springs',cost:50,max:3,description:'Stronger manual and cloud bounces.'},
  {id:'scuba',name:'Scuba kit',cost:100,max:1,description:'One underwater recovery per run.'},
  {id:'magnet',name:'Treasure magnet',cost:75,max:2,description:'Collect nearby coins and doughnuts.'},
  {id:'rainbow',name:'Rainbow reserve',cost:150,max:1,description:'Begin each run with a short Sugar Rush.'}
];
export function whaleProfile(raw){
  const result={coins:0,best:0,upgrades:{}};
  if(raw&&typeof raw==='object'){
    if(Number.isSafeInteger(raw.coins)&&raw.coins>=0)result.coins=raw.coins;
    if(Number.isFinite(raw.best)&&raw.best>=0)result.best=raw.best;
    for(const item of whaleUpgrades)result.upgrades[item.id]=Math.max(0,Math.min(item.max,Math.floor(Number(raw.upgrades?.[item.id])||0)));
  }
  return result;
}
export function buyWhaleUpgrade(profile,id){
  const item=whaleUpgrades.find(item=>item.id===id);if(!item)return false;
  const level=profile.upgrades[id]||0,cost=item.cost*(level+1);
  if(level>=item.max||profile.coins<cost)return false;
  profile.coins-=cost;profile.upgrades[id]=level+1;return true;
}
export function whaleWorld(altitude){return altitude>=1800?'Groovetopia':altitude>=650?'Outer space':'Open sky';}
export function newWhaleRun(profile){return{height:180,velocity:0,distance:0,doughnuts:10+4*(profile.upgrades.bag||0),coins:0,score:0,peak:180,rush:profile.upgrades.rainbow?3:0,scuba:!!profile.upgrades.scuba,recovery:0,running:false,over:false,banked:false,combo:[],comboTime:0,message:'Tap to begin. Doughnuts power your bounce.',world:'Open sky'};}
export function collectWhaleItem(run,kind){
  if(run.over)return;
  if(kind==='doughnut'){run.doughnuts+=3;run.score+=20;return;}
  if(kind==='coin'){run.coins+=run.combo.includes('double')?2:1;run.score+=10;return;}
  if(kind==='rainbow'){run.rush=7;run.velocity=Math.max(run.velocity,360);run.message='SUGAR RUSH! Free bounces and rainbow flight.';return;}
  if(kind==='scuba'){run.scuba=true;run.message='Scuba collected. One underwater recovery available.';return;}
  if(['monkey','toilet','double'].includes(kind)){
    if(run.comboTime<=0)run.combo=[];
    if(!run.combo.includes(kind))run.combo.push(kind);
    run.comboTime=10;run.velocity=Math.max(run.velocity,270+run.combo.length*65);run.score+=run.combo.length*75;
    run.message=run.combo.length===3?'DOUBLE MONEY MONKEY TOILET!':run.combo.map(item=>item.toUpperCase()).join(' + ')+' COMBO';
  }
}
export function stepWhale(run,dt,gravity=350){
  if(!run.running||run.over)return;
  run.rush=Math.max(0,run.rush-dt);run.comboTime=Math.max(0,run.comboTime-dt);if(!run.comboTime)run.combo=[];
  run.recovery=Math.max(0,run.recovery-dt);
  run.velocity-=gravity*dt;run.height+=run.velocity*dt;run.distance+=(run.rush>0?230:130)*dt;
  run.peak=Math.max(run.peak,run.height);run.world=whaleWorld(run.height);
  if(run.height<=0){
    if(run.scuba){run.scuba=false;run.height=8;run.velocity=480;run.recovery=3;run.doughnuts+=4;run.message='UNDERWATER RESCUE · scuba launches you back up!';}
    else{run.height=0;run.over=true;run.message='Run complete. Your coins are banked. Upgrade, then go again.';}
  }
}
export function bankWhaleRun(profile,run){
  if(run.banked)return false;
  const reward=run.coins+Math.floor(run.distance/250);
  profile.coins+=reward;profile.best=Math.max(profile.best,Math.floor(run.distance)+run.score);run.banked=true;return reward;
}
