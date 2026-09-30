const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '../build/blog-editor.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];

class Target {
  constructor() { this.listeners = {}; this.value = ''; this.dataset = {}; this.style = {}; this.disabled = false; this.textContent = ''; this.innerHTML = ''; this.classes = new Set();
    this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), contains: x => this.classes.has(x), toggle: (x, on) => on ? this.classes.add(x) : this.classes.delete(x) }; }
  addEventListener(type, fn, opts = {}) { (this.listeners[type] ||= []).push({ fn, once: opts.once }); }
  dispatch(type, event = {}) { for (const listener of [...(this.listeners[type] || [])]) { if (listener.once) this.listeners[type] = this.listeners[type].filter(x => x !== listener); listener.fn(event); } }
  focus() {}
  showModal() { this.open = true; }
  close(value = 'cancel') { this.returnValue = value; this.open = false; this.dispatch('close'); }
}
function setup(seed = {}, restore = false) {
  const elements = new Map(), data = new Map(Object.entries(seed)), win = new Target(), doc = new Target();
  doc.getElementById = id => { if (!elements.has(id)) elements.set(id, new Target()); return elements.get(id); };
  const storage = { get length() { return data.size; }, key: n => [...data.keys()][n], getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) };
  const ctx = vm.createContext({ document: doc, window: win, localStorage: storage, crypto: webcrypto, TextEncoder, TextDecoder, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, console, alert() {}, confirm: () => restore, fetch: async () => ({ ok: true, json: async () => ({ sources: {} }) }) });
  vm.runInContext(source, ctx);
  const get = id => doc.getElementById(id);
  const open = (file, local = false) => get('postsList').onclick({ target: { closest: () => ({ dataset: local ? { localDraft: file } : { f: file, draft: '0' } }) } });
  ctx.readPostText = async file => article(file, file === 'A.md' ? 'a.webp' : '');
  return { ctx, get, open, win, storage, data };
}
function article(file, cover = '') { return { raw: `---\ntitle: ${file}\ndate: 2026-09-30\ntags: [test]\nsummary: summary\n${cover ? `cover: ${cover}\n` : ''}---\nBody ${file}`, sha: `sha-${file}` }; }
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
const tick = () => new Promise(resolve => setImmediate(resolve));

