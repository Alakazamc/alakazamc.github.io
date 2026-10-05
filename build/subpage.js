// 子页面（文章页 / 博物馆 / 工坊 / 博客）共用的几件事：
//   1. 季节与昼夜自动判定 —— 主页面 gen.js 里那套逻辑的等价实现
//   2. 底部区块 —— 评论区 + 页脚站台（快捷栏、访客车票）
//   3. 分享键 + 分享脚本 —— 全站每一页都挂一枚（2026-09-21 补齐覆盖）
//
// 为什么要抽出来：这四个页面以前都写死 `data-season="spring"`，
// 于是「首页会自动换季、点进文章又变回春天」——比不换季更怪。
// 柯西 2026-09-16 要求季节随时间自动切换，范围是全站，所以子页面也得跟上。
//
// ⚠️ 这里不能 require gen.js：gen.js 是个"跑起来就生成整站"的脚本，不是模块。
// 所以那段季节逻辑必须在这里**独立重写一份**（很短，且不依赖 DOM 结构之外的东西）。

const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];
const SKINS = require('./skins.js');
const SITE = require('./site.config.js');
const { esc } = require('./md.js');   // md.js 自身不 require 任何模块，不会成环
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const skinHead = SKINS.bootScript;
// Resolve at generation time, after gen.js has written the latest CSS.
// prefix：子页传默认的 '../'；404 可能落在任意路径，传站根 '/'。
const themeHref = (prefix = '../') => prefix + 'assets/theme.css?v=' + createHash('sha256')
  .update(fs.readFileSync(path.join(__dirname, '..', 'assets', 'theme.css'))).digest('hex').slice(0, 10);
// 回到首页的地址：首页自己是 ''；子页拼相对前缀；404 用站根（首页同时以 / 发布）。
const homeHref = (prefix) => (prefix === '' ? '' : prefix === '/' ? '/' : prefix + SITE.home);

// 元信息行（V20 第 4 节）：每一项包一层 .mi，项内不断行、过长时只截它自己，只在项与项之间换行。
// items：字符串 = 纯文本，在这里统一转义；{ html } = 调用方拼好的受信片段，只许含 ic() 图标与已转义的文字，不许含 <a>。
// 假值（''、null、undefined、false）先滤掉，所以调用方可以直接写 cond && '文字'。
const metaLine = (items) => items.filter(Boolean)
  .map((t) => '<span class="mi">' + (typeof t === 'string' ? esc(t) : t.html) + '</span>')
  .join(' · ');

// 季节 / 昼夜自动判定。放在 </body> 前执行。
// 只做两件事：给 <html> 打上 data-season / data-time。
// 子页面没有飘落物和地面动物那些层，所以不需要重建任何东西 —— 纯靠 CSS 换色板。
function seasonScript() {
  return `<script>
(function(){
  var root = document.documentElement;
  function seasonOf(m){
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  var now = new Date();
  root.dataset.season = seasonOf(now.getMonth() + 1);
  var h = now.getHours();
  root.dataset.time = (h < 6 || h >= 18) ? 'night' : 'day';
})();
</script>${SKINS.script()}`;
}

