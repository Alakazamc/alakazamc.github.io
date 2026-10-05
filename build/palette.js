// V20 色板：角色变量的唯一事实源（设计 docs/2026-10-05-V20-视觉重设计方案.md 第 3 节）。
//
// 组件只引用角色（--paper、--surface、--ink…），不写死色值；像素画、品牌图标、语言色点除外。
// gen.js 把 css() 放在内联 <style> 的最前面，theme.css 是它的副本，子页同样吃到。
// 检查：build/check-colors.js 逐套核对键齐全与对比度；build/check.js 核对每个色板块都在首页样式里。
//
// ⚠️ 每套色板写满全部键（第 3.1 节）：农场的季节块与夜间块特异性相同，夜间块漏写一个键，
//    夜里就会露出季节块的值。源码里可以用对象展开共用，生成结果必须逐块写全。

// 21 个角色、8 个语义文字色与 color-scheme（第 3.1 节）。
const ROLES = ['paper', 'surface', 'raised', 'ink', 'ink-2', 'line', 'edge', 'mark', 'rail',
  'plate', 'on-plate', 'lamp', 'on-lamp', 'sakura', 'leaf', 'wood', 'shadow', 'glow', 'lift',
  'code-bg', 'on-code'];
const TEXT = ['tx-3', 'tx-link', 'tx-em', 'tx-tag', 'tx-quote', 'tx-code', 'tx-num', 'tx-link-line'];
const KEYS = ROLES.concat(TEXT, ['color-scheme']);

// 材质阴影按色板深浅定：浅色板硬投影，深色板灯笼色内高光（第 3.1、3.5 节）。
const HARD = '2px 2px 0 var(--shadow)';
const INSET = 'inset 0 2px 0 var(--glow)';

// 语义文字色默认由角色派生：--tx-3 = 次墨，--tx-link／--tx-em／--tx-num = 强调，--tx-tag = 线路色。
// 色板里写了的以色板为准（农场按季另取、夜间数字取灯笼色）。
const full = (p) => {
  const out = Object.assign({ 'tx-3': p['ink-2'], 'tx-link': p.mark, 'tx-em': p.mark, 'tx-tag': p.rail, 'tx-num': p.mark }, p);
  out.lift = out['color-scheme'] === 'light' ? HARD : INSET;
  return out;
};

// Sakura colours draw on Kenton Wang's Sakura Crossing (MIT; see bundled attribution).
// 樱花书屋（默认皮肤，第 3.2 节）：深樱加深到 #A34560（纸上 5.23:1）。
const SAKURA_DAY = full({
  paper: '#F7F1E8', surface: '#FFFBF5', raised: '#F2E7DA', ink: '#2A2731', 'ink-2': '#5B5566',
  line: '#E4D9CC', edge: '#8E8174', mark: '#A34560', rail: '#2E5E6E', plate: '#2E5E6E', 'on-plate': '#FFFBF5',
  lamp: '#F0B45C', 'on-lamp': '#2A2731', sakura: '#E79BB0', leaf: '#7FA58C', wood: '#A8734A',
  shadow: '#D6C7B5', glow: 'transparent', 'code-bg': '#2A2731', 'on-code': '#F7F1E8',
  'tx-quote': '#6A4E6E', 'tx-code': '#8A5A33', 'tx-num': '#A34560', 'tx-link-line': '#CA93AD', 'color-scheme': 'light'
});
const SAKURA_NIGHT = full({
  paper: '#161A2C', surface: '#20253A', raised: '#2A3049', ink: '#EFE8DD', 'ink-2': '#B8B2C4',
  line: '#353C58', edge: '#6C7497', mark: '#E8A3B8', rail: '#6FB3C0', plate: '#F2B866', 'on-plate': '#161A2C',
  lamp: '#F2B866', 'on-lamp': '#161A2C', sakura: '#E8A3B8', leaf: '#7FA58C', wood: '#C9956A',
  shadow: '#0C0F1C', glow: '#F2B86647', 'code-bg': '#10131F', 'on-code': '#EFE8DD',
  'tx-quote': '#C9BDE0', 'tx-code': '#F2C48A', 'tx-num': '#F2B866', 'tx-link-line': '#8F6886', 'color-scheme': 'dark'
});

