// 生成极繁主义星露谷风格主页 v2
// 参考：theperiperi/portfolio-website（高饱和游戏原色 + box-shadow 像素画 + 视差云）
//       LidioMonkey/MyWebPage（星露谷主题：自定义光标 + 跟随鼠标的宠物 + 星星动画）
const fs = require('fs');
const path = require('path');
const { validate, buildSprite, ICONS } = require('./icons.js');
const { toCursorSvg, encode } = require('./cursor.js');
const { brandIcon } = require('./brands.js');
// V20 角色色板（第 3 节）：内联样式的第一段，所有组件只引用这里定义的角色变量。
const PALETTE = require('./palette.js');
const PIXEL = require('./pixel-art.js');
const SKINS = require('./skins.js');
const MUSIC = require('./music.js');
const ALBUMS = require('./album-data.js').load();
const md = require('./md.js');
const { articles, TAG_ICON } = require('./content.js');
const SITE = require('./site.config.js');
const FARM = require('./farm-modules.js');
// 页头（V20 第 6.1 节）与分享脚本：首页与子页共用 subpage.js 的同一份。
const { sitebar, shareScript } = require('./subpage.js');
// 首屏仪表盘（一张主卡 + 状态栏）：dash() 出结构，dashScript() 出交互。
// 2026-09-25 实施，取代首屏的「工具条 + 双栏面板墙」。
const { dash, dashScript } = require('./dash.js');
// 贡献热力图一屏几周：和 refresh-github.js 用同一个常量，免得两边改出分歧。
const { PER_PAGE, pageWindow } = require('./refresh-github.js');
// 精选项目（工坊顶部的「主打」区）。渲染也在那个模块里 ——
// 工坊详情页要用同一份 HTML，各写一遍会长得不一样且不报错。
const { featuredHtml, contribHtml, FEATURED } = require('./projects.js');
// 时刻表行（V20 第 6.7 节）：文章面板、概览「最近写下」与博客列表页（posts.js）共用。
const TT = require('./timetable.js');
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
// 通用面板头（V20 第 6.11 节）：像素 24 的墨色标题，前面一枚 16px 图标。
// 四角饰件、标题两侧的重复图标随 V20 删了，第二个参数从五个装饰图标的数组改为一个图标名。
const panel = (title, icon, inner, id, cls) => `
<section class="panel${cls ? ' ' + cls : ''}"${id ? ` id="${id}"` : ''}>
  <h2 class="pt">${ic(icon || 'star')}${title}</h2>
  ${inner}
</section>`;
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

// 一次构建最多展出多少件。封面是本地文件，多一条多 20KB。
// V20 起书架是网格（第 6.8 节）：封面按自然比例站在木板上，不再垫豆瓣算的主色衬底。
const SHELF_SHOW = 36;

// 主页只放最新几条。2026-09-20 柯西：**时间线独立成页**（posts/index.html
// 就是完整的那条），主页这块退化成"最新文章"预告 —— 3 条 ≈ 半屏，
// 再长就把下面的博物馆/相馆顶出第二屏。全部条目都在 posts/index.html 里，不会丢。
const TL_SHOW = 3;

// 主页展示配置中的三项精选，全部仓库仍在工坊页。
// 全部仓库在 workshop/index.html（「查看更多」入口点进去）。
const REPO_SHOW = 3;

