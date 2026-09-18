// Offline merge: a complete platform library replaces only that platform's summary sample.
const fs=require('fs'),path=require('path');
function mergeGames(base,library){
  const out={...base,games:[...(base.games||[])],coverage:{}};
  if(!library||library.uid!==base.uid)return out;
  for(const [platform,p] of Object.entries(library.platforms||{})){
    const games=p.games||[];
    if(!Array.isArray(games)||!p.complete||p.reportedTotal!==games.length||new Set(games.map(g=>String(g.sourceId||g.appid))).size!==games.length||games.some(g=>g.platform!==platform||!g.name||!(g.sourceId||g.appid)||(g.hours!=null&&(!Number.isFinite(g.hours)||g.hours<0))))continue;
    out.games=out.games.filter(g=>g.platform!==platform).concat(games);
    out.coverage[platform]={complete:true,count:games.length,updatedAt:library.updatedAt};
  }
  out.unavailable=library.unavailable||{};
  out.libraryUpdatedAt=library.updatedAt;
  out.games.sort((a,b)=>(b.hours||0)-(a.hours||0));
  return out;
}
function loadGames(){
  const read=name=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,'data',name),'utf8'))}catch{return null}};
  return mergeGames(read('games.json')||{},read('game-library.json'));
}
module.exports={loadGames,mergeGames};