// 海边夏日、星夜观测站（第 3.3 节）：沿用 skins.css 原色相，按角色落位，只为对比度调明度。
const COAST_ART = { sakura: '#D88C7A', leaf: '#8FB5A6', wood: '#B89268' };
const COAST_DAY = full({
  paper: '#EEF4F2', surface: '#FFFDF7', raised: '#E2EDEC', ink: '#253F4B', 'ink-2': '#4E6770',
  line: '#D3E4E5', edge: '#6F8E98', mark: '#1F6585', rail: '#286E69', plate: '#216788', 'on-plate': '#FFFDF7',
  lamp: '#E2C38C', 'on-lamp': '#253F4B', ...COAST_ART,
  shadow: '#C6D6D6', glow: 'transparent', 'code-bg': '#203D4C', 'on-code': '#E6F6F7',
  'tx-quote': '#4F6A89', 'tx-code': '#7F5326', 'tx-num': '#1F6585', 'tx-link-line': '#82B6CA', 'color-scheme': 'light'
});
const COAST_NIGHT = full({
  paper: '#18262F', surface: '#223642', raised: '#2C4350', ink: '#E9F3F2', 'ink-2': '#B4C8CC',
  line: '#34495A', edge: '#6A8A99', mark: '#A4D9F0', rail: '#A4D1C4', plate: '#E7CA92', 'on-plate': '#18262F',
  lamp: '#E7CA92', 'on-lamp': '#18262F', ...COAST_ART,
  shadow: '#0E1820', glow: '#E7CA9240', 'code-bg': '#142630', 'on-code': '#E7F6F5',
  'tx-quote': '#BDCFED', 'tx-code': '#F5C19C', 'tx-num': '#E7CA92', 'tx-link-line': '#628DA2', 'color-scheme': 'dark'
});
// 星夜观测站昼夜都是深色板（现状如此），两态都走内高光。
const OBS_ART = { sakura: '#D0C2E8', leaf: '#B2D0C6', wood: '#C6A16C' };
const OBS_DAY = full({
  paper: '#172235', surface: '#202F48', raised: '#2B3B57', ink: '#EEEEF2', 'ink-2': '#C4C9D7',
  line: '#35445E', edge: '#7A87A3', mark: '#B8D9F4', rail: '#B2D0C6', plate: '#E4BF87', 'on-plate': '#172235',
  lamp: '#E4BF87', 'on-lamp': '#172235', ...OBS_ART,
  shadow: '#0F1828', glow: '#E4BF8733', 'code-bg': '#121B2E', 'on-code': '#E7EDF7',
  'tx-quote': '#D0C2E8', 'tx-code': '#F0B7A1', 'tx-num': '#E4BF87', 'tx-link-line': '#738CA9', 'color-scheme': 'dark'
});
const OBS_NIGHT = full({
  paper: '#101A2C', surface: '#19263D', raised: '#243450', ink: '#E9EAF0', 'ink-2': '#BDC4D4',
  line: '#2E3C55', edge: '#62708C', mark: '#AED1F2', rail: '#AFCBC2', plate: '#DDBD8C', 'on-plate': '#101A2C',
  lamp: '#DDBD8C', 'on-lamp': '#101A2C', ...OBS_ART,
  shadow: '#080E1A', glow: '#DDBD8C33', 'code-bg': '#0C1424', 'on-code': '#E5EBF6',
  'tx-quote': '#CBBCE8', 'tx-code': '#ECB69F', 'tx-num': '#DDBD8C', 'tx-link-line': '#617E9F', 'color-scheme': 'dark'
});

// 原野农场（第 3.3 节）：按季节换纸色和文字强调色，其余角色四季共用。
const FARM_DAY = {
  surface: '#FFF8E6', raised: '#F1E3BD', ink: '#3E3124', 'ink-2': '#65523C', line: '#DECCA0', edge: '#8D6B45',
  rail: '#4F6A3A', plate: '#644832', 'on-plate': '#FFF8E6', lamp: '#FFD23F', 'on-lamp': '#3E3124',
  sakura: '#FF9EC4', leaf: '#5AAE46', wood: '#A9682F', shadow: '#C9B68E', glow: 'transparent',
  'code-bg': '#2B1D0E', 'on-code': '#FFF8E6', 'color-scheme': 'light'
};
const FARM_SPRING = full({ ...FARM_DAY, paper: '#EEF1DC', mark: '#276B43', 'tx-em': '#A8346A', 'tx-tag': '#276B43',
  'tx-quote': '#6E5297', 'tx-code': '#8F4A1B', 'tx-link-line': '#8FCB6B' });
