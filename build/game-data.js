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

// 游戏名 -> 像素图标（柯西 2026-09-20：「多一点星露谷物语、minecraft 等的图标素材」）。
// 图标挂在博物馆展品卡的名字旁边。判定标准：**图标必须真的是这个游戏的东西**——
// Minecraft 用草方块、星露谷用杨桃、塞尔达用水晶、艾尔登法环用黄金树，
// 不为了"每张卡都有图标"硬凑。没命中的游戏就不挂（留空由调用方处理）。
// 正则按 name 匹配，跨平台重复条目（Minecraft for Windows / 我的世界 / Launcher）都能命中。
const GAME_ICON=[
  [/minecraft|我的世界/i,'grass'],
  [/星露谷|stardew/i,'starfruit'],
  [/泰拉瑞亚|terraria/i,'pickaxe'],
  [/塞尔达|zelda/i,'crystal'],
  [/艾尔登|elden ring/i,'tree'],
  [/星际拓荒|outer wilds/i,'moon'],
  [/starfield/i,'star'],
  [/死亡搁浅|death stranding/i,'boot'],
  [/潜水员|dave the diver/i,'fish'],
  [/双人成行|it takes two/i,'heart'],
  [/动物森友会|animal crossing/i,'tree'],
  [/深岩银河|deep rock/i,'ore'],
  [/冰汽|frostpunk/i,'snowman']
];
// 按名字取图标名，没命中返回空串。
function gameIcon(name){
  const s=String(name||'');
  for(const [re,icon] of GAME_ICON) if(re.test(s)) return icon;
  return '';
}
module.exports={loadGames,mergeGames,GAME_ICON,gameIcon};
