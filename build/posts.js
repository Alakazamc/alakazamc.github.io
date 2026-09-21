// 文章页生成器 —— 发帖系统的输出端。
//
// 输入：content/posts/*.md（本站文章）+ data/douban.json 的 reviews（豆瓣影评）
// 输出：posts/<slug>.html（每篇一页）+ posts/index.html（文章索引）
//
// 样式表复用主站那一份：gen.js 构建时会把内联 <style> 同步导出成 assets/theme.css，
// 这里直接 <link> 过去。**单一来源仍然是 gen.js**，别手工改 theme.css（会被覆盖，
// 而且 check.js 会比对两者是否一致）。
//
// 被 gen.js require 调用（这样一条 `node build/gen.js` 就能构建全站），
// 也可以单独跑：node build/posts.js
const fs = require('fs');
const path = require('path');
const { articles, TAG_ICON } = require('./content.js');
const { ICONS, toSymbol } = require('./icons.js');
const { seasonScript, bottomBlock, decorate, dcShelf, DECOR_ICONS, shareBtn, shareScript } = require('./subpage.js');
const SITE = require('./site.config.js');
const {tableOfContents} = require('./papermod.js');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'posts');

const ic = (n, cls) =>
  `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;
const corners = (a, b, c, d) =>
  `<span class="cor tl">${ic(a, 'sm')}</span><span class="cor tr">${ic(b, 'sm')}</span>` +
  `<span class="cor bl">${ic(c, 'sm')}</span><span class="cor br">${ic(d, 'sm')}</span>`;

// 文章页只需要用到的几个图标。整份 sprite 有 60+ 个图标、几十 KB，
// 每篇文章都塞一份纯属浪费 —— 按需裁一份出来。
const spriteFor = (names) =>
  '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
  [...new Set(names)].filter((n) => ICONS[n]).map((n) => toSymbol(n, ICONS[n])).join('') +
  '</svg>';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rel = (p) => (p ? '../' + p : '');

// ---------- 分享 ----------
// 柯西 2026-09-20「没有分享键」。文章页和博客页标题下方各放一枚。
// 2026-09-21「分享功能没做好」→ 分享键/脚本已挪到 subpage.js 全站共用
// （首页工具栏、四个子页也各有一枚），图标是 icons.js 的 share（金黄箭头飞出托盘），
// 样式在 gen.js 的 .share-btn / .share-toast（构建时同步进 assets/theme.css，
// 本页 <link> 的就是它）。点击分支与复制降级见 subpage.js 里的长注释。
// ⚠️ 按钮上不写副标题：一个图标 + 「分享」两个字。

const SRC_LABEL = { site: '本站', douban: '豆瓣影评' };

// ---------- 评论区 ----------
//
// 三种状态：配好了就用，没配好就显示一句说明。**两种情况都不能让构建失败**，
// 也不能让页面出现一个空白区（读者会以为是加载失败）。
//
// 参数 `opts`：
//   id      —— 区块的 DOM id。首页和文章页会给不同的值（默认 comments），
//              同一页出现两个同名 id 是非法 HTML，而且锚点 #comments 会指向错的那个。
//   title   —— 区块标题，默认「评论」。首页上叫「留言」更贴切。
//   mapping —— 传给 giscus 的讨论帖映射方式，默认 pathname。
//
// ⚠️ 为什么首页必须显式传 mapping='specific' 或另给一个 term：
//   giscus 默认按 URL 路径开帖，首页路径是 `/`，文章页是 `/posts/xxx.html`，
//   本身不会撞。但**首页那个帖需要一个固定名字**，否则以后改站点文件名
//   （stardew-maximal-v3.html → index.html）会让评论"跟着搬家"甚至丢失。
function commentsBlock(a, opts) {
  const o = opts || {};
  const c = (SITE.comments || {});
  const blockId = o.id || 'comments';
  const title = o.title || '评论';
  const head = `<h2 class="pt">${ic('mailbox', 'xs')}${title}${ic('mailbox', 'xs')}</h2>`;

  if (c.provider === 'giscus' && c.giscus && c.giscus.repo && c.giscus.repoId) {
    const g = c.giscus;
    // 首页用固定 term 开帖；文章页按路径，天然一页一帖
    const mapping = o.mapping || g.mapping || 'pathname';
    const termLine = mapping === 'specific'
      ? `\n      data-term="${esc(o.term || title)}" data-strict="1"`
      : `\n      data-strict="0"`;
    return `<section class="panel cmtpanel" id="${esc(blockId)}">
  ${head}
  <div class="cmtbox">
    <script src="https://giscus.app/client.js"
      data-repo="${esc(g.repo)}" data-repo-id="${esc(g.repoId)}"
      data-category="${esc(g.category)}" data-category-id="${esc(g.categoryId)}"
      data-mapping="${esc(mapping)}"${termLine}
      data-reactions-enabled="${esc(g.reactionsEnabled || '1')}" data-emit-metadata="0"
      data-input-position="${esc(g.inputPosition || 'top')}"
      data-theme="light" data-lang="zh-CN" data-loading="lazy"
      crossorigin="anonymous" async></script>
  </div>
