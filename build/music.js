const fs = require('fs');
const path = require('path');
const { esc } = require('./md.js');
const safeJSON = data => JSON.stringify(data).replace(/</g, '\\u003c');
const labels = { week: '本周', all: '所有时间' };

function rows(tracks) {
  return tracks.map(track => `<li><a href="${esc(track.url)}" target="_blank" rel="noopener noreferrer"><span class="music-rank">${track.rank.toString().padStart(2, '0')}</span><span class="music-track"><b>${esc(track.title)}</b><small>${esc(track.artist)}</small></span></a></li>`).join('');
}

function render() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/netease.json'), 'utf8'));
  const albumPath = path.join(__dirname, '../content/netease-albums.json');
  if (fs.existsSync(albumPath)) {
    const collection = JSON.parse(fs.readFileSync(albumPath, 'utf8'));
    data.albums = collection.items.map((album, index) => ({ ...album, rank: index + 1 }));
    data.albumsUpdatedAt = collection.updatedAt;
  }
  const periods = data.albums ? { ...labels, albums: '专辑收藏' } : labels;
  const first = data.week[0];
  return `<div class="music-tabs" role="group" aria-label="音乐收藏与排行">${Object.entries(periods).map(([key, label]) => `<button type="button" data-music-period="${key}" aria-pressed="${key === 'week'}">${label}</button>`).join('')}</div>
  <div class="record-player" aria-hidden="true"><div class="record-deck"><div class="record-disc"><img class="record-label" ${first ? 'src="' + esc(first.cover + '?param=96y96') + '"' : ''} width="48" height="48" alt="" referrerpolicy="no-referrer" ${first ? '' : 'hidden'}></div><i class="record-arm"></i><i class="record-light"></i></div><div class="record-speaker"></div></div>
  <p class="music-selection"><span data-music-heading>本周听歌排行</span><a class="music-listen" href="${first ? esc(first.url) : 'https://music.163.com/#/user/home?id=' + data.uid}" target="_blank" rel="noopener noreferrer">去网易云听 ↗</a></p>
  <ol class="music-list">${rows(data.week.slice(0, 5))}</ol><p class="music-empty" ${data.week.length ? 'hidden' : ''}>这段时间还没有听歌记录。</p>
  <div class="music-pager"><button type="button" data-music-prev aria-label="上一页听歌排行" disabled>上一页</button><span data-music-page role="status" aria-live="polite">${data.week.length ? '1–' + Math.min(5, data.week.length) : '0'} / ${data.week.length}</span><button type="button" data-music-next aria-label="下一页听歌排行" ${data.week.length <= 5 ? 'disabled' : ''}>下一页</button></div>
  <p class="music-source"><a href="https://music.163.com/#/user/home?id=${data.uid}" target="_blank" rel="noopener noreferrer">网易云 · Alakazam__ ↗</a><span>更新 <time data-music-updated datetime="${esc(data.updatedAt)}">${esc(data.updatedAt.slice(0, 10))}</time></span></p>
  <script id="music-data" type="application/json">${safeJSON(data)}</script>`;
}

