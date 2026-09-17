// 相馆数据源：扫描 content/gallery/*.json，严格校验后写 build/data/gallery.json。
// 零依赖，只用 Node 内置模块。这个文件位于 build/ 根目录，属于可公开的云端构建上下文；
// build/sources/gallery.js 只是本机兼容入口，避免本机/Actions 各维护一份实现。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'gallery');
const ASSET_DIR = path.join(ROOT, 'assets', 'gallery');
const DATA_DIR = path.join(__dirname, 'data');
const OUT_FILE = path.join(DATA_DIR, 'gallery.json');

function isBareName(s) {
  return typeof s === 'string' && s.length > 0 &&
    s.indexOf('/') === -1 && s.indexOf('\\') === -1 &&
    s.indexOf('..') === -1 && !/[\x00-\x1f]/.test(s);
}

function cleanText(v, fallback) {
  if (v == null) return fallback || '';
  return String(v).replace(/\s+/g, ' ').trim();
}

function validate(rec) {
  if (!rec || typeof rec !== 'object') return { ok: false, why: '不是对象' };
  if (!isBareName(rec.file)) return { ok: false, why: 'file 不是合法纯文件名（含 / 或 ..）' };
  if (!isBareName(rec.thumb)) return { ok: false, why: 'thumb 不是合法纯文件名（含 / 或 ..）' };

  const file = rec.file, thumb = rec.thumb;
  if (!fs.existsSync(path.join(ASSET_DIR, file)))
    return { ok: false, why: `大图缺失: assets/gallery/${file}` };
  if (!fs.existsSync(path.join(ASSET_DIR, thumb)))
    return { ok: false, why: `缩图缺失: assets/gallery/${thumb}` };

  const w = rec.w, h = rec.h;
  if (!Number.isInteger(w) || w <= 0) return { ok: false, why: `w 不是正整数: ${w}` };
  if (!Number.isInteger(h) || h <= 0) return { ok: false, why: `h 不是正整数: ${h}` };

  let tw = rec.tw, th = rec.th;
  if (!(Number.isInteger(tw) && tw > 0 && Number.isInteger(th) && th > 0)) {
    const maxd = 640;
    if (w >= h) { tw = maxd; th = Math.round(maxd * h / w); }
    else { th = maxd; tw = Math.round(maxd * w / h); }
  }

  return {
    ok: true,
    item: {
      file, thumb, w, h, tw, th,
      caption: cleanText(rec.caption, file),
      date: cleanText(rec.date, ''),
      season: cleanText(rec.season, ''),
      generated: rec.generated === true
    }
  };
}

function build() {
  if (!fs.existsSync(CONTENT_DIR)) {
    const empty = { updatedAt: '', count: 0, items: [] };
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(empty, null, 1));
    console.log('content/gallery 不存在，已写空相册 gallery.json');
    return empty;
  }

  // 下划线开头统一视为草稿/探针，不参与正式构建，也不会被 push.js 同步到公开仓库。
  const files = fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.toLowerCase().endsWith('.json') && !f.startsWith('_'));
  const items = [];
  let skipped = 0;

  for (const f of files) {
    const full = path.join(CONTENT_DIR, f);
    let raw;
    try { raw = JSON.parse(fs.readFileSync(full, 'utf8')); }
    catch (e) {
      console.warn(`跳过 ${f}：JSON 解析失败 —— ${e.message}`);
      skipped++;
      continue;
    }
    const r = validate(raw);
    if (!r.ok) {
      console.warn(`跳过 ${f}：${r.why}`);
      skipped++;
      continue;
    }
    items.push(r.item);
  }

  items.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  const out = {
    // 取最新作品日期，内容不变时构建结果也不变；不能写“构建这一刻”，否则每次构建都会制造 diff。
    updatedAt: items.length && items[0].date ? items[0].date : '',
    count: items.length,
    items
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));
  console.log(`相馆数据：${items.length} 张${skipped ? ` · 跳过 ${skipped} 个坏文件` : ''} → build/data/gallery.json`);
  return out;
}

module.exports = { build, validate, isBareName, cleanText };
if (require.main === module) build();
