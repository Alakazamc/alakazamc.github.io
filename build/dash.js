// 首页主卡与状态栏。保留像素素材，用连续位移连接逐帧步态。
const { FRAMES } = require('./girl-frames.js');
const SIZE = 40;   // 桌面上女孩的尺寸；页面脚本改为读 DOM，这里只留作导出

function anchorOf(html) {
  return /id="([A-Za-z0-9_-]+)"/.exec(html)[1];
}

// 线路图（V20 第 6.4 节）：每个面板是一站，kind 为 'express'（快车站）或 'local'（普通站）。
// 最后一个快车站加 is-turn-end、第一个普通站加 is-turn-start：手机上两行在这里换行，各是一段完整线路。
// 相馆或友链为空时面板连同车站一起不渲染，<nav> 上的 data-express／data-local 告诉 CSS 每行几站。
function dash(panes, side) {
  const kinds = panes.map((p) => p.kind);
  const lastExpress = kinds.lastIndexOf('express'), firstLocal = kinds.indexOf('local');
  const tabs = panes.map((p, i) =>
    `<a class="dash-tab is-${p.kind}${i === lastExpress ? ' is-turn-end' : ''}${i === firstLocal ? ' is-turn-start' : ''}" role="tab" id="dtab-${i}" href="#${anchorOf(p.html)}" aria-controls="dpane-${i}" ` +
    `aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}"><span class="stn">${p.label}</span></a>`).join('');
  const body = panes.map((p, i) =>
    `<div class="tabpane${i === 0 ? ' on' : ''}" id="dpane-${i}" role="tabpanel" aria-labelledby="dtab-${i}">${p.html}</div>`).join('');
  return `<div class="dash">
  <div class="dash-head">
    <nav class="dash-tabs" role="tablist" aria-label="首页分区" data-express="${kinds.filter((k) => k === 'express').length}" data-local="${kinds.filter((k) => k === 'local').length}">${tabs}</nav>
    <div class="dash-track" aria-hidden="true">
      <svg class="dash-walk" viewBox="0 0 16 16"><use class="art" href="#px-girl"></use></svg>
    </div>
  </div>
  <main class="dash-body">${body}</main>
  <aside class="dash-side">${side.join('')}</aside>
</div>`;
}

