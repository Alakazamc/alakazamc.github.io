// Shared visual treatment: pixel timber, paper, and a small farm diorama.
// Existing farm artwork and the current content model stay in use.
function hero(scene, social, counts, icon) {
  return `<header class="board pixel-entry" id="board">
    <div class="entry-copy">
      <p class="entry-label">${icon('book', 'sm')}代码 · 阅读 · 生活</p>
      <h1 class="bn"><span class="bt">柯西 Alakazam</span></h1>
      <p class="who">fake it til u make it</p>
      <p class="entry-intro">这里记录我的项目、文章，还有书影音与游戏收藏。</p>
      ${social}
      <nav class="entry-counts" aria-label="内容概览">
        <a href="posts/index.html">${icon('book', 'sm')}<b>${counts.articles}</b><span>篇文章</span></a>
        <a href="museum/index.html">${icon('star', 'sm')}<b>${counts.collection}</b><span>件馆藏</span></a>
        <a href="gallery/index.html">${icon('flower', 'sm')}<b>${counts.photos}</b><span>张图像</span></a>
      </nav>
    </div>
    <div class="entry-view">${scene}<p class="entry-caption">${icon('lantern', 'sm')}欢迎来坐坐${icon('lantern', 'sm')}</p></div>
  </header>`;
}