// ---------- 分享（全站共用） ----------
//
// 柯西 2026-09-20「没有分享键」→ 先在文章页/博客页放了（当时在 posts.js 里）。
// 柯西 2026-09-21「分享功能没做好」→ 两件事一起补：
//   1. **覆盖全站**：文章页 / 博客页 / 首页工具栏 / 博物馆 / 工坊 / 相馆 / 收获簿，
//      每页一枚（样式 .share-btn 在 gen.js 内联 <style>，构建时同步进 theme.css）。
//   2. **点击后的分支按设备分**：
//      · 触屏（pointer:coarse，手机/平板）→ navigator.share 原生面板，
//        微信/QQ/复制链接都在里面，这是手机上唯一正确的路；
//      · 桌面 → **直接复制链接**。Windows 的 navigator.share 弹出的是系统分享面板，
//        里面没有微信（桌面版微信不注册共享目标），关掉还是静默无回执 ——
//        实测 Edge 桌面 canShare 返回 true，走那条路对"粘到微信给朋友"零价值。
//
// ⚠️ 复制降级是三条路（微信内置浏览器两条前路常断）：
//   clipboard API → document.execCommand('copy')（老招，微信里多数还能写进去）
//   → 都不行才把链接显示在纸条上，让人家长按选中（.share-toast 已设 user-select）。
// ⚠️ 按钮上不写副标题：一个图标 + 「分享」两个字。
// ⚠️ 脚本字符串里不能出现 </script> 字面量（会被提前闭合）。
const ic = (n, cls) =>
  `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;

// iconCls：图标尺寸（'sm'=12px 配横排按钮，不传=16px 配首页 .tool 竖排工具）
// btnCls：按钮类名（默认 .share-btn；首页传 'tool' 与工具栏其余工具同款）
const shareBtn = (iconCls, btnCls) =>
  `<button type="button" class="${btnCls || 'share-btn'}" data-share title="分享这一页">${ic('share', iconCls)}<em>分享</em></button>`;

// ---------- 页头（V20 第 6.1 节）：首页与子页同一份标记与样式 ----------
// 左：站牌式返回链接（首页不传 back，左侧留空）+ extra（只有文章页传「博客首页」）；
// 右：分享在前、外观设置固定在最右（404 传 share:false）。外观设置里先放 4 枚皮肤按钮，再放 settings。
// 样式在 skins.js 的 controlsCss（第 6 层）。
// 站牌箭头用 play 水平翻转成 ◀（arrow 是鼠标光标那张像素画，翻过来像一枚卡住的指针；第 ③ 批同理）。
const sitebar = ({ prefix = '', back, extra = '', settings = '', share = true }) => `<header class="sitebar">
  <div class="sitebar-l">${back == null ? '' : `<a class="brand" href="${homeHref(prefix)}${back}" aria-label="回到主页"><b>柯西</b><span>${ic('play', 'sm')}回到主页</span></a>`}${extra}</div>
  <div class="sitebar-r">${share ? shareBtn('sm') : ''}<details class="appearance-settings"><summary>外观设置</summary><div class="controls">${SKINS.chooser()}${settings}</div></details></div>
</header>`;

const shareScript = () => `<script>
(function(){
  var btns=document.querySelectorAll('[data-share]');
  if(!btns.length)return;
  var toast=document.createElement('div');
  toast.className='share-toast';toast.setAttribute('role','status');
  document.body.appendChild(toast);
  var timer=null;
  // 兜底回执里的网址放进单独一个 <span>（阅读字、整行）：用 textContent，不拼 innerHTML。
  function say(msg,url){
    toast.textContent=msg;
    if(url){var u=document.createElement('span');u.textContent=url;toast.appendChild(u)}
    toast.classList.add('on');
    clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove('on')},4000);
  }
  // 老办法：临时 textarea + execCommand。API 已废弃，但微信内置浏览器
  // （尤其 iOS）经常既没有 navigator.share 也不给 navigator.clipboard，
  // 而这招多数时候还能把链接写进剪贴板。
  function legacyCopy(url){
    try{
      var ta=document.createElement('textarea');
      ta.value=url;ta.setAttribute('readonly','');
      ta.style.position='fixed';ta.style.left='-9999px';ta.style.top='0';
      document.body.appendChild(ta);
      ta.select();ta.setSelectionRange(0,url.length);
      var ok=document.execCommand('copy');
      document.body.removeChild(ta);
      return ok===true;
    }catch(e){return false}
  }
  function copy(url){
    // 不管哪条路走通，都必须给用户一句回执 —— 静默成功比失败更糟
    // （toast 还留着上一次的旧文案，用户以为没反应）。
    function sayCopy(ok){ ok?say('链接已复制，粘贴给朋友就行'):say('浏览器不让自动复制，长按这条链接：',url) }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(
        function(){say('链接已复制，粘贴给朋友就行')},
        function(){sayCopy(legacyCopy(url))});
    }else{sayCopy(legacyCopy(url))}
  }
  // 每次点击现问指针类型 —— 二合一设备（触屏笔记本接鼠标）按当下输入方式走。
  function touchPrimary(){
    return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
  }
  btns.forEach(function(b){
    b.addEventListener('click',function(){
      // 去掉 hash：分享出去的链接带 #xxx 没有意义
      var url=location.href.split('#')[0];
      if(navigator.share&&touchPrimary()){
        navigator.share({title:document.title,url:url}).catch(function(e){
          // 用户主动关掉分享面板不算失败，别弹噪声
          if(e&&e.name==='AbortError')return;
          copy(url);
        });
      }else{copy(url)}
    });
  });
})();
</script>`;

// V20 第 7.2 节：子页不再挂远景建筑、作物架与皮肤条（decorate／dcShelf／DECOR_ICONS 已删）；
// 皮肤入口在页头的外观设置里，页脚是站台。

// ---------- 页脚站台（V20 第 6.13、6.14 节）：首页、子页、404 共用 ----------
// 依次输出：评论区 .sitebottom（inner 为空时不输出）→ <footer class="platform"> → 不蒜子脚本。
// 站台 = 一段铁轨 + 快捷栏（每格都是真实入口）+ 访客车票 + 致谢链接。
// opts.current：当前页那一格（1 主页、2 工坊、3 文章与博客、4 博物馆、5 相馆、6 收获簿），加 aria-current。
// opts.extras：{ left, right } 两段 HTML，只有首页传（季节花箱与小鸡），开关在首页外观设置里。
// opts.counter：默认 true；404 传 false —— 不出车票也不加载不蒜子，不把 404 访问计进全站浏览量。
//
// 访问量用的是**不蒜子（busuanzi）**：GitHub Pages 没有后端，计数只能交给第三方。
// ⚠️ 车票初始 display:none：脚本回填成功时把 busuanzi_container_* 设成 inline（flex 子项会被提升为块级），
//    接口失败或脚本没加载就一直不显示 —— 数字到了才出现，不再写「···」占位（没有内容就不留占位）。
// ⚠️ 脚本 src 必须写**绝对 https**：拼相对前缀会变成 `..///busuanzi...`，静默 404。
// 子页 sprite 白名单要带上 CHROME_ICONS（快捷栏 10 枚 + 页头站牌的 play、分享键的 share），漏一个就是空白图标。
const CHROME_ICONS = ['grass', 'crafting', 'torch', 'fossil', 'diamond', 'keg', 'note', 'heart', 'wand', 'mailbox', 'play', 'share'];

