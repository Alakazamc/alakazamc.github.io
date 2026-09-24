// 生成极繁主义星露谷风格主页 v2
// 参考：theperiperi/portfolio-website（高饱和游戏原色 + box-shadow 像素画 + 视差云）
//       LidioMonkey/MyWebPage（星露谷主题：自定义光标 + 跟随鼠标的宠物 + 星星动画）
const fs = require('fs');
const path = require('path');
const { validate, buildSprite, ICONS } = require('./icons.js');
const { toCursorSvg, encode } = require('./cursor.js');
const { brandIcon } = require('./brands.js');
const DC = require('./decor.js');
const PIXEL = require('./pixel-art.js');
const MUSIC = require('./music.js');
const ALBUMS = require('./album-data.js').load();
const md = require('./md.js');
const { articles, TAG_ICON } = require('./content.js');
const SITE = require('./site.config.js');
const FARM = require('./farm-modules.js');
const { shareBtn, shareScript } = require('./subpage.js');
const galleryData = require('./gallery-data.js');

// 相馆元数据是用户在写作页上传后新增的，构建前必须先刷新数据快照。
// 失败只让相馆退化为空，不拖垮文章、仓库、博物馆等其他数据源。
let GALLERY = { updatedAt: '', count: 0, items: [] };
try {
  GALLERY = galleryData.build();
} catch (e) {
  console.warn('⚠️  读取相馆失败，相馆退回为空：' + e.message);
}

// 全部文章（本站手写的 + 豆瓣影评），已按时间倒序。
// 抓取或内容出错时退化成空数组 —— **一条外部内容不该让整站构建失败**，
// 时间线会退回骨架占位，页面照常出来。
let ARTICLES = [];
try {
  ARTICLES = articles();
} catch (e) {
  console.warn('⚠️  读取文章失败，时间线退回占位：' + e.message);
}

// 光标 = 像素箭头（2026-09-17 柯西要求：去掉宠物系统，改成像素风光标）。
//
// 历史：这里以前是荔宝（他家那只猫），光标和页面上跟着跑的跟班共用一份数据。
// 柯西 2026-09-17 明确要求「不要现在的宠物系统了」→ 跟班整块移除，
// 光标换成经典像素箭头。荔宝的图标数据（icons.js 的 libao / libao_b / libao_c）
// **保留不删** —— 站内别处还在用作装饰，而且随时可能要还原。
//
// 热点是 (0,0)，所以这里必须传 pad=0（见 cursor.js 的 CURSORS 注释）。
// 普通态 = 米白填充；可点态 = 金黄填充（arrow_hot，icons.js 里有说明）。
// ⚠️ 这两支**必须是不同的图**：2026-09-20 柯西反馈"鼠标有点问题"，
//    以前这里两支都指向 arrow，等于可点处毫无反馈 —— cursor:url() 加载成功时
//    pointer 兜底关键字不参与渲染，"靠兜底关键字提示可点"这个说法是错的。
const CUR_A = encode(toCursorSvg('arrow', 0));     // 普通态
const CUR_B = encode(toCursorSvg('arrow_hot', 0)); // 可点态（金黄）

const errs = validate();
if (errs.length) { console.error('图标数据有误:\n' + errs.join('\n')); process.exit(1); }
console.log('图标校验通过：' + Object.keys(ICONS).length + ' 个');

const ic = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16"><use href="#px-${n}"></use></svg>`;
const slot = (kind, w, h) => `<span class="slot ${kind}" style="width:${w};height:${h}"></span>`;
const corners = (a, b, c, d) =>
  `<span class="cor tl">${ic(a, 'sm')}</span><span class="cor tr">${ic(b, 'sm')}</span>` +
  `<span class="cor bl">${ic(c, 'sm')}</span><span class="cor br">${ic(d, 'sm')}</span>`;
const panel = (title, deco, inner, id, cls) => `
<section class="panel${cls ? ' ' + cls : ''}"${id ? ` id="${id}"` : ''}>
  <h2 class="pt">${ic(deco[4] || 'star', 'xs')}${title}${ic(deco[4] || 'star', 'xs')}</h2>
  ${corners(deco[0], deco[1], deco[2], deco[3])}
  ${inner}
</section>`;
// 分隔藤蔓：原来是「一条虚线 + 一朵花」，现在改成「叶—花—叶」。
// 右边那片必须水平翻转，不然两片叶子朝同一边，看着像贴图用歪了。
const vine = (n) => `<div class="vine">${ic('leaf2')}${ic(n || 'flower')}<span class="flip">${ic('leaf2')}</span></div>`;

// ---------- 平台导航 ----------
// 挂在招牌下面。图标走 brands.js 的路径 SVG（不是像素画 —— 16×16 拼不出品牌字形，
// 实测 GitHub 成一坨、小红书/知乎认不出）。
// 账号信息集中在 ACCOUNTS，改一处就够。
//
// 2026-09-15 柯西：**去掉 B站和知乎，接入豆瓣**。
// 2026-09-16 柯西：**头部去掉豆瓣**（豆瓣入口改由「博物馆」承载，头部不再重复），
//   并把「邮箱」「微信」从跳转改成**点击显示号码**。
//
// ⚠️ 为什么邮箱不再是 mailto：
//   mailto 在没装邮件客户端的机器上点了毫无反应（甚至弹一个空白窗口），
//   手机上也经常跳到一个没登录的邮箱 App。柯西要的是「点击显示我的邮箱号」——
//   直接亮出来 + 可复制，比丢给系统去猜靠谱。
//   微信同理：微信没有「个人号主页」这种公开 URL，只能给微信号让人手动搜。
//
// 小红书：用户号 94119390210。
// 小红书没有干净的「个人主页 URL」，手机端分享出来的链接是
// https://www.xiaohongshu.com/user/profile/<userid> 加一长串 xsec_token，
// 那个 token 有有效期，写死在页面里过阵子就失效。这里用不带 token 的形式，稳定可点。
//
// `copy` 字段 = 点击后弹出提示里那个「可长按/双击复制」的号码本身。
const ACCOUNTS = [
  { k: 'github', label: 'GitHub', url: 'https://github.com/Alakazamc' },
  { k: 'xhs', label: '小红书', url: 'https://www.xiaohongshu.com/user/profile/94119390210' },
  { k: 'mail', label: '邮箱', copy: 'alakazama@qq.com' },
  { k: 'wechat', label: '微信', copy: 'Alakazamc' }
];

const social = () => `<nav class="social" aria-label="社交平台">${ACCOUNTS.map((a) => {
  const inner = `${brandIcon(a.k)}<em>${a.label}</em>`;
  // 可复制的（邮箱 / 微信）渲染成按钮：点了就地弹提示，不跳转、不离开页面
  if (a.copy) {
    return `<button type="button" class="soc copyable" data-copy="${md.esc(a.copy)}" ` +
      `title="点击显示${a.label}"><span class="soc-in">${inner}</span></button>`;
  }
  // 账号还没定的先渲染成不可点的占位（避免死链），定了再改成 <a>
  return a.url
    ? `<a class="soc" href="${a.url}" title="${a.label}"${a.url.startsWith('http') ? ' target="_blank" rel="me noopener"' : ''}>${inner}</a>`
    : `<span class="soc todo" title="${a.label} · 账号待填">${inner}</span>`;
}).join('')}</nav>`;

// ---------- 豆瓣书影音档案 ----------
// 数据由 build/douban.js 抓取（写在 data/douban.json，封面落在 assets/covers/）。
// 抓不到时渲染成占位骨架 —— 没有数据也必须能构建，不能让一条外部数据把整站卡死。
//
// 2026-09-15：柯西给了豆瓣号 211628276 并确认「收藏」是公开的，
// 页面里跑的**已经是他自己的真实数据**（370 条标记 + 7 篇影评）。
// 换号的话：重跑 `node build/douban.js <新号>`，这里会自动跟着变。
const DOUBAN = (() => {
  const f = path.join(__dirname, 'data', 'douban.json');
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
})();

// ---------- GitHub 仓库（「工坊」面板 + 「专精」面板） ----------
// 数据由 build/sources/github.js 拉取，写在 data/github.json。
// 同一条降级约定：拉不到就渲染占位骨架，不让构建失败。
const GITHUB = (() => {
  const f = path.join(__dirname, 'data', 'github.json');
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
})();

// ---------- 游戏数据（「游戏架」面板） ----------
// 数据由 build/sources/heybox.js 拉取（无头浏览器截接口），
// 生涯汇总来自 data/games.json；公开分平台完整列表来自 data/game-library.json。
// 生成时只读快照；私有来源适配器逐平台分页校验后才更新快照。
const GAMES = require('./game-data.js').loadGames();
const { gameIcon } = require('./game-data.js');

// 小黑盒的 platform 字段 → 中文名 + 平台主色（取自它自己的 platform_infos）
const PLATFORM = {
  steam: { cn: 'Steam', c: '#064E96' },
  psn: { cn: 'PSN', c: '#0071CE' },
  xbox_v2: { cn: 'Xbox', c: '#0F7C10' },
  switchall: { cn: 'Switch', c: '#E70012' },
  epic: { cn: 'Epic', c: '#2F2D2E' }
};

// 展品类别。动词沿用豆瓣自己的文案（看过/读过/听过/玩过），不自创。
const SHELF_KIND = [
  { k: 'all', cn: '全部' },
  { k: 'movie', cn: '影' },
  { k: 'book', cn: '书' },
  { k: 'music', cn: '音乐' },
  { k: 'game', cn: '游戏' }
];

// 豆瓣给的封面主色是两个坑：
// 1. 它是**整张图的平均色**，不是主色调 —— 深色海报居多的片单会糊成同一片暗蓝。
// 2. 它还要拿来当封面图四周的衬底色，平均色普遍偏暗，直接铺会把卡片压成一团黑。
// 所以做一道「绕亮度中点拉开色差 + 整体提亮」的处理，把被平均掉的色相找回来。
// 这不是造假 —— 排版需要的是能互相区分的颜色，而平均色恰恰不区分。
const vivid = (c) => {
  const mx = Math.max(...c), mn = Math.min(...c), mid = (mx + mn) / 2;
  const SAT = 1.75, BRIGHT = 1.15, CAP = 0.34;
  return c.map((v) => {
    const s = mid + (v - mid) * SAT;
    return Math.max(CAP, Math.min(1, s * BRIGHT));
  });
};
const rgb2hex = (c) =>
  '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');

// 一次构建最多展出多少件。封面是本地文件，多一条多 20KB；
// 而且横向滚动的一排太长也没人划到底。
const SHELF_SHOW = 36;

// 主页只放最新几条。2026-09-20 柯西：**时间线独立成页**（posts/index.html
// 就是完整的那条），主页这块退化成"最新文章"预告 —— 3 条 ≈ 半屏，
// 再长就把下面的博物馆/相馆顶出第二屏。全部条目都在 posts/index.html 里，不会丢。
const TL_SHOW = 3;

// 主页展示配置中的三项精选，全部仓库仍在工坊页。
// 全部仓库在 workshop/index.html（「查看更多」入口点进去）。
const REPO_SHOW = 3;

const controls = () => `
<details class="appearance-settings"><summary>外观设置</summary><div class="controls">
  <div class="crow">
    ${[['spring', 'parsnip', '春'], ['summer', 'melon', '夏'], ['autumn', 'pumpkin', '秋'], ['winter', 'snowman', '冬']]
      .map(([k, n, t]) =>
      `<button class="cbtn" data-set-season="${k}">${ic(n, 'sm')}<em>${t}</em></button>`).join('')}
  </div>
  <button class="cbtn daynight" data-toggle-time>${ic('sun', 'sm')}<em>昼</em></button>
  <div class="crow">
    <button class="cbtn bgmode" data-bg-toggle="image">${ic('tree', 'sm')}<em>风景</em></button>
    <button class="cbtn bgmode" data-bg-toggle="code">${ic('flower', 'sm')}<em>像素</em></button>
  </div>
${FARM.settings()}
</div></details>`;

const bunting = () => {
  const cs = ['#FF5A5A', '#FFD23F', '#5FD35F', '#4FC3F7', '#FF7BC5', '#FF9838', '#B07CFF'];
  let s = '';
  for (let i = 0; i < 26; i++)
    s += `<i style="--c:${cs[i % cs.length]};animation-delay:${(i * 0.08).toFixed(2)}s"></i>`;
  return `<div class="bunting">${s}</div>`;
};

const hang = () => {
  const l = ['strawberry', 'cherry', 'grape', 'blueberry', 'starfruit', 'mushroom', 'pepper', 'tomato', 'acorn'];
  return `<div class="hang">${l.map((n, i) =>
    `<span style="animation-delay:${(i * 0.3).toFixed(2)}s">${ic(n)}</span>`).join('')}</div>`;
};

// 工具条 = 真导航。图标要跟按钮语义对得上 ——
// 「日历」配灯笼、「账本」配箱子是配错了，换成 sun / coin。
//
// 原来「最新」「文章」两个按钮分别指向 featured / articles 两个面板；
// 合并成一条时间线后，这两个按钮也就并成一个「时间线」。
// 2026-09-20：时间线独立成页（posts/index.html），这个按钮从页内锚点
// 改成跳转到那一页 —— 它现在指向"完整的那条时间线"。
const toolbar = () => {
  const items = [
    ['wateringcan', '时间线', 'posts/index.html'],
    ['book', '写作台', 'write/index.html'],
    ['book', '博物馆', '#museum'],
    ['chest', '工坊', '#projects'],
    ['scythe', '相馆', '#gallery'],

  ];
  // ⚠️ 「联系」不能再写成 mailto: —— 柯西 2026-09-16 明确要求邮箱点击是**显示号码**
  // 而不是拉起邮件客户端（没装邮件客户端的机器上点 mailto 毫无反应）。
  // 所以它跟招牌下那排账号一样，走 data-copy 弹提示；标签也从「联系」改成
  // 「邮箱」，因为点下去得到的是号码，不是联系方式的选择。
  const mail = ACCOUNTS.find((a) => a.k === 'mail');
  const mailBtn = `<button type="button" class="tool copyable" data-copy="${md.esc(mail.copy)}" title="点击显示邮箱">${ic('mailbox')}<em>邮箱</em></button>`;
  // 2026-09-21「分享功能没做好」→ 首页也有一枚分享键（.tool 竖排款式，
  // 与旁边五个导航工具同款；点击逻辑和复制降级在 subpage.js 的 shareScript）。
  // ⚠️ check-nav 的「死按钮」检查数 <button class="tool"> —— 分享键带
  //    data-share 不是死按钮，那条检查已相应排除（见 check-nav.js）。
  const shareTool = shareBtn(null, 'tool');
  // 「友情站」入口跟着数据走：没有友链时整个面板不渲染，入口也不能留
  // （留一个点了没反应的链接比没有入口更糟）。次级导航是详情折叠里的
  // 一行 <a>，加进来不挤占工具栏那排主入口。
  const friendNav = (SITE.friendSites || []).length
    ? '<a href="#friends">友情站</a>'
    : '';
  return `<nav class="toolbar" aria-label="主页导航">${items.map(([n, t, h]) =>
    `<a class="tool" href="${h}">${ic(n)}<em>${t}</em></a>`).join('')}${shareTool}</nav><details class="secondary-nav"><summary>更多分区</summary><a href="#calendar">日历</a><a href="#ledger">收获簿</a><a href="#music">唱片机</a><a href="#skills">专精</a><a href="#farm">农场一角</a>${friendNav}</details>`;
};

