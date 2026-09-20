// 分享卡片（og:image）生成器 —— 2026-09-20，柯西「分享卡片图我看不到啊」。
//
// 先说病因，三条全是**静默失败**（页面看着都正常，只有粘贴链接到微信/Twitter
// 才暴露）：
//   1. 微信对 og:image 有约 32KB 的隐形上限，超了不报错，卡片就是没图。
//   2. Twitter 的 summary_large_image 要 1200×630（2:1），比例不对会被裁/缩。
//   3. 原来所有页面共用 assets/preview.png：1440×1100、171KB —— 微信里必然糊掉；
//      而且首页截图当文章卡片，读者也看不出这张卡属于哪篇文章。
//
// 所以这里给每类页面现做一张 1200×630 的像素风卡片：
//   assets/og/og.png       全站默认（首页 / 博客页 / 博物馆 / 工坊 / 相馆 / 收获簿）
//   assets/og/<slug>.png   文章专属 —— 文章没配 cover，或 cover 超过 32KB 时
// 封面本身 ≤32KB 的文章（豆瓣影评大多是）继续用封面，不浪费。
//
// 出图方式：Edge 无头截图一张 1200×630 的 HTML。全部硬边纯色（像素字体按
// 12 的整数倍取字号、装饰是一行一条的 1px 实色块、SVG 走 crispEdges），
// 所以 PNG 极小，能压在微信的上限以内。
//
// 标题字号不拍脑袋：探针把标题按 48/36/24（默认卡再多个 60）各克隆一份量
// 换行后的高度，选能放进面板的最大号；全都放不下直接抛错，不允许悄悄裁字。
//
// ⚠️ 只有本机有 Edge。GitHub Actions 的 runner 上没有，那里只跳过出图
//   （卡片已随仓库提交，seo.js 照常引用）。新增文章在 Actions 里临时用默认卡，
//   本机跑一次 gen.js 就补上专属卡。
// ⚠️ 改版式把 DESIGN +1，manifest 缓存全部作作废重出。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const DC = require('./decor.js');
const { articles } = require('./content.js');
const { esc } = require('./md.js');
const { delFile } = require('./rm.js');
const { measure } = require('./probe-dom.js');   // 复用现成探针（flag 坑都踩过了）

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'og');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const TMP = path.join(ROOT, '_og-card.html');    // probe-dom.js 会在同目录造 _probe-dom.html
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
].find((p) => fs.existsSync(p));
const W = 1200, H = 630;
const OG_LIMIT = 32 * 1024;      // 微信的隐形上限（字节）
const DESIGN = 'og-1';
const FONT = "'FusionPixel','Zpix','Silkscreen',\"Courier New\",ui-monospace,monospace";

// 字体整份内嵌成 data URI：卡片页自包含，出图不依赖网络/缓存，
// 探针等 fonts.ready 也就不会出现"虚拟时钟走完了字体还没到"的假失败。
function inlineFontCss() {
  const css = fs.readFileSync(path.join(ROOT, 'font.css'), 'utf8');
  return css.replace(/url\('\.\/([^']+)'\)/g, (m, file) => {
    const buf = fs.readFileSync(path.join(ROOT, file));
    return `url(data:font/woff2;base64,${buf.toString('base64')})`;
  });
}

// ---------- 像素画小工具（全部整数坐标 → 零抗锯齿 → PNG 才小） ----------

// 像素椭圆：一行一个 1px 高的实色条
function pixEllipse(cx, cy, rx, ry, color) {
  let s = '';
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / (ry * ry);
    if (t <= 0) continue;
    const w = Math.round(rx * Math.sqrt(t));
    if (w <= 0) continue;
    s += `<div class="px" style="left:${Math.round(cx - w)}px;top:${Math.round(cy + y)}px;width:${w * 2}px;height:1px;background:${color}"></div>`;
  }
  return s;
}

