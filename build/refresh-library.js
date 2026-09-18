const fs=require('fs'),path=require('path'),os=require('os'),zlib=require('zlib'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const read=(p,fallback={})=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return fallback}};
function validate(name,next,old){
 assert.equal(next.uid,old.uid,'Account mismatch');
 if(name==='douban'){
  assert(Array.isArray(next.items)&&Array.isArray(next.reviews),'Missing collection');assert.equal(next.total,next.items.length);
  const keys=next.items.map(x=>x.kind+':'+x.id);assert.equal(new Set(keys).size,keys.length,'Duplicate collection');
  for(const type of ['movie','book','music','game'])assert(next.items.filter(x=>x.kind===type).length>=(old.items||[]).filter(x=>x.kind===type).length,'Collection shrank; review required');
  assert(next.reviews.length>=(old.reviews||[]).length,'Reviews shrank; review required');
 }else{
  for(const p of ['steam','psn','xbox_v2','switchall']){const v=next.platforms?.[p];assert(v&&v.complete&&v.reportedTotal===v.games.length,'Incomplete platform');assert(v.games.length>=(old.platforms?.[p]?.games.length||0),'Library shrank; review required');assert.equal(new Set(v.games.map(g=>g.sourceId)).size,v.games.length);assert(v.games.every(g=>g.platform===p),'Wrong platform');}
 }
 assert(!/"(?:access_token|refresh_token|cookie|authorization)"\s*:/i.test(JSON.stringify(next)),'Private field in snapshot');
}
async function main(){
 const statusPath=path.join(ROOT,'build/data/external-sync.json'),prior=read(statusPath),request=read(path.join(ROOT,'content/sync-request.json'));
 if(process.env.REFRESH_DATA!=='true'&&(!request.id||request.id===prior.handledRequest)){console.log('External snapshots unchanged; no refresh requested.');return;}
 const now=new Date().toISOString(),state={...prior,attemptedAt:now,handledRequest:request.id||prior.handledRequest||null,sources:{...prior.sources}};
 let scripts;try{scripts=JSON.parse(zlib.gunzipSync(Buffer.from(process.env.SOURCE_ADAPTER_BUNDLE||'','base64')).toString('utf8'));assert(scripts&&typeof scripts==='object')}catch{for(const n of ['douban','games'])state.sources[n]={...state.sources[n],status:'unavailable',message:'同步服务未配置'};fs.writeFileSync(statusPath,JSON.stringify(state,null,2));console.log('::warning::External source bundle unavailable; previous snapshots retained.');return;}
 const files=['build/douban.js','build/sources/heybox-library.js','build/sources/heybox-sign.js'];
 for(const p of files)assert(typeof scripts[p]==='string','Missing adapter');
 for(const [name,file,command,assets] of [['douban','douban.json',['build/douban.js','211628276'],'covers'],['games','game-library.json',['build/sources/heybox-library.js'],'games']]){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kx-source-'));
  try{
   for(const p of files){const dest=path.join(temp,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,scripts[p]);}
   fs.mkdirSync(path.join(temp,'build/data'),{recursive:true});fs.mkdirSync(path.join(temp,'assets'),{recursive:true});
   fs.cpSync(path.join(ROOT,'assets',assets),path.join(temp,'assets',assets),{recursive:true});
   const old=read(path.join(ROOT,'build/data',file));
   const childEnv={...process.env};delete childEnv.SOURCE_ADAPTER_BUNDLE;delete childEnv.GITHUB_TOKEN;
   const result=spawnSync(process.execPath,command,{cwd:temp,env:childEnv,encoding:'utf8',timeout:240000,maxBuffer:2e6,windowsHide:true});
   if(result.status!==0)throw Error('读取失败或超时，保留上次数据');
   const next=read(path.join(temp,'build/data',file));validate(name,next,old);
   const references=name==='douban'?next.items.map(x=>x.cover).concat(next.reviews.map(x=>x.subject?.cover)).filter(Boolean):Object.values(next.platforms).flatMap(p=>p.games.map(g=>g.cover).filter(Boolean));
   for(const cover of references){assert(/^[\w.-]+$/.test(cover)&&!cover.includes('..'),'Invalid cover path');assert(fs.existsSync(path.join(temp,'assets',assets,cover)),'Missing cover');}
   fs.cpSync(path.join(temp,'assets',assets),path.join(ROOT,'assets',assets),{recursive:true});
   const target=path.join(ROOT,'build/data',file);fs.writeFileSync(target+'.tmp',JSON.stringify(next,null,2));fs.renameSync(target+'.tmp',target);
   state.sources[name]={status:'success',lastSuccess:now,count:name==='douban'?next.items.length:Object.values(next.platforms).reduce((s,p)=>s+p.games.length,0)};
   console.log('External '+name+' refreshed: '+state.sources[name].count+' records.');
  }catch(e){state.sources[name]={...prior.sources?.[name],status:'failed',message:/shrank/.test(e.message)?'来源数量减少，保留旧数据待核对':'本次同步失败，保留上次数据'};console.log('::warning::External '+name+' refresh failed; previous snapshot retained.');}
  finally{const absolute=path.resolve(temp);if(absolute.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(absolute).startsWith('kx-source-'))fs.rmSync(absolute,{recursive:true,force:true});}
 }
 fs.writeFileSync(statusPath,JSON.stringify(state,null,2));
}
module.exports={validate};if(require.main===module)main().catch(()=>{console.error('External refresh failed safely.');process.exitCode=1});
