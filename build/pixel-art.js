// Shared visual treatment: the homepage stage, sign, line map and walker, plus pixel-material details.
// Existing farm artwork and the current content model stay in use.

// 首屏舞台 + 招牌（V20 第 6.2、6.3 节）：.hero 是同一格叠放的两层，DOM 顺序舞台在前、招牌在后，
// Tab 与读屏顺序也就是「舞台控件 → 招牌」。舞台是整站唯一的「世界」。
// 主标题用**本名**（柯西 2026-09-26：「学他，在首页写上自己的名字 陈柯羲」）；网名与签名在下一行保留。
// 地名牌四个地名都在标记里，由 html[data-skin] 只显示当前那个（不靠脚本，首帧就对）。
function stage(scene, social) {
  return `<div class="hero">
  <section class="stage" data-stage data-paused="false" aria-label="风景">
    ${scene}
    <p class="stage-plate"><span class="plate-sakura">樱花书屋</span><span class="plate-coast">海边夏日</span><span class="plate-observatory">星夜观测站</span><span class="plate-farm">原野农场</span></p>
    <div class="stage-ctrl" role="group" aria-label="风景光线">
      <button type="button" class="stage-btn" data-stage-light="day" aria-pressed="true">午后</button>
      <button type="button" class="stage-btn" data-stage-light="night" aria-pressed="false">入夜</button>
      <button type="button" class="stage-btn" data-stage-pause aria-pressed="false">暂停风景</button>
    </div>
  </section>
  <div class="sign">
    <h1>陈柯羲</h1>
    <p class="motto">柯西 Alakazam · fake it til u make it</p>
    <p class="intro">这里记录我的项目、文章，还有书影音与游戏收藏。</p>
    ${social}
  </div>
</div>`;
}

