const fs = require('fs');
const path = require('path');
const { esc } = require('./md.js');
const safeJSON = data => JSON.stringify(data).replace(/</g, '\\u003c');
const labels = { week: '本周', all: '所有时间' };

/* 每行的序号格就是播放键：不新增列、不动版式，点一下播/暂停。
   序号 → 悬停冒出播放三角 → 播放中变成暂停竖条 → 没音源时变灰。
   （ℹ️ 音源是网易云的公开外链重定向：https://music.163.com/song/media/outer/url?id=<id>.mp3
     免登录、免密钥、不含糊 —— 浏览器自己跟随 302 到 126 的 CDN。缺点是
     受版权限制的部分歌曲取不到音频，这时按失败处理，落到网易云的页面去。） */
function rows(tracks) {
  return tracks.map(track => `<li class="music-row"><button type="button" class="music-play" data-music-play="${esc(track.id)}" aria-label="试听 ${esc(track.title)}"><span class="music-rank">${track.rank.toString().padStart(2, '0')}</span><svg class="ic music-ic music-ic-play" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-play"></use></svg><svg class="ic music-ic music-ic-pause" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-pause"></use></svg></button><a href="${esc(track.url)}" target="_blank" rel="noopener noreferrer"><span class="music-track"><b>${esc(track.title)}</b><small>${esc(track.artist)}</small></span></a></li>`).join('');
}

function render() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/netease.json'), 'utf8'));
  const first = data.week[0];
  return `<div class="music-tabs" role="group" aria-label="音乐收藏与排行">${Object.entries(labels).map(([key, label]) => `<button type="button" data-music-period="${key}" aria-pressed="${key === 'week'}">${label}</button>`).join('')}</div>
  <div class="record-player" aria-hidden="true"><div class="record-deck"><div class="record-disc"><img class="record-label" ${first ? 'src="' + esc(first.cover + '?param=96y96') + '"' : ''} width="48" height="48" alt="" referrerpolicy="no-referrer" ${first ? '' : 'hidden'}></div><i class="record-arm"></i><i class="record-light"></i></div><div class="record-speaker"></div></div>
  <div class="music-bar" role="group" aria-label="试听控制"><button type="button" class="music-transport" data-music-toggle aria-label="播放${first ? ' ' + esc(first.title) : ''}"><svg class="ic music-ic music-ic-play" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-play"></use></svg><svg class="ic music-ic music-ic-pause" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-pause"></use></svg></button><span class="music-seek" data-music-seek aria-hidden="true"><span class="music-seek-fill" data-music-fill></span></span><span class="music-time" data-music-time>0:00 / 0:00</span></div>
  <p class="music-now" role="status" aria-live="polite">点歌曲左边的方块就能试听</p>
  <p class="music-selection"><span data-music-heading>本周听歌排行</span><a class="music-listen" href="${first ? esc(first.url) : 'https://music.163.com/#/user/home?id=' + data.uid}" target="_blank" rel="noopener noreferrer">去网易云听 ↗</a></p>
  <ol class="music-list">${rows(data.week.slice(0, 5))}</ol><p class="music-empty" ${data.week.length ? 'hidden' : ''}>这段时间还没有听歌记录。</p>
  <div class="music-pager"><button type="button" data-music-prev aria-label="上一页听歌排行" disabled>上一页</button><span data-music-page role="status" aria-live="polite">${data.week.length ? '1–' + Math.min(5, data.week.length) : '0'} / ${data.week.length}</span><button type="button" data-music-next aria-label="下一页听歌排行" ${data.week.length <= 5 ? 'disabled' : ''}>下一页</button></div>
  <p class="music-source"><a href="https://music.163.com/#/user/home?id=${data.uid}" target="_blank" rel="noopener noreferrer">网易云 · Alakazam__ ↗</a><span>更新 <time data-music-updated datetime="${esc(data.updatedAt)}">${esc(data.updatedAt.slice(0, 10))}</time></span></p>
  <script id="music-data" type="application/json">${safeJSON(data)}</script>`;
}

