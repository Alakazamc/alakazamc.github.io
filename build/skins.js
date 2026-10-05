// Visual skins share the existing content, season and time of day.
const fs = require('fs');
const path = require('path');
const scenes = require('./skin-scenes.js');
const PALETTE = require('./palette.js');

const skins = [
  ['sakura', '樱花书屋', '花树下的书屋、唱片与经过的列车'],
  ['coast', '海边夏日', '海蓝搪瓷、潮水与港口灯塔'],
  ['observatory', '星夜观测站', '深蓝星图、铜色仪器与山顶圆顶'],
  ['farm', '原野农场', '熟悉的木框、小屋与四季田野']
];

function boot() {
  var root = document.documentElement, chosen = 'sakura';
  try { chosen = localStorage.getItem('kx-skin') || chosen; } catch (_) {}
  root.dataset.skin = ['sakura', 'coast', 'observatory', 'farm'].includes(chosen) ? chosen : 'sakura';
  var now = new Date(), month = now.getMonth() + 1, hour = now.getHours();
  root.dataset.season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  root.dataset.time = hour < 6 || hour >= 18 ? 'night' : 'day';
}
const bootScript = () => `<script>(${boot.toString()})();</script>`;

const chooser = () => `<nav class="skin-picker" aria-label="视觉皮肤">
  <span class="skin-label">换个风景</span>
  ${skins.map(([id, name, detail]) => `<button type="button" class="skin-choice" data-set-skin="${id}" aria-pressed="${id === 'sakura'}" title="${detail}"><span class="skin-swatch skin-swatch-${id}" aria-hidden="true"></span><span>${name}</span></button>`).join('')}
</nav>`;

function runtime(cfg) {
  var root = document.documentElement;
  var buttons = document.querySelectorAll('[data-set-skin]');
  function apply(value) {
    // Swap both text and surfaces together; the old seasonal background tween
    // otherwise leaves light text on a light surface during dark-skin changes.
    root.classList.add('skin-changing');
    root.dataset.skin = value;
    buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.setSkin === value)); });
    document.dispatchEvent(new CustomEvent('kx:skin', {detail: value}));
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('skin-changing'); }); });
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.dataset.setSkin;
      apply(value);
      try { localStorage.setItem('kx-skin', value); } catch (_) {}
    });
  });
  apply(root.dataset.skin);
  function commentsTheme() {
    // 评论区主题跟皮肤与昼夜（第 6.12 节）：cfg 是 palette.js giscusThemes() 的 8 个地址
    var theme = cfg[root.dataset.skin + '-' + (root.dataset.time === 'night' ? 'night' : 'day')];
    var client = document.querySelector('script[src="https://giscus.app/client.js"]');
    if (client) client.dataset.theme = theme;
    var frame = document.querySelector('iframe.giscus-frame');
    if (frame) frame.contentWindow.postMessage({giscus: {setConfig: {theme: theme}}}, 'https://giscus.app');
  }
  commentsTheme();
  new MutationObserver(commentsTheme).observe(root, {attributes:true, attributeFilter:['data-skin','data-time']});
  document.addEventListener('load', function (event) {
    if (event.target.matches && event.target.matches('iframe.giscus-frame')) commentsTheme();
  }, true);
}