</section>`;
  }

  if (c.provider === 'twikoo' && c.twikoo && c.twikoo.envId) {
    return `<section class="panel cmtpanel" id="${esc(blockId)}">
  ${head}
  <div class="cmtbox" id="twikoo"></div>
  <script src="https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js"></script>
  <script>
    twikoo.init({ envId: ${JSON.stringify(c.twikoo.envId)}, el: '#twikoo', path: location.pathname });
  </script>
</section>`;
  }

  // 缺哪个值就写清楚缺哪个 —— 一句笼统的"配置不完整"对排查毫无帮助，
  // 而这个提示是页面上唯一能看到的地方。
  const miss = [];
  if (c.provider === 'giscus') {
    const g = c.giscus || {};
    ['repo', 'repoId', 'category', 'categoryId'].forEach((k) => { if (!g[k]) miss.push('giscus.' + k); });
  } else if (c.provider === 'twikoo') {
    if (!(c.twikoo && c.twikoo.envId)) miss.push('twikoo.envId');
  }
  const why = c.provider ? '评论区还差配置：' + miss.join('、') : '评论区还没接上。';
  return `<section class="panel cmtpanel" id="${esc(blockId)}">
  ${head}
  <p class="cmtnote">${esc(why)}</p>
  <p class="cmtnote">静态站点自己没有地方存评论，得挂一个现成的服务。
  到 <code>build/site.config.js</code> 补齐即可 —— 该文件头部写明了每个值去哪个页面拿。</p>
</section>`;
}

// ---------- 文章页 ----------
function page(a, prev, next) {
  const reading = tableOfContents(a.html);
  const icon = a.icon || 'book';
  const cover = a.cover
    ? `<p class="artcover"><img src="${esc(rel(a.cover))}" alt="${esc(a.title)}"></p>`
    : '';
  // 标签各配一枚像素图标（映射表 TAG_ICON 在 content.js）；没命中的标签原样出文字。
  // ⚠️ 图标是 display:block 的 SVG，直接塞进 <p> 的文本流会被当成块级元素换行 ——
  //    gen.js 里的 .artmeta svg.ic 规则已把它退回 inline-block（theme.css 的唯一来源）。
  const tagRow = (a.tags || []).map((t) => (TAG_ICON[t] ? ic(TAG_ICON[t], 'xs') : '') + esc(t)).join(' / ');
  const metarow = [a.date, a.meta, tagRow].filter(Boolean).join(' · ');

  /* 目录在左、正文在右（柯西 2026-09-20：「文章内的文章目录能不能放在左边」）。
     有目录才建两栏（.art-cols）；没有目录时正文整幅居中，跟改造前一样。 */
  const body = reading.toc
    ? `<div class="art-cols">
      <aside class="toc-side">${reading.toc}</aside>
      <div class="artbody">
${reading.body}
      </div>
    </div>`
    : `<div class="artbody">
${reading.body}
    </div>`;

  return `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(a.title)} · ${esc(SITE.name)}</title>
<link rel="stylesheet" href="../assets-layers.css">
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="../assets/theme.css">
</head>
<body class="is-article">
${decorate()}
${spriteFor(['mailbox', 'book', 'star', 'wateringcan', 'heart', 'flower', 'wheat', 'basket', 'share', icon]
  .concat(Object.values(TAG_ICON)).concat(DECOR_ICONS))}