const FARM_SUMMER = full({ ...FARM_DAY, paper: '#E6F0EC', mark: '#155E96', 'tx-em': '#A2440C', 'tx-tag': '#35703C',
  'tx-quote': '#415E7E', 'tx-code': '#8F4A1B', 'tx-link-line': '#7EC8F0' });
const FARM_AUTUMN = full({ ...FARM_DAY, paper: '#F5E8D2', mark: '#9A4E2A', 'tx-em': '#8C3B12', 'tx-tag': '#7A5E10',
  'tx-quote': '#6B4A6B', 'tx-code': '#7F3E12', 'tx-link-line': '#E8A33D' });
const FARM_WINTER = full({ ...FARM_DAY, paper: '#ECF0F1', mark: '#335F7C', 'tx-em': '#4A5A68', 'tx-tag': '#45667A',
  'tx-quote': '#4C5C7E', 'tx-code': '#55667A', 'tx-link-line': '#9DBECB', 'tx-3': '#5F5F67' });
const FARM_NIGHT = full({
  paper: '#1C251F', surface: '#283126', raised: '#343F31', ink: '#F3E8CE', 'ink-2': '#C6BEA5',
  line: '#45503D', edge: '#7A8A6E', mark: '#9FD9F5', rail: '#A0B575', plate: '#DDBC70', 'on-plate': '#1C251F',
  lamp: '#DDBC70', 'on-lamp': '#1C251F', sakura: '#FF9EC4', leaf: '#9FD98F', wood: '#C98A4B',
  shadow: '#0F1511', glow: '#DDBC7033', 'code-bg': '#141B16', 'on-code': '#F3E8CE',
  'tx-em': '#FFD54A', 'tx-tag': '#9FD98F', 'tx-quote': '#C9B3E8', 'tx-code': '#F0A890', 'tx-num': '#FFD54A',
  'tx-link-line': '#5B8DD9', 'color-scheme': 'dark'
});

// 11 套色板，键名是「皮肤-状态」。
const PALETTES = {
  'sakura-day': SAKURA_DAY, 'sakura-night': SAKURA_NIGHT,
  'coast-day': COAST_DAY, 'coast-night': COAST_NIGHT,
  'observatory-day': OBS_DAY, 'observatory-night': OBS_NIGHT,
  'farm-spring': FARM_SPRING, 'farm-summer': FARM_SUMMER, 'farm-autumn': FARM_AUTUMN, 'farm-winter': FARM_WINTER,
  'farm-night': FARM_NIGHT
};

// 生成顺序固定（第 3.6 节）：樱花昼兼作 :root 兜底；夜间块把 [data-time] 写在前面，
// check-focus.js 的正则（焦点色在 :root 定义、在 html[data-time="night"]… 覆盖）不用改就认得出。
// 农场春天兼作农场默认；季节块与夜间块同为 html[属性][属性]，夜间块排在最后、胜出。
const SELECTORS = {
  'sakura-day': ':root,html[data-skin="sakura"]',
  'sakura-night': 'html[data-time="night"][data-skin="sakura"]',
  'coast-day': 'html[data-skin="coast"]',
  'coast-night': 'html[data-time="night"][data-skin="coast"]',
  'observatory-day': 'html[data-skin="observatory"]',
  'observatory-night': 'html[data-time="night"][data-skin="observatory"]',
  'farm-spring': 'html[data-skin="farm"]',
  'farm-summer': 'html[data-skin="farm"][data-season="summer"]',
  'farm-autumn': 'html[data-skin="farm"][data-season="autumn"]',
  'farm-winter': 'html[data-skin="farm"][data-season="winter"]',
  'farm-night': 'html[data-time="night"][data-skin="farm"]'
};

const blocks = () => Object.keys(SELECTORS).map((name) => ({ name, selector: SELECTORS[name], vars: PALETTES[name] }));

// 旧名映射只写一次（第 3.6 节）：还没重做的组件经它换上新色。
// ⚠️ 映射只兜底背景、边框和阴影；以旧名作文字色或焦点框的规则一律改写成角色变量。
const LEGACY = [
  ['cream', 'surface'], ['cream-2', 'raised'], ['cream-3', 'line'],
  ['timber', 'edge'], ['timber-light', 'line'], ['timber-top', 'raised'],
  ['moss', 'rail'], ['pixel-shadow', 'shadow'],
  ['gold', 'raised'], ['gold-2', 'mark'], ['gold-3', 'lamp'],
  ['wood-a', 'raised'], ['wood-b', 'edge'], ['wood-c', 'edge'],
  ['frame', 'edge'], ['reading-surface', 'surface'], ['reading-muted', 'raised'],
  ['accent', 'raised'], ['accent-2', 'mark'], ['tx', 'ink'], ['tx-2', 'ink-2'],
  ['link-accent', 'tx-link-line'], ['sky-b', 'paper'], ['focus', 'ink']
];