const css = `
/* Pixel art system: square steps and solid materials, no smooth bevels.
   ⚠️ 颜色只在 build/palette.js 定义（V20）：这里不再写 :root／夜间色板，组件只引用角色变量。 */
/* 容器（V20 第 5.2 节）：1440 屏内容宽 1272，1920 屏封顶 1560 —— 舞台要放大，9／3 分栏也要约 1232 的内容宽。
   ⚠️ 写成 min/max 表达式而不是加 @media —— 断点档位有棘轮预算，能不新增就不新增。 */
.wrap{max-width:min(1560px,max(1200px,100% - 120px));padding:0 24px 40px}
/* ===== 舞台与招牌（V20 第 6.2、6.3 节）=====
   .hero 网格里同一格叠两层：舞台在下、招牌在上。用网格叠层而不用绝对定位，
   舞台变矮（WebGL 出错、矮视口）时容器按招牌撑高，招牌不会探出舞台顶部。 */
.hero{display:grid}.hero>*{grid-area:1/1}
.stage{position:relative;width:100%;aspect-ratio:21/9;max-height:max(300px,calc(100vh - 220px));overflow:hidden;
  background:var(--raised);border:1px solid var(--line);box-shadow:var(--lift)}
.stage-plate{position:absolute;top:var(--s4);left:var(--s4);z-index:2;margin:0;padding:0 8px;
  background:var(--plate);color:var(--on-plate);border:2px solid var(--plate);font-size:12px;line-height:24px}
.stage-plate span{display:none}
html[data-skin="sakura"] .plate-sakura,html[data-skin="coast"] .plate-coast,
html[data-skin="observatory"] .plate-observatory,html[data-skin="farm"] .plate-farm{display:inline}
/* 控件组压在任何场景上都要可读：纸卡底。按钮是 32px 高的小号搪瓷徽章，当前光线那枚是按下态。 */
.stage-ctrl{position:absolute;top:var(--s4);right:var(--s4);z-index:2;display:flex;gap:var(--s1);padding:var(--s1);
  background:var(--surface);border:1px solid var(--line)}
.stage-btn{min-height:32px;padding:0 8px;border:2px solid var(--edge);background:var(--surface);color:var(--ink);
  box-shadow:0 2px 0 var(--edge);font:inherit;font-size:12px;line-height:24px}
.stage-btn:hover{background:var(--raised)}
.stage-btn[aria-pressed="true"]{background:var(--plate);color:var(--on-plate);border-color:var(--plate)}
/* 招牌：纸卡 + 顶部 6px 线路色带（把招牌和线路图连成一套）；>1080 压在舞台左下（书屋主体在中右，左下是长椅和小径）。 */
.sign{position:relative;z-index:3;align-self:end;justify-self:start;width:min(456px,42%);margin:var(--s6);padding:var(--s6);
  background:var(--surface);border:1px solid var(--line);border-top:6px solid var(--rail);box-shadow:var(--lift)}
.sign h1{margin:0;font:normal 48px/60px var(--pix);color:var(--ink)}
.sign .motto{margin:var(--s1) 0 var(--s3);font-size:12px;line-height:24px;color:var(--ink-2)}
.sign .intro{margin:0 0 var(--s4);font-family:var(--read);font-size:16px;line-height:26px;color:var(--ink)}
.sign .social{justify-content:flex-start;margin:0}
.sign .soc:hover{background:var(--raised)}
/* ===== 12 栏网格（V20 第 5.2 节）=====
   线路图跨满 12 栏；主栏 8／站台 4（≥1400 为 9／3）。主栏 .dash-body 是首页唯一一层卡，拉满这一行；
   站台 sticky，比视口高时 dash.js 写负的 --side-top，侧栏任何部分都滚得到（第 6.6 节）。 */
.dash{position:relative;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--s6);margin-top:var(--s6)}
.dash-head{grid-column:1/-1;position:relative;min-width:0;margin-bottom:var(--s6);scroll-margin-top:var(--s4)}
.dash-body{grid-column:span 8;align-self:stretch;min-width:0;padding:var(--s6);border:1px solid var(--line);background:var(--surface);box-shadow:var(--lift)}
.dash-side{grid-column:span 4;min-width:0;position:sticky;top:var(--side-top,16px);align-self:start}
/* ===== 线路图（V20 第 6.4 节）=====
   每个标签是一个车站：线段 ::before、站点 ::after 都是伪元素，不加标记。快车站大方块 + 实线，普通站小方块 + 虚线。
   每格高 92：0–40 女孩行走带，线段中心 52，快车站点 42–62、普通站点 46–58，站名 68–92。
   当前站同时靠「站点填满 + 站名变站牌」两种形状变化区分，不只靠颜色。 */
.dash-tabs{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
.dash-tab{position:relative;display:block;height:92px;color:var(--ink);font-size:12px;line-height:24px;text-decoration:none}
.dash-tab::before{content:'';position:absolute;left:0;right:0;top:50px;height:4px;background:var(--rail)}
.dash-tab.is-local::before{background:repeating-linear-gradient(90deg,var(--rail) 0 8px,transparent 8px 16px)}
.dash-tab:first-child::before{left:50%}.dash-tab:last-child::before{right:50%}
.dash-tab::after{content:'';position:absolute;z-index:1;left:calc(50% - 10px);top:42px;width:20px;height:20px;background:var(--surface);border:4px solid var(--rail)}
.dash-tab.is-local::after{left:calc(50% - 6px);top:46px;width:12px;height:12px;border-width:2px}
.dash-tab .stn{position:absolute;left:50%;top:68px;transform:translateX(-50%);padding:0 8px;white-space:nowrap}
.dash-tab.is-local .stn{color:var(--ink-2)}
.dash-tab[aria-selected="true"]::after{background:var(--plate);border-color:var(--plate)}
.dash-tab[aria-selected="true"] .stn{background:var(--plate);color:var(--on-plate)}
.dash-tab:not([aria-selected="true"]):hover::after{background:var(--raised)}
.dash-tab:hover .stn{text-decoration:underline 2px;text-underline-offset:4px}
/* 女孩画在整条线路图上的叠层里（不再另占一条 48px 的带），点击穿透到站格。 */
.dash-track{position:absolute;inset:0;pointer-events:none}
.dash-walk{position:absolute;left:0;top:0;width:40px;height:40px;pointer-events:none;transform:translate(var(--x,0),var(--y,0));image-rendering:pixelated}
.dash-walk .art{display:block;width:40px;height:40px;transform-origin:center bottom;animation:hop 280ms steps(2) infinite;animation-play-state:paused}
.dash-walk.walking .art{animation-play-state:running}
.tabpane:not(.on){display:none}
.tabpane.on{animation:px-pane-in .22s cubic-bezier(.22,1,.36,1) backwards}
.tabpane>.panel{border:0;box-shadow:none;margin-bottom:0;padding:0;background:none}
/* ===== 站台侧栏（V20 第 6.6 节）=====
   状态与唱片机各是一张纸卡（内边距 24，≤760 为 16）。时钟像素 36、问候阅读 14、日期·季节·昼夜像素 12；
   写作台是整宽 40px 的站牌主按钮（check-dashboard.js 认 .side-acts a[href="write/index.html"]）。 */
.clock{font-size:36px;line-height:48px;color:var(--ink);font-variant-numeric:tabular-nums}
.clock b{font-weight:normal;color:var(--ink-2)}
.greet{min-height:22px;margin:var(--s1) 0 0;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink)}
#dash-meta{min-height:24px;margin:0;font-family:var(--pix);font-size:12px;line-height:24px;color:var(--ink-2)}
.side-acts{display:flex;margin-top:var(--s4)}
.side-acts .abtn{flex:1;justify-content:center;gap:8px;min-height:40px;margin:0;padding:0 12px;
  background:var(--plate);color:var(--on-plate);border-color:var(--plate)}
.side-acts .abtn:hover span{text-decoration:underline;text-underline-offset:4px}
.dash-side .panel{margin-bottom:var(--s6)}.dash-side .panel:last-child{margin-bottom:0}
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes px-pane-in{from{opacity:.35;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(min-width:1400px){.dash-body{grid-column:span 9}.dash-side{grid-column:span 3}}
/* ≤1080：招牌接在舞台下沿、宽度跟舞台一致；舞台 2:1；站台落到主栏下方、两块面板并排，不再 sticky。 */
@media(max-width:1080px){
  .hero{display:block}.sign{width:auto;margin:0;place-self:auto}.sign h1{font-size:36px;line-height:48px}
  .stage{aspect-ratio:2/1}
  .dash-body,.dash-side{grid-column:1/-1}
  .dash-side{position:static;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s6);margin-top:var(--s6)}
  .dash-side .panel{margin-bottom:0}
  .wgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
/* 首屏的双栏容器（.layout）已换成仪表盘 **.dash**（规则见上方 "首屏仪表盘" 一节）：
   主栏 1fr + 状态栏 288px。下滑区（留言板、页脚站台）仍是整行，不走两栏。 */
/* 面板材质（纸卡）与面板头只写在 gen.js 的 .panel、.pt 一处（V20 第 3.5、6.11 节）；四角饰件与作物架随 V20 删了。 */
.museum-more{line-height:24px}.museum-more a,.more a{color:var(--ink);text-underline-offset:5px}
/* 「查看全部仓库」与仓库汇总行同一行、靠右 */
#projects .museum-more{justify-content:flex-end;margin-top:-24px}
/* ---------- 精选项目与开源贡献（工坊顶部，柯西 2026-10-03；V20 第 6.9 节）----------
   精选是**显式两列**、第三张跨满两列左图右文（auto-fit 在宽主栏会变 3 列，第三张的跨列放不进第一行剩下的 1 列）；
   ≤760 回到单列上图下文。不给卡片加类名：check-workshop.js 按 class="pjcard" 精确计数。
   封面统一 16:10（assets/projects/*.jpg，由 build/_make-covers.py 生成），object-fit:cover 只是兜底。
   卡片是海报材质（纸卡）；文字只用 projects.js 里 10-03 确认过的内容（B03）。 */
.pjblock{margin:0 0 var(--s6)}
.pjhead{display:flex;align-items:center;gap:8px;margin:0 0 var(--s3);color:var(--rail);font-size:12px;line-height:24px}
.pjgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s4)}
.pjgrid>.pjcard:nth-child(3){grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}
.pjgrid>.pjcard:nth-child(3) .pjshot{align-self:start;border-bottom:0;border-right:1px solid var(--line)}
.pjcard{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);box-shadow:var(--lift);
  color:var(--ink);text-decoration:none;transition:background .12s}
.pjcard:hover{background:var(--raised)}
.pjshot{display:block;aspect-ratio:16/10;overflow:hidden;background:var(--raised);border-bottom:1px solid var(--line)}
.pjshot img{display:block;width:100%;height:100%;object-fit:cover}
.pjbody{display:flex;flex:1;flex-direction:column;gap:var(--s2);padding:var(--s4)}
.pjh{display:flex;align-items:baseline;justify-content:space-between;gap:var(--s2);flex-wrap:wrap}
.pjname{font-size:24px;line-height:32px;font-weight:normal;overflow-wrap:anywhere}
.pjrole{font-size:12px;line-height:24px;font-style:normal;padding:0 8px;background:var(--plate);color:var(--on-plate);white-space:nowrap}
.pjevent{margin:0;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2)}
.pjtag{margin:0;font-family:var(--read);font-size:16px;line-height:26px;color:var(--ink)}
.pjstack{display:flex;flex-wrap:wrap;gap:4px}
.pjstack i{font-size:12px;line-height:24px;font-style:normal;padding:0 8px;background:var(--raised);color:var(--tx-tag)}
/* 事实列表：每条一行、条间 1px 细线，不加项目符号 */
.pjfacts{display:flex;flex-direction:column;margin:0}
.pjfacts i{display:block;padding:var(--s2) 0;font-family:var(--read);font-style:normal;font-size:14px;line-height:22px;color:var(--ink-2)}
.pjfacts i+i{border-top:1px solid var(--line)}
.pjgo{display:flex;align-items:center;gap:var(--s2);width:fit-content;margin-top:auto;padding-top:var(--s3);font-size:12px;line-height:24px;
  color:var(--ink);text-decoration:underline;text-underline-offset:5px}
/* 开源贡献：无封面、1px 虚线控件边（虚线表示「参与别人的项目」），视觉上比精选弱一档 —— 作者和贡献者不能长得一样 */
.pjcontrib{margin-top:var(--s6)}
.pjcbox{padding:var(--s4);border:1px dashed var(--edge);background:var(--surface)}
.pjcname{display:flex;align-items:baseline;gap:var(--s2);flex-wrap:wrap;margin:0 0 var(--s2)}
.pjcname b{font-size:24px;line-height:32px;font-weight:normal;color:var(--ink)}
.pjcname i{font-style:normal;font-family:var(--read);font-size:14px;line-height:22px;color:var(--ink-2)}
.pjcbox .pjgo{padding-top:var(--s2)}
#calendar .se{min-height:58px;gap:8px}
#calendar .se .ic{width:24px;height:24px}
.museum-zone-title{margin:8px 0 16px;gap:12px;line-height:24px}
.shelf-tab,.museum-filter{padding:8px 12px}
.shelf-status,.gfoot{line-height:24px}
.is-article .artpage,.is-article .cmtpanel{max-width:860px}.is-article .artbody{max-width:42rem;line-height:1.9}
/* 有目录的文章（柯西 2026-09-20：目录放左边）面板放宽到 1000px：
   860 - 48(面板内边距) - 200(目录栏) - 28(栏间距) = 584px，比从前的阅读宽度
   42rem(672px) 还窄；放宽后正文正好拿回 672px。 specificity 必须比上面那条
   .is-article .artpage 高一级（多个 .has-toc），否则同特异性下还是 860 赢。 */
.is-article .artpage.has-toc{max-width:1000px}
.is-article .artcover img{border:0;box-shadow:none}
@media(max-width:760px){.wrap{padding:0 16px 32px}.stage{aspect-ratio:4/3}
/* 线路图两行、不滚动：60 列网格，快车站 5 × 12 排满第一行，普通站 4 × 15 排满第二行；相馆或友链缺席时按 data-* 改跨度。
   每格 84：0–32 女孩带，站点 34–54，站名 60–84 —— 与桌面同一套留白（女孩脚下 2px、站点到站名 6px），第一行站名不贴站点。 */
.dash-tabs{grid-auto-flow:row;grid-auto-columns:auto;grid-template-columns:repeat(60,minmax(0,1fr))}
.dash-tab{height:84px;grid-column:span 12}.dash-tab.is-local{grid-column:span 15}
.dash-tabs[data-express="4"] .is-express{grid-column:span 15}.dash-tabs[data-local="3"] .is-local{grid-column:span 20}
.dash-tab::before{top:42px}.dash-tab::after{top:34px}.dash-tab.is-local::after{top:38px}.dash-tab .stn{top:60px}
.dash-tab.is-turn-end::before{right:50%}.dash-tab.is-turn-start::before{left:50%}
.dash-walk,.dash-walk .art{width:32px;height:32px}
.dash-side{grid-template-columns:minmax(0,1fr)}
/* 面板内边距 16（站台纸卡、子页面板）；主栏工坊仓库与精选海报单列，第三张海报回到上图下文。
   时刻表的窄屏规则与基础规则同在 gen.js（第 1 层），不在这里写。 */
.dash-body{padding:var(--s4)}.panel{padding:var(--s4);margin-bottom:var(--s7)}
.rgrid,.wgrid{grid-template-columns:minmax(0,1fr)}.rfoot{display:none}#projects .museum-more{margin-top:20px;justify-content:center}
.pjgrid{grid-template-columns:minmax(0,1fr)}.pjgrid>.pjcard:nth-child(3){display:flex;flex-direction:column}
.pjgrid>.pjcard:nth-child(3) .pjshot{border-right:0;border-bottom:1px solid var(--line)}
.gstrip img{height:96px}.museum-zone-title{flex-wrap:wrap}.douban-mark-link{margin-left:0}}
/* ===== 窄屏横向溢出的源头（2026-09-20 量出来的，别再当"环境问题"） =====
   ⚠️ 这条**必须留在本文件**：本文件是样式表里最后一份，写进 gen.js 会被上面的
   .shelf-tab 覆盖（同特异性、后来者胜），看着改了其实没生效。
   （另一个源头「面板底部作物架」.dc-shelf 随 V20 删了。）

   博物馆的 5 个分类按钮（全部1198 / 影287 / 书44 / 音乐571 / 游戏296）
      一行天然要 354px，而它所在面板的内容宽只有 320px→242 / 360px→282 /
      375px→297 / 390px→312。实测 360px 就已经顶出面板外（页面横向溢出 9px）。
      先收紧内边距（375px 以上这样就是一行了），再允许折行兜底 ——
      折行只在真的放不下时发生，不是把窄屏都变成两行。
      ⚠️ 不能用 overflow-x:auto：内容会藏进滚动条后面，DOM 里查得到、屏幕上看不见。 */
@media(max-width:430px){
  .shelf-bar{flex-wrap:wrap;gap:4px}
  .shelf-tab{padding:8px 4px}
  .shelf-tab i{padding:0 2px}
  /* 书架固定 3 列（第 6.8 节）；海报名「szuDesktop · 荔枝庭院」像素 24 要 264px，320 屏卡内只有约 220（第 6.9 节） */
  .shelf{grid-template-columns:repeat(3,minmax(0,1fr))}
  .pjname{font-size:12px;line-height:24px}
}
@media(max-width:360px){
  /* 320 屏地名牌与右上控件组放不进同一行；≤1080 招牌已接在舞台下沿，舞台左下是空的（第 6.2 节，v5） */
  .stage-plate{top:auto;bottom:var(--s4)}
  .sign .soc{flex:1 1 calc(50% - 4px)}
}
/* ===== 按压反馈（2026-09-22，对标 jonbrown66/pixel-portfolio 的 .pixel-button）=====
   像素按钮的三态手感：hover 上浮 ▸ active 下沉 + 落影收缩，"按得下去"。
   gen.js 里 .tool/.soc/.share-btn 各写过 :active，但全部被本文件同特异性、
   后加载的 hover 规则压住（.toolbar .tool:hover 是 0,3,0，.tool:active 只有
   0,2,0）—— 首页工具栏和社交牌其实一直按不下去；项目卡、相馆图、侧栏果实、
   翻页按钮等其余可点元素则一个 :active 都没有，点下去毫无回馈。
   ⚠️ :active 必须写在本文件：这里是样式表最后一份，写 gen.js 会被上面的
      hover 压掉，看着改了其实不生效（同特异性、后来者胜）。
   ⚠️ .tool 的生效层在 .toolbar .tool:hover（0,3,0），active 也要带上前缀；
      文字链（.more a / .museum-more a）是 inline，transform 不生效，
      用 position:relative + top 偏移。
   ⚠️ 同位移值的合并成一条选择器列表：规则总数有 1900 的棘轮预算
      （check-css-budget），一个控件一条 :active 放不下。 */
/* V20 第 6.15 节：所有按下态统一成「下沉 2px + 收起落影」，一条规则管完（含页脚快捷栏 .hb）。 */
.dash-tab:active,.sign .soc:active,.stage-btn:active,.cbtn:active,.gal-item:active,
.museum-item a:active,.gstrip .gp:active,.exc > a:active,.apg:active,.museum-page-btn:active:not(:disabled),
.shelf-tab:active,.museum-filter:active,.copy-code:active,
.rcard:active,.wcard-link:active,.pjcard:active,.abtn:active,.hb:active{transform:translateY(2px);box-shadow:none}
.more a:active,.museum-more a:active{position:relative;top:1px}
/* 触屏没有"悬停"：tap 之后 :hover 会粘在元素上（卡片一直浮着、一直黄底），
   桌面看不出、手机必现。参照项目用 @media (hover:hover) 正向包 hover；
   本站 hover 横跨 gen.js 与本文件两份样式表，改用中和法：一个块把位移类
   hover 在触屏上一律摁平（背景色粘滞比位移轻，留着不动）。
   ⚠️ 同样必须写在本文件：.toolbar .tool:hover / .rcard:hover 的生效层在这里。 */
@media (hover:none){
  .dash-tab:hover,.sign .soc:hover,.cbtn:hover,.rcard:hover,.pjcard:hover,
  .wcard-link:hover,.gal-item:hover,.gstrip .gp:hover,.exc > a:hover,
  .abtn:hover,.apg:hover,.tool:hover,.tool:focus-visible,.soc:hover,.soc:focus-visible,
  .share-btn:hover,.hb:hover,.tl-item:hover{transform:none}
}
/* 卡片轻微上移并渐显：280ms，35ms 交错且最多等待 175ms。
   backwards 只管理入场，不占住 hover/active；减少动效时内容保持可见。 */
@keyframes px-card-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.rcard,.pjcard,.tl-card,.gstrip .gp,.exc,.gal-item,.museum-item,.wcard{animation:px-card-in .28s cubic-bezier(.22,1,.36,1) backwards;animation-delay:min(calc(var(--i,0)*35ms),175ms)}
`;

module.exports = {stage, css};
