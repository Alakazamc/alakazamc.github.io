// Original pixel landscapes for the appearance wardrobe. No external artwork.
// Keep the scene independent of page content; the stage (.stage in pixel-art.js) supplies the outer frame.
// 原野农场场景复用 decor.js 的像素画（og.js 也用这几件，单一来源）。
const { HOUSE, MILL, POND } = require('./decor.js');
const R = (x, y, w, h, fill, cls = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${cls ? ` class="${cls}"` : ''}/>`;
const P = (points, fill, cls = '') => `<polygon points="${points}" fill="${fill}"${cls ? ` class="${cls}"` : ''}/>`;
const G = (inner, attrs = '') => `<g${attrs ? ' ' + attrs : ''}>${inner}</g>`;
const repeat = (n, draw) => Array.from({ length: n }, (_, i) => draw(i)).join('');
const pixelStar = (x, y, color, size = 2) => R(x - size, y, size * 3, size, color) + R(x, y - size, size, size * 3, color);

function stars(coords, color = 'var(--scene-star)') {
  return coords.map(([x, y, big], i) => G(big ? pixelStar(x, y, color) : R(x, y, 2, 2, color), `class="scene-star" style="--star-delay:-${i % 7}s"`)).join('');
}

function cloud(x, y, width, color = 'var(--scene-cloud)') {
  return G(P(`0,12 12,12 12,5 26,5 26,0 48,0 48,5 ${width - 18},5 ${width - 18},12 ${width},12 ${width},20 0,20`, color) + R(10, 20, width - 17, 4, 'var(--scene-cloud-shadow)'), `transform="translate(${x} ${y})"`);
}

function pine(x, y, size = 1, dark = false) {
  const c = dark ? '#243d45' : '#38585a';
  return G(R(-3, 33, 6, 27, '#514b48') + P('0,0 6,0 6,9 12,9 12,18 19,18 19,27 26,27 26,37 16,37 16,43 -15,43 -15,37 -25,37 -25,27 -18,27 -18,18 -11,18 -11,9 -4,9 -4,0', c) + P('0,6 4,6 4,18 11,18 11,28 18,28 18,33 6,33 6,25 -1,25 -1,34 -17,34 -17,29 -9,29 -9,20 -3,20 -3,12 0,12', dark ? '#416063' : '#628180'), `transform="translate(${x} ${y}) scale(${size})"`);
}

function cherry(x, y, scale = 1) {
  return G(
    P('-6,0 5,0 5,62 13,62 13,90 7,90 7,116 -7,116 -7,86 -12,86 -12,57 -6,57', '#775363') +
    P('-6,61 -17,61 -17,50 -28,50 -28,38 -35,38 -35,25 -28,25 -28,34 -18,34 -18,44 -6,44', '#775363') +
    P('1,39 13,39 13,25 24,25 24,15 32,15 32,28 22,28 22,43 10,43 10,65 1,65', '#775363') +
    P('-48,-14 -38,-14 -38,-28 -19,-28 -19,-38 8,-38 8,-33 31,-33 31,-24 47,-24 47,-10 57,-10 57,12 49,12 49,29 31,29 31,38 7,38 7,31 -18,31 -18,34 -35,34 -35,23 -51,23 -51,8 -58,8 -58,-6 -48,-6', 'var(--cherry-shadow)') +
    P('-48,-14 -38,-14 -38,-28 -19,-28 -19,-38 8,-38 8,-33 31,-33 31,-24 42,-24 42,-11 51,-11 51,4 39,4 39,16 19,16 19,21 -4,21 -4,16 -22,16 -22,20 -38,20 -38,10 -51,10 -51,-3 -48,-3', 'var(--cherry-main)') +
    R(-33, -21, 17, 7, 'var(--cherry-light)') + R(-18, -29, 24, 8, 'var(--cherry-light)') + R(5, -20, 20, 7, 'var(--cherry-light)') + R(-43, -3, 15, 8, 'var(--cherry-light)') + R(-17, -7, 17, 7, 'var(--cherry-light)') + R(16, -4, 17, 7, 'var(--cherry-light)') + R(34, 7, 13, 6, 'var(--cherry-light)') +
    R(-27, 19, 5, 4, 'var(--cherry-shadow)') + R(8, 24, 4, 4, 'var(--cherry-light)') + R(29, -29, 3, 3, 'var(--cherry-light)'),
    `transform="translate(${x} ${y}) scale(${scale})"`
  );
}

// 把 decor.js 的像素画嵌进 600×360 的画面：去掉自带的 class 与 style，用 x/y/width/height 定位。
// 里面的 .dc-smoke／.dc-blade 动画类保留，动画规则写在下面 .skin-art[data-scene="farm"] 作用域里。
const place = (art, x, y, w, h) => art.replace(/^<svg class="[^"]*" viewBox="([^"]*)" style="[^"]*">/, `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="$1">`);
const icon = (name, x, y, size) => `<use href="#px-${name}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;

// 原野农场（V20 第 6.2 节）：重组旧 .pixel-window 景窗的素材 —— 天空、远近两层阶梯山、农舍、风车、池塘、树和三枚作物。
// 主体放在 y 60–300、x 60–540：21:9 舞台裁掉上下各约 50，4:3 舞台裁掉左右各约 60。
// 构图同书屋：农舍与风车在中右，左下留给 >1080 时压上来的招牌；日月避开右上的控件组。
function farm() {
  const sky = R(0, 0, 600, 360, 'var(--scene-sky)');
  const sun = G(R(436, 76, 40, 24, 'var(--farm-sun)') + R(444, 68, 24, 40, 'var(--farm-sun)'), 'class="scene-sun"');
  const moon = G(P('504,40 524,40 524,44 530,44 530,64 524,64 524,70 504,70 504,64 498,64 498,44 504,44', 'var(--farm-sun)') + P('516,38 532,38 532,58 514,58 514,52 510,52 510,44 516,44', 'var(--scene-sky)'), 'class="scene-moon" transform="translate(-60 30)"');
  const far = P('0,190 40,190 40,170 96,170 96,150 150,150 150,166 210,166 210,140 270,140 270,160 330,160 330,146 400,146 400,128 456,128 456,152 520,152 520,170 600,170 600,256 0,256', 'var(--farm-far)');
  const near = P('0,206 48,206 48,186 120,186 120,166 228,166 228,186 300,186 300,150 408,150 408,176 492,176 492,206 600,206 600,256 0,256', 'var(--farm-near)');
  const ground = R(0, 250, 600, 8, 'var(--farm-g1)') + R(0, 258, 600, 24, 'var(--farm-g2)') + R(0, 282, 600, 8, 'var(--farm-path)') + R(0, 290, 600, 70, 'var(--farm-g3)') +
    repeat(19, i => R(i * 32 + 8, 258, 4, 24, 'var(--farm-tuft)')) + repeat(12, i => R((i * 53 + 21) % 590, 302 + (i * 17) % 50, 8, 4, 'var(--farm-tuft)'));
  const props = G(ground + icon('tree', 536, 198, 64) + place(HOUSE, 236, 120, 176, 168) + place(MILL, 432, 150, 108, 108) +
    place(POND, 380, 266, 160, 66) + icon('pumpkin', 200, 258, 32) + icon('sunflower', 172, 246, 32) + icon('chicken', 356, 276, 32), 'class="farm-props"');
  return sky + sun + moon + G(stars([[60, 70], [150, 52, true], [236, 84], [330, 60], [420, 92, true], [470, 58]]), 'class="scene-night-stars"') +
    cloud(64, 84, 84) + cloud(300, 66, 104) + far + near + props;
}

function coastHouse(x, y, w, h, color, roof) {
  return G(R(0, 17, w, h, color) + P(`-5,17 2,17 2,11 9,11 9,5 17,5 17,0 ${w - 15},0 ${w - 15},5 ${w - 7},5 ${w - 7},11 ${w + 1},11 ${w + 1},17 ${w + 6},17 ${w + 6},22 -5,22`, roof) + R(7, 15, w - 12, 3, '#dfa291') + R(6, 24, w - 12, 3, '#ead8b3') + R(8, 35, 15, 19, '#577a81') + R(11, 38, 9, 13, 'var(--scene-window)') + R(w - 23, 35, 15, 19, '#577a81') + R(w - 20, 38, 9, 13, 'var(--scene-window)') + R(w / 2 - 8, h - 9, 16, 26, '#52717a') + R(w / 2 - 5, h - 6, 10, 12, 'var(--scene-window)') + R(-2, h + 14, w + 4, 5, '#6e8b8b'), `transform="translate(${x} ${y})"`);
}

function coast() {
  const sky = R(0, 0, 600, 360, 'var(--scene-sky)') + R(0, 91, 600, 58, 'var(--scene-haze)') + R(0, 149, 600, 46, 'var(--scene-horizon)');
  const sun = G(P('126,38 147,38 147,43 152,43 152,63 146,63 146,69 127,69 127,64 121,64 121,45 126,45', '#f5ddb2'), 'class="scene-sun"');
  const moon = G(P('124,35 145,35 145,41 152,41 152,63 145,63 145,70 124,70 124,63 117,63 117,42 124,42', '#ede0b6') + R(121, 45, 6, 6, '#c8c9b9') + R(135, 58, 7, 4, '#d4cdb7'), 'class="scene-moon"');
  const coastHills = P('0,153 24,153 24,143 46,143 46,127 70,127 70,114 102,114 102,121 135,121 135,133 161,133 161,143 189,143 189,150 221,150 221,161 261,161 261,170 0,170', 'var(--scene-far)') + P('333,163 366,163 366,151 395,151 395,143 427,143 427,136 452,136 452,146 475,146 475,154 516,154 516,145 545,145 545,139 573,139 573,149 600,149 600,181 333,181', 'var(--scene-far)');
  const sea = R(0, 177, 600, 183, 'var(--sea-mid)') + R(0, 177, 600, 19, 'var(--sea-far)') + R(0, 249, 600, 42, 'var(--sea-near)') + R(0, 313, 600, 47, 'var(--sea-deep)');
  const waves = G(repeat(46, i => R((i * 103) % 595 - 6, 186 + (i * 23) % 163, 10 + (i % 5) * 7, 2, i % 3 ? 'var(--sea-light)' : 'var(--sea-foam)')), 'class="coast-waves"') + G(repeat(17, i => R((i * 71 + 33) % 570, 215 + (i * 17) % 137, 15 + i % 4 * 6, 2, 'var(--sea-light)')), 'class="coast-waves second"');
  const island = P('363,192 386,192 386,183 415,183 415,173 447,173 447,181 474,181 474,193 495,193 495,208 477,208 477,216 371,216 371,211 351,211 351,202 363,202', '#829992') + P('362,193 386,193 386,184 415,184 415,176 447,176 447,184 474,184 474,194 485,194 485,201 368,201 368,198 359,198', '#b0b294') + R(383, 202, 85, 4, '#617d7c') + R(410, 209, 44, 3, '#617d7c');
  const lighthouse = G(
    P('-22,105 -16,105 -16,59 -12,59 -12,18 15,18 15,59 20,59 20,105 26,105 26,111 -22,111', '#e5d5b0') +
    P('6,19 15,19 15,59 20,59 20,105 26,105 26,111 8,111 8,60 6,60', '#b4b9a7') + R(-14, 47, 32, 14, '#b76c67') + R(-17, 78, 37, 14, '#b76c67') + R(8, 47, 10, 14, '#885960') + R(9, 78, 11, 14, '#885960') +
    R(-18, 9, 38, 12, '#4f737b') + R(-13, -14, 29, 24, '#647c7d') + R(-9, -10, 21, 18, 'var(--scene-lamp)', 'scene-lamp') + R(-1, -12, 3, 21, '#637b7b') +
    P('-20,-15 -14,-15 -14,-20 -6,-20 -6,-25 7,-25 7,-20 15,-20 15,-15 22,-15 22,-10 -20,-10', '#98646b') + R(-2, -32, 3, 8, '#5a737a') +
    R(-23, 19, 48, 4, '#6b8481') + repeat(6, i => R(-22 + i * 9, 10, 2, 13, '#627b7b')) + R(-7, 96, 13, 15, '#546f73') + R(-4, 35, 9, 10, '#587d83'),
    'transform="translate(423 74)"'
  );
  const beam = G(P('417,65 149,20 149,72 417,74', '#eed89e') + P('430,65 592,39 592,94 430,74', '#eed89e'), 'class="coast-beam"');
  const shore = P('0,184 105,184 105,192 126,192 126,204 145,204 145,220 166,220 166,237 184,237 184,249 201,249 201,261 184,261 184,275 165,275 165,291 141,291 141,313 112,313 112,334 87,334 87,360 0,360', '#92a291') +
    P('0,213 91,213 91,222 112,222 112,234 134,234 134,251 155,251 155,266 143,266 143,282 118,282 118,307 87,307 87,331 63,331 63,360 0,360', '#d5bd94') +
    P('112,234 125,234 125,248 145,248 145,266 135,266 135,280 108,280 108,306 78,306 78,331 58,331 58,360 48,360 48,325 67,325 67,300 98,300 98,276 123,276 123,265 132,265 132,251 112,251', '#ebe0b7') +
    repeat(24, i => R((i * 23) % 109, 222 + (i * 31) % 137, 6, 2, i % 3 ? '#b49f82' : '#e9d5ac'));
  const village = coastHouse(13, 134, 61, 61, '#d5c3a3', '#9c7374') + coastHouse(89, 152, 48, 50, '#d5b39a', '#607e83') + R(11, 120, 4, 52, '#667c75') + R(10, 128, 31, 3, '#667c75') + R(38, 131, 4, 8, '#667c75') + R(33, 139, 13, 4, 'var(--scene-lamp)') +
    R(80, 192, 3, 22, '#486e70') + R(70, 189, 24, 12, '#567e80') + R(74, 192, 16, 5, '#e5d2a5');
  const pier = G(P('0,2 119,2 119,18 29,18 29,108 0,108', '#a88975') + P('0,0 122,0 122,12 18,12 18,108 0,108', '#d0b695') + repeat(11, i => R(0, i * 10, 18, 2, '#89746b')) + repeat(11, i => R(i * 11, 0, 2, 12, '#89746b')) + repeat(4, i => R(24 + i * 30, -4, 5, 26, '#6e7770')) + R(-3, 25, 5, 19, '#6e7770') + R(18, 57, 5, 23, '#6e7770') + R(-3, 94, 5, 22, '#6e7770') + R(103, 16, 16, 3, '#bdad8d') + R(119, 16, 3, 44, '#bdad8d'), 'transform="translate(155 235)"');
  const boat = G(P('0,36 58,36 58,42 52,42 52,48 10,48 10,44 4,44 4,40 0,40', '#955f61') + R(7, 35, 47, 4, '#e7c29b') + R(28, -7, 3, 43, '#667678') + P('25,-4 25,29 0,29 0,24 6,24 6,18 12,18 12,11 18,11 18,4 23,4 23,-4', '#f0dfb6') + P('33,3 38,3 38,12 44,12 44,20 51,20 51,29 33,29', '#cc9c82') + R(14, 50, 36, 2, 'var(--sea-light)'), 'class="coast-boat" transform="translate(330 223)"');
  const fishingBoat = G(P('0,15 54,15 54,21 48,21 48,28 10,28 10,23 4,23 4,19 0,19', '#5e6c79') + R(10, 1, 27, 14, '#c9b59b') + R(13, 4, 9, 7, '#728e96') + R(26, 4, 8, 7, '#728e96') + R(8, -2, 32, 4, '#9b726d') + R(39, -13, 3, 29, '#637d80') + R(28, -11, 24, 2, '#637d80') + R(38, 16, 5, 6, '#e4bd85'), 'transform="translate(205 298)"');
  const gulls = G(P('0,0 8,0 8,3 13,3 13,0 21,0 21,2 15,2 15,6 7,6 7,2 0,2', '#f4e7c7'), 'transform="translate(292 96)"') + G(P('0,0 6,0 6,3 11,3 11,0 17,0 17,2 13,2 13,5 4,5 4,2 0,2', '#f4e7c7'), 'transform="translate(329 83)"');
  // 21:9 舞台裁掉画面上方约 50：日月下移 30，不被裁成半个
  return sky + G(sun + moon, 'transform="translate(0 30)"') + G(stars([[57, 48], [213, 37, true], [348, 43], [510, 68, true], [558, 32]]), 'class="scene-night-stars"') + cloud(12, 71, 73) + cloud(221, 40, 101) + cloud(487, 102, 92) + coastHills + sea + waves + island + beam + lighthouse + shore + village + pier + boat + fishingBoat + gulls + R(7, 276, 5, 35, '#557f70') + R(0, 286, 15, 12, '#557f70') + R(19, 322, 5, 29, '#557f70') + R(12, 328, 19, 9, '#557f70');
}

function observatory() {
  const sky = R(0, 0, 600, 360, 'var(--scene-sky)') + R(0, 75, 600, 85, 'var(--scene-haze)') + R(0, 160, 600, 70, 'var(--scene-horizon)');
  const galaxy = P('137,0 181,0 181,17 210,17 210,35 239,35 239,53 265,53 265,71 294,71 294,89 323,89 323,107 350,107 350,125 379,125 379,144 411,144 411,166 448,166 448,188 416,188 416,173 386,173 386,155 356,155 356,137 326,137 326,119 297,119 297,101 268,101 268,83 239,83 239,65 210,65 210,46 182,46 182,28 158,28 158,13 137,13', '#615b80');
  const moon = P('496,33 519,33 519,38 527,38 527,61 521,61 521,69 498,69 498,63 490,63 490,40 496,40', '#eee3ba') + R(497, 40, 6, 6, '#c7c8b5') + R(514, 56, 6, 6, '#c7c8b5') + R(505, 60, 4, 3, '#d6d4b8');
  const mountain = P('0,202 21,202 21,187 40,187 40,171 63,171 63,146 84,146 84,129 108,129 108,142 126,142 126,160 149,160 149,178 171,178 171,192 202,192 202,180 222,180 222,163 239,163 239,149 259,149 259,130 282,130 282,112 303,112 303,127 323,127 323,145 346,145 346,166 370,166 370,185 398,185 398,170 421,170 421,154 443,154 443,138 464,138 464,155 487,155 487,177 516,177 516,184 544,184 544,169 568,169 568,155 586,155 586,174 600,174 600,279 0,279', 'var(--scene-far)') +
    P('63,146 84,146 84,130 107,130 107,142 125,142 125,158 105,158 105,151 86,151 86,159 72,159 72,169 63,169', '#8c95a5') + P('259,131 282,131 282,113 302,113 302,129 321,129 321,147 304,147 304,140 287,140 287,151 274,151 274,144 259,144', '#8c95a5') +
    P('0,263 29,263 29,246 53,246 53,232 78,232 78,220 107,220 107,231 135,231 135,250 164,250 164,260 196,260 196,244 223,244 223,228 252,228 252,216 282,216 282,225 316,225 316,242 348,242 348,258 382,258 382,244 410,244 410,221 439,221 439,206 468,206 468,218 495,218 495,238 523,238 523,244 557,244 557,231 600,231 600,360 0,360', 'var(--scene-near)');
  const terrace = P('150,260 180,260 180,248 402,248 402,256 431,256 431,266 456,266 456,285 446,285 446,297 479,297 479,312 495,312 495,360 96,360 96,334 115,334 115,307 130,307 130,280 150,280', '#657576') +
    P('155,260 183,260 183,250 400,250 400,258 428,258 428,269 448,269 448,278 151,278 151,271 143,271 143,265 155,265', '#a5a79b') + R(155, 278, 287, 5, '#7f8b85') + R(181, 286, 63, 5, '#526469') + R(335, 290, 79, 5, '#526469') + R(142, 306, 66, 5, '#526469') + R(311, 323, 103, 5, '#526469') + R(421, 342, 52, 5, '#526469');
  const dome = G(
    R(0, 77, 124, 64, '#b0b1a7') + R(84, 77, 40, 64, '#8d9a99') + R(-5, 133, 135, 10, '#697e80') + R(0, 77, 124, 7, '#738a8d') +
    P('-9,76 -9,58 -3,58 -3,40 8,40 8,24 23,24 23,13 42,13 42,7 75,7 75,13 95,13 95,25 111,25 111,40 122,40 122,58 129,58 129,76', '#829da1') +
    P('-3,58 -3,40 8,40 8,24 23,24 23,13 42,13 42,7 64,7 64,16 43,16 43,26 29,26 29,42 19,42 19,60 14,60 14,76 -9,76 -9,58', '#afbcaf') +
    P('75,7 75,13 95,13 95,25 111,25 111,40 122,40 122,58 129,58 129,76 96,76 96,56 91,56 91,38 85,38 85,23 70,23 70,7', '#597982') +
    P('52,7 66,7 66,23 61,23 61,40 58,40 58,60 57,60 57,77 42,77 42,56 43,56 43,36 47,36 47,21 52,21', '#344c60') + R(-11, 74, 142, 7, '#c0c3ad') + R(-9, 82, 137, 4, '#586f79') +
    R(15, 96, 26, 29, '#647b7f') + R(19, 100, 18, 21, 'var(--scene-window)', 'scene-window') + R(26, 100, 3, 21, '#6c7e7c') + R(19, 110, 18, 3, '#6c7e7c') +
    R(55, 98, 22, 35, '#566e77') + R(60, 104, 12, 15, 'var(--scene-window)', 'scene-window') + R(68, 125, 3, 3, '#d9b477') +
    R(92, 97, 18, 24, '#526c76') + R(96, 101, 10, 16, 'var(--scene-window)', 'scene-window') + R(42, 134, 49, 5, '#b2b49d') + R(36, 139, 62, 6, '#8c9b91'),
    'transform="translate(217 109)"'
  );
  const annex = G(R(0, 21, 58, 48, '#9eaaa0') + P('-5,21 -5,15 5,15 5,8 16,8 16,1 46,1 46,8 57,8 57,15 65,15 65,24 -5,24', '#607983') + R(4, 30, 23, 24, '#536f78') + R(8, 34, 15, 16, 'var(--scene-window)', 'scene-window') + R(34, 29, 15, 40, '#617c7e') + R(38, 34, 7, 13, 'var(--scene-window)', 'scene-window') + R(-3, 67, 65, 5, '#617b7b'), 'transform="translate(159 187)"');
  const telescope = G(
    R(0, 0, 8, 27, '#798f90') + P('0,21 7,21 7,29 13,29 13,40 19,40 19,47 13,47 13,40 7,40 7,33 0,33 0,41 -6,41 -6,47 -12,47 -12,40 -6,40 -6,29 0,29', '#a2ac9c') +
    G(P('-33,-16 -29,-22 -22,-22 -22,-28 -14,-28 -14,-22 -6,-22 -6,-16 4,-16 4,-10 15,-10 15,-4 19,-4 19,3 12,3 12,9 4,9 4,3 -6,3 -6,-3 -17,-3 -17,-9 -26,-9 -26,-16', '#aebaae') + P('-33,-16 -29,-22 -22,-22 -22,-28 -14,-28 -14,-22 -21,-22 -21,-16 -28,-16 -28,-10 -33,-10', '#3b5668') + R(11, 4, 13, 5, '#6a858b') + R(20, 8, 7, 7, '#b2bba7') + R(-1, -3, 8, 13, '#829b9d'), 'class="observatory-telescope"'),
    'transform="translate(387 223)"'
  );
  const rail = R(132, 260, 303, 3, '#657d7d') + repeat(17, i => R(134 + i * 18, 255, 3, 24, '#657d7d')) + R(132, 254, 303, 3, '#a6b2a2');
  const stairs = repeat(7, i => R(252 - i * 5, 284 + i * 11, 75 + i * 8, 7, i % 2 ? '#959e91' : '#acaf9c') + R(252 - i * 5, 291 + i * 11, 75 + i * 8, 4, '#657976'));
  const chart = G(R(0, 0, 38, 31, '#476570') + R(3, 3, 32, 24, '#263e55') + P('8,20 8,18 14,18 14,12 21,12 21,7 23,7 23,14 16,14 16,20', '#9cb6ba') + pixelStar(9, 20, '#e4cc92', 1) + pixelStar(15, 13, '#e4cc92', 1) + pixelStar(22, 8, '#e4cc92', 1) + pixelStar(29, 20, '#e4cc92', 1) + R(6, 31, 4, 18, '#596e73') + R(29, 31, 4, 18, '#596e73'), 'transform="translate(433 230)"');
  const lamp = G(R(0, 0, 4, 48, '#60767a') + R(-5, -4, 15, 5, '#82918a') + R(-3, -15, 11, 12, '#aeb497') + R(-1, -12, 7, 8, '#f4d49a') + R(-6, -19, 17, 5, '#556f76') + R(-10, 43, 23, 3, '#bca675'), 'transform="translate(149 230)"');
  const constellation = G('<path d="M62 57H89V71H113V44H141V58H160" fill="none" stroke="#8f9fb4" stroke-width="1" opacity=".55"/>' + [[62, 57], [89, 71], [113, 44], [141, 58], [160, 58]].map(([x, y]) => pixelStar(x, y, '#d7cfbb', 1)).join(''), 'class="observatory-constellation"');
  return sky + G(galaxy, 'opacity=".3"') + stars([[17, 39], [42, 107, true], [97, 28], [189, 49, true], [219, 17], [261, 48], [304, 24, true], [366, 46], [404, 22], [438, 84, true], [479, 108], [556, 27, true], [580, 83], [339, 75], [205, 89], [19, 156], [568, 124], [383, 116], [453, 31], [536, 90], [158, 102]]) + constellation + G(moon, 'transform="translate(-70 40)"') + mountain + pine(46, 225, 1.1) + pine(565, 219, 1.25) + terrace + stairs + annex + dome + telescope + rail + chart + lamp + pine(71, 264, 1.45, true) + pine(526, 262, 1.6, true) + pine(11, 304, 1.2, true) + pine(587, 310, 1.1, true) + repeat(17, i => R(117 + (i * 59) % 357, 305 + (i * 19) % 53, 6, 3, '#81908a'));
}

function diorama() {
  return `<figure class="toon-scene" data-toon-scene data-state="loading" data-light="day" aria-label="樱花书屋风景">
    <div class="toon-stage">
      <canvas data-toon-canvas role="img" aria-label="樱花树下的书屋与唱片店，远处的列车缓缓驶过">樱花树下的书屋与唱片店。</canvas>
      <p class="toon-status" data-toon-status role="status">风景正在慢慢展开…</p>
      <p class="toon-unavailable">风景暂时没有展开，先来读一篇文章吧。</p>
    </div>
  </figure>
  <div class="skin-diorama" aria-hidden="true" data-scene-paused="true">${[['coast', coast], ['observatory', observatory], ['farm', farm]].map(([name, draw]) => `<svg class="skin-art" data-scene="${name}" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${draw()}</svg>`).join('')}</div>`;
}

// 像素场景铺满舞台（V20 第 6.2 节）：svg 用 xMidYMid slice 裁切，舞台换比例时画面不变形。
const css = `
.skin-diorama{display:none;position:absolute;inset:0;overflow:hidden;isolation:isolate}
.skin-art{display:none;width:100%;height:100%;shape-rendering:crispEdges;image-rendering:pixelated}
html:is([data-skin="coast"],[data-skin="observatory"],[data-skin="farm"]) .skin-diorama{display:block}
html[data-skin="coast"] .skin-art[data-scene="coast"],html[data-skin="observatory"] .skin-art[data-scene="observatory"],html[data-skin="farm"] .skin-art[data-scene="farm"]{display:block}
.skin-art[data-scene="coast"]{--scene-sky:#9dc9d0;--scene-haze:#b7d5d2;--scene-horizon:#ded9bb;--scene-far:#89aeb0;--scene-cloud:#ece7ce;--scene-cloud-shadow:#c3d6cb;--scene-star:#e7e2c5;--scene-window:#b8d3cc;--scene-lamp:#edd49b;--sea-far:#81b5b9;--sea-mid:#639fa9;--sea-near:#518c9b;--sea-deep:#467c90;--sea-light:#8fc0be;--sea-foam:#d3dac1}
.skin-art[data-scene="observatory"]{--scene-sky:#303d5b;--scene-haze:#424f6e;--scene-horizon:#606882;--scene-far:#677b8e;--scene-near:#3e5867;--scene-star:#e4d5b1;--scene-window:#ead1a0}
/* 原野农场：色值照搬旧 .pixel-window 景窗的四季与夜间值 */
.skin-art[data-scene="farm"]{--scene-sky:#b8d4cc;--farm-sun:#fff0ac;--farm-far:#a6c3a9;--farm-near:#8bad91;--scene-cloud:#edf2da;--scene-cloud-shadow:#d3dcc0;--scene-star:#f5e2a4;--farm-g1:#899655;--farm-g2:#74824b;--farm-path:#a9986a;--farm-g3:#77834a;--farm-tuft:#566642}
html[data-season="autumn"] .skin-art[data-scene="farm"]{--scene-sky:#d6d6a9;--farm-far:#bfbf8e;--farm-near:#a5ac78}
html[data-season="winter"] .skin-art[data-scene="farm"]{--scene-sky:#bdcfd6;--farm-far:#c3d3d0;--farm-near:#dce6da;--farm-g1:#e7efe3;--farm-g2:#d8e3d8;--farm-path:#b2c5bd;--farm-g3:#d8e3d8;--farm-tuft:#b2c5bd}
html[data-time="night"] .skin-art[data-scene="coast"]{--scene-sky:#2d4b63;--scene-haze:#405e75;--scene-horizon:#71858b;--scene-far:#536f7e;--scene-cloud:#78939e;--scene-cloud-shadow:#587587;--scene-window:#ebcb97;--scene-lamp:#ffdfa3;--sea-far:#547f8e;--sea-mid:#3c657f;--sea-near:#315971;--sea-deep:#294b65;--sea-light:#7299a5;--sea-foam:#a6b5b0}
html[data-time="night"] .skin-art[data-scene="observatory"]{--scene-sky:#202e4c;--scene-haze:#303d5b;--scene-horizon:#4e5473;--scene-far:#566980;--scene-near:#32495b;--scene-window:#f5d4a0}
html[data-time="night"] .skin-art[data-scene="farm"]{--scene-sky:#263c45;--farm-sun:#f5e2a4;--farm-far:#33504f;--farm-near:#3e5a56;--scene-cloud:#4c6266;--scene-cloud-shadow:#3c5157}
html[data-time="night"] .skin-art .farm-props{filter:brightness(.78) saturate(.8)}
.skin-art .scene-moon,.skin-art .scene-night-stars,.skin-art .coast-beam{opacity:0}
html[data-time="night"] .skin-art .scene-sun{opacity:0}
html[data-time="night"] .skin-art .scene-moon,html[data-time="night"] .skin-art .scene-night-stars{opacity:1}
html[data-time="night"] .skin-art .coast-beam{opacity:.12}
.skin-art .scene-star{animation:skin-star-glow 6s ease-in-out infinite;animation-delay:var(--star-delay,0s)}
.coast-waves{animation:skin-wave-drift 8s ease-in-out infinite}.coast-waves.second{animation-direction:reverse;animation-delay:-4s}
.coast-boat{animation:skin-boat-bob 7s ease-in-out infinite;transform-origin:360px 268px}
.observatory-telescope{animation:skin-telescope-turn 18s ease-in-out infinite;transform-origin:3px 3px}
.observatory-constellation{animation:skin-star-glow 9s ease-in-out infinite}
/* 农场只留风车与炊烟两条动画（沿用 decor.js 的节奏），其余静止 */
.skin-art[data-scene="farm"] .dc-blade{animation:farm-spin 16s linear infinite}
.skin-art[data-scene="farm"] .dc-smoke{animation:farm-smoke 4.4s linear infinite;transform-origin:center}
.skin-art[data-scene="farm"] .dc-smoke.b{animation-delay:1.5s}.skin-art[data-scene="farm"] .dc-smoke.c{animation-delay:3s}
.skin-diorama[data-scene-paused="true"] *{animation-play-state:paused!important}
@keyframes skin-wave-drift{0%,100%{transform:translateX(-5px);opacity:.65}50%{transform:translateX(5px);opacity:1}}
@keyframes skin-boat-bob{0%,100%{transform:translate(330px,223px)}50%{transform:translate(334px,225px)}}
@keyframes skin-star-glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes skin-telescope-turn{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}
@keyframes farm-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes farm-smoke{0%{transform:translate(0,0) scale(.8);opacity:.5}100%{transform:translate(12px,-28px) scale(1.7);opacity:0}}
@media(prefers-reduced-motion:reduce){.skin-diorama *{animation:none!important}}
`;

// 舞台脚本：暂停键切换 .stage[data-paused]（减少动态效果时初始即暂停）；
// 像素场景的 data-scene-paused = 页面隐藏 ∨ 离屏 ∨ 用户暂停。三维书屋由 assets/toon/main.js 观察同一个属性。
const script = `(function(){
  var scenes=Array.from(document.querySelectorAll('.skin-diorama'));
  if(!scenes.length)return;
  var stage=document.querySelector('[data-stage]'),visible=new Set();
  function pause(){scenes.forEach(function(scene){scene.dataset.scenePaused=String(document.hidden||!visible.has(scene)||stage.dataset.paused==='true');});}
  var button=stage.querySelector('[data-stage-pause]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var setPaused=function(value){stage.dataset.paused=String(value);button.setAttribute('aria-pressed',String(value));button.textContent=value?'继续风景':'暂停风景';pause();};
  setPaused(reduced.matches);
  button.addEventListener('click',function(){setPaused(stage.dataset.paused!=='true');});
  reduced.addEventListener('change',function(event){setPaused(event.matches);});
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);});pause();},{threshold:0.05});
  scenes.forEach(function(scene){observer.observe(scene);});
  document.addEventListener('visibilitychange',pause);
})();`;

module.exports = { diorama, css, script };
