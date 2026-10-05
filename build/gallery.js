// 相馆页面生成器：只读 build/data/gallery.json，生成 gallery/index.html。
// 复用站点的配置 / 图标 / 子页面逻辑 / 样式，保证和全站同一套皮。
//
// 布局核心：「构建期只分行，宽度交给 CSS 按比例伸缩」（V20 第 7.2 节）。摄影作品不裁剪：
// 构建期按 1440 屏的排版宽决定每行放哪几张；满行每张 flex-grow 与宽高比成正比、基准为 0，
// 任何宽度下都恰好铺满且等高；最后一行不拉伸，基准是相对容器的百分比，左对齐。
//
// 灯箱：自己写的原生 JS/CSS，零依赖。点图开大图，Esc / 点背景 / 关闭按钮退出，
// 左右箭头与键盘切换，显示说明与日期，做焦点管理与 body 滚动锁定。
// 刻意不用圆角、不用半透明毛玻璃 —— 纸卡材质。
const fs = require('fs');
const path = require('path');
const { ICONS, toSymbol } = require('./icons.js');
const SITE = require('./site.config.js');
const { seasonScript, bottomBlock, CHROME_ICONS, metaLine, shareScript, sitebar, skinHead, themeHref } = require('./subpage.js');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'data', 'gallery.json');
const OUT = path.join(ROOT, 'gallery', 'index.html');

// 这几个数从 CSS 推导：1440 屏 .wrap 内容宽 = 1440 − 120 − 2 × 24 = 1272（V20 第 5.2 节）；
// .gal-card 是纸卡，1px 边 + 24 内边距，排版宽 = 1272 − 2 − 48 = 1222。
const PAGE_W = 1272;
const CARD_BORDER = 2;   // .gal-card 左右边框各 1px
const CARD_PAD = 48;     // .gal-card 左右内边距各 24px
const GAL = {
  page: PAGE_W,
  gap: 16,                // 列间距
  targetH: 180,          // 目标行高（12 的倍数，避免和字体网格打架）
  container: PAGE_W - CARD_BORDER - CARD_PAD // = 1222，实际排版宽度
};

// 转义：页面里所有外部文本（caption/date/文件名）都过一遍，防 XSS / 标签破损。
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON 内联到脚本里时，把 < 转义成 \u003c，避免 </script> 提前截断脚本。
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
const sprite = (names) => '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
  [...new Set(names)].filter((n) => ICONS[n]).map((n) => toSymbol(n, ICONS[n])).join('') + '</svg>';

// 读取 gallery.json，规整成 { updatedAt, count, items }。文件缺失/损坏都当作空相册，
// 页面照常能生成（显示「相片还没冲洗出来。」），不会让构建挂掉。
function normalize() {
  if (!fs.existsSync(DATA_FILE)) return { updatedAt: '', count: 0, items: [] };
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return { updatedAt: d.updatedAt || '', count: d.count || 0, items: Array.isArray(d.items) ? d.items : [] };
  } catch {
    return { updatedAt: '', count: 0, items: [] };
  }
}

// 构建期等高错列算法。
// 入参 items 已按时间倒序。返回 rows：每行 { items:[{...it, outW, outH}], height, isLast }。
//   · 按宽高比把图往一行累加，累加宽（按目标行高换算）一旦超过容器宽就封口当前行；
//   · 封口时反推「实际行高」=（容器宽 - 间距）/ 各行宽高比之和，使整行恰好铺满；
//   · 最后一行（isLast）不反推，直接保持目标行高，左对齐、不拉伸。
function justifyRows(items, opts) {
  const container = (opts && opts.container) || GAL.container;
  const gap = (opts && opts.gap) || GAL.gap;
  const targetH = (opts && opts.targetH) || GAL.targetH;
  const rows = [];
  let cur = [];        // 当前行待封口的图
  let sumAr = 0;       // 当前行各图宽高比之和
  let curW = 0;        // 当前行在目标行高下的累计宽

  // 封口一行。full=true 表示这是最后一行（保持目标行高，不拉伸铺满）。
  function seal(list, sAr, full) {
    const n = list.length;
    // 满行：用全部宽度反推行高；最后一行：沿用目标行高。
    const H = full ? targetH : (container - (n - 1) * gap) / sAr;
    const cells = list.map((it) => {
      const ar = it.w / it.h;
      return Object.assign({}, it, {
        outW: Math.round(H * ar),
        outH: Math.round(H)
      });
    });
    rows.push({ items: cells, height: Math.round(H), isLast: full });
  }

  for (const it of items) {
    const ar = it.w / it.h;
    const wAtTarget = targetH * ar;
    // 当前行已放不下这张 → 先封口当前行（满行铺满），新图另起一行。
    if (cur.length && curW + gap + wAtTarget > container) {
      seal(cur, sumAr, false);
      cur = [it]; sumAr = ar; curW = wAtTarget;
    } else {
      cur.push(it);
      sumAr += ar;
      curW += (cur.length > 1 ? gap : 0) + wAtTarget;
    }
  }
  if (cur.length) seal(cur, sumAr, true); // 残留的最后一行：目标行高、左对齐
  return rows;
}

