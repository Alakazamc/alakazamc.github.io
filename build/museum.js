// 博物馆详情页生成器。
// 输入：data/douban.json（全量书影音）+ data/games.json（小黑盒跨平台游戏）
// 输出：museum/index.html。页面为纯静态文件，浏览器端按分类分页，每页 24 件。
const fs = require('fs');
const path = require('path');
const { ICONS, toSymbol } = require('./icons.js');
const SITE = require('./site.config.js');
const { seasonScript, bottomBlock } = require('./subpage.js');

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
  const g = read(GAMES_FILE);
  const douban = (d.items || []).filter((x) => x.cover).map((x) => ({
    id: 'douban-' + x.kind + '-' + x.id,
    kind: x.kind,
    title: x.title || '(无题)',
    meta: [x.verb, x.date, x.myRating ? '我的评分 ' + x.myRating + '/5' : ''].filter(Boolean).join(' · '),
    detail: x.subtitle || x.comment || '',
    image: '../assets/covers/' + x.cover,
    url: x.url || '',
    source: '豆瓣'
  }));
  const games = (g.games || []).map((x) => ({
    id: 'heybox-' + x.appid,
    kind: 'game',
    title: x.name || '(无题)',
    meta: [x.platformLabel || x.platform, x.hours != null ? x.hours + ' 小时' : '', x.cleared ? '全成就' : ''].filter(Boolean).join(' · '),
    detail: '',
    image: x.cover ? '../assets/games/' + x.cover : '',
    url: '',
    source: '小黑盒'
  }));
  return { items: douban.concat(games), douban: d, games: g };
}

function page(payload) {
  const counts = payload.items.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + 1, a), {});
  const tabs = [
    ['all', '全部', payload.items.length], ['book', '书', counts.book || 0],
    ['movie', '影', counts.movie || 0], ['music', '音', counts.music || 0],
    ['game', '游', counts.game || 0]
  ];
  const updated = [payload.douban.updatedAt, payload.games.updatedAt].filter(Boolean).sort().pop();
  const summary = payload.games.summary || {};
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
${sprite(['mailbox', 'book', 'star', 'crystal', 'basket', 'flower', 'wheat'])}
<div class="wrap museum-wrap">
  <nav class="abarnav"><a class="abtn" href="../${esc(SITE.home)}#museum">${ic('mailbox', 'sm')}回到农场</a></nav>
  <section class="panel museum-page">
    <span class="pt">${ic('book', 'xs')}博物馆${ic('crystal', 'xs')}</span>
    <h1 class="arttitle">馆藏 ${payload.items.length} 件</h1>
    <p class="artmeta">豆瓣书影音 ${payload.douban.total || 0} 件 · 小黑盒展出 ${((payload.games.games || []).length)} 款 · 游戏生涯 ${summary.gameCount || 0} 款</p>
    <div class="museum-filters" role="tablist" aria-label="馆藏分类">
      ${tabs.map(([k, label, n], i) => `<button class="museum-filter${i === 0 ? ' on' : ''}" data-kind="${k}" role="tab" aria-selected="${i === 0}">${label}<i>${n}</i></button>`).join('')}
    </div>
    <p class="museum-status" aria-live="polite"></p>
    <ul class="museum-grid"></ul>
    <nav class="museum-pager" aria-label="馆藏翻页">
      <button class="museum-page-btn" data-page="prev">上一页</button>
      <span class="museum-page-info"></span>
      <button class="museum-page-btn" data-page="next">下一页</button>
    </nav>
    <p class="museum-note">书影音来自豆瓣公开收藏；游戏来自小黑盒生涯拼图（按时长排序的 20 款）。${updated ? '最近同步 ' + esc(updated.slice(0, 10).replace(/-/g, '.')) + '。' : ''}</p>
  </section>
  ${bottomBlock('', '../')}
</div>
<script id="museum-data" type="application/json">${json(payload.items)}</script>
<script>
(function(){
  var DATA = JSON.parse(document.getElementById('museum-data').textContent);
  var PAGE_SIZE = ${PAGE_SIZE};
  var kind = 'all', page = 1;
  var grid = document.querySelector('.museum-grid');
  var status = document.querySelector('.museum-status');
  var info = document.querySelector('.museum-page-info');
  var prev = document.querySelector('[data-page="prev"]');
  var next = document.querySelector('[data-page="next"]');
  function el(tag, cls, text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function filtered(){ return kind === 'all' ? DATA : DATA.filter(function(x){ return x.kind === kind; }); }
  function render(){
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.max(1, Math.min(page, pages));
    var shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    grid.textContent = '';
    shown.forEach(function(x){
      var li = el('li','museum-item');
      var box = x.url ? el('a','museum-item-link') : el('div','museum-item-link');
      if(x.url){ box.href=x.url; box.target='_blank'; box.rel='noopener'; }
      var poster = el('span','museum-item-poster');
      if(x.image){ var img=document.createElement('img'); img.src=x.image; img.alt=x.title; img.loading='lazy'; poster.appendChild(img); }
      else { poster.appendChild(el('span','museum-item-empty','无封面')); }
      var tx=el('span','museum-item-text');
      tx.appendChild(el('b','museum-item-title',x.title));
      tx.appendChild(el('i','museum-item-meta',x.meta));
      if(x.detail) tx.appendChild(el('span','museum-item-detail',x.detail));
      tx.appendChild(el('em','museum-item-source',x.source));
      box.appendChild(poster); box.appendChild(tx); li.appendChild(box); grid.appendChild(li);
    });
    status.textContent = '当前 ' + list.length + ' 件 · 第 ' + page + ' / ' + pages + ' 页 · 本页 ' + shown.length + ' 件';
    info.textContent = page + ' / ' + pages;
    prev.disabled = page <= 1; next.disabled = page >= pages;
    document.documentElement.dataset.museumKind = kind;
    document.documentElement.dataset.museumPage = String(page);
  }
  document.querySelectorAll('.museum-filter').forEach(function(b){ b.addEventListener('click',function(){
    kind=b.dataset.kind; page=1;
    document.querySelectorAll('.museum-filter').forEach(function(x){ var on=x===b; x.classList.toggle('on',on); x.setAttribute('aria-selected',String(on)); });
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