// 像素云：四团椭圆叠出来，底部压平
function cloud(cx, cy, s, color) {
  return pixEllipse(cx - 26 * s, cy + 4 * s, 16 * s, 12 * s, color)
       + pixEllipse(cx, cy - 2 * s, 22 * s, 16 * s, color)
       + pixEllipse(cx + 26 * s, cy + 4 * s, 16 * s, 12 * s, color)
       + pixEllipse(cx, cy + 14 * s, 30 * s, 8 * s, color);
}

// 阶梯山脊：一列一列往下伸（多伸 220px 保证盖住画布底部）
function ridge(baseY, amp, step, phase, color) {
  let s = '';
  for (let x = 0; x < W; x += step) {
    const t = 0.5 + 0.5 * Math.sin((x / W) * Math.PI * 2 + phase);
    const h = Math.max(4, Math.round((amp * t) / 4) * 4);
    s += `<div class="px" style="left:${x}px;top:${baseY - h}px;width:${step}px;height:${h + 220}px;background:${color}"></div>`;
  }
  return s;
}

// 把 decor.js 的 SVG 改到指定显示宽度（它们自带 style="width:NNNpx;height:auto"）
function svgAt(svg, w) {
  return svg.replace(/style="width:\d+px;height:auto"/, `style="width:${w}px;height:auto"`);
}

// 地面草丛 + 两株作物
function tufts() {
  let s = '';
  const pts = [[646, 1], [700, 0], [762, 1], [818, 0], [880, 1], [936, 0], [1000, 1], [1058, 0], [1116, 1], [1170, 0]];
  for (const [x, k] of pts) {
    s += `<div class="px" style="left:${x}px;top:${524 + k * 3}px;width:4px;height:10px;background:#C97B2B"></div>`;
    s += `<div class="px" style="left:${x + 8}px;top:${520 + k * 3}px;width:4px;height:14px;background:#C97B2B"></div>`;
  }
  s += `<div class="px" style="left:1092px;top:508px;width:4px;height:18px;background:#4E9440"></div>`
     + `<div class="px" style="left:1088px;top:500px;width:12px;height:10px;background:#E43B44"></div>`;
  s += `<div class="px" style="left:1140px;top:508px;width:4px;height:18px;background:#4E9440"></div>`
     + `<div class="px" style="left:1136px;top:500px;width:12px;height:10px;background:#F5D259"></div>`;
  return s;
}

// ---------- 卡片页面 ----------