test('cancel, including Escape dismissal, preserves unsaved fields and loaded base', async () => {
  const s = setup(); await s.open('A.md'); s.get('title').value = 'new title'; s.get('body').value = 'unsaved';
  const before = s.ctx.editorSnapshot(); const p = s.open('B.md'); await tick();
  assert.equal(s.get('unsavedDialog').open, true); s.get('unsavedDialog').close(); await p;
  assert.equal(s.ctx.editorSnapshot(), before); assert.equal(s.ctx.loadedPost.sha, 'sha-A.md'); assert.equal(s.ctx.editorDirty(), true);
});
test('explicit discard opens the article and clears a previous cover', async () => {
  const s = setup(); await s.open('A.md'); assert.equal(s.get('cover').value, 'a.webp'); s.get('body').value = 'discarded';
  const p = s.open('B.md'); await tick(); s.get('unsavedDialog').close('discard'); await p;
  assert.equal(s.get('body').value, 'Body B.md'); assert.equal(s.get('cover').value, ''); assert.equal(s.ctx.editorDirty(), false);
});
test('save then open preserves an untitled draft and restores exact fields from the draft list', async () => {
  const s = setup(); s.get('body').value = '\nuntitled draft\n'; s.get('tags').value = ' a， b '; const before = s.ctx.editorSnapshot();
  const p = s.open('A.md'); await tick(); s.get('unsavedDialog').close('save'); await p;
  const [key] = [...s.data.keys()]; assert.ok(key.startsWith('kx_blog_draft:v2:'));
  s.get('btnDrafts').onclick(); assert.match(s.get('postsList').innerHTML, /data-local-draft/);
  await s.open(key, true); assert.equal(s.ctx.editorSnapshot(), before); assert.equal(s.ctx.editorDirty(), false);
});
test('saving separate articles retains both drafts', async () => {
  const s = setup(); await s.open('A.md'); s.get('body').value = 'draft A'; await s.ctx.doSave();
  await s.open('B.md'); s.get('body').value = 'draft B'; await s.ctx.doSave();
  assert.equal(s.data.size, 2); assert.deepEqual([...s.data.values()].map(JSON.parse).map(x => x.body).sort(), ['draft A', 'draft B']);
});
test('failed draft save blocks replacement and keeps dirty contents', async () => {
  const s = setup(); s.get('body').value = 'only copy'; s.storage.setItem = () => { throw Error('quota'); };
  const p = s.open('A.md'); await tick(); s.get('unsavedDialog').close('save'); await p;
  assert.equal(s.get('body').value, 'only copy'); assert.equal(s.ctx.loadedPost, null); assert.equal(s.ctx.editorDirty(), true); assert.match(s.get('status').textContent, /暂存失败/);
});
test('fetch failure after discard leaves the original dirty article intact', async () => {
  const s = setup(); await s.open('A.md'); s.get('body').value = 'only copy'; s.ctx.readPostText = async () => { throw Error('offline'); };
  const p = s.open('B.md'); await tick(); s.get('unsavedDialog').close('discard'); await p;
  assert.equal(s.get('body').value, 'only copy'); assert.equal(s.ctx.loadedPost.sha, 'sha-A.md'); assert.equal(s.ctx.editorDirty(), true);
});
test('late A response cannot replace more recently selected B or its publish base', async () => {
  const s = setup(), a = deferred(), b = deferred(); s.ctx.readPostText = file => file === 'A.md' ? a.promise : b.promise;
  const pa = s.open('A.md'); await tick(); const pb = s.open('B.md'); await tick();
  b.resolve(article('B.md')); await pb; a.resolve(article('A.md', 'a.webp')); await pa;
  assert.equal(s.get('body').value, 'Body B.md'); assert.equal(s.ctx.loadedPost.sha, 'sha-B.md'); assert.equal(s.get('cover').value, '');
});
test('typing during a pending read keeps all new input and old publish base', async () => {
  const s = setup(); await s.open('A.md'); const d = deferred(); s.ctx.readPostText = () => d.promise;
  const p = s.open('B.md'); await tick(); s.get('summary').value = 'new summary'; s.get('body').value = 'new typing'; d.resolve(article('B.md')); await p;
  assert.equal(s.get('body').value, 'new typing'); assert.equal(s.ctx.loadedPost.sha, 'sha-A.md'); assert.equal(s.ctx.editorDirty(), true);
});
test('closing the article list cancels its pending load', async () => {
  const s = setup(), d = deferred(); s.ctx.readPostText = () => d.promise;
  const p = s.open('A.md'); await tick(); s.ctx.cancelOpen(); d.resolve(article('A.md')); await p;
  assert.equal(s.get('body').value, ''); assert.equal(s.ctx.loadedPost, null);
});
test('repeated selection shares one guard and only latest request is applied', async () => {
  const s = setup(); s.get('body').value = 'draft'; const a = s.open('A.md'), b = s.open('B.md'); await tick();
  assert.equal(s.get('unsavedDialog').listeners.close.length, 1); s.get('unsavedDialog').close('save'); await Promise.all([a, b]);
  assert.equal(s.get('body').value, 'Body B.md'); assert.equal(s.data.size, 1);
});
test('beforeunload protects changed fields, programmatic inserts and cover removal but not saved data', async () => {
  const s = setup(); let prevented = 0; const event = { preventDefault() { prevented++; } };
  s.win.dispatch('beforeunload', event); assert.equal(prevented, 0);
  s.ctx.insertAtCursor('picture'); s.win.dispatch('beforeunload', event); assert.equal(prevented, 1);
  await s.ctx.doSave(); s.win.dispatch('beforeunload', event); assert.equal(prevented, 1);
  await s.open('A.md'); s.get('btnCoverClear').onclick(); s.win.dispatch('beforeunload', event); assert.equal(prevented, 2);
});
test('legacy draft remains recoverable, and a corrupt sibling does not hide valid drafts', () => {
  const old = JSON.stringify({ title: 'legacy', body: 'legacy body', cover: 'legacy.webp', tags: ['tag'] });
  const s = setup({ kx_blog_draft: old, 'kx_blog_draft:v2:broken': '{' }, true);
  assert.equal(s.get('body').value, 'legacy body'); assert.equal(s.get('cover').value, 'legacy.webp'); assert.equal(s.data.get('kx_blog_draft'), old);
});
test('opening another document is blocked during publishing', async () => {
  const s = setup(); s.get('btnPub').disabled = true; await s.open('A.md');
  assert.equal(s.ctx.loadedPost, null); assert.match(s.get('status').textContent, /正在发布/);
});
