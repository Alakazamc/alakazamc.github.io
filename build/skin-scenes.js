// Original pixel landscapes for the appearance wardrobe. No external artwork.
// Keep the scene independent of page content; skins.js supplies the outer frame.
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

function sakura() {
  const sky = R(0, 0, 600, 360, 'var(--scene-sky)') + R(0, 90, 600, 62, 'var(--scene-haze)') + R(0, 152, 600, 56, 'var(--scene-horizon)');
  const sun = G(P('472,34 486,34 486,38 492,38 492,52 488,52 488,57 472,57 472,52 468,52 468,39 472,39', '#fce6b0'), 'class="scene-sun"');
  const moon = G(P('477,32 492,32 492,37 496,37 496,53 491,53 491,58 477,58 477,53 472,53 472,37 477,37', '#f8e3bb') + P('487,31 496,31 496,49 485,49 485,44 481,44 481,35 487,35', 'var(--scene-sky)'), 'class="scene-moon"');
  const mountains = P('0,155 22,155 22,143 48,143 48,126 72,126 72,118 96,118 96,126 119,126 119,141 145,141 145,127 169,127 169,105 194,105 194,87 223,87 223,100 249,100 249,119 272,119 272,137 300,137 300,148 333,148 333,130 356,130 356,116 389,116 389,125 417,125 417,143 448,143 448,154 486,154 486,134 517,134 517,123 546,123 546,138 575,138 575,151 600,151 600,231 0,231', 'var(--scene-far)') +
    P('0,187 37,187 37,179 77,179 77,189 109,189 109,173 133,173 133,160 163,160 163,167 188,167 188,180 224,180 224,188 260,188 260,172 289,172 289,162 321,162 321,179 351,179 351,193 394,193 394,184 430,184 430,166 461,166 461,158 491,158 491,176 521,176 521,190 563,190 563,182 600,182 600,242 0,242', 'var(--scene-near)');
  const station = G(
    R(0, 48, 166, 70, '#b3928a') + R(5, 48, 155, 64, 'var(--station-wall)') + R(6, 96, 153, 16, '#aa847d') +
    P('-12,44 -4,44 -4,37 7,37 7,29 20,29 20,21 35,21 35,12 132,12 132,21 146,21 146,29 158,29 158,37 169,37 169,44 178,44 178,51 -12,51', '#575566') +
    P('-4,37 7,37 7,29 20,29 20,21 35,21 35,12 132,12 132,21 146,21 146,29 158,29 158,37', '#6d6776') +
    R(22, 26, 124, 3, '#89808a') + R(8, 38, 153, 3, '#89808a') + R(35, 10, 99, 5, '#46485a') +
    R(17, 62, 39, 31, '#725b65') + R(21, 66, 31, 23, 'var(--scene-window)', 'scene-window') + R(35, 66, 3, 23, '#725b65') + R(21, 77, 31, 3, '#725b65') +
    R(76, 61, 29, 51, '#755b62') + R(80, 65, 21, 31, 'var(--scene-window)', 'scene-window') + R(89, 65, 3, 44, '#755b62') + R(81, 99, 6, 2, '#e7cda4') +
    R(111, 63, 29, 29, '#725b65') + R(115, 67, 21, 21, 'var(--scene-window)', 'scene-window') + R(123, 67, 3, 21, '#725b65') +
    R(52, 43, 63, 15, '#7a5261') + R(56, 46, 55, 8, '#efe0bd') + repeat(5, i => R(62 + i * 9, 48, 4, 4, '#9f7479')) +
    R(149, 81, 18, 31, '#a64f5c') + R(152, 84, 12, 13, '#8cabb1') + repeat(3, i => R(153 + i * 4, 87, 2, 6, ['#f4d78f', '#b8d0c1', '#f0b0a1'][i])) + R(153, 101, 7, 3, '#e4c8ae') + R(153, 108, 10, 2, '#693f4c'),
    'transform="translate(369 117)"'
  );
  const platform = R(0, 233, 600, 15, '#c2b3a4') + R(0, 248, 600, 9, '#f0dbb6') + R(0, 254, 600, 7, '#8c7779') + repeat(25, i => R(i * 25, 247, 18, 2, '#a78878')) +
    R(0, 261, 600, 46, '#7f7577') + repeat(38, i => R(i * 17, 269, 6, 27, '#514b57')) + R(0, 271, 600, 4, '#c0b6b3') + R(0, 275, 600, 2, '#494755') + R(0, 290, 600, 4, '#c0b6b3') + R(0, 294, 600, 3, '#494755') +
    repeat(52, i => R((i * 47) % 600, 263 + (i * 11) % 40, 4 + i % 3, 2, i % 2 ? '#a49a93' : '#5d5861'));
  const canopy = G(R(0, 30, 5, 48, '#6c5963') + R(95, 30, 5, 48, '#6c5963') + R(-8, 23, 115, 8, '#695668') + R(-4, 19, 107, 5, '#9c7985') + R(9, 13, 79, 7, '#bc8f97') + R(19, 58, 63, 5, '#9c7180') + R(19, 64, 63, 3, '#765262') + R(23, 67, 4, 10, '#765262') + R(73, 67, 4, 10, '#765262') + R(33, 29, 32, 13, '#f0d6af') + R(38, 34, 22, 3, '#8a6468'), 'transform="translate(175 155)"');
  const fence = repeat(14, i => R(95 + i * 18, 215, 3, 20, '#657c72')) + R(91, 221, 260, 3, '#839688') + R(91, 229, 260, 3, '#839688');
  const wires = R(0, 101, 600, 2, '#55525f') + R(0, 114, 600, 1, '#74707b') + R(309, 88, 5, 165, '#685c65') + R(283, 96, 57, 4, '#685c65') + R(287, 92, 4, 7, '#b2a0a1') + R(331, 92, 4, 7, '#b2a0a1') + R(314, 133, 28, 3, '#685c65') + R(337, 135, 5, 13, '#685c65') + R(329, 146, 21, 5, '#a28d82') + R(332, 151, 15, 3, 'var(--scene-lamp)', 'scene-lamp');
  const crossing = G(R(0, 0, 5, 67, '#6d6068') + repeat(5, i => R(0, 9 + i * 12, 5, 6, '#e1bf7c')) + P('-11,-8 -5,-8 -5,-3 0,-3 0,2 5,2 5,-3 10,-3 10,-8 16,-8 16,-1 10,-1 10,4 5,4 5,9 10,9 10,14 16,14 16,20 10,20 10,14 5,14 5,9 0,9 0,14 -5,14 -5,20 -11,20 -11,14 -5,14 -5,9 0,9 0,4 -5,4 -5,-1 -11,-1', '#d9b779') + R(-12, 24, 29, 10, '#514852') + R(-9, 27, 6, 4, '#d77573') + R(8, 27, 6, 4, '#bd5e68') + R(-3, 45, 64, 5, '#e6be77') + repeat(6, i => R(i * 11, 45, 5, 5, '#63535e')), 'transform="translate(73 220)"');
  const train = G(
    R(0, 19, 238, 5, '#504954') + P('7,0 221,0 221,4 231,4 231,11 237,11 237,48 0,48 0,9 4,9 4,4 7,4', '#f1d5b4') +
    R(4, 30, 231, 12, '#9d5866') + R(4, 42, 231, 6, '#765362') + R(10, 4, 207, 4, '#bfa2a0') +
    repeat(7, i => R(14 + i * 28, 12, 22, 16, '#5d7a88') + R(16 + i * 28, 14, 7, 12, '#9ebbbb') + R(17 + i * 28, 13, 3, 3, '#d7d4bd')) +
    R(105, 10, 19, 34, '#ba9d96') + R(108, 13, 13, 14, '#76969c') + R(114, 11, 2, 32, '#8c7378') +
    R(219, 12, 12, 15, '#5d7a88') + R(230, 32, 5, 5, 'var(--scene-lamp)') + R(2, 32, 4, 5, '#bf6d70') +
    R(18, 47, 28, 6, '#524851') + R(26, 51, 10, 4, '#3c3b48') + R(182, 47, 28, 6, '#524851') + R(190, 51, 10, 4, '#3c3b48') + R(90, -5, 34, 5, '#9f9095'),
    'class="sakura-train" transform="translate(128 229)"'
  );
  const foreground = R(0, 309, 600, 51, 'var(--scene-ground)') + R(0, 305, 600, 5, '#c0b496') + repeat(26, i => R(i * 24, 315 + (i % 3) * 8, 11, 3, '#78917b')) +
    P('238,309 341,309 341,317 354,317 354,331 370,331 370,346 386,346 386,360 199,360 199,346 211,346 211,330 225,330 225,317 238,317', '#cdb9a3') + repeat(9, i => R(232 + (i * 47) % 113, 317 + (i * 13) % 40, 9, 2, '#ac9c91')) +
    cherry(31, 214, 1.2) + cherry(562, 215, 1.22) +
    repeat(26, i => R((i * 67 + 5) % 600, 327 + (i * 7) % 28, 4, 3, i % 3 ? '#dba2b4' : '#f5c8d0')) +
    R(424, 316, 3, 19, '#526b66') + R(415, 314, 22, 5, '#785661') + R(410, 309, 32, 7, '#ba7985') + R(414, 311, 23, 2, '#e5b2b7');
  const petals = G(repeat(10, i => R((i * 59 + 17) % 565, 85 + (i * 41) % 205, 4, 3, '#f4b9cd')), 'class="sakura-petals"') + G(repeat(7, i => R((i * 83 + 59) % 565, 102 + (i * 43) % 210, 3, 3, '#f9d5dc')), 'class="sakura-petals second"');
  return sky + sun + moon + G(stars([[65, 44], [147, 72], [250, 29, true], [375, 66], [421, 31], [553, 79, true]]), 'class="scene-night-stars"') + cloud(79, 47, 80) + cloud(267, 65, 99) + mountains + cherry(349, 154, .6) + station + fence + canopy + wires + platform + train + crossing + foreground + petals;
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
  return sky + sun + moon + G(stars([[57, 48], [213, 37, true], [348, 43], [510, 68, true], [558, 32]]), 'class="scene-night-stars"') + cloud(12, 71, 73) + cloud(221, 40, 101) + cloud(487, 102, 92) + coastHills + sea + waves + island + beam + lighthouse + shore + village + pier + boat + fishingBoat + gulls + R(7, 276, 5, 35, '#557f70') + R(0, 286, 15, 12, '#557f70') + R(19, 322, 5, 29, '#557f70') + R(12, 328, 19, 9, '#557f70');
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
  return sky + G(galaxy, 'opacity=".3"') + stars([[17, 39], [42, 107, true], [97, 28], [189, 49, true], [219, 17], [261, 48], [304, 24, true], [366, 46], [404, 22], [438, 84, true], [479, 108], [556, 27, true], [580, 83], [339, 75], [205, 89], [19, 156], [568, 124], [383, 116], [453, 31], [536, 90], [158, 102]]) + constellation + moon + mountain + pine(46, 225, 1.1) + pine(565, 219, 1.25) + terrace + stairs + annex + dome + telescope + rail + chart + lamp + pine(71, 264, 1.45, true) + pine(526, 262, 1.6, true) + pine(11, 304, 1.2, true) + pine(587, 310, 1.1, true) + repeat(17, i => R(117 + (i * 59) % 357, 305 + (i * 19) % 53, 6, 3, '#81908a'));
}

