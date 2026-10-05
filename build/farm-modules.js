const fs=require('fs'),path=require('path');
const {ICONS,toSymbol}=require('./icons.js');
const {seasonScript,bottomBlock,CHROME_ICONS,shareScript,sitebar,skinHead,themeHref}=require('./subpage.js');
const SITE=require('./site.config.js');
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const safeJSON=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const icon=n=>`<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-${n}"></use></svg>`;
const labels={article:'文章',photo:'照片',movie:'看过',book:'读过'};
// 内容类型 -> 像素图标。收获簿的计数条和收获页列表共用这一份
// （电影用胶片是 2026-09-20 新画的，替掉原来那颗星星——星星在站里指评分）。
const KIND_ICON={article:'book',photo:'flower',movie:'film',book:'wateringcan'};
function validDate(value){
 const s=String(value||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
 const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?s:'';
}
function collect(articles,gallery,douban){
 const items=[],seen=new Set();let undated=0;
 function add(kind,id,title,date,url){const key=kind+':'+id;if(seen.has(key))return;seen.add(key);const day=validDate(date);if(!day){undated++;return}items.push({id:key,kind,title,date:day,year:day.slice(0,4),url});}
 for(const a of articles) add('article',a.slug,a.title,a.dateKnown===false?'':a.date,'posts/'+encodeURIComponent(a.slug)+'.html');
 for(const p of gallery.items||[])if(!p.generated)add('photo',p.file,p.caption||'相片',p.date,'gallery/index.html#photo-'+encodeURIComponent(p.file));
 for(const d of douban.items||[])if(['movie','book'].includes(d.kind)&&d.status==='done')add(d.kind,d.id,d.title,d.date,/^https:\/\//.test(d.url||'')?d.url:'museum/index.html?kind='+d.kind);
 items.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 const years={};for(const x of items){years[x.year]||={article:0,photo:0,movie:0,book:0};years[x.year][x.kind]++;}
 return {items,years,undated,updatedAt:douban.updatedAt||''};
}
function load(){const read=n=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,'data',n),'utf8'))}catch{return {}}};return collect(require('./content.js').articles(),read('gallery.json'),read('douban.json'));}
function calendar(){return `<div class="calendar-date"><time id="calendar-date"></time><span id="calendar-weekday"></span></div><div class="seasons">${[['spring','parsnip','春'],['summer','melon','夏'],['autumn','pumpkin','秋'],['winter','snowman','冬']].map(([k,n,label])=>`<button type="button" class="se" data-se="${k}" data-set-season="${k}" aria-label="切换${label}季外观" aria-pressed="false">${icon(n)}<b>${label}</b></button>`).join('')}</div><p class="calendar-mode" id="calendar-mode"></p><button class="abtn calendar-auto" type="button" data-auto-season>恢复自动</button>`;}
function harvest(data){
 const crops={article:'wheat',photo:'flower',movie:'film',book:'book'},units={article:'篇',photo:'张',movie:'部',book:'本'};
 const recent=Object.keys(data.years).sort().reverse().map(year=>`<ul class="farm-recent-list" data-harvest-year="${year}" hidden>${data.items.filter(item=>item.year===year).slice(0,3).map(item=>`<li><span class="farm-recent-kind">${icon(KIND_ICON[item.kind])}${labels[item.kind]}</span><a href="${esc(item.url)}"${/^https:\/\//.test(item.url)?' target="_blank" rel="noopener"':''}>${esc(item.title)}</a><time datetime="${item.date}">${item.date.slice(5).replace('-',' / ')}</time></li>`).join('')}</ul>`).join('');
 return `<div id="ledger" class="farm-harvest">
  <p class="farm-harvest-intro">文章、真实照片和看完读完的书影会自动汇入这里，不用另外维护。</p>
  <div class="harvest-heading"><label for="harvest-year">年度收获</label><select id="harvest-year" aria-label="收获年份"></select></div>
  <div class="harvest-counts">${Object.entries(labels).map(([kind,label])=>`<a class="farm-plot" data-harvest-kind="${kind}" data-empty="true" href="harvest/index.html?kind=${kind}"><span class="farm-plot-label">${label}</span><span class="farm-plot-crop" aria-hidden="true">${icon(crops[kind])}</span><span class="farm-plot-total"><b>0</b><span>${units[kind]}</span></span><span class="farm-plot-note">暂无记录</span></a>`).join('')}</div>
  <div class="farm-recent"><div class="farm-recent-heading"><h3>最近的收获</h3><a data-harvest-all href="harvest/index.html">查看这一年</a></div>${recent}<p class="farm-recent-empty">这一年还没有记录，新的生活片段会出现在这里。</p></div>
  <p class="harvest-note">照片不含生成插画；书影按豆瓣标记日期归档。${data.updatedAt?'最近同步 '+esc(data.updatedAt.slice(0,10))+'。':''}</p>
  <script id="harvest-summary" type="application/json">${safeJSON(data.years)}</script>
 </div>`;
}
// 季节景物与小鸡（N02）只放在首页页脚站台、快捷栏两侧（V20 第 6.13 节）：开关只在首页外观设置里，放到子页会关不掉。
// 根元素保留 season-scenery / farm-pet 两个类名：开关规则与 check-farm.js 都认它们。
function planter(){return `<div class="planter season-scenery" aria-hidden="true"><span class="planter-lantern">${icon('lantern')}</span><span class="season-plants spring">${icon('tulip')}${icon('flower')}</span><span class="season-plants summer">${icon('sunflower')}${icon('melon')}</span><span class="season-plants autumn">${icon('pumpkin')}${icon('wheat')}</span><span class="season-plants winter">${icon('snowman')}<i class="snow-cap"></i></span></div>`;}
function pet(){return `<div class="pet farm-pet"><span class="pet-reply" role="status" aria-live="polite"></span><button id="farm-pet" type="button" aria-label="摸摸小鸡">${icon('chicken')}</button></div>`;}
function settings(){return `<label class="farm-option"><input type="checkbox" data-farm-option="pet" checked>农场小鸡</label><label class="farm-option"><input type="checkbox" data-farm-option="scenery" checked>季节景物</label>`;}
const css=`
/* Farm modules: preserve pixel palette; restrained motion, readable content. */
#calendar,#ledger,.harvest-page{font-size:12px;line-height:24px}
/* 日历日期（V20 第 6.9 节末）：规则只留这一处，≤430 降档在后面收获簿列表之后那个块里（同特异性后来者赢）。
   像素字不加粗；日期与四季按钮之间一道 1px 细线（虚线在 V20 里留给普通站线段、空田和开源贡献框）。 */
.calendar-date{display:flex;flex-direction:column;gap:8px;margin:4px 0 20px;padding-bottom:16px;border-bottom:1px solid var(--line)}
.calendar-date time{font-size:36px;line-height:48px;font-variant-numeric:tabular-nums}
.calendar-date span,.calendar-mode{font-size:12px;line-height:24px}
/* 说明句会折行，用阅读字（第 4 节点名表） */
.harvest-note{font-family:var(--read);font-size:14px;line-height:22px}
/* .se / .pet button / #music button 都是 <button>，光标由主题主规则
   统一发「金黄可点态箭头」。⚠️ 这些规则里不要再写 cursor:pointer ——
   ID/类选择器特异性高于主规则的 (0,0,1)，会把像素光标顶回系统箭头。 */
/* 四季键是搪瓷徽章（V20 第 3.5 节）：当前季节（aria-pressed）用站牌色，悬停浮起色。 */
#calendar .se{font:inherit;min-height:60px;display:flex;align-items:center;justify-content:center;gap:12px;color:var(--ink);background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);padding:8px}
#calendar .se b{font-size:12px;line-height:24px;margin:0}
#calendar .se:hover{background:var(--raised)}
#calendar .se[aria-pressed="true"]{background:var(--plate);color:var(--on-plate);border-color:var(--plate)}
/* 当季那一格：落影换成 2px 线路色下边（季节按真实时间自动判定，不标出来看不出「现在这一季」）。 */
#calendar .se.now{box-shadow:0 2px 0 var(--rail)}
.calendar-mode{margin:16px 0 8px;color:var(--ink-2)}.calendar-auto{min-height:40px;font:inherit}
.harvest-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
/* 年份下拉是 40px 高的搪瓷徽章 */
.harvest-heading select,.harvest-filters select{font:inherit;line-height:24px;min-height:40px;color:var(--ink);background:var(--surface);
  border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);padding:4px 8px;max-width:100%}
.harvest-counts a{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;border-bottom:1px solid var(--wood-c);text-decoration:none;color:var(--ink)}
.harvest-counts a span{display:flex;align-items:center;gap:10px}.harvest-note{margin:16px 0 0;color:var(--tx-3)}
.harvest-filters{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}.harvest-filters label{display:flex;align-items:center;gap:8px}
/* 收获簿记录按时刻表行排（V20 第 7.2 节）：日期像素 12 ｜ 类型图标 + 标题阅读 16 ｜ 类型芯片；行间 1px 细线，悬停整行浮起色。
   ≤430 日期独占一行（见下方 ≤430 块）。 */
.harvest-list{list-style:none;padding:0;margin:20px 0}
.harvest-list li{display:grid;grid-template-columns:96px minmax(0,1fr) auto;align-items:start;gap:12px;padding:12px 8px;border-bottom:1px solid var(--line)}
.harvest-list li:hover{background:var(--raised)}
.harvest-list time{color:var(--tx-em);white-space:nowrap;font-variant-numeric:tabular-nums}
.harvest-list a{display:flex;align-items:flex-start;gap:8px;min-width:0;color:var(--ink);text-decoration:none;font-family:var(--read);font-size:16px;line-height:26px;font-weight:600;overflow-wrap:anywhere}
.harvest-list a:hover{text-decoration:underline;text-underline-offset:4px}
.harvest-list a svg.ic{margin-top:5px}
.harvest-list small{padding:0 6px;font-size:12px;line-height:24px;white-space:nowrap;background:var(--raised);color:var(--tx-tag)}
.harvest-list li:hover small{background:var(--surface)}
/* ≤430 降档：日历日期（第 6.9 节末）与收获簿日期独占一行。排在两者的基础规则之后（同特异性后来者赢）。 */
@media(max-width:430px){.calendar-date time{font-size:24px;line-height:36px}.harvest-list li{grid-template-columns:minmax(0,1fr) auto;row-gap:4px}.harvest-list time{grid-column:1/-1}}
.harvest-list [hidden],.harvest-empty[hidden]{display:none!important}
.farm-harvest-intro{margin:0 0 24px;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2);max-width:52em}
.farm-harvest .harvest-heading{padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:20px}
.farm-harvest .harvest-heading label{font-size:24px;line-height:32px}
/* 四块收获田是纸卡（V20 第 6.11 节）；空田用浮起色底 + 1px 虚线控件边。数字像素 24、名称像素 12。 */
.farm-harvest .harvest-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.farm-harvest .farm-plot{display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:16px 12px 12px;min-width:0;
  border:1px solid var(--line);background:var(--surface);box-shadow:var(--lift);text-decoration:none;color:var(--ink);transition:background .2s ease}
.farm-harvest .farm-plot[data-empty="true"]{background:var(--raised);border:1px dashed var(--edge);box-shadow:none}
.farm-harvest .farm-plot:hover{background:var(--raised)}.farm-harvest .farm-plot:focus-visible{outline:2px solid var(--rail);outline-offset:4px}
.farm-harvest .farm-plot-label{display:block;font-size:12px;line-height:24px}
.farm-harvest .farm-plot-crop{position:relative;display:flex;align-items:flex-end;justify-content:center;height:64px;padding-bottom:12px}
.farm-harvest .farm-plot-crop::after{content:'';position:absolute;bottom:0;left:0;right:0;height:8px;background:var(--wood)}
.farm-harvest .farm-plot-crop .ic{width:36px;height:36px;z-index:1}.farm-harvest .farm-plot[data-empty="true"] .farm-plot-crop .ic{visibility:hidden}
.farm-harvest .farm-plot-total{display:flex;align-items:baseline;gap:8px}.farm-harvest .farm-plot-total b{font-size:24px;line-height:32px;color:var(--tx-num);font-variant-numeric:tabular-nums}
.farm-harvest .farm-plot-total span,.farm-harvest .farm-plot-note{font-size:12px;line-height:24px;color:var(--ink-2)}
.farm-recent{margin-top:28px}.farm-recent-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:8px}.farm-recent-heading h3{margin:0;font-size:12px;line-height:24px;font-weight:normal}.farm-recent-heading a{color:var(--ink-2);text-underline-offset:4px;white-space:nowrap}
/* 最近三条按时刻表行排：类型与日期像素 12，标题阅读 14 */
.farm-recent-list{list-style:none;padding:0;margin:0}.farm-recent-list li{display:grid;grid-template-columns:76px minmax(0,1fr) auto;align-items:start;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
.farm-recent-list a{color:var(--ink);text-decoration:none;font-family:var(--read);font-size:14px;line-height:22px;overflow-wrap:anywhere}.farm-recent-list a:hover{text-decoration:underline;text-underline-offset:4px}
.farm-recent-kind{display:flex;align-items:center;gap:8px;color:var(--ink-2)}.farm-recent-kind .ic{width:24px;height:24px;flex:none}.farm-recent-list time{color:var(--ink-2);white-space:nowrap;font-variant-numeric:tabular-nums}
.farm-recent-empty{margin:0;padding:16px 0;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2)}.farm-harvest [hidden]{display:none!important}
.farm-option{display:flex;align-items:center;gap:8px;font-size:12px;line-height:24px;min-height:36px}.farm-option input{width:16px;height:16px;accent-color:var(--wood-c)}
/* 页脚站台两侧（V20 第 6.13 节）：花箱 = 灯笼 + 当季两株作物，夜里灯笼发光；小鸡的回应在它头顶，空着时占位不显示（不让站台跳动）。 */
.planter{display:flex;align-items:flex-end;gap:8px;pointer-events:none}.planter .ic{width:32px;height:32px}
html[data-time="night"] .planter-lantern{filter:drop-shadow(0 0 8px var(--lamp))}
.season-plants{display:none;position:relative;align-items:flex-end;gap:4px}
html[data-season="spring"] .season-plants.spring,html[data-season="summer"] .season-plants.summer,html[data-season="autumn"] .season-plants.autumn,html[data-season="winter"] .season-plants.winter{display:flex}
.season-plants.winter{min-width:74px}
.snow-cap{display:block;position:absolute;bottom:-5px;left:-4px;width:74px;height:10px;background:#eefaff;box-shadow:4px -4px 0 #eefaff,-4px 2px 0 #bad7e4}
.pet{display:flex;flex-direction:column;align-items:center;width:60px}.pet button{width:60px;height:60px;padding:8px;border:0;background:transparent}.pet .ic{width:44px;height:44px;filter:drop-shadow(1px 0 0 var(--edge)) drop-shadow(-1px 0 0 var(--edge)) drop-shadow(0 1px 0 var(--edge)) drop-shadow(0 -1px 0 var(--edge))}
.pet-reply{min-height:24px;font-size:12px;line-height:24px;color:var(--ink);white-space:nowrap}.pet-reply:empty{visibility:hidden}
.pet button:active{transform:translateY(2px)}.pet button:focus-visible{outline:2px solid var(--edge);outline-offset:2px}
html[data-farm-pet="off"] .farm-pet,html[data-farm-scenery="off"] .season-scenery{display:none}
@media(max-width:760px){.harvest-heading{flex-wrap:wrap}.farm-harvest .harvest-counts{grid-template-columns:repeat(2,minmax(0,1fr))}.farm-recent-list li{grid-template-columns:minmax(0,1fr) auto;gap:4px 12px}.farm-recent-kind{grid-column:1}.farm-recent-list a{grid-column:1;grid-row:2}.farm-recent-list time{grid-column:2;grid-row:2}}
@media(prefers-reduced-motion:reduce){.pet button,.farm-harvest .farm-plot{transition:none;animation:none}}
`;
const homeScript=`(function(){
 var root=document.documentElement,years=JSON.parse(document.getElementById('harvest-summary').textContent),select=document.getElementById('harvest-year');
 var current=String(new Date().getFullYear());Array.from(new Set([current].concat(Object.keys(years)))).sort().reverse().forEach(function(y){var o=document.createElement('option');o.value=y;o.textContent=y+' 年';select.appendChild(o)});select.value=current;
 function show(){
  var counts=years[select.value]||{};
  document.querySelectorAll('[data-harvest-kind]').forEach(function(a){var k=a.dataset.harvestKind,count=counts[k]||0;a.querySelector('b').textContent=count;a.href='harvest/index.html?year='+select.value+'&kind='+k;a.dataset.empty=String(count===0);a.querySelector('.farm-plot-note').textContent=count?'查看记录':'暂无记录';});
  document.querySelectorAll('[data-harvest-year]').forEach(function(list){list.hidden=list.dataset.harvestYear!==select.value;});
  document.querySelector('.farm-recent-empty').hidden=!!years[select.value];document.querySelector('[data-harvest-all]').href='harvest/index.html?year='+select.value+'&kind=all';
 }select.addEventListener('change',show);show();
 document.querySelectorAll('[data-farm-option]').forEach(function(input){var key=input.dataset.farmOption;try{input.checked=localStorage.getItem('kx-farm-'+key)!=='off'}catch(e){}function apply(){root.setAttribute('data-farm-'+key,input.checked?'on':'off');}apply();input.addEventListener('change',function(){apply();try{localStorage.setItem('kx-farm-'+key,input.checked?'on':'off')}catch(e){}});});
 var pet=document.getElementById('farm-pet'),reply=document.querySelector('.pet-reply'),n=0,timer;pet.addEventListener('click',function(){var messages=root.dataset.time==='night'?['啾…晚安','小声一点','陪你看星星']:['啾啾！','摸摸头','今天也加油'];reply.textContent=messages[n++%messages.length];clearTimeout(timer);timer=setTimeout(function(){reply.textContent=''},4000);});
})();`;
function build(){
 const data=load(),folder=path.join(__dirname,'../harvest');fs.mkdirSync(folder,{recursive:true});
 // sprite 白名单从 KIND_ICON 推导 —— 以前是手写 ['mailbox','wheat','flower','book','film']，
 // KIND_ICON 加上 wateringcan 后两边漂移，收获簿里那一列图标全变空白（构建不报错）。
 const sprite='<svg style="display:none" aria-hidden="true">'+[...new Set(Object.values(KIND_ICON).concat(CHROME_ICONS))].filter(n=>ICONS[n]).map(n=>toSymbol(n,ICONS[n])).join('')+'</svg>';
 // 记录按时刻表行排（V20 第 7.2 节）：日期 ｜ 类型图标 + 标题 ｜ 类型芯片；列表扫过去能直接分出文章/照片/影/书
 const rows=data.items.map(x=>`<li data-year="${x.year}" data-kind="${x.kind}"><time datetime="${x.date}">${x.date.replace(/-/g,'.')}</time><a href="${esc(/^https:\/\//.test(x.url)?x.url:'../'+x.url)}"${/^https:\/\//.test(x.url)?' target="_blank" rel="noopener"':''}>${icon(KIND_ICON[x.kind]||'book')}${esc(x.title)}</a><small>${labels[x.kind]}</small></li>`).join('');
 const html=`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">${skinHead()}<meta name="viewport" content="width=device-width,initial-scale=1"><title>收获簿 · ${esc(SITE.name)}</title><link rel="stylesheet" href="../font.css"><link rel="stylesheet" href="${themeHref()}"></head><body class="is-article">${sprite}<div class="wrap">${sitebar({prefix:'../',back:'#ledger'})}<section class="panel artpage harvest-page"><h2 class="pt"><svg class="ic sm" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-keg"></use></svg>收获簿</h2><h1 class="arttitle">一年里的收获</h1><div class="harvest-filters"><label>年份 <select id="year"><option value="all">所有年份</option>${Object.keys(data.years).sort().reverse().map(y=>`<option value="${y}">${y}</option>`).join('')}</select></label><label>内容 <select id="kind"><option value="all">全部内容</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div><p class="harvest-status" role="status"></p><ul class="harvest-list">${rows}</ul><p class="harvest-empty" hidden>这一年还没有这类记录。</p><p class="page-note">文章包含本站文章和豆瓣影评；照片不含生成插画。书影音按豆瓣标记日期归档。${data.undated?'另有 '+data.undated+' 条记录缺少有效日期，暂不计入年度汇总。':''}${data.updatedAt?'书影音最近同步 '+esc(data.updatedAt.slice(0,10))+'。':''}</p></section>${bottomBlock('','../',{current:6})}</div><script>(function(){var q=new URLSearchParams(location.search),year=document.getElementById('year'),kind=document.getElementById('kind'),wanted=q.get('year');if(/^\\d{4}$/.test(wanted)&&![...year.options].some(o=>o.value===wanted)){var o=document.createElement('option');o.value=wanted;o.textContent=wanted;year.appendChild(o)}year.value=[...year.options].some(o=>o.value===wanted)?wanted:'all';kind.value=[...kind.options].some(o=>o.value===q.get('kind'))?q.get('kind'):'all';function render(){var count=0;document.querySelectorAll('.harvest-list li').forEach(function(li){li.hidden=!(year.value==='all'||li.dataset.year===year.value)||!(kind.value==='all'||li.dataset.kind===kind.value);if(!li.hidden)count++});document.querySelector('.harvest-status').textContent=(year.value==='all'?'全部年份':year.value+' 年')+' · '+kind.options[kind.selectedIndex].text+' · '+count+' 条';document.querySelector('.harvest-empty').hidden=count!==0;var next=new URLSearchParams({year:year.value,kind:kind.value});history.replaceState(null,'','?'+next.toString())}year.onchange=kind.onchange=render;render()})();</script>${seasonScript()}${shareScript()}</body></html>`;
 fs.writeFileSync(path.join(folder,'index.html'),html);console.log('已生成收获簿：'+data.items.length+' 条有日期记录');return data;
}
module.exports={collect,validDate,load,calendar,harvest,planter,pet,settings,css,homeScript,build};
