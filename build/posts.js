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
const { articles } = require('./content.js');
const { ICONS, toSymbol } = require('./icons.js');
const { seasonScript, bottomBlock } = require('./subpage.js');
const SITE = require('./site.config.js');

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
  const head = `<span class="pt">${ic('mailbox', 'xs')}${title}${ic('mailbox', 'xs')}</span>`;

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
  const icon = a.icon || 'book';
  const cover = a.cover
    ? `<p class="artcover"><img src="${esc(rel(a.cover))}" alt="${esc(a.title)}"></p>`
    : '';
  const metarow = [a.date, a.meta, a.tags.join(' / ')].filter(Boolean).join(' · ');

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
${spriteFor(['mailbox', 'book', 'star', 'wateringcan', 'heart', 'flower', 'wheat', 'basket', icon])}
<div class="wrap">
  <nav class="abarnav">
    <a class="abtn" href="../${esc(SITE.home)}">${ic('mailbox', 'sm')}回到农场</a>
    <a class="abtn" href="index.html">${ic('basket', 'sm')}博客首页</a>
  </nav>
  <article class="panel artpage">
    <span class="pt">${ic(icon, 'xs')}${SRC_LABEL[a.source] || '文章'}${ic(icon, 'xs')}</span>
    ${corners('flower', 'flower', 'wheat', 'wheat')}
    <h1 class="arttitle">${esc(a.title)}</h1>
    <p class="artmeta">${esc(metarow)}</p>
    ${cover}
    <div class="artbody">
${a.html}
    </div>
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
${seasonScript()}
</body>
</html>
`;
}

// ---------- 博客列表页 ----------
//
// 这是「发博客」功能的门面：柯西 2026-09-16 要的是**一个正式的博客页**，
// 不是命令行工具、也不是代写代发。所以他写 .md 丢进 content/posts/，
// 这里就长出一页博客来。
//
// 三件事决定了它不是"一列标题了事"：
//   1. **带摘要和封面** —— 一列光秃秃的标题没法让人决定点哪个。
//   2. **按来源分组标注** —— 本站手写的和豆瓣影评混在一起，但标签要能分清。
//   3. **有自己的评论区** —— 柯西要求"首页 + 每篇文章"都有评论，博客列表页是
//      除首页外最该能留言的地方（读者想说"你最近写得好"时，不会去某一篇文章底下说）。
//      ⚠️ 它用固定 term 'blog' 开独立帖，不能按路径 —— 列表页路径以后可能变，
//      而且跟首页的 'home' 帖必须是两个（首页是留言板，这里是博客总评论）。
function blogPage(list) {
  const siteCount = list.filter((x) => x.source === 'site').length;
  const doubanCount = list.filter((x) => x.source === 'douban').length;
  // 最近一篇做成大卡（有封面就显封面），其余的排成紧凑列表。
  // ⚠️ 没有封面时**整个封面元素都不要**，不要拿图标/灰块占位（柯西 2026-09-17 要求）。
  //    曾经的写法是 `<span class="blog-lead-cover blank">${ic(icon)}</span>`，
  //    等于告诉读者"这里本来该有张图"—— 没有就是没有。
  //    ⚠️ 两处都是 flex 行，少一个子元素文字会自然铺满，不需要改 CSS。
  const [lead, ...rest] = list;

  const leadCard = lead ? `
      <a class="blog-lead" href="${esc(lead.slug)}.html">
        ${lead.cover
      ? `<span class="blog-lead-cover"><img src="${esc(rel(lead.cover))}" alt="" loading="lazy"></span>`
      : ''}
        <span class="blog-lead-body">
          <em class="blog-lead-tag">最新 · ${esc(SRC_LABEL[lead.source] || '')}</em>
          <b class="blog-lead-title">${esc(lead.title)}</b>
          <span class="blog-lead-exc">${esc((lead.excerpt || '').slice(0, 150))}</span>
          <span class="blog-lead-meta">${esc([lead.date, lead.tags.slice(0, 3).join(' / ')].filter(Boolean).join(' · '))}</span>
        </span>
      </a>` : '';

  const row = (a) => `
      <li class="blog-row ${a.source}">
        ${a.cover
      ? `<span class="blog-row-cover"><img src="${esc(rel(a.cover))}" alt="" loading="lazy"></span>`
      : ''}
        <span class="blog-row-body">
          <a class="blog-row-title" href="${esc(a.slug)}.html">${esc(a.title)}</a>
          <span class="blog-row-exc">${esc((a.excerpt || '').slice(0, 96))}</span>
          <span class="blog-row-meta">${esc([a.date, a.meta, a.tags.filter((t) => t !== '豆瓣影评').slice(0, 3).join(' / ')].filter(Boolean).join(' · '))}</span>
        </span>
        <span class="blog-row-src">${esc(SRC_LABEL[a.source] || '')}</span>
      </li>`;

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
${spriteFor(['mailbox', 'basket', 'book', 'wateringcan', 'star', 'wheat', 'flower', 'chest'])}
<div class="wrap">
  <nav class="abarnav">
    <a class="abtn" href="../${esc(SITE.home)}">${ic('mailbox', 'sm')}回到农场</a>
  </nav>
  <section class="panel artpage">
    <span class="pt">${ic('basket', 'xs')}博客${ic('basket', 'xs')}</span>
    ${corners('wheat', 'flower', 'flower', 'wheat')}
    <h1 class="arttitle">一共 ${list.length} 篇</h1>
    <p class="artmeta">本站手写 ${siteCount} 篇 · 豆瓣影评 ${doubanCount} 篇 · 按时间倒序</p>
    ${leadCard}
    <ul class="bloglist">
      ${rest.map(row).join('')}
    </ul>
    <p class="blog-note">想投稿 / 纠错：首页底部「留言板」，或每篇文章底部的评论区。</p>
  </section>
  ${bottomBlock(commentsBlock(null, { id: 'comments-blog', title: '博客评论', mapping: 'specific', term: 'blog' }), '../')}
</div>
${seasonScript()}
</body>
</html>
`;
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

  console.log('已生成 posts/ ：' + list.length + ' 篇文章 + index.html（博客列表）');
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