// 工具条 = 真导航。图标要跟按钮语义对得上 ——
// 「日历」配灯笼、「账本」配箱子是配错了，换成 sun / coin。
//
// 原来「最新」「文章」两个按钮分别指向 featured / articles 两个面板；
// 合并成一条时间线后，这两个按钮也就并成一个「时间线」。
// 2026-09-20：时间线独立成页（posts/index.html），这个按钮从页内锚点
// 改成跳转到那一页 —— 它现在指向"完整的那条时间线"。

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
// 一条竖轴串起左手边一排时间戳，右手边是标题、一行摘要与标签（V20 时刻表：行里不放缩略图）。
// 第一项稍大一点（有 .lead 类），因为它是「最近发生的」，但不叫"置顶"。
const timeline = () => {
  // 有时间线内容就渲染真的 —— 本站文章和豆瓣影评在这里是**同一种东西**
  // （都是他写的东西），只用一枚小标签标出来源。
  // 没有内容（数据抓不到 / 还没写过）才退回骨架占位。
  const list = ARTICLES.slice(0, TL_SHOW);
  const card = (a, i) => TT.row(a, i, { href: 'posts/' + a.slug + '.html', lead: i === 0, ic });

  const skeleton = [
    'strawberry', 'pumpkin', 'starfruit', 'eggplant', 'melon', 'cherry',
    'corn', 'grape', 'cauliflower', 'potato', 'tomato', 'blueberry'
  ].slice(0, TL_SHOW).map((n, i) => `
      <li class="tl-item${i === 0 ? ' lead' : ''}">
        <div class="tl-when">
          <b>${slot('title', '34px', '12px')}</b>
          <i>${slot('meta', '28px', '9px')}</i>
        </div>
        <div class="tl-axis"><span class="tl-dot">${ic(n, 'sm')}</span></div>
        <div class="tl-card">
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

  return panel('最新文章', 'sunflower', `
  <div class="tlwrap"><span class="tl-line"></span>
    <ul class="tl">${list.length ? list.map(card).join('') : skeleton}</ul>
  </div>
  <div class="more">${ic('basket')}` +
    (list.length
      ? `<a href="posts/index.html">完整时间线（${ARTICLES.length} 篇）</a>`
      : slot('meta', '140px', '11px')) +
    `${ic('basket')}</div>`, 'timeline');
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
  /* 2026-10-03：主页这块的排序依据从「site.config 里手写的三个名字」换成
     **剔除精选区已展示的、剩下的按最近推送排**。
     原因：精选区（build/projects.js）是手工主打、这张网格是自动补充，
     两者撞上同一个仓库就会在同一个面板里出现两张一样的卡。
     ⚠️ 剔完必须仍凑够 REPO_SHOW 张 —— 池子只剩一两个时不能静默少卡。 */
  // ⚠️ 必须**忽略大小写**再比：projects.js 里的 id 是全小写（musicspace），
  //    而 GitHub 返回的仓库名是驼峰（musicSpace）—— 直接 Set.has(r.name) 比不上，
  //    musicSpace / musicMap 会同时出现在精选区和下面这张网格里，同一面板两张一样的卡。
  const shown = new Set(FEATURED.map((f) => String(f.id).toLowerCase()));
  const pool = all.filter((r) => !shown.has(String(r.name).toLowerCase()));
  const list = pool.slice(0, REPO_SHOW);

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

  /* 贡献热力图。口径是「贡献」不是「提交」—— 含私有的数字 GitHub 只给聚合贡献数，
     commit 明细一律只统计公开仓库，写「提交」会和 GitHub 个人页对不上。
     ⚠️ contributions 缺失时整块不渲染：PR 检查（editor-tests.yml）会拿**仓库里现有的
        旧快照**跑 node build/gen.js，旧快照没有这个字段 —— 不降级 CI 直接红。
     ⚠️ 整年 53 周都要能翻页，不可能每屏都吐一份 HTML：服务端只吐**最新一屏**的格子
        （用 pageWindow 算日期），完整周数据放进数据岛，翻页交给客户端。
        工坊面板本来就藏在 dash tab 后面（无 JS 连面板都看不到），不损失降级能力。 */
  const cb = (src && src.contributions) || null;
  const cblock = (() => {
    const w = cb && Array.isArray(cb.weeks) && cb.weeks.length ? pageWindow(cb.weeks, cb.start, 0, PER_PAGE) : null;
    if (!w) return '';
    // 五档深浅，分界按实测分布定（近一年单日最多 89 次）。
    const lv = (n) => (n <= 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : n < 60 ? 3 : 4);
    const addDays = (date, n) => {
      const t = new Date(date + 'T00:00:00Z');
      t.setUTCDate(t.getUTCDate() + n);
      return t.toISOString().slice(0, 10);
    };
    const cells = [];
    let lastMonth = -1;
    w.rows.forEach((row, r) => {
      row.forEach((n, d) => {
        if (n < 0) return;                                   // 残周补位，这天还不存在
        const date = addDays(cb.start, (w.begin + r) * 7 + d);
        const month = date.slice(5, 7).replace(/^0/, '');
        if (+month !== lastMonth) {                           // 月份分隔条，跨月时插在那一行前面
          cells.push(`<div class="cmonth">${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][+month - 1]}月</div>`);
          lastMonth = +month;
        }
        cells.push(`<div class="ccell lv${lv(n)}" role="img" aria-label="${date} · ${n} 次贡献" ` +
          `data-label="${date.slice(2).replace(/-/g, '.')} · ${n} 次贡献"></div>`);
      });
    });
    const when = (cb.lastActiveAt || '').slice(2).replace(/-/g, '.');
    return `<div class="cblock" id="cblock">
        <p class="chead">${ic('pickaxe', 'sm')}<span class="sfx">近一年 <b>${cb.total}</b> 次贡献</span>` +
      `<span class="sfx">连续活跃 <b>${cb.streak}</b> 天</span>` +
      (when ? `<span class="sfx">最近 <b>${when}</b></span>` : '') + `</p>
        <div class="cbar">
          <button type="button" class="cbtn" data-page="prev" aria-label="看更早的四周" disabled>${ic('play', 'sm')}</button>
          <p class="crange"><span data-from>${w.from.slice(2).replace(/-/g, '.')}</span><span class="cand">至</span><span data-to>${w.to.slice(2).replace(/-/g, '.')}</span></p>
          <button type="button" class="cbtn" data-page="next" aria-label="看更近的四周">${ic('play', 'sm')}</button>
          <p class="cpage"><span data-page-now>1</span><span class="csl">/</span><span data-page-all>${w.pages}</span></p>
        </div>
        <div class="ctable">
          <div class="cdow" aria-hidden="true">${['日', '一', '二', '三', '四', '五', '六'].map((d) => `<span>${d}</span>`).join('')}</div>
          <div class="cgrid" data-cgrid role="img" aria-label="贡献热力图">${cells.join('')}</div>
        </div>
        <div class="ctip" data-ctip aria-hidden="true"></div>
        <p class="cnote">含私有与组织仓库 · 每日更新 · 悬浮或方向键翻看每一天</p>
      </div>
      <script id="cblock-data" type="application/json">${JSON.stringify({ start: cb.start, perPage: PER_PAGE, weeks: cb.weeks })}</script>`;
  })();

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

  return panel('工坊', 'chest',
    /* 面板结构（2026-10-03 起）：
       ① 精选项目（手工主打，带封面/角色/成果）
       ② 开源贡献（别人仓库里提的 PR，虚线框、视觉弱一档）
       ③ 最近推送的仓库（自动，与①不重复）
       ④ 贡献热力图 —— 「在持续写」的证据 ⑤ 汇总行 + 查看更多入口
       ⚠️ 精选放在最前是柯西 2026-09-16「代码仓库放最上面」那条要求的延伸：
         最上面那块应该是**最能说明问题**的东西，而仓库名 + 语言说明不了什么。 */
    `${featuredHtml()}${contribHtml()}<div class="rgrid">${list.length ? list.map(card).join('') : blank(6)}</div>${cblock}${foot}${more}`, 'projects');
};

/* 贡献热力图交互：‹ › 翻页 + 悬浮/方向键看某一天。
   ⚠️ 客户端只做「窗口起始日 + 序号」这一件事（一个窗口内的日期是连续的），
      翻页的起止区间一律不在这里重算 —— 那是 pageWindow() 的活，别处再抄一遍就会
      出现"标签和格子对不上"而且**没有报错**。
   ⚠️ 格子用漫游 tabindex：整张图只占一个 Tab 停点，方向键在格间移动。
      否则 28 个格子会把键盘用户堵死在 Tab 键里。 */
function cblockScript() {
  return `<script>
(function(){
  var box=document.getElementById('cblock');if(!box)return;
  var island=document.getElementById('cblock-data');if(!island)return;
  var data;try{data=JSON.parse(island.textContent)}catch(e){return}
  if(!data||!Array.isArray(data.weeks)||!data.weeks.length)return;
  var per=data.perPage||4,total=data.weeks.length,
      pages=Math.max(1,Math.ceil(total/per)),cur=0,rove=0;
  var grid=box.querySelector('[data-cgrid]'),prev=box.querySelector('[data-page="prev"]'),
      next=box.querySelector('[data-page="next"]'),tip=box.querySelector('[data-ctip]');
  var MON=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
  var addDays=function(s,n){var t=new Date(s+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
  var short=function(s){return s.slice(2).replace(/-/g,'.')};
  var lv=function(n){return n<=0?0:n<10?1:n<30?2:n<60?3:4};
  function paint(){
    var end=Math.max(per,total-cur*per),begin=Math.max(0,end-per),
        rows=data.weeks.slice(begin,end),html=[],month=-1;
    for(var r=0;r<rows.length;r++)for(var d=0;d<7;d++){
      var n=rows[r][d];if(n<0)continue;
      var date=addDays(data.start,(begin+r)*7+d),m=+date.slice(5,7);
      if(m!==month){html.push('<div class="cmonth">'+MON[m-1]+'月</div>');month=m}
      html.push('<div class="ccell lv'+lv(n)+'" role="img" aria-label="'+date+' · '+n+' 次贡献" data-label="'+short(date)+' · '+n+' 次贡献"></div>');
    }
    grid.innerHTML=html.join('');
    var first=begin*7+rows[0].findIndex(function(x){return x>=0}),
        lastRow=rows[rows.length-1],off=6;while(off>=0&&lastRow[off]<0)off--;
    var from=short(addDays(data.start,first)),to=short(addDays(data.start,(end-1)*7+off));
    box.querySelector('[data-from]').textContent=from;
    box.querySelector('[data-to]').textContent=to;
    box.querySelector('[data-page-now]').textContent=cur+1;
    box.querySelector('[data-page-all]').textContent=pages;
    prev.disabled=cur>=pages-1;next.disabled=cur<=0;
    grid.setAttribute('aria-label','贡献热力图 '+from+' 至 '+to+'，第 '+(cur+1)+' / '+pages+' 屏');
    rove=0;roving();hide();
  }
  function realCells(){return Array.prototype.filter.call(grid.children,function(el){return el.classList.contains('ccell')})}
  function roving(){
    var cells=realCells();if(!cells.length)return;
    var at=Math.min(Math.max(0,rove),cells.length-1);rove=at;
    for(var i=0;i<cells.length;i++)cells[i].tabIndex=i===at?0:-1;
  }
  function show(cell){
    tip.textContent=cell.getAttribute('data-label');tip.classList.add('on');
    var b=box.getBoundingClientRect(),c=cell.getBoundingClientRect(),t=tip.getBoundingClientRect();
    var left=Math.max(0,Math.min(c.left-b.left+c.width/2-t.width/2,b.width-t.width)),
        top=c.top-b.top-t.height-4;
    if(top<0)top=c.bottom-b.top+4;
    tip.style.left=Math.round(left)+'px';tip.style.top=Math.round(top)+'px';
  }
  function hide(){tip.classList.remove('on')}
  grid.addEventListener('mouseover',function(e){var c=e.target.closest('.ccell');if(c)show(c)});
  grid.addEventListener('mouseleave',hide);
  grid.addEventListener('focusin',function(e){
    var c=e.target.closest('.ccell');if(!c)return;
    rove=realCells().indexOf(c);roving();show(c);
  });
  grid.addEventListener('focusout',hide);
  grid.addEventListener('keydown',function(e){
    var s=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:e.key==='ArrowDown'?7:e.key==='ArrowUp'?-7:0;
    if(!s)return;
    e.preventDefault();
    var cells=realCells();if(!cells.length)return;
    rove=Math.min(Math.max(0,rove+s),cells.length-1);roving();cells[rove].focus();show(cells[rove]);
  });
  prev.addEventListener('click',function(){if(cur<pages-1){cur++;paint()}});
  next.addEventListener('click',function(){if(cur>0){cur--;paint()}});
  window.addEventListener('resize',hide);
  paint();
})();
</script>`;
}

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
  return panel('相馆', 'star', `
  <div class="gstrip">${items.map(cell).join('')}</div>
  <div class="museum-more">${ic('star', 'sm')}<a href="gallery/index.html">相馆 · 全部 ${GALLERY.count} 张</a>${ic('heart', 'sm')}</div>`, 'gallery');
};

const seasonPanel = () => panel('季节日历', 'sun', FARM.calendar(), 'calendar');

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

  // 等级条（V20 第 6.11 节）：轨道浮起色、填充线路色；语言名与数值都是像素 12。
  const row = (l) => {
    const pct = Math.round(l.percent * 1000) / 10;
    return `
      <li>
        <em>${md.esc(l.name)}</em>
        <span class="tbar"><b style="width:${Math.max(pct, 3)}%"></b></span>
        <u>${pct}%</u>
      </li>`;
  };

  const blank = (n) => Array.from({ length: n }, (_, i) => `
      <li>${slot('title', '48px', '12px')}
        <span class="tbar"><b style="width:${70 - i * 9}%"></b></span><u>${slot('meta', '26px', '11px')}</u></li>`).join('');

  const inner = langs.length
    ? `<ul class="stack">${langs.map(row).join('')}</ul>
       <div class="gfoot">${ic('gem', 'sm')}<span class="sfx">代码构成 · 按字节数统计</span></div>`
    : `<ul class="stack">${blank(5)}</ul>`;

  return panel('专精', 'gem', inner, 'skills');
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

  return panel('友情站', 'fence', `<div class="rgrid fgrid">${list.map(card).join('')}</div>`, 'friends');
};

const farmPanel = () => panel('收获农场', 'tree', FARM.harvest(FARM.load()), 'farm');

// ---------- 博物馆（豆瓣书影音） ----------
//
// V20 起是一面书架（第 6.8 节）：网格格子并排、封面贴底站在木板上，相邻木板连成一整条搁板。
// 选了「真实封面」方案（另有像素书脊方案，判定后放弃 —— 见 素材说明.md）：
// 封面在构建时下载到 assets/covers/，页面引用本地文件。
// ⚠️ 代价：站点不再是「一个自包含 HTML」，多了 assets/covers 这个文件夹要一起传。
//
// 三个做过决定的细节：
// 1. **封面保持自然比例，一张都不裁**（F15）：书封/海报 2:3、音乐方图、游戏图比例随意，
//    宽度铺满格子、高度随图，不加底板、边框和阴影。
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
    const stars = it.myRating
      ? '★'.repeat(it.myRating) + '☆'.repeat(5 - it.myRating) : '';
    // 说明固定两行（V20 第 6.8 节）：标题一行；第二行只有一个 .m —— 星级（有评分时）+ 第一个非空的
    // 艺人／时长等元信息／看过·日期／来源。两行各 22px，同一行的格子天然等高，不写死高度。
    const line2 = it.artist || it.meta || (it.verb ? it.verb + ' · ' + (it.date || '—') : '') || it.source || '';
    return `
      <li class="exc" style="--i:${i}" data-kind="${it.kind}"${initiallyVisible.has(it) ? '' : ' hidden'}>
        <a href="${md.esc(it.url)}" target="_blank" rel="noopener" title="${md.esc(it.comment || it.title)}">
          ${image ? `<span class="poster"><img src="${md.esc(image)}" alt="${md.esc(it.title)}" loading="lazy" referrerpolicy="no-referrer"></span>` : ''}
          <span class="tx">
            <b class="t">${it.icon ? ic(it.icon, 'xs') : ''}${md.esc(it.title)}</b>
            <i class="m">${stars ? `<span class="st">${stars}</span>` : ''}${md.esc(line2)}</i>
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

  return panel('博物馆', 'gift', inner, 'museum');
};


// ---------- 网站底部：留言板 + 页脚站台（V20 第 6.13 节）----------
// 柯西 2026-09-16 要求「在网站底部做一个访问量统计，以及底部评论区」。
// 评论区**复用 posts.js 里那份渲染逻辑**（它是唯一来源，别再抄一份）——
// 两处各写一遍的话，以后换评论服务就会漏改一处，而且很难发现。
// 旧页脚（草地、土、19 枚图标游行、点线、金色空槽）与院子、藤柱都删了：
// 图标进了快捷栏，每格都是一个真实入口；季节花箱与小鸡（N02）放在快捷栏两侧。
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
  }), '', { current: 1, extras: { left: FARM.planter(), right: FARM.pet() } }
);