function diorama() {
  return `<figure class="toon-scene" data-toon-scene data-state="loading" data-light="day" aria-label="樱花书屋风景">
    <div class="toon-stage">
      <canvas data-toon-canvas role="img" aria-label="樱花树下的书屋与唱片店，远处的列车缓缓驶过">樱花树下的书屋与唱片店。</canvas>
      <p class="toon-status" data-toon-status role="status">风景正在慢慢展开…</p>
      <p class="toon-unavailable">风景暂时没有展开，先来读一篇文章吧。</p>
    </div>
    <figcaption class="toon-caption">
      <span class="toon-place">樱花书屋</span>
      <div class="toon-light" role="group" aria-label="风景光线">
        <button type="button" data-toon-light="day" aria-pressed="true">午后</button>
        <button type="button" data-toon-light="night" aria-pressed="false">入夜</button>
      </div>
      <button type="button" class="toon-pause" data-toon-pause aria-pressed="false">暂停风景</button>
    </figcaption>
  </figure>
  <div class="skin-diorama" aria-hidden="true" data-scene-paused="true">${[['coast', coast], ['observatory', observatory]].map(([name, draw]) => `<svg class="skin-art" data-scene="${name}" viewBox="0 0 600 360" width="600" height="360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${draw()}</svg>`).join('')}</div>`;
}

