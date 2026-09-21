// 把 icons.js 里的图标转成 CSS cursor 用的 data-URI SVG。
//
// cursor: url(...) 的几个硬限制，不注意会静默失效：
//   1. 尺寸超过 32x32 部分浏览器直接忽略（Firefox 尤其严格）
//   2. 必须给热点坐标，否则默认落在左上角，点击位置会偏
//   3. 兜底关键字必须写在最后：url(...) 9 16, auto
//   4. SVG 里的 # 必须编码成 %23，否则整条 data-URI 被当成 fragment 截断
//   5. 光标要有描边，否则浅色天空上看不清
//
// 描边不能按"8 个方向各复制一遍图形"来做 —— 那会把每条 rect 复制 8 次，
// 小鸡就要 1.5 万字符、奶牛 3 万字符，直接塞进 CSS 太重。
// 改用 SVG 自带 stroke：宽 1px、圆角 0，视觉上仍然贴着像素边缘。
const fs = require('fs');
const path = require('path');

const { ICONS, PAL, SIZE } = require('./icons.js');

// 描边色 = 图标里 k 的色值，保证光标的轮廓和站内图标一致
const OUTLINE = PAL.k;

function toCursorSvg(name, pad = 1) {
  const rows = ICONS[name];
  if (!rows) throw new Error('没有这个图标: ' + name);

  const rects = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y].padEnd(SIZE, '.');
    let x = 0;
    while (x < SIZE) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let run = 1;
      while (x + run < SIZE && row[x + run] === ch) run++;
      // 只有轮廓色 k 的块带 stroke；填充色一律不带（见下方说明）
      const attrs = ch === 'k' ? ` stroke="${OUTLINE}" stroke-width=".7" stroke-linejoin="miter"` : '';
      rects.push(
        `<rect x="${x + pad}" y="${y + pad}" width="${run}" height="1" fill="${PAL[ch]}"${attrs}/>`
      );
      x += run;
    }
  }

  const w = SIZE + pad * 2;
  const h = SIZE + pad * 2;
  // shape-rendering=crispEdges 关掉抗锯齿保住像素感。
  //
  // ⚠️ 描边**只加在深色(k)的块上**，白色块一律不描边。
  //    为什么：早先给所有 rect 都加 stroke-width=".7"，
  //    结果白色区域被每一行的描边划出**横向条纹**（放大一眼就看见，很脏）。
  //    而 k 本身就是描边色，只给 k 加 stroke 既得到外轮廓、
  //    又不会污染内部填充。像素图标里 `k` 正是当轮廓用的。
  //
  //    （本项目所有光标图标都遵循"k = 轮廓、其他字母 = 填充"这套约定，
  //     见 icons.js 的 PAL 注释。）
  const body = `<g shape-rendering="crispEdges">${rects.join('')}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

// data-URI 编码：只编码会破坏 CSS 解析的字符，其余原样保留（更短、更好读）
const encode = (svg) =>
  'data:image/svg+xml,' +
  svg
    .replace(/\n\s*/g, '')
    .replace(/"/g, "'")
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23');

// 热点 = 图标坐标 + pad。
//  · 荔宝那几只：热点在"脚尖"，所以 pad=1（画布加了 1px 边距）。
//  · 箭头：热点必须**正好在左上角 (0,0)** —— 鼠标箭头指向哪就点在哪，
//    所以 pad=0、hot=[0,0]。给箭头加 pad 会把热点推离左上角，点击就偏了。
const CURSORS = {
  chicken: { pad: 1, hot: [9, 17] },
  cow: { pad: 1, hot: [9, 17] },
  // 荔宝：16 格 + 上下各 1px padding = 18px 画布。这是浏览器接受的
  // "整数倍里最大的一档"，再多就不被接受了。
  libao: { pad: 1, hot: [8, 16] },
  // 像素箭头：见 icons.js 的 arrow 注释。0 padding 是为了让热点落在 (0,0)。
  arrow: { pad: 0, hot: [0, 0] },
  // 可点态箭头（金黄填充）。和 arrow 形状完全一致、只换填充色，
  // 所以同样 pad=0 / hot=[0,0] —— 两支光标的热点必须一致，
  // 否则划过可点区域时指针会"跳"一下。
  // ⚠️ 这两支必须不同：以前都指向 arrow，用户根本看不出哪里能点
  //    （柯西 2026-09-20 反馈"鼠标有点问题"）。
  arrow_hot: { pad: 0, hot: [0, 0] }
};

const out = {};
for (const [name, cfg] of Object.entries(CURSORS)) {
  const svg = toCursorSvg(name, cfg.pad);
  const uri = encode(svg);
  const [hx, hy] = cfg.hot;
  out[name] = { uri, hot: [hx, hy], size: SIZE + cfg.pad * 2, bytes: uri.length };
  console.log(
    name.padEnd(8),
    (SIZE + cfg.pad * 2) + 'x' + (SIZE + cfg.pad * 2),
    '热点', hx + ',' + hy,
    '体积', uri.length + ' 字符'
  );
}

fs.writeFileSync(path.join(__dirname, '_cursors.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('\n已生成 build/_cursors.json');
module.exports = { toCursorSvg, encode, CURSORS, out };
