// 星露谷素材装饰层 —— 2026-09-19，柯西要求「大量堆积星露谷素材」。
//
// 这一层**只做装饰**：全部 pointer-events:none、aria-hidden，不吃点击、不进无障碍树。
//
// 单一来源：CSS 只写在这里，由 gen.js 原样拼进内联 <style>，
// 再自动同步到 assets/theme.css —— 所以文章页 / 子页面也吃到同一份。
// DOM 片段由 gen.js 在几个固定位置插入（背景层、招牌、面板底、页脚）。
// 改装饰只改这个文件。
//
// ⚠️ 两条硬约束（踩过）：
//   1) 装饰不能撑出横向溢出（check-layout 会量整页 scrollWidth）。
//      凡是往外伸的元素，要么待在 overflow:hidden 的容器里，
//      要么用 @media(min-width:…) 只在宽屏出现。
//   2) 装饰里不许带文字 —— 字号检查会扫到，而且像素字体在奇怪字号下会糊。

// ---------- SVG 画块辅助 ----------
// 1 单位 = 1 像素，显示尺寸交给 CSS（配合 shape-rendering:crispEdges 保住硬边）。
const R = (x, y, w, h, f, cls) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${cls ? ` class="${cls}"` : ''}/>`;

// 阶梯山墙：像素画里没有斜线，斜边只能一层层往里收。
// 每层上沿压一条深色边，屋顶才有瓦片感而不是一整块色。
function gable(cx, baseY, baseW, layers, stepH, shrink, fill, edge) {
  let s = '';
  for (let i = 0; i < layers; i++) {
    const w = baseW - shrink * 2 * i;
    if (w <= 0) break;
    const x = cx - w / 2;
    const y = baseY - stepH * (i + 1);
    s += R(x, y, w, stepH, fill) + R(x, y, w, 1, edge);
  }
  return s;
}

// 阶梯椭圆：给水面 / 干草堆用的像素化椭圆（每行算一次宽度）
function ellipsePix(cx, cy, rx, ry, fill, cls) {
  let s = '';
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / (ry * ry);
    if (t <= 0) continue;
    const w = Math.round(rx * Math.sqrt(t));
    if (w <= 0) continue;
    s += R(cx - w, cy + y, w * 2, 1, fill, cls);
  }
  return s;
}

// 木纹横条：墙上每隔 n 像素压一条深色，避免大面积纯色
function planks(x, y, w, h, step, fill) {
  let s = '';
  for (let yy = y + step; yy < y + h; yy += step) s += R(x, yy, w, 1, fill);
  return s;
}

const S = (vb, w, cls, inner) =>
  `<svg class="${cls}" viewBox="${vb}" style="width:${w}px;height:auto;display:block;image-rendering:pixelated;shape-rendering:crispEdges">${inner}</svg>`;

// ---------- 远景建筑：农舍 / 风车 / 水塔 / 温室 / 筒仓 ----------
// 全部固定配色（星露谷农舍本来就是红顶木墙），昼夜和季节靠 CSS filter 整体调，
// 不在每个色块上挂变量 —— presentation attribute 里写 var() 是无效的。

const HOUSE = S('0 -26 128 122', 128, 'dc-house', [
  // 烟囱 + 三团往上飘的烟（烟要飘出画面，所以 viewBox 顶部留了 26 的余量）
  R(86, 6, 12, 26, '#8B7B6A'), R(84, 2, 16, 6, '#6E6257'),
  R(88, -2, 7, 7, '#E8E0D0', 'dc-smoke'),
  R(88, -2, 7, 7, '#E8E0D0', 'dc-smoke b'),
  R(88, -2, 7, 7, '#E8E0D0', 'dc-smoke c'),
  // 屋体
  R(18, 46, 92, 40, '#C08A45'), planks(18, 46, 92, 40, 8, '#A8703A'),
  gable(64, 46, 104, 7, 6, 7, '#E43B44', '#A82A34'),
  // 地基 / 门 / 两扇窗
  R(10, 86, 108, 10, '#8B7B6A'), R(10, 86, 108, 2, '#6E6257'),
  R(50, 62, 26, 3, '#4A2F16'),
  R(52, 64, 22, 22, '#6B4423'), R(70, 74, 3, 3, '#F5D259'),
  R(24, 52, 22, 2, '#6B4423'), R(24, 52, 22, 18, '#9FD3EE'),
  R(34, 52, 2, 18, '#6B4423'), R(24, 60, 22, 2, '#6B4423'),
  R(80, 52, 22, 2, '#6B4423'), R(80, 52, 22, 18, '#9FD3EE'),
  R(90, 52, 2, 18, '#6B4423'), R(80, 60, 22, 2, '#6B4423'),
  // 门前花盆
  R(44, 78, 8, 8, '#C1472F'), R(45, 72, 6, 7, '#4E9440'), R(47, 69, 3, 4, '#E8384F'),
  R(76, 78, 8, 8, '#C1472F'), R(77, 72, 6, 7, '#4E9440'), R(79, 69, 3, 4, '#F5D259')
].join(''));

const MILL = S('0 0 96 96', 96, 'dc-mill', [
  // 塔身：下宽上窄的阶梯梯形
  (() => { let s = ''; for (let i = 0; i < 8; i++) { const w = 48 - 4 * i, x = 48 - w / 2, y = 88 - 6 * (i + 1); s += R(x, y, w, 6, '#C08A45') + R(x, y, w, 1, '#A8703A'); } return s; })(),
  gable(48, 40, 40, 5, 5, 3, '#6B4423', '#4A2F16'),
  R(42, 70, 12, 18, '#6B4423'), R(52, 78, 2, 2, '#F5D259'),
  // 四片叶：整组绕轴心慢转，轴心必须用 style 写（SVG 属性不认 transform-origin）
  `<g class="dc-blade" style="transform-origin:48px 26px">` +
  R(44, 4, 8, 22, '#FDF6E3') + R(44, 4, 8, 4, '#C08A45') +
  R(44, 26, 8, 22, '#FDF6E3') + R(44, 44, 8, 4, '#C08A45') +
  R(26, 22, 22, 8, '#FDF6E3') + R(26, 22, 4, 8, '#C08A45') +
  R(48, 22, 22, 8, '#FDF6E3') + R(66, 22, 4, 8, '#C08A45') +
  R(43, 21, 10, 10, '#6B4423') + R(45, 23, 6, 6, '#F5D259') +
  `</g>`
].join(''));

const TOWER = S('0 0 64 90', 64, 'dc-tower', [
  R(10, 54, 7, 34, '#6B4423'), R(47, 54, 7, 34, '#6B4423'),
  R(10, 66, 44, 4, '#8B5A2B'), R(10, 78, 44, 4, '#8B5A2B'),
  R(6, 54, 52, 5, '#6B4423'),
  R(6, 18, 52, 38, '#C08A45'), planks(6, 18, 52, 38, 8, '#A8703A'),
  R(6, 26, 52, 4, '#6B4423'), R(6, 40, 52, 4, '#6B4423'),
  gable(32, 18, 54, 4, 5, 6, '#8FA3B0', '#6E7C88'),
  R(30, 58, 5, 12, '#8FA3B0'), R(29, 68, 7, 3, '#6E7C88')
].join(''));

const GREEN = S('0 0 112 72', 112, 'dc-green', [
  R(4, 58, 104, 8, '#8B7B6A'), R(4, 58, 104, 2, '#6E6257'),
  R(10, 18, 92, 40, '#BFE9F2'),
  // 玻璃格：竖线 + 横线，白色细条
  (() => { let s = ''; for (let x = 22; x < 100; x += 12) s += R(x, 18, 2, 40, '#EAF7FB'); for (let y = 30; y < 58; y += 12) s += R(10, y, 92, 2, '#EAF7FB'); return s; })(),
  gable(56, 18, 96, 4, 5, 8, '#DFF3F7', '#9FD3EE'),
  R(8, 14, 96, 4, '#6B4423'), R(8, 54, 96, 4, '#6B4423'),
  R(8, 18, 4, 36, '#6B4423'), R(100, 18, 4, 36, '#6B4423'),
  R(50, 38, 14, 20, '#6B4423'), R(62, 48, 2, 2, '#F5D259'),
  // 房里两排作物：一眼看出是温室
  R(16, 48, 26, 6, '#4E9440'), R(20, 42, 6, 7, '#E43B44'), R(30, 42, 6, 7, '#E43B44'),
  R(70, 48, 26, 6, '#4E9440'), R(74, 42, 6, 7, '#F5D259'), R(84, 42, 6, 7, '#F5D259')
].join(''));

const SILO = S('0 0 40 82', 40, 'dc-silo', [
  R(9, 24, 22, 50, '#B8C4CC'), R(14, 24, 2, 50, '#8FA3B0'), R(24, 24, 2, 50, '#8FA3B0'),
  R(9, 24, 22, 2, '#8FA3B0'),
  gable(20, 24, 28, 4, 5, 4, '#8FA3B0', '#6E7C88'),
  R(6, 72, 28, 10, '#6B4423'), R(6, 72, 28, 2, '#4A2F16'),
  R(17, 60, 6, 12, '#6B4423')
].join(''));

// ---------- 池塘：水面 + 波纹 + 芦苇 + 一只鸭子 ----------
const POND = S('0 0 160 66', 160, 'dc-pond-svg', [
  ellipsePix(80, 34, 72, 24, '#3E7FA8'),
  ellipsePix(80, 34, 68, 21, '#4FA3C7'),
  ellipsePix(80, 34, 58, 16, '#7FD3EA'),
  // 三条横向波纹，慢慢往右挪
  R(34, 26, 26, 2, '#CFF0FA', 'dc-ripple'),
  R(74, 36, 30, 2, '#CFF0FA', 'dc-ripple b'),
  R(46, 46, 22, 2, '#CFF0FA', 'dc-ripple c'),
  // 鸭子：身体 + 头 + 嘴 + 眼，+ 一圈水波
  R(94, 26, 18, 9, '#FDF6E3'), R(92, 29, 22, 5, '#FDF6E3'),
  R(108, 19, 9, 9, '#FDF6E3'), R(116, 22, 6, 3, '#E8A33D'), R(112, 21, 2, 2, '#2B1D0E'),
  R(90, 36, 26, 2, '#CFF0FA'),
  // 芦苇三根
  R(8, 20, 3, 30, '#4E9440'), R(7, 12, 5, 10, '#8B5A2B'),
  R(16, 24, 3, 26, '#3E8948'), R(15, 16, 5, 10, '#8B5A2B'),
  R(150, 22, 3, 28, '#4E9440'), R(149, 14, 5, 10, '#8B5A2B')
].join(''));

// ---------- 小件：水井 / 干草堆 / 篝火 / 木桶 ----------
const WELL = S('0 0 40 42', 40, 'dc-well', [
  R(6, 24, 28, 14, '#8B7B6A'), R(6, 24, 28, 3, '#A89880'), R(6, 38, 28, 2, '#6E6257'),
  R(10, 30, 20, 8, '#2E4C63'),
  R(10, 8, 4, 18, '#C08A45'), R(26, 8, 4, 18, '#C08A45'),
  gable(20, 10, 32, 3, 5, 4, '#6B4423', '#4A2F16'),
  R(16, 14, 8, 8, '#C08A45'), R(16, 14, 8, 2, '#6B4423'), R(19, 10, 2, 5, '#8FA3B0')
].join(''));

const HAY = S('0 0 44 34', 44, 'dc-hay', [
  ellipsePix(22, 26, 20, 8, '#8B5A2B'),
  R(4, 22, 36, 10, '#E8C86A'), R(4, 22, 36, 2, '#C9A84A'),
  R(8, 14, 28, 8, '#F5D259'), R(8, 14, 28, 2, '#D9B44E'),
  R(13, 8, 18, 7, '#FAE39A'),
  R(10, 26, 24, 1, '#C9A84A'), R(8, 30, 28, 1, '#C9A84A')
].join(''));

const FIRE = S('0 0 32 34', 32, 'dc-fire-svg', [
  R(4, 24, 24, 4, '#6B4423'), R(7, 20, 18, 4, '#8B5A2B'),
  R(9, 16, 14, 4, '#A8703A'),
  `<g class="dc-fire">` + R(11, 10, 10, 7, '#E8A33D') + R(13, 5, 6, 7, '#F5D259') + R(14, 2, 4, 4, '#E43B44') + `</g>`,
  `<g class="dc-fire b">` + R(9, 13, 4, 4, '#E8A33D') + R(19, 13, 4, 4, '#E8A33D') + `</g>`
].join(''));

const BARREL = S('0 0 28 32', 28, 'dc-barrel', [
  R(4, 4, 20, 24, '#C08A45'), R(4, 4, 20, 2, '#6B4423'), R(4, 26, 20, 2, '#6B4423'),
  R(4, 10, 20, 3, '#8FA3B0'), R(4, 20, 20, 3, '#8FA3B0'),
  R(6, 0, 16, 5, '#4E9440'), R(8, 1, 4, 4, '#7BC96F')
].join(''));

// ---------- 飞鸟 ----------
const BIRD = (w) => `<svg class="dc-bird" style="width:${w}px;height:auto;display:block;image-rendering:pixelated;shape-rendering:crispEdges" viewBox="0 0 16 10">` +
  `<g class="dc-wing">${R(0, 0, 6, 2, '#2B1D0E')}</g>` +
  `<g class="dc-wing b">${R(10, 0, 6, 2, '#2B1D0E')}</g>` +
  R(6, 2, 4, 4, '#2B1D0E') + R(9, 3, 4, 2, '#E8A33D') + R(6, 6, 3, 2, '#2B1D0E') +
  `</svg>`;

// ---------- 图标（复用 build/icons.js 那套 16×16 像素画） ----------
const ic = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;

// 四季作物架：四组都渲染，由 CSS 按当前季节只显示一组
// （生成期是静态的，季节是浏览器端按访客本地时间算的，所以只能四组都在）
const SHELF = {
  spring: ['tulip', 'flower', 'strawberry', 'leaf2', 'sunflower', 'bee', 'mushroom', 'grape'],
  summer: ['sunflower', 'melon', 'tomato', 'corn', 'pepper', 'beehive', 'flower', 'honey'],
  autumn: ['pumpkin', 'eggplant', 'grape', 'mushroom', 'corn', 'acorn', 'wheat', 'ancientfruit'],
  winter: ['crystal', 'snowman', 'ore', 'gem', 'acorn', 'mushroom', 'pot', 'lantern']
};

// ---------- 输出：DOM 片段 ----------
const scene = () => `<div class="dc-scene" aria-hidden="true">${HOUSE}${MILL}${GREEN}${TOWER}${SILO}</div>`;
const pond = () => `<div class="dc-pond" aria-hidden="true">${POND}</div>`;
const panorama = () => `<div class="pixel-window" aria-hidden="true"><div class="window-hills"></div><div class="window-cloud"></div>${HOUSE}${MILL}${POND}<span class="window-tree">${ic('tree')}</span><div class="window-crops">${ic('pumpkin')}${ic('sunflower')}${ic('chicken')}</div></div>`;
const birds = () => `<div class="dc-birds" aria-hidden="true">` +
  `${BIRD(22)}${BIRD(18)}${BIRD(26)}${BIRD(16)}${BIRD(20)}</div>`;

// 招牌两侧的小院：左树木桶蜂箱，右信箱灯笼稻草人。
// ⚠️ 这两簇是往外伸的，只在 ≥1240px 出现（窄屏显示会把整页撑出横向滚动）。
const yard = () => `<div class="dc-yard l" aria-hidden="true">` +
  `<span style="animation-delay:0s">${ic('tree', 'lg')}</span>` +
  `<span style="animation-delay:.4s">${ic('beehive')}</span>` +
  `<span style="animation-delay:.8s">${ic('sunflower')}</span></div>` +
  `<div class="dc-yard r" aria-hidden="true">` +
  `<span style="animation-delay:.2s">${ic('scarecrow', 'lg')}</span>` +
  `<span style="animation-delay:.6s">${ic('lantern')}</span>` +
  `<span style="animation-delay:1s">${ic('mailbox')}</span></div>`;

// 面板底部作物架：一条木板 + 一排当季作物
const shelf = () => `<div class="dc-shelf" aria-hidden="true">` +
  Object.keys(SHELF).map((k) =>
    `<span class="dc-season ${k}">${SHELF[k].map((n, i) =>
      `<i style="animation-delay:${(i * 0.27).toFixed(2)}s">${ic(n)}</i>`).join('')}</span>`).join('') +
  `</div>`;

// 石板小路分隔带：一条土路 + 两侧野花，用来在面板之间换气
const path = () => `<div class="dc-path" aria-hidden="true">` +
  [0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="dc-stone" style="animation-delay:${(i * 0.5).toFixed(2)}s"></i>`).join('') +
  `<span class="dc-path-l">${ic('flower', 'sm')}${ic('leaf2', 'sm')}</span>` +
  `<span class="dc-path-r">${ic('leaf2', 'sm')}${ic('flower', 'sm')}</span></div>`;

