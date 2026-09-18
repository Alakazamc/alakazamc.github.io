// 子页面（文章页 / 博物馆 / 工坊 / 博客）共用的两件事：
//   1. 季节与昼夜自动判定 —— 主页面 gen.js 里那套逻辑的等价实现
//   2. 底部区块 —— 访问量统计 + 评论区
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
  decorate, dcShelf, DECOR_ICONS
};