<div class="wrap">
  <nav class="abarnav${reading.toc ? ' has-toc' : ''}">
    <a class="abtn" href="../${esc(SITE.home)}">${ic('mailbox', 'sm')}回到农场</a>
    <a class="abtn" href="index.html">${ic('basket', 'sm')}博客首页</a>
  </nav>
  <article class="panel artpage${reading.toc ? ' has-toc' : ''}">
    <h2 class="pt">${ic(icon, 'xs')}${SRC_LABEL[a.source] || '文章'}${ic(icon, 'xs')}</h2>
    ${corners('flower', 'flower', 'wheat', 'wheat')}
    <h1 class="arttitle">${esc(a.title)}</h1>
    <div class="artmeta-row">
      <p class="artmeta">${esc(metarow)}</p>
      ${shareBtn('sm')}
    </div>
    ${cover}
    ${body}
    <footer class="artfoot">
      ${a.link
      ? `<a class="artorig" href="${esc(a.link)}" target="_blank" rel="noopener">原载于豆瓣 ↗</a>`
      : `<span class="artorig quiet">${esc(SITE.name)}</span>`}
    </footer>
  </article>
  ${commentsBlock(a)}
  <nav class="apager">
    ${prev ? `<a class="apg prev" href="${esc(prev.slug)}.html"><i>上一篇</i><b>${esc(prev.title)}</b></a>` : '<span class="apg empty"></span>'}
    ${next ? `<a class="apg next" href="${esc(next.slug)}.html"><i>下一篇</i><b>${esc(next.title)}</b></a>` : '<span class="apg empty"></span>'}
  </nav>
  ${bottomBlock('', '../')}
</div>
<script src="../assets/vendor/papermod-reading.js" defer></script>
${seasonScript()}
${shareScript()}
</body>
</html>
`;
}

// ---------- 博客列表页（= 完整时间线） ----------
//
// 这是「发博客」功能的门面：柯西 2026-09-16 要的是**一个正式的博客页**，
// 不是命令行工具、也不是代写代发。所以他写 .md 丢进 content/posts/，
// 这里就长出一页博客来。
//
// 2026-09-20 柯西：**「把时间线做一个单独的页面（作为博客页），
// 主页只要放三篇最新的文章」** → 完整的时间线从主页搬到了这一页。
// 结构从「大卡 + 紧凑列表」换成**时间线卡片**，与主页「最新文章」面板
// 逐字节同构（tlwrap / tl-line / tl-item / tl-card），只有两处按子目录调整：
//   1. 文章链接是同级 `${slug}.html`（不是主页的 `posts/${slug}.html`）；
//   2. 封面路径要加 `../`（rel()），因为这一页自己在 posts/ 里。
//
// ⚠️ 样式不在本文件：.tl-* 的唯一定义在 gen.js 的内联 <style>，
//    构建时导出成 assets/theme.css，本页 <link> 的就是它。改样式去改 gen.js。
//
// 仍然守住 2026-09-16 那三条"真博客页"的底线（只是换了个外形）：
//   1. **带摘要和封面** —— 一列光秃秃的标题没法让人决定点哪个；
//   2. **按来源分组标注** —— 本站手写的和豆瓣影评混在一起，但标签要能分清；
//   3. **有自己的评论区** —— 柯西要求"首页 + 每篇文章"都有评论，博客列表页是
//      除首页外最该能留言的地方（读者想说"你最近写得好"时，不会去某一篇文章底下说）。
//      ⚠️ 它用固定 term 'blog' 开独立帖，不能按路径 —— 列表页路径以后可能变，
//      而且跟首页的 'home' 帖必须是两个（首页是留言板，这里是博客总评论）。
function blogPage(list) {
  const siteCount = list.filter((x) => x.source === 'site').length;
  const doubanCount = list.filter((x) => x.source === 'douban').length;

  /* 时间线卡片。与 gen.js 主页 timeline() 的 card() 同构 —— 改一边记得改另一边，
     check-timeline.js 两个页面都会量。 */
  const card = (a, i) => {
    const [y, m, d] = String(a.date).split('-');
    const tags = [a.source === 'douban' ? '豆瓣影评' : '本站']
      .concat(a.tags.filter((t) => t !== '豆瓣影评'))
      .slice(0, 3);
    return `
      <li class="tl-item${i === 0 ? ' lead' : ''}">
        <div class="tl-when">
          <b>${m}.${d}</b>
          <i>${y}</i>
        </div>
        <div class="tl-axis"><span class="tl-dot">${ic(a.icon, 'xs')}</span></div>
        <a class="tl-card${a.cover ? '' : ' nocover'}" href="${esc(a.slug)}.html">
          ${a.cover
        ? `<span class="tl-cover"><img src="${esc(rel(a.cover))}" alt="" loading="lazy"></span>`
        : ''}
          <div class="tl-body">
            <b class="tl-title">${esc(a.title)}</b>
            <p class="tl-exc">${esc(a.excerpt.slice(0, 110))}</p>
            <div class="tl-tags">
              ${tags.map((t) => `<span class="tl-tag">${TAG_ICON[t] ? ic(TAG_ICON[t], 'xs') : ''}${esc(t)}</span>`).join('')}
            </div>
          </div>
        </a>
      </li>`;
  };

  // id="timeline" 让 check-timeline.js 用同一段 EXPR 同时量主页和这一页。
  // 一篇都没有时不画时间线，留一句指向写作台的话（不留空面板）。
  const timeline = list.length
    ? `<div class="tlwrap" id="timeline"><span class="tl-line"></span>
    <ul class="tl">${list.map(card).join('')}</ul>
  </div>`
    : '<p class="blog-note">还没有文章。去 <a href="../write/index.html">写作台</a> 写第一篇。</p>';

  return `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>博客 · ${esc(SITE.name)}</title>