const css = `
#music{scroll-margin-top:24px;font-size:12px;line-height:24px}
.music-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:8px;margin-bottom:16px}
#music button:not([data-music-play]){font:inherit;line-height:24px;color:var(--ink);background:var(--cream-2);border:1px solid var(--timber-light);padding:4px 8px}
#music button[aria-pressed="true"]{background:var(--ink);color:var(--cream);border-color:var(--ink)}
#music button:disabled{opacity:.4;cursor:default}#music button:active:not(:disabled){transform:translateY(2px)}
#music a:focus-visible,#music button:focus-visible{outline:2px solid var(--moss);outline-offset:3px}
.record-player{padding:10px;background:var(--timber-light);border:3px solid var(--timber);box-shadow:inset 2px 2px var(--timber-top),3px 3px var(--pixel-shadow)}
.record-deck{height:150px;position:relative;background:var(--cream-3);border:2px solid var(--timber)}
.record-disc{position:absolute;left:calc(50% - 70px);top:9px;width:128px;height:128px;background:#252d2b;clip-path:polygon(25% 0,75% 0,75% 6%,87% 6%,87% 13%,94% 13%,94% 25%,100% 25%,100% 75%,94% 75%,94% 87%,87% 87%,87% 94%,75% 94%,75% 100%,25% 100%,25% 94%,13% 94%,13% 87%,6% 87%,6% 75%,0 75%,0 25%,6% 25%,6% 13%,13% 13%,13% 6%,25% 6%)}
.record-disc::before{content:'';position:absolute;inset:14px;border:4px solid #46504a;box-shadow:inset 0 0 0 6px #252d2b,inset 0 0 0 8px #46504a;clip-path:polygon(20% 0,80% 0,80% 8%,92% 8%,92% 20%,100% 20%,100% 80%,92% 80%,92% 92%,80% 92%,80% 100%,20% 100%,20% 92%,8% 92%,8% 80%,0 80%,0 20%,8% 20%,8% 8%,20% 8%)}
.record-label{position:absolute;left:40px;top:40px;width:48px;height:48px;object-fit:contain;border:4px solid #d8b16c;image-rendering:auto}
.record-arm{position:absolute;right:16px;top:14px;width:10px;height:74px;background:#ddd3aa;border:2px solid #695d48;transform:rotate(8deg);transform-origin:top center;box-shadow:2px 2px #333c31;transition:transform .6s steps(5,end)}
.record-arm::after{content:'';position:absolute;bottom:-8px;left:-4px;width:14px;height:18px;background:#9a6344;border:2px solid #45372b}
.record-light{position:absolute;right:12px;bottom:10px;width:8px;height:8px;background:#64824c;box-shadow:2px 2px #3e5032}
html[data-time="night"] .record-light{background:#efca6a;box-shadow:0 0 8px #efca6a}
.record-speaker{height:18px;margin-top:8px;background:repeating-linear-gradient(90deg,var(--timber) 0 3px,transparent 3px 7px);border-top:3px solid var(--timber);border-bottom:3px solid var(--timber)}
.music-selection{margin:20px 0 8px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px}.music-selection>span{font-weight:bold}.music-listen{color:var(--ink);font-size:12px;text-underline-offset:3px}
.music-list{list-style:none;padding:0;margin:0}.music-row{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;align-items:center;border-bottom:1px dashed var(--cream-3)}
.music-row:hover{background:var(--cream-2)}
.music-row a{display:block;padding:9px 0;text-decoration:none;color:var(--ink)}
.music-rank{color:var(--moss)}.music-track{min-width:0}.music-track b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:normal}.music-track small{display:block;font-size:12px;line-height:24px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* ---- 序号格 = 试听键 ----
   ⚠️⚠️ 上面那条木牌按钮用 :not([data-music-play]) 排除了它 —— 但排除之后
   **浏览器默认的按钮样式**（灰底、2px outset 黑边、13.33px 字号）会顶上来，
   实测量出来的（第一版只排不管，柯西：「放歌 UI 不好看」的元凶之一）。
   所以这里 reset 必须自己写全，一个都不能省。 */
#music button[data-music-play]{position:relative;width:24px;height:24px;display:grid;place-items:center;padding:0;border:0;background:none;font:inherit;line-height:12px;color:var(--moss)}
/* 两个手绘像素图标（icons.js 的 play/pause），默认藏着，按状态亮。
   行里那枚 16px（跟序号一格），播控条上那枚 24px —— 主控制要够大才点得爽。 */
#music .music-ic{display:none}
#music .music-play .music-ic{width:16px;height:16px}
#music .music-transport .music-ic{width:24px;height:24px}
/* 播控条：大按钮 + 进度条 + 时间。⚠️ 唱片机那层是 aria-hidden 的装饰，
   这行必须放在它**外面**，否则键盘和无障碍用户摸不到播放键。 */
.music-bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;margin-top:8px}
#music .music-transport{display:grid;place-items:center;padding:4px}
#music .music-transport .music-ic-play{display:inline-block}
#music[data-playing="1"] .music-transport .music-ic-play{display:none}
#music[data-playing="1"] .music-transport .music-ic-pause{display:inline-block}
/* 进度条：8px 高的木框槽 + 实心填充，点/拖都能跳（cursor 见 gen.js 的可点光标名单） */
.music-seek{display:block;height:8px;background:var(--cream-3);border:2px solid var(--timber)}
.music-seek-fill{display:block;height:100%;width:0;background:var(--moss)}
.music-time{font-size:12px;line-height:24px;color:var(--ink-2);font-variant-numeric:tabular-nums;white-space:nowrap}
#music .music-row:not([data-state="playing"]):not([data-state="paused"]) .music-play:hover .music-ic-play{display:inline-block}
#music .music-row[data-state="paused"] .music-ic-play{display:inline-block}
#music .music-row[data-state="playing"] .music-ic-pause{display:inline-block}
#music .music-row[data-state="playing"] .music-rank,#music .music-row[data-state="paused"] .music-rank,#music .music-play:hover .music-rank{visibility:hidden}
.music-row[data-state="failed"] .music-play{opacity:.5}
/* 播放反馈：唱臂从右边摆到唱片上 + 指示灯闪。
   ⚠️ 别让唱片本体转 —— 它是 clip-path 的八角形，一转就成了斜着的方块
   （第一版实测截图很难看）。摆臂 + 闪灯才是唱片机的母语。
   ⚠️ 角度方向：正角把臂尖往**左**推（CSS 屏幕坐标），唱臂在唱片右侧，
   所以「停=8°（收在右边）→ 播=25°（摆上唱片）」。第一版写成 4° 是反的，
   臂立到唱片外面去了 —— 截图量出来的。 */
.record-deck.playing .record-arm{transform:rotate(25deg)}
@keyframes mu-blink{50%{opacity:.15}}
.record-deck.playing .record-light{animation:mu-blink 1s steps(2,end) infinite}
.music-now{margin:8px 0 0;color:var(--ink-2)}
.music-pager{display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:16px}.music-pager [data-music-page]{white-space:nowrap;font-variant-numeric:tabular-nums}
.music-source{display:flex;flex-direction:column;gap:4px;margin:16px 0 0;color:var(--ink-2)}.music-source a{color:var(--ink);text-underline-offset:3px}.music-empty{margin:20px 0;color:var(--ink-2)}
#music [hidden]{display:none!important}
`;

