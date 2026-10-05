// ===================================================================
// 404 页：GitHub Pages 会给没自定义的仓库发它那套默认白底 404，
// 从樱花小站一脚跨进微软办公室 —— 这里补一张自家风格的。
//
// V20（第 7.2、11 节）：和其余子页同一套皮 —— 头部提前恢复皮肤（防闪白）、全站 theme.css、
// 页头（站牌 + 外观设置，不放分享：分享一个不存在的地址没有意义）、页脚站台（无当前格、
// 不出访客车票也不加载不蒜子，不把 404 访问计进全站浏览量）。中间一张车票卡：
// 像素 48「404」、两句说明、一行失物（10 枚游戏图标）、4 枚去处徽章。
// 星空、月亮、萤火虫、稻草人地面随 V20 删了。
//
// 路径一律写站根绝对路径 /xxx —— Pages 与 Vercel 都把 404 挂在站点根，
// 而访客可能停在任意子路径上，相对路径会拼错。
// ⚠️ 所以本机要经静态服务打开它（file:// 下 /font.css 会解析到盘符根目录）。
// ===================================================================
const fs = require('fs');
const path = require('path');
const { ICONS, toSymbol } = require('./icons.js');
const SKINS = require('./skins.js');
const { seasonScript, bottomBlock, CHROME_ICONS, sitebar, themeHref } = require('./subpage.js');

const ic = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;

// 失物一行：迷路掉在地里的装备（第 11 节的 22 枚游戏图标去处表）
const LOOT = ['creeper', 'tnt', 'pickaxe', 'goldapple', 'sword', 'obsidian', 'crafting', 'iridium', 'wine', 'fossil'];
const GO = [['/', 'basket', '回到主页'], ['/posts/', 'book', '看文章'], ['/gallery/', 'gem', '逛相馆'], ['/workshop/', 'chest', '逛工坊']];
const sprite = () => '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
  [...new Set(LOOT.concat(GO.map((g) => g[1]), CHROME_ICONS))].filter((n) => ICONS[n]).map((n) => toSymbol(n, ICONS[n])).join('') + '</svg>';

// 车票卡直接放在纸色上：缺口取纸色（--notch，第 3.5 节）。像素字只用 12／48，说明句是阅读 16。
const CSS = `.lost{--notch:var(--paper);max-width:560px;margin:var(--s9) auto 0;padding:var(--s8) var(--s6);text-align:center}
.lost-num{margin:0;font-size:48px;line-height:60px;font-weight:normal;color:var(--ink)}
.lost-who{display:inline-block;margin:var(--s2) 0 var(--s4);padding:0 8px;font-size:12px;line-height:24px;background:var(--plate);color:var(--on-plate)}
.lost-tip{margin:0 0 var(--s6);font-family:var(--read);font-size:16px;line-height:26px;color:var(--ink)}
.lost-loot{display:flex;justify-content:center;flex-wrap:wrap;gap:var(--s2);margin:0 0 var(--s6)}
.lost-go{display:flex;justify-content:center;flex-wrap:wrap;gap:var(--s2)}`;

function html() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>404 · 这块地还没播种 — 柯西 Alakazam</title>
${SKINS.bootScript()}
<link rel="stylesheet" href="/font.css">
<link rel="stylesheet" href="${themeHref('/')}">
<style>
${CSS}
</style>
</head>
<body class="is-404">
${sprite()}
<div class="wrap">
  ${sitebar({ prefix: '/', back: '', share: false })}
  <main class="lost ticket">
    <h1 class="lost-num">404</h1>
    <p class="lost-who">这块地还没播种</p>
    <p class="lost-tip">你要找的页面不在农场上——<br>它可能还没长出来，也可能早就收获了。</p>
    <p class="lost-loot" aria-hidden="true">${LOOT.map((n) => ic(n)).join('')}</p>
    <nav class="lost-go" aria-label="去别处看看">${GO.map(([href, icon, label]) => `<a class="abtn" href="${href}">${ic(icon, 'sm')}${label}</a>`).join('')}</nav>
  </main>
  ${bottomBlock('', '/', { counter: false })}
</div>
${seasonScript()}
</body>
</html>
`;
}

function build() {
  const out = path.join(__dirname, '..', '404.html');
  const page = html();
  fs.writeFileSync(out, page, 'utf8');
  console.log('已生成 ' + out + '  (' + Math.round(page.length / 1024) + ' KB)');
}

module.exports = { build };