function dashScript() {
  return `<script>
(function(){
  var frames = ${JSON.stringify(FRAMES)};
  var tabs = Array.from(document.querySelectorAll('.dash-tab'));
  var panes = Array.from(document.querySelectorAll('.tabpane'));
  var bar = document.querySelector('.dash-tabs'), track = document.querySelector('.dash-track');
  var walker = document.querySelector('.dash-walk'), art = walker.querySelector('use');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0, position = {x: 0, y: 0}, travel = 0;
  var map = {};
  panes.forEach(function(p, i){ map[p.querySelector('[id]').id] = i; });
  map.ledger = map.farm;

  // 目标坐标相对整条线路图的叠层：x 是站格中心减女孩半宽，y 是站格所在行的顶边（桌面一行恒为 0）。
  // 女孩宽度读 DOM：桌面 40，≤760 时 CSS 改成 32。
  function destination(i){
    var a = track.getBoundingClientRect(), b = tabs[i].getBoundingClientRect();
    var w = walker.getBoundingClientRect().width;
    return {x: Math.round(b.left + b.width / 2 - w / 2 - a.left), y: Math.round(b.top - a.top)};
  }
  function draw(p){
    position = p;
    walker.style.setProperty('--x', Math.round(p.x) + 'px');
    walker.style.setProperty('--y', Math.round(p.y) + 'px');
  }
  function rest(){
    walker.classList.remove('walking');
    art.setAttribute('href', '#px-girl');
  }
  function place(i, animate){
    cancelAnimationFrame(travel);
    var from = position, to = destination(i), distance = Math.abs(to.x - from.x);
    // 跨行（只在 ≤760 两行时出现）直接到位：斜着走会在半路压住第一行的站名。
    if (!animate || motion.matches || distance < 2 || to.y !== from.y){ draw(to); rest(); return; }
    // 连点时从屏幕上的当前位置转向，不退回上一个标签，不积压定时器。
    var duration = Math.min(720, Math.max(220, distance * 1.25));
    var start = performance.now(), frame = -1;
    walker.classList.add('walking');
    function step(now){
      var progress = Math.min(1, (now - start) / duration);
      var ease = progress * progress * (3 - 2 * progress);
      draw({x: from.x + (to.x - from.x) * ease, y: to.y});
      var next = Math.floor(Math.abs(position.x - from.x) / 12) % frames.length;
      if (next !== frame){ art.setAttribute('href', '#px-' + frames[next]); frame = next; }
      if (progress < 1) travel = requestAnimationFrame(step);
      else rest();
    }
    travel = requestAnimationFrame(step);
  }
  function go(i, animate){
    tabs.forEach(function(t, k){
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      panes[k].classList.toggle('on', k === i);
    });
    current = i;
    place(i, animate);
  }
  function select(i){
    if (i === current) return;
    history.pushState(null, '', tabs[i].getAttribute('href'));
    go(i, true);
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(e){
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      select(i);
    });
  });
  bar.addEventListener('keydown', function(e){
    var next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current + tabs.length - 1) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault(); select(next); tabs[next].focus();
  });
  // 返回是否命中分区：music、comments-home 等非分区锚点只交给浏览器原生滚动。
  function fromHash(){
    var hash = location.hash.slice(1);
    var i = !hash ? 0 : hash === 'basket' ? map.museum : map[hash];
    if (i == null) return false;
    go(i, false);
    return true;
  }
  // 线路图回到视野（V20 第 6.5 节）：只对分区锚点生效，线路图整条都在视口里就不动。
  // pushState 不触发 hashchange，点线路图本身不会滚动。
  var head = document.querySelector('.dash-head');
  function reveal(){
    var r = head.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) head.scrollIntoView({block: 'start', behavior: motion.matches ? 'auto' : 'smooth'});
  }
  window.addEventListener('popstate', fromHash);
  window.addEventListener('hashchange', function(){ if (fromHash()) reveal(); });
  window.addEventListener('resize', function(){ place(current, false); });
  window.addEventListener('load', function(){
    place(current, false);
    var h = location.hash.slice(1);
    if (h && h !== 'board' && (h === 'basket' || map[h] != null)) reveal();
  });
  motion.addEventListener('change', function(){ place(current, false); });

  // 站台 sticky 落点（第 6.6 节）：侧栏比视口矮时贴顶 16px；比视口高时为负值，先随页面滚，底边离视口底 16px 才停。
  var side = document.querySelector('.dash-side');
  function sideTop(){ side.style.setProperty('--side-top', Math.min(16, innerHeight - side.offsetHeight - 16) + 'px'); }
  new ResizeObserver(sideTop).observe(side);
  window.addEventListener('resize', sideTop);

  var root = document.documentElement;
  var clock = document.getElementById('dash-clock');
  var greet = document.getElementById('dash-greet'), meta = document.getElementById('dash-meta');
  function updateStatus(){
    var now = new Date(), hour = now.getHours();
    var pad = function(n){ return String(n).padStart(2, '0'); };
    clock.innerHTML = pad(hour) + '<b>:</b>' + pad(now.getMinutes()) + '<b>:</b>' + pad(now.getSeconds());
    var hello = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    greet.textContent = hello + '，欢迎来坐坐';
    var season = {spring:'春', summer:'夏', autumn:'秋', winter:'冬'}[root.dataset.season];
    meta.textContent = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
      ' · ' + season + ' · ' + (root.dataset.time === 'night' ? '夜间' : '白天');
  }
  // 读同一份主题状态，也能接住脚本随后进行的自动季节初始化。
  new MutationObserver(updateStatus).observe(root, {attributes:true, attributeFilter:['data-season','data-time']});
  (function tick(){ updateStatus(); setTimeout(tick, 1000 - Date.now() % 1000); })();
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) updateStatus(); });
  fromHash();
})();
</script>`;
}

module.exports = { dash, dashScript, SIZE };

