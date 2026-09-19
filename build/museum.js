// 博物馆详情页生成器。
// 输入：豆瓣收藏与 game-data.js 合并后的跨平台游戏快照。
// 输出：museum/index.html。页面为纯静态文件，浏览器端按分类分页，每页 24 件。
const fs = require('fs');
const path = require('path');
const { ICONS, toSymbol } = require('./icons.js');
const SITE = require('./site.config.js');
const { seasonScript, bottomBlock, decorate, dcShelf, DECOR_ICONS } = require('./subpage.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'museum', 'index.html');
const DOUBAN_FILE = path.join(__dirname, 'data', 'douban.json');
const GAMES_FILE = path.join(__dirname, 'data', 'games.json');
const PAGE_SIZE = 24;

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
const ic = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;
const sprite = (names) => '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
  [...new Set(names)].filter((n) => ICONS[n]).map((n) => toSymbol(n, ICONS[n])).join('') + '</svg>';

function read(file) {
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

function normalize() {
  const d = read(DOUBAN_FILE);
  const g = require('./game-data.js').loadGames();
  const albums = require('./album-data.js').load();
  const netease = albums.items.map(x => ({
    id: 'netease-album-' + x.id, kind: 'music', platform: '', title: x.title,
    meta: x.artist, detail: '', image: x.cover + '?param=400y400', url: x.url, source: '网易云 · 收藏专辑'
  }));
  const douban = (d.items || []).filter((x) => x.cover).map((x) => ({
    id: 'douban-' + x.kind + '-' + x.id,
    kind: x.kind,
    platform: x.kind === 'game' ? 'douban' : '',
    title: x.title || '(无题)',
    meta: [x.verb, x.date, x.myRating ? '我的评分 ' + x.myRating + '/5' : ''].filter(Boolean).join(' · '),
    detail: x.subtitle || x.comment || '',
    image: '../assets/covers/' + x.cover,
    url: x.url || '',
    source: '豆瓣'
  }));
  const games = (g.games || []).map((x) => ({
    id: 'heybox-' + x.platform + '-' + (x.sourceId || x.appid),
    platform: x.platform,
    kind: 'game',
    title: x.name || '(无题)',
    meta: [x.platformLabel || x.platform, x.hours != null ? x.hours + ' 小时' : '', x.cleared ? '全成就' : '', x.notOwned ? '非当前拥有' : ''].filter(Boolean).join(' · '),
    detail: '',
    image: x.cover ? '../assets/games/' + x.cover : '',
    url: '',
    source: '小黑盒'
  }));
  return { items: netease.concat(douban, games), douban: d, games: g, albums };
}

function page(payload) {
  const counts = payload.items.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + 1, a), {});
  const tabs = [
    ['all', '全部', payload.items.length], ['book', '书', counts.book || 0],
    ['movie', '影', counts.movie || 0], ['music', '音乐', counts.music || 0],
    ['game', '游', counts.game || 0]
  ];
  const updated = [payload.douban.updatedAt, payload.games.updatedAt, payload.games.libraryUpdatedAt, payload.albums.updatedAt].filter(Boolean).sort().pop();
  const summary = payload.games.summary || {};
  const labels={steam:'Steam',psn:'PSN',xbox_v2:'Xbox',switchall:'Switch',epic:'Epic',douban:'豆瓣收藏'};
  const platformOptions=Object.entries(labels).map(([key,label])=>({key,label,count:payload.items.filter(x=>x.kind==='game'&&x.platform===key).length})).filter(x=>x.count);
  const coverage=Object.entries(payload.games.coverage||{}).map(([key,v])=>`${labels[key]||key} ${v.count} 条`).join('、');
  const gameNote=coverage ? `已读取 ${coverage}；Epic 尚未接入。按平台保留记录，同一游戏跨平台分别计数。` : '游戏为小黑盒生涯拼图样本。';
  return `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>博物馆 · ${esc(SITE.name)}</title>
<link rel="stylesheet" href="../assets-layers.css">
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="../assets/theme.css">
</head>
<body class="is-article is-museum-page">
${sprite(['mailbox', 'book', 'star', 'crystal', 'basket', 'flower', 'wheat'].concat(DECOR_ICONS))}
${decorate()}
<div class="wrap museum-wrap">
  <nav class="abarnav"><a class="abtn" href="../${esc(SITE.home)}#museum">${ic('mailbox', 'sm')}回到农场</a></nav>
  <section class="panel museum-page">
    <h2 class="pt">${ic('book', 'xs')}博物馆${ic('crystal', 'xs')}</h2>
    <h1 class="arttitle">馆藏 ${payload.items.length} 件</h1>
    <p class="artmeta"><a class="douban-mark-link" href="https://www.douban.com/people/${esc(String(payload.douban.uid || '211628276'))}/" target="_blank" rel="noopener">去豆瓣打标</a></p>
    <p class="artmeta">豆瓣书影音 ${payload.douban.total || 0} 件 · 网易云收藏专辑 ${payload.albums.items.length} 张 · 小黑盒游戏记录 ${((payload.games.games || []).length)} 条 · 生涯快照 ${summary.gameCount || 0} 款</p>
    <div class="museum-filters" role="tablist" aria-label="馆藏分类">
      ${tabs.map(([k, label, n], i) => `<button class="museum-filter${i === 0 ? ' on' : ''}" data-kind="${k}" role="tab" aria-selected="${i === 0}">${label}<i>${n}</i></button>`).join('')}
    </div>
    <label class="museum-platform-label" hidden>游戏平台
      <select class="museum-filter museum-platform" aria-label="游戏平台"><option value="all">全部平台</option>${platformOptions.map(x=>`<option value="${x.key}">${esc(x.label)} ${x.count}</option>`).join('')}</select>
    </label>
    <p class="museum-status" aria-live="polite"></p>
    <ul class="museum-grid"></ul>
    <nav class="museum-pager" aria-label="馆藏翻页">
      <button class="museum-page-btn" data-page="prev">上一页</button>
      <span class="museum-page-info"></span>
      <button class="museum-page-btn" data-page="next">下一页</button>
    </nav>
    ${dcShelf()}
    <p class="museum-note">书影音来自豆瓣公开收藏，网易云专辑由桌面工具同步；同一作品在不同来源的记录分别保留。${esc(gameNote)}${updated ? '最近同步 ' + esc(updated.slice(0, 10).replace(/-/g, '.')) + '。' : ''}</p>
  </section>
  ${bottomBlock('', '../')}
</div>
<script id="museum-data" type="application/json">${json(payload.items)}</script>
<script>
(function(){
  var DATA = JSON.parse(document.getElementById('museum-data').textContent);
  var PAGE_SIZE = ${PAGE_SIZE};
  var requested=new URLSearchParams(location.search).get('kind');
  var kind = ['all','book','movie','music','game'].includes(requested) ? requested : 'all', page = 1;
  var platformSelect=document.querySelector('.museum-platform');
  var platformLabel=document.querySelector('.museum-platform-label');
  platformSelect.addEventListener('change',function(){page=1;render();});
  var grid = document.querySelector('.museum-grid');
  var status = document.querySelector('.museum-status');
  var info = document.querySelector('.museum-page-info');
  var prev = document.querySelector('[data-page="prev"]');
  var next = document.querySelector('[data-page="next"]');
  function el(tag, cls, text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function filtered(){ return DATA.filter(function(x){return (kind==='all'||x.kind===kind)&&(kind!=='game'||platformSelect.value==='all'||x.platform===platformSelect.value);}); }
  function render(){
    platformLabel.hidden=kind!=='game';
    document.querySelectorAll('.museum-filter[data-kind]').forEach(function(b){var on=b.dataset.kind===kind;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));});
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.max(1, Math.min(page, pages));
    var shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    grid.textContent = '';
    shown.forEach(function(x){
      var li = el('li','museum-item');li.dataset.kind=x.kind;
      var box = x.url ? el('a','museum-item-link') : el('div','museum-item-link');
      if(x.url){ box.href=x.url; box.target='_blank'; box.rel='noopener'; }
      var poster = el('span','museum-item-poster');
      if(x.image){ var img=document.createElement('img'); img.src=x.image; img.alt=x.title; img.loading='lazy'; img.referrerPolicy='no-referrer'; poster.appendChild(img); }
      
      var tx=el('span','museum-item-text');
      tx.appendChild(el('b','museum-item-title',x.title));
      tx.appendChild(el('i','museum-item-meta',x.meta));
      if(x.detail) tx.appendChild(el('span','museum-item-detail',x.detail));
      tx.appendChild(el('em','museum-item-source',x.source));
      if(x.image) box.appendChild(poster); box.appendChild(tx); li.appendChild(box); grid.appendChild(li);
    });
    status.textContent = '当前 ' + list.length + ' 件 · 第 ' + page + ' / ' + pages + ' 页 · 本页 ' + shown.length + ' 件';
    info.textContent = page + ' / ' + pages;
    prev.disabled = page <= 1; next.disabled = page >= pages;
    document.documentElement.dataset.museumKind = kind;
    document.documentElement.dataset.museumPage = String(page);
  }
  document.querySelectorAll('.museum-filter[data-kind]').forEach(function(b){ b.addEventListener('click',function(){
    kind=b.dataset.kind; page=1;
    document.querySelectorAll('.museum-filter[data-kind]').forEach(function(x){ var on=x===b; x.classList.toggle('on',on); x.setAttribute('aria-selected',String(on)); });
    render();
  }); });
  prev.addEventListener('click',function(){ if(page>1){ page--; render(); scrollTo(0,0); } });
  next.addEventListener('click',function(){ page++; render(); scrollTo(0,0); });
  render();
})();
</script>
${seasonScript()}
</body>
</html>`;
}

function build() {
  const payload = normalize();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, page(payload), 'utf8');
  console.log('已生成 museum/index.html：' + payload.items.length + ' 件馆藏，每页 ' + PAGE_SIZE + ' 件');
  return payload;
}

module.exports = { build, normalize, PAGE_SIZE };
if (require.main === module) build();