// ---------- 最新文章（主页上的时间线预告） ----------
// 历史：这里曾是整条时间线（12 条）。2026-09-20 柯西要求
// **「把时间线做一个单独的页面（作为博客页），主页只要放三篇最新的文章」**
// → 完整的时间线搬进 posts/index.html（见 posts.js blogPage），
// 主页这块只剩 TL_SHOW=3 条预告，标题也从「时间线」改成「最新文章」。
//
// 面板 id 仍是 timeline：锚点 #timeline 是老深链，标题换了 id 不能换
// （check-nav.js 的 PAIR 配对已同步改成「最新文章 ↔ timeline」）。
//
// 视觉规则不变（2026-09-15 柯西：**不做置顶/最新之分，按时间线来**）：
// 一条竖轴串起左手边一排时间戳，右手边是缩略图 + 标题 + 标签。
// 第一项稍大一点（有 .lead 类），因为它是「最近发生的」，但不叫"置顶"。
const timeline = () => {
  // 有时间线内容就渲染真的 —— 本站文章和豆瓣影评在这里是**同一种东西**
  // （都是他写的东西），只用一枚小标签标出来源。
  // 没有内容（数据抓不到 / 还没写过）才退回骨架占位。
  const list = ARTICLES.slice(0, TL_SHOW);

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
        <a class="tl-card${a.cover ? '' : ' nocover'}" style="--i:${i}" href="posts/${a.slug}.html">
          ${a.cover
        ? `<span class="tl-cover"><img src="${a.cover}" alt="" loading="lazy"></span>`
        : ''}
          <div class="tl-body">
            <b class="tl-title">${md.esc(a.title)}</b>
            <p class="tl-exc">${md.esc(a.excerpt.slice(0, 110))}</p>
            <div class="tl-tags">
              ${tags.map((t) => `<span class="tl-tag">${TAG_ICON[t] ? ic(TAG_ICON[t], 'xs') : ''}${md.esc(t)}</span>`).join('')}
            </div>
          </div>
        </a>
      </li>`;
  };

  const skeleton = [
    'strawberry', 'pumpkin', 'starfruit', 'eggplant', 'melon', 'cherry',
    'corn', 'grape', 'cauliflower', 'potato', 'tomato', 'blueberry'
  ].slice(0, TL_SHOW).map((n, i) => `
      <li class="tl-item${i === 0 ? ' lead' : ''}">
        <div class="tl-when">
          <b>${slot('title', '34px', '12px')}</b>
          <i>${slot('meta', '28px', '9px')}</i>
        </div>
        <div class="tl-axis"><span class="tl-dot">${ic(n, 'xs')}</span></div>
        <div class="tl-card">
          ${slot('cover', '56px', '78px')}
          <div class="tl-body">
            ${slot('title', i === 0 ? '88%' : '72%', i === 0 ? '15px' : '12px')}
            ${slot('body', '94%', '9px')}
            <div class="tl-tags">
              ${Array.from({ length: i % 2 ? 2 : 3 }, () =>
          `<span class="tl-tag">${slot('meta', '34px', '8px')}</span>`).join('')}
            </div>
          </div>
        </div>
      </li>`).join('');

  return panel('最新文章', ['flower', 'tulip', 'wheat', 'mushroom', 'sunflower'], `
  <div class="tlwrap"><span class="tl-line"></span>
    <ul class="tl">${list.length ? list.map(card).join('') : skeleton}</ul>
  </div>
  ${vine('sunflower')}
  <div class="more">${ic('basket')}` +
    (list.length
      ? `<a href="posts/index.html">完整时间线（${ARTICLES.length} 篇）</a>`
      : slot('meta', '140px', '11px')) +
    `${ic('basket')}</div>` + DC.shelf(), 'timeline');
};

// ---------- 工坊（GitHub 仓库） ----------
// 数据来自 build/sources/github.js（一次 GraphQL 拿全仓库 + 语言字节数）。
// 2026-09-16 柯西要求「把代码仓库放在最上面」—— 所以它排在整个 main 的第一位，
// 在时间线之前。求职场景下，「我做过什么」确实该是第一个被看到的东西。
//
// 面板名从「项目 / 手艺」改成「工坊」：内容换成真仓库之后，
// 「手艺」这个词就文不对题了，而工坊是星露谷里干活出成品的地方。
const repos = () => {
  const src = GITHUB;
  // 主页只摆最近 push 的这几个 —— 全部仓库在 workshop/index.html。
  // GitHub 接口已按 PUSHED_AT 倒序返回，这里直接切前 N 个即可。
  // 不切的话仓库一多，工坊面板会长到把时间线顶到第二屏之外，
  // 而工坊是放在最上面的（柯西要求），等于把下面的内容全埋了。
  const all = (src && src.repos) || [];
  const chosen = (SITE.featuredRepos || []).map(name => all.find(r => r.name === name)).filter(Boolean);
  const list = (chosen.length ? chosen : all).slice(0, REPO_SHOW);

  const card = (r, i) => `
      <a class="rcard" style="--i:${i}" href="${r.url}" target="_blank" rel="noopener">
        <span class="rc-h">${ic('chest', 'sm')}<b>${md.esc(r.name)}</b></span>
        <span class="rc-d">${md.esc(r.description || '（还没写简介）')}</span>
        <span class="rc-f">
          ${r.language
        ? `<i class="rc-l" style="background:${r.color || '#8A8A8A'}"></i><em>${md.esc(r.language)}</em>`
        : `<em class="rc-none">未标注</em>`}
          <span class="rc-t">${r.pushedAt.slice(5).replace('-', '.')}</span>
        </span>
      </a>`;

  const blank = (n) => Array.from({ length: n }, () => `
      <span class="rcard blank">${slot('title', '62%', '12px')}${slot('body', '100%', '11px')}${slot('body', '54%', '11px')}</span>`).join('');

  const tot = (src && src.totals) || {};
  const foot = list.length
    ? `<div class="rfoot">${ic('chest', 'sm')}<span class="sfx">${tot.repos || list.length} 个仓库</span>` +
    `${ic('gem', 'sm')}<span class="sfx">${tot.languages || 0} 种语言</span>` +
    `${ic('key', 'sm')}<span class="sfx">@${src.user}</span></div>`
    : '';

  // 「查看更多」入口：柯西 2026-09-16 要求「工坊也可以点击查看更多」。
  // 用跟博物馆完全相同的 .museum-more 类 —— 两个详情页入口在页面上长得一样，
  // 读者不用重新学一次「这里能不能点」。
  const more = list.length
    ? `<div class="museum-more">${ic('chest', 'sm')}<a href="workshop/index.html">查看全部仓库 · 可分类翻页</a>${ic('crystal', 'sm')}</div>`
    : '';

  return panel('工坊', ['chest', 'gem', 'crystal', 'coin', 'chest'],
    `<div class="rgrid">${list.length ? list.map(card).join('') : blank(6)}</div>${foot}${more}` + DC.shelf(), 'projects');
};

// ---------- 相馆 ----------
// 2026-09-18 取代原来的「公告板」：那块面板一直是三条灰色斜纹占位，
// 从上线起就没有真内容 —— 按柯西「没有内容就不留占位」的规矩，
// 假面板比少一个面板更糟。位置让给相馆（摄影作品），这也是全站
// 第一处出现「大图」的地方，正好补上视觉重心缺失的问题。
// 主页只摆最近 4 张（等高一条排），全部作品进 gallery/index.html 子页。
const galleryPanel = () => {
  const items = (GALLERY.items || []).slice(0, 4);
  if (!items.length) return '';   // 一张照片都没有：整个面板不渲染，不留灰块
  const cell = (it, i) => `
    <a class="gp" style="--i:${i}" href="gallery/index.html" title="${md.esc((it.generated ? '插画 · ' : '') + it.caption)}">
      <img src="assets/gallery/${it.thumb}" alt="${md.esc((it.generated ? '插画 · ' : '') + it.caption)}" width="${it.tw}" height="${it.th}" loading="lazy">
    </a>`;
  return panel('相馆', ['star', 'heart', 'heart', 'star', 'star'], `
  <div class="gstrip">${items.map(cell).join('')}</div>
  <div class="museum-more">${ic('star', 'sm')}<a href="gallery/index.html">相馆 · 全部 ${GALLERY.count} 张</a>${ic('heart', 'sm')}</div>` +
    DC.shelf(), 'gallery');
};

// ---------- 侧栏 ----------

const seasonPanel = () => panel('季节日历', ['sunflower', 'tulip', 'flower', 'mushroom', 'sun'], FARM.calendar() + DC.shelf(), 'calendar');

// ---------- 专精（技术栈） ----------
// 用 GitHub 的语言字节统计驱动，数据来自 sources/github.js。
// 面板名沿用星露谷的「专精」：游戏里技能到 5 级 / 10 级要选一个方向，
// 跟「我主要写什么」是同一种表达。
//
// ⚠️ 措辞是「代码构成」而不是「技能熟练度」：GitHub 是按**字节数**判语言的，
// 模板/配置多的仓库会失真 —— 比如 szudesktop 简介写着「Go 单文件」，
// 但仓库里 HTML 模板字节更多，主语言被判成 HTML。写「熟练度」就是撒谎。
const techStack = () => {
  const src = GITHUB;
  const langs = ((src && src.languages) || []).slice(0, 6);

  const row = (l) => {
    const pct = Math.round(l.percent * 1000) / 10;
    return `
      <li>
        ${ic('gem', 'sm')}<em>${md.esc(l.name)}</em>
        <span class="tbar"><b style="width:${Math.max(pct, 3)}%;background:${l.color || '#8A8A8A'}"></b></span>
        <u>${pct}%</u>
      </li>`;
  };

  const blank = (n) => Array.from({ length: n }, (_, i) => `
      <li>${ic('gem', 'sm')}${slot('title', '48px', '12px')}
        <span class="tbar"><b style="width:${70 - i * 9}%"></b></span><u>${slot('meta', '26px', '11px')}</u></li>`).join('');

  const inner = langs.length
    ? `<ul class="stack">${langs.map(row).join('')}</ul>
       <div class="gfoot">${ic('gem', 'sm')}<span class="sfx">代码构成 · 按字节数统计</span></div>`
    : `<ul class="stack">${blank(5)}</ul>`;

  return panel('专精', ['gem', 'ore', 'crystal', 'star', 'gem'], inner + DC.shelf(), 'skills');
};

// ---------- 友情站 ----------
// 数据在 build/site.config.js 的 friendSites（一行一个站：name / url / descr）。
// 2026-09-24 柯西问「可不可以加一个友情站链接的版面」→ 能，而且零新样式：
// 直接复用工坊的 .rgrid/.rcard 卡片体系（悬停上浮、按压下沉、入场错峰动画、
// 响应式全都是现成的，check-press / check-card-anim 已经守着它们）。
//
// ⚠️ 两条与工坊的刻意的不同：
//   1. 网格挂 .fgrid —— 友链卡没有语言色点和日期，两列比三列透气；
//      手机端 .fgrid 单列铺开且**不参与**工坊那个「只露两张」的截断规则
//      （截断规则已加 :not(.fgrid) 挡开，不然第 3 个起的站手机上直接消失）。
//   2. 卡片底部显示域名而不是语言/日期 —— 外站链接，域名就是「这是什么站」的注脚。
//
// 空数组 = 整个面板不渲染（柯西的规矩：没有内容就不留占位），
// 导航入口也一起消失（见 toolbar() 里那段条件渲染）。
const friendsPanel = () => {
  const list = (SITE.friendSites || []).filter((f) => f && f.name && f.url);
  if (!list.length) return '';

  const card = (f, i) => {
    let host = '';
    try { host = new URL(f.url).host; } catch (e) { host = ''; }
    return `
      <a class="rcard" style="--i:${i}" href="${md.esc(f.url)}" target="_blank" rel="noopener">
        <span class="rc-h">${ic('fence', 'sm')}<b>${md.esc(f.name)}</b></span>
        <span class="rc-d">${md.esc(f.descr || '')}</span>
        <span class="rc-f"><em>${md.esc(host)}</em></span>
      </a>`;
  };

  return panel('友情站', ['fence', 'mailbox', 'heart', 'flower', 'fence'],
    `<div class="rgrid fgrid">${list.map(card).join('')}</div>` + DC.shelf(), 'friends');
};

const farmPanel = () => panel('农场一角', ['flower', 'flower', 'wheat', 'wheat', 'tree'], `
  <div class="scene">
    ${['tree', 'scarecrow', 'beehive', 'chicken', 'cow', 'lantern', 'junimo', 'fence',
      'keg', 'cask', 'slime', 'wand', 'truffle']
      .map((n, i) => `<span style="animation-delay:${(i * 0.24).toFixed(2)}s">${ic(n, 'lg')}</span>`).join('')}
  </div>
  <div class="fencerow">${ic('fence')}${ic('fence')}${ic('fence')}${ic('fence')}${ic('fence')}${ic('fence')}</div>` +
    DC.shelf(), 'farm');

// ---------- 博物馆（豆瓣书影音） ----------
//
// 一排横向滚动的展品卡 = 柯西要的「展览列」。
// 选了「真实封面」方案（另有像素书脊方案，判定后放弃 —— 见 素材说明.md）：
// 封面在构建时下载到 assets/covers/，页面引用本地文件。
// ⚠️ 代价：站点不再是「一个自包含 HTML」，多了 assets/covers 这个文件夹要一起传。
//
// 三个做过决定的细节：
// 1. **封面用 contain 而不是 cover**。书封/海报是 2:3、音乐封面是方的、游戏图比例随意，
//    object-fit:cover 会把两边裁掉（尤其书脊上的书名正好在边上）。
//    contain 会露的背景，**正好用这条作品自己的主色填**，看起来是刻意衬的，不像留白。
// 2. **真实照片是全页唯一的写实素材**。这个站点其余部分全是手绘像素。
//    这是选 A 方案就必须接受的对照，不是 bug。
// 3. 没有数据时（data/douban.json 不存在）渲染占位卡片，布局不变。
const museum = () => {
  const src = DOUBAN;
  const albumItems = ALBUMS.items.map(x => ({ ...x, kind: 'music', image: x.cover + '?param=200y200', source: '网易云收藏' }));
  const gameItems = (GAMES.games || []).map(x => ({
    kind: 'game', title: x.name, image: x.cover ? 'assets/games/' + x.cover : '',
    // 认得出来的游戏在名字旁边挂一枚像素图标（Minecraft→草方块、星露谷→杨桃…）。
    // 映射表在 game-data.js 的 GAME_ICON，没命中的游戏留空不挂。
    icon: gameIcon(x.name),
    url: 'museum/index.html?kind=game', source: x.platformLabel || PLATFORM[x.platform]?.cn || x.platform,
    meta: [x.hours != null ? x.hours + ' 小时' : '', x.cleared ? '全成就' : '', x.notOwned ? '非当前拥有' : ''].filter(Boolean).join(' · ')
  }));
  const allItems = albumItems.concat(gameItems, (src && src.items || []).filter((x) => x.cover));
  const chosen = new Set(allItems.slice(0, SHELF_SHOW));
  SHELF_KIND.filter(t => t.k !== 'all').forEach(t => {
    allItems.filter(x => x.kind === t.k).slice(0, SHELF_SHOW).forEach(x => chosen.add(x));
  });
  const items = allItems.filter(x => chosen.has(x));
  const initiallyVisible = new Set(allItems.slice(0, SHELF_SHOW));

  const card = (it, i) => {
    const image = it.image || (it.cover ? 'assets/covers/' + it.cover : '');
    const c = rgb2hex(vivid(it.color || [0.55, 0.45, 0.35]));
    const stars = it.myRating
      ? '★'.repeat(it.myRating) + '☆'.repeat(5 - it.myRating) : '';
    return `
      <li class="exc" style="--i:${i}" data-kind="${it.kind}"${initiallyVisible.has(it) ? '' : ' hidden'}>
        <a href="${md.esc(it.url)}" target="_blank" rel="noopener" title="${md.esc(it.comment || it.title)}">
          ${image ? `<span class="poster" style="--pc:${c}"><img src="${md.esc(image)}" alt="${md.esc(it.title)}" loading="lazy" referrerpolicy="no-referrer"></span>` : ''}
          <span class="tx">
            <b class="t">${it.icon ? ic(it.icon, 'xs') : ''}${md.esc(it.title)}</b>
            <i class="m">${md.esc(it.artist || it.meta || (it.verb ? it.verb + ' · ' + (it.date || '—') : ''))}</i>
            ${it.source ? '<i class="m">' + md.esc(it.source) + '</i>' : ''}
            <span class="st">${stars}</span>
          </span>
        </a>
      </li>`;
  };

  const blank = (n) => `
      <li class="exc">
        <a><span class="poster blank">${ic('book')}</span>
          <span class="tx">${slot('title', '84%', '11px')}${slot('meta', '56%', '8px')}
          <span class="slot body" style="width:44px;height:8px"></span></span></a>
      </li>`.repeat(n);

  const counts = allItems.reduce((out, x) => { out[x.kind] = (out[x.kind] || 0) + 1; return out; }, {});
  const tabs = SHELF_KIND.map((t) => {
    const n = t.k === 'all' ? allItems.length : (counts[t.k] || 0);
    return `<button class="shelf-tab${t.k === 'all' ? ' on' : ''}" data-filter-kind="${t.k}" aria-pressed="${t.k === 'all'}">` +
      `<em>${t.cn}</em><i>${n}</i></button>`;
  }).join('');

  // 底部这行是**状态**不是标语：写清楚收录了多少件、数据什么时候更新过，
  // 以及这批数据属于哪个豆瓣号 —— 抓取脚本的号一旦和页面对不上，
  // 这行会直接把矛盾暴露出来（曾经抓到过别人的账号，靠这个才发现）。
  const updated = [src.updatedAt, ALBUMS.updatedAt, GAMES.libraryUpdatedAt].filter(Boolean).sort().pop()?.slice(0, 10).replace(/-/g, '.') || '';
  const foot = ` ${ic('book', 'sm')}<span class="sfx">已收录 ${allItems.length} 件 · 豆瓣 ${src.total || 0} · 网易云 ${ALBUMS.items.length} · 游戏 ${gameItems.length}</span>` +
    `${ic('star', 'sm')}<span class="sfx">更新 ${updated || '—'}</span>` +
    (src && src.uid ? `${ic('key', 'sm')}<span class="sfx">豆瓣 @${src.uid}</span>` : '');

  const inner = items.length
    ? `<section class="museum-zone douban-zone">
         <h3 class="museum-zone-title">${ic('book', 'sm')}收藏展览<a class="douban-mark-link" href="https://www.douban.com/people/${md.esc(String(src.uid || '211628276'))}/" target="_blank" rel="noopener">去豆瓣打标</a></h3>
         <div class="shelf-bar">${tabs}</div>
         <ul class="shelf">${items.map(card).join('')}</ul>
         <p class="shelf-status" aria-live="polite">展示 ${Math.min(allItems.length, SHELF_SHOW)} 件 · 完整馆藏见下方入口</p>
         <div class="shelf-foot">${foot}</div>
         <div class="museum-more">${ic('book', 'sm')}<a data-museum-more href="museum/index.html">查看全部馆藏 · 可分类翻页</a>${ic('crystal', 'sm')}</div>
       </section>`
    : `<section class="museum-zone douban-zone">
         <h3 class="museum-zone-title">${ic('book', 'sm')}收藏展览<a class="douban-mark-link" href="https://www.douban.com/people/${md.esc(String(src.uid || '211628276'))}/" target="_blank" rel="noopener">去豆瓣打标</a></h3>
         <div class="shelf-bar">${tabs}</div>
         <ul class="shelf">${blank(8)}</ul>
         <div class="shelf-foot">${ic('book', 'sm')}${slot('meta', '120px', '9px')}${ic('star', 'sm')}</div>
       </section>`;

  return panel('博物馆', ['book', 'gem', 'crystal', 'star', 'gift'], inner + DC.shelf(), 'museum');
};

const moneyPanel = () => panel('收获簿', ['basket', 'wheat', 'flower', 'book', 'star'], FARM.harvest(FARM.load()) + DC.shelf(), 'ledger');

// ---------- 页脚 ----------
const footer = () => `
<footer class="farm">
  <div class="fgrass"></div>
  <div class="fsoil"></div>
  <div class="frow">
    ${['tree', 'mushroom', 'chicken', 'strawberry', 'sunflower', 'cow', 'beehive',
    'pumpkin', 'scarecrow', 'junimo', 'bee', 'butterfly', 'acorn', 'crystal',
    'grass', 'creeper', 'diamond', 'tnt', 'torch']
      .map((n, i) => `<span style="animation-delay:${(i * 0.19).toFixed(2)}s">${ic(n, 'lg')}</span>`).join('')}
  </div>
  ${vine('rainbow')}
  <div class="fcopy">
    ${ic('heart', 'sm')}<span class="slot meta" style="width:200px;height:10px"></span>${ic('heart', 'sm')}
  </div>
</footer>`;

// ---------- 网站底部：访问量 + 评论区 ----------
// 柯西 2026-09-16 要求「在网站底部做一个访问量统计，以及底部评论区」。
// 评论区**复用 posts.js 里那份渲染逻辑**（它是唯一来源，别再抄一份）——
// 两处各写一遍的话，以后换评论服务就会漏改一处，而且很难发现。
//
// 首页的评论帖用 `mapping:'specific'` + 固定 term 开一个独立帖：
// 首页路径是 `/`，跟文章页本来也不撞；但首页的**文件名会变**
// （stardew-maximal-v3.html → index.html），按路径映射会让评论跟着搬家。
const bottom = () => require('./subpage.js').bottomBlock(
  require('./posts.js').commentsBlock(null, {
    id: 'comments-home',
    title: '留言板',
    mapping: 'specific',
    term: 'home'
  })
);

const HTML = `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${md.esc(SITE.name)} · 个人主页</title>
<link rel="stylesheet" href="assets-layers.css">
<!-- 像素字体的 @font-face 在根目录的 font.css 里，不在下面的内联样式块 ——
     原因见该文件开头的注释（CSS 的 url() 相对 CSS 文件解析，文章页在子目录会 404）。
     2026-09-15 夜之前它一直是注释状态，等于整站在用 Courier New 回退。 -->
<link rel="stylesheet" href="font.css">
<style>
/* ===== 字体（说明位，真正的接入在根目录 font.css） =====
   Fusion Pixel Font 12px proportional zh_hans，OFL-1.1，可子集化。
   不用 Zpix：授权禁止转换格式与子集化，只能整包挂 ttf（2 万+ 字）。 */
:root{
  --ink:#3B2412; --ink-2:#5C3A21;
  --cream:#FFF8E7; --cream-2:#F2E4C4; --cream-3:#E4D0A4;
  --gold:#FFD23F; --gold-2:#FFB700; --gold-3:#C98A00;
  --pix:'FusionPixel','Zpix','Silkscreen',"Courier New",ui-monospace,monospace;
  /* ===== 语义化文字色（柯西 2026-09-20「设计多一点文字颜色」）=====
     以前全文一种棕（--ink），链接、标签、注释、数字全是一个色，页面没有层次。
     现在按"角色"拆色；春/夏/秋/冬在下面的四季块里各换一套（春粉、夏蓝、
     秋赭、冬青），夜晚在 night 块里整组翻浅。
     ⚠️ 白天这一组全是深色（奶油底上对比度 ≥4.5，check-colors.js 会量）；
     ⚠️ 加新角色时四季 + 夜晚五处都要补，漏了不会报错，只会悄悄用 :root 的值；
     ⚠️ --tx-link-line 是下划线装饰色，不参与正文对比度，可以浅一档。 */
  --tx:var(--ink);         /* 正文 */
  --tx-2:var(--ink-2);     /* 次要说明 */
  --tx-3:#7A6248;          /* 弱化：日期 / 来源 / 注释 */
  --tx-link:#1F6FA8;       /* 链接 */
  --tx-link-line:#7EC8F0;  /* 链接下划线 */
  --tx-em:#9A5E14;         /* 强调：数字 / 关键词 */
  --tx-tag:#3E7A44;        /* 标签 */
  --tx-quote:#6B5A8C;      /* 引用 */
  --tx-code:#A0522D;       /* 行内代码 */
  --tx-num:#C1472F;        /* 计数 / 数字 */
  /* ===== 间距刻度（2026-09-21 立）=====
     这站最细的网格是 2px（2px 边框 / 2px 像素阴影 / steps(2) 步进 / 16px 图标），
     所以规矩分两层：
       · 布局级（面板、卡片、木牌、工具栏、页脚、栅格、导航）→ **4 的倍数**，用下面这几档；
       · 组件内部（标签、按钮内边距、图标旁微调）→ 2 的倍数即可，允许刻意的 3px。
     以前 134 处间距声明里 112 处是奇数（3/5/7/9/11/13），木牌边缘落在半像素上会发虚。
     ⚠️ 纯几何量，**四季块和 night 块里不要覆盖**；改这些值要同步跑 build/check-spacing.js。 */
  --s1:4px;  --s2:8px;  --s3:12px; --s4:16px; --s5:20px;
  --s6:24px; --s7:28px; --s8:32px; --s9:48px;   /* --s9 留给区块级大间距，暂时备用 */
}
/* ===== 四季色板（高饱和，取法参考 theperiperi 的马里奥原色策略） ===== */
html[data-season="spring"]{
  --sky-a:#7FD8F5; --sky-b:#AEEAF7; --sky-c:#E4F6E8;
  --hill-far:#8FCB6B; --hill-near:#5AAE46;
  --tree-a:#2E7D4F; --forest-a:#3E9B57; --forest-b:#63C74D; --forest-c:#3E8948;
  --grass-a:#63C74D; --grass-b:#3E8948; --grass-c:#2A6B33;
  --wood-a:#D89A5C; --wood-b:#A9682F; --wood-c:#6E421C;
  --accent:#FF9EC4; --accent-2:#FF6FA5;
  /* 春：樱粉强调 + 叶绿链接 */
  --tx-link:#2E7D4F; --tx-link-line:#8FCB6B;
  --tx-em:#B03A72; --tx-tag:#2E7D4F; --tx-quote:#7A5CA8;
  --tx-code:#B3541E; --tx-num:#C1472F; --tx-3:#7A6248;
}
html[data-season="summer"]{
  --sky-a:#3FC1F0; --sky-b:#8FE6F5; --sky-c:#CFF3E4;
  --hill-far:#A8D96A; --hill-near:#6BBF4A;
  --tree-a:#1F7A3D; --forest-a:#43A64C; --forest-b:#7FD858; --forest-c:#4CAF50;
  --grass-a:#7FD858; --grass-b:#4CAF50; --grass-c:#2E7D32;
  --wood-a:#E0A868; --wood-b:#B0722F; --wood-c:#75491C;
  --accent:#FFD54A; --accent-2:#FFA726;
  /* 夏：深海蓝链接 + 焦橙强调 */
  --tx-link:#155E96; --tx-link-line:#7EC8F0;
  --tx-em:#B04A0E; --tx-tag:#35703C; --tx-quote:#4A6A8C;
  --tx-code:#A0522D; --tx-num:#C1472F; --tx-3:#7A6248;
}
html[data-season="autumn"]{
  --sky-a:#FFC046; --sky-b:#FFDD8A; --sky-c:#FFEFC6;
  --hill-far:#E0913A; --hill-near:#C46A22;
  --tree-a:#8C3B12; --forest-a:#C97B2B; --forest-b:#E8A33D; --forest-c:#B3541E;
  --grass-a:#E8A33D; --grass-b:#C97B2B; --grass-c:#8B4513;
  --wood-a:#C98A4B; --wood-b:#9C5C29; --wood-c:#633A16;
  --accent:#E8522F; --accent-2:#B3301C;
  /* 秋：赭石链接 + 南瓜深色强调 */
  --tx-link:#A0522D; --tx-link-line:#E8A33D;
  --tx-em:#8C3B12; --tx-tag:#8C6B12; --tx-quote:#6B4A6B;
  --tx-code:#8B4513; --tx-num:#B3301C; --tx-3:#7A6248;
}
html[data-season="winter"]{
  --sky-a:#9FC9DE; --sky-b:#CFE7F2; --sky-c:#EDF7FB;
  --hill-far:#C4DCE5; --hill-near:#9DBECB;
  --tree-a:#5B7E8C; --forest-a:#B8D4DC; --forest-b:#E8F4F8; --forest-c:#9DBECB;
  --grass-a:#E8F4F8; --grass-b:#B8D4DC; --grass-c:#7FA3B0;
  --wood-a:#B4906A; --wood-b:#856A4C; --wood-c:#5A4632;
  --accent:#7EC8F0; --accent-2:#4FA3D1;
  /* 冬：冰蓝链接 + 石板灰强调 */
  --tx-link:#3B6E8F; --tx-link-line:#9DBECB;
  --tx-em:#4A5A68; --tx-tag:#4A6B7A; --tx-quote:#5A6B8C;
  --tx-code:#5A6B78; --tx-num:#B3301C; --tx-3:#67676F;
}
/* ===== 夜间：只改天空/地面/木色，结构不变 ===== */
html[data-time="night"]{
  --sky-a:#141F3A; --sky-b:#22345A; --sky-c:#3A5183;
  --hill-far:#22352B; --hill-near:#16241B;
  --tree-a:#122A1C; --forest-a:#1B3A26; --forest-b:#2A5233; --forest-c:#16301F;
  --grass-a:#2E5C34; --grass-b:#1E3F24; --grass-c:#14291A;
  --wood-a:#7A5230; --wood-b:#553A20; --wood-c:#392612;
  --cream:#3B2F4A; --cream-2:#332840; --cream-3:#2A2036;
  --ink:#F0E6D2; --ink-2:#C9B896;
  /* 夜晚整组文字色翻浅。⚠️ 基准面对比色是夜 --cream（#3B2F4A，
     这是夜里最亮的一面底色；--tx-link-line 是装饰下划线，不参与对比度。
     check-colors.js 会逐个量，低于 4.5 就红。 */
  --tx-3:#B3A48D;
  --tx-link:#9FD9F5; --tx-link-line:#5B8DD9;
  --tx-em:#FFD54A; --tx-tag:#9FD98F; --tx-quote:#C9B3E8;
  --tx-code:#F0A890; --tx-num:#FF9E8F;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; font-family:var(--pix); color:var(--ink);
  /* ⚠️ font-size 必须显式写在 body 上。以前这里是裸的，所有没单独设字号的
     元素全部落到浏览器默认 16px —— 而这只字体的设计尺寸是 12px，
     16px = 把 12px 字形放大 1.333 倍（非整数倍），实测颜色种数从 5 飙到 18，
     边缘全是半透明过渡，像素感糊掉。这就是「字体不是很好」的根源。
     12 的整数倍（12/24/36…）才是干净的：24px 实测只有 3 种颜色，
     每个设计像素正好占 2 屏幕像素，零插值。
     探针实测：补上这一行，主页非 12 倍数的元素从 41 种降到 1 种。 */
  font-size:12px;
  /* 天空只占顶部；地面交给 .ground 里的分层地形，不再用一条渐变糊到底 */
  background:linear-gradient(180deg,var(--sky-a) 0%,var(--sky-b) 42%,var(--sky-c) 100%);
  background-attachment:fixed; min-height:100vh; overflow-x:hidden;
  transition:background .8s ease, color .8s ease;
  cursor:url("${CUR_A}") 0 0, auto;
}
/* 可点处用另一支箭头（CUR_B = 箭头 + 高亮描边，见文件顶部）。
   ⚠️ 历史教训：这里曾经让普通态和可点态**共用同一张图**，理由是
   "真正提示可点的是 pointer 兜底关键字"—— 那句话是错的。url() 一旦
   加载成功，兜底关键字 pointer 根本不参与渲染，用户看到的两地完全一样，
   划上去毫无反馈。柯西 2026-09-20 反馈"鼠标有点问题"就是指这个。
   ⚠️ 热点必须跟上面那条一样是 0 0（箭头尖），否则划过可点区域时
   指针会突然"跳"一下。
   ⚠️ 选择器要列全：.soc / summary / .copy-code 这些**必须在这里出现**，
   否则它们各自规则里的 cursor:pointer（特异性更高）会把像素光标顶掉，
   那几处就又变回系统箭头了 —— 本站踩过这个坑。 */
button,a,.fr,.tag,.tool,.cbtn,.soc,summary,.copy-code,.tl-card,.rcard,.gal-card,
.sbtn,.share-btn,.music-seek{cursor:url("${CUR_B}") 0 0, pointer}

/* ===== 背景层：天空 / 云 / 星星 / 三层地形 / 地表作物 / 萤火虫 ===== */
.bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
#stars{position:absolute;inset:0;opacity:0;transition:opacity .8s}
html[data-time="night"] #stars{opacity:1}
#stars i{position:absolute;background:#FFF8E7;border-radius:0;animation:tw 2.4s steps(2) infinite}
@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
#clouds i{position:absolute;display:block;animation:drift linear infinite}
@keyframes drift{from{transform:translateX(-22vw)}to{transform:translateX(118vw)}}

/* 太阳：只靠视差层是不够的 —— .bg 的子元素会被滚动 transform 扫走，
   所以太阳固定在右上角，昼出夜隐，夜里交给 bg 里的月亮 */
#sun{position:absolute;top:7vh;right:11vw;width:120px;height:120px;
  image-rendering:pixelated;transform-origin:center;
  transition:opacity .9s ease,transform .9s ease;animation:sun-breathe 5.5s ease-in-out infinite}