// 站台第一块：实时时钟 + 问候 + 日期/季节/昼夜 + 写作台入口。
// 时钟跑数、深链与女孩行走都由 dash.js 的 dashScript 负责，这里只出结构
// （样式走 pixel-art.js 的 .clock / .greet / .side-acts）。
// V20：分享移到页头（每页只有一枚），邮箱只在招牌的联系徽章里 —— 这也修掉了旧状态栏里「邮箱」按钮的溢出。
// 时钟像素 36、问候阅读 14（直接写整句，不打字）、日期·季节·昼夜像素 12；写作台是整宽的站牌主按钮（第 6.6 节）。
const statusPanel = () =>
  panel('状态', 'lantern',
    '<div class="clock" id="dash-clock">--<b>:</b>--<b>:</b>--</div>' +
    '<p class="greet" id="dash-greet"></p>' +
    '<p class="greet" id="dash-meta"></p>' +
    '<div class="side-acts">' +
    `<a class="abtn" href="write/index.html">${ic('book')}<span>写作台</span></a>` +
    '</div>', 'status');

// 概览（V20 第 6.10 节）：第一个元素必须是 <section id="board"> —— dash.js 的 anchorOf() 取 html 里第一个 id，
// 旧深链 #board 由此继续指向概览。计数是**一张**三段车票（不是三张并列的卡），图标、数字与链接沿用旧招牌。
// 「最近写下」是两行时刻表（不加 .lead）；没有文章时整块不渲染。这条线不在 #timeline 里，
// check-timeline.js 因此只量 #timeline .tl-line。
const overview = () => {
  const recent = ARTICLES.slice(0, 2);
  return `<section class="panel" id="board">
  <h2 class="pt">${ic('star')}概览</h2>
  <nav class="ticket counts" aria-label="内容概览">
    <a href="posts/index.html">${ic('book', 'sm')}<b>${ARTICLES.length}</b><span>篇文章</span></a>
    <a href="museum/index.html">${ic('star', 'sm')}<b>${(DOUBAN.items || []).length + (GAMES.games || []).length + ALBUMS.items.length}</b><span>件馆藏</span></a>
    <a href="gallery/index.html">${ic('flower', 'sm')}<b>${GALLERY.count || 0}</b><span>张图像</span></a>
  </nav>
  ${recent.length ? `<h3 class="ov-h">${ic('wateringcan')}最近写下</h3>
  <div class="tlwrap tl-mini"><span class="tl-line"></span><ul class="tl">${recent.map((a, i) => TT.row(a, i, { href: 'posts/' + a.slug + '.html', ic })).join('')}</ul></div>` : ''}
</section>`;
};