// 渲染整页。gallery 数据为空时不渲染灰占位，只给一句提示。
function page(data) {
  const items = data.items;
  const rows = justifyRows(items);

  const rowsHtml = rows.map((row) => {
    const cells = row.items.map((it, i) => {
      // 每个缩图都是 <a> 包 <img>：即使 JS 死掉，点 <a> 也能直接打开大图（href 指向大图）。
      // 满行：flex-grow 与宽高比成正比、基准 0 → 任何宽度都铺满且等高；
      // 末行：基准是 1440 屏 180px 行高对应的容器百分比，只缩不放、左对齐。aspect-ratio 保证不裁切。
      const href = `../assets/gallery/${esc(it.file)}`;
      const src = `../assets/gallery/${esc(it.thumb)}`;
      const caption = esc((it.generated ? '插画 · ' : '') + (it.caption || it.file));
      const date = esc(it.date || '');
      const flex = row.isLast
        ? `0 1 ${(100 * GAL.targetH * it.w / it.h / GAL.container).toFixed(3)}%`
        : `${(it.w / it.h).toFixed(3)} 1 0`;
      return `<a class="gal-item" id="photo-${esc(it.file)}" href="${href}" data-w="${it.w}" data-h="${it.h}" ` +
        `data-caption="${caption}" data-date="${date}" ` +
        // --i 是卡片入场的错开序号（pixel-art.js 的 @keyframes px-card-in），按行内位置从左到右错开
        `style="--i:${i};flex:${flex};aspect-ratio:${it.w}/${it.h}">` +
        `<img src="${src}" width="${it.tw}" height="${it.th}" loading="lazy" alt="${caption}"><span class="gal-caption">${caption}</span></a>`;
    }).join('');
    return `<div class="gal-row">${cells}</div>`;
  }).join('');

  const gallery = items.length
    ? `<div class="gal-rows">${rowsHtml}</div>`
    : `<p class="gal-empty">相片还没冲洗出来。</p>`;

  const upd = data.updatedAt ? data.updatedAt.slice(0, 10) : '';

  return `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>相馆 · ${esc(SITE.name)}</title>
${skinHead()}
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="${themeHref()}">
<style>
/* ===== 相馆专属布局（仅本页生效，不污染全局样式表） =====
   像素字用 12 的倍数；阅读字用 14／16／18，行高 22／26／28（方案第 4 节）。
   阅读字写 font-size／line-height 两个长属性（不用 font: 简写），check-gallery.js 的扫描才看得见。
   页面标题 .gal-title 与 .arttitle 同一条规则，在 gen.js。 */
.gal-card{background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift);
  padding:24px;margin-bottom:32px}
.gal-note{font-size:12px;line-height:24px;color:var(--ink-2);margin:0 0 12px}

/* 错列容器：一行不折行（满行按比例铺满、末行按百分比缩放，都不会超出容器）——
   ⚠️ 不用 overflow-x:auto：这站的规矩是内容不许藏进横向滚动条。 */
.gal-rows{margin:4px 0 8px}
.gal-row{display:flex;gap:16px;margin-bottom:16px;flex-wrap:nowrap}
/* 每张图：1px 细线相纸边、浮起色底，无圆角；悬停只换边色、显示说明，不上浮（内联样式排在 theme.css 之后，
   写位移会压过合并的 :active，V20 第 14.3 节）。尺寸由 flex + aspect-ratio 决定，绝不裁切。 */
.gal-item{display:block;position:relative;min-width:0;height:auto;background:var(--raised);
  border:1px solid var(--line);overflow:hidden;transition:border-color .12s}
.gal-caption{position:absolute;left:0;right:0;bottom:0;background:var(--surface);color:var(--ink);
  font-family:var(--read);font-size:14px;line-height:22px;padding:4px 8px;opacity:0;transition:opacity .15s}
.gal-item:hover .gal-caption,.gal-item:focus-visible .gal-caption{opacity:1}
.gal-item img{display:block;width:100%;height:100%;object-fit:contain;image-rendering:auto}
.gal-item:hover{border-color:var(--edge)}
.gal-empty{font-size:24px;line-height:36px;color:var(--ink-2);padding:24px 0;text-align:center}

/* 窄屏：一行一张，宽度撑满，高度按原图比例（aspect-ratio）。 */
@media (max-width:760px){
  .gal-card{padding:16px}
  .gal-row{display:block}
  .gal-item{width:100%;margin-bottom:16px}
}

/* ===== 灯箱（原生 JS/CSS，无依赖）=====
   纸卡材质，不用圆角、不用半透明毛玻璃。 */
.lb{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center}
.lb[hidden]{display:none}
.lb-backdrop{position:absolute;inset:0;background:#1A1208;opacity:.92}
.lb-stage{position:relative;z-index:1;max-width:94vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;
  background:var(--surface);border:2px solid var(--edge);padding:16px}
.lb-fig{margin:0;display:flex;flex-direction:column;align-items:center;max-width:100%}
.lb-img{max-width:100%;max-height:72vh;width:auto;height:auto;display:block;
  border:1px solid var(--line);background:#000;image-rendering:auto}
.lb-cap{font-size:12px;line-height:24px;margin:12px 0 0;text-align:center;max-width:80vw}
.lb-cap b{font-family:var(--read);font-size:14px;line-height:22px;font-weight:600;color:var(--ink)}
.lb-cap i{font-style:normal;color:var(--ink-2);margin-left:8px;white-space:nowrap}
/* .lb-close / .lb-nav 是 <button>，光标由 theme.css 主规则统一给可点态箭头；
   ⚠️ 这里不要写 cursor:pointer（特异性更高，会把像素光标顶掉）。搪瓷徽章：面色 + 2px 控件边 + 实色落影。 */
.lb-close,.lb-nav{font-family:inherit;color:var(--ink);background:var(--surface);
  border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);
  display:flex;align-items:center;justify-content:center}
.lb-close{position:absolute;top:-16px;right:-16px;width:36px;height:36px;font-size:24px;line-height:1}
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:48px;font-size:36px;line-height:1}
.lb-prev{left:-16px}.lb-next{right:-16px}
.lb-close:hover,.lb-nav:hover{background:var(--raised)}
/* 焦点框交给全局 :focus-visible（墨色 3px）：原来的 --gold 框映射成浮起色后几乎看不见（V20 第 3.6 节）。 */
</style>
</head>
<body class="is-article is-gallery-page">
${sprite(['star'].concat(CHROME_ICONS))}
<div class="wrap">
  ${sitebar({ prefix: '../', back: '#gallery' })}
  <div class="gal-card">
    <h1 class="gal-title">相馆</h1>
    <p class="gal-note">${metaLine(items.length ? ['共 ' + items.length + ' 张作品' + (items.some(it => it.generated) ? '（含 ' + items.filter(it => it.generated).length + ' 张生成插画）' : ''), upd && '更新于 ' + upd] : [])}</p>
    ${gallery}
  </div>
  ${bottomBlock('', '../', { current: 5 })}
</div>

<!-- 灯箱：默认隐藏，由页面底部脚本接管点击 -->
<div class="lb" id="lightbox" hidden>
  <div class="lb-backdrop" data-close="1"></div>
  <div class="lb-stage" role="dialog" aria-modal="true" aria-label="相片查看">
    <button class="lb-close" id="lbClose" aria-label="关闭">×</button>
    <button class="lb-nav lb-prev" id="lbPrev" aria-label="上一张">‹</button>
    <button class="lb-nav lb-next" id="lbNext" aria-label="下一张">›</button>
    <figure class="lb-fig">
      <img class="lb-img" id="lbImg" src="" alt="">
      <figcaption class="lb-cap" id="lbCap"></figcaption>
    </figure>
  </div>
</div>

<script>
(function(){
  // 从 DOM 收集所有相片（大图地址 / 说明 / 日期），灯箱直接在这份列表里前后翻。
  var links = Array.prototype.slice.call(document.querySelectorAll('.gal-item'));
  if (!links.length) return;
  var list = links.map(function(a){
    return { href:a.getAttribute('href'),
             caption:a.getAttribute('data-caption')||'',
             date:a.getAttribute('data-date')||'' };
  });
  var lb = document.getElementById('lightbox');
  var img = document.getElementById('lbImg');
  var cap = document.getElementById('lbCap');
  var btnClose = document.getElementById('lbClose');
  var btnPrev = document.getElementById('lbPrev');
  var btnNext = document.getElementById('lbNext');
  var idx = 0, lastFocus = null;
  var focusables = [btnClose, btnPrev, btnNext];

  function render(){
    var it = list[idx];
    img.src = it.href;
    img.alt = it.caption;
    cap.textContent = '';
    var captionNode = document.createElement('b');
    captionNode.textContent = it.caption;
    cap.appendChild(captionNode);
    if (it.date) {
      var dateNode = document.createElement('i');
      dateNode.textContent = it.date;
      cap.appendChild(dateNode);
    }
  }
  function open(i){
    idx = i; lastFocus = document.activeElement;
    render();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';   // 锁定背景滚动
    btnClose.focus();
    document.addEventListener('keydown', onKey, true);
  }
  function close(){
    lb.hidden = true;
    img.src = '';
    document.body.style.overflow = '';          // 恢复背景滚动
    document.removeEventListener('keydown', onKey, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus(); // 焦点归位
  }
  function step(d){ idx = (idx + d + list.length) % list.length; render(); }
  function onKey(e){
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'Tab') {
      // 焦点陷阱：只在三个控件间循环，Tab / Shift+Tab 都不跑出灯箱。
      var i = focusables.indexOf(document.activeElement);
      if (i === -1) { e.preventDefault(); btnClose.focus(); return; }
      var nxt = e.shiftKey ? (i - 1 + focusables.length) % focusables.length
                           : (i + 1) % focusables.length;
      e.preventDefault(); focusables[nxt].focus();
    }
  }
  links.forEach(function(a, i){
    a.addEventListener('click', function(e){
      e.preventDefault();   // JS 正常时不开跳转，改开灯箱；JS 挂了则 <a> 直接开大图
      open(i);
    });
  });
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function(){ step(-1); });
  btnNext.addEventListener('click', function(){ step(1); });
  // 点背景（遮罩 / 舞台空白处）关闭。
  lb.addEventListener('click', function(e){
    if (e.target.hasAttribute('data-close')) close();
  });
})();
</script>
${seasonScript()}
${shareScript()}
</body>
</html>`;
}

// 写文件入口。
function build() {
  const data = normalize();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, page(data), 'utf8');
  const upd = data.updatedAt ? data.updatedAt.slice(0, 10) : '—';
  console.log(`已生成 gallery/index.html：${data.items.length} 张相片 · 更新 ${upd}`);
  return data;
}

module.exports = { build, normalize, justifyRows };

// 独立执行（node build/gallery.js）时：先确保数据是最新的，再生成页面。
// 这样一条命令就能把「数据 + 页面」都产出，便于单独跑、也便于排错。
if (require.main === module) {
  try {
    require('./sources/gallery.js').build();
  } catch (e) {
    console.warn('数据源生成失败，沿用已有 gallery.json：' + e.message);
  }
  build();
}