const css = `
#music{scroll-margin-top:24px;font-size:12px;line-height:24px}
.music-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:8px;margin-bottom:16px}
#music button{font:inherit;line-height:24px;color:var(--ink);background:var(--cream-2);border:1px solid var(--timber-light);padding:4px 8px;cursor:pointer}
#music button[aria-pressed="true"]{background:var(--ink);color:var(--cream);border-color:var(--ink)}
#music button:disabled{opacity:.4;cursor:default}#music button:active:not(:disabled){transform:translateY(2px)}
#music a:focus-visible,#music button:focus-visible{outline:2px solid var(--moss);outline-offset:3px}
.record-player{padding:10px;background:var(--timber-light);border:3px solid var(--timber);box-shadow:inset 2px 2px var(--timber-top),3px 3px var(--pixel-shadow)}
.record-deck{height:150px;position:relative;background:var(--cream-3);border:2px solid var(--timber)}
.record-disc{position:absolute;left:calc(50% - 70px);top:9px;width:128px;height:128px;background:#252d2b;clip-path:polygon(25% 0,75% 0,75% 6%,87% 6%,87% 13%,94% 13%,94% 25%,100% 25%,100% 75%,94% 75%,94% 87%,87% 87%,87% 94%,75% 94%,75% 100%,25% 100%,25% 94%,13% 94%,13% 87%,6% 87%,6% 75%,0 75%,0 25%,6% 25%,6% 13%,13% 13%,13% 6%,25% 6%)}
.record-disc::before{content:'';position:absolute;inset:14px;border:4px solid #46504a;box-shadow:inset 0 0 0 6px #252d2b,inset 0 0 0 8px #46504a;clip-path:polygon(20% 0,80% 0,80% 8%,92% 8%,92% 20%,100% 20%,100% 80%,92% 80%,92% 92%,80% 92%,80% 100%,20% 100%,20% 92%,8% 92%,8% 80%,0 80%,0 20%,8% 20%,8% 8%,20% 8%)}
.record-label{position:absolute;left:40px;top:40px;width:48px;height:48px;object-fit:contain;border:4px solid #d8b16c;image-rendering:auto}
.record-arm{position:absolute;right:16px;top:14px;width:10px;height:74px;background:#ddd3aa;border:2px solid #695d48;transform:rotate(25deg);transform-origin:top center;box-shadow:2px 2px #333c31}
.record-arm::after{content:'';position:absolute;bottom:-8px;left:-4px;width:14px;height:18px;background:#9a6344;border:2px solid #45372b}
.record-light{position:absolute;right:12px;bottom:10px;width:8px;height:8px;background:#64824c;box-shadow:2px 2px #3e5032}
html[data-time="night"] .record-light{background:#efca6a;box-shadow:0 0 8px #efca6a}
.record-speaker{height:18px;margin-top:8px;background:repeating-linear-gradient(90deg,var(--timber) 0 3px,transparent 3px 7px);border-top:3px solid var(--timber);border-bottom:3px solid var(--timber)}
.music-selection{margin:20px 0 8px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px}.music-selection>span{font-weight:bold}.music-listen{color:var(--ink);font-size:12px;text-underline-offset:3px}
.music-list{list-style:none;padding:0;margin:0}.music-list li{border-bottom:1px dashed var(--cream-3)}
.music-list li a{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;padding:9px 0;text-decoration:none;color:var(--ink)}
.music-list li a:hover{background:var(--cream-2)}.music-rank{color:var(--moss)}.music-track{min-width:0}.music-track b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:normal}.music-track small{display:block;font-size:12px;line-height:24px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.music-pager{display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:16px}.music-pager [data-music-page]{white-space:nowrap;font-variant-numeric:tabular-nums}
.music-source{display:flex;flex-direction:column;gap:4px;margin:16px 0 0;color:var(--ink-2)}.music-source a{color:var(--ink);text-underline-offset:3px}.music-empty{margin:20px 0;color:var(--ink-2)}
#music [hidden]{display:none!important}
`;

const script = `(function(){
const root=document.getElementById('music'), data=JSON.parse(document.getElementById('music-data').textContent);
const list=root.querySelector('.music-list'), previous=root.querySelector('[data-music-prev]'), next=root.querySelector('[data-music-next]');
let period=new URLSearchParams(location.search).get('music')==='albums'&&data.albums?'albums':'week',page=0;
function show(){
 const tracks=data[period],start=page*5,visible=tracks.slice(start,start+5);
 list.replaceChildren();
 visible.forEach(track=>{
  const li=document.createElement('li'),a=document.createElement('a'),rank=document.createElement('span'),copy=document.createElement('span'),title=document.createElement('b'),artist=document.createElement('small');
  a.href=track.url;a.target='_blank';a.rel='noopener noreferrer';a.title=track.title+' · '+track.artist;
  rank.className='music-rank';rank.textContent=String(track.rank).padStart(2,'0');copy.className='music-track';title.textContent=track.title;artist.textContent=track.artist;
  copy.append(title,artist);a.append(rank,copy);li.append(a);list.append(li);
 });
 root.querySelectorAll('[data-music-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.musicPeriod===period)));
 root.querySelector('[data-music-heading]').textContent=period==='albums'?'专辑收藏':(period==='week'?'本周':'所有时间')+'听歌排行';
 root.querySelector('[data-music-page]').textContent=(tracks.length?(start+1)+'–'+Math.min(start+5,tracks.length):'0')+' / '+tracks.length;
 root.querySelector('.music-empty').hidden=tracks.length>0;
 root.querySelector('.music-empty').textContent=period==='albums'?'还没有收藏专辑。':'这段时间还没有听歌记录。';
 const updated=period==='albums'?data.albumsUpdatedAt:data.updatedAt,time=root.querySelector('[data-music-updated]');time.dateTime=updated;time.textContent=updated.slice(0,10);
 previous.disabled=page===0;next.disabled=start+5>=tracks.length;
 const cover=root.querySelector('.record-label'),link=root.querySelector('.music-listen');cover.hidden=!visible.length;link.textContent=period==='albums'?'去网易云看 ↗':'去网易云听 ↗';
 if(visible.length){cover.src=visible[0].cover+'?param=96y96';link.href=visible[0].url;link.title=visible[0].title;}else{cover.removeAttribute('src');link.href='https://music.163.com/#/user/home?id='+data.uid;link.removeAttribute('title');}
}
root.querySelectorAll('[data-music-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.musicPeriod;page=0;show();}));
previous.addEventListener('click',()=>{page--;show();});next.addEventListener('click',()=>{page++;show();});show();
})();`;
module.exports = { render, css, script };