// 页脚农场：农舍居中，左右干草堆 / 水井 / 篝火 / 木桶，前面一排栅栏
const farmyard = () => `<div class="dc-farmyard" aria-hidden="true">` +
  `<span class="dc-fy hay">${HAY}</span>` +
  `<span class="dc-fy well">${WELL}</span>` +
  `<span class="dc-fy house">${HOUSE}</span>` +
  `<span class="dc-fy fire">${FIRE}</span>` +
  `<span class="dc-fy barrel">${BARREL}</span>` +
  `<span class="dc-fy barrel b">${BARREL}</span>` +
  `</div><div class="dc-fence" aria-hidden="true"></div>`;

// 两侧藤柱：只在 ≥1400px 出现，绕着主内容区站两根木柱，柱上缠藤、挂灯笼
const posts = () => `<div class="dc-post l" aria-hidden="true">` +
  `${ic('lantern', 'lg')}${ic('leaf2')}${ic('flower')}${ic('leaf2')}${ic('mushroom')}</div>` +
  `<div class="dc-post r" aria-hidden="true">` +
  `${ic('lantern', 'lg')}${ic('leaf2')}${ic('flower')}${ic('leaf2')}${ic('acorn')}</div>`;

// ---------- 输出：CSS ----------
// ⚠️ 这段字符串活在 gen.js 的模板字符串里，注释里不能出现反引号。
const css = `
/* ===== 星露谷素材装饰层（build/decor.js） ===== */
.dc-scene,.dc-pond,.dc-birds,.dc-yard,.dc-shelf,.dc-path,.dc-farmyard,.dc-fence,.dc-post{
  pointer-events:none}
/* ---- 远景建筑群：挂在**视口**顶部一带（42vh～58vh），被招牌/控制面板压住一部分。
   这一条是试出来的，不是拍脑袋：做成"跟着页面滚"的绝对定位时它坐在
   min-height:100vh 的天空带上，而那一段永远在首屏之外 —— 也就是要么
   用户滚到底才看得到（那时它又盖在页脚附近没意义），要么第一屏就挡住招牌。
   挂视口之后它成了首屏正中的远景，控制条和招牌把它上半截压住，正好是
   星露谷里那种"屋舍在远处、告示牌在近处"的层次。 */

/* ⚠️ overflow:hidden 是**必须**的：最靠边的筒仓 / 温室会伸出视口几像素，
   body 自己虽然开着 overflow-x:hidden、但它挡不住由它自己产生的溢出，
   于是 documentElement.scrollWidth 会比视口大十几像素 ——
   表现为手机上整页能往右拖一小格。check-layout 的横向溢出那条守的就是它。 */
.dc-scene{position:fixed;left:0;right:0;top:42vh;height:16vh;z-index:1;overflow:hidden}
.dc-scene svg{position:absolute;bottom:0;height:auto}
.dc-house{left:4%}
.dc-mill{left:22%}
.dc-green{left:60%}
.dc-tower{left:77%}
.dc-silo{left:89%}
html[data-time="night"] .dc-scene{filter:brightness(.42) saturate(.6)}
html[data-season="winter"] .dc-scene{filter:brightness(1.05) saturate(.45)}
html[data-season="autumn"] .dc-scene{filter:saturate(1.12) hue-rotate(-5deg)}
@media(max-width:1180px){.dc-green,.dc-silo{display:none}}
@media(max-width:820px){.dc-tower{display:none}.dc-house{width:96px}.dc-mill{width:74px}}
.dc-smoke{animation:dc-smoke 4.4s linear infinite;transform-origin:center}
.dc-smoke.b{animation-delay:1.5s}.dc-smoke.c{animation-delay:3s}
@keyframes dc-smoke{0%{transform:translate(0,0) scale(.8);opacity:.5}
  100%{transform:translate(12px,-28px) scale(1.7);opacity:0}}
.dc-blade{animation:dc-spin 16s linear infinite}
@keyframes dc-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}

/* ---- 池塘：压在近景草地上，靠右 ---- */
/* 池塘稍微出画是故意的（水边不该齐刷刷切断），但**右边必须留出容身的位置**：
   它贴在视口右边缘，往右伸多少，整页就能往右拖多少。 */
.dc-pond{position:fixed;right:0;bottom:2vh;width:220px;z-index:1;overflow:hidden}
.dc-pond svg{width:100%;height:auto;display:block}
@media(max-width:820px){.dc-pond{width:150px}}
html[data-time="night"] .dc-pond{filter:brightness(.5) saturate(.7)}
html[data-season="winter"] .dc-pond{filter:hue-rotate(-12deg) brightness(1.1) saturate(.5)}
.dc-ripple{animation:dc-ripple 6s ease-in-out infinite}
.dc-ripple.b{animation-delay:2s}.dc-ripple.c{animation-delay:4s}
@keyframes dc-ripple{0%,100%{transform:translateX(0);opacity:.5}50%{transform:translateX(14px);opacity:1}}

/* ---- 飞鸟：从头顶斜着飞过 ---- */
.dc-birds{position:fixed;left:0;top:12vh;width:100%;height:70px;z-index:1;overflow:hidden}
.dc-bird{position:absolute;animation:dc-fly linear infinite}
.dc-bird:nth-child(1){top:0;animation-duration:52s;animation-delay:-6s}
.dc-bird:nth-child(2){top:16px;animation-duration:64s;animation-delay:-24s}
.dc-bird:nth-child(3){top:8px;animation-duration:58s;animation-delay:-40s}
.dc-bird:nth-child(4){top:26px;animation-duration:70s;animation-delay:-14s}
.dc-bird:nth-child(5){top:20px;animation-duration:61s;animation-delay:-52s}
@keyframes dc-fly{from{transform:translateX(-14vw) translateY(0)}
  50%{transform:translateX(48vw) translateY(-10px)}
  to{transform:translateX(114vw) translateY(4px)}}
.dc-wing{animation:dc-flap .56s steps(2) infinite;transform-origin:center}
.dc-wing.b{animation-delay:.28s}
@keyframes dc-flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.3)}}
html[data-time="night"] .dc-birds{opacity:.35}

/* ---- 招牌两侧的小院（只在够宽时出现，避免撑出横向滚动） ---- */
.dc-yard{position:absolute;bottom:-8px;display:flex;gap:7px;align-items:flex-end;z-index:3}
.dc-yard.l{left:-132px}.dc-yard.r{right:-132px}
.dc-yard span{display:block;animation:dc-bob 3.6s ease-in-out infinite}
.dc-yard svg{filter:drop-shadow(2px 2px 0 rgba(43,29,14,.3))}
@media(max-width:1240px){.dc-yard{display:none}}
@keyframes dc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}

/* ---- 面板底部作物架：一条木板，上面摆当季作物 ---- */
.dc-shelf{margin:16px -18px -18px;padding:5px 10px 4px;
  background:linear-gradient(180deg,var(--wood-a) 0%,var(--wood-b) 62%,var(--wood-c) 100%);
  border-top:3px solid var(--wood-c);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.24);
  display:flex;justify-content:center;align-items:flex-end;min-height:26px}
.dc-shelf .dc-season{display:none;align-items:flex-end;gap:7px}
html[data-season="spring"] .dc-shelf .dc-season.spring,
html[data-season="summer"] .dc-shelf .dc-season.summer,
html[data-season="autumn"] .dc-shelf .dc-season.autumn,
html[data-season="winter"] .dc-shelf .dc-season.winter{display:flex}
.dc-shelf i{display:block;animation:dc-bob 3.8s ease-in-out infinite;font-style:normal}
.dc-shelf svg{width:16px;height:16px}
/* 无季节标记时（子页面没跑季节脚本）至少显示春季那组，别留一条空木板 */
html:not([data-season]) .dc-shelf .dc-season.spring{display:flex}

/* ---- 石板小路分隔带 ---- */
.dc-path{display:flex;align-items:center;justify-content:center;gap:9px;margin:0 0 30px;position:relative}
.dc-stone{width:18px;height:7px;background:var(--cream-3);border:2px solid rgba(59,36,18,.45);
  animation:dc-bob 4.2s ease-in-out infinite;opacity:.85}
.dc-path::before{content:'';position:absolute;left:0;right:0;top:50%;height:3px;
  background:repeating-linear-gradient(90deg,rgba(59,36,18,.16) 0 3px,transparent 3px 8px)}
.dc-path-l,.dc-path-r{position:relative;display:flex;gap:3px;align-items:flex-end}
@media(max-width:680px){.dc-stone:nth-child(n+5){display:none}}

/* ---- 页脚农场：农舍 + 水井 + 干草堆 + 篝火 + 木桶 ---- */
.dc-farmyard{display:flex;justify-content:center;align-items:flex-end;gap:26px;margin:6px 0 0;flex-wrap:wrap}
.dc-fy{display:block;animation:dc-bob 4s ease-in-out infinite}

.dc-fy.house svg{width:150px}
.dc-fy.hay svg{width:52px}.dc-fy.well svg{width:48px}
.dc-fy.fire svg{width:38px}.dc-fy.barrel svg{width:32px}
.dc-fy.barrel.b svg{width:26px}
@media(max-width:680px){
  .dc-farmyard{gap:14px}.dc-fy.house svg{width:110px}.dc-fy.well,.dc-fy.barrel.b{display:none}
}
.dc-fire{animation:dc-flicker .42s steps(2) infinite;transform-origin:center bottom}
.dc-fire.b{animation-duration:.31s}
@keyframes dc-flicker{0%,100%{transform:scaleY(1) scaleX(1)}
  50%{transform:scaleY(1.18) scaleX(.9)}}
/* 栅栏：横档 + 竖条，纯渐变拼出来，不用图 */
.dc-fence{height:20px;margin:6px -16px 10px;
  background:
    repeating-linear-gradient(90deg,var(--wood-c) 0 6px,transparent 6px 26px),
    linear-gradient(180deg,transparent 0 5px,var(--wood-b) 5px 9px,transparent 9px 13px,var(--wood-b) 13px 17px,transparent 17px);
  opacity:.85}
html[data-time="night"] .dc-farmyard{filter:brightness(.6)}

/* ---- 两侧藤柱：只在超宽屏出现，站在主内容区外面 ---- */
.dc-post{position:absolute;top:130px;width:30px;display:none;flex-direction:column;
  align-items:center;gap:8px;padding-top:8px;
  background:repeating-linear-gradient(180deg,var(--wood-b) 0 8px,var(--wood-a) 8px 12px);
  border:3px solid var(--ink);box-shadow:0 0 0 3px var(--wood-c)}
.dc-post svg{filter:drop-shadow(1px 1px 0 rgba(43,29,14,.35))}
.dc-post.l{left:-58px}.dc-post.r{right:-58px}

.dc-post .ic:first-child{animation:dc-bob 3.2s ease-in-out infinite}

@media(prefers-reduced-motion:reduce){
  .dc-smoke,.dc-blade,.dc-bird,.dc-wing,.dc-ripple,.dc-fire,.dc-fy,.dc-shelf i,.dc-yard span,.dc-stone{
    animation:none!important}
}
`;

module.exports = {
  css, scene, pond, panorama, birds, yard, shelf, path, farmyard, posts,
  // 原始 SVG 件也一并导出：og.js 的分享卡片要复用同一批像素画（单一来源，
  // 不在 og.js 里另画一套）。注意它们自带 `style="width:NNNpx;height:auto"`，
  // 拿去用的时候按需改这个宽度；class 上的动画类（dc-smoke/dc-blade/dc-ripple/
  // dc-wing/dc-fire）在没有 decor.css 的环境里就是静态的，正合适。
  HOUSE, MILL, GREEN, TOWER, SILO, POND, WELL, HAY, FIRE, BARREL, BIRD
};