html[data-time="night"] #sun{opacity:0;transform:translateY(34px) scale(.82)}
#sun::before{content:'';position:absolute;inset:-34px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,238,150,.5) 0%,rgba(255,214,90,.22) 42%,transparent 68%);
  animation:sun-glow 4s ease-in-out infinite}
#sun svg{position:absolute;inset:0;width:100%;height:100%;animation:sun-spin 90s linear infinite}
@keyframes sun-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes sun-breathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.14)}}
@keyframes sun-glow{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.12);opacity:1}}
.hill{position:absolute;left:-5%;width:110%;pointer-events:none}
.hill.far{bottom:0;height:26vh;background:var(--hill-far);
  clip-path:polygon(0 42%,8% 22%,16% 38%,25% 14%,34% 34%,44% 18%,54% 36%,64% 20%,74% 38%,84% 24%,92% 40%,100% 26%,100% 100%,0 100%);
  filter:brightness(.92)}
.hill.near{bottom:0;height:16vh;background:var(--hill-near);
  clip-path:polygon(0 60%,10% 34%,20% 54%,30% 30%,40% 52%,52% 28%,64% 50%,76% 32%,88% 56%,100% 38%,100% 100%,0 100%)}

/* 地面：零图片，全部用 repeating-linear-gradient 拼出像素地形纹理 */
.ground{position:absolute;left:0;right:0;bottom:0;height:44vh}
.g-layer{position:absolute;left:0;right:0}
.g-hedge{top:0;height:13vh;background:var(--tree-a);
  clip-path:polygon(0 58%,3% 26%,7% 48%,11% 12%,15% 42%,19% 5%,23% 38%,27% 16%,31% 46%,35% 8%,39% 40%,43% 20%,47% 50%,51% 10%,55% 36%,59% 22%,63% 48%,67% 6%,71% 44%,75% 18%,79% 40%,83% 14%,87% 46%,91% 24%,95% 44%,100% 20%,100% 100%,0 100%)}
.g-far{top:13vh;height:13vh;background:var(--forest-a)}
.g-far::before{content:'';position:absolute;inset:0;
  background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.14) 0 2px,transparent 2px 4px)}
.g-mid{top:26vh;height:9vh;background:var(--forest-b);
  clip-path:polygon(0 0,100% 0,100% 62%,0 82%)}
.g-mid::before{content:'';position:absolute;inset:0;
  background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.2) 0 3px,transparent 3px 6px)}
.g-near{top:35vh;height:9vh;background:var(--forest-c);
  clip-path:polygon(0 58%,100% 30%,100% 100%,0 100%)}
.g-near::before{content:'';position:absolute;inset:0;
  background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.1) 0 3px,transparent 3px 10px)}

/* 地表长出来的东西：草簇 / 花 / 蘑菇 / 小石头，由 JS 随机撒 */
#flora{position:absolute;left:0;right:0;bottom:0;height:44vh}
#flora span{position:absolute;transform-origin:bottom center;animation:grow-sway 3.6s ease-in-out infinite}
@keyframes grow-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
#flora span.rock{animation:none}

/* 地面动物：小鸡 / 奶牛 / 兔子，贴着草线来回走；越靠下越大，撑出纵深。
   镜像放在内层 span 上，避免和 translate 共用一个 transform 把坐标系翻掉。
   影子宽度用 em 跟着字号走，尺寸改了不用逐个调。 */
