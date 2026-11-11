// 私密文章页（2026-11-11）。
//
// 纯静态站没有服务端，所以「输入密码才能访问」只能靠**真的加密**：
//   1. 正文先用密码在本地加密成密文，仓库里只存 content/private/locked.json（密文）。
//   2. 本文件生成的页面里只有密文 + 一段浏览器解密脚本，没有明文、没有密码。
//   3. 访客输密码 → 浏览器用 PBKDF2 派生密钥 → AES-GCM 本地解密 → 渲染正文。
//      密码錯时解密会直接失败（AES-GCM 自带校验），不需要在页面里存密码哈希。
//
// ⚠️ 这条页面**不进 articles()**，因此不会出现在首页时间线、博客列表、RSS、
//    sitemap、OG 卡片里；页面本身也带 noindex。私密类别只在博客页留一个入口。
// ⚠️ 密码不写进任何仓库文件；加密脚本是一次性的，跑完即删。
// ⚠️ 历史提交里曾有过明文（2026-11-10 公开发布过），删除当前文件不等于撤回历史，
//    真要彻底得另外清理仓库历史。这个边界必须让用户知道。
const fs = require('fs');
const path = require('path');
const { skinHead, themeHref, seasonScript } = require('./subpage.js');
const SITE = require('./site.config.js');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'content', 'private', 'locked.json');
const OUT = path.join(ROOT, 'private');

// 页面自带的一点点样式。用的都是色板角色变量，没有写死色值。
// 这份页面不在 check-css-budget 的页面清单里（它只扫公开内容页），
// 但照旧守间距 4 的倍数、不靠透明度降级文字。
const LOCK_CSS = `
.lockbox{max-width:520px;margin:0 0 var(--s6)}
.lockrow{display:flex;gap:var(--s2);align-items:stretch;flex-wrap:wrap}
.lockpass{flex:1 1 240px;min-width:0;min-height:40px;padding:0 var(--s3);
  font:inherit;font-size:12px;color:var(--ink);background:var(--surface);
  border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge)}
.lockpass:focus{outline:2px solid var(--rail);outline-offset:2px}
.lockbtn{min-height:40px;padding:0 var(--s5)}
.lockerr{margin:var(--s2) 0 0;font-size:12px;line-height:24px;color:var(--ink)}
.lockhint{margin:0 0 var(--s4);font-family:var(--read);font-size:14px;line-height:24px;color:var(--ink-2)}
.lockback{display:inline-block;margin-top:var(--s6);font-size:12px;line-height:24px}
#locked-body p{margin:0 0 var(--s4);font-family:var(--read);font-size:18px;line-height:32px;color:var(--ink)}
`;

function build() {
  if (!fs.existsSync(PACK)) {
    console.log('私密：没有 content/private/locked.json，跳过');
    return;
  }
  const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'));
  if (!pack.salt || !pack.iv || !pack.data) {
    throw new Error('locked.json 缺字段，拒绝生成（避免把半截页面发上线）');
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>私密文章 · ${SITE.name}</title>
${skinHead()}
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="${themeHref()}">
<style>${LOCK_CSS}</style>
</head>
<body class="is-article">
<div class="wrap">
  <header class="sitebar" style="min-height:40px;margin-bottom:var(--s4)">
    <div class="sitebar-l"><a class="brand" href="../index.html" aria-label="回到主页"><b>柯西</b><span>回到主页</span></a></div>
  </header>
  <article class="panel artpage">
    <h2 class="pt">私密</h2>
    <h1 class="arttitle" id="lock-title">需要密码</h1>
    <p class="lockhint" id="lock-hint">这篇文章不公开。输入密码后，内容只在你自己的浏览器里解开，不会发到任何服务器。</p>
    <div class="lockbox" id="lock-panel">
      <form class="lockrow" id="lock-form" autocomplete="off">
        <label class="lockpass" style="display:flex;align-items:center;gap:var(--s2)">
          <span style="font-size:12px;color:var(--ink-2)">密码</span>
          <input id="lock-pass" type="password" autocomplete="new-password" spellcheck="false"
            style="flex:1;min-width:0;border:0;background:none;color:var(--ink);font:inherit;font-size:12px;outline:none">
        </label>
        <button class="abtn lockbtn" type="submit">解锁</button>
      </form>
      <p class="lockerr" id="lock-err" role="alert"></p>
    </div>
    <div id="locked-body"></div>
    <a class="lockback" href="../posts/index.html">← 回到博客</a>
  </article>
</div>
<script type="application/json" id="locked-data">${JSON.stringify(pack)}</script>
<script src="../assets/private-decrypt.js"></script>
${seasonScript()}
</body>
</html>
`;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
  console.log('私密：已生成 private/index.html（密文 ' + pack.data.length + ' 字符，明文 0 字符）');
}

module.exports = { build };
