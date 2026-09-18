// ===================================================================
// 404 页：GitHub Pages 会给没自定义的仓库发它那套默认白底 404，
// 从像素农场一脚跨进微软办公室 —— 这里补一张自家风格的。
//
// 为什么是自包含的一页：
//   根目录下的 404.html 没有构建产物可依赖，Sprite 必须内联，样式也必须内联
//   （全站 theme.css 两千行，这页只用到一两块）。所以这里自己写一小份，
//   只保留同一套像素语言：4/6px 硬边框、木纹渐变、像素图标、
//   12 的整数倍字号、steps() 而不是缓动。
//
// 路径一律写绝对路径 /xxx —— Pages 与 Vercel 都把 404 挂在站点根，
// 相对路径在子路径下会拼错（保留了子路径再 302 是常态）。
// ===================================================================
const fs = require('fs');
const path = require('path');
const { buildSprite } = require('./icons.js');

const ic = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;

const CSS = `* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { min-height: 100% }
body {
  font-family: 'FusionPixel', 'Microsoft YaHei', monospace;
  color: #FFF8E7; line-height: 1.9;
  background: linear-gradient(180deg, #171634 0%, #241f4d 26%, #462a5c 52%, #7c3f4f 74%, #a8563f 100%);
  background-attachment: fixed;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 36px 16px 132px; position: relative; overflow-x: hidden;
}
/* 星星：一张 220px 的贴图里排了 8 个点，靠背景平铺铺满整屏。
   比塞几十个 div 便宜，也不增加 DOM 节点（这站对 DOM 体积敏感：首页已经 4346 个）。 */
.stars { position: fixed; inset: 0; pointer-events: none; opacity: .85;
  background-image:
    radial-gradient(2px 2px at 14px 22px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 68px 54px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 122px 18px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 176px 76px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 40px 118px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 148px 146px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 96px 188px, #FFF8E7 50%, transparent 51%),
    radial-gradient(2px 2px at 204px 130px, #FFF8E7 50%, transparent 51%);
  background-size: 220px 220px;
  animation: twinkle 4s steps(2) infinite;
}
@keyframes twinkle { 0%, 100% { opacity: .85 } 50% { opacity: .45 } }
.moon { position: fixed; top: 48px; right: 8vw; opacity: .9 }
.moon .ic { width: 72px; height: 72px; display: block; image-rendering: pixelated;
  filter: drop-shadow(0 0 14px rgba(255, 233, 168, .45)) }
#flies { position: fixed; inset: 0; pointer-events: none }
#flies i { position: absolute; width: 4px; height: 4px; background: #FFE9A8;
  box-shadow: 0 0 6px 1px rgba(255, 233, 168, .8); animation: bob 5s steps(6) infinite }
@keyframes bob {
  0%, 100% { transform: translate(0, 0); opacity: .2 }
  50%      { transform: translate(14px, -18px); opacity: 1 }
}
#flies i:nth-child(1) { left: 12%; top: 62%; animation-delay: .2s }
#flies i:nth-child(2) { left: 24%; top: 74%; animation-delay: 1.1s }
#flies i:nth-child(3) { left: 68%; top: 58%; animation-delay: .7s }
#flies i:nth-child(4) { left: 82%; top: 70%; animation-delay: 1.6s }
#flies i:nth-child(5) { left: 46%; top: 82%; animation-delay: 2.3s }
#flies i:nth-child(6) { left: 90%; top: 44%; animation-delay: 3.1s }

/* ===== 招牌 ===== */
.board { position: relative; margin: 0 auto; max-width: 520px; text-align: center;
  background: linear-gradient(180deg, #A9744F 0%, #8A5A38 58%, #6E452B 100%);
  border: 6px solid #2B1D0E;
  box-shadow: 0 0 0 4px #6E452B, 0 12px 0 -2px rgba(59, 36, 18, .45),
              inset 0 5px 0 rgba(255, 255, 255, .22);
  padding: 30px 26px 24px }
.board::after { content: ''; position: absolute; inset: 5px; border: 2px solid #A9744F;
  pointer-events: none; opacity: .7 }
.tag { position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
  background: #2B1D0E; color: #FFD966; border: 2px solid #6E452B;
  padding: 3px 16px; font-size: 12px; letter-spacing: 2px; white-space: nowrap }
.bn { display: flex; justify-content: center; align-items: center; gap: 10px; margin: 6px 0 8px }
.bn .ic { width: 24px; height: 24px; image-rendering: pixelated }
.num { font-size: 72px; font-weight: 700; color: #FFF8E7; letter-spacing: 4px; line-height: 1.1;
  text-shadow: 4px 4px 0 #2B1D0E, 0 0 18px rgba(255, 233, 168, .35) }
.who { display: inline-block; margin: 0 0 12px; background: #FFF3D6; color: #2B1D0E;
  border: 2px solid #2B1D0E; box-shadow: 3px 3px 0 rgba(43, 29, 14, .42);
  padding: 4px 12px; font-size: 12px; letter-spacing: .6px }
.tip { font-size: 12px; opacity: .92; margin-bottom: 18px; line-height: 2 }
.row { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px }
.btn { display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
  background: #FFF3D6; color: #2B1D0E; border: 3px solid #2B1D0E;
  box-shadow: 0 0 0 3px #6E452B, 0 4px 0 0 #6E452B;
  padding: 8px 12px 6px; font-size: 12px; letter-spacing: .5px;
  transition: transform .1s steps(2), background .15s }
.btn .ic { width: 16px; height: 16px; image-rendering: pixelated }
.btn:hover, .btn:focus-visible { background: #FFD966; transform: translateY(-3px);
  box-shadow: 0 0 0 3px #6E452B, 0 7px 0 0 #6E452B }
.btn:focus-visible { outline: 3px solid #FFD966; outline-offset: 3px }
.btn:active { transform: translateY(1px); box-shadow: 0 0 0 3px #6E452B, 0 1px 0 0 #6E452B }

/* ===== 地面：稻草人 + 南瓜 + 栅栏 ===== */
.ground { position: fixed; left: 0; right: 0; bottom: 0; height: 96px; pointer-events: none;
  background: linear-gradient(180deg, #3D2A18 0%, #241708 100%);
  border-top: 4px solid #2B1D0E }
.scene { position: fixed; bottom: 92px; left: 0; right: 0; display: flex;
  justify-content: space-between; align-items: flex-end; padding: 0 6vw; pointer-events: none }
.scene .ic { image-rendering: pixelated; display: block }
.scene .scarecrow { width: 84px; height: 84px }
.scene .mid { display: flex; gap: 6px; align-items: flex-end }
.scene .mid .ic { width: 32px; height: 32px }
.scene .fence { width: 56px; height: 56px }
@media (max-width: 640px) {
  .ground { height: 72px }
  .scene { bottom: 68px; padding: 0 4vw }
  .scene .scarecrow { width: 60px; height: 60px }
  .scene .fence { width: 40px; height: 40px }
  .num { font-size: 48px }
  .board { padding: 26px 16px 20px }
}
@media (prefers-reduced-motion: reduce) {
  .stars, #flies i { animation: none }
}`;

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>404 · 这块地还没播种 — 柯西 Alakazam</title>
<link rel="stylesheet" href="/font.css">
<style>
${CSS}
</style>
</head>
<body>
${buildSprite()}
<div class="stars"></div>
<div class="moon">${ic('moon')}</div>
<div id="flies"><i></i><i></i><i></i><i></i><i></i><i></i></div>
<div class="scene">
  ${ic('scarecrow', 'scarecrow')}
  <span class="mid">${ic('pumpkin')}${ic('sunflower')}${ic('lantern')}</span>
  ${ic('fence', 'fence')}
</div>
<div class="ground"></div>

<main class="board">
  <span class="tag">404</span>
  <h1 class="bn">${ic('wheat')}<span class="num">4 0 4</span>${ic('wheat')}</h1>
  <p class="who">这块地还没播种</p>
  <p class="tip">你要找的页面不在农场上——<br>它可能还没长出来，也可能早就收获了。</p>
  <div class="row">
    <a class="btn" href="/">${ic('basket')}回主页</a>
    <a class="btn" href="/posts/">${ic('book')}看文章</a>
    <a class="btn" href="/gallery/">${ic('gem')}逛相馆</a>
    <a class="btn" href="/workshop/">${ic('chest')}逛工坊</a>
  </div>
</main>
</body>
</html>
`;

function build() {
  const out = path.join(__dirname, '..', '404.html');
  fs.writeFileSync(out, HTML, 'utf8');
  console.log('已生成 ' + out + '  (' + Math.round(HTML.length / 1024) + ' KB)');
}

module.exports = { build };