function backdrop() {
  const sprig = R(28, 19, 3, 122, '#9b7180') + repeat(5, i => G(R(4, 0, 12, 6, '#c892a7') + R(0, 5, 20, 9, '#c892a7') + R(4, 14, 12, 6, '#c892a7') + R(7, 6, 6, 6, '#f1c8c8'), `transform="translate(${i % 2 ? 31 : 8} ${20 + i * 23})"`));
  const sea = repeat(5, i => P(`5,${21 + i * 26} 17,${21 + i * 26} 17,${17 + i * 26} 30,${17 + i * 26} 30,${21 + i * 26} 43,${21 + i * 26} 43,${25 + i * 26} 56,${25 + i * 26} 56,${28 + i * 26} 40,${28 + i * 26} 40,${24 + i * 26} 27,${24 + i * 26} 27,${20 + i * 26} 20,${20 + i * 26} 20,${24 + i * 26} 5,${24 + i * 26}`, '#5b929b'));
  const sky = [[18, 25], [43, 55], [24, 86], [46, 128]].map(([x, y]) => pixelStar(x, y, '#a3a5b5', 3)).join('') + '<path d="M18 25H43V55H24V86H46V128" fill="none" stroke="#8e96ac" stroke-width="1"/>';
  return `<div class="skin-backdrop" aria-hidden="true">${[['sakura', sprig], ['coast', sea], ['observatory', sky]].map(([name, art]) => ['left', 'right'].map(side => `<svg class="skin-edge ${side}" data-scene="${name}" viewBox="0 0 64 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${art}</svg>`).join('')).join('')}</div>`;
}

