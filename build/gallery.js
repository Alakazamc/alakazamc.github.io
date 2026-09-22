// 相馆页面生成器：只读 build/data/gallery.json，生成 gallery/index.html。
// 复用站点的配置 / 图标 / 子页面逻辑 / 样式，保证和全站同一套皮。
//
// 布局核心：构建期「等高错列」。摄影作品不裁剪，所以每一行里的每张图
// 按比例分配宽度，使整行恰好铺满容器宽，且每张等高 —— 像报纸排版那样错落对齐。
// 最后一行不反推拉伸，保持目标行高、左对齐。
//
// 灯箱：自己写的原生 JS/CSS，零依赖。点图开大图，Esc / 点背景 / 关闭按钮退出，
// 左右箭头与键盘切换，显示说明与日期，做焦点管理与 body 滚动锁定。
// 刻意不用圆角、不用半透明毛玻璃 —— 维持像素木牌质感。
const fs = require('fs');
const path = require('path');
const { ICONS, toSymbol } = require('./icons.js');
const SITE = require('./site.config.js');
const { seasonScript, bottomBlock, decorate, dcShelf, DECOR_ICONS, shareBtn, shareScript } = require('./subpage.js');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'data', 'gallery.json');
const OUT = path.join(ROOT, 'gallery', 'index.html');

// 页面列宽 820（任务给定）。justify 算法需要的「实际排版宽」是 820 减去卡片边框与内边距，
// 这里显式从 820 推导出来，既守住 820 的设计值，又不会出现横向滚动条。
const PAGE_W = 820;
const CARD_BORDER = 4;   // .gal-card 左右边框各 4px
const CARD_PAD = 24;     // .gal-card 左右内边距各 12px
const GAL = {
  page: PAGE_W,
  gap: 16,                // 列间距
  targetH: 180,          // 目标行高（12 的倍数，避免和字体网格打架）
  container: PAGE_W - CARD_BORDER - CARD_PAD // = 788，实际排版宽度
};

// 转义：页面里所有外部文本（caption/date/文件名）都过一遍，防 XSS / 标签破损。
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON 内联到脚本里时，把 < 转义成 \u003c，避免 </script> 提前截断脚本。
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
const ic = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;
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
      // 内联 width/height/flex-basis 由 justify 算法算好，保证等高且不裁切。
      const href = `../assets/gallery/${esc(it.file)}`;
      const src = `../assets/gallery/${esc(it.thumb)}`;
      const caption = esc((it.generated ? '插画 · ' : '') + (it.caption || it.file));
      const date = esc(it.date || '');
      return `<a class="gal-item" id="photo-${esc(it.file)}" href="${href}" data-w="${it.w}" data-h="${it.h}" ` +
        `data-caption="${caption}" data-date="${date}" ` +
        // --i 是卡片入场的错开序号（pixel-art.js 的 @keyframes px-card-in），按行内位置从左到右错开
        `style="--i:${i};width:${it.outW}px;height:${it.outH}px;flex:0 0 ${it.outW}px">` +
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
<link rel="stylesheet" href="../assets-layers.css">
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="../assets/theme.css">
<style>
/* ===== 相馆专属布局（仅本页生效，不污染全局样式表） =====
   字号 / 行高一律用 12 的倍数（12 / 24 / 36 / 48），不出现 14 / 16 / 18。 */
.gal-card{background:var(--cream);border:2px solid var(--wood-c);
  box-shadow:0 4px 0 rgba(59,36,18,.15);
  padding:24px 12px 18px;margin-bottom:32px}
.gal-title{font-size:36px;line-height:48px;margin:6px 0 12px;word-break:break-word}
.gal-note{font-size:12px;line-height:24px;opacity:.66;margin:0 0 12px}

/* 错列容器：列间 6px 间距。行宽是构建期算好的（正好铺满容器），
   正常情况永不溢出；万一极端情况差一两像素，用折行兜底 ——
   ⚠️ 不用 overflow-x:auto：这站的规矩是内容不许藏进横向滚动条。 */
