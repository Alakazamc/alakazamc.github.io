import * as THREE from 'three';
import { cel, flat } from './vendor/core/toon.js';
import { bake, trs } from './vendor/core/util.js';

/*
 * Alakazam's little bookshop — authored for the homepage's primary camera.
 * Construction follows the recessed frontage / material-batch approach in
 * Sakura Crossing, src/world/shops.js, Kenton Wang (2026), MIT, revision
 * de01898e89c7f6ab3fad93fa802f0f5ac66fbd81. No shop artwork or source blocks
 * are copied here. The imported renderer/helpers retain their MIT notice.
 * All lettering, geometry and the bookshop composition below are original.
 */

function lettering(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function shopSign() {
  return lettering(1536, 288, (ctx, w, h) => {
    ctx.fillStyle = '#f7edce';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b8b998';
    ctx.lineWidth = 4;
    ctx.strokeRect(17, 17, w - 34, h - 34);
    ctx.fillStyle = '#315d58';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 144px "Noto Serif SC", "SimSun", serif';
    ctx.fillText('小 小 书 屋', w / 2, 117);
    ctx.font = '500 29px Georgia, serif';
    ctx.fillText('A L A K A Z A M   ·   B O O K S  &  R E C O R D S', w / 2, 224);
    // A small drawn open book at either end; broad enough to read at distance.
    for (const x of [126, w - 126]) {
      ctx.save();
      ctx.translate(x, 115);
      ctx.strokeStyle = '#ba775e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -31); ctx.quadraticCurveTo(-21, -43, -43, -31);
      ctx.lineTo(-43, 31); ctx.quadraticCurveTo(-21, 19, 0, 32);
      ctx.quadraticCurveTo(21, 19, 43, 31); ctx.lineTo(43, -31);
      ctx.quadraticCurveTo(21, -43, 0, -31); ctx.lineTo(0, 32);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function dailyBoard() {
  return lettering(512, 704, (ctx, w, h) => {
    ctx.fillStyle = '#345752';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#bbccb0'; ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = '#f5e8c6';
    ctx.textAlign = 'center';
    ctx.font = 'italic 72px Georgia, serif';
    ctx.fillText('OPEN', w / 2, 140);
    ctx.font = '44px "KaiTi", "SimSun", serif';
    ctx.fillText('翻几页书', w / 2, 261);
    ctx.fillText('听一张唱片', w / 2, 328);
    ctx.strokeStyle = '#ddb78a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(107, 377); ctx.quadraticCurveTo(256, 392, 405, 377); ctx.stroke();
    ctx.font = '25px Georgia, serif'; ctx.fillText('take your time', w / 2, 608);
    ctx.beginPath(); ctx.arc(256, 484, 63, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(256, 484, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e3ae87'; ctx.beginPath(); ctx.arc(256, 484, 7, 0, Math.PI * 2); ctx.fill();
  });
}

function recordSleeve() {
  return lettering(384, 384, (ctx, w, h) => {
    ctx.fillStyle = '#dd977e'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f5ddb2'; ctx.beginPath(); ctx.arc(198, 159, 104, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#437168'; ctx.fillRect(0, 239, w, 145);
    ctx.fillStyle = '#f7edce'; ctx.textAlign = 'center'; ctx.font = '30px Georgia, serif';
    ctx.fillText('SLOW AFTERNOON', w / 2, 312);
    ctx.font = '18px Georgia, serif'; ctx.fillText('33⅓  /  SIDE A', w / 2, 348);
  });
}

/**
 * Local +Z is the street. Main footprint 6.5 × 5 m, ridge height 5.79 m.
 * Eaves reach ±3.65 m in X; entrance details reach +3.76 m in Z.
 * The returned lanterns are independent materials: the scene may tint them.
 */
export function makeBookshop() {
  const group = new THREE.Group();
  group.name = 'alakazam-bookshop';
  const lanterns = [];
  const materials = {
    wall: cel({ color: 0xf1ddbb, tint: 0x8b7794 }),
    plaster: cel({ color: 0xe6c8aa, tint: 0x89748b }),
    stone: cel({ color: 0xc8c0ae, tint: 0x858395 }),
    step: cel({ color: 0xe3d8bd, tint: 0x8b859b }),
    trim: cel({ color: 0x3f7169, tint: 0x665c86 }),
    trimLight: cel({ color: 0x639287, tint: 0x727492 }),
    roof: cel({ color: 0x546f75, tint: 0x6b638a }),
    roofEdge: cel({ color: 0x71918e, tint: 0x716d91 }),
    wood: cel({ color: 0x957252, tint: 0x84657d }),
    woodLight: cel({ color: 0xcda277, tint: 0x99798d }),
    dark: cel({ color: 0x3c414b, tint: 0x696081 }),
    brass: cel({ color: 0xd7aa69, tint: 0x9a7b80 }),
    cream: cel({ color: 0xf2e4bb, tint: 0xa391a7 }),
    leaf: cel({ color: 0x688d61, tint: 0x6b7790 }),
    leafLight: cel({ color: 0x9bad74, tint: 0x849289 }),
    clay: cel({ color: 0xc57e5e, tint: 0x987b90 }),
  };
  const books = [0xc08066, 0x6d8e84, 0xd2b16e, 0x8398a7, 0xb296a4, 0xe1cfab]
    .map(color => cel({ color, tint: 0x84718f }));
  const batches = new Map();
  function part(material, geometry, matrix) {
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push({ geometry, matrix });
  }
  function box(material, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
    part(material, new THREE.BoxGeometry(w, h, d), trs(x, y, z, rx, ry, rz));
  }
  function cylinder(material, top, bottom, h, segments, x, y, z, rx = 0, ry = 0, rz = 0) {
    part(material, new THREE.CylinderGeometry(top, bottom, h, segments), trs(x, y, z, rx, ry, rz));
  }
  function pane(w, h, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.userData.noOutline = true;
    mesh.userData.noShadow = true;
    group.add(mesh);
    return mesh;
  }

  // An actual open shopfront, with the rear wall 1.4 m behind the glass.
  box(materials.wall, 6.5, 4.17, 3.6, 0, 2.225, -0.7);
  box(materials.stone, 6.65, 0.30, 5.06, 0, 0.15, 0);
  box(materials.wood, 5.62, 0.10, 1.50, 0, 0.34, 1.90);
  for (const x of [-3.025, 3.025]) {
    box(materials.wall, 0.45, 2.5, 1.4, x, 1.55, 1.8);
    box(materials.plaster, 0.47, 0.55, 0.10, x, 0.58, 2.52);
  }
  box(materials.wall, 6.5, 1.64, 1.4, 0, 3.49, 1.8);
  box(materials.trim, 6.62, 0.13, 5.14, 0, 4.25, 0);
  box(materials.wood, 5.7, 0.11, 1.43, 0, 2.69, 1.82);

  // The gable shape and roof pitch share one set of endpoints.
  const eave = 4.31, rise = 1.35, halfWidth = 3.62;
  const angle = Math.atan2(rise, halfWidth);
  const slopeLength = Math.hypot(halfWidth, rise);
  const triangle = new THREE.Shape();
  const gableShoulder = rise * (1 - 3.25 / halfWidth);
  triangle.moveTo(-3.25, 0); triangle.lineTo(3.25, 0);
  triangle.lineTo(3.25, gableShoulder); triangle.lineTo(0, rise);
  triangle.lineTo(-3.25, gableShoulder); triangle.closePath();
  const gableGeometry = new THREE.ExtrudeGeometry(triangle, { depth: 0.12, bevelEnabled: false });
  for (const z of [-2.48, 2.37]) part(materials.wall, gableGeometry.clone(), trs(0, eave, z));
  gableGeometry.dispose();
  for (const side of [-1, 1]) {
    box(materials.roof, slopeLength + 0.05, 0.14, 5.68,
      side * halfWidth / 2, eave + rise / 2, 0, 0, 0, -side * angle);
    // Pronounced front fascia is the readable roof silhouette, not dense noise.
    box(materials.wood, slopeLength + 0.12, 0.18, 0.12,
      side * halfWidth / 2, eave + rise / 2 - 0.05, 2.86, 0, 0, -side * angle);
    box(materials.roofEdge, slopeLength + 0.05, 0.045, 0.07,
      side * halfWidth / 2, eave + rise / 2 + 0.09, 2.88, 0, 0, -side * angle);
    // Tile seams follow the slope; all share one material batch.
    for (let i = 0; i < 10; i++) {
      box(materials.roofEdge, slopeLength, 0.025, 0.036,
        side * halfWidth / 2, eave + rise / 2 + 0.079, -2.49 + i * 0.55,
        0, 0, -side * angle);
    }
    for (const t of [0.30, 0.62, 0.91]) {
      box(materials.roofEdge, 0.055, 0.035, 5.66,
        side * halfWidth * t, eave + rise * (1 - t) + 0.085, 0,
        0, 0, -side * angle);
    }
    cylinder(materials.trim, 0.075, 0.075, 5.74, 8,
      side * 3.63, eave - 0.05, 0, Math.PI / 2);
  }
  cylinder(materials.roofEdge, 0.115, 0.115, 5.81, 8, 0, eave + rise + 0.03, 0, Math.PI / 2);

  // Small attic vent, sun-bleached timber, and a restrained front sign.
  box(materials.trim, 0.90, 0.57, 0.09, 0, 4.64, 2.52);
  box(materials.dark, 0.72, 0.41, 0.03, 0, 4.64, 2.575);
  for (let i = 0; i < 4; i++) box(materials.trimLight, 0.75, 0.045, 0.07, 0, 4.50 + i * 0.094, 2.61);
  box(materials.wood, 5.34, 0.90, 0.18, 0, 3.68, 2.58);
  box(materials.cream, 5.18, 0.76, 0.025, 0, 3.68, 2.684);
  pane(5.12, 0.73, flat({ map: shopSign(), cache: false }), 0, 3.68, 2.704);
  for (const x of [-2.72, 2.72]) {
    box(materials.wood, 0.065, 0.98, 0.07, x, 3.67, 2.60);
  }

  // Teal-painted joinery: two display windows and a slightly recessed door.
  const front = 2.40;
  for (const x of [-2.79, -0.45, 0.88, 2.78]) {
    box(materials.trim, 0.115, 2.33, 0.14, x, 1.515, front);
  }
  for (const y of [0.42, 2.63]) box(materials.trim, 5.66, 0.12, 0.17, 0, y, front);
  box(materials.trim, 2.31, 0.12, 0.16, -1.62, 1.02, front);
  box(materials.trim, 1.82, 0.12, 0.16, 1.83, 1.02, front);
  for (const x of [-1.63, 1.83]) box(materials.trim, 0.055, 1.59, 0.11, x, 1.81, front);
  const glass = flat({ color: 0xbfd4cc, transparent: true, opacity: 0.11, depthWrite: false, cache: false });
  pane(2.20, 2.05, glass, -1.62, 1.51, front - 0.012);
  pane(1.76, 2.05, glass, 1.83, 1.51, front - 0.012);
  // Door sits behind the outer frame; warm interior remains visible through it.
  for (const x of [-0.36, 0.78]) box(materials.trim, 0.10, 2.19, 0.12, x, 1.47, 2.20);
  for (const y of [0.44, 0.86, 2.51]) box(materials.trim, 1.23, 0.10, 0.12, 0.21, y, 2.20);
  box(materials.trimLight, 1.12, 0.33, 0.08, 0.21, 0.65, 2.20);
  pane(1.08, 1.55, glass, 0.21, 1.69, 2.195);
  cylinder(materials.brass, 0.022, 0.022, 0.31, 8, 0.63, 1.30, 2.30);
  for (const y of [1.16, 1.44]) box(materials.brass, 0.035, 0.035, 0.10, 0.63, y, 2.27);

  // Shelf geometry occupies the recess, rather than being printed on the glass.
  box(materials.wood, 5.37, 2.09, 0.07, 0, 1.49, 1.125);
  for (const x of [-2.67, -0.60, 0.83, 2.64]) {
    box(materials.woodLight, 0.065, 1.92, 0.48, x, 1.48, 1.40);
  }
  for (const y of [0.58, 1.18, 1.82, 2.40]) {
    box(materials.woodLight, 2.14, 0.055, 0.49, -1.62, y, 1.41);
    box(materials.woodLight, 1.85, 0.055, 0.49, 1.74, y, 1.41);
  }
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 12; i++) {
      const width = 0.105 + ((i + row) % 3) * 0.018;
      const height = 0.34 + ((i * 2 + row) % 4) * 0.043;
      const x = i < 7 ? -2.49 + i * 0.265 : 0.98 + (i - 7) * 0.29;
      const y = [0.625, 1.225, 1.865][row] + height / 2;
      box(books[(i + row * 2) % books.length], width, height, 0.27, x, y, 1.59);
      box(materials.cream, width * 0.72, 0.018, 0.012, x, y + height * 0.21, 1.731);
    }
  }

  // A taut, fine-striped canvas awning: consistent stripe cadence and edge.
  const canopyWidth = 5.87, canopyLength = 1.05, canopyAngle = 0.19;
  const stripeCount = 26;
  for (let i = 0; i < stripeCount; i++) {
    const stripeWidth = canopyWidth / stripeCount;
    const x = -canopyWidth / 2 + (i + 0.5) * stripeWidth;
    const material = i % 2 ? materials.cream : materials.trimLight;
    box(material, stripeWidth + 0.003, 0.035, canopyLength, x, 2.91, 2.85, canopyAngle);
    box(material, stripeWidth + 0.003, 0.17, 0.035, x, 2.72, 3.368);
  }
  box(materials.trim, 5.98, 0.075, 0.08, 0, 3.035, 2.335);
  box(materials.trim, 5.94, 0.052, 0.07, 0, 2.815, 3.374);
  for (const x of [-2.88, 2.88]) box(materials.brass, 0.025, 0.025, 0.88, x, 2.72, 2.93, -0.31);

  // Right side window is a quiet break in the long cream wall.
  box(materials.wood, 0.12, 1.28, 1.49, 3.30, 2.67, -0.42);
  box(materials.dark, 0.024, 1.06, 1.23, 3.375, 2.69, -0.42);
  box(materials.trim, 0.09, 1.10, 0.055, 3.41, 2.69, -0.42);
  box(materials.trim, 0.09, 0.055, 1.28, 3.41, 2.69, -0.42);
  for (const z of [-1.31, 0.48]) {
    box(materials.trimLight, 0.12, 1.29, 0.34, 3.33, 2.67, z);
    for (let i = 0; i < 6; i++) box(materials.trim, 0.025, 0.035, 0.29, 3.40, 2.22 + i * 0.17, z);
  }
  box(materials.woodLight, 0.42, 0.12, 1.75, 3.42, 2.005, -0.42);
  cylinder(materials.trim, 0.055, 0.055, 3.92, 8, 3.34, 2.10, -2.30);
  box(materials.plaster, 0.06, 0.37, 4.76, 3.277, 0.48, 0);

  // Two generous steps keep the entrance grounded in the scene.
  box(materials.stone, 6.17, 0.12, 0.73, 0, 0.06, 2.81);
  box(materials.step, 5.98, 0.11, 0.53, 0, 0.175, 2.66);
  box(materials.step, 5.76, 0.12, 0.30, 0, 0.29, 2.55);

  // 1. Outdoor browsing table, low enough not to cover the shelf window.
  const tx = -1.80, tz = 3.02;
  box(materials.woodLight, 1.41, 0.10, 0.67, tx, 0.92, tz);
  box(materials.wood, 1.31, 0.07, 0.54, tx, 0.60, tz);
  for (const x of [-0.57, 0.57]) for (const z of [-0.24, 0.24]) {
    box(materials.wood, 0.075, 0.78, 0.075, tx + x, 0.49, tz + z);
  }
  for (let i = 0; i < 3; i++) {
    const x = tx - 0.43 + i * 0.43;
    box(books[i], 0.31, 0.055, 0.40, x, 1.001, tz, 0, (i - 1) * 0.08);
    box(materials.cream, 0.28, 0.039, 0.365, x, 1.031, tz, 0, (i - 1) * 0.08);
    box(books[i], 0.31, 0.025, 0.40, x, 1.058, tz, 0, (i - 1) * 0.08);
  }
  box(materials.cream, 0.60, 0.07, 0.37, tx - 0.17, 0.677, tz);
  box(books[3], 0.63, 0.04, 0.39, tx - 0.17, 0.734, tz);

  // 2. Vinyl crate, with one warm graphic sleeve facing the visitor.
  const cx = 1.63, cz = 3.02;
  box(materials.wood, 1.05, 0.10, 0.70, cx, 0.27, cz);
  for (const x of [-0.48, 0.48]) box(materials.woodLight, 0.075, 0.54, 0.73, cx + x, 0.51, cz);
  for (const z of [-0.34, 0.34]) for (const y of [0.36, 0.61]) {
    box(materials.woodLight, 1.05, 0.16, 0.07, cx, y, cz + z);
  }
  for (let i = 0; i < 5; i++) {
    box(books[i], 0.57, 0.59, 0.027, cx, 0.66 + i * 0.012, cz + 0.22 - i * 0.095, -0.10);
  }
  pane(0.555, 0.555, flat({ map: recordSleeve(), cache: false }), cx, 0.684, cz + 0.267, -0.10);
  cylinder(materials.dark, 0.232, 0.232, 0.018, 32, cx + 0.15, 0.92, cz - 0.25, Math.PI / 2);
  cylinder(materials.brass, 0.061, 0.061, 0.020, 20, cx + 0.15, 0.92, cz - 0.238, Math.PI / 2);

  // 3. Hand-lettered A-board, offset so it leaves the door clear.
  box(materials.wood, 0.75, 1.15, 0.075, -2.83, 0.70, 3.38, -0.13);
  pane(0.65, 1.00, flat({ map: dailyBoard(), cache: false }), -2.83, 0.71, 3.436, -0.13);
  for (const x of [-3.17, -2.49]) {
    box(materials.woodLight, 0.065, 1.36, 0.08, x, 0.69, 3.30, -0.13);
    box(materials.wood, 0.060, 1.21, 0.08, x, 0.61, 3.05, 0.26);
  }
  box(materials.woodLight, 0.85, 0.08, 0.12, -2.83, 1.27, 3.44);

  // 4. A lantern under the right eave, with a separate glow material.
  box(materials.dark, 0.045, 0.50, 0.045, 2.94, 3.13, 2.91);
  box(materials.dark, 0.36, 0.045, 0.045, 2.79, 3.36, 2.91);
  const lanternMaterial = cel({ color: 0xf1c77f, bands: 'soft', emissive: 0xe99d48, emissiveIntensity: 0.17, cache: false });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 10), lanternMaterial);
  lantern.position.set(2.94, 2.68, 3.03);
  lantern.scale.set(0.88, 1.24, 0.88);
  lantern.castShadow = true;
  group.add(lantern);
  lanterns.push(lanternMaterial);
  for (const y of [2.41, 2.95]) cylinder(materials.dark, 0.11, 0.11, 0.065, 10, 2.94, y, 3.03);
  for (const y of [2.51, 2.62, 2.74, 2.85]) {
    const radius = 0.203 * Math.sqrt(1 - ((y - 2.68) / 0.30) ** 2);
    part(materials.wood, new THREE.TorusGeometry(radius, 0.008, 3, 16), trs(2.94, y, 3.03, Math.PI / 2));
  }

  // 5. A broad-leaf plant at the corner; only a handful of readable shapes.
  const px = 3.25, pz = 2.90;
  cylinder(materials.clay, 0.29, 0.20, 0.46, 10, px, 0.25, pz);
  cylinder(materials.clay, 0.31, 0.31, 0.09, 10, px, 0.48, pz);
  cylinder(materials.wood, 0.245, 0.245, 0.015, 10, px, 0.503, pz);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    const radius = i % 2 ? 0.20 : 0.13;
    const height = 0.75 + (i % 3) * 0.10;
    cylinder(materials.leaf, 0.013, 0.017, height - 0.40, 5,
      px + Math.cos(a) * radius / 2, (height + 0.4) / 2, pz + Math.sin(a) * radius / 2,
      Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18);
    part(i % 2 ? materials.leaf : materials.leafLight,
      new THREE.IcosahedronGeometry(1, 0),
      trs(px + Math.cos(a) * radius, height, pz + Math.sin(a) * radius,
        Math.cos(a) * 0.35, a, 0.5, 0.17, 0.32, 0.085));
  }

  // Geometry is merged per material; authoring many books does not add one
  // draw call per book. Textured planes and the controllable lamp stay separate.
  for (const [material, parts] of batches) {
    const mesh = new THREE.Mesh(bake(parts), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    for (const { geometry } of parts) geometry.dispose();
  }
  group.userData.kind = 'bookshop';
  return { group, lanterns };
}