const css = `
.skin-diorama{display:none;width:100%;overflow:hidden;isolation:isolate}
.skin-art{display:none;width:100%;height:auto;aspect-ratio:5/3;overflow:hidden;shape-rendering:crispEdges;image-rendering:pixelated}
html[data-skin="coast"] .skin-diorama,html[data-skin="observatory"] .skin-diorama{display:block}
html[data-skin="coast"] .skin-art[data-scene="coast"],html[data-skin="observatory"] .skin-art[data-scene="observatory"]{display:block}
.skin-art[data-scene="sakura"]{--scene-sky:#b7c9d2;--scene-haze:#d0cbd1;--scene-horizon:#e5cfd0;--scene-far:#a2a9b9;--scene-near:#8b9d98;--scene-ground:#91a287;--scene-cloud:#eee0d9;--scene-cloud-shadow:#d6cbd0;--scene-star:#e6d9d4;--scene-window:#c4d2c8;--scene-lamp:#f5d8a0;--station-wall:#e6c9b1;--cherry-main:#dca0b6;--cherry-shadow:#bd809b;--cherry-light:#f4c1ce}
.skin-art[data-scene="coast"]{--scene-sky:#9dc9d0;--scene-haze:#b7d5d2;--scene-horizon:#ded9bb;--scene-far:#89aeb0;--scene-cloud:#ece7ce;--scene-cloud-shadow:#c3d6cb;--scene-star:#e7e2c5;--scene-window:#b8d3cc;--scene-lamp:#edd49b;--sea-far:#81b5b9;--sea-mid:#639fa9;--sea-near:#518c9b;--sea-deep:#467c90;--sea-light:#8fc0be;--sea-foam:#d3dac1}
.skin-art[data-scene="observatory"]{--scene-sky:#303d5b;--scene-haze:#424f6e;--scene-horizon:#606882;--scene-far:#677b8e;--scene-near:#3e5867;--scene-star:#e4d5b1;--scene-window:#ead1a0}
html[data-time="night"] .skin-art[data-scene="sakura"]{--scene-sky:#334059;--scene-haze:#48516b;--scene-horizon:#665f78;--scene-far:#535c75;--scene-near:#4f6868;--scene-ground:#5b7467;--scene-cloud:#778196;--scene-cloud-shadow:#606c86;--scene-window:#f0c990;--scene-lamp:#ffe0a4;--station-wall:#b3a59d;--cherry-main:#b483a2;--cherry-shadow:#825d83;--cherry-light:#d5a0ba}
html[data-time="night"] .skin-art[data-scene="coast"]{--scene-sky:#2d4b63;--scene-haze:#405e75;--scene-horizon:#71858b;--scene-far:#536f7e;--scene-cloud:#78939e;--scene-cloud-shadow:#587587;--scene-window:#ebcb97;--scene-lamp:#ffdfa3;--sea-far:#547f8e;--sea-mid:#3c657f;--sea-near:#315971;--sea-deep:#294b65;--sea-light:#7299a5;--sea-foam:#a6b5b0}
html[data-time="night"] .skin-art[data-scene="observatory"]{--scene-sky:#202e4c;--scene-haze:#303d5b;--scene-horizon:#4e5473;--scene-far:#566980;--scene-near:#32495b;--scene-window:#f5d4a0}
.skin-art .scene-moon,.skin-art .scene-night-stars,.skin-art .coast-beam{opacity:0}
html[data-time="night"] .skin-art .scene-sun{opacity:0}
html[data-time="night"] .skin-art .scene-moon,html[data-time="night"] .skin-art .scene-night-stars{opacity:1}
html[data-time="night"] .skin-art .coast-beam{opacity:.12}
.skin-art .scene-star{animation:skin-star-glow 6s ease-in-out infinite;animation-delay:var(--star-delay,0s)}
.sakura-train{animation:skin-train-pass 36s linear infinite;animation-delay:-12s}
.sakura-petals{animation:skin-petal-drift 11s ease-in-out infinite;animation-delay:-3s}.sakura-petals.second{animation-duration:14s;animation-delay:-8s}
.coast-waves{animation:skin-wave-drift 8s ease-in-out infinite}.coast-waves.second{animation-direction:reverse;animation-delay:-4s}
.coast-boat{animation:skin-boat-bob 7s ease-in-out infinite;transform-origin:360px 268px}
.observatory-telescope{animation:skin-telescope-turn 18s ease-in-out infinite;transform-origin:3px 3px}
.observatory-constellation{animation:skin-star-glow 9s ease-in-out infinite}
.skin-diorama[data-scene-paused="true"] *{animation-play-state:paused!important}
@keyframes skin-train-pass{from{transform:translate(-270px,229px)}to{transform:translate(650px,229px)}}
@keyframes skin-petal-drift{0%,100%{transform:translate(0,0);opacity:.35}50%{transform:translate(18px,16px);opacity:.8}}
@keyframes skin-wave-drift{0%,100%{transform:translateX(-5px);opacity:.65}50%{transform:translateX(5px);opacity:1}}
@keyframes skin-boat-bob{0%,100%{transform:translate(330px,223px)}50%{transform:translate(334px,225px)}}
@keyframes skin-star-glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes skin-telescope-turn{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}
.skin-backdrop{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.skin-edge{display:none;position:absolute;width:64px;height:160px;shape-rendering:crispEdges;opacity:.28}
.skin-edge.left{left:24px;top:26vh}.skin-edge.right{right:24px;bottom:15vh;transform:scaleX(-1)}
html[data-skin="sakura"] .skin-edge[data-scene="sakura"],html[data-skin="coast"] .skin-edge[data-scene="coast"],html[data-skin="observatory"] .skin-edge[data-scene="observatory"]{display:block}
@media(max-width:1240px){.skin-backdrop{display:none}}
@media(prefers-reduced-motion:reduce){.skin-diorama *{animation:none!important}.sakura-train{transform:translate(128px,229px)}}
`;

const script = `(function(){
  var scenes=Array.from(document.querySelectorAll('.skin-diorama'));
  if(!scenes.length)return;
  var visible=new Set();
  function pause(){scenes.forEach(function(scene){scene.dataset.scenePaused=String(document.hidden||!visible.has(scene));});}
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);});pause();},{threshold:0.05});
  scenes.forEach(function(scene){observer.observe(scene);});
  document.addEventListener('visibilitychange',pause);
})();`;

module.exports = { diorama, backdrop, css, script };