<link rel="stylesheet" href="../assets-layers.css">
<link rel="stylesheet" href="../font.css">
<link rel="stylesheet" href="../assets/theme.css">
</head>
<body class="is-article">
${decorate()}
${spriteFor(['mailbox', 'basket', 'book', 'wateringcan', 'star', 'wheat', 'flower', 'chest', 'share']
  .concat(list.map((a) => a.icon))
  .concat(Object.values(TAG_ICON))
  .concat(DECOR_ICONS))}
<div class="wrap">
  <nav class="abarnav">
    <a class="abtn" href="../${esc(SITE.home)}">${ic('mailbox', 'sm')}回到农场</a>
  </nav>
  <section class="panel artpage">
    <h2 class="pt">${ic('basket', 'xs')}博客${ic('basket', 'xs')}</h2>
    ${corners('wheat', 'flower', 'flower', 'wheat')}
    <h1 class="arttitle">一共 ${list.length} 篇</h1>
    <div class="artmeta-row">
      <p class="artmeta">本站手写 ${siteCount} 篇 · 豆瓣影评 ${doubanCount} 篇 · 按时间倒序</p>
      ${shareBtn('sm')}
    </div>
    ${timeline}
    <p class="blog-note">想投稿 / 纠错：首页底部「留言板」，或每篇文章底部的评论区。</p>
  </section>
  ${bottomBlock(commentsBlock(null, { id: 'comments-blog', title: '博客评论', mapping: 'specific', term: 'blog' }), '../')}
</div>
${seasonScript()}
${shareScript()}
</body>
</html>
`;
}

/* 清掉"上一次构建留下的、这一次已经不该存在的"页。
   ⚠️ 为什么非要有这一步：文章被删掉之后（云端写作就是在网页上删 .md），
   gen.js 只负责**重新生成该有的页**，不会顺手删掉**多出来的页**。
   结果就是源文没了、文章页还挂在线上，而且没有任何地方会报错。
   （2026-09-17 端到端自检抓到的：删掉测试文章、重建也 success，
     但 posts/E2E链路自检.html 依然在仓库里。）
   ⚠️ 边界：只删这一层的 .html。posts/ 下现在只有页面，但万一以后
   放了图片/附件，这条边界保证不会被误删。 */
function prune(expected) {
  const stale = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.html') && !expected.has(f));
  stale.forEach((f) => fs.unlinkSync(path.join(OUT_DIR, f)));
  return stale;
}

function build() {
  const list = articles();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 文章索引页按时间倒序，上一篇/下一篇 = 时间线上更晚/更早的那篇
  list.forEach((a, i) => {
    const prev = list[i - 1] || null;   // 更晚发的
    const next = list[i + 1] || null;   // 更早发的
    fs.writeFileSync(path.join(OUT_DIR, a.slug + '.html'), page(a, prev, next), 'utf8');
  });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), blogPage(list), 'utf8');

  const expected = new Set(list.map((a) => a.slug + '.html').concat('index.html'));
  const stale = prune(expected);

  console.log(
    '已生成 posts/ ：' + list.length + ' 篇文章 + index.html（博客列表）' +
      (stale.length ? '；清掉 ' + stale.length + ' 个失效页：' + stale.join('、') : '')
  );
  return list;
}

module.exports = { build, commentsBlock, blogPage };

if (require.main === module) {
  try {
    build();
  } catch (e) {
    console.error('\n✗ 生成文章页失败：' + e.message);
    if (/theme\.css|ENOENT/.test(e.message)) {
      console.error('  提示：assets/theme.css 由 build/gen.js 生成，先跑 `node build/gen.js`。');
    }
    process.exit(1);
  }
}