function cardHtml(c) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf8">
<style>${inlineFontCss()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:#FFDD8A;font-family:${FONT};color:#3E3124}
.px{position:absolute}
.board{position:absolute;left:56px;top:92px;width:600px;height:448px;padding:36px;
  background:#FFF8E7;border:8px solid #644832;
  box-shadow:inset 0 0 0 4px #E4BF7F,10px 10px 0 rgba(43,29,14,.22);
  display:flex;flex-direction:column}
.label{font-size:24px;line-height:24px;color:#647950;white-space:nowrap}
.slot{flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0}
.title{font-size:${c.cands[0]}px;line-height:1.5;color:#3E3124;overflow-wrap:break-word}
.sub{display:block;font-size:24px;line-height:24px;color:#746149;margin-top:20px}
.divider{height:4px;width:120px;background:#E4BF7F;margin:24px 0}
.foot{font-size:24px;line-height:24px;color:#746149;white-space:nowrap}
</style></head><body>
${pixEllipse(1010, 108, 52, 52, '#FFD23F')}
${cloud(150, 66, 1, '#FFF8E7')}
${cloud(772, 210, 0.8, '#FFF8E7')}
${ridge(470, 30, 16, 0.6, '#E0913A')}
${ridge(506, 22, 14, 2.4, '#C46A22')}
<div class="px" style="left:0;top:524px;width:1200px;height:106px;background:#E8A33D"></div>
<div class="px" style="left:720px;top:311px;width:240px">${svgAt(DC.HOUSE, 240)}</div>
<div class="px" style="left:980px;top:368px;width:150px">${svgAt(DC.MILL, 150)}</div>
<div class="px" style="left:900px;top:550px;width:60px">${svgAt(DC.HAY, 60)}</div>
<div class="px" style="left:640px;top:538px;width:44px">${svgAt(DC.BARREL, 44)}</div>
<div class="px" style="left:610px;top:488px;width:300px">${svgAt(DC.POND, 300)}</div>
${tufts()}
<div class="px" style="left:850px;top:110px">${DC.BIRD(26)}</div>
<div class="px" style="left:918px;top:152px">${DC.BIRD(20)}</div>
<div class="board">
  <div class="label">${esc(c.label)}</div>
  <div class="slot"><div class="title">${esc(c.title)}${c.sub ? `<span class="sub">${esc(c.sub)}</span>` : ''}</div></div>
  <div class="divider"></div>
  <div class="foot">${esc(c.foot)}</div>
</div>
</body></html>`;
}

// ---------- Edge 无头：量标题 / 截图 ----------

const urlOf = (p) => 'file:///' + p.replace(/\\/g, '/');

// 量标题：把各候选字号各克隆一份量换行后的高度，交给 probe-dom.js 跑真浏览器。
// 返回 {avail, width, h:{48:..,36:..,24:..}, fontsOK}
function measureCard(c) {
  fs.writeFileSync(TMP, cardHtml(c), 'utf8');
  const jsFn = 'async function(){await document.fonts.ready;'
    + 'var t=document.querySelector(".title"),slot=document.querySelector(".slot");'
    + 'var r={avail:slot.clientHeight,width:t.clientWidth,h:{},'
    + 'fontsOK:document.fonts.check("48px FusionPixel","柯西Alakazam")'
    + '&&document.fonts.check("24px FusionPixel","代码阅读生活")};'
    + 'var cs=[' + c.cands.join(',') + '];'
    + 'for(var i=0;i<cs.length;i++){var px=cs[i];var c=t.cloneNode(true);'
    + 'c.style.position="absolute";c.style.left="-9999px";c.style.top="0";'
    + 'c.style.visibility="hidden";c.style.width=t.clientWidth+"px";'
    + 'c.style.fontSize=px+"px";c.style.lineHeight=(px*1.5)+"px";'
    + 'document.body.appendChild(c);r.h[px]=c.offsetHeight;document.body.removeChild(c);}'
    + 'return r;}';
  return measure('_og-card.html', jsFn, { width: W, height: H, budget: 8000 });
}

// 截图：flag 组合照抄 _shot-readme.js（那份是验证过像素字体能正确出图的），
// user-data-dir 每次新开一个临时目录，跑完就扔。
function shot(html, out) {
  fs.writeFileSync(TMP, html, 'utf8');
  try { fs.unlinkSync(out); } catch {}
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'kxog-'));
  try {
    execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--force-device-scale-factor=1', '--virtual-time-budget=4500',
      '--user-data-dir=' + ud, '--window-size=' + W + ',' + H,
      '--screenshot=' + out, urlOf(TMP)
    ], { timeout: 180000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } finally {
    try { fs.rmSync(ud, { recursive: true, force: true }); } catch {}
  }
  if (!fs.existsSync(out)) throw new Error('截图没生成：' + out);
}

// 产出校验：PNG、尺寸、字节数。超 32KB 直接红 —— 那就是微信里看不到的那张。
function assertPng(out) {
  const buf = fs.readFileSync(out);
  if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error('产出不是 PNG：' + out);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== W || h !== H) throw new Error(`产出尺寸 ${w}×${h}，应为 ${W}×${H}：${out}`);
  const size = fs.statSync(out).size;
  if (size > OG_LIMIT) throw new Error(`卡片 ${size}B 超过约 32KB 上限：${out}（先减装饰/减色）`);
  return size;
}

function renderCard(c, out) {
  const m = measureCard(c);
  if (m.fontsOK === false) {
    throw new Error('像素字体没加载上（document.fonts.check 为假），出的图会是后备字体：' + c.key);
  }
  const px = c.cands.find((p) => m.h[p] <= m.avail);
  if (px === undefined) {
    throw new Error(`卡片标题放不下（可用 ${m.avail}px，各字号高度 ${JSON.stringify(m.h)}）：${c.title}`);
  }
  shot(cardHtml(Object.assign({}, c, { cands: [px] })), out);
  return px;
}

// ---------- 卡片清单 ----------

// 封面能用（存在且 ≤32KB）的文章不需要专属卡
function coverOk(a) {
  if (!a.cover) return false;
  try {
    const p = path.join(ROOT, a.cover);
    return fs.existsSync(p) && fs.statSync(p).size <= OG_LIMIT;
  } catch { return false; }
}

// 字体文件指纹：换子集/换字体文件后缓存全部作废重出，
// 不然旧图留着旧字形的渲染，而 manifest 还认为它是最新的。
function assetSig() {
  const files = ['font.css', 'fusion-pixel-12px-proportional-zh_hans.woff2', 'assets/fonts/fusion-core.woff2'];
  return files.map((f) => {
    try { return fs.statSync(path.join(ROOT, f)).size; } catch { return 0; }
  }).join('-');
}

function articleCard(a) {
  return {
    key: a.slug,
    sig: [a.title, a.date, a.source, DESIGN, assetSig()].join('|'),
    label: (a.source === 'douban' ? '豆瓣影评' : '文章') + ' · ' + a.date,
    title: a.title,
    sub: '',
    foot: '柯西 Alakazam · alakazamc.github.io',
    cands: [48, 36, 24]
  };
}

function defaultCard() {
  return {
    key: '__default__',
    sig: ['default', DESIGN, assetSig()].join('|'),
    label: '代码 · 阅读 · 生活',
    title: '柯西 Alakazam',
    sub: 'fake it til u make it',
    foot: '欢迎来坐坐 · alakazamc.github.io',
    cands: [60, 48, 36, 24]
  };
}

// ---------- 主流程 ----------

function render() {
  if (!EDGE) {
    console.log('og 卡片：本机没有 Edge，跳过出图（沿用仓库里已提交的卡片）');
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jobs = [defaultCard()].concat(articles().filter((a) => !coverOk(a)).map(articleCard));

  let man = { design: DESIGN, cards: {} };
  try { man = Object.assign(man, JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))); } catch {}
  if (man.design !== DESIGN) man.cards = {};

  const keep = new Set(['og.png']);
  for (const j of jobs) {
    const out = j.key === '__default__' ? path.join(OUT_DIR, 'og.png') : path.join(OUT_DIR, j.key + '.png');
    keep.add(path.basename(out));
    if (man.cards[j.key] === j.sig && fs.existsSync(out)) continue;   // 没变过就复用
    const px = renderCard(j, out);
    man.cards[j.key] = j.sig;
    console.log(`og 卡片：${path.basename(out)}  ${fs.statSync(out).size}B  标题字号 ${px}px`);
  }
  // 文章删掉之后没人用的旧卡，跟着清（不然会一直躺在仓库里还被部署）
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (/\.png$/.test(name) && !keep.has(name)) delFile(path.join(OUT_DIR, name));
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(man, null, 2));
  try { delFile(TMP); } catch {}
}

// seo.js 用：返回站点根相对路径（'' = 连默认卡都没有，调用方自己退回 preview.png）
function ogImagePath(root, article) {
  if (article && article.cover) {
    try {
      const p = path.join(root, article.cover);
      if (fs.existsSync(p) && fs.statSync(p).size <= OG_LIMIT) {
        return '/' + String(article.cover).replace(/^\/+/, '');
      }
    } catch {}
  }
  if (article && fs.existsSync(path.join(root, 'assets', 'og', article.slug + '.png'))) {
    return '/assets/og/' + article.slug + '.png';
  }
  if (fs.existsSync(path.join(root, 'assets', 'og', 'og.png'))) return '/assets/og/og.png';
  return '';
}

module.exports = { render, ogImagePath, OG_LIMIT };
