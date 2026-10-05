// 星露谷像素画素材 —— 2026-09-19 起的装饰层，V20 第 ⑤ 批起只剩素材本身。
//
// V20 把整页装饰（远景建筑、池塘、飞鸟、小院、作物架、石板路、页脚农场、藤柱）连同它们的 CSS 全部删了
// （第 13.3 节）。这里只导出两处还在用的原始 SVG：
//   · og.js 的分享卡片：HOUSE、MILL、HAY、BARREL、POND、BIRD；
//   · skin-scenes.js 的农场舞台场景：HOUSE、MILL、POND（风车与炊烟动画在 skin-scenes.js 里，作用域 .skin-art[data-scene="farm"]）。
// 素材上的 dc-smoke／dc-blade／dc-ripple／dc-wing 类名在没有对应 CSS 的地方就是静态的，正合适。

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

// ---------- 建筑：农舍 / 风车 ----------
// 全部固定配色（星露谷农舍本来就是红顶木墙），昼夜和季节由使用方整体调色，
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

// ---------- 小件：干草堆 / 木桶 ----------
const HAY = S('0 0 44 34', 44, 'dc-hay', [
  ellipsePix(22, 26, 20, 8, '#8B5A2B'),
  R(4, 22, 36, 10, '#E8C86A'), R(4, 22, 36, 2, '#C9A84A'),
  R(8, 14, 28, 8, '#F5D259'), R(8, 14, 28, 2, '#D9B44E'),
  R(13, 8, 18, 7, '#FAE39A'),
  R(10, 26, 24, 1, '#C9A84A'), R(8, 30, 28, 1, '#C9A84A')
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

module.exports = { HOUSE, MILL, POND, HAY, BARREL, BIRD };
