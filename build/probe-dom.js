// 在**真实页面**上跑一段 JS，把结果读回来 —— 可复用的小工具。
//
// 之前量几何靠 probe-measure.js：把数值渲染成页面上的大字，再截图人眼读。
// 那套适合"定位问题"，但**进不了检查脚本** —— 检查脚本要的是能断言的数字。
//
// 这里用 Edge 无头模式的 `--dump-dom`：渲染完之后把整份 DOM 打到 stdout。
// 于是流程变成
//   1. 复制真实页面，在 </body> 前插一段测量脚本
//   2. 脚本把结果（base64，免得被 HTML 转义搞坏）写进 <div id="__probe" data-out>
//   3. --dump-dom 读回 DOM，正则捞出 data-out，解 base64
//   4. JSON.parse → 得到可以直接断言的对象
//
// ⚠️ 两个坑：
//   1. 插入的字符串里**不能出现 `</script>` 字面量**，否则脚本标签会被提前闭合。
//   2. 临时文件必须写在**站点根目录**，不能丢到系统临时目录 ——
//      页面里的相对路径（assets/covers/…、assets/theme.css）按文件位置解析，
//      挪了位置图片和样式全部 404，量出来的几何就不作数了。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { delFile } = require('./rm.js');

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
].find((p) => fs.existsSync(p));

const ROOT = path.join(__dirname, '..');

/**
 * @param {string} relPage   相对站点根目录的页面路径，例如 'stardew-maximal-v3.html'
 * @param {string} jsFn      一段返回可 JSON 化结果的**函数表达式**源码
 * @param {object} [opt]     { width, height, budget }
 * @returns {object}         函数返回值的 JSON 化结果；出错时返回 { error }
 */
function measure(relPage, jsFn, opt) {
  const o = opt || {};
  const width = o.width || 1216;
  const height = o.height || 900;
  const budget = o.budget || 2500;

  const pagePath = path.join(ROOT, relPage);
  const src = fs.readFileSync(pagePath, 'utf8');
  const tag = '<' + 'script>';
  const endTag = '<' + '/' + 'script>';

  const probe =
    '<div id="__probe"></div>' + tag + '\n' +
    'function __out(v){document.getElementById("__probe").setAttribute(' +
    '"data-out",btoa(unescape(encodeURIComponent(JSON.stringify(v)))));}\n' +
    'try{var __v=(' + jsFn + ')();\n' +
    // 支持返回 Promise：fonts.ready 这类"要等资源就位"的测量必须异步，
    // 而 --dump-dom 是在虚拟时钟推进完之后才抓的，所以晚一点写也来得及。
    'if(__v&&typeof __v.then==="function"){' +
    '__v.then(__out,function(e){__out({error:String(e&&e.message||e)});});}' +
    'else{__out(__v);}}\n' +
    'catch(e){__out({error:String(e&&e.message||e)});}\n' + endTag;

  if (!src.includes('</body>')) throw new Error(relPage + ' 里没有 </body>，插不进探针');
  // 临时页必须与被测页面放在同一目录，否则 museum/index.html 里的 ../assets 会解析错。
  const tmp = path.join(path.dirname(pagePath), '_probe-dom.html');
  fs.writeFileSync(tmp, src.replace('</body>', probe + '</body>'), 'utf8');

  let out;
  try {
    out = execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--window-size=' + width + ',' + height,
      '--virtual-time-budget=' + budget,
      '--dump-dom',
      'file:///' + tmp.replace(/\\/g, '/')
    ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  } finally {
    // 探针可能运行在主页，也可能运行在 museum/ 这类部署目录。
    // 无论浏览器成功还是抛错都立刻删除，避免检查产物被 push.js 当成站点文件上线。
    //
    // ⚠️⚠️ 删不掉**绝不能**算作"测量失败" —— 量早就量完了，结论就在 out 里。
    // 删除守卫按回合限额（见 rm.js），check-all 跑到后面必然超额；早先这里写的是
    // `if (e.code !== 'ENOENT') throw e`，而守卫抛的错**没有 code**，于是
    // check-museum / check-workshop / check-contact 全崩在这个 finally 上，
    // 报出来像"页面测不出来"，单独跑又都是 exit 0。
    // 交给 rm.js：fs 被拒就走原生进程；仍删不掉也只是留个临时页，
    // push.js 的 syncInto 本来就会把它排除/清掉。
    delFile(tmp);
  }

  const m = /id="__probe"[^>]*data-out="([^"]*)"/.exec(out);
  if (!m) throw new Error('读不到探针输出（--dump-dom 可能没生效，或者页面里的 ' + tag + ' 提前闭合了）');

  const raw = Buffer.from(m[1], 'base64').toString('utf8');
  const parsed = JSON.parse(raw);
  if (parsed && parsed.error) throw new Error('页面里的测量脚本抛错：' + parsed.error);
  return parsed;
}

module.exports = { measure, EDGE, ROOT };
