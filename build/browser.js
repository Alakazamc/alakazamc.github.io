// 找一台**真的能跑 --dump-dom 的浏览器**，全局只认这一处。
//
// 为什么要有这个文件：
//   以前 probe-dom.js 写死 Edge 的两个安装路径，谁装了就用谁 —— 2026-10-01 那次 Edge
//   自动更新只落了一半（msedge.exe 换成新的、版本目录里的 chrome_200_percent.pak 没跟上），
//   结果是 **msedge.exe 启动即退出，exit 0、stdout 空**。它不报错，就是不干活。
//   于是所有依赖 measure() 的东西（og.js、check-timeline / workshop / museum / gallery）
//   统一报"读不到探针输出"，看起来像页面写坏了，其实是浏览器哑了。
//
// 对策：**按能力挑浏览器，不按路径猜**。起一台带标记的数据 URL，能把标记 dump 回来的
//   才算数。Edge 哑了就自动退到 Playwright 自带的 chromium headless shell
//   （本机 %LOCALAPPDATA%\ms-playwright\chromium_headless_shell-*\），
//   它是个 200MB 的自包含单文件壳子，不依赖系统里那套残缺的 Edge 安装。
//
// ⚠️ 别把具体版本号写死：playwright 一升级目录名就变（1223 → 1234 → …）。
//   这里扫目录、按版本号倒序取最新的，升级了也不用改代码。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PW = path.join(
  process.env.LOCALAPPDATA || 'C:/Users/Alakazam/AppData/Local',
  'ms-playwright'
);

// 扫出 ms-playwright 下所有候选，版本号倒序（新的先试）
function pwCandidates() {
  if (!fs.existsSync(PW)) return [];
  const dirs = fs.readdirSync(PW).filter((d) => /^chromium_headless_shell-\d+$/.test(d) || /^chromium-\d+$/.test(d));
  dirs.sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()));
  const out = [];
  for (const d of dirs) {
    const shell = path.join(PW, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    const full = path.join(PW, d, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(shell)) out.push(shell);
    else if (fs.existsSync(full)) out.push(full);
  }
  return out;
}

function candidates() {
  return [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
  ].filter((p) => fs.existsSync(p)).concat(pwCandidates());
}

// 探活页：能把这个标记原样 dump 回来，才说明浏览器真的渲染了页面
const CANARY = 'data:text/html,<div id="__probe" data-out="U09L"></div>';

let cached;

/**
 * @returns {string|undefined} 可用浏览器绝对路径；全挂了返回 undefined
 */
function browser() {
  if (cached !== undefined) return cached;
  for (const exe of candidates()) {
    let out = '';
    try {
      out = execFileSync(exe, ['--headless=new', '--disable-gpu', '--no-sandbox', '--dump-dom', CANARY], {
        encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 20000,
        stdio: ['ignore', 'pipe', 'ignore']
      });
    } catch (e) {
      out = String(e.stdout || '');
    }
    if (/data-out="U09L"/.test(out)) {
      cached = exe;
      return cached;
    }
  }
  cached = null;
  return undefined;
}

module.exports = { browser, candidates };