const controlsCss = `
/* 换皮肤时压住过渡；昼夜切换不压（第 3.6 节：配色即时切换）。 */
.skin-changing *,.skin-changing *::before,.skin-changing *::after{transition:none!important}
/* 页头 .sitebar（V20 第 6.1 节，subpage.js 的 sitebar() 生成）：左站牌，右组分享在前、外观设置固定在最右；不吸顶。 */
.sitebar{position:relative;display:flex;align-items:center;justify-content:space-between;gap:var(--s2);min-height:48px;margin-bottom:var(--s4)}
.sitebar-l,.sitebar-r{display:flex;align-items:center;gap:var(--s2)}
.sitebar-r{margin-left:auto}
/* 子页站牌式返回链接（第 6.1 节）：站牌材质，像素 24「柯西」+ 像素 12「◀ 回到主页」，整块一个链接；悬停给后半句加下划线。
   箭头是 play 水平翻转（arrow 是鼠标光标那张像素画）。 */
.brand{display:flex;align-items:center;gap:var(--s2);min-height:40px;padding:0 12px;text-decoration:none;
  background:var(--plate);color:var(--on-plate);border:2px solid var(--plate);font-size:12px;line-height:24px}
.brand b{font-size:24px;line-height:32px;font-weight:normal}
.brand span{display:flex;align-items:center;gap:var(--s1)}
.brand .ic{transform:scaleX(-1)}
.brand:hover span{text-decoration:underline;text-underline-offset:4px}
/* 外观设置：summary 是搪瓷徽章，展开算按下态（站牌色）。展开面板锚定整条页头而不是 <details>，
   右沿与页头右沿对齐，任何宽度都不伸出视口（面板向左溢出不增加 scrollWidth，检查抓不到）。 */
.sitebar .appearance-settings{position:static}
.appearance-settings>summary{display:flex;align-items:center;min-height:40px;padding:0 12px;list-style:none;font-size:12px;line-height:24px;color:var(--ink);background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge)}
.appearance-settings>summary::-webkit-details-marker{display:none}
.appearance-settings[open]>summary{background:var(--plate);color:var(--on-plate);border-color:var(--plate)}
.appearance-settings>.controls{position:absolute;right:0;top:calc(100% + var(--s2));z-index:60;display:flex;flex-direction:column;gap:var(--s3);width:320px;max-width:calc(100vw - 32px);padding:var(--s4);background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift)}
.skin-picker{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0;font-size:12px;line-height:24px}
.controls .skin-label{width:100%;margin:0;color:var(--ink-2)}
/* ⚠️ .skin-choice 是 <button>，别给它写 cursor:pointer —— (0,1,0) 会盖掉
   像素光标的裸 button 规则。守门：check-cursor.js 第 3 条（不许有裸 cursor:pointer）。 */
/* 搪瓷徽章（V20 第 3.5 节）：当前皮肤（aria-pressed）用站牌色；第 6 层的 hover 只改背景。 */
.skin-choice{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:6px 12px;border:2px solid var(--edge);background:var(--surface);color:var(--ink);font:inherit;box-shadow:0 2px 0 var(--edge);transition:background .16s,border-color .16s,transform .16s}
.skin-choice[aria-pressed="true"]{background:var(--plate);color:var(--on-plate);border-color:var(--plate)}
.skin-choice:focus-visible{outline:3px solid var(--rail);outline-offset:4px}
.skin-choice:active{transform:translateY(2px);box-shadow:none}
.skin-swatch{width:24px;height:20px;flex-shrink:0;display:block;border:1px solid #ffffff70;image-rendering:pixelated}
.skin-swatch-sakura{background:linear-gradient(90deg,transparent 45%,#39465e 45% 55%,transparent 55%),linear-gradient(#b1d1de 45%,#efb3c8 45% 70%,#e7ded5 70% 85%,#647d76 85%)}
.skin-swatch-coast{background:linear-gradient(90deg,transparent 65%,#faf1d8 65% 80%,transparent 80%),linear-gradient(#a8dbe6 45%,#3c9eb4 45% 75%,#eddbb4 75%)}
.skin-swatch-observatory{background:radial-gradient(circle at 75% 25%,#edca80 0 2px,transparent 3px),linear-gradient(150deg,#192c45 60%,#627487 60% 75%,#354459 75%)}
.skin-swatch-farm{background:linear-gradient(140deg,transparent 50%,#a75d47 50% 72%,transparent 72%),linear-gradient(#b6d0bb 50%,#7f955d 50%)}
@media(hover:hover){.skin-choice:not([aria-pressed="true"]):hover,.appearance-settings:not([open])>summary:hover{background:var(--raised)}}
@media(max-width:760px){.skin-choice{padding:4px 8px;gap:4px}.skin-swatch{width:16px;height:16px}}
@media(max-width:430px){.sitebar{flex-wrap:wrap;row-gap:var(--s2)}}
@media(prefers-reduced-motion:reduce){.skin-choice{transition:none}}
`;

module.exports = {
  bootScript, chooser,
  css: fs.readFileSync(path.join(__dirname, 'skins.css'), 'utf8') + controlsCss + scenes.css,
  diorama: scenes.diorama,
  script: () => `<script>(${runtime.toString()})(${JSON.stringify(PALETTE.giscusThemes())});${scenes.script}</script>`
};
