// Visual skins share the existing content, season and time of day.
const fs = require('fs');
const path = require('path');
const scenes = require('./skin-scenes.js');

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

const chooser = (compact = false) => `<nav class="skin-picker${compact ? ' skin-picker-subpage' : ''}" aria-label="视觉皮肤">
  <span class="skin-label">换个风景</span>
  ${skins.map(([id, name, detail]) => `<button type="button" class="skin-choice" data-set-skin="${id}" aria-pressed="${id === 'sakura'}" title="${detail}"><span class="skin-swatch skin-swatch-${id}" aria-hidden="true"></span><span>${name}</span></button>`).join('')}
</nav>`;

function runtime() {
  var root = document.documentElement;
  var captions = {farm: '欢迎来坐坐', sakura: '在花树下，读一页书', coast: '海风经过，慢慢坐', observatory: '今夜，一起看星星'};
  var buttons = document.querySelectorAll('[data-set-skin]');
  function apply(value) {
    // Swap both text and surfaces together; the old seasonal background tween
    // otherwise leaves light text on a light surface during dark-skin changes.
    root.classList.add('skin-changing');
    root.dataset.skin = value;
    buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.setSkin === value)); });
    document.querySelectorAll('[data-skin-caption]').forEach(function (caption) { caption.textContent = captions[value]; });
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
    var theme = root.dataset.skin === 'observatory' || root.dataset.time === 'night' ? 'dark' : 'light';
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
/* The chooser stays outside the collapsed appearance settings. */
.skin-changing *,.skin-changing *::before,.skin-changing *::after{transition:none!important}
.skin-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative;z-index:60;max-width:min(1560px,max(1200px,100% - 240px));padding:0 24px;margin:20px auto 16px}
.skin-picker{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0;font-size:12px;line-height:24px}
.skin-label{color:var(--ink);margin-right:8px}
/* ⚠️ .skin-choice 是 <button>，别给它写 cursor:pointer —— (0,1,0) 会盖掉
   像素光标的裸 button 规则。守门：check-cursor.js 第 3 条（不许有裸 cursor:pointer）。 */
.skin-choice{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:6px 12px;border:2px solid var(--timber-light);background:var(--cream);color:var(--ink);font:inherit;box-shadow:0 2px 0 var(--pixel-shadow);transition:background .16s,border-color .16s,transform .16s}
.skin-choice[aria-pressed="true"]{background:var(--cream-2);border-color:var(--moss);box-shadow:inset 0 -3px 0 var(--moss),0 2px 0 var(--pixel-shadow)}
.skin-choice:focus-visible{outline:3px solid var(--moss);outline-offset:4px}
.skin-choice:active{transform:translateY(2px)}
.skin-swatch{width:24px;height:20px;flex-shrink:0;display:block;border:1px solid #ffffff70;image-rendering:pixelated}
.skin-swatch-sakura{background:linear-gradient(90deg,transparent 45%,#39465e 45% 55%,transparent 55%),linear-gradient(#b1d1de 45%,#efb3c8 45% 70%,#e7ded5 70% 85%,#647d76 85%)}
.skin-swatch-coast{background:linear-gradient(90deg,transparent 65%,#faf1d8 65% 80%,transparent 80%),linear-gradient(#a8dbe6 45%,#3c9eb4 45% 75%,#eddbb4 75%)}
.skin-swatch-observatory{background:radial-gradient(circle at 75% 25%,#edca80 0 2px,transparent 3px),linear-gradient(150deg,#192c45 60%,#627487 60% 75%,#354459 75%)}
.skin-swatch-farm{background:linear-gradient(140deg,transparent 50%,#a75d47 50% 72%,transparent 72%),linear-gradient(#b6d0bb 50%,#7f955d 50%)}
.skin-bar>.appearance-settings{padding:0;margin:0;max-width:none;flex-shrink:0}
.skin-bar>.appearance-settings>.controls{right:0;top:40px;min-width:288px}
.skin-picker-subpage{position:relative;z-index:2;max-width:1100px;margin:24px auto 0;padding:0 24px;justify-content:flex-end}
html:is([data-skin="sakura"],[data-skin="coast"],[data-skin="observatory"]) .bgmode{display:none}
@media(hover:hover){.skin-choice:hover{border-color:var(--moss);background:var(--cream-2)}}
@media(max-width:760px){.skin-bar{padding:0 16px;margin:16px auto;align-items:flex-start;gap:8px}.skin-label{display:none}.skin-picker{gap:8px}.skin-choice{padding:4px 8px;gap:4px}.skin-swatch{width:16px;height:16px}.skin-picker-subpage{justify-content:flex-start;padding:0 16px}.skin-bar>.appearance-settings>summary{padding:4px 8px;white-space:nowrap}}
@media(prefers-reduced-motion:reduce){.skin-choice{transition:none}}
`;

module.exports = {
  bootScript, chooser,
  css: fs.readFileSync(path.join(__dirname, 'skins.css'), 'utf8') + controlsCss + scenes.css,
  scene: scenes.backdrop,
  diorama: scenes.diorama,
  script: () => `<script>(${runtime.toString()})();${scenes.script}</script>`
};