const decl = (p) => KEYS.map((k) => (k === 'color-scheme' ? 'color-scheme:' : '--' + k + ':') + p[k]).join(';');

function css() {
  return '/* ===== V20 色板（build/palette.js 生成，勿在此改；Sakura colours draw on Sakura Crossing, MIT） ===== */\n' +
    blocks().map((b) => b.selector + '{' + decl(b.vars) + '}').join('\n') + '\n' +
    ':root{' + LEGACY.map(([o, n]) => '--' + o + ':var(--' + n + ')').join(';') + '}\n';
}

// ===== giscus 评论区主题（第 6.12 节）=====
// 8 个文件 assets/giscus/<skin>-<time>.css：先 @import 同昼夜的内置主题（兜住没覆盖的 84 个变量与两张图），
// 再用 main{} 覆盖角色色。地址用主域绝对 https（giscus 只认绝对地址；Vercel 镜像也从主域取）。
// 退回：线上自定义主题加载失败时把 GISCUS_CUSTOM 改为 false 重建，giscusThemes() 改回内置主题名。
const GISCUS_CUSTOM = true;
const GISCUS_VERSION = 1;   // 改模板时加一，地址里的 ?v= 随之变化
const GISCUS = {
  'sakura-day': 'sakura-day', 'sakura-night': 'sakura-night',
  'coast-day': 'coast-day', 'coast-night': 'coast-night',
  'observatory-day': 'observatory-day', 'observatory-night': 'observatory-night',
  'farm-day': 'farm-spring', 'farm-night': 'farm-night'   // 农场昼用春季强调色
};
const giscusBuiltin = (p) => (p['color-scheme'] === 'light' ? 'noborder_light' : 'noborder_dark');

function giscusThemes() {
  const hash = require('crypto').createHash('sha256')
    .update(JSON.stringify(PALETTES) + GISCUS_VERSION).digest('hex').slice(0, 10);
  const out = {};
  for (const [name, pal] of Object.entries(GISCUS)) {
    out[name] = GISCUS_CUSTOM
      ? 'https://alakazamc.github.io/assets/giscus/' + name + '.css?v=' + hash
      : giscusBuiltin(PALETTES[pal]);
  }
  return out;
}

function giscusCss(p) {
  return `/* 由 build/palette.js 生成，勿手改。变量名沿用 giscus 内置主题（MIT，giscus/giscus），
   其来源是 GitHub Primer Primitives（MIT）。 */
@import url("https://giscus.app/themes/${giscusBuiltin(p)}.css");
main {
  color-scheme: ${p['color-scheme']};
  --color-canvas-default: ${p.surface};  --color-canvas-overlay: ${p.surface};
  --color-canvas-subtle: ${p.raised};
  --color-canvas-inset: ${p.paper};
  --color-fg-default: ${p.ink};
  --color-fg-muted: ${p['ink-2']};  --color-fg-subtle: ${p['ink-2']};
  --color-border-default: ${p.edge};
  --color-border-muted: ${p.line};
  --color-accent-fg: ${p.mark};
  --color-accent-emphasis: ${p.plate};
  --color-btn-text: ${p.ink};  --color-btn-bg: ${p.surface};  --color-btn-border: ${p.edge};  --color-btn-hover-bg: ${p.raised};
  --color-btn-primary-text: ${p['on-plate']};  --color-btn-primary-bg: ${p.plate};  --color-btn-primary-hover-bg: ${p.plate};
  --color-segmented-control-bg: ${p.raised};  --color-segmented-control-button-bg: ${p.surface};
  --color-segmented-control-button-selected-border: ${p.edge};
}
`;
}

function writeGiscus(dir) {
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, pal] of Object.entries(GISCUS)) {
    fs.writeFileSync(path.join(dir, name + '.css'), giscusCss(PALETTES[pal]));
  }
}

module.exports = { PALETTES, ROLES, TEXT, KEYS, SELECTORS, blocks, css, GISCUS_CUSTOM, giscusThemes, writeGiscus };