const css = `
/* Pixel art system: square steps and solid materials, no smooth bevels. */
:root{--cream:#fff5dc;--cream-2:#f1e3bd;--cream-3:#decca0;--ink:#3e3124;--ink-2:#746149;
  --timber:#644832;--timber-light:#b48854;--timber-top:#e4bf7f;--moss:#647950;--pixel-shadow:#352e26;
  --frame:var(--timber);--reading-surface:var(--cream);--reading-muted:var(--cream-2)}
html[data-time="night"]{--cream:#30382f;--cream-2:#263027;--cream-3:#45503d;--ink:#f3e8ce;--ink-2:#c6bea5;
  --timber:#1a2621;--timber-light:#617059;--timber-top:#819075;--moss:#a0b575;--pixel-shadow:#101b19;--gold:#ddbc70;--gold-3:#ddbc70}
.wrap{max-width:1200px;padding:0 24px 40px}
.asset-bg{filter:saturate(.5) brightness(.8)}
.asset-bg::after{content:'';position:absolute;inset:0;background:var(--sky-b);opacity:.64}
html[data-time="night"] .asset-bg::after{background:#162b2d;opacity:.82}
.bg{filter:saturate(.6) brightness(.86)}
.dc-scene{opacity:.38}.dc-pond{opacity:.58}.dc-birds{opacity:.45}.dc-post{display:none!important}
.appearance-settings{max-width:1200px;padding:0 24px;margin:16px auto 12px}
.appearance-settings>summary{border:2px solid var(--timber);box-shadow:2px 2px 0 var(--pixel-shadow);background:var(--cream-2)}
.bunting{display:none}
.board.pixel-entry{max-width:none;margin:0;display:grid;grid-template-columns:minmax(0,1fr) 384px;gap:24px;
  padding:12px;border:4px solid var(--timber);background:var(--cream);text-align:left;
  box-shadow:inset 0 0 0 2px var(--timber-top),4px 4px 0 var(--pixel-shadow),0 8px 0 var(--timber-light)}
.entry-copy{padding:20px 16px 12px;min-width:0}
.entry-label{display:flex;align-items:center;gap:8px;margin:0 0 20px;color:var(--moss);font-size:12px;line-height:24px}
.board.pixel-entry .bn{justify-content:flex-start;margin:0 0 16px}
.board.pixel-entry .bt{font-size:36px;line-height:48px;color:var(--ink);text-shadow:none;letter-spacing:0}
.board.pixel-entry .who{font-size:12px;background:none;border:0;box-shadow:none;padding:0;margin:0 0 12px;color:var(--ink-2)}
.entry-intro{font-size:12px;line-height:24px;margin:0 0 16px;color:var(--ink-2)}
.pixel-entry .social{justify-content:flex-start;gap:8px;margin:0;flex-wrap:wrap}
.pixel-entry .social .soc{color:var(--ink);background:var(--cream-2);border:1px solid var(--timber-light);box-shadow:0 2px 0 var(--timber-light);padding:8px 10px}
.pixel-entry .social .soc:hover{background:var(--cream-3);transform:translateY(-2px)}
.entry-counts{display:flex;gap:20px;flex-wrap:wrap;margin-top:24px;padding-top:16px;border-top:2px dotted var(--cream-3)}
.entry-counts a{display:flex;align-items:center;gap:8px;color:var(--ink);text-decoration:none;font-size:12px;line-height:24px}
.entry-counts b{font-size:24px;line-height:24px;color:var(--moss)}
.entry-counts a:hover span{text-decoration:underline;text-underline-offset:4px}
.entry-view{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:8px}
.entry-caption{display:flex;justify-content:center;align-items:center;gap:20px;margin:0;padding:12px;color:var(--cream);background:var(--timber);font-size:12px;line-height:24px}
html[data-time="night"] .entry-caption{color:var(--ink)}
.pixel-window{position:relative;height:264px;overflow:hidden;background:#b8d4cc;border:4px solid var(--timber);box-shadow:inset 0 0 0 4px #e3ead0;isolation:isolate}
.pixel-window::before{content:'';position:absolute;width:32px;height:32px;top:24px;right:36px;background:#fff0ac;box-shadow:4px 0 #fff0ac,-4px 0 #fff0ac,0 4px #fff0ac,0 -4px #fff0ac}
.pixel-window::after{content:'';position:absolute;bottom:0;left:0;right:0;height:56px;background:repeating-linear-gradient(90deg,#566642 0 4px,transparent 4px 32px),linear-gradient(#899655 0 8px,#74824b 8px 32px,#a9986a 32px 40px,#77834a 40px);z-index:-1}
.window-hills{position:absolute;left:-20px;right:-20px;bottom:56px;height:104px;background:#8bad91;clip-path:polygon(0 55%,8% 55%,8% 40%,20% 40%,20% 24%,38% 24%,38% 40%,50% 40%,50% 12%,68% 12%,68% 32%,82% 32%,82% 55%,100% 55%,100% 100%,0 100%);z-index:-1}
.window-cloud{position:absolute;top:40px;left:28px;width:72px;height:12px;background:#edf2da;box-shadow:12px -8px #edf2da,24px -16px #edf2da}
.pixel-window .dc-house{position:absolute;left:20px;bottom:24px;width:192px!important}
.pixel-window .dc-mill{position:absolute;right:16px;left:auto;bottom:54px;width:96px!important}
.pixel-window .dc-pond-svg{position:absolute;right:0;bottom:0;width:144px!important}
.window-tree{position:absolute;left:0;bottom:40px;z-index:2}.window-tree .ic{width:64px;height:64px}
.window-crops{position:absolute;bottom:4px;left:48px;display:flex;gap:8px}.window-crops .ic{width:24px;height:24px}
html[data-season="autumn"] .pixel-window{background:#d6d6a9}html[data-season="autumn"] .window-hills{background:#a5ac78}
html[data-season="winter"] .pixel-window{background:#bdcfd6}html[data-season="winter"] .window-hills{background:#dce6da}
html[data-season="winter"] .pixel-window::after{background:linear-gradient(#e7efe3 0 12px,#b2c5bd 12px 16px,#d8e3d8 16px)}
html[data-time="night"] .pixel-window{background:#263c45;box-shadow:inset 0 0 0 4px #3c575b}
html[data-time="night"] .window-hills{background:#3e5a56}html[data-time="night"] .window-cloud{opacity:.16}
html[data-time="night"] .pixel-window::before{background:#f5e2a4;box-shadow:4px 0 #f5e2a4,-4px 0 #f5e2a4,0 4px #f5e2a4,0 -4px #f5e2a4}
html[data-time="night"] .pixel-window>svg{filter:brightness(.78) saturate(.8)}
.toolbar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:var(--s2);padding:var(--s3);background:var(--timber);border:2px solid var(--pixel-shadow);margin:var(--s6) 0 0;box-shadow:0 4px 0 var(--timber-light)}
.toolbar .tool{justify-content:center;gap:12px;min-height:52px;border:2px solid var(--timber-light);background:var(--cream);box-shadow:inset 0 -4px 0 var(--cream-3);padding:8px}
.toolbar .tool .ic{width:24px;height:24px}.toolbar .tool em{opacity:1}
.toolbar .tool:hover{background:var(--cream-2);box-shadow:inset 0 -4px 0 var(--timber-top);transform:translateY(-2px)}
.secondary-nav{margin:10px 0 28px;text-align:right}.secondary-nav>summary{color:var(--ink);background:var(--cream-2);display:inline-block;padding:4px 12px;border:1px solid var(--timber)}
.secondary-nav[open]{background:var(--cream);padding:8px;border:2px solid var(--timber)}
.layout{grid-template-columns:minmax(0,1fr) 288px;gap:var(--s7)}
.panel{border:3px solid var(--timber);padding:var(--s6);background:var(--cream);box-shadow:4px 4px 0 var(--pixel-shadow),inset 0 0 0 2px var(--cream-3);margin-bottom:var(--s8)}
.panel::after{display:none}.panel>.cor{opacity:.7}.panel>.cor .ic{width:12px;height:12px}
.panel>.pt{position:relative;top:auto;left:auto;width:fit-content;max-width:100%;margin:-2px 0 var(--s6);padding:var(--s1) var(--s3);background:var(--timber);color:#ffedbb;border:2px solid var(--timber-light);box-shadow:2px 2px 0 var(--pixel-shadow);line-height:24px;gap:var(--s3)}
body:not(.is-article) .panel>.pt{font-size:24px;line-height:32px}
body:not(.is-article) .panel>.pt>.ic{width:24px;height:24px}
.pt::before,.pt::after{display:none}
.dc-shelf{margin:24px -22px -22px;padding:8px 12px 4px;min-height:32px;border-top:3px solid var(--timber);background:repeating-linear-gradient(0deg,var(--timber-light) 0 4px,var(--timber) 4px 6px,var(--timber-light) 6px 16px);box-shadow:inset 0 2px var(--timber-top)}
.dc-shelf .dc-season{gap:16px}.dc-shelf svg{width:24px;height:24px}.dc-shelf i,.dc-fy,.dc-stone{animation:none}
.rgrid{gap:16px}.rcard{position:relative;min-height:184px;padding:20px 16px 16px;border:2px solid var(--timber-light);background:var(--cream-2);box-shadow:inset 0 4px var(--cream-3);gap:14px}
.rc-h{gap:10px;align-items:center}.rc-h b{font-size:24px;line-height:32px;overflow-wrap:anywhere}
.rc-d{font-size:12px;line-height:24px;opacity:1;color:var(--ink-2)}
.rc-f{padding-top:10px;border-top:1px dashed var(--timber-light)}
.rcard:hover{background:var(--cream);box-shadow:4px 4px 0 var(--timber-light);transform:translate(-2px,-2px)}
.rfoot{justify-content:flex-start;font-size:12px;margin-top:18px}.museum-more{line-height:24px}.museum-more a,.more a{color:var(--ink);text-underline-offset:5px}
#projects .museum-more{justify-content:flex-end;margin-top:-24px}#projects .dc-shelf{margin-top:24px}
.tl-item{padding-bottom:18px}.tl-card{padding:14px;border:0;border-bottom:2px solid var(--cream-3);background:transparent;gap:14px}
.tl-item.lead .tl-card{background:var(--cream-2);border:2px solid var(--timber-light);box-shadow:inset 4px 0 var(--moss);padding:18px}
.tl-exc{line-height:24px;color:var(--ink-2);opacity:1}.tl-title{line-height:24px}
.tl-item.lead .tl-title{font-size:36px;line-height:48px}.tl-item:hover .tl-card{background:var(--cream-2);transform:none}
.tl-tag{border:0;background:var(--cream-3);padding:2px 6px}.tl-line{opacity:.3}
.tl-cover{border:0;background:none;height:auto}.tl-cover img{height:auto;object-fit:contain}
.stack li{border:0;background:none;padding:8px 0;flex-wrap:wrap;border-bottom:1px dotted var(--timber-light)}
.stack .tbar{border:1px solid var(--timber-light);height:10px}.stack li>.ic{display:none}
.calendar-date{border-bottom:2px dashed var(--cream-3);padding-bottom:16px;margin-bottom:20px}
.calendar-date time{font-size:24px;line-height:32px;letter-spacing:-1px}
#calendar .se{min-height:58px;border:1px solid var(--timber-light);background:var(--cream-2);gap:8px}
#calendar .se .ic{width:24px;height:24px}#calendar .se.on{outline:2px solid var(--moss);outline-offset:2px;background:var(--cream-3);color:var(--ink)}
.calendar-auto{background:var(--cream-2);color:var(--ink);border:1px solid var(--timber-light)}
.harvest-counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.harvest-counts a{display:flex;flex-direction:column;align-items:flex-start;padding:12px;border:1px solid var(--timber-light);background:var(--cream-2);gap:12px}
.harvest-counts a b{color:var(--moss)}.harvest-counts a:hover{background:var(--cream-3)}
.museum-zone-title{margin:8px 0 16px;gap:12px;line-height:24px}.shelf-tabs{gap:8px;margin-bottom:20px}
.shelf-tab,.museum-filter{padding:8px 12px;border:1px solid var(--timber-light);box-shadow:0 2px var(--cream-3)}
.shelf{padding-bottom:20px}.shelf-status,.gfoot{line-height:24px}.exc .t{line-height:24px;height:48px}
.gt{gap:14px}.gt-n{height:auto;line-height:24px}.gt-h{line-height:24px}
.gstrip{gap:16px;justify-content:flex-start}.gstrip .gp{border:4px solid var(--cream-2);outline:1px solid var(--timber-light);box-shadow:3px 3px var(--cream-3);padding-bottom:12px;background:var(--cream-2)}
.gstrip img{height:120px}.dc-path{margin-top:-10px;margin-bottom:26px;opacity:.65}
.is-article .artpage,.is-article .cmtpanel{max-width:860px}.is-article .artbody{max-width:42rem;line-height:1.9}
/* 有目录的文章（柯西 2026-09-20：目录放左边）面板放宽到 1000px：
   860 - 48(面板内边距) - 200(目录栏) - 28(栏间距) = 584px，比从前的阅读宽度
   42rem(672px) 还窄；放宽后正文正好拿回 672px。 specificity 必须比上面那条
   .is-article .artpage 高一级（多个 .has-toc），否则同特异性下还是 860 赢。 */
.is-article .artpage.has-toc{max-width:1000px}
.is-article .abarnav.has-toc{max-width:1000px}
.is-article .abarnav{max-width:860px;margin:0 auto 24px}.abtn{border:2px solid var(--timber-light);box-shadow:0 3px var(--timber);padding:8px 12px}
.is-article .arttitle{margin-top:12px}.is-article .artcover img{border:0;box-shadow:none}
.is-article .dc-shelf{margin-top:32px}.is-article .artpage>.pt{font-size:12px}
.sitebottom{margin-top:var(--s8)}.site-links{line-height:24px}.dc-farmyard{padding-top:var(--s5)}
@media(max-width:1000px){.board.pixel-entry{grid-template-columns:minmax(0,1fr) 300px;gap:8px}.entry-copy{padding:16px 12px}.board.pixel-entry .bt{font-size:24px;line-height:36px}.entry-counts{gap:12px}.entry-counts b{font-size:12px}.layout{grid-template-columns:minmax(0,1fr) 264px;gap:var(--s5)}.rc-h b{font-size:12px;line-height:24px}.rgrid{gap:12px}.rcard{padding:16px 12px}}
@media(max-width:760px){.wrap{padding:0 16px 32px}.appearance-settings{padding:0 16px}.board.pixel-entry{grid-template-columns:1fr;padding:8px;gap:0}.entry-copy{padding:16px}.entry-view{padding:8px}.pixel-window{height:184px}.pixel-window .dc-house{width:160px!important;left:calc(50% - 110px)}.pixel-window .dc-mill{right:32px;width:80px!important}.entry-caption{padding:8px}.entry-label{margin-bottom:12px}.entry-counts{margin-top:16px;gap:16px}.entry-counts b{font-size:24px}.toolbar{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:8px}.toolbar .tool{flex-direction:column;padding:8px 2px;gap:4px}.toolbar .tool .ic{width:24px;height:24px}.layout{grid-template-columns:1fr}.panel{padding:var(--s5);margin-bottom:var(--s7)}.panel>.pt{margin-bottom:var(--s5)}body:not(.is-article) .panel>.pt{font-size:24px}.dc-shelf{margin:20px -18px -18px}.rgrid{grid-template-columns:1fr}.rcard{min-height:0}.rc-h b{font-size:24px;line-height:32px}.rc-d{-webkit-line-clamp:3}.rfoot{display:none}#projects .museum-more{margin-top:20px;justify-content:center}/* ⚠️ 窄屏的 .tl-item 必须是**两列**：日期列（.tl-when）在 1080 以下就被 gen.js
   display:none 了，而 display:none 的元素**不占网格格位** —— 这里若写回三列，
   .tl-card 会掉进第 2 列（原来给轴线的那 18px），卡片只剩内边距、内容宽 0，
   手机上时间线只剩一根空条（2026-09-21 发现，纯静态断言看不出来，得在窄屏量宽度）。
   轴列 40px 是这里刻意放大的（配 18px 的圆点），轴线中心 = 40/2 → left 19px。
   卡片内部同理：封面在 820 以下已经隐藏，内部网格留成 1 列。 */
.tl-item{grid-template-columns:40px minmax(0,1fr);gap:8px}.tl-line{left:19px;width:3px}.tl-dot{width:18px;height:18px}.tl-card{padding:10px;grid-template-columns:minmax(0,1fr);gap:10px}.tl-cover{width:40px}.tl-item.lead .tl-card{padding:12px}.tl-item.lead .tl-title{font-size:24px;line-height:36px}.layout>aside{display:grid;grid-template-columns:1fr;gap:0}.gstrip img{height:96px}.museum-zone-title{flex-wrap:wrap}.douban-mark-link{margin-left:0}.dc-scene,.dc-pond{display:none}}
/* ===== 窄屏横向溢出的两个源头（2026-09-20 量出来的，别再当"环境问题"） =====
   ⚠️ 这两条**必须留在本文件**：本文件是样式表里最后一份，写进 gen.js 会被上面的
   .shelf-tab / .dc-shelf 覆盖（同特异性、后来者胜），看着改了其实没生效。

   1) 博物馆的 5 个分类按钮（全部1198 / 影287 / 书44 / 音乐571 / 游戏296）
      一行天然要 354px，而它所在面板的内容宽只有 320px→242 / 360px→282 /
      375px→297 / 390px→312。实测 360px 就已经顶出面板外（页面横向溢出 9px）。
      先收紧内边距（375px 以上这样就是一行了），再允许折行兜底 ——
      折行只在真的放不下时发生，不是把窄屏都变成两行。
      ⚠️ 不能用 overflow-x:auto：内容会藏进滚动条后面，DOM 里查得到、屏幕上看不见。 */
@media(max-width:430px){
  .shelf-bar{flex-wrap:wrap;gap:4px}
  .shelf-tab{padding:8px 4px}
  .shelf-tab i{padding:0 2px}
}
/*   2) 装饰层「面板底部作物架」(.dc-shelf，build/decor.js) 本身是 aria-hidden 的纯装饰，
      却是把右栏顶宽的真凶：8 个作物 × 24px + 7 × 16px 间隙 = 304px 的**硬最小宽**，
      320px 时把右栏每个面板都撑到 338px → 整页横向溢出 34px。
      试过 .dc-shelf{overflow:hidden}：**没用** —— 块级 flex 容器的 overflow 不会让
      最小内容宽变小（实测仍然 328），所以只能让它在窄屏真的变窄。
      间隙 16→8 后作物组 248px，反推到 298px 视口都不会再溢出。 */
@media(max-width:360px){
  .dc-shelf .dc-season{gap:8px}
}
`;

module.exports = {hero, css};