.gal-rows{margin:4px 0 8px}
.gal-row{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;justify-content:center}
/* 每张图：木色描边 + 落影，无圆角（像素风）。尺寸构建期算好，绝不裁切。 */
.gal-item{display:block;position:relative;background:var(--cream-3);
  border:1px solid var(--wood-c);box-shadow:none;
  overflow:hidden;transition:transform .12s steps(2),box-shadow .12s}
.gal-caption{position:absolute;left:0;right:0;bottom:0;background:var(--cream);color:var(--ink);font-size:12px;line-height:24px;padding:4px 8px;opacity:0;transition:opacity .15s}
.gal-item:hover .gal-caption,.gal-item:focus-visible .gal-caption{opacity:1}
.gal-item img{display:block;width:100%;height:100%;object-fit:contain;image-rendering:auto}
.gal-item:hover{transform:translateY(-3px);box-shadow:0 7px 0 rgba(59,36,18,.34)}
.gal-item:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.gal-empty{font-size:24px;line-height:36px;opacity:.7;padding:24px 0;text-align:center}

/* 窄屏：一行一张，宽度撑满，高度按原图比例自适应。 */
@media (max-width:680px){
  .gal-row{display:block;margin-bottom:16px}
  .gal-item{width:100%!important;height:auto!important;flex:none!important;margin-bottom:16px}
  .gal-item img{height:auto}
}

/* ===== 像素灯箱（原生 JS/CSS，无依赖）=====
   刻意不用圆角、不用半透明毛玻璃 —— 维持像素木牌质感。 */
.lb{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center}
.lb[hidden]{display:none}
.lb-backdrop{position:absolute;inset:0;background:#1A1208;opacity:.92}
.lb-stage{position:relative;z-index:1;max-width:94vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;
  background:var(--cream);border:4px solid var(--ink);box-shadow:0 0 0 4px var(--wood-c),9px 9px 0 0 rgba(0,0,0,.4);padding:18px}
.lb-fig{margin:0;display:flex;flex-direction:column;align-items:center;max-width:100%}
.lb-img{max-width:100%;max-height:72vh;width:auto;height:auto;display:block;
  border:3px solid var(--ink);background:#000;image-rendering:auto}
.lb-cap{font-size:12px;line-height:24px;margin:12px 0 0;text-align:center;max-width:80vw}
.lb-cap b{font-weight:700}
.lb-cap i{font-style:normal;opacity:.6;margin-left:8px}
/* .lb-close / .lb-nav 是 <button>，光标由 theme.css 主规则统一给可点态箭头；
   ⚠️ 这里不要写 cursor:pointer（特异性更高，会把像素光标顶掉）。 */
.lb-close,.lb-nav{font-family:inherit;color:var(--ink);background:var(--cream-2);
  border:3px solid var(--ink);box-shadow:0 0 0 2px var(--wood-c);
  display:flex;align-items:center;justify-content:center}
.lb-close{position:absolute;top:-18px;right:-18px;width:36px;height:36px;font-size:24px;line-height:1}
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:48px;font-size:36px;line-height:1}
.lb-prev{left:-18px}.lb-next{right:-18px}
.lb-close:hover,.lb-nav:hover{background:var(--gold)}
.lb-close:focus-visible,.lb-nav:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
</style>
</head>
<body class="is-article is-gallery-page">
${decorate()}
${sprite(['mailbox', 'star', 'share'].concat(DECOR_ICONS))}
<div class="artpage">
  <nav class="abarnav"><a class="abtn" href="../${esc(SITE.home)}#gallery">${ic('mailbox', 'sm')}回到农场</a>${shareBtn('sm')}</nav>
  <div class="gal-card">
    <h1 class="gal-title">相馆</h1>
    <p class="gal-note">${items.length ? ('共 ' + items.length + ' 张作品' + (items.some(it => it.generated) ? '（含 ' + items.filter(it => it.generated).length + ' 张生成插画）' : '') + (upd ? ' · 更新于 ' + upd : '')) : ''}</p>
    ${gallery}
  </div>
  ${bottomBlock('', '../')}
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