const script = `(function(){
const root=document.getElementById('music'), data=JSON.parse(document.getElementById('music-data').textContent);
const list=root.querySelector('.music-list'), previous=root.querySelector('[data-music-prev]'), next=root.querySelector('[data-music-next]');
const now=root.querySelector('.music-now'), deck=root.querySelector('.record-deck'), cover=root.querySelector('.record-label');
const toggle=root.querySelector('[data-music-toggle]'), seek=root.querySelector('[data-music-seek]'), fill=root.querySelector('[data-music-fill]'), timeEl=root.querySelector('[data-music-time]');
if(new URLSearchParams(location.search).get('music')==='albums'){location.replace('museum/index.html?kind=music');return;}
let period='week',page=0;

/* ---- 试听 ----
   音源来自网易云的**公开外链重定向**（outer/url?id=xxx.mp3）：免登录、免密钥，
   浏览器自己跟随 302 跳到 126 的 CDN 拿 mp3。代价是受版权限制的部分歌曲取不到
   音频 —— 那种情况按失败处理，提示去网易云听（每行末尾本来就有这个链接）。 */
const audio=new Audio(); audio.preload='none';
let currentId=null, currentTrack=null, mode='';   // mode: '' | loading | playing | paused | failed

function urlOf(track){ return 'https://music.163.com/song/media/outer/url?id='+track.id+'.mp3'; }
function mmss(s){
 if(!isFinite(s)||s<0)s=0; s=Math.floor(s);
 return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
function paintTime(){
 var d=audio.duration, t=audio.currentTime;
 if(!isFinite(d)||!d){ fill.style.width='0%'; timeEl.textContent='0:00 / 0:00'; return; }
 fill.style.width=Math.round((t||0)/d*100)+'%';
 timeEl.textContent=mmss(t)+' / '+mmss(d);
}
function paint(){
 list.querySelectorAll('.music-row').forEach(row=>{
  const btn=row.querySelector('[data-music-play]'); if(!btn) return;
  const mine=btn.dataset.musicPlay===String(currentId)&&!!mode;
  row.dataset.state=mine?mode:'';
  btn.setAttribute('aria-label',(mine&&mode==='playing'?'暂停 ':'试听 ')+btn.dataset.trackTitle);
 });
 const on=mode==='playing'||mode==='loading';
 deck.classList.toggle('playing',mode==='playing');
 root.dataset.playing=on?'1':'';
 toggle.setAttribute('aria-label',(mode==='playing'?'暂停 ':'播放 ')+(currentTrack?currentTrack.title:''));
 paintTime();
 if(currentTrack&&(mode==='playing'||mode==='paused')){
  cover.src=currentTrack.cover+'?param=96y96';cover.hidden=false;
  now.textContent=(mode==='playing'?'正在放 · ':'暂停 · ')+currentTrack.title+' — '+currentTrack.artist;
 }else if(mode==='failed'){ now.textContent='这首没有在线音源，去网易云听 ↗'; }
 else{ now.textContent='点歌曲左边的方块就能试听'; }
}
function stop(){ audio.pause(); try{audio.removeAttribute('src');audio.load();}catch(e){} currentId=null;currentTrack=null;mode='';paint(); }
function fail(){ if(mode==='loading'||mode==='playing'||mode==='paused'){mode='failed';paint();} }
function play(track){
 if(!track) return;
 if(track.id===currentId){
  if(mode==='playing'){audio.pause();mode='paused';paint();return;}
  var again=audio.play();if(again&&again.catch)again.catch(fail);return;
 }
 currentId=track.id;currentTrack=track;mode='loading';paint();
 audio.src=urlOf(track);
 var started=audio.play();if(started&&started.catch)started.catch(fail);
}
audio.addEventListener('playing',function(){if(currentTrack){mode='playing';paint();}});
audio.addEventListener('pause',function(){if(currentTrack&&mode==='playing'){mode='paused';paint();}});
audio.addEventListener('error',fail);
audio.addEventListener('timeupdate',paintTime);
audio.addEventListener('loadedmetadata',paintTime);
/* 进度条：按下/拖动都能跳。⚠️ 用 pointer 事件：一套代码覆盖鼠标和触屏 */
function seekTo(clientX){
 var d=audio.duration; if(!isFinite(d)||!d) return;
 var box=seek.getBoundingClientRect();
 if(!box.width) return;
 audio.currentTime=Math.min(1,Math.max(0,(clientX-box.left)/box.width))*d;
 paintTime();
}
seek.addEventListener('pointerdown',function(e){
 if(seek.setPointerCapture)try{seek.setPointerCapture(e.pointerId)}catch(err){}
 seekTo(e.clientX);
});
seek.addEventListener('pointermove',function(e){ if(e.buttons===1) seekTo(e.clientX); });
/* 播控条那颗大按钮：没选过就播当前页第一首，否则播/暂停当前这首 */
toggle.addEventListener('click',function(){
 if(!currentTrack){ play(data[period][page*5]||data[period][0]); return; }
 if(mode==='playing'){audio.pause();mode='paused';paint();return;}
 play(currentTrack);
});
audio.addEventListener('ended',function(){
 const tracks=data[period];if(!currentTrack)return;
 const at=tracks.indexOf(currentTrack), following=tracks[at+1];
 if(following){page=Math.floor((at+1)/5);show();play(following);}else{stop();}
});
list.addEventListener('click',function(event){
 const btn=event.target.closest('[data-music-play]');if(!btn)return;
 play(data[period].find(function(t){return String(t.id)===btn.dataset.musicPlay;}));
});
/* sprite 图标必须走 createElementNS（XHTML 里 innerHTML 塞 <svg> 不解析，
   见 TECH-NOTES 的图标坑）。 */
const SVGNS='http://www.w3.org/2000/svg';
function icon(name){
 const s=document.createElementNS(SVGNS,'svg');s.setAttribute('class','ic music-ic music-ic-'+name);
 s.setAttribute('viewBox','0 0 16 16');s.setAttribute('aria-hidden','true');
 const u=document.createElementNS(SVGNS,'use');u.setAttribute('href','#px-'+name);
 s.appendChild(u);return s;
}
function show(){
 const tracks=data[period],start=page*5,visible=tracks.slice(start,start+5);
 list.replaceChildren();
 visible.forEach(track=>{
  const li=document.createElement('li'),toggle=document.createElement('button'),rank=document.createElement('span'),a=document.createElement('a'),copy=document.createElement('span'),title=document.createElement('b'),artist=document.createElement('small');
  li.className='music-row';
  toggle.type='button';toggle.className='music-play';toggle.dataset.musicPlay=String(track.id);toggle.dataset.trackTitle=track.title;toggle.setAttribute('aria-label','试听 '+track.title);
  rank.className='music-rank';rank.textContent=String(track.rank).padStart(2,'0');
  toggle.append(rank,icon('play'),icon('pause'));
  a.href=track.url;a.target='_blank';a.rel='noopener noreferrer';a.title=track.title+' · '+track.artist;
  copy.className='music-track';title.textContent=track.title;artist.textContent=track.artist;
  copy.append(title,artist);a.append(copy);li.append(toggle,a);list.append(li);
 });
 root.querySelectorAll('[data-music-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.musicPeriod===period)));
 root.querySelector('[data-music-heading]').textContent=(period==='week'?'本周':'所有时间')+'听歌排行';
 root.querySelector('[data-music-page]').textContent=(tracks.length?(start+1)+'–'+Math.min(start+5,tracks.length):'0')+' / '+tracks.length;
 root.querySelector('.music-empty').hidden=tracks.length>0;
 root.querySelector('.music-empty').textContent='这段时间还没有听歌记录。';
 const updated=data.updatedAt,time=root.querySelector('[data-music-updated]');time.dateTime=updated;time.textContent=updated.slice(0,10);
 previous.disabled=page===0;next.disabled=start+5>=tracks.length;
 const link=root.querySelector('.music-listen');cover.hidden=!visible.length;link.textContent='去网易云听 ↗';
 if(visible.length){cover.src=visible[0].cover+'?param=96y96';link.href=visible[0].url;link.title=visible[0].title;}else{cover.removeAttribute('src');link.href='https://music.163.com/#/user/home?id='+data.uid;link.removeAttribute('title');}
 paint();
}
root.querySelectorAll('[data-music-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.musicPeriod;page=0;show();}));
previous.addEventListener('click',()=>{page--;show();});next.addEventListener('click',()=>{page++;show();});show();
})();`;
module.exports = { render, css, script };
