// 平台品牌标志 —— 单色 SVG 路径，viewBox 0 0 24 24。
//
// 为什么不用像素画：16×16 的方块拼不出品牌字形。实测 GitHub 成一坨深棕、
// 小红书/知乎都认不出。
//
// 为什么手绘而不抓官方 SVG：cdn.simpleicons.org 在国内 403（2026-09 实测），
// GitHub raw 能通但单文件 30s+；而且官方 logo 受商标保护，不适合整包分发。
// 这里按公开的视觉特征重画成风格化剪影 —— 一眼认得出，又不是原版文件。
//
// 统一约定：viewBox 0 0 24 24，currentColor 填充，外层用 color 控制颜色。
//
// ⚠️ 画这几个图标最容易踩的坑：在 160px 预览里看着像，缩到招牌上的 20px
// 就认不出。判断标准一律以 20px 为准 —— 直接跑本文件看 _probe-brand.html，
// 或跑 _brand-zoom.js 看放大对照（160px 认形状、20px 认辨识度）。

const BRANDS = {
  // GitHub: 圆脑袋 + 两只耳朵 + 下方两条腿。猫脸靠负空间（fill-rule evenodd）
  github:
    'M12 1.5C5.9 1.5 1 6.4 1 12.5c0 4.9 3.1 9 7.5 10.4.6.1.8-.3.8-.6v-2.1c-3 .7-3.7-1.4-3.7-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.4-.3-4.9-1.2-4.9-5.4 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.3 10.3 0 0 1 5.4 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.2-2.5 5.1-4.9 5.4.4.3.7 1 .7 2v2.9c0 .3.2.7.8.6A11 11 0 0 0 23 12.5c0-6.1-4.9-11-11-11z',

  // 小红书: 「书」字骨架 —— 一竖 + 一横折（围出方框）+ 中竖。
  // 笔画控制在 2.4 宽：第一版做到 3 宽，20px 上笔画间的白缝只有不到半个像素，
  // 整块糊成一个实心方块（放大预览里看着还行，小尺寸直接失败，所以以 20px 为准）。
  xhs:
    'M5.8 3.4h2.6v10.6h9.4v2.6H5.8zM10.4 6.6h8.4v2.6h-2.6v9.4h-2.6V9.2h-3.2zM11.6 12.4h6.2v2.6h-6.2z',

  // B站: 圆角电视机 + 两只天线 + 两个眼睛。电视机形状是它的招牌特征
  bili:
    'M6.3 3.4 8.9 6h6.2l2.6-2.6a1 1 0 1 1 1.4 1.4L17.6 6.3H19A2.5 2.5 0 0 1 21.5 8.8v9A2.5 2.5 0 0 1 19 20.3H5A2.5 2.5 0 0 1 2.5 17.8v-9A2.5 2.5 0 0 1 5 6.3h1.4L4.9 4.8a1 1 0 0 1 1.4-1.4zM9 10.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm6 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',

  // 知乎: 左边「知」= 一横（矢字头）+ 一竖钩；右边「乎」= 一横（爫字头）
  // + 一竖 + 一横（中间的丷）。
  // 字形骨架这条路走不通 —— 汉字笔画一拆散就是几根抽象横竖，谁也对不上号。
  // 改用平台自己的视觉特征：一个方框 + 右下角伸出的对话尖角（问答社区的「说」）。
  zhihu:
    'M2.6 3.4h18.8a.8.8 0 0 1 .8.8v12.6a.8.8 0 0 1-.8.8h-3.6v2.7c0 .5-.6.7-.9.4l-3.1-3.1H2.6a.8.8 0 0 1-.8-.8V4.2a.8.8 0 0 1 .8-.8zm3.1 4.2h9.8V10h-9.8zm0 3.1h12.6v2.4H5.7z',

  // 豆瓣: 「豆」字骨架 —— 上横 + 中间的「口」（方框，用挖空留出）+ 下方两点。
  // 豆瓣 logo 本身就是这个字，用方形笔画比画电影/书更直接。
  // 两点做成方点而不是圆点：20px 上圆形会糊成噪点，方块才留得住形状。
  douban:
    'M2.6 3.6h18.8v2.8H2.6zM6.4 8.4h11.2v8.4H6.4zm2.6 2.6v3.2h6v-3.2zM4.6 19.4h5v2.4h-5zM14.4 19.4h5v2.4h-5z',

  // 邮箱: 信封（圆角 + 折角）
  mail:
    'M3.5 5h17A1.5 1.5 0 0 1 22 6.5v11A1.5 1.5 0 0 1 20.5 19h-17A1.5 1.5 0 0 1 2 17.5v-11A1.5 1.5 0 0 1 3.5 5zm.9 2.2v.3l7.6 5 7.6-5v-.3H4.4zm15.6 2.4-7.4 4.9a1 1 0 0 1-1.2 0L4 9.6v7.2h16V9.6z',

  // 微信: 两个叠在一起的对话气泡（大泡 + 小泡，各自带一对眼睛）。
  // 微信 logo 的辨识核心是「双气泡 + 四只眼睛」，不是气泡本身 ——
  // 只画一个气泡会跟普通聊天气泡混掉。这里把大泡放左上、小泡压右下，
  // 两个泡各留两只方眼睛；眼睛一律用方块（20px 上圆点会糊成噪点）。
  wechat:
    'M9.1 2.4c-4 0-7.2 2.7-7.2 6.1 0 1.9 1 3.6 2.6 4.7l-.7 2.1 2.4-1.2c.9.3 1.9.4 2.9.4h.5a5.6 5.6 0 0 1 4.9-3.1c2.6 0 4.8 1.5 5.5 3.6 1.3-1 2.1-2.4 2.1-4 0-3.4-3.2-6.1-7.2-6.1-4 0-7.2 2.7-7.2 6.1zM6.2 5.7a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm5.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM15.9 12c-3.3 0-6 2.2-6 4.9 0 2.7 2.7 4.9 6 4.9.7 0 1.4-.1 2-.3l2 1-.6-1.7c1.4-.9 2.3-2.3 2.3-3.9 0-2.7-2.7-4.9-5.7-4.9zm-2.2 2.8a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm4.4 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z'
};

