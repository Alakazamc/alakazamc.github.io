const fs=require('fs'),path=require('path');
const {ICONS,toSymbol}=require('./icons.js');
const {seasonScript,bottomBlock,decorate,dcShelf,DECOR_ICONS}=require('./subpage.js');
const SITE=require('./site.config.js');
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const safeJSON=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const icon=n=>`<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-${n}"></use></svg>`;
const labels={article:'文章',photo:'照片',movie:'看过',book:'读过'};
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
function harvest(data){return `<div class="harvest-heading"><label for="harvest-year">年度收获</label><select id="harvest-year" aria-label="收获年份"></select></div><div class="harvest-counts">${Object.entries(labels).map(([k,v])=>`<a data-harvest-kind="${k}" href="harvest/index.html?kind=${k}"><span>${icon({article:'book',photo:'flower',movie:'star',book:'wateringcan'}[k])}${v}</span><b>0</b></a>`).join('')}</div><p class="harvest-note">随已发布内容更新${data.updatedAt?' · 书影音同步 '+esc(data.updatedAt.slice(0,10)):''}</p><script id="harvest-summary" type="application/json">${safeJSON(data.years)}</script>`;}
function scenery(){return `<div class="farm-edge-area"><div class="season-scenery" aria-hidden="true">${['left','right'].map(side=>`<div class="edge-plot ${side}"><span class="edge-lantern">${icon('lantern')}</span><span class="season-plants spring">${icon('tulip')}${icon('flower')}</span><span class="season-plants summer">${icon('sunflower')}${icon('melon')}</span><span class="season-plants autumn">${icon('pumpkin')}${icon('wheat')}</span><span class="season-plants winter">${icon('snowman')}<i class="snow-cap"></i></span></div>`).join('')}</div><div class="farm-pet"><button id="farm-pet" type="button" aria-label="摸摸小鸡">${icon('chicken')}</button><span class="pet-reply" role="status" aria-live="polite"></span></div></div>`;}
function settings(){return `<label class="farm-option"><input type="checkbox" data-farm-option="pet" checked>农场小鸡</label><label class="farm-option"><input type="checkbox" data-farm-option="scenery" checked>季节景物</label>`;}
const css=`
/* Farm modules: preserve pixel palette; restrained motion, readable content. */
#calendar,#ledger,.harvest-page{font-size:12px;line-height:24px}
.calendar-date{display:flex;flex-direction:column;gap:8px;margin:4px 0 20px}
.calendar-date time{font-size:24px;line-height:36px;font-weight:bold;font-variant-numeric:tabular-nums}
.calendar-date span,.calendar-mode,.harvest-note{font-size:12px;line-height:24px}
#calendar .se{font:inherit;cursor:pointer;min-height:60px;display:flex;align-items:center;justify-content:center;gap:12px;color:var(--ink);background:var(--cream);border:2px solid var(--wood-c);padding:8px}
#calendar .se b{font-size:12px;line-height:24px;margin:0}
#calendar .se.on{outline:2px solid var(--wood-c);outline-offset:2px;background:var(--accent,#ffe087);color:#3b2412}
.calendar-mode{margin:16px 0 8px}.calendar-auto{min-height:40px;font:inherit}
.harvest-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.harvest-heading select,.harvest-filters select{font:inherit;line-height:24px;color:var(--ink);background:var(--cream);border:2px solid var(--wood-c);padding:6px;max-width:100%}
.harvest-counts a{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;border-bottom:1px solid var(--wood-c);text-decoration:none;color:var(--ink)}
.harvest-counts a span{display:flex;align-items:center;gap:10px}.harvest-counts a b{font-size:24px;line-height:36px}.harvest-note{margin:16px 0 0;opacity:.85}
.harvest-filters{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}.harvest-filters label{display:flex;align-items:center;gap:8px}
.harvest-list{list-style:none;padding:0;margin:20px 0}.harvest-list li{padding:16px 0;border-bottom:1px solid var(--wood-c)}
.harvest-list a{color:var(--ink);font-weight:bold;line-height:24px}.harvest-list small{display:block;font-size:12px;line-height:24px;opacity:.8}
.harvest-list [hidden],.harvest-empty[hidden]{display:none!important}
.farm-option{display:flex;align-items:center;gap:8px;font-size:12px;line-height:24px;min-height:36px}.farm-option input{width:16px;height:16px;accent-color:var(--wood-c)}
.farm-edge-area{height:110px;position:relative;margin:24px 0 0}.edge-plot{position:absolute;bottom:0;display:flex;align-items:flex-end;gap:8px;pointer-events:none}.edge-plot.left{left:6px}.edge-plot.right{right:6px}
.edge-plot .ic{width:32px;height:32px}.edge-lantern{display:block;align-self:flex-start;margin-bottom:28px;opacity:.65}
html[data-time="night"] .edge-lantern{opacity:1;filter:drop-shadow(0 0 9px #ffbc47)}
.season-plants{display:none;position:relative;align-items:flex-end;gap:4px}
html[data-season="spring"] .season-plants.spring,html[data-season="summer"] .season-plants.summer,html[data-season="autumn"] .season-plants.autumn,html[data-season="winter"] .season-plants.winter{display:flex}
.season-plants.winter{min-width:74px}
.snow-cap{display:block;position:absolute;bottom:-5px;left:-4px;width:74px;height:10px;background:#eefaff;box-shadow:4px -4px 0 #eefaff,-4px 2px 0 #bad7e4}
.farm-pet{position:absolute;bottom:0;left:calc(50% - 30px);width:60px;text-align:center}.farm-pet button{width:60px;height:60px;padding:8px;border:0;background:transparent;cursor:pointer}.farm-pet .ic{width:44px;height:44px}.pet-reply{display:block;min-height:24px;font-size:12px;line-height:24px;color:var(--ink);background:var(--cream);white-space:normal}.pet-reply:empty{visibility:hidden}
.farm-pet button:active{transform:translateY(3px)}.farm-pet button:focus-visible{outline:2px solid var(--wood-c);outline-offset:2px}
html[data-farm-pet="off"] .farm-pet,html[data-farm-scenery="off"] .season-scenery{display:none}
@media(min-width:1400px){.farm-edge-area{height:0;margin:0}.edge-plot{position:fixed;bottom:30px;z-index:3;width:70px;flex-wrap:wrap;gap:0}.edge-plot.left{left:10px}.edge-plot.right{right:10px}.edge-lantern{margin-bottom:8px}.farm-pet{position:fixed;left:15px;bottom:140px;z-index:3}}
@media(max-width:600px){.edge-plot .ic{width:24px;height:24px}.edge-plot{gap:0}.edge-plot.right .edge-lantern{display:none}.calendar-date time{font-size:24px}.harvest-heading{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.farm-pet button{transition:none;animation:none}}
`;
const homeScript=`(function(){
 var root=document.documentElement,years=JSON.parse(document.getElementById('harvest-summary').textContent),select=document.getElementById('harvest-year');
 var current=String(new Date().getFullYear());Array.from(new Set([current].concat(Object.keys(years)))).sort().reverse().forEach(function(y){var o=document.createElement('option');o.value=y;o.textContent=y+' 年';select.appendChild(o)});select.value=current;
 function show(){var counts=years[select.value]||{};document.querySelectorAll('[data-harvest-kind]').forEach(function(a){var k=a.dataset.harvestKind;a.querySelector('b').textContent=counts[k]||0;a.href='harvest/index.html?year='+select.value+'&kind='+k;});}select.addEventListener('change',show);show();
 document.querySelectorAll('[data-farm-option]').forEach(function(input){var key=input.dataset.farmOption;try{input.checked=localStorage.getItem('kx-farm-'+key)!=='off'}catch(e){}function apply(){root.setAttribute('data-farm-'+key,input.checked?'on':'off');}apply();input.addEventListener('change',function(){apply();try{localStorage.setItem('kx-farm-'+key,input.checked?'on':'off')}catch(e){}});});
 var pet=document.getElementById('farm-pet'),reply=document.querySelector('.pet-reply'),n=0,timer;pet.addEventListener('click',function(){var messages=root.dataset.time==='night'?['啾…晚安','小声一点','陪你看星星']:['啾啾！','摸摸头','今天也加油'];reply.textContent=messages[n++%messages.length];clearTimeout(timer);timer=setTimeout(function(){reply.textContent=''},4000);});
})();`;
function build(){
 const data=load(),folder=path.join(__dirname,'../harvest');fs.mkdirSync(folder,{recursive:true});
 const sprite='<svg style="display:none" aria-hidden="true">'+['mailbox','wheat','flower','book','star'].concat(DECOR_ICONS).map(n=>toSymbol(n,ICONS[n])).join('')+'</svg>';
 const rows=data.items.map(x=>`<li data-year="${x.year}" data-kind="${x.kind}"><a href="${esc(/^https:\/\//.test(x.url)?x.url:'../'+x.url)}"${/^https:\/\//.test(x.url)?' target="_blank" rel="noopener"':''}>${esc(x.title)}</a><small>${labels[x.kind]} · ${x.date}</small></li>`).join('');
 const html=`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>收获簿 · ${esc(SITE.name)}</title><link rel="stylesheet" href="../assets-layers.css"><link rel="stylesheet" href="../font.css"><link rel="stylesheet" href="../assets/theme.css"></head><body class="is-article">${decorate()}${sprite}<div class="wrap"><nav class="abarnav"><a class="abtn" href="../${esc(SITE.home)}#ledger">回到农场</a></nav><section class="panel artpage harvest-page"><h2 class="pt">收获簿</h2><h1 class="arttitle">一年里的收获</h1><div class="harvest-filters"><label>年份 <select id="year"><option value="all">所有年份</option>${Object.keys(data.years).sort().reverse().map(y=>`<option value="${y}">${y}</option>`).join('')}</select></label><label>内容 <select id="kind"><option value="all">全部内容</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div><p class="harvest-status" role="status"></p><ul class="harvest-list">${rows}</ul><p class="harvest-empty" hidden>这一年还没有这类记录。</p><p class="artmeta">文章包含本站文章和豆瓣影评；照片不含生成插画。书影音按豆瓣标记日期归档。${data.undated?'另有 '+data.undated+' 条记录缺少有效日期，暂不计入年度汇总。':''}${data.updatedAt?'书影音最近同步 '+esc(data.updatedAt.slice(0,10))+'。':''}</p>${dcShelf()}</section>${bottomBlock('','../')}</div><script>(function(){var q=new URLSearchParams(location.search),year=document.getElementById('year'),kind=document.getElementById('kind'),wanted=q.get('year');if(/^\\d{4}$/.test(wanted)&&![...year.options].some(o=>o.value===wanted)){var o=document.createElement('option');o.value=wanted;o.textContent=wanted;year.appendChild(o)}year.value=[...year.options].some(o=>o.value===wanted)?wanted:'all';kind.value=[...kind.options].some(o=>o.value===q.get('kind'))?q.get('kind'):'all';function render(){var count=0;document.querySelectorAll('.harvest-list li').forEach(function(li){li.hidden=!(year.value==='all'||li.dataset.year===year.value)||!(kind.value==='all'||li.dataset.kind===kind.value);if(!li.hidden)count++});document.querySelector('.harvest-status').textContent=(year.value==='all'?'全部年份':year.value+' 年')+' · '+kind.options[kind.selectedIndex].text+' · '+count+' 条';document.querySelector('.harvest-empty').hidden=count!==0;var next=new URLSearchParams({year:year.value,kind:kind.value});history.replaceState(null,'','?'+next.toString())}year.onchange=kind.onchange=render;render()})();</script>${seasonScript()}</body></html>`;
 fs.writeFileSync(path.join(folder,'index.html'),html);console.log('已生成收获簿：'+data.items.length+' 条有日期记录');return data;
}
module.exports={collect,validDate,load,calendar,harvest,scenery,settings,css,homeScript,build};