#animals{position:absolute;left:0;right:0;bottom:0;height:48vh}
#animals .ani{position:absolute;width:0;height:0;
  animation-name:ani-walk;animation-timing-function:linear;animation-iteration-count:infinite}
#animals .ani .bd{display:block;transform-origin:center bottom}
#animals .ani .bd::before{content:'';position:absolute;left:50%;bottom:-3px;width:.36em;height:.09em;
  margin-left:-.18em;background:rgba(31,58,26,.3)}
#animals .ani.flip .bd{transform:scaleX(-1)}
#animals .ani .bd svg{width:100%;height:100%;display:block;image-rendering:pixelated;transform-origin:center bottom}
#animals .ani.go .bd svg{animation:ani-hop .34s steps(2) infinite}
@keyframes ani-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes ani-walk{from{transform:translateX(-8vw)}to{transform:translateX(108vw)}}

#fireflies{position:absolute;inset:0;opacity:0;transition:opacity 1s}
html[data-time="night"] #fireflies{opacity:1}
#fireflies i{position:absolute;width:4px;height:4px;background:#FFF6A0;
  box-shadow:0 0 6px 3px rgba(255,240,120,.55);animation:ff 5s ease-in-out infinite}
@keyframes ff{0%,100%{transform:translate(0,0);opacity:.2}25%{transform:translate(14px,-18px);opacity:1}
  50%{transform:translate(-10px,-30px);opacity:.5}75%{transform:translate(16px,-12px);opacity:.9}}

/* ===== 图标 ===== */
svg.ic{width:16px;height:16px;display:block;image-rendering:pixelated;flex:none}
svg.ic.sm{width:12px;height:12px} svg.ic.xs{width:9px;height:9px} svg.ic.lg{width:30px;height:30px}

/* ===== 内容槽 ===== */
.slot{display:inline-block;vertical-align:middle;
  background:repeating-linear-gradient(45deg,var(--sb) 0 5px,var(--sl) 5px 10px);border:2px solid var(--sbd)}