// 每个品牌的惯用色（浅色底上用名牌色，深色底上会被 CSS 覆盖）
const BRAND_COLOR = {
  github: '#24292F',
  xhs: '#FF2442',
  bili: '#00A1D6',
  zhihu: '#0084FF',
  douban: '#2E963D',
  mail: '#E8B93B',
  wechat: '#07C160'
};

const brandIcon = (k) =>
  BRANDS[k]
    ? `<svg class="bico" viewBox="0 0 24 24" aria-hidden="true"><path d="${BRANDS[k]}" fill="currentColor"/></svg>`
    : '';

module.exports = { BRANDS, BRAND_COLOR, brandIcon };

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const keys = Object.keys(BRANDS);
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<style>
body{margin:0;padding:24px;background:#FFF8E7;font-family:'Segoe UI','Microsoft YaHei',sans-serif;color:#2B1D0E}
h1{font-size:15px;margin:0 0 14px}
.grid{display:flex;flex-wrap:wrap;gap:14px}
.cell{width:150px;padding:14px;background:#F7E9C8;border:3px solid #2B1D0E;text-align:center}
.cell.dark{background:#3A2A1A;color:#FFF8E7;border-color:#2B1D0E}
.bico{width:40px;height:40px;display:block;margin:0 auto 8px}
.nm{font-size:12px;font-family:monospace}
.row2{display:flex;gap:6px;justify-content:center;margin-top:8px;align-items:flex-end}
.bico.s{width:20px;height:20px;margin:0}
.bico.m{width:28px;height:28px;margin:0}
</style></head><body>
<h1>平台品牌 · 路径 SVG（浅底 / 深底 / 三档尺寸）</h1>
<div class="grid">
${keys.map((k) => `
  <div class="cell">
    ${brandIcon(k).replace('class="bico"', 'class="bico" style="color:' + BRAND_COLOR[k] + '"')}
    <div class="nm">${k}</div>
  </div>
  <div class="cell dark">
    ${brandIcon(k).replace('class="bico"', 'class="bico" style="color:#FFF8E7"')}
    <div class="nm">深底</div>
    <div class="row2">
      ${[20, 28].map((z) => brandIcon(k).replace('class="bico"', `class="bico s" style="width:${z}px;height:${z}px;color:#FFF8E7"`)).join('')}
    </div>
  </div>`).join('')}
</div>
</body></html>`;
  fs.writeFileSync(path.join(__dirname, '_probe-brand.html'), html, 'utf8');
  console.log('已生成 _probe-brand.html，品牌 ' + keys.length + ' 个');
}
