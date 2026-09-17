// 工坊详情页生成器。
//
// 输入：data/github.json（sources/github.js 拉的仓库 + 语言字节数）
// 输出：workshop/index.html。纯静态，浏览器端按语言筛选 + 分页。
//
// 为什么要单独一页：主页的工坊面板是一整块 `auto-fill` 网格，仓库一多就会
// 把首屏顶得很长。柯西 2026-09-16 要求「工坊也可以点击查看更多」——
// 于是主页只展示最近的一批，全部仓库挪到这里，跟博物馆详情页是同一套做法。
//
// ⚠️ 数据拉不到时**不能报错**：主页那边降级成骨架占位，这里降级成一行说明文字。
// 一条外部数据挂掉不该让整站构建失败（跟 douban / heybox 一样的约定）。
const fs = require('fs');
const path = require('path');
const { ICONS, toSymbol } = require('./icons.js');
const SITE = require('./site.config.js');
const { seasonScript, bottomBlock } = require('./subpage.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'workshop', 'index.html');
const GITHUB_FILE = path.join(__dirname, 'data', 'github.json');

// ⚠️ 每页几个仓库 —— 这个数字有两个约束，改之前都要想清楚：
//   1. **必须能让当前数据真的翻页**。柯西现在 9 个仓库，如果每页 12 个，
//      所有断言都在第 1 页上跑，"翻页坏了" 根本测不出来（检查会假通过）。
//      每页 4 个 → 9 个仓库 = 3 页，翻页/筛选/末页都真被执行到。
//   2. 卡片是 `minmax(268px,1fr)` 的网格，一页 4 个在桌面宽度下是 3 列上下——
//      每页卡片太少会让页面显空，所以不再往下压。
// 仓库数量以后涨到几十个的话，这个值可以提回 12（那时数据自己就能翻页了）。
const PAGE_SIZE = 4;

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

// 语言的小色块用 GitHub 给的颜色；没给就落到一个中性灰，
// 不能让色块消失（否则整列右边会空一格，看起来像渲染坏了）。
function normalize() {
  const g = read(GITHUB_FILE);
  const repos = (g.repos || []).map((r) => ({
    name: r.name,
    description: r.description || '',
    url: r.url || '',
    stars: r.stars || 0,
    pushedAt: r.pushedAt || '',
    language: r.language || '',
    color: r.color || '#8A8A8A',
    topics: r.topics || []
  }));
  return { repos, source: g };
}

function page(payload) {
  const repos = payload.repos;
  const src = payload.source || {};
  const tot = src.totals || {};

  // 筛选标签按「主语言」聚合 —— 这是唯一一个有意义的维度：
  // GitHub 不提供仓库分类，语言是它能给的最接近「这是干什么的」的信号。
  const langCount = repos.reduce((a, r) => {
    const k = r.language || '其他';
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  const langs = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
  const tabs = [['all', '全部', repos.length]].concat(langs.map(([k, n]) => [k, k, n]));

  const updated = (src.updatedAt || '').slice(0, 10).replace(/-/g, '.');

  return `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>工坊 · ${esc(SITE.name)}</title>
<link rel="stylesheet" href="../assets-layers.css">
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="../assets/theme.css">
</head>
<body class="is-article is-workshop-page">
${sprite(['chest', 'gem', 'crystal', 'coin', 'key', 'star', 'wheat', 'flower', 'mailbox'])}
<div class="wrap museum-wrap">
  <nav class="abarnav"><a class="abtn" href="../${esc(SITE.home)}#projects">${ic('mailbox', 'sm')}回到农场</a></nav>
  <section class="panel museum-page">
    <span class="pt">${ic('chest', 'xs')}工坊${ic('crystal', 'xs')}</span>
    <h1 class="arttitle">仓库 ${repos.length} 个</h1>
    <p class="artmeta">主语言 ${langs.length} 种 · ${tot.languages || '—'} 种语言构成 · @${esc(src.user || 'Alakazamc')}${updated ? ' · 最近同步 ' + esc(updated) : ''}</p>
    ${repos.length ? `
    <div class="museum-filters" role="tablist" aria-label="按主语言筛选">
      ${tabs.map(([k, label, n], i) => `<button class="museum-filter${i === 0 ? ' on' : ''}" data-lang="${esc(k)}" role="tab" aria-selected="${i === 0}">${esc(label)}<i>${n}</i></button>`).join('')}
    </div>
    <p class="museum-status" aria-live="polite"></p>
    <ul class="wgrid"></ul>
    <nav class="museum-pager" aria-label="仓库翻页">
      <button class="museum-page-btn" data-page="prev">上一页</button>
      <span class="museum-page-info"></span>
      <button class="museum-page-btn" data-page="next">下一页</button>
    </nav>
    <p class="museum-note">仓库信息来自 GitHub 公开仓库；语言构成按字节数统计，仅供参照（模板/配置多的仓库会失真）。</p>
    ` : `<p class="museum-note">暂时读不到 GitHub 数据。跑一次 <code>node build/sources/github.js</code> 就能恢复。</p>`}
  </section>
  ${bottomBlock('', '../')}
</div>
<script id="workshop-data" type="application/json">${json(repos)}</script>
<script>
(function(){
  var DATA = JSON.parse(document.getElementById('workshop-data').textContent);
  var PAGE_SIZE = ${PAGE_SIZE};
  var lang = 'all', page = 1;
  var grid = document.querySelector('.wgrid');
  var status = document.querySelector('.museum-status');
  var info = document.querySelector('.museum-page-info');
  if (!grid) return;
  var prev = document.querySelector('[data-page="prev"]');
  var next = document.querySelector('[data-page="next"]');
  function el(tag, cls, text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function filtered(){ return lang === 'all' ? DATA : DATA.filter(function(x){ return (x.language || '其他') === lang; }); }
  function render(){
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.max(1, Math.min(page, pages));
    var shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    grid.textContent = '';
    shown.forEach(function(r){
      var li = el('li','wcard');
      var box = r.url ? el('a','wcard-link') : el('div','wcard-link');
      if(r.url){ box.href = r.url; box.target = '_blank'; box.rel = 'noopener'; }
      var head = el('span','wcard-head');
      head.appendChild(el('b','wcard-name', r.name));
      box.appendChild(head);
      box.appendChild(el('span','wcard-desc', r.description || '（还没写简介）'));
      if (r.topics.length){
        var ts = el('span','wcard-topics');
        r.topics.forEach(function(t){ ts.appendChild(el('i','wcard-topic', t)); });
        box.appendChild(ts);
      }
      var foot = el('span','wcard-foot');
      var langBox = el('i','wcard-lang');
      langBox.style.background = r.color || '#8A8A8A';
      foot.appendChild(langBox);
      foot.appendChild(el('em','wcard-langname', r.language || '未标注'));
      if (r.stars) foot.appendChild(el('u','wcard-star', '★ ' + r.stars));
      foot.appendChild(el('span','wcard-date', (r.pushedAt || '').slice(5).replace('-', '.')));
      box.appendChild(foot);
      li.appendChild(box); grid.appendChild(li);
    });
    status.textContent = '当前 ' + list.length + ' 个 · 第 ' + page + ' / ' + pages + ' 页';
    info.textContent = page + ' / ' + pages;
    prev.disabled = page <= 1; next.disabled = page >= pages;
    document.documentElement.dataset.workshopLang = lang;
    document.documentElement.dataset.workshopPage = String(page);
  }
  document.querySelectorAll('.museum-filter').forEach(function(b){ b.addEventListener('click', function(){
    lang = b.dataset.lang; page = 1;
    document.querySelectorAll('.museum-filter').forEach(function(x){ var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    render();
  }); });
  prev.addEventListener('click', function(){ if (page > 1){ page--; render(); scrollTo(0,0); } });
  next.addEventListener('click', function(){ page++; render(); scrollTo(0,0); });
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
  console.log('已生成 workshop/index.html：' + payload.repos.length + ' 个仓库，每页 ' + PAGE_SIZE + ' 个');
  return payload;
}

module.exports = { build, normalize, PAGE_SIZE };
if (require.main === module) build();