.slot.cover{--sb:#9FD3EE;--sl:#D3ECF8;--sbd:#4A86AD}
.slot.title{--sb:#BCE0A8;--sl:#E2F1D8;--sbd:#5C8C4A}
.slot.meta {--sb:#F5DC9A;--sl:#FAECCE;--sbd:#A87A2C}
.slot.body {--sb:#D8CFC0;--sl:#EAE3D8;--sbd:#7C6E58}

.wrap{max-width:1180px;margin:0 auto;padding:0 16px 40px;position:relative;z-index:2}

/* ===== 控制条 ===== */
/* 右上角。窄视口下它会压到招牌上（本身是 fixed 悬浮层，设计如此），
   但招牌上的平台导航正好在右侧，会被盖住，所以窄屏把它收到一行内。 */
.controls{position:fixed;top:12px;right:12px;z-index:60;display:flex;gap:8px;align-items:flex-start}
@media (max-width:900px){
  .controls{gap:5px;top:8px;right:8px}
  
  
  
  
}
.crow{display:flex;gap:5px;background:var(--cream);border:3px solid var(--ink);
  box-shadow:0 0 0 3px var(--wood-c);padding:5px}
.cbtn{display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--cream-2);
  border:2px solid var(--wood-c);padding:5px 8px;font-family:inherit;color:inherit;
  /* ⚠️ 必须显式给 .cbtn 写 font-size：<button> 的 UA 默认样式是 13.3333px，
     只给里面的 em 写 12px 管不住按钮本身。13.3333 实测是全场最糊的一档
     （36 种颜色）。 */
  font-size:12px;
  /* min-width：昼夜按钮只有一个图标 +「昼」字（列排），实测只有 12px 宽 ——
     手指点不中。32px 也让它跟旁边带文字的四季按钮对齐（2026-09-21）。 */
  min-width:32px;
  transition:transform .1s steps(2),background .15s}
.cbtn:hover{background:var(--gold);transform:translateY(-2px)}
.cbtn.on{background:var(--accent);box-shadow:inset 0 0 0 2px var(--ink)}
.cbtn em{font-style:normal;font-size:12px}
.cbtn.bgmode{flex-direction:row;gap:4px;padding:5px 7px}
.daynight{background:var(--cream);border:3px solid var(--ink);box-shadow:0 0 0 3px var(--wood-c)}

/* ===== 彩旗 / 挂果 ===== */
/* 彩旗用的是 border 画三角：border-top 22px + 左右各 12px，元素自身 0×0。
   0 宽的元素在浏览器里会被当成「没有尺寸」，刷新时偶发不重绘 ——
   在无头截图里表现为一条白色横条，正好压住招牌（排查了很久）。
   给它一个真实的盒模型就没这毛病了。 */
.bunting{display:flex;justify-content:center;margin:0 -10px;padding-top:8px;min-height:22px;align-items:flex-start}
.bunting i{width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;
  border-top:22px solid var(--c);filter:drop-shadow(0 2px 0 rgba(59,36,18,.4));
  transform-origin:top center;animation:sway 3.2s ease-in-out infinite}
/* 窄屏把旗子收到 16 面：26 面全摆是 624px，390px 的手机上会向右撑出
   ~66px 的隐形横向溢出（页面看着正常，body 又把它藏了 —— 2026-09-18 实测）。
   16 面 = 384px，最窄的手机也放得下；680px 以上 26 面本来就没问题。 */
@media (max-width:680px){
  .bunting i:nth-child(n+17){display:none}
}
@media (prefers-reduced-motion:reduce){.bunting i,.hang span{animation:none}}
@keyframes sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
.hang{display:flex;justify-content:center;gap:24px;margin:-2px 0 4px}
.hang span{transform-origin:top center;animation:sway2 4s ease-in-out infinite;
  filter:drop-shadow(0 2px 0 rgba(59,36,18,.35))}
@keyframes sway2{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}

/* ===== 站名牌 ===== */
.board{position:relative;margin:8px auto 0;max-width:600px;text-align:center;
  /* 木板横向接缝：每 22px 一条极淡的缝，让木纹不是一整块贴纸 */
  background-color:var(--wood-b);
  background-image:
    repeating-linear-gradient(180deg,rgba(0,0,0,.07) 0 2px,transparent 2px 22px),
    linear-gradient(180deg,var(--wood-a) 0%,var(--wood-b) 58%,var(--wood-c) 100%);
  border:6px solid var(--ink);
  box-shadow:0 0 0 4px var(--wood-c),0 12px 0 -2px rgba(59,36,18,.4),inset 0 5px 0 rgba(255,255,255,.22);
  padding:28px 24px 24px;transition:background-color .8s}
.board::after{content:'';position:absolute;inset:5px;border:2px solid var(--wood-a);pointer-events:none;opacity:.7}
.tag{position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:var(--ink);
  color:var(--gold);border:2px solid var(--wood-c);padding:3px 16px;font-size:12px;letter-spacing:2px;white-space:nowrap}
.board .bn{display:flex;justify-content:center;align-items:center;gap:12px;margin:8px 0 12px}
/* 站名是 <h1>：浏览器会给它默认 2em 字号和上下外边距，不摁平就会把招牌撑高。
   ⚠️ 摁完必须落在 12px —— 16px 不是 12 的整数倍，像素字体在 16px 下横向会糊，
   check-layout 的那条「字号均为 12 的倍数」就是守这个的（本站写的第五条注释）。 */
.board h1.bn{font:inherit;font-size:12px}
/* 招牌文案一层：只有站名。层级靠字号和阴影，不靠副标题堆叠 */
.board .bt{font-size:24px;font-weight:700;color:#FFF8E7;letter-spacing:1px;
  text-shadow:2px 2px 0 var(--ink),0 0 12px rgba(255,233,168,.35);white-space:nowrap}
/* ⚠️ 全站面板不写副标题是柯西定的规矩（2026-09-15）—— 但这条不是副标题，
   它回答的是访客进站的第一个问题「这是谁」。缺了它，桌面首屏只有项目卡片、
   手机首屏更是全是门面按钮（390px 下内容掉到第二屏），等于把自我介绍藏起来了。
   做成「钉在木牌下的小纸条」，不用旋转不用动效，跟剩下那套像素一套语言。 */
.board .who{margin:0 0 8px;display:inline-block;background:var(--cream);color:var(--ink);
  border:2px solid var(--ink);box-shadow:3px 3px 0 rgba(43,29,14,.42);
  padding:4px 12px;font-size:12px;letter-spacing:.6px}

/* 平台导航：一排木质小牌，图标是 16×16 像素画 */
.social{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:2px}
.soc{display:flex;flex-direction:column;align-items:center;gap:3px;text-decoration:none;
  background:rgba(43,29,14,.22);border:2px solid rgba(43,29,14,.55);
  padding:5px 9px 4px;color:#FFF8E7;
  transition:transform .1s steps(2),background .15s,border-color .15s}
.soc .pico{width:20px;height:20px;display:block;image-rendering:pixelated}
.soc em{font-style:normal;font-size:12px;letter-spacing:.5px;opacity:.92}
a.soc:hover,a.soc:focus-visible{background:var(--gold);border-color:var(--ink);color:var(--ink);
  transform:translateY(-3px)}
a.soc:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
a.soc:active{transform:translateY(0)}
/* 可复制的（邮箱 / 微信）：本质是 <button>，得把浏览器默认样式全部抹掉，
   否则会出现系统灰底和默认字体，跟旁边两枚木牌不是一套皮。 */
button.soc{font:inherit}
button.soc .soc-in{display:flex;flex-direction:column;align-items:center;gap:3px}
button.soc:hover,button.soc:focus-visible{background:var(--gold);border-color:var(--ink);color:var(--ink);
  transform:translateY(-3px)}
button.soc:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
button.soc:active{transform:translateY(0)}
/* 账号未填的先显示成不可点状态，明显区别于可点的 */
.soc.todo{opacity:.45;filter:grayscale(.7);cursor:not-allowed}
/* 招牌底部的「号码提示条」：点邮箱/微信后就地弹出来，不用跳转。
   固定贴在地图上方居中，不参与布局（避免把招牌顶高，触发布局检查）。 */
.contact-tip{position:fixed;left:50%;bottom:66px;transform:translateX(-50%) translateY(8px);
  z-index:400;display:flex;align-items:center;gap:8px;
  background:var(--cream);color:var(--ink);border:3px solid var(--ink);
  box-shadow:5px 5px 0 rgba(43,29,14,.35);padding:9px 12px;
  font-size:12px;letter-spacing:.4px;white-space:nowrap;
  opacity:0;pointer-events:none;transition:opacity .14s,transform .14s}
.contact-tip.on{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.contact-tip b{font-size:12px;font-weight:700;letter-spacing:.6px;
  background:var(--cream-2);border:2px solid var(--ink);padding:3px 7px;user-select:all}
.contact-tip span{opacity:.8}
@media (max-width:640px){.contact-tip{font-size:12px;bottom:22px;max-width:calc(100vw - 24px)}}

.board .deco{position:absolute;left:12px;right:12px;bottom:-16px;display:flex;justify-content:space-between}
.board .deco span{display:flex;gap:4px}

/* ===== 工具栏 ===== */
.toolbar{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:28px 0 20px}
.tool{display:flex;flex-direction:column;align-items:center;gap:3px;background:var(--cream);
  border:3px solid var(--ink);box-shadow:0 0 0 3px var(--wood-c),0 4px 0 0 var(--wood-c);
  padding:8px 11px 6px;font-family:inherit;color:inherit;text-decoration:none;
  transition:transform .1s steps(2),background .15s,box-shadow .1s}
.tool:hover,.tool:focus-visible{background:var(--gold);transform:translateY(-3px);
  box-shadow:0 0 0 3px var(--wood-c),0 7px 0 0 var(--wood-c)}
.tool:active{transform:translateY(1px);box-shadow:0 0 0 3px var(--wood-c),0 1px 0 0 var(--wood-c)}
.tool:focus-visible{outline:3px solid var(--ink);outline-offset:3px}

/* 键盘焦点：全局兜底（2026-09-21）。
   此前只有 6 条选择器写了品牌化焦点样式（社交图标 / 工具按钮 / 宠物 / 音乐），
   其余 15 个类名的可点元素 —— 时间线卡片、项目卡、相馆图、配色按钮、返回农场、
   筛选标签、日历季节按钮 —— 只能吃浏览器默认的蓝框：跟木色像素边框不搭，
   而且在深浅两种底色上不一定看得清。
   用 var(--ink)：四季与夜里都定义过，且始终与所在那层底色成对比（check-colors 守着）。
   ⚠️ 放在这里只是便于集中阅读，CSS 顺序不影响结果 —— 具体选择器（如 .tool:focus-visible）
   优先级更高，会赢过这条兜底。 */
:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.tool em{font-style:normal;font-size:12px;opacity:.8}
/* 工具栏里的按钮（「邮箱」）：得把浏览器默认按钮样式抹掉才会跟旁边的 <a> 长得一样 */
button.tool{font:inherit;background:var(--cream);appearance:none}
button.tool::-moz-focus-inner{border:0}

/* 导航落点：面板本身有 4px 边框 + 外发光，直接滚到顶会被顶部切掉一截 */
#timeline,#projects,#gallery,#calendar,#skills,#ledger,#farm,#friends{scroll-margin-top:24px}
/* 全局滚动条也像素化（2026-09-22，对标 pixel-portfolio 的 16px 木轨条）。
   此前只有 .shelf 有，页面主滚动条是系统默认灰条，跟木色界面脱节。
   ⚠️ .shelf::-webkit-scrollbar{height:8px} 特异性更高，不受影响。 */
html{scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:var(--wood-b) var(--cream-3)}
::-webkit-scrollbar{width:16px;height:16px}
::-webkit-scrollbar-track{background:var(--cream-3)}
::-webkit-scrollbar-thumb{background:var(--wood-b);border:3px solid var(--ink)}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

/* ===== 面板 ===== */
.layout{display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start}
/* ⚠️ min-width:0 不能省。grid 的 1fr 隐含 min-width:auto = 内容的 min-content 宽度，
   一遇到「横向滚动的一排卡片」这种超宽内容就会把整列撑开：
   实测博物馆加进来后主栏被撑到 4142px，面板里居中排的东西全跑到视口外
   （表现是「找不到」某个元素，其实它在 x=1993 的地方好好待着）。
   给两栏都上 min-width:0，滚动才真正发生在 .shelf 内部。 */
.layout > main,.layout > aside{min-width:0}
/* 2026-09-19「越看越有的看」：给奶油底加一层每 4px 一条的极淡横纹。
   凑近才看得出的横纹。目的是让大面积纯色不再是死板一块，
   但又不让人意识到「这里有纹理」—— 一旦被看出来，它就是噪声不是质感了。 */
.panel{position:relative;background-color:var(--cream);
  background-image:repeating-linear-gradient(180deg,rgba(59,36,18,.03) 0 2px,transparent 2px 4px);
  border:4px solid var(--ink);
  box-shadow:0 0 0 4px var(--wood-c),9px 9px 0 0 rgba(59,36,18,.28);
  padding:28px 20px 20px;margin-bottom:32px;transform:rotate(0);transition:background-color .8s}
/* 挂钉：面板顶沿左右各一颗小铜钉，坐实「钉在墙上」而不是浮在空气里 */
.panel::after{content:'';position:absolute;top:-5px;left:0;right:0;height:6px;pointer-events:none;
  background:
    radial-gradient(circle at 26px 3px, var(--gold) 0 3px, transparent 3px),
    radial-gradient(circle at calc(100% - 26px) 3px, var(--gold) 0 3px, transparent 3px)}
.panel::before{content:'';position:absolute;inset:4px;border:2px solid var(--cream-3);pointer-events:none}
/* 标题牌：从一块纯黑升级成「深色木牌 + 两端铆钉 + 下沿内阴影」。
   不是为了花哨，是为了让它跟外层木框、四角饰件是同一套木材。 */
.pt{position:absolute;top:-16px;left:18px;
  /* ⚠️ 渐变中间那档以前写的是 var(--ink) —— 白天没问题（--ink 本来就是深棕），
     但夜晚 --ink 会翻成 #F0E6D2（近白），木牌中间出现一条白带，上面的金色
     标题文字直接看不见。所以这里钉死深色，不随昼夜变。 */
  background:linear-gradient(180deg,#3B2412 0%,#241708 55%,#1A1108 100%);
  color:var(--gold);
  border:2px solid var(--wood-c);padding:4px 12px;font-size:12px;letter-spacing:1px;
  display:flex;align-items:center;gap:8px;
  box-shadow:inset 0 -2px 0 rgba(0,0,0,.45),2px 2px 0 rgba(43,29,14,.32);
  /* ⚠️ 这里千万不能写 font:inherit 简写（注意别在注释里打反引号，
     这段 CSS 活在一个 JS 模板字符串里，一个反引号就能把整段字符串提前收掉）——
     font 简写会连 font-size 一起重置，把上面写的 12px 顶回 16px，
     check-layout 直接红、像素字号就破了。只能单点覆盖：
     font-family 跟父级走，font-weight 保持加粗。 */
  margin:0;font-family:inherit;font-weight:700;line-height:inherit}
.pt::before,.pt::after{content:'';position:absolute;top:50%;width:3px;height:3px;
  background:var(--wood-c);transform:translateY(-50%);opacity:.9}
.pt::before{left:3px}.pt::after{right:3px}
.cor{position:absolute;z-index:2;opacity:.85}
.cor.tl{top:5px;left:6px}.cor.tr{top:5px;right:6px}.cor.bl{bottom:5px;left:6px}.cor.br{bottom:5px;right:6px}

/* ===== 分隔藤蔓 ===== */
/* 标签牌（.tag）：招牌顶上那块「个人博客」还在用；原 featured 的 .tagrow 已随面板一起删 */
.tag{display:flex;align-items:center;gap:4px;background:var(--cream-2);border:2px solid var(--wood-c);padding:3px 7px}
.vine{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 4px 13px}
.vine::before,.vine::after{content:'';flex:1;height:6px;
  background:repeating-linear-gradient(90deg,var(--wood-c) 0 4px,transparent 4px 8px)}
.vine .flip{display:flex;transform:scaleX(-1)}

/* ===== 时间线 ===== */
/* 一条竖轴：左列时间戳、中间轴与圆点、右边卡片。
   轴用绝对定位贯穿整列，圆点骑在轴上 —— 这样条目高度不一致也不会断轴。

   ⚠️ 轴是**真实元素**（.tl-line），不是 ::before。理由很实际：
   伪元素量不到几何，只能靠截图用眼睛判断，而这个位置前后算错过三次
   （83 → 62 → 77 → 83）。真元素能被 build/check-timeline.js 直接量出
   「轴心 vs 圆点中心」的偏差并断言，不再靠眼睛。

   正确值不是推的，是**量出来的**：桌面下 .tlwrap 左边界 x=44、
   圆点中心 x=129 → 圆点中心落在 .tlwrap 内 85px 处；轴宽 4px，
   所以 left = 85 - 2 = 83px（正好等于网格算术值 64 + 10 + 22/2）。

   顺带一条教训：上一版把它改成 62px，是因为在**截图缩略图**上把
   圆点坐标读成了 130（真值 136），于是"量出"偏了。截图上的数字不能当数据用，
   要数字就用 probe-dom.js / check-timeline.js 从 DOM 里读。

   虚线的实段长度要 ≥ 圆点直径（22px），否则会被圆点挡掉大半，
   看上去只剩零星几截；颜色也要用 ink 而不是木色 ——
   浅奶油底上木色几乎和底色同色。 */
.tlwrap{position:relative}
.tl{list-style:none;margin:0;padding:0}
.tl-line{position:absolute;left:83px;top:6px;bottom:6px;width:4px;
  background:repeating-linear-gradient(180deg,var(--ink) 0 13px,transparent 13px 22px);
  opacity:.45}
.tl-item{display:grid;grid-template-columns:64px 22px minmax(0,1fr);gap:10px;
  align-items:start;padding:0 0 11px}
.tl-item:last-child{padding-bottom:0}
.tl-when{display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding-top:9px}
/* ⚠️ 下面这两个字号必须显式写死。
   原来是占位槽（.slot 自带 12px/9px 的尺寸），换成真实文字之后如果不写 font-size，
   文字会继承到根默认的 16px —— 日期比文章标题还大（2026-09-15 换真数据时暴露的）。
   同一条规则适用于 .tl-tag 和 .more a：凡是"从占位槽换成真文字"的地方都要补字号。 */
.tl-when b{display:block;font-size:12px;line-height:1.35;color:var(--tx-em)}
.tl-when i{font-style:normal;color:var(--tx-3);display:block;font-size:12px;line-height:1.4}
.tl-axis{display:flex;justify-content:center;padding-top:8px;position:relative;z-index:1}
.tl-dot{display:flex;align-items:center;justify-content:center;width:22px;height:22px;
  background:var(--cream);border:3px solid var(--wood-c);
  box-shadow:0 0 0 2px var(--cream)}
.tl-card{display:grid;grid-template-columns:56px minmax(0,1fr);gap:10px;align-items:start;
  background:var(--cream-2);border:2px solid var(--wood-c);padding:8px 10px;
  text-decoration:none;color:inherit;
  transition:transform .12s steps(2),background .12s}
/* 没有封面的文章：**不要留一个空槽**（柯西 2026-09-17 明确要求）。
   ⚠️ 这里必须显式改列定义，不能只把封面元素删掉 —— 上面是显式两列，
   少了第一个元素的话 .tl-body 会落到 56px 那一列里，标题被挤成竖条。
   （占位槽仍是骨架屏的降级态，见下面 skeleton，那条路不变。） */
.tl-card.nocover{grid-template-columns:minmax(0,1fr)}
.tl-item:hover .tl-card{background:var(--gold);transform:translateX(4px)}
/* 悬停时卡片变金黄，日期（强调色）跟在金底上发糊 —— 此刻翻回正文色 */
.tl-item:hover .tl-when b{color:var(--ink)}
.tl-body{display:flex;flex-direction:column;gap:5px;min-width:0}
/* 真实文章卡的三件套：小封面（可选）、标题、摘要。
   标题和摘要都限两行 —— 时间线上条目高度必须一致，不然轴会被参差的卡片顶歪。 */
.tl-cover{display:block;width:56px;height:78px;background:var(--cream-3);
  border:2px solid var(--ink);overflow:hidden;flex:none}
.tl-cover img{width:100%;height:100%;object-fit:cover;display:block}
.tl-title{font-size:12px;line-height:1.45;overflow:hidden;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tl-exc{margin:0;font-size:12px;line-height:1.62;opacity:.78;overflow:hidden;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tl-tags{display:flex;flex-wrap:wrap;gap:5px}
/* 标签里嵌像素图标（TAG_ICON，见 content.js）—— inline-flex 的间隙别省，
   省了图标就贴字。gap 用 3px：再小看不出，再大标签鼓包。 */
.tl-tag{display:inline-flex;align-items:center;gap:3px;background:var(--cream);
  border:2px solid var(--wood-c);padding:2px 5px;font-size:12px;line-height:1.5;color:var(--tx-tag)}
/* 最新一条稍大：它是「最近发生的」，不是「置顶的」，所以只是放大一档、换个底色 */
.tl-item.lead .tl-card{background:linear-gradient(180deg,#FFF6D6,var(--cream-2));
  border-width:3px;padding:10px 12px}
.tl-item.lead .tl-dot{background:var(--gold)}
.tl-item.lead .tl-title{font-size:24px;line-height:1.4;-webkit-line-clamp:2}
.tl-item.lead .tl-exc{font-size:12px;-webkit-line-clamp:3}
.tl-item.lead .tl-cover{width:64px;height:90px}
/* 窄屏（<1080px）：时间戳列没地方站，display:none 让它整个退出网格，
   剩下 轴 + 卡片 两列正好填满。轴心按上面的公式是 -12px。 */
@media (max-width:1080px){
  .tl-line{left:9px}
  .tl-item{grid-template-columns:22px minmax(0,1fr)}
  .tl-when{display:none}
}
@media (max-width:820px){
  
  .tl-card > .slot.cover,.tl-cover{display:none}
}
.more{display:flex;align-items:center;justify-content:center;gap:8px}
.more a{color:inherit;text-decoration:none;font-size:12px;
  border-bottom:2px solid var(--wood-c);padding-bottom:1px}
.more a:hover{background:var(--gold)}

/* ===== 项目卡 ===== */
/* 工坊固定展示六项：桌面三列两行，中屏两列，手机单列。
   仓库名保留标识符，完整内容选择与手机精简留给下一轮设计。 */
.rgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
/* 友情站网格：友链卡没有语言色点和日期，两列比工坊的三列透气 */
.fgrid{grid-template-columns:repeat(2,minmax(0,1fr))}


.rcard{display:flex;flex-direction:column;gap:5px;padding:9px 10px;text-decoration:none;color:inherit;
  background:var(--cream-2);border:2px solid var(--wood-c);box-shadow:0 3px 0 rgba(59,36,18,.22);
  transition:transform .12s,box-shadow .12s}
.rcard:hover{transform:translateY(-3px);box-shadow:0 6px 0 rgba(59,36,18,.26)}
.rcard.blank{background:var(--cream-3)}
.rc-h{display:flex;align-items:center;gap:5px}
.rc-h b{font-size:12px;letter-spacing:.2px;word-break:break-all}
.rc-d{font-size:12px;line-height:1.45;opacity:.74;margin:0}
.rc-f{display:flex;align-items:center;gap:5px;font-size:12px;opacity:.66;margin-top:auto}
.rc-l{width:9px;height:9px;border-radius:50%;flex:none;border:1px solid rgba(43,29,14,.35)}
.rc-f em{font-style:normal}
.rc-none{opacity:.55}
.rc-t{margin-left:auto;font-variant-numeric:tabular-nums}
.rfoot{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:9px;font-size:12px;opacity:.72}

/* 游戏卡片等宽，封面保留原图比例，不加留边、边框或裁切。 */
.gbar{display:flex;height:16px;border:2px solid var(--wood-c);overflow:hidden;margin-bottom:7px}
.gbar i{display:block}
.glegend{display:flex;flex-wrap:wrap;gap:5px 12px;margin-bottom:10px;font-size:12px;opacity:.78}
.glegend span{display:flex;align-items:center;gap:4px}
.glegend i{width:9px;height:9px;border-radius:2px}
.glegend b{font-weight:500}
.gshelf{list-style:none;margin:0;padding:3px 2px 11px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}
.gt{flex:none;width:140px;display:flex;flex-direction:column;gap:3px}
.gt-i{position:relative;display:block;overflow:hidden;border:0;box-shadow:none;background:transparent}
.gt-i img{width:100%;height:auto;display:block}
.gt-blank{display:flex;align-items:center;justify-content:center;width:100%;height:100%;opacity:.45}
.gt-p{position:absolute;left:0;bottom:0;font-style:normal;font-size:12px;line-height:1.15;
  padding:1px 4px;color:#fff;letter-spacing:.2px}
.gt-c{position:absolute;right:0;top:0;display:flex;padding:1px 3px;background:var(--gold-3);color:var(--ink)}
.gt-n{font-size:12px;line-height:1.3;height:15.6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gt-h{font-style:normal;font-size:12px;opacity:.6}
.gfoot{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:2px;font-size:12px;opacity:.72}
.rfoot .sfx,.gfoot .sfx{letter-spacing:.4px}

/* 专精:语言构成条 */
.stack{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.stack li{display:flex;align-items:center;gap:7px;background:var(--cream-2);border:2px solid var(--wood-c);padding:5px 8px}
.stack em{font-style:normal;font-size:12px;min-width:66px}
.tbar{flex:1;height:12px;background:var(--cream-3);border:2px solid var(--wood-c);overflow:hidden}
.tbar b{display:block;height:100%}
.stack u{text-decoration:none;font-size:12px;min-width:40px;text-align:right;font-variant-numeric:tabular-nums}

.pgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.pcard{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:10px 9px;
  background:var(--cream-2);border:3px solid var(--ink);box-shadow:0 0 0 2px var(--wood-c);
  transition:transform .12s steps(2)}
.pcard:hover{transform:translateY(-4px)}
.pcard.gold{background:linear-gradient(180deg,#FFF1B8,#FFD98A)}
.pcard.green{background:linear-gradient(180deg,#D6F5C0,#A8E08A)}
.pcard.blue{background:linear-gradient(180deg,#CFEAFA,#9FCDEA)}
.pcard.purple{background:linear-gradient(180deg,#E8D6FA,#C6A8EE)}
.pcard-ic{filter:drop-shadow(0 3px 0 rgba(59,36,18,.3))}
.pcard-foot{display:flex;gap:3px;margin-top:2px}

/* ===== 相馆 ===== */
/* 等高一条排：主页只做缩略陈列（高 96px = 12 的倍数，宽按原始比例），
   **不裁图** —— 裁剪是子页灯箱之外唯一会破坏构图的事。
   flex-wrap 兜底：窄屏摆不下就折行，绝不用 overflow-x 把照片藏进滚动条。 */
.gstrip{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:flex-start}
.gstrip .gp{display:block;line-height:0;border:3px solid var(--ink);
  box-shadow:0 0 0 2px var(--cream-2),0 3px 0 rgba(59,36,18,.3);
  transition:transform .12s steps(2)}
.gstrip .gp:hover{transform:translateY(-3px)}
.gstrip img{height:96px;width:auto;display:block;image-rendering:auto}

/* ===== 侧栏 ===== */
.fruitgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.fr{display:flex;flex-direction:column;align-items:center;gap:3px;background:var(--cream-2);
  border:2px solid var(--wood-c);padding:7px 3px 5px;transition:transform .12s steps(2),background .12s}
.fr:hover{background:var(--gold);transform:translateY(-3px) scale(1.06)}
.fr b{display:block;width:100%;text-align:center}
.basketline{display:flex;align-items:center;gap:6px}
.seasons{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.se{display:flex;flex-direction:column;align-items:center;gap:5px;background:var(--sc);
  border:3px solid var(--ink);padding:10px 4px 7px}
.se b{display:block;width:72%;text-align:center}
/* 当前季节那一格描一圈金边 —— 季节已按真实时间自动判定，
   不标出来用户看不出「现在这一季」是哪个。 */
.se.now{box-shadow:0 0 0 4px var(--gold),0 0 0 7px var(--ink)}
.se.now::after{content:"";position:absolute;top:-9px;right:-9px;width:9px;height:9px;
  background:var(--gold);border:2px solid var(--ink)}
.se{position:relative}
.weather{display:flex;align-items:center;gap:6px;margin-top:10px}
.skills{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.skills li{display:flex;align-items:center;gap:7px;background:var(--cream-2);border:2px solid var(--wood-c);padding:5px 8px}
.skills em{font-style:normal;font-size:12px;min-width:32px}
.pips{display:flex;gap:2px;margin-left:auto}
.pips i{width:6px;height:6px;background:#7A6650;border:1px solid var(--ink)}
.pips i.on{background:var(--gold-2);box-shadow:0 0 0 1px var(--gold-3)}
.scene{display:flex;flex-wrap:wrap;justify-content:space-around;gap:10px;padding:4px 0}
.scene span{animation:bob 2.6s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.fencerow{display:flex;justify-content:space-between;margin-top:6px;opacity:.85}
.money{display:flex;flex-direction:column;gap:6px}
.mrow{display:flex;align-items:center;gap:7px;background:var(--cream-2);border:2px solid var(--wood-c);padding:5px 8px}
.mrow.foot{margin-top:2px}

/* ===== 博物馆（豆瓣收藏展览列） =====
   横向滚动的一排展品卡。封面是真实图片（2:3 / 方 / 各种比例都有），
   所以统一走 object-fit:contain 一张都别裁；露出来的地方用这条作品自己的主色垫底。
   横向滚动 + scroll-snap 是这里的正确解法 —— 一排 36 张卡塞进网格会把主栏高度撑爆。 */
.shelf-bar{display:flex;gap:4px;margin-bottom:8px}
.shelf-tab{display:flex;align-items:center;gap:4px;font:inherit;
  background:var(--cream-2);border:2px solid var(--wood-c);padding:4px 8px;color:var(--ink)}
.shelf-tab em{font-style:normal;font-size:12px}
.shelf-tab i{font-style:normal;font-size:12px;background:var(--wood-c);color:var(--cream);
  padding:0 4px}
/* 选中态也去掉了黄色底：改成描边色反白（深底 + 米白字），
   和面板标题牌 .pt 同一套语言。原来选中是金色实底，在一片展品上方又是一块黄。 */
.shelf-tab.on{background:var(--ink);color:var(--cream);border-color:var(--ink)}
.shelf-tab.on i{background:var(--cream);color:var(--ink)}
.shelf{list-style:none;margin:0;padding:2px 2px 12px;display:flex;gap:12px;align-items:stretch;
  overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;
  scrollbar-width:thin;scrollbar-color:var(--wood-b) var(--cream-3)}
.shelf::-webkit-scrollbar{height:8px}
.shelf::-webkit-scrollbar-track{background:var(--cream-3)}
.shelf::-webkit-scrollbar-thumb{background:var(--wood-b)}
/* 等高靠 flex 链：.exc 拉伸 → a 撑满 → .tx 占掉剩余 → 星星贴底。
   ⚠️ 别指望 .exc > a{height:100%}：父高度是 stretch 算出来的，
   百分比高度在这种场合解析不可靠，实测卡片会各随内容长短（截图里一眼看出来）。 */
/* 2026-09-15 柯西：**不要黄色框框**。
   原来每件展品是「淡黄底 + 木色描边 + 内边距」的一张卡 —— 封面被裹在一个黄盒子里，
   视觉主角变成了盒子，一排看过去是"一排黄卡片"而不是"一排展品"。
   现在把底板整个去掉：封面自己带描边直接落在面板上，文字排在封面下方。
   ⚠️ 去掉 padding 之后节奏全靠 gap 和固定宽高撑，别再往 a 上加背景色。 */
.exc{flex:none;width:96px;display:flex;scroll-snap-align:start}
.exc[hidden]{display:none!important}
.shelf-status{margin:8px 0;text-align:center;font-size:12px;color:var(--tx-3)}
.exc > a{flex:1;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:inherit;
  transition:transform .12s steps(2)}
.exc > a:hover{transform:translateY(-4px)}
/* 封面：contain 保证不裁切，底下垫的是豆瓣算出来的这张作品的主色。
   底板拿掉之后，这个描边 + 落影就是封面唯一的"实体感"来源，别省。 */
.exc .poster{display:flex;flex:none;height:132px;background:var(--pc,#C9AE82);
  border:3px solid var(--ink);box-shadow:0 4px 0 rgba(59,36,18,.28);
  align-items:center;justify-content:center;overflow:hidden;
  transition:box-shadow .12s steps(2)}
.exc > a:hover .poster{box-shadow:0 8px 0 rgba(59,36,18,.34)}
.exc .poster img{max-width:100%;max-height:100%;display:block;object-fit:contain}
.exc .poster.blank{background:var(--cream-3)}
.exc .tx{flex:1;display:flex;flex-direction:column;gap:3px}
/* 标题固定两行高：既让卡片等高，也让下面几行文字在整排里横着对齐 */
/* ⚠️ 这个固定高度是**算出来**的：font-size × line-height × 2 行。
   上面标题字号从 10px 提到 12px 时必须同步改，否则文字被切掉半行 ——
   而 line-clamp 会把它藏得很好看，看着只是"标题短了一截"。 */
.exc .t{font-size:12px;line-height:1.32;height:31.7px;display:-webkit-box;
  -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}
/* 标题里的游戏图标（GAME_ICON，见 game-data.js）必须退回 inline-block：
   .t 是 -webkit-box + line-clamp，display:block 的子元素会被当成独立的一"行"，
   把两行 clamp 撑成三行、标题高度炸掉。inline-block 才会跟着文字走。
   vertical-align -1px 是按 12px 字号配的（图标 9px，视觉上压着基线）。 */
.exc .t svg.ic{display:inline-block;vertical-align:-1px;margin-right:3px}
.exc .m{font-style:normal;font-size:12px;opacity:.62}
/* ★☆ 不是像素字体里的字，要显式退回系统字体，否则出豆腐块 */
.exc .st{font-family:system-ui,sans-serif;font-size:12px;color:var(--tx-em);
  letter-spacing:1px;margin-top:auto;min-height:12px}
.shelf-foot{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:2px;
  font-size:12px;opacity:.66}
.shelf-foot .sfx{letter-spacing:.4px}
.museum-zone + .museum-zone{margin-top:20px;padding-top:18px;border-top:3px dashed var(--wood-b)}
.museum-zone-title{display:flex;align-items:center;gap:6px;margin:0 0 9px;font-size:12px;letter-spacing:1px}
.museum-more{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:9px;font-size:12px}
.museum-more a{color:inherit;text-decoration:none;border-bottom:2px solid var(--wood-c);padding-bottom:1px}
.museum-more a:hover{background:var(--gold)}

/* 博物馆详情页：390 件馆藏按 24 件一页渲染，避免一次加载几百张封面。 */

.museum-page{max-width:none;margin:0 auto 32px}
.museum-filters{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.museum-filter{display:flex;align-items:center;gap:5px;font:inherit;font-size:12px;color:var(--ink);
  background:var(--cream-2);border:2px solid var(--wood-c);padding:5px 9px}
.museum-filter i{font-style:normal;background:var(--wood-c);color:var(--cream);padding:0 4px}
.museum-filter.on{background:var(--ink);color:var(--cream);border-color:var(--ink)}
.museum-filter.on i{background:var(--cream);color:var(--ink)}
.museum-status,.museum-note{font-size:12px;line-height:1.8;opacity:.7}
.museum-grid{list-style:none;margin:12px 0 18px;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.museum-item{min-width:0}
.museum-item-link{height:100%;display:flex;flex-direction:column;gap:7px;text-decoration:none;color:inherit}
.museum-item-poster{height:210px;display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:var(--cream-3);border:3px solid var(--ink);box-shadow:0 4px 0 rgba(59,36,18,.28)}
a.museum-item-link:hover .museum-item-poster{transform:translateY(-3px);box-shadow:0 7px 0 rgba(59,36,18,.34)}
.museum-item-poster img{width:100%;height:100%;object-fit:contain;display:block}
.museum-item-empty{font-size:12px;opacity:.55}
.museum-item-text{display:flex;flex-direction:column;gap:3px;min-width:0}
.museum-item-title{font-size:12px;line-height:1.4;min-height:33.6px;display:-webkit-box;
  -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}
/* 同 .exc .t：-webkit-box + line-clamp 里的图标必须 inline-block，
   否则被当成独立一行，两行 clamp 变三行、min-height 兜不住 */
.museum-item-title svg.ic{display:inline-block;vertical-align:-1px;margin-right:3px}
.museum-item-meta,.museum-item-source{font-style:normal;font-size:12px;opacity:.65}
.museum-item-detail{font-size:12px;line-height:1.45;height:34.8px;display:-webkit-box;
  -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.museum-item-source{margin-top:auto}
.museum-pager{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0 14px}
.museum-page-btn{font:inherit;font-size:12px;color:var(--ink);background:var(--cream-2);
  border:2px solid var(--wood-c);padding:6px 12px}
.museum-page-btn:hover:not(:disabled){background:var(--gold)}
.museum-page-btn:disabled{opacity:.35}
.museum-page-info{font-size:12px;min-width:72px;text-align:center}
@media (max-width:680px){
  .museum-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
  
}

/* 工坊详情页：全部仓库。沿用博物馆详情页的筛选/翻页控件（一个站点只用一套交互），
   但卡片是"仓库"不是"封面"，所以单独一套 .wcard —— 仓库没有图，硬套封面格子会空一大块。 */
.wgrid{list-style:none;margin:12px 0 18px;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:12px}
.wcard{min-width:0}
.wcard-link{height:100%;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:inherit;
  background:var(--cream-2);border:2px solid var(--wood-c);box-shadow:0 3px 0 rgba(59,36,18,.22);
  padding:10px 11px;transition:transform .12s,box-shadow .12s}
a.wcard-link:hover{transform:translateY(-3px);box-shadow:0 6px 0 rgba(59,36,18,.26);background:var(--cream)}
.wcard-head{display:flex;align-items:center;gap:5px}
.wcard-name{font-size:12px;letter-spacing:.2px;word-break:break-all}
.wcard-desc{font-size:12px;line-height:1.45;opacity:.74;min-height:34.8px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wcard-topics{display:flex;flex-wrap:wrap;gap:4px}
.wcard-topic{font-style:normal;font-size:12px;background:var(--cream-3);border:1px solid var(--wood-c);
  padding:0 5px;opacity:.85}
.wcard-foot{display:flex;align-items:center;gap:5px;font-size:12px;opacity:.7;margin-top:auto}
.wcard-lang{width:9px;height:9px;border-radius:50%;flex:none;border:1px solid rgba(43,29,14,.35)}
.wcard-langname,.wcard-star{font-style:normal}
.wcard-date{margin-left:auto;font-variant-numeric:tabular-nums}
@media (max-width:680px){
  .wgrid{grid-template-columns:1fr;gap:10px}
}

/* ===== 页脚农场 ===== */
.farm{position:relative;margin-top:var(--s8)}
.fgrass{height:24px;background:var(--grass-a);border-top:4px solid var(--ink);
  box-shadow:0 0 0 4px var(--wood-c);
  background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 2px,transparent 2px 8px)}
.fsoil{height:14px;background:var(--wood-b);border-bottom:4px solid var(--wood-c);
  background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 3px,transparent 3px 9px)}
.frow{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;padding:18px 0 4px}
.frow span{animation:bob 2.8s ease-in-out infinite;filter:drop-shadow(0 3px 0 rgba(59,36,18,.3))}
.fcopy{display:flex;align-items:center;justify-content:center;gap:8px;padding:2px 0 24px}

/* ===== 飘落物 / 萤火虫 / 宠物 ===== */
#fall{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden}
#fall span{position:absolute;top:-48px;animation-name:fall;animation-timing-function:linear;animation-iteration-count:infinite}
@keyframes fall{
  0%{transform:translateY(-48px) rotate(0deg)}
  100%{transform:translateY(108vh) rotate(340deg)}
}
/* ===== 宠物：已移除（2026-09-17 柯西要求）=====
   原来这里养着一只荔宝（柯西家的猫）当"跟班"，追着鼠标跑。
   柯西要求「不要现在的宠物系统了」，整块（CSS + DOM + 跟随逻辑）已删除。
   光标也不再是荔宝，换成 icons.js 里的像素箭头。

   ⚠️ 为什么删除而不是注释掉：留着会误以为还在用；
     万一以后要还原，看 git 记录即可（这一段有完整注释）。
   荔宝的图标数据本身（icons.js 的 libao / libao_b / libao_c）**保留** ——
   站内别处当装饰用，删了会连带断掉图标 sprite。 */

/* 点击冒星星 */
.spark{position:fixed;z-index:58;pointer-events:none;animation:spark .7s steps(4) forwards}
@keyframes spark{0%{transform:scale(.4) translateY(0);opacity:1}
  100%{transform:scale(1.5) translateY(-26px);opacity:0}}

@media (prefers-reduced-motion:reduce){
  .bunting i,.hang span,.frow span,.scene span,#fall,#fall span,#stars i,#fireflies i,#clouds i{animation:none!important}
  #fall,#fireflies{display:none}
}
@media (max-width:940px){
  
  .hero{grid-template-columns:1fr}
  .hero-cov{max-width:230px}
  .pgrid{grid-template-columns:1fr}
  .controls{top:6px;right:6px;transform:scale(.86);transform-origin:top right}
}

/* ===== 文章页（posts/*.html） =====
   这一段的样式只有文章页用得上，主页面不会匹配到任何元素 ——
   但样式表是共用的，所以它会跟着主页面一起下发。几十行 CSS
   换「文章页和主站是同一套皮、不会各改各的」，这个交换划算。

   标题与控件保留像素字体，长文使用系统字体和独立阅读行宽。 */
body.is-article{background:var(--sky-b);min-height:100vh;padding-top:22px}
.abarnav{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.abtn{display:flex;align-items:center;gap:5px;background:var(--cream-2);
  border:2px solid var(--wood-c);padding:5px 10px;font-size:12px;
  text-decoration:none;color:inherit;box-shadow:0 3px 0 rgba(59,36,18,.25)}
.abtn:hover{background:var(--gold);transform:translateY(-2px)}
.artpage{max-width:820px;margin:0 auto 26px}
.arttitle{font-size:24px;line-height:1.5;margin:6px 0 8px;word-break:break-word}
.artmeta{font-size:12px;color:var(--tx-3);margin:0 0 16px;line-height:1.7}
/* 文章 meta 行里的标签图标（TAG_ICON）：SVG 默认 display:block，
   在 <p> 文本流里会硬换行，必须退回 inline-block 才能贴着字走 */
.artmeta svg.ic{display:inline-block;vertical-align:-1px;margin-right:2px}
/* 分享按钮行：左边日期/来源/标签，右边「分享」。
   柯西 2026-09-20「没有分享键」→ 2026-09-21「分享功能没做好」：分享键已铺到全站
   （文章页/博客页在标题下、首页在工具栏、四个子页在顶导航），按钮/脚本共用
   subpage.js 的 shareBtn/shareScript；点击分支（触屏走原生面板、桌面直接复制链接）
   和三条复制降级写在那边，这里只管样式。
   ⚠️ 按钮上别写副标题，一个图标 + 「分享」两个字就够。 */
.artmeta-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 16px}
.artmeta-row .artmeta{margin:0;flex:1;min-width:0}
.share-btn{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;
  background:var(--cream-2);border:2px solid var(--wood-c);padding:4px 10px;
  font:12px var(--pix);line-height:24px;color:inherit;
  box-shadow:0 3px 0 rgba(59,36,18,.25)}
.share-btn:hover{background:var(--gold);transform:translateY(-2px)}
.share-btn:active{transform:translateY(1px);box-shadow:none}
/* 分享结果的小纸条：复制成功/失败都要有回执 —— 不然点了没反应，
   跟「没有分享键」看起来一模一样。steps(2) 保住像素感，不做平滑渐变。
   user-select：最后那条降级是把链接显示在纸条上让人家长按选中，
   iOS 的 webview 里不显式开文本选择，长按是选不中的。 */
.share-toast{position:fixed;left:50%;bottom:36px;transform:translate(-50%,8px);z-index:60;
  background:var(--cream);color:var(--ink);border:3px solid var(--ink);
  box-shadow:0 0 0 2px var(--wood-c),5px 5px 0 rgba(59,36,18,.3);
  padding:8px 14px;font-size:12px;line-height:24px;max-width:min(92vw,540px);
  opacity:0;visibility:hidden;overflow-wrap:anywhere;
  -webkit-user-select:text;user-select:text;
  transition:opacity .18s steps(2),transform .18s steps(2),visibility .18s}
.share-toast.on{opacity:1;visibility:visible;transform:translate(-50%,0)}
.artcover{margin:0 0 16px;text-align:center}
.artcover img{max-width:180px;max-height:250px;border:3px solid var(--ink);
  box-shadow:0 5px 0 rgba(59,36,18,.28);display:inline-block}
.artbody{font-family:system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  font-size:18px;line-height:1.9;max-width:42rem;margin-inline:auto;overflow-wrap:break-word;
  font-kerning:normal}
.artbody h2,.artbody h3,.artbody h4{font-family:var(--pix);line-height:1.6}
.artbody p{margin:0 0 1.25em}
.artbody h2{font-size:36px;margin:32px 0 14px;padding-bottom:8px;border-bottom:3px solid var(--cream-3)}
.artbody h3{font-size:24px;font-weight:700;margin:20px 0 8px}
.artbody h4{font-size:24px;margin:16px 0 6px;opacity:.8}
.artbody a{color:var(--wood-b);text-decoration:none;border-bottom:2px solid var(--gold-3)}
.artbody a:hover{background:var(--gold);color:var(--ink)}
.artbody ul,.artbody ol{margin:0 0 14px;padding-left:22px}
.artbody li{margin:0 0 6px}
.artbody blockquote{margin:0 0 14px;padding:8px 12px;background:var(--cream-2);
  border-left:5px solid var(--wood-c);color:var(--tx-quote)}
.artbody blockquote p:last-child{margin:0}
.artbody code{font-family:ui-monospace,Consolas,"SFMono-Regular",monospace;font-size:15px;background:var(--cream-2);border:1px solid var(--cream-3);padding:0 3px;color:var(--tx-code)}
/* 正文里的加粗 = 作者想强调的地方，用强调色（四季各不同）*/
.artbody strong{color:var(--tx-em)}
.artbody pre{margin:0 0 14px;padding:10px 12px;background:#2A2036;color:#FFF8E7;
  border:3px solid var(--ink);overflow-x:auto;line-height:1.75}
.artbody pre code{background:none;border:0;padding:0;color:inherit}
/* TOC styles adapted from PaperMod post-single.css (MIT; assets/vendor/papermod-LICENSE.txt). */
details.toc{max-width:42rem;margin:0 auto 24px;background:var(--cream-2);border:1px solid var(--wood-c)}
details.toc summary{padding:8px 16px;cursor:url("${CUR_B}") 0 0, pointer;font-size:12px}
/* 目录以前是 system-ui 16px —— 既脱节（全站像素风），16px 又正好是发虚档。
   归位成像素字 12px。 */
.toc .inner{padding:0 16px 12px;font-family:var(--pix);font-size:12px;line-height:2}
.toc ul{list-style:none;margin:0;padding:0}
.toc a{color:inherit;text-decoration:none}
.toc a:hover{text-underline-offset:.3rem;text-decoration:underline}
/* ===== 文章页：目录在左、正文在右（柯西 2026-09-20：「文章内的文章目录能不能放在左边」）=====
   桌面变成两栏网格：目录栏 200px 固定，正文吃剩下的。目录栏 sticky ——
   长文章滚到一半，目录还挂在眼前。
   ⚠️ 别给 .artbody 写死宽度：它在这一栏里由 1fr 决定，写死就跟目录栏打架。
   ⚠️ 只有真的有目录时 posts.js 才建 .art-cols；没有目录（文章没有小节标题）
      时正文保持整幅居中，跟改造前一样。 */
.art-cols{display:grid;grid-template-columns:200px minmax(0,1fr);gap:28px;align-items:start}
.toc-side{min-width:0;position:sticky;top:20px;max-height:calc(100vh - 40px);overflow:auto}
.art-cols details.toc{margin:0;max-width:none}
/* 有目录的文章面板放宽到 1000px —— 这条**必须写在 build/pixel-art.js**（最后一张
   样式表）：那里有条同特异性的 .is-article .artpage{max-width:860px}，
   写在本文件会被它覆盖，看着改了其实没生效（2026-09-20 踩过）。 */
/* 窄屏（≤900px）：目录没地方站了，退回正文上方 —— 就是 2026-09-20 之前的位置。
   必须显式取消 sticky 和限高，否则目录会变成浮层挡住阅读。 */
@media (max-width:900px){
  .art-cols{grid-template-columns:minmax(0,1fr);gap:0}
  .toc-side{position:static;max-height:none;overflow:visible}
  .art-cols details.toc{margin:0 auto 24px;max-width:42rem}
}
.artbody h2,.artbody h3,.artbody h4{scroll-margin-top:24px}
.artbody pre{position:relative;padding-top:44px}
.copy-code{position:absolute;top:6px;right:8px;padding:4px 8px;background:var(--cream-2);color:var(--ink);border:1px solid var(--wood-c);font:12px var(--pix)}
.copy-code:hover{background:var(--gold)}
.site-links{text-align:center;font-size:12px;line-height:2;margin:16px 0}
.site-links a{color:var(--tx-link);text-underline-offset:4px}
.artbody img{max-width:100%;height:auto;image-rendering:auto;border:3px solid var(--ink);display:block;margin:0 auto}
.artbody hr{border:0;height:6px;margin:20px 0;
  background:repeating-linear-gradient(90deg,var(--wood-c) 0 4px,transparent 4px 8px)}
.artfoot{margin-top:24px;padding-top:12px;border-top:3px solid var(--cream-3);
  display:flex;justify-content:flex-end;font-size:12px}
.artorig{color:inherit;text-decoration:none;border-bottom:2px solid var(--wood-c)}
.artorig.quiet{color:var(--tx-3)}
.cmtpanel{max-width:820px;margin:0 auto 26px}
.cmtbox{min-height:20px;font-size:12px}
.cmtnote{font-size:12px;line-height:1.95;color:var(--tx-3);margin:0 0 6px}
.cmtnote code{background:var(--cream-2);border:1px solid var(--cream-3);padding:0 3px}

/* ===== 网站底部：访问量 + 评论区 =====
   放在页脚「农田」下方。访问量那块做成一条木质小牌，
   跟平台导航是同一套皮 —— 别用系统默认的灰字。 */
.sitebottom{max-width:820px;margin:0 auto;padding:0 12px 44px}
.visitbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;
  background:var(--cream-2);border:3px solid var(--ink);box-shadow:0 0 0 3px var(--wood-c);
  padding:9px 12px;margin:0 auto 22px;font-size:12px;letter-spacing:.4px}
.visitbar .vlabel{opacity:.75}
.visitbar .vnum{font-weight:700;font-size:12px;min-width:30px;text-align:center;
  background:var(--cream);border:2px solid var(--wood-c);padding:2px 8px}
/* 数字没回来之前显示占位点，避免"空一行"导致下方内容跳动 */
.visitbar .vslot{opacity:.45;letter-spacing:2px}
.apager{display:flex;gap:10px;max-width:820px;margin:0 auto 40px}
.apg{flex:1;display:flex;flex-direction:column;gap:3px;background:var(--cream-2);
  border:2px solid var(--wood-c);padding:8px 10px;text-decoration:none;color:inherit}
.apg:hover{background:var(--gold)}
.apg.empty{visibility:hidden}
.apg i{font-style:normal;font-size:12px;opacity:.6}
.apg b{font-size:12px;font-weight:400;line-height:1.45}
.apg.next{text-align:right}
.arclist{list-style:none;margin:0;padding:0}
.arclist li{display:flex;align-items:baseline;gap:10px;padding:7px 0;
  border-bottom:2px dotted var(--cream-3)}
.arcdate{font-size:12px;opacity:.6;flex:none}
.arctitle{flex:1;font-size:12px;text-decoration:none;color:inherit}
.arctitle:hover{background:var(--gold)}
.arcsrc{font-size:12px;opacity:.55;flex:none}

/* ===== 博客列表页（posts/index.html）=====
   柯西 2026-09-16 要「一个正式博客页」—— 光一列标题不叫博客页。
   2026-09-20：这一页改成**完整时间线**（柯西：把时间线做一个单独的页面），
   卡片直接复用上面「时间线」那一套 .tl-* 样式 —— 不在这里重复定义。
   曾经的「大卡 + 紧凑列表」样式（.blog-lead / .blog-row）随之退役。 */
.blog-note{font-size:12px;line-height:1.9;color:var(--tx-3);margin-top:14px}
.blog-note a{color:var(--tx-link)}

/* Reading hierarchy: scene stays decorative; paper, frames and links have separate roles. */
:root{--reading-surface:var(--cream);--reading-muted:var(--cream-2);--frame:var(--wood-c);--link-accent:var(--tx-link-line)}
.bg,.asset-bg{filter:saturate(.65) brightness(.9)}
.appearance-settings{position:relative;z-index:60;max-width:1180px;margin:12px auto 0;text-align:right;padding:0 12px}
.appearance-settings>summary,.secondary-nav>summary{font-size:12px;line-height:24px}
.appearance-settings>summary{display:inline-block;padding:4px 12px;background:var(--cream);border:1px solid var(--frame)}
.appearance-settings .controls{position:absolute;top:36px;right:12px;display:flex;flex-wrap:wrap;max-width:calc(100vw - 32px);padding:12px;background:var(--cream);border:2px solid var(--frame);box-shadow:0 4px 0 rgba(43,29,14,.2)}
.controls .crow,.controls .daynight{border:0;box-shadow:none;padding:0}
.controls .cbtn{min-height:44px}
.board{padding:16px 24px 16px;border-width:3px;box-shadow:0 3px 0 var(--frame)}
.board::after,.board .deco,.hang{display:none}
.board .bt{font-size:24px;white-space:normal}
.social .soc{border:1px solid rgba(43,29,14,.4);padding:6px 10px;flex-direction:row;gap:6px}
button.soc .soc-in{flex-direction:row;gap:6px}
.social .soc em{white-space:nowrap}
.social .soc{flex:0 0 auto}
.social .soc .bico{width:20px;height:20px;flex:0 0 20px;display:block}
.toolbar{margin:20px 0 8px;gap:12px}
.tool{flex-direction:row;min-height:44px;padding:8px 12px;gap:8px;border:2px solid var(--frame);box-shadow:0 3px 0 var(--frame)}
.tool:hover,.tool:focus-visible{box-shadow:0 3px 0 var(--frame);transform:translateY(-1px)}
.secondary-nav{text-align:center;margin:0 0 24px;font-size:12px}
.secondary-nav a{display:inline-block;color:inherit;padding:10px 12px;text-underline-offset:4px}
.panel{border:2px solid var(--frame);box-shadow:0 4px 0 rgba(43,29,14,.15);padding:24px;background:var(--reading-surface);margin-bottom:28px}
.panel::before{display:none}
.pt{letter-spacing:0}
.rcard,.wcard-link{background:var(--reading-muted);border:1px solid var(--frame);box-shadow:none;padding:16px;gap:10px}
.rcard:hover,.wcard-link:hover{box-shadow:0 3px 0 rgba(43,29,14,.15);transform:translateY(-2px)}
.rc-d,.wcard-desc{line-height:1.8;opacity:.9}
.rc-f{padding-top:4px}
.rfoot{margin-top:16px}
.museum-more{margin-top:16px;line-height:24px}
.artpage{max-width:820px;margin:0 auto 32px}
/* 页面主标题 36px（2026-09-21）：原来和面板标题、文章 H2、卡片标题同为 24px ——
   四种重要度挤在一个尺寸里，层级是平的。往上只有 36 这一档可用
   （像素字体只认 12 的整数倍，18/30 会糊），所以主标题占 36、H2 也占 36，
   面板/卡片标题留在 24，正文 18（系统字体），辅助小字 12。 */
.arttitle,.gal-title{font-size:36px;line-height:48px;margin:10px 0 18px}
.artbody{max-width:64ch;margin-inline:auto;line-height:2}
.artbody h2{font-size:36px;line-height:48px}
.artbody pre{white-space:pre-wrap;overflow-wrap:anywhere}
.artbody a{color:var(--tx-link);text-decoration:underline;text-decoration-color:var(--link-accent);text-underline-offset:4px}
.artmeta,.museum-status,.museum-note{opacity:.85;line-height:24px}
.abtn{min-height:44px;align-items:center;box-shadow:none}
@media(max-width:680px){
  .bunting{display:none}
  
  .board .bn{gap:4px}
  .board .bn>.ic{display:none}
  
  
  .social .pico{width:16px;height:16px}
  
  
  .tool{padding:8px;gap:4px}
  
  /* 工坊的「手机只露两张」截断：友情站不参与（:not(.fgrid) 挡开）——
     友链卡没有「查看全部」子页可去，截了就是真没了。友情站改单列铺开（见下）。 */
  .rgrid:not(.fgrid) .rcard:nth-child(n+3){display:none}

  /* 友情站手机端单列：所有站都看得见 */
  .fgrid{grid-template-columns:1fr}
  
  
  .rc-d{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  
  .museum-item-detail,.museum-item-source{display:none}
  .museum-item-poster{height:180px;border-width:1px;box-shadow:none}
  .museum-item-title{line-height:24px;min-height:48px}
  .museum-item-meta{line-height:24px;opacity:.85}
  .arttitle{font-size:24px;line-height:36px}
  /* 小屏主标题回到 24px（36px 在 390px 宽里一行放不下几个字），
     正文 H2 必须一起降 —— 否则 H2（36）比页面标题（24）还大，层级倒挂。 */
  .artbody h2{font-size:24px;line-height:36px}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}}
.museum-item .museum-item-poster{height:auto;aspect-ratio:auto;display:block;flex:none;border:0;box-shadow:none;background:transparent;overflow:visible}
.museum-item .museum-item-poster img{width:100%;height:auto;display:block}
.museum-item a.museum-item-link:hover .museum-item-poster{transform:none;box-shadow:none}
.exc .poster{height:auto;display:block;border:0;box-shadow:none;background:transparent;overflow:visible}
.exc .poster img{width:100%;height:auto;max-height:none;display:block}
.exc > a:hover .poster{box-shadow:none}
.douban-mark-link{font-size:12px;font-weight:normal;line-height:24px;margin-left:auto;color:var(--tx-link);text-underline-offset:4px;white-space:nowrap}
${FARM.css}
${DC.css}
${PIXEL.css}
${MUSIC.css}
</style>
</head>
<body>

<div class="bg" aria-hidden="true">
  <div id="stars"></div>
  <div id="sun"></div>
  <div id="clouds"></div>
  <div class="hill far"></div>
  <div class="hill near"></div>
  <div class="ground">
    <div class="g-layer g-hedge"></div>
    <div class="g-layer g-far"></div>
    <div class="g-layer g-mid"></div>
    <div class="g-layer g-near"></div>
  </div>
  <div id="flora"></div>
  <div id="animals"></div>
  <div id="fireflies"></div>
</div>

<!-- 星露谷素材层（build/decor.js）：远景农舍/风车/温室/水塔/筒仓 + 池塘 + 飞鸟。
     全部 pointer-events:none + aria-hidden，纯装饰，不吃点击也不进无障碍树。 -->
<div class="dc" aria-hidden="true">
  ${DC.scene()}
  ${DC.pond()}
  ${DC.birds()}
</div>

<!-- 素材背景层（D:\\stardewOS-main 提供）。用 data-bg="image"/"code" 切换 -->
<div class="asset-bg" aria-hidden="true">
  <div class="sky-img sky-day"></div>
  <div class="sky-img sky-night"></div>
  <div class="starfield s1"></div>
  <div class="starfield s2"></div>
  <div class="ridge far"></div>
  <div class="ridge mid"></div>
  <div class="ridge near"></div>
  <div class="cloudband c1"></div>
  <div class="cloudband c2"></div>
  <div class="asset-veil"></div>
  <div class="asset-edge"></div>
</div>

${controls()}

<div class="wrap">
  ${PIXEL.hero(DC.panorama(), social(), {articles:ARTICLES.length,collection:(DOUBAN.items || []).length + (GAMES.games || []).length + ALBUMS.items.length,photos:GALLERY.count || 0}, ic)}

  ${hang()}
  ${toolbar()}

  <!-- 工坊单独放在两栏之外，占满整行 —— 柯西要求「把代码仓库放在最上面」，
       放在 main 里的话它会跟右栏的侧栏面板并排，视觉上就不是「最上面」了。 -->
  ${repos()}

  <div class="layout">
    ${DC.posts()}
    <main>
      ${timeline()}
      ${DC.path()}
      ${museum()}
      ${DC.path()}
      ${galleryPanel()}
      ${DC.path()}
      <!-- 「专精」面板原本挂在 <aside> 里（2026-09-21 搬到主栏）。
           原因：侧栏当时塞了 5 块、主栏只有 3 块，侧栏比主栏整整高出 917px，
           主栏底部悬着一大片空白；而 .layout 是 align-items:start，
           grid 不会替短的那栏补高。搬到主栏后两栏差降到 45px 以内。
           放主栏也顺理成章 —— 6 行进度条本来就该宽着排，挤在 288px 里反而局促。 -->
      ${techStack()}
      ${DC.path()}
      ${friendsPanel()}
    </main>
    <aside>
      ${seasonPanel()}
      ${panel('唱片机', ['star', 'flower', 'star', 'flower', 'star'], MUSIC.render() + DC.shelf(), 'music')}
      ${moneyPanel()}
      ${farmPanel()}
    </aside>
  </div>

  ${DC.farmyard()}
  ${FARM.scenery()}
  ${footer()}
  ${bottom()}
</div>

<div id="fall" aria-hidden="true"></div>
<div id="contact-tip" class="contact-tip" role="status" aria-live="polite"></div>

${buildSprite()}

<script src="assets-layers.js"></script>
<script>
(function(){
  var root = document.documentElement;
  var FALL_KIND = {
    spring: ['flower','tulip','strawberry','butterfly','bee'],
    summer: ['sunflower','bee','butterfly','star','melon'],
    autumn: ['leaf2','pumpkin','acorn','mushroom','grape'],
    winter: ['raindrop','snowman','crystal','cloud','star']
  };
  // 荔宝不参与季节轮换 —— 光标和跟班必须永远是同一只，季节感交给下面的
  // 飘落物和地面动物去表达。

  /* ---- 季节 / 昼夜 ---- */
  // 手动切过季节就置 true。声明必须在监听器之前 ——
  // var 只提升声明不提升赋值，写在后面这里读到的是 undefined。
  var manual = false, manualTime = false;
  function applySeason(s){
    root.dataset.season = s;
    document.querySelectorAll('#calendar .se').forEach(function(el){el.classList.toggle('now',el.dataset.se===s);});
    document.querySelectorAll('[data-set-season]').forEach(function(b){
      b.classList.toggle('on', b.dataset.setSeason === s);
      b.setAttribute('aria-pressed',String(b.dataset.setSeason===s));
    });
    buildFall(s);
    buildFlora(s);
    buildAnimals(s);
    /* 荔宝不随季节换形象 —— 光标永远是同一只荔宝，页面上的跟班换季就变成
       两只不同的动物了。季节感交给地面动物和飘落物表达。 */
    // 通知素材层：季节变了，重建云和祝尼魔
    document.dispatchEvent(new CustomEvent('kx:season', { detail: s }));
  }
  document.querySelectorAll('[data-set-season]').forEach(function(b){
    b.addEventListener('click', function(){
      // 手动点了就临时覆盖自动判定 —— 但只覆盖这一次访问，
      // 刷新页面又回到「按真实时间走」，不然每次打开都停在手选的季节上。
      manual = true;
      applySeason(b.dataset.setSeason);
      updateCalendar();
    });
  });

  /* ---- 季节 / 昼夜：按访问时的真实时间自动定 ----
     为什么不是构建时定死：静态站构建一次就固定了，站点会一直是构建当天那个季节。
     放到浏览器里按来访者的本地时间算，任何一天打开都是对的。
     柯西 2026-09-16 明确要求「网站会根据当前时间和季节自动切换」。

     ⚠️ 这个函数定义在这里，但**调用被挪到了脚本最末尾**。
     原因：applySeason 会调 buildFall / buildFlora / buildAnimals，
     而 buildAnimals 是 var 函数表达式、定义在文件更下面。
     var 只提升声明不提升赋值 —— 在这个位置调用它还是 undefined，
     会抛 TypeError 并**静默吃掉后面所有代码**（含季节高亮），
     表现为「季节是对的、但高亮永远不亮」这种极难排查的半个故障。 */
  function seasonOf(m){
    // 按北半球粗分（不追节气精确到日，够用且好维护）
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  function updateCalendar(){
    var now=new Date(),date=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    var el=document.getElementById('calendar-date');el.dateTime=date;el.textContent=now.getFullYear()+' / '+String(now.getMonth()+1).padStart(2,'0')+' / '+String(now.getDate()).padStart(2,'0');
    document.getElementById('calendar-weekday').textContent='星期'+'日一二三四五六'[now.getDay()];
    document.getElementById('calendar-mode').textContent=(manual||manualTime?'手动外观':'自动外观')+' · '+{spring:'春',summer:'夏',autumn:'秋',winter:'冬'}[root.dataset.season]+'季 · '+(root.dataset.time==='night'?'夜间':'白天');
    document.querySelector('[data-auto-season]').disabled=!manual&&!manualTime;
  }
  function applyTime(value){
    root.dataset.time=value;var night=value==='night',button=document.querySelector('[data-toggle-time]');
    button.querySelector('use').setAttribute('href','#px-'+(night?'moon':'sun'));button.querySelector('em').textContent=night?'夜':'昼';button.classList.toggle('on',night);button.setAttribute('aria-pressed',String(night));
  }
  function autoSeason(){
    var now=new Date(),season=seasonOf(now.getMonth()+1);
    if(!manual&&root.dataset.season!==season)applySeason(season);
    if(!manualTime)applyTime(now.getHours()<6||now.getHours()>=18?'night':'day');
    updateCalendar();
  }
  document.querySelector('[data-auto-season]').addEventListener('click',function(){manual=false;manualTime=false;autoSeason();});
  setInterval(autoSeason,30000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)autoSeason();});

  /* ---- 博物馆：书 / 影 / 音 / 游 分类 ----
     筛选用 hidden 属性；专用 CSS 规则确保它不会被卡片的 display:flex 覆盖，
     不会像「把宽度改成 0」那样留下缝隙。这一步没法用纯 CSS 做：
     :has() 选择器能选中「被点击的兄弟元素之后的元素」，但要跨到列表里的每个卡片太绕。 */
  document.querySelectorAll('[data-filter-kind]').forEach(function(b){
    b.addEventListener('click', function(){
      var k = b.dataset.filterKind;
      document.querySelectorAll('[data-filter-kind]').forEach(function(x){
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      var shown = 0;
      document.querySelectorAll('#museum .exc').forEach(function(li){
        var matches = k === 'all' || li.dataset.kind === k;
        li.hidden = !matches || shown >= ${SHELF_SHOW};
        if (!li.hidden) shown++;
      });
      var status = document.querySelector('#museum .shelf-status');
      if (status) status.textContent = '展示 ' + shown + ' 件 · 完整馆藏见下方入口';
      var more = document.querySelector('[data-museum-more]');
      if (more) {
        more.href = 'museum/index.html' + (k === 'all' ? '' : '?kind=' + k);
        more.textContent = k === 'game' ? '查看全部游戏 · 按平台筛选' : '查看全部馆藏 · 可分类翻页';
      }
      // 筛完可能只剩几张，把滚动位置拉回开头，否则停在空白是中间
      var shelf = document.querySelector('#museum .shelf');
      if (shelf) shelf.scrollLeft = 0;
    });
  });
  if (location.hash === '#basket') {
    document.querySelector('[data-filter-kind="game"]').click();
    document.getElementById('museum').scrollIntoView();
  }
  var dn = document.querySelector('[data-toggle-time]');
  dn.addEventListener('click',function(){manualTime=true;applyTime(root.dataset.time==='night'?'day':'night');updateCalendar();});

  /* ---- 邮箱 / 微信：点击显示号码（不跳转） ---- */
  (function(){
    var tip = document.getElementById('contact-tip');
    if (!tip) return;
    var hideTimer = null;
    function show(label, value){
      tip.innerHTML = '<b>' + value + '</b><span>' + label + ' · 点号码可选中</span>'
        + '<svg class="ic sm" viewBox="0 0 16 16"><use href="#px-key"></use></svg>';
      tip.classList.add('on');
      // 复制不是重点（很多内嵌浏览器不给剪贴板权限），亮出来让人自己选中才是
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(value).catch(function(){});
      }
      clearTimeout(hideTimer);
      // 8 秒后自动收，避免一直挂在页面上挡视线
      hideTimer = setTimeout(function(){ tip.classList.remove('on'); }, 8000);
    }
    function hide(){ tip.classList.remove('on'); clearTimeout(hideTimer); }
    document.querySelectorAll('[data-copy]').forEach(function(b){
      b.addEventListener('click', function(e){
        e.preventDefault();
        var v = b.dataset.copy;
        var label = b.querySelector('em') ? b.querySelector('em').textContent : '';
        if (tip.classList.contains('on') && tip.dataset.cur === v){ hide(); return; }
        tip.dataset.cur = v;
        show(label, v);
      });
    });
    // 点别处 / 按 Esc 收起
    document.addEventListener('click', function(e){
      if (!tip.classList.contains('on')) return;
      if (e.target.closest && (e.target.closest('[data-copy]') || e.target.closest('#contact-tip'))) return;
      hide();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') hide(); });
  })();

  /* ---- 星星 ---- */
  (function(){
    var box = document.getElementById('stars'), s = '';
    for (var i = 0; i < 90; i++){
      var sz = i % 7 === 0 ? 4 : 2;
      s += '<i style="left:' + ((i * 13.7) % 100).toFixed(2) + '%;top:' + ((i * 29.3) % 68).toFixed(2) +
           '%;width:' + sz + 'px;height:' + sz + 'px;animation-delay:' + (i % 12 * 0.2).toFixed(1) + 's"></i>';
    }
    box.innerHTML = s;
  })();

  /* ---- 太阳 ---- */
  (function(){
    var box = document.getElementById('sun');
    if (!box) return;
    box.innerHTML = '<svg viewBox="0 0 16 16"><use href="#px-sun"></use></svg>';
  })();

  /* ---- 云 ---- */
  (function(){
    var box = document.getElementById('clouds'), s = '';
    for (var i = 0; i < 7; i++){
      s += '<i style="top:' + (4 + i * 7) + '%;animation-duration:' + (46 + i * 15) + 's;animation-delay:-' +
           (i * 9) + 's;opacity:' + (0.55 + (i % 3) * 0.15).toFixed(2) + '">' +
           '<svg viewBox="0 0 16 16" style="width:' + (58 + (i % 4) * 26) + 'px;height:auto;image-rendering:pixelated">' +
           '<use href="#px-cloud"></use></svg></i>';
    }
    box.innerHTML = s;
  })();

  /* ---- 萤火虫 ---- */
  (function(){
    var box = document.getElementById('fireflies'), s = '';
    for (var i = 0; i < 26; i++){
      s += '<i style="left:' + ((i * 17.3) % 98).toFixed(1) + '%;top:' + (30 + (i * 23.7) % 62).toFixed(1) +
           '%;animation-duration:' + (4 + (i % 5)) + 's;animation-delay:-' + (i * 0.4).toFixed(1) + 's"></i>';
    }
    box.innerHTML = s;
  })();

  /* ---- 飘落物（随季节换） ---- */
  function buildFall(season){
    var kinds = FALL_KIND[season] || FALL_KIND.spring;
    var box = document.getElementById('fall'), s = '';
    var n = 22;
    for (var i = 0; i < n; i++){
      var k = kinds[i % kinds.length];
      var sz = [13, 17, 22][i % 3];
      s += '<span style="left:' + ((i * 7.31 + 2) % 97).toFixed(1) + '%;animation-duration:' +
           (6.5 + (i % 6) * 1.6).toFixed(1) + 's;animation-delay:-' + (i * 1.15).toFixed(1) + 's;opacity:' +
           (0.5 + (i % 4) * 0.12).toFixed(2) + '">' +
           '<svg viewBox="0 0 16 16" style="width:' + sz + 'px;height:' + sz + 'px;image-rendering:pixelated">' +
           '<use href="#px-' + k + '"></use></svg></span>';
    }
    box.innerHTML = s;
  }
  buildFall('spring');

  /* ---- 背景：地表作物（草簇 / 花 / 蘑菇 / 小石头） ---- */
  var FLORA_KIND = {
    spring: ['flower', 'tulip', 'leaf2', 'sunflower', 'flower', 'tulip'],
    summer: ['sunflower', 'flower', 'leaf2', 'bee', 'sunflower', 'tulip'],
    autumn: ['mushroom', 'leaf2', 'acorn', 'mushroom', 'leaf2', 'grape'],
    winter: ['crystal', 'snowman', 'leaf2', 'crystal', 'acorn', 'mushroom']
  };
  // 固定随机种子：每次刷新布局一致，不闪
  function rng(seed){ var s = seed; return function(){ s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
  function buildFlora(season){
    var box = document.getElementById('flora');
    if (!box) return;
    var kinds = FLORA_KIND[season] || FLORA_KIND.spring;
    var r = rng(20260915);
    var s = '';
    // 从远（顶部）到近（底部），越近越大、不透明度越高 —— 造出纵深
    var BANDS = [
      { top: 11, spread: 6, size: 12, op: 0.55 },
      { top: 22, spread: 7, size: 15, op: 0.7 },
      { top: 33, spread: 8, size: 19, op: 0.85 },
      { top: 44, spread: 8, size: 24, op: 1 }
    ];
    var n = 0;
    BANDS.forEach(function(b, bi){
      var count = 11 + bi * 3;
      for (var i = 0; i < count; i++){
        var k = kinds[(n + bi) % kinds.length];
        var top = b.top + r() * b.spread;
        var left = r() * 100;
        var sz = b.size + Math.floor(r() * 3) * 2;
        var dur = (3.2 + r() * 2.6).toFixed(2);
        var delay = (-r() * 4).toFixed(2);
        s += '<span style="left:' + left.toFixed(2) + '%;bottom:' + (100 - top).toFixed(2) +
             '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's;opacity:' + b.op + '">' +
             '<svg viewBox="0 0 16 16" style="width:' + sz + 'px;height:' + sz + 'px;image-rendering:pixelated">' +
             '<use href="#px-' + k + '"></use></svg></span>';
        n++;
      }
    });
    // 随机小石头，静态，压在最前
    for (var j = 0; j < 9; j++){
      var sz2 = 9 + Math.floor(r() * 3) * 3;
      s += '<span class="rock" style="left:' + (r() * 100).toFixed(2) + '%;bottom:' +
           (r() * 9).toFixed(2) + '%;animation:none">' +
           '<svg viewBox="0 0 16 16" style="width:' + sz2 + 'px;height:' + sz2 + 'px;image-rendering:pixelated">' +
           '<use href="#px-ore"></use></svg></span>';
    }
    box.innerHTML = s;
  }

  var buildAnimals;
  var aniTimer = 0;
  /* ---- 地面动物：贴着草线来回走 ----
     荔宝从 2026-09-15 起是页面唯一的"主角"（光标 + 跟班），
     所以不再下放到地面动物层里和鸡牛羊挤在一起 —— 同一个形象在页面上
     出现六七次会显得廉价，而且她在 26px 那种尺寸下糊成一个红点，
     反而不如小鸡奶牛认得出来。地面上继续跑鸡、牛、蜜蜂、蝴蝶。 */
  var ANIMAL_KIND = {
    spring: ['chicken', 'cow', 'bee', 'butterfly', 'chicken', 'cow'],
    summer: ['cow', 'chicken', 'butterfly', 'bee', 'cow', 'chicken'],
    autumn: ['cow', 'chicken', 'boot', 'bee', 'cow', 'chicken'],
    winter: ['chicken', 'snowman', 'bee', 'chicken', 'cow', 'snowman']
  };
  buildAnimals = function(season){
    var box = document.getElementById('animals');
    if (!box) return;
    var kinds = ANIMAL_KIND[season] || ANIMAL_KIND.spring;
    var r = rng(20260916);
    var s = '';
    // bottom 越大越靠近镜头；每条各给一个速度，避免整排同步平移。
    // 尺寸偏大是有意的：16px 的动物在整页里就是个看不清的小点，
    // 放大到 26/34/44 才能一眼认出是小鸡和牛。
    var LANES = [
      { bottom: 2,  size: 44, op: 1,    dur: 74 },
      { bottom: 11, size: 34, op: 0.9,  dur: 96 },
      { bottom: 20, size: 26, op: 0.78, dur: 118 }
    ];
    LANES.forEach(function(L, li){
      for (var i = 0; i < 2; i++){
        var k = kinds[(li * 2 + i) % kinds.length];
        // 小尺寸的用点心充当空中飞虫，贴着同一高度带飘过去
        var air = (k === 'bee' || k === 'butterfly');
        var top = air ? (L.bottom + 30 + r() * 14) : L.bottom;
        var sz = air ? Math.round(L.size * 0.42) : L.size;
        var dur = (L.dur + r() * 30).toFixed(1);
        s += '<span class="ani" style="bottom:' + top.toFixed(1) + '%;' +
             'animation-duration:' + dur + 's;animation-delay:-' + (r() * dur).toFixed(1) + 's;' +
             'opacity:' + L.op + '">' +
             '<span class="bd" style="position:absolute;left:' + (sz / -2) + 'px;bottom:0;' +
             'width:' + sz + 'px;height:' + sz + 'px;font-size:' + sz + 'px">' +
             '<svg viewBox="0 0 16 16"><use href="#px-' + k + '"></use></svg></span></span>';
      }
    });
    box.innerHTML = s;
    // 方向不能靠 @keyframes 翻 —— keyframes 里再写 scaleX 会和 translateX 抢同一个
    // transform，坐标系被翻掉，动物就往反方向飘。用一个短命计时器按下标精确算。
    var els = box.querySelectorAll('.ani');
    els.forEach(function(el){ el._px = -1; });
    clearInterval(aniTimer);
    aniTimer = setInterval(function(){
      for (var i = 0; i < els.length; i++){
        var el = els[i];
        var dur = parseFloat(el.style.animationDuration) * 1000;
        if (!dur) continue;
        var st = getComputedStyle(el);
        var neg = (st.animationDelay || '').trim().charAt(0) === '-';
        var d = Math.abs(parseFloat(st.animationDelay) || 0) * 1000;
        var px = (neg ? -d : dur - (d % dur)) / dur;   // 与 CSS 同一调制基准
        px = ((px % 1) + 1) % 1;
        if (el._px >= 0 && px < el._px){               // 回卷即越过一圈，换向
          el._i = (el._i || 0) + 1;
          el.classList.toggle('flip', el._i % 2 === 1);
        }
        el._px = px;
      }
    }, 90);
  }
  var hills = document.querySelectorAll('.hill');
  var ground = document.querySelector('.ground');
  var last = -1, ticking = false;
  function onScroll(){
    var y = window.pageYOffset;
    if (y === last) { ticking = false; return; }
    last = y;
    // 必须 clamp：远山只有 26vh，不封顶会整座沉出视口
    var p = Math.min(y, 1400);
    if (hills[0]) hills[0].style.transform = 'translateY(' + (p * 0.055).toFixed(1) + 'px)';
    if (hills[1]) hills[1].style.transform = 'translateY(' + (p * 0.028).toFixed(1) + 'px)';
    // 地面整体缓慢上浮，越近的层动得越多
    if (ground) ground.style.transform = 'translateY(' + (p * 0.04).toFixed(1) + 'px)';
    var st = document.getElementById('stars'); if (st) st.style.transform = 'translateY(' + (p * 0.02).toFixed(1) + 'px)';
    var cl = document.getElementById('clouds'); if (cl) cl.style.transform = 'translateY(' + (p * 0.045).toFixed(1) + 'px)';
    var su = document.getElementById('sun'); if (su) su.style.marginTop = (p * 0.03).toFixed(1) + 'px';
    ticking = false;
  }
  addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});

  /* ---- 宠物跟随：已移除（2026-09-17 柯西要求）----
     原来这里是一只追着鼠标跑的荔宝（含三帧走路循环、镜像、影子、感叹号气泡）。
     柯西要求「不要现在的宠物系统了」，整块连同 CSS 和 DOM 一起删掉。
     配套的光标也从荔宝换成了像素箭头（见文件顶部的 CUR_A / CUR_B）。

     历史坑（万一以后要还原，这两条还得注意）：
       1) transform 里写 scaleX(-1) 会把位移坐标系一起翻 → "不跟手"；
       2) 缓动系数太小会永远追不上，要配"速度 + 死区 + 封顶速度"。 */

  /* ---- 点击冒星星 ---- */
  /* ---- 点击冒星星 ---- */
  addEventListener('click', function(e){
    var s = document.createElement('div');
    s.className = 'spark';
    s.style.left = (e.clientX - 10) + 'px';
    s.style.top = (e.clientY - 10) + 'px';
    s.innerHTML = '<svg viewBox="0 0 16 16" width="20" height="20" style="image-rendering:pixelated">' +
                  '<use href="#px-star"></use></svg>';
    document.body.appendChild(s);
    setTimeout(function(){ s.remove(); }, 720);
  });

  /* ⚠️ 这里原本是 applySeason('spring') —— 写死春天。
     现在改成按真实时间自动判定，且**必须在这里调用**：
     这是脚本的最后一行，buildAnimals 等函数此时才真正有值（见 autoSeason 上的注释）。 */
  applySeason(seasonOf(new Date().getMonth()+1));
  autoSeason();
})();
</script>
<script>${FARM.homeScript}</script>
<script>${MUSIC.script}</script>
${shareScript()}
</body>
</html>`;

const out = path.join(__dirname, '..', 'stardew-maximal-v3.html');
fs.writeFileSync(out, HTML, 'utf8');
console.log('已生成 ' + out + '  (' + (HTML.length / 1024).toFixed(1) + ' KB)');

// ---------- 把内联样式表同步导出一份，给文章页复用 ----------
//
// 文章页在 posts/ 子目录里，没法直接吃主页面里的内联 <style>。
// 单一来源仍然是上面这个内联块 —— 这里只是从已经生成好的 HTML 里
// 把那段原样切出来写一份副本，**不是**第二份需要手工维护的 CSS。
// 改样式只改 gen.js；check.js 会比对两份是否一致，防止有人手改了副本。
const cssText = HTML.slice(HTML.indexOf('<style>') + '<style>'.length, HTML.indexOf('</style>'));
const themePath = path.join(__dirname, '..', 'assets', 'theme.css');
fs.mkdirSync(path.dirname(themePath), { recursive: true });
fs.writeFileSync(themePath,
  '/* 自动生成，请勿手改 —— 源在 build/gen.js 的内联 <style> 块里。\n' +
  '   手工改了下次构建会被覆盖，build/check.js 也会报两份不一致。 */\n' + cssText, 'utf8');
console.log('已同步 assets/theme.css  (' + (cssText.length / 1024).toFixed(1) + ' KB)');

// ---------- 文章页 ----------
// 一条 `node build/gen.js` 构建全站：主页面 + 所有文章页。
// 必须放在 theme.css 之后 —— 文章页要 <link> 它。
try {
  require('./posts.js').build();
  require('./museum.js').build();
  require('./workshop.js').build();
  // 相馆子页：数据已在上方由 gallery-data.js 刷新（本机/云端同一条链），
  // 这里只负责把 build/data/gallery.json 排版成 gallery/index.html。
  require('./gallery.js').build();
  // 404 页：不放这里的话 GitHub Pages 会用它的默认白底页，
  // 从像素农场一脚跨进微软办公室。
  require('./notfound.js').build();
  FARM.build();
  // 分享卡片（og:image）：必须排在 seo.apply 之前 —— seo.js 要按卡片文件
  // 是否真的存在来选图（没出图时它自己退回落差值，不会静默指个空）。
  require('./og.js').render();
  require('./seo.js').apply(path.join(__dirname, '..'));
} catch (e) {
  console.error('⚠️  子页面生成失败（主页面已正常输出）：' + e.message);
  process.exitCode = 1;
}
