// 首页主卡与状态栏。保留像素素材，用连续位移连接逐帧步态。
const { FRAMES } = require('./girl-frames.js');
const SIZE = 40;

function anchorOf(html) {
  return /id="([A-Za-z0-9_-]+)"/.exec(html)[1];
}

function dash(panes, side) {
  const tabs = panes.map((p, i) =>
    `<a class="dash-tab" role="tab" id="dtab-${i}" href="#${anchorOf(p.html)}" aria-controls="dpane-${i}" ` +
    `aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">${p.label}</a>`).join('');
  const body = panes.map((p, i) =>
    `<div class="tabpane${i === 0 ? ' on' : ''}" id="dpane-${i}" role="tabpanel" aria-labelledby="dtab-${i}">${p.html}</div>`).join('');
  return `<div class="dash">
  <div class="dash-head">
    <nav class="dash-tabs" role="tablist" aria-label="首页分区">${tabs}</nav>
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
  var frames = ${JSON.stringify(FRAMES)}, size = ${SIZE};
  var tabs = Array.from(document.querySelectorAll('.dash-tab'));
  var panes = Array.from(document.querySelectorAll('.tabpane'));
  var bar = document.querySelector('.dash-tabs'), track = document.querySelector('.dash-track');
  var walker = document.querySelector('.dash-walk'), art = walker.querySelector('use');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0, position = 0, travel = 0;
  var map = {};
  panes.forEach(function(p, i){ map[p.querySelector('[id]').id] = i; });
  map.ledger = map.farm;

  function destination(i){
    var a = track.getBoundingClientRect(), b = tabs[i].getBoundingClientRect();
    return Math.round(b.left + b.width / 2 - size / 2 - a.left);
  }
  function draw(x){
    position = x;
    walker.style.setProperty('--x', Math.round(x) + 'px');
  }
  function rest(){
    walker.classList.remove('walking');
    art.setAttribute('href', '#px-girl');
  }
  function place(i, animate){
    cancelAnimationFrame(travel);
    var from = position, to = destination(i), distance = Math.abs(to - from);
    if (!animate || motion.matches || distance < 2){ draw(to); rest(); return; }
    // 连点时从屏幕上的当前位置转向，不退回上一个标签，不积压定时器。
    var duration = Math.min(720, Math.max(220, distance * 1.25));
    var start = performance.now(), frame = -1;
    walker.classList.add('walking');
    function step(now){
      var progress = Math.min(1, (now - start) / duration);
      var ease = progress * progress * (3 - 2 * progress);
      draw(from + (to - from) * ease);
      var next = Math.floor(Math.abs(position - from) / 12) % frames.length;
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
  function fromHash(){
    var hash = location.hash.slice(1);
    if (!hash) go(0, false);
    else if (hash === 'basket') go(map.museum, false);
    else if (map[hash] != null) go(map[hash], false);
  }
  window.addEventListener('popstate', fromHash);
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('resize', function(){ place(current, false); });
  window.addEventListener('load', function(){ place(current, false); });
  motion.addEventListener('change', function(){ place(current, false); });

  var root = document.documentElement;
  var clock = document.getElementById('dash-clock');
  var greet = document.getElementById('dash-greet'), meta = document.getElementById('dash-meta');
  var greeting = '', typing = 0;
  function updateStatus(){
    var now = new Date(), hour = now.getHours();
    var pad = function(n){ return String(n).padStart(2, '0'); };
    clock.innerHTML = pad(hour) + '<b>:</b>' + pad(now.getMinutes()) + '<b>:</b>' + pad(now.getSeconds());
    var hello = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    var text = hello + '，欢迎来坐坐';
    if (greeting !== text){
      var first = !greeting;
      greeting = text; clearTimeout(typing);
      if (!first || motion.matches) greet.textContent = text;
      else {
        var index = 0;
        (function type(){
          greet.textContent = text.slice(0, ++index);
          if (index < text.length) typing = setTimeout(type, 65);
        })();
      }
    }
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