function hotbar(prefix, current) {
  // 首页上第 1、7、8 格用纯锚点：首页同时以 / 发布，跨文档跳到 stardew-maximal-v3.html#… 会整页重载。
  const home = homeHref(prefix);
  const cells = [
    ['主页', 'grass', home || '#board'],
    ['工坊', 'crafting', prefix + 'workshop/index.html'],
    ['文章', 'torch', prefix + 'posts/index.html'],
    ['博物馆', 'fossil', prefix + 'museum/index.html'],
    ['相馆', 'diamond', prefix + 'gallery/index.html'],
    ['收获簿', 'keg', prefix + 'harvest/index.html'],
    ['唱片机', 'note', home + '#music'],
    (SITE.friendSites || []).length ? ['友链', 'heart', home + '#friends'] : null,
    ['写作台', 'wand', prefix + 'write/index.html'],
    ['RSS', 'mailbox', prefix + 'rss.xml']
  ];
  return `<nav class="hotbar" aria-label="快捷栏">${cells.map((c, i) => c &&
    `<a class="hb" href="${c[2]}"${i + 1 === current ? ' aria-current="page"' : ''}>${ic(c[1], 'x2')}<span>${c[0]}</span></a>`).filter(Boolean).join('')}</nav>`;
}

function bottomBlock(inner, prefix = '', opts = {}) {
  const { current, counter = true } = opts;
  const { left = '', right = '' } = opts.extras || {};
  return `${inner ? `<div class="sitebottom">${inner}</div>` : ''}
<footer class="platform">
  <div class="platform-rail" aria-hidden="true"></div>
  <div class="platform-row platform-bar">${left}${hotbar(prefix, current)}${right}</div>
  <div class="platform-row platform-meta">
    ${counter ? '<p class="ticket" id="busuanzi_container_site_pv" style="display:none">本站浏览 <b id="busuanzi_value_site_pv"></b> 次 · 访客 <b id="busuanzi_value_site_uv"></b> 人</p>' : ''}
    <p class="site-links"><a href="${prefix}rss.xml">RSS 订阅</a> · <a href="https://github.com/adityatelange/hugo-PaperMod">阅读部件：PaperMod</a> · <a href="https://github.com/Kenton-GMI/sakura-crossing">风景灵感：Sakura Crossing</a></p>
  </div>
</footer>${counter ? '\n<script async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>' : ''}`;
}

module.exports = {
  seasonScript, bottomBlock, CHROME_ICONS, SEASON_NAMES, metaLine,
  shareBtn, shareScript, sitebar, skinHead, themeHref
};