const HTML = `<!DOCTYPE html>
<html lang="zh-CN" data-season="spring" data-time="day">
<head>
<meta charset="utf-8">
${SKINS.bootScript()}
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="importmap">{"imports":{"three":"./assets/toon/vendor/three/three.module.js","three/addons/":"./assets/toon/vendor/three/addons/"}}</script>
<title>${md.esc(SITE.name)} · 个人主页</title>
<!-- 像素字体的 @font-face 在根目录的 font.css 里，不在下面的内联样式块 ——
     原因见该文件开头的注释（CSS 的 url() 相对 CSS 文件解析，文章页在子目录会 404）。
     2026-09-15 夜之前它一直是注释状态，等于整站在用 Courier New 回退。 -->
<link rel="stylesheet" href="font.css">
<style>
${PALETTE.css()}
/* ===== 字体（说明位，真正的接入在根目录 font.css） =====
   Fusion Pixel Font 12px proportional zh_hans，OFL-1.1，可子集化。
   不用 Zpix：授权禁止转换格式与子集化，只能整包挂 ttf（2 万+ 字）。
   ⚠️ 颜色不在这里定义：全部角色变量与旧名映射由上一段 PALETTE.css() 生成（build/palette.js）。
      这一块只留非颜色令牌 —— check-spacing.js 读源码里第一个行首的 :root 块，它必须还在。 */
:root{
  --pix:'FusionPixel','Zpix','Silkscreen',"Courier New",ui-monospace,monospace;
  /* 阅读字（V20 第 4 节）：会折行或被截断的描述、文章正文用它；像素字只写一行以内的招牌类信息。 */
  --read:"PingFang SC","HarmonyOS Sans SC","MiSans","Microsoft YaHei UI","Microsoft YaHei",system-ui,sans-serif;
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
*{box-sizing:border-box}
/* 纸色同时铺在 html 上：画布底色由根元素决定，只写 body 的话页面底部以下
   夜里会露出 color-scheme:dark 的黑画布、白天露出白画布。 */
html{scroll-behavior:smooth;background:var(--paper)}
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
  /* V20：纸色实底，删掉渐变天空与 0.8 秒配色过渡 —— 昼夜切换时过渡会让深字压深底（第 3.6 节） */
  background:var(--paper); min-height:100vh; overflow-x:hidden;
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
button,a,.tag,.tool,.cbtn,.soc,summary,.copy-code,.tl-card,.rcard,.gal-card,
.sbtn,.share-btn,.music-seek{cursor:url("${CUR_B}") 0 0, pointer}

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

/* 搪瓷徽章（V20 第 3.5 节）：2px 控件边 + 面色 + 2px 实色落影；悬停浮起色，按下见 pixel-art.js 合并的 :active，
   选中（.on）用站牌色。.cbtn 现在只剩热力图翻页键（外观设置里的季节／昼夜键随 V20 删了），材质只写在这一处。 */
.cbtn{display:flex;flex-direction:column;align-items:center;gap:2px;
  background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);
  padding:5px 8px;font-family:inherit;color:var(--ink);
  /* ⚠️ 必须显式给 .cbtn 写 font-size：<button> 的 UA 默认样式是 13.3333px，
     只给里面的 em 写 12px 管不住按钮本身。13.3333 实测是全场最糊的一档
     （36 种颜色）。 */
  font-size:12px;
  /* min-width：昼夜按钮只有一个图标 +「昼」字（列排），实测只有 12px 宽 ——
     手指点不中。32px 也让它跟旁边带文字的四季按钮对齐（2026-09-21）。 */
  min-width:32px;
  transition:transform .1s steps(2),background .15s}
.cbtn.on{background:var(--plate);color:var(--on-plate);border-color:var(--plate)}
.cbtn em{font-style:normal;font-size:12px}

/* 招牌里的联系徽章（V20 第 6.3 节）：品牌图标沿用 brands.js，放不下时折行。 */
.social{display:flex;gap:8px;flex-wrap:wrap}
/* 联系徽章是搪瓷徽章（V20 第 3.5 节）：40px 高；悬停浮起色（pixel-art.js），按下见那里合并的 :active。
   ⚠️ 焦点框不再单写：全局 :focus-visible 的墨色框对所有底色都 ≥4.5:1（原来的 --gold 框映射后几乎看不见）。 */
.soc{display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 12px;text-decoration:none;
  background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);color:var(--ink);
  transition:transform .1s steps(2),background .15s}
.soc em{font-style:normal;font-size:12px;line-height:24px;white-space:nowrap}
.soc .bico{width:20px;height:20px;flex:0 0 20px;display:block}
/* 可复制的（邮箱 / 微信）：本质是 <button>，得把浏览器默认样式全部抹掉，
   否则会出现系统灰底和默认字体，跟旁边两枚徽章不是一套皮。 */
button.soc{font:inherit}
button.soc .soc-in{display:flex;align-items:center;gap:8px}
/* 账号未填的先显示成不可点状态，明显区别于可点的 */
.soc.todo{opacity:.45;filter:grayscale(.7);cursor:not-allowed}
/* 招牌底部的「号码提示条」：点邮箱/微信后就地弹出来，不用跳转。
   固定贴在地图上方居中，不参与布局（避免把招牌顶高，触发布局检查）。 */
.contact-tip{position:fixed;left:50%;bottom:66px;transform:translateX(-50%) translateY(8px);
  z-index:400;display:flex;align-items:center;gap:8px;
  background:var(--surface);color:var(--ink);border:2px solid var(--edge);
  box-shadow:var(--lift);padding:9px 12px;
  font-size:12px;letter-spacing:.4px;white-space:nowrap;
  opacity:0;pointer-events:none;transition:opacity .14s,transform .14s}
.contact-tip.on{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.contact-tip b{font-size:12px;font-weight:700;letter-spacing:.6px;
  background:var(--raised);border:2px solid var(--edge);padding:3px 7px;user-select:all}
.contact-tip span{color:var(--ink-2)}

/* 键盘焦点：全局兜底（2026-09-21）。
   此前只有 6 条选择器写了品牌化焦点样式（社交图标 / 工具按钮 / 宠物 / 音乐），
   其余 15 个类名的可点元素 —— 时间线卡片、项目卡、相馆图、配色按钮、返回农场、
   筛选标签、日历季节按钮 —— 只能吃浏览器默认的蓝框：跟木色像素边框不搭，
   而且在深浅两种底色上不一定看得清。
   用 var(--ink)：四季与夜里都定义过，且始终与所在那层底色成对比（check-colors 守着）。
   ⚠️ 放在这里只是便于集中阅读，CSS 顺序不影响结果 —— 具体选择器（如 .tool:focus-visible）
   优先级更高，会赢过这条兜底。 */
:focus-visible{outline:3px solid var(--ink);outline-offset:2px}

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
/* 纸卡（V20 第 3.5 节）：面色 + 1px 细线 + --lift（浅色板 2px 硬投影，深色板灯笼色内高光）。
   只有一层边：旧的 4px 墨框、内框、外投影、奶油横纹、挂钉都删了。面板材质只写在这一处。 */
.panel{position:relative;background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift);
  padding:var(--s6);margin-bottom:var(--s8)}
/* 面板头（V20 第 6.11 节）：墨色像素 24／32 的招牌字，前面一枚 16px 图标；不加木牌底、不加粗（像素字假粗体会糊）。
   ⚠️ 这里千万不能写 font:inherit 简写（注意别在注释里打反引号，
   这段 CSS 活在一个 JS 模板字符串里，一个反引号就能把整段字符串提前收掉）——
   font 简写会连 font-size 一起重置。只能单点写 font-family。 */
.pt{display:flex;align-items:center;gap:var(--s3);width:fit-content;max-width:100%;margin:0 0 var(--s6);padding:0;
  color:var(--ink);font-family:inherit;font-size:24px;line-height:32px;font-weight:normal}

/* ===== 时刻表（V20 第 6.7 节：文章面板、概览「最近写下」、博客列表页共用）=====
   列：日期 ｜ 轴线站点 ｜ 标题块 ｜ 箭头。.tl-line 是贯穿各行的 4px 线路色竖线（与线路图同一条线），
   left = 日期列 + 栏距 16 + 轴列一半 12 − 线宽一半 2，日期列变宽变窄时线始终穿过站点中心。
   ⚠️ 轴是**真实元素**（.tl-line），不是 ::before：build/check-timeline.js 要量「轴心 vs 站点中心」的偏差。
   ⚠️ 显式网格：删列里的元素必须同步改列定义（display:none 不占格位，2026-09-21 手机空条的根因）。
   行里不放封面；日期列所有宽度都显示（日期是时刻表的第一列）。
   z-index：竖线压在悬停行的浮起底色之上，站点又压在竖线之上，整行的透明点击层在最上面。 */
.tlwrap{position:relative;--tl-date:72px}
.tl{list-style:none;margin:0;padding:0}
.tl-line{position:absolute;z-index:1;left:calc(var(--tl-date) + 26px);top:var(--s4);bottom:var(--s4);width:4px;background:var(--rail)}
.tl-item{position:relative;display:grid;grid-template-columns:var(--tl-date) 24px minmax(0,1fr);column-gap:var(--s4);align-items:start}
.tl-item+.tl-item{border-top:1px solid var(--line)}
.tl-item:hover,.tl-item:focus-within{background:var(--raised)}
.tl-when{display:flex;flex-direction:column;align-items:flex-end;padding-top:var(--s2)}
.tl-when b{display:block;font-size:24px;line-height:32px;font-weight:normal;color:var(--tx-em);font-variant-numeric:tabular-nums}
.tl-when i{display:block;font-style:normal;font-size:12px;line-height:24px;color:var(--tx-3)}
.tl-axis{position:relative;z-index:1;display:flex;justify-content:center;padding-top:var(--s3)}
.tl-dot{display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:var(--surface);border:2px solid var(--rail)}
.tl-card{display:grid;grid-template-columns:minmax(0,1fr) 16px;gap:var(--s4);align-items:center;padding:var(--s3) var(--s4);
  text-decoration:none;color:inherit}
/* 整行可点：透明层把链接的可点区域铺满整行（相对 .tl-item 定位） */
.tl-card::after{content:'';position:absolute;z-index:2;inset:0}
.tl-body{display:flex;flex-direction:column;gap:var(--s1);min-width:0}
.tl-title{display:block;font-family:var(--read);font-size:16px;line-height:26px;font-weight:600;color:var(--ink)}
.tl-exc{margin:0;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-tags{display:flex;flex-wrap:wrap;gap:var(--s1);margin-top:var(--s1)}
/* 标签是像素 12 芯片：浮起色底、无边框、标签色字；图标（TAG_ICON）与字之间留 4px。 */
.tl-tag{display:inline-flex;align-items:center;gap:4px;padding:0 6px;font-size:12px;line-height:24px;
  background:var(--raised);color:var(--tx-tag)}
.tl-item:hover .tl-tag,.tl-item:focus-within .tl-tag{background:var(--surface)}
.tl-go{transition:transform .12s steps(2)}
.tl-item:hover .tl-go{transform:translateX(4px)}
/* 最近一篇稍大：它是「最近发生的」，不是「置顶的」，只把标题放大一档 */
.tl-item.lead .tl-title{font-size:18px;line-height:28px}
/* ===== 页脚站台（V20 第 6.13、6.14 节）=====
   直接放在纸色上、不是卡片。.platform / .platform-row / .hotbar 三层都不加左右内边距和边框：
   761px 视口的内容宽只有 713，10 格一行要 712（10 × 64 + 9 × 8），多 1px 就撑出横向滚动。
   格宽上限 64、可以缩：有 16px 占位滚动条时 761–775px 窗口每格缩到约 62.5px，而不是撑出页面。
   ≤760（下一条 @media）快捷栏排 5 × 2、致谢与车票纵排；≤430 车票数字降到 12（第 6.10 节那个 @media 块）。 */
.platform{margin-top:var(--s8)}
/* 铁轨：上下两条 2px 控件边钢轨 + 木色枕木，舞台之外唯一的风景元素 */
.platform-rail{height:16px;margin-bottom:var(--s6);border-top:2px solid var(--edge);border-bottom:2px solid var(--edge);
  background:repeating-linear-gradient(90deg,var(--wood) 0 8px,transparent 8px 24px)}
.platform-bar{display:grid;grid-template-columns:1fr auto 1fr;grid-template-areas:"l bar r";align-items:end;gap:var(--s4)}
.platform-bar>.planter{grid-area:l;justify-self:start}
.platform-bar>.hotbar{grid-area:bar}
.platform-bar>.pet{grid-area:r;justify-self:end}
/* ≤1080：快捷栏独占第一行，花箱与小鸡同排在它下方（一行至少约 900px，768 档放不下三块） */
@media (max-width:1080px){.platform-bar{grid-template-columns:1fr 1fr;grid-template-areas:"bar bar" "l r"}}
.hotbar{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,64px);gap:var(--s2);justify-content:center}
/* 快捷栏格：物品栏格子（面色底、2px 控件边、下沿一道浮起色），名称常显；当前页那格用站牌色 */
.hb{display:flex;flex-direction:column;align-items:center;justify-content:center;height:64px;min-width:0;
  background:var(--surface);border:2px solid var(--edge);box-shadow:inset 0 -4px 0 var(--raised);
  color:var(--ink);text-decoration:none;font-size:12px;line-height:24px;white-space:nowrap}
.hb:hover{background:var(--raised)}
.hb[aria-current="page"]{background:var(--plate);color:var(--on-plate);border-color:var(--plate);box-shadow:none}
.ic.x2{width:32px;height:32px}
/* ≤360：2px 边框的纵向弹性盒，2 + 16 + 24 + 2 = 44 正好装下图标与名称（第 6.13 节 v5，评审 S4） */
@media (max-width:360px){.hb{height:44px}.hb .ic{width:16px;height:16px}}
.platform-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--s4);margin-top:var(--s6)}
/* 访客车票：放在纸色上，缺口色是纸色；文字像素 12、次墨，数字像素 24、强调色 */
.platform .ticket{--notch:var(--paper);margin:0;padding:var(--s2) var(--s4);font-size:12px;line-height:24px;color:var(--ink-2)}
.platform .ticket b{font-size:24px;line-height:32px;font-weight:normal;color:var(--mark)}
/* 致谢靠右：车票还没回填（或离线不出现）时也不跑到左边 */
.site-links{margin:0 0 0 auto;text-align:center;font-size:12px;line-height:24px;color:var(--ink-2)}
.site-links a{color:var(--tx-link);text-underline-offset:4px;white-space:nowrap}
@media (max-width:760px){
  .tlwrap{--tl-date:64px}
  .hotbar{grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr))}
  .platform-meta{flex-direction:column}.site-links{margin:0}
  .contact-tip{bottom:22px;max-width:calc(100vw - 24px)}
}
.ov-h{display:flex;align-items:center;gap:var(--s2);margin:0 0 var(--s2);font-size:12px;line-height:24px;font-weight:normal;color:var(--ink-2)}
.more{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--s4)}
.more a{color:inherit;text-decoration:none;font-size:12px;
  border-bottom:2px solid var(--rail);padding-bottom:1px}
.more a:hover{background:var(--raised)}

/* ===== 仓库卡与友链卡（V20 第 6.9、6.11 节）=====
   首页工坊固定 3 个仓库：**显式** 3 列（auto-fill 会在 1920 屏多出空的第 4 列）；友情站 2 列；≤760 都单列。
   卡片是纸卡：名称像素 12（仓库名每天从 GitHub 同步、长度没有上限，所有宽度都用 12）、简介阅读 14 两行截断。 */
.rgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s4)}
/* 友情站网格：友链卡没有语言色点和日期，两列比工坊的三列透气 */
.fgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
.rcard{display:flex;flex-direction:column;gap:var(--s2);padding:var(--s4);text-decoration:none;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift);transition:background .12s}
.rcard:hover{background:var(--raised)}
.rcard.blank{background:var(--raised)}
.rc-h{display:flex;align-items:center;gap:var(--s2)}
.rc-h b{font-size:12px;line-height:24px;font-weight:normal;word-break:break-all}
.rc-d{margin:0;min-height:44px;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rc-f{display:flex;align-items:center;gap:var(--s2);margin-top:auto;padding-top:var(--s2);border-top:1px solid var(--line);
  font-size:12px;line-height:24px;color:var(--ink-2)}
/* 语言色块是 GitHub 给的语言色（信息），8×8 方块 */
.rc-l{width:8px;height:8px;flex:none}
.rc-f em{font-style:normal}
.rc-none{color:var(--ink-2)}
.rc-t{margin-left:auto;font-variant-numeric:tabular-nums}
.rfoot{display:flex;align-items:center;justify-content:flex-start;gap:var(--s2);margin-top:var(--s4);font-size:12px;line-height:24px;color:var(--ink-2)}

/* 专精面板底部的「代码构成」说明。次要文字一律靠颜色降级（--ink-2），不靠透明度（V20 第 4 节）。 */
.gfoot{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:2px;font-size:12px;color:var(--ink-2)}
.rfoot .sfx,.gfoot .sfx{letter-spacing:.4px}

/* 工坊·贡献热力图：可翻页（‹ › 换四周）+ 悬浮/方向键看某一天。
   ⚠️ **不新增宽度档位** —— 断点预算是精确棘轮，一律用 width:min() 流式收放。
   ⚠️ 深浅用线路色 --rail 加透明度调，不引入新颜色 token；11 套色板各自定义 --rail，这里自动跟随，不写夜间规则。
      浅档要能跟面板底拉开 3:1 的对比度（WCAG 1.4.11），check-colors.js 逐套核算。 */
.cblock{margin-top:16px;text-align:center;position:relative}
.chead{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:7px;margin:0;font-size:12px;letter-spacing:.4px;color:var(--ink-2)}
.chead b{font-weight:500;color:var(--rail);font-variant-numeric:tabular-nums}
.chead .sfx{white-space:nowrap}
.chead .sfx+.sfx::before{content:'·';margin-right:7px}
.cbar{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin:12px 0 6px;font-size:12px}
/* 翻页键的材质（搪瓷徽章）写在上面外观设置那条 .cbtn 里，这里只管几何。 */
.cbtn{display:flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;padding:0}
  /* ⚠️ 这里以前写着 cursor:pointer —— 它是「.cbtn」（0,1,0），比文件前面那条
     可点态像素光标规则「button,…,.cbtn」（同为 0,1,0）**出现得更晚**，于是赢下级联，
     季节/昼夜/翻页这几个按钮悄悄变回系统箭头。base 的 button 规则已经给了像素光标，
     这里必须留空。守门：build/check-cursor.js 第 3 条（不许有裸 cursor:pointer）。 */
.cbtn:not(.on):hover:not(:disabled){background:var(--raised)}
.cbtn:focus-visible{outline:2px solid var(--rail);outline-offset:1px}
.cbtn:disabled{opacity:.35;cursor:default;box-shadow:none}
.cbtn[data-page="prev"] .ic{transform:scaleX(-1)}
.crange{margin:0;display:flex;align-items:center;gap:5px;font-variant-numeric:tabular-nums;letter-spacing:.4px;color:var(--ink-2)}
.cpage{margin:0;color:var(--ink-2);font-variant-numeric:tabular-nums}
.ctable{width:min(238px,100%);margin:0 auto}
.cdow{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px;font-size:12px;color:var(--ink-2)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.cmonth{grid-column:1/-1;margin:7px 0 2px;font-size:12px;text-align:left;color:var(--ink-2)}
.cmonth:first-child{margin-top:0}
/* 残周补位的那天（-1，还不存在）**不渲染**：末尾那列自然空着，
   和补一个透明占位格一模一样，却省掉一类死规则。 */
/* 色阶（V20 第 6.9 节）：空格子浮起色，有贡献的格子是线路色叠 .76／.84／.92／1 —— 最浅一档在 11 套色板上对面色都 ≥3:1。 */
.ccell{aspect-ratio:1;background:var(--raised);outline:0}
.ccell.lv1{background:var(--rail);opacity:.76}
.ccell.lv2{background:var(--rail);opacity:.84}
.ccell.lv3{background:var(--rail);opacity:.92}
.ccell.lv4{background:var(--rail)}
.ccell:focus-visible{box-shadow:0 0 0 2px var(--rail)}
/* 悬停提示是票据材质（V20 第 3.5 节）：浮在任意内容上，不挖缺口。 */
.ctip{position:absolute;z-index:5;left:0;top:0;padding:3px 6px;font-size:12px;white-space:nowrap;pointer-events:none;
  color:var(--ink);background:var(--surface);border:2px solid var(--edge);box-shadow:var(--lift)}
.ctip:not(.on){display:none}
.cnote{margin:var(--s2) 0 0;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2)}

/* 专精：语言构成条（V20 第 6.11 节）。名称像素 12 墨色、等级条 8px（轨道浮起色、填充线路色）、数值像素 12 次墨。 */
.stack{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.stack li{display:flex;align-items:center;gap:var(--s3);padding:var(--s2) 0;border-bottom:1px solid var(--line)}
.stack em{font-style:normal;font-size:12px;line-height:24px;min-width:96px;color:var(--ink)}
.tbar{flex:1;height:8px;background:var(--raised)}
.tbar b{display:block;height:100%;background:var(--rail)}
.stack u{text-decoration:none;font-size:12px;line-height:24px;min-width:48px;text-align:right;color:var(--ink-2);font-variant-numeric:tabular-nums}


/* ===== 相馆 ===== */
/* 等高一条排：主页只做缩略陈列（高 96px = 12 的倍数，宽按原始比例），
   **不裁图** —— 裁剪是子页灯箱之外唯一会破坏构图的事。
   flex-wrap 兜底：窄屏摆不下就折行，绝不用 overflow-x 把照片藏进滚动条。 */
.gstrip{display:flex;gap:var(--s4);flex-wrap:wrap;justify-content:flex-start;align-items:flex-start}
/* 每张缩略图是一张纸卡细边的相纸（V20 第 6.11 节），底边留宽一点；说明在 title 里，悬停／聚焦时出现。 */
.gstrip .gp{display:block;line-height:0;padding:var(--s1) var(--s1) var(--s3);
  background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift);
  transition:transform .12s steps(2),background .12s}
.gstrip .gp:hover{transform:translateY(-4px);background:var(--raised)}
.gstrip img{height:120px;width:auto;display:block;image-rendering:auto}

/* ===== 车票（V20 第 3.5 节）：面色 + 2px 控件边，左右各一个 6×8 方形缺口 =====
   缺口用伪元素画两块与底色相同的小方块盖住边框，不用 clip-path —— clip-path 会连同车票里
   链接的焦点框一起裁掉。--notch 是车票所在的底色（首页主栏卡里是面色）。 */
.ticket{position:relative;--notch:var(--surface);background:var(--surface);border:2px solid var(--edge)}
.ticket::before,.ticket::after{content:'';position:absolute;top:50%;width:6px;height:8px;margin-top:-4px;background:var(--notch)}
.ticket::before{left:-2px}.ticket::after{right:-2px}
/* 概览计数（第 6.10 节）：一张车票三段，撕线分隔；z-index 让段落的焦点框画在缺口之上。 */
.counts{display:flex;margin:0 0 var(--s6)}
.counts>a{flex:1;position:relative;z-index:1;display:flex;align-items:baseline;justify-content:center;gap:var(--s2);
  padding:var(--s3) var(--s4);color:var(--ink-2);text-decoration:none;font-size:12px;line-height:24px}
.counts>a+a{border-left:1px dashed var(--edge)}
.counts b{font-size:24px;line-height:32px;font-weight:normal;color:var(--mark)}
.counts>a:hover span{text-decoration:underline;text-underline-offset:4px}
/* ≤430（第 6.7、6.10 节）：车票三段竖排；时刻表收紧非正文列、去掉箭头列，390 屏标题列还有约 220px。 */
@media (max-width:430px){
  .counts{flex-direction:column}.counts>a+a{border-left:0;border-top:1px dashed var(--edge)}
  .tlwrap{--tl-date:48px}
  .tl-when b{font-size:12px;line-height:24px}
  .tl-item{grid-template-columns:var(--tl-date) 16px minmax(0,1fr);column-gap:var(--s2)}
  .tl-line{left:calc(var(--tl-date) + 14px)}
  .tl-dot{width:16px;height:16px}
  .tl-card{grid-template-columns:minmax(0,1fr);padding:var(--s2) var(--s3)}
  /* 带上 .tl-card 前缀：svg.ic{display:block}（0,1,1）比单个类名高，单写 .tl-go 藏不掉箭头 */
  .tl-card .tl-go{display:none}
  /* 页脚访客车票：五位浏览量 + 四位访客数在 320 屏也放得下（第 6.14 节） */
  .platform .ticket b{font-size:12px;line-height:24px}
}

/* ===== 季节日历的四季格（按钮材质在 farm-modules.js 的 #calendar .se）===== */
.seasons{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}

/* ===== 博物馆：书架（V20 第 6.8 节）=====
   网格格子并排，封面按自然比例贴底站在 4px 木板上；column-gap:0 让相邻格子的木板连成一整条搁板。
   不再横向滚动（硬约束：面板里不用 overflow-x:auto）；check-home-museum.js 读 .shelf 的 scrollLeft，网格下恒为 0。 */
.shelf-bar{display:flex;gap:4px;margin-bottom:8px}
/* 分类键是搪瓷徽章，计数 <i> 是芯片（V20 第 6.15 节）。选中用线路色而不是站牌色：
   夜间色板的站牌色就是灯笼黄，博物馆里不许出现黄色框框（硬约束，覆盖第 6.8 节「按下态用站牌色」）。 */
.shelf-tab{display:flex;align-items:center;gap:4px;font:inherit;
  background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);padding:4px 8px;color:var(--ink)}
.shelf-tab em{font-style:normal;font-size:12px}
.shelf-tab i{font-style:normal;font-size:12px;background:var(--raised);color:var(--tx-tag);
  padding:0 4px}
.shelf-tab:hover{background:var(--raised)}
.shelf-tab.on{background:var(--rail);color:var(--surface);border-color:var(--rail)}
.shelf-tab.on i{background:var(--surface);color:var(--ink)}
.shelf{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));
  column-gap:0;row-gap:var(--s6)}
/* 2026-09-15 柯西：**不要黄色框框**。封面不裹底板、不加边框和阴影，直接站在木板上；
   木板色 --wood 是棕色装饰，不承担文字；任何地方都不出现灯笼黄。 */
.exc{min-width:0}
.exc[hidden]{display:none!important}
.shelf-status{margin:8px 0;text-align:center;font-size:12px;color:var(--tx-3)}
/* 同一行格子被网格拉成等高，a 撑满格子，封面区占掉标题以上的全部高度、贴底对齐。 */
.exc > a{display:flex;flex-direction:column;height:100%;text-decoration:none;color:inherit}
.exc .poster{flex:1;display:flex;align-items:flex-end;justify-content:center;padding:0 var(--s2);border-bottom:4px solid var(--wood)}
.exc .poster img{display:block;max-width:100%;height:auto}
.exc .poster.blank{min-height:120px;align-items:center}
/* 说明固定两行（阅读字 14／22，各一行省略号）：标题 600 墨色；第二行星级 + 一项元信息，次墨。 */
.exc .tx{display:block;padding:var(--s2) var(--s2) 0}
.exc .t,.exc .m{display:block;font-family:var(--read);font-size:14px;line-height:22px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.exc .t{font-weight:600;color:var(--ink)}
/* 标题里的游戏图标（GAME_ICON，见 game-data.js）跟着文字走，压着基线 */
.exc .t svg.ic{display:inline-block;vertical-align:-1px;margin-right:4px}
.exc .m{min-height:22px;font-style:normal;color:var(--ink-2)}
.exc .st{margin-right:4px;letter-spacing:1px;color:var(--tx-em)}
.exc > a:hover .t{text-decoration:underline;text-underline-offset:4px}
.shelf-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:var(--s2);margin-top:var(--s1);
  font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2)}
.museum-zone + .museum-zone{margin-top:20px;padding-top:18px;border-top:3px dashed var(--wood-b)}
.museum-zone-title{display:flex;align-items:center;gap:6px;margin:0 0 9px;font-size:12px;font-weight:normal;letter-spacing:1px}
.museum-more{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:9px;font-size:12px}
.museum-more a{color:inherit;text-decoration:none;border-bottom:2px solid var(--rail);padding-bottom:1px}
.museum-more a:hover{background:var(--raised)}

/* 博物馆详情页：390 件馆藏按 24 件一页渲染，避免一次加载几百张封面。 */

.museum-page{max-width:none;margin:0 auto 32px}
.museum-filters{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.museum-filter{display:flex;align-items:center;gap:5px;font:inherit;font-size:12px;color:var(--ink);
  background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);padding:5px 9px}
.museum-filter i{font-style:normal;background:var(--raised);color:var(--tx-tag);padding:0 4px}
.museum-filter:hover{background:var(--raised)}
.museum-filter.on{background:var(--rail);color:var(--surface);border-color:var(--rail)}
.museum-filter.on i{background:var(--surface);color:var(--ink)}
/* 状态行是短信息，像素 12（check-museum.js、check-workshop.js 读它的文字）；来源说明会折行，用阅读字（第 4 节）。
   次要文字靠颜色降级，不靠透明度。 */
.museum-status{font-size:12px;line-height:24px;color:var(--ink-2)}
.museum-note,.page-note{font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2)}
/* 夜间色板（与星夜昼）的站牌色是灯笼黄：博物馆子页里凡是用站牌色的（标题站牌、外观设置选中键、快捷栏当前格）
   改用线路色 —— 博物馆里不要黄色框框（硬约束）。面色对线路色在 11 套色板里都 ≥4.5:1。 */
body.is-museum-page{--plate:var(--rail);--on-plate:var(--surface)}
/* 博物馆子页的书架（第 6.8 节）：与首页 .shelf 同一套木板 —— 格子被网格拉成等高，封面按自然比例贴底站在 4px 木板上，
   column-gap:0 让相邻格子的木板连成一整条搁板。说明固定两行：标题一行 + 元信息一行（detail 与来源已并进元信息）。 */
.museum-grid{list-style:none;margin:12px 0 18px;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(144px,1fr));column-gap:0;row-gap:var(--s6)}
.museum-item{min-width:0}
.museum-item-link{height:100%;display:flex;flex-direction:column;text-decoration:none;color:inherit}
.museum-item-poster{flex:1;display:flex;align-items:flex-end;justify-content:center;width:100%;padding:0 var(--s2);border-bottom:4px solid var(--wood)}
.museum-item-poster img{display:block;max-width:100%;height:auto}
.museum-item-text{display:block;min-width:0;padding:var(--s2) var(--s2) 0}
.museum-item-title,.museum-item-meta{display:block;font-family:var(--read);font-size:14px;line-height:22px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.museum-item-title{font-weight:600;color:var(--ink)}
/* 标题前的游戏图标（GAME_ICON）跟着文字走，压着基线 */
.museum-item-title svg.ic{display:inline-block;vertical-align:-1px;margin-right:4px}
.museum-item-meta{min-height:22px;font-style:normal;color:var(--ink-2)}
a.museum-item-link:hover .museum-item-title{text-decoration:underline;text-underline-offset:4px}
.museum-pager{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0 14px}
.museum-page-btn{font:inherit;font-size:12px;color:var(--ink);background:var(--surface);
  border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge);padding:6px 12px}
.museum-page-btn:hover:not(:disabled){background:var(--raised)}
.museum-page-btn:disabled{opacity:.35}
.museum-page-info{font-size:12px;min-width:72px;text-align:center}

/* 工坊详情页：全部仓库。沿用博物馆详情页的筛选/翻页控件（一个站点只用一套交互），
   但卡片是"仓库"不是"封面"，所以单独一套 .wcard —— 仓库没有图，硬套封面格子会空一大块。 */
/* 仓库列表显式列数（第 6.9 节）：一页 4 个正好一行；≤1080 两列、≤760 单列（写在 pixel-art.js 现有的两个 @media 块里，排在本条之后）。
   auto-fill 在 1920 屏会多出空的第 5 列。卡片是仓库卡同一套纸卡：名称像素 12、简介阅读 14 两行截断、页脚像素 12。 */
.wgrid{list-style:none;margin:12px 0 18px;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s4)}
.wcard{min-width:0}
.wcard-link{height:100%;display:flex;flex-direction:column;gap:var(--s2);padding:var(--s4);text-decoration:none;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift);transition:background .12s}
a.wcard-link:hover{background:var(--raised)}
.wcard-head{display:flex;align-items:center;gap:var(--s2)}
.wcard-name{font-size:12px;line-height:24px;font-weight:normal;word-break:break-all}
.wcard-desc{font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2);min-height:44px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wcard-topics{display:flex;flex-wrap:wrap;gap:4px}
/* 话题是芯片（V20 第 6.15 节）：浮起色底、无边框、标签色字 */
.wcard-topic{font-style:normal;font-size:12px;line-height:24px;background:var(--raised);color:var(--tx-tag);padding:0 8px}
a.wcard-link:hover .wcard-topic{background:var(--surface)}
.wcard-foot{display:flex;align-items:center;gap:var(--s2);font-size:12px;line-height:24px;color:var(--ink-2);margin-top:auto}
/* 语言色块 8×8 方块（GitHub 给的语言色，是信息），与首页仓库卡 .rc-l 同一做法 */
.wcard-lang{width:8px;height:8px;flex:none}
.wcard-langname,.wcard-star{font-style:normal;text-decoration:none}
.wcard-date{margin-left:auto;font-variant-numeric:tabular-nums}

/* ===== 宠物：已移除（2026-09-17 柯西要求）=====
   原来这里养着一只荔宝（柯西家的猫）当"跟班"，追着鼠标跑。
   柯西要求「不要现在的宠物系统了」，整块（CSS + DOM + 跟随逻辑）已删除。
   光标也不再是荔宝，换成 icons.js 里的像素箭头。

   ⚠️ 为什么删除而不是注释掉：留着会误以为还在用；
     万一以后要还原，看 git 记录即可（这一段有完整注释）。
   荔宝的图标数据本身（icons.js 的 libao / libao_b / libao_c）**保留** ——
   站内别处当装饰用，删了会连带断掉图标 sprite。 */

/* ===== 文章页（posts/*.html） =====
   这一段的样式只有文章页用得上，主页面不会匹配到任何元素 ——
   但样式表是共用的，所以它会跟着主页面一起下发。几十行 CSS
   换「文章页和主站是同一套皮、不会各改各的」，这个交换划算。

   标题与控件保留像素字体，长文使用系统字体和独立阅读行宽。
   子页共用：页头 .sitebar（第 6.1 节，样式在 skins.js 的 controlsCss）→ 面板（标题 .pt 是站牌，下面像素 36 的 h1）→ 页脚站台。 */
/* 搪瓷徽章（V20 第 3.5、6.15 节）：高 40、左右内边距 12。材质只写在这一处：悬停浮起色，按下见 pixel-art.js 合并的 :active。 */
.abtn{display:flex;align-items:center;gap:8px;min-height:40px;padding:0 12px;font-size:12px;line-height:24px;
  text-decoration:none;color:var(--ink);background:var(--surface);border:2px solid var(--edge);box-shadow:0 2px 0 var(--edge)}
.abtn:hover{background:var(--raised)}
/* 子页标题是站牌（第 7.2 节）：像素 12、站牌底，前面一枚 12px 图标；它下面才是像素 36 的页面标题。
   留言板、评论区这类子页里的普通面板仍用 .pt 的面板头（24／32）。 */
.artpage>.pt,.museum-page>.pt{gap:var(--s2);margin:0 0 var(--s3);padding:0 var(--s2);font-size:12px;line-height:24px;
  background:var(--plate);color:var(--on-plate)}
.artpage{margin:0 auto var(--s8)}
/* 页面主标题像素 36（第 4 节「招牌·大」）；长标题照常折行，text-wrap:balance 让两三行折得均匀。≤760 改 24／36（在 ≤760 块里）。 */
.arttitle,.gal-title{font-size:36px;line-height:48px;font-weight:normal;margin:var(--s2) 0 var(--s4);word-break:break-word;text-wrap:balance}
.artmeta{font-size:12px;color:var(--tx-3);margin:0 0 16px;line-height:24px}
/* 元信息行的每一项（metaLine()，第 4 节）：项内不断行，过长时只截它自己，只在项与项之间换行。
   不收链接：overflow:hidden 会裁掉链接的焦点框。 */
.mi{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:top}
/* 元信息里的标签图标（TAG_ICON）：SVG 默认 display:block，
   在文本流里会硬换行，必须退回 inline-block 才能贴着字走 */
.artmeta svg.ic{display:inline-block;vertical-align:-1px;margin-right:2px}
/* 分享键（全站每页一枚，在页头右侧）：搪瓷徽章，与外观设置同高 40。
   柯西 2026-09-20「没有分享键」→ 2026-09-21「分享功能没做好」：按钮/脚本共用
   subpage.js 的 shareBtn/shareScript；点击分支（触屏走原生面板、桌面直接复制链接）
   和三条复制降级写在那边，这里只管样式。
   ⚠️ 按钮上别写副标题，一个图标 + 「分享」两个字就够。 */
.share-btn{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;min-height:40px;
  background:var(--surface);border:2px solid var(--edge);padding:0 12px;
  font:12px var(--pix);line-height:24px;color:var(--ink);
  box-shadow:0 2px 0 var(--edge)}
.share-btn:hover{background:var(--raised)}
.share-btn:active{transform:translateY(2px);box-shadow:none}
/* 分享结果的小纸条（票据材质，第 6.15 节）：复制成功/失败都要有回执 —— 不然点了没反应，
   跟「没有分享键」看起来一模一样。整宽定位、按内容收缩、外边距居中：left:50% 时收缩宽度只有半个视口，
   390 屏放不下兜底提示句。user-select：最后那条降级是把链接显示在纸条上让人家长按选中，
   iOS 的 webview 里不显式开文本选择，长按是选不中的。兜底网址在单独的 <span> 里，阅读字整行。 */
.share-toast{position:fixed;left:0;right:0;bottom:var(--s6);margin:0 auto;width:fit-content;max-width:min(calc(100vw - 32px),540px);
  transform:translateY(8px);z-index:70;padding:var(--s2) var(--s3);font-size:12px;line-height:24px;
  background:var(--surface);color:var(--ink);border:2px solid var(--edge);box-shadow:var(--lift);
  opacity:0;visibility:hidden;overflow-wrap:anywhere;-webkit-user-select:text;user-select:text;
  transition:opacity .16s,transform .16s,visibility .16s}
.share-toast.on{opacity:1;visibility:visible;transform:none}
.share-toast span{display:block;font-family:var(--read);font-size:14px;line-height:22px}
.artcover{margin:0 0 16px;text-align:center}
.artcover img{max-width:180px;max-height:250px;border:3px solid var(--ink);
  box-shadow:0 5px 0 rgba(59,36,18,.28);display:inline-block}
.artbody{font-family:var(--read);
  font-size:18px;line-height:1.9;max-width:42rem;margin-inline:auto;overflow-wrap:break-word;
  font-kerning:normal}
.artbody h2,.artbody h3,.artbody h4{font-family:var(--pix);line-height:1.6}
.artbody p{margin:0 0 1.25em}
.artbody h2{font-size:24px;margin:32px 0 14px;padding-bottom:8px;border-bottom:2px solid var(--cream-3)}
.artbody h3{font-size:24px;font-weight:700;margin:20px 0 8px}
.artbody h4{font-size:24px;margin:16px 0 6px;color:var(--ink-2)}
/* 文字链（V20 第 6.15 节）：链接色 + 1px 下划线装饰色 */
.artbody a{color:var(--tx-link);text-decoration:underline;text-decoration-color:var(--link-accent);text-underline-offset:4px}
.artbody a:hover{background:var(--raised);color:var(--ink)}
.artbody ul,.artbody ol{margin:0 0 14px;padding-left:22px}
.artbody li{margin:0 0 6px}
.artbody blockquote{margin:0 0 14px;padding:8px 12px;background:var(--cream-2);
  border-left:5px solid var(--wood-c);color:var(--tx-quote)}
.artbody blockquote p:last-child{margin:0}
.artbody code{font-family:ui-monospace,Consolas,"SFMono-Regular",monospace;font-size:15px;background:var(--cream-2);border:1px solid var(--cream-3);padding:0 3px;color:var(--tx-code)}
/* 正文里的加粗 = 作者想强调的地方，用强调色（四季各不同）*/
.artbody strong{color:var(--tx-em)}
.artbody pre{margin:0 0 14px;padding:10px 12px;background:var(--code-bg);color:var(--on-code);
  border:1px solid var(--line);overflow-x:auto;line-height:1.75}
.artbody pre code{background:none;border:0;padding:0;color:inherit}
/* TOC styles adapted from PaperMod post-single.css (MIT; assets/vendor/papermod-LICENSE.txt). */
details.toc{max-width:42rem;margin:0 auto 24px;background:var(--cream-2);border:1px solid var(--wood-c)}
details.toc summary{padding:8px 16px;cursor:url("${CUR_B}") 0 0, pointer;font-size:12px}
/* 目录条目是会折行的一列标题，用阅读字（V20 第 4 节，v5）；summary「文章目录」仍是像素 12。 */
.toc .inner{padding:0 16px 12px;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink)}
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
/* 窄屏（≤1080px，V20 由原 900 档并入「两栏变一栏」的 1080 档，第 5.3 节）：目录退回正文上方 —— 就是 2026-09-20 之前的位置。
   必须显式取消 sticky 和限高，否则目录会变成浮层挡住阅读。 */
@media (max-width:1080px){
  .art-cols{grid-template-columns:minmax(0,1fr);gap:0}
  .toc-side{position:static;max-height:none;overflow:visible}
  .art-cols details.toc{margin:0 auto 24px;max-width:42rem}
}
.artbody h2,.artbody h3,.artbody h4{scroll-margin-top:24px}
.artbody pre{position:relative;padding-top:44px}
.copy-code{position:absolute;top:6px;right:8px;padding:4px 8px;background:var(--cream-2);color:var(--ink);border:1px solid var(--wood-c);font:12px var(--pix)}
.copy-code:hover{background:var(--gold)}
.artbody img{max-width:100%;height:auto;image-rendering:auto;border:3px solid var(--ink);display:block;margin:0 auto}
.artbody hr{border:0;height:6px;margin:20px 0;
  background:repeating-linear-gradient(90deg,var(--wood-c) 0 4px,transparent 4px 8px)}
.artfoot{margin-top:24px;padding-top:12px;border-top:3px solid var(--cream-3);
  display:flex;justify-content:flex-end;font-size:12px}
.artorig{color:inherit;text-decoration:none;border-bottom:2px solid var(--wood-c)}
.artorig.quiet{color:var(--tx-3)}
.cmtpanel{max-width:820px;margin:0 auto 26px}
.cmtbox{min-height:20px;font-size:12px}
.cmtnote{font-family:var(--read);font-size:14px;line-height:22px;color:var(--tx-3);margin:0 0 8px}
.cmtnote code{background:var(--cream-2);border:1px solid var(--cream-3);padding:0 3px}

/* ===== 网站底部：评论区 =====
   评论区在页脚站台（.platform）上方；访客计数改成站台里的车票（第 6.14 节）。 */
.sitebottom{max-width:820px;margin:var(--s8) auto 0}
/* 上下篇（第 6.15 节）：可点的纸卡，装的是整篇文章标题，所以不做成徽章；标题阅读 14 最多两行，
   截断裁的是 b 自己，不碰 <a> 的焦点框。与文章面板同宽 860。 */
.apager{display:flex;gap:var(--s4);max-width:860px;margin:0 auto var(--s8)}
.apg{flex:1;display:flex;flex-direction:column;gap:var(--s1);min-height:40px;padding:var(--s2) var(--s3);
  background:var(--surface);border:2px solid var(--edge);text-decoration:none;color:var(--ink)}
.apg:hover{background:var(--raised)}
.apg.empty{visibility:hidden}
.apg i{font-style:normal;font-size:12px;line-height:24px;color:var(--ink-2)}
.apg b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-family:var(--read);font-size:14px;line-height:22px;font-weight:600;color:var(--ink)}
.apg.next{text-align:right}

/* ===== 博客列表页（posts/index.html）=====
   柯西 2026-09-16 要「一个正式博客页」—— 光一列标题不叫博客页。
   2026-09-20：这一页改成**完整时间线**（柯西：把时间线做一个单独的页面），
   卡片直接复用上面「时间线」那一套 .tl-* 样式 —— 不在这里重复定义。
   曾经的「大卡 + 紧凑列表」样式（.blog-lead / .blog-row）随之退役。 */
.blog-note{font-family:var(--read);font-size:14px;line-height:22px;color:var(--tx-3);margin:var(--s4) 0 0}
.blog-note a{color:var(--tx-link)}

/* 外观设置（页头右侧）的样式在 skins.js 的 controlsCss（第 6 层），这里不再写。 */
.toolbar{margin:20px 0 8px;gap:12px}
.tool{flex-direction:row;min-height:44px;padding:8px 12px;gap:8px;border:2px solid var(--frame);box-shadow:0 3px 0 var(--frame)}
.tool:hover,.tool:focus-visible{box-shadow:0 3px 0 var(--frame);transform:translateY(-1px)}
.museum-more{margin-top:16px;line-height:24px}
.artbody{max-width:64ch;margin-inline:auto;line-height:2}
.artbody h2{font-size:24px;line-height:36px}
.artbody pre{white-space:pre-wrap;overflow-wrap:anywhere}
/* ≤760（原 ≤680 档并入 V20 的 760，第 5.3 节）：页面标题 24／36（同特异性，必须排在 .arttitle 基础规则之后）。 */
@media(max-width:760px){
  .tool{padding:8px;gap:4px}
  /* 工坊的「手机只露两张」截断：友情站不参与（:not(.fgrid) 挡开）——
     友链卡没有「查看全部」子页可去，截了就是真没了。友情站改单列铺开（见下）。 */
  .rgrid:not(.fgrid) .rcard:nth-child(n+3){display:none}
  .arttitle{font-size:24px;line-height:36px}
  /* 正文 H2 保持 24px，避免小标题反而比页面标题大。 */
  .artbody h2{font-size:24px;line-height:36px}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}.tl-item:hover .tl-go{transform:none}}
.douban-mark-link{font-size:12px;font-weight:normal;line-height:24px;margin-left:auto;color:var(--tx-link);text-underline-offset:4px;white-space:nowrap}
${FARM.css}
${PIXEL.css}
${MUSIC.css}
${SKINS.css}
</style>
</head>
<body>
<!-- V20 第 7.1 节：整页不再有背景层、素材层、飘落物和皮肤页边饰。
     .wrap 里依次是页头、舞台与招牌（.hero）、12 栏仪表盘（线路图 + 主栏 + 站台）、页脚。 -->
<div class="wrap">
  ${sitebar({ prefix: '', settings: FARM.settings(), share: true })}
  ${PIXEL.stage(SKINS.diorama(), social())}
  ${dash([
    // kind：快车站（express）节点大、实线；普通站（local）节点小、虚线（第 6.4 节）
    { label: '概览',   kind: 'express', html: overview() },
    { label: '工坊',   kind: 'express', html: repos() },
    { label: '文章',   kind: 'express', html: timeline() },
    { label: '博物馆', kind: 'express', html: museum() },
    { label: '相馆',   kind: 'express', html: galleryPanel() },
    { label: '专精',   kind: 'local',   html: techStack() },
    { label: '友链',   kind: 'local',   html: friendsPanel() },
    { label: '日历',   kind: 'local',   html: seasonPanel() },
    { label: '农场',   kind: 'local',   html: farmPanel() }
  ].filter(function(p){ return p.html; }), [
    statusPanel(),
    panel('唱片机', 'note', MUSIC.render(), 'music')
  ])}

  ${bottom()}
</div>

<div id="contact-tip" class="contact-tip" role="status" aria-live="polite"></div>

${buildSprite()}
${dashScript()}
${cblockScript()}

<script>
(function(){
  var root = document.documentElement;

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
     V20「一束光」：data-time 是全站唯一的光源状态 —— 角色配色、三维书屋光照、像素场景都只读它。 */
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
  // 舞台右上的「午后／入夜」只是临时覆盖（仅本次访问，刷新或日历「恢复自动」回到时钟），按下态跟着光源走。
  var lightButtons = document.querySelectorAll('[data-stage-light]');
  function applyTime(value){
    root.dataset.time=value;
    lightButtons.forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.stageLight===value)); });
  }
  lightButtons.forEach(function(b){
    b.addEventListener('click',function(){ manualTime=true; applyTime(b.dataset.stageLight); updateCalendar(); });
  });
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
    });
  });
  function legacyGameLink(){
    if (location.hash === '#basket') document.querySelector('[data-filter-kind="game"]').click();
  }
  legacyGameLink();
  window.addEventListener('hashchange', legacyGameLink);

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

  // 按访客本地时间定季节与昼夜；放在末尾，前面的监听都已挂好。
  applySeason(seasonOf(new Date().getMonth()+1));
  autoSeason();
})();
</script>
<script>${FARM.homeScript}</script>
<script>${MUSIC.script}</script>
${shareScript()}
${SKINS.script()}
<script type="module">
import('./assets/toon/main.js').catch(function(){
  document.querySelector('[data-toon-scene]').dataset.state='error';
});
</script>
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
// giscus 评论区主题：8 个文件 assets/giscus/<skin>-<time>.css（V20 第 6.12 节）
PALETTE.writeGiscus(path.join(__dirname, '..', 'assets', 'giscus'));

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
