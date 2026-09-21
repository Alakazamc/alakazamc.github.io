// 子页面（文章页 / 博物馆 / 工坊 / 博客）共用的几件事：
//   1. 季节与昼夜自动判定 —— 主页面 gen.js 里那套逻辑的等价实现
//   2. 底部区块 —— 访问量统计 + 评论区
//   3. 分享键 + 分享脚本 —— 全站每一页都挂一枚（2026-09-21 补齐覆盖）
//
// 为什么要抽出来：这四个页面以前都写死 `data-season="spring"`，
// 于是「首页会自动换季、点进文章又变回春天」——比不换季更怪。
// 柯西 2026-09-16 要求季节随时间自动切换，范围是全站，所以子页面也得跟上。
//
// ⚠️ 这里不能 require gen.js：gen.js 是个"跑起来就生成整站"的脚本，不是模块。
// 所以那段季节逻辑必须在这里**独立重写一份**（很短，且不依赖 DOM 结构之外的东西）。

const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];

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
</script>`;
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

const shareScript = () => `<script>
(function(){
  var btns=document.querySelectorAll('[data-share]');
  if(!btns.length)return;
  var toast=document.createElement('div');
  toast.className='share-toast';toast.setAttribute('role','status');
  document.body.appendChild(toast);
  var timer=null;
  function say(msg){
    toast.textContent=msg;toast.classList.add('on');
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
    function sayCopy(ok){ say(ok?'链接已复制，粘贴给朋友就行':'浏览器不让自动复制，长按这条链接：'+url) }
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

// ---------- 子页面共用的星露谷素材装饰 ----------
// 2026-09-19 柯西要求「大量堆积星露谷素材」——首页那套装饰（decor.js）
// 只接在主页面上；子页面如果原样不动，就成了「从农场点进一篇文章 = 走进一间白房子」。
// 这里给子页面配一套**轻量版**：远景建筑 + 作物架 + 界面图标 sprite。
//
// 三点取舍（都是为了不给文章页添乱）：
//   1. 不挂池塘和飞鸟 —— 文章页有正文要读，动的东西越少越好。
//   2. 建筑只在 ≥900px 出现：窄屏上它们会顶到正文第一行，挡字。
//      （CSS 在 decor.js 里，靠 .dc-scene 自带的媒体查询收）
//   3. sprite 按需裁：`dcSprite()` 只带建筑/作物架/藤蔓真正用到的那十几个图标，
//      不给每篇文章塞 60 多个图标的整包 —— 那是几十 KB 的纯浪费。
const DECOR_ICONS = [
  'wheat', 'flower', 'leaf2', 'mushroom', 'sunflower', 'bee', 'grape', 'acorn',
  'tulip', 'strawberry', 'melon', 'tomato', 'corn', 'pepper', 'beehive', 'honey',
  'pumpkin', 'eggplant', 'ancientfruit', 'crystal', 'snowman', 'ore', 'gem', 'pot', 'lantern'
];

// prefix 与 bottomBlock 一致：'../' 或 ''。装饰本身全是内联 SVG，不引外部文件。
const decorate = () => `<div class="dc" aria-hidden="true">${require('./decor.js').scene()}</div>`;

const dcShelf = () => require('./decor.js').shelf();

// 访问量统计。
//
// 为什么用第三方（而不是自己数）：GitHub Pages 是纯静态托管，没有后端，
// 页面上也没有数据库 —— 想"记一次访问"必须有个能写东西的地方。
// 当前用的是**不蒜子（busuanzi）**：它专门做这个、免费、无账号、一行 script 接入，
// 数据存在它自己的服务器上（这也是它唯一的代价：数据不在我们手里，且哪天它停服就没了）。
//
// ⚠️ 三个坑：
//   1. 首次访问时数字位是空的，要等它的接口回填 —— 所以给容器写了占位符 `···`，
//      不写的话页面上会突然蹦出一行字，把下面的内容顶下去。
//   2. 它统计的是 **页面浏览量（PV）**，不是独立访客（UV）。文案就老实写"浏览 / 访客"。
//   3. 脚本 src 必须写**绝对 https**，不能用协议相对的 `//host/x.js` 再拼相对前缀
//      —— `'../' + '//busuanzi...'` 会拼成 `..///busuanzi...`，浏览器当本地路径找，
//      必然 404，而且页面照常渲染看不出坏（静态站断链是静默的）。
//      prefix 参数因此已经没有用了，保留只是为了不改调用方签名。
function visitsBar(prefix) {
  const src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  return `<div class="visitbar">
    <span class="vlabel">本站浏览</span>
    <b class="vnum" id="busuanzi_value_site_pv"><span class="vslot">···</span></b>
    <span class="vlabel">次 · 访客</span>
    <b class="vnum" id="busuanzi_value_site_uv"><span class="vslot">···</span></b>
    <span class="vlabel">人</span>
  </div>
  <script async src="${src}"></script>`;
}

// 底部区块：访问量 + 评论区，放在子页面最底部（柯西要求"网站底部"）。
// 评论渲染复用 posts.js 的 commentsBlock 会把两处逻辑分叉，所以这里只做**包裹**，
// 评论内容由调用方作为 inner 传进来。
function bottomBlock(inner, prefix) {
  return `<div class="sitebottom">
  ${visitsBar(prefix)}
  ${inner || ''}
  <p class="site-links"><a href="${prefix || ''}rss.xml">RSS 订阅</a> · <a href="https://github.com/adityatelange/hugo-PaperMod">阅读部件：PaperMod</a></p>
</div>`;
}

module.exports = {
  seasonScript, visitsBar, bottomBlock, SEASON_NAMES,
  decorate, dcShelf, DECOR_ICONS,
  shareBtn, shareScript
};
