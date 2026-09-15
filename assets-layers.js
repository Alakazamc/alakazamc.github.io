/* ===================================================================
   assets-layers.js — 素材背景层的动态元素
   依赖 assets-layers.css 与 <div class="asset-bg"> 骨架
   =================================================================== */
(function () {
  'use strict';

  // 固定种子随机：刷新后布局一致，不会每次都不一样
  function rng(seed) {
    var s = seed;
    return function () {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  var root = document.documentElement;
  var box = document.querySelector('.asset-bg');
  if (!box) return;

  /* ---------- 单朵云（cloud3 / cloud4，142×83） ---------- */
  function buildCloudBits(season) {
    var old = box.querySelectorAll('.cloud-bit');
    for (var i = 0; i < old.length; i++) old[i].remove();

    var r = rng(77321 + season.length * 97);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 9; i++) {
      var el = document.createElement('i');
      el.className = 'cloud-bit';
      var src = (i % 2 ? 'assets/cloud3.png' : 'assets/cloud4.png');
      var w = 90 + Math.floor(r() * 5) * 34;       // 90–226px
      var top = 4 + r() * 30;                       // 4%–34%
      var dur = (70 + r() * 110).toFixed(0);        // 70–180s
      el.style.cssText =
        'background-image:url("' + src + '");' +
        'width:' + w + 'px;height:' + Math.round(w * 0.585) + 'px;' +
        'top:' + top.toFixed(1) + '%;' +
        'opacity:' + (0.55 + r() * 0.4).toFixed(2) + ';' +
        'animation-duration:' + dur + 's;' +
        'animation-delay:-' + (r() * 120).toFixed(0) + 's;';
      frag.appendChild(el);
    }
    box.appendChild(frag);
  }

  /* ---------- 飞鸟（bird.gif） ---------- */
  function buildBirds() {
    var old = box.querySelectorAll('.bird');
    for (var i = 0; i < old.length; i++) old[i].remove();

    var r = rng(44921);
    var frag = document.createDocumentFragment();
    // 两群：一群 3 只飞高，一群 2 只飞低
    var flock = [
      { n: 3, top: [16, 24], size: 34, dur: [46, 62] },
      { n: 2, top: [34, 42], size: 26, dur: [64, 84] }
    ];
    flock.forEach(function (g, gi) {
      for (var i = 0; i < g.n; i++) {
        var el = document.createElement('i');
        el.className = 'bird';
        var sz = g.size + Math.floor(r() * 3) * 4;
        var top = g.top[0] + r() * (g.top[1] - g.top[0]);
        var dur = g.dur[0] + r() * (g.dur[1] - g.dur[0]);
        el.style.cssText =
          'background-image:url("assets/bird.gif");' +
          'width:' + sz + 'px;height:' + Math.round(sz * 0.62) + 'px;' +
          'top:' + top.toFixed(1) + '%;' +
          'animation-duration:' + dur.toFixed(0) + 's,' + (3 + r() * 3).toFixed(1) + 's;' +
          'animation-delay:-' + (r() * dur).toFixed(0) + 's,0s;' +
          'animation-iteration-count:infinite,infinite;';
        frag.appendChild(el);
      }
    });
    box.appendChild(frag);
  }

  /* ---------- 祝尼魔 ----------
     两种出场：底部散步的队列 + 藏在草丛里探头的 */
  function buildJunimos() {
    var old = box.querySelectorAll('.junimo,.junimo-parade');
    for (var i = 0; i < old.length; i++) old[i].remove();

    var r = rng(90210);
    var frag = document.createDocumentFragment();

    // 1) 底部走过的队列（用五色长条图，整条走过去很有辨识度）
    var parade = document.createElement('i');
    parade.className = 'junimo-parade';
    var pw = 190 + Math.floor(r() * 3) * 40;
    parade.style.cssText =
      'background-image:url("assets/loading-junimo.gif");' +
      'width:' + pw + 'px;height:' + Math.round(pw * 0.25) + 'px;' +
      'bottom:' + (3 + r() * 6).toFixed(1) + '%;' +
      'animation-duration:' + (58 + r() * 30).toFixed(0) + 's;' +
      'animation-delay:-12s;';
    frag.appendChild(parade);

    // 2) 探头的小祝尼魔，撒在两侧，避开中间正文区
    var sides = [[3, 14], [80, 94]];   // 左右各一片安全区
    for (var s = 0; s < sides.length; s++) {
      var cnt = 3 + Math.floor(r() * 2);
      for (var i = 0; i < cnt; i++) {
        var el = document.createElement('i');
        el.className = 'junimo';
        var sz = 30 + Math.floor(r() * 4) * 7;   // 30–51px
        var left = sides[s][0] + r() * (sides[s][1] - sides[s][0]);
        el.style.cssText =
          'background-image:url("assets/j1.gif");' +
          'width:' + sz + 'px;height:' + sz + 'px;' +
          'left:' + left.toFixed(1) + '%;' +
          'bottom:' + (6 + r() * 22).toFixed(1) + '%;' +
          'animation-duration:' + (4.5 + r() * 3).toFixed(1) + 's;' +
          'animation-delay:-' + (r() * 6).toFixed(1) + 's;';
        frag.appendChild(el);
      }
    }
    box.appendChild(frag);
  }

  /* ---------- 挂历 / 星星等小装饰 ---------- */
  function buildTrinkets() {
    var old = box.querySelectorAll('.trinket');
    for (var i = 0; i < old.length; i++) old[i].remove();
    var r = rng(31337);
    var frag = document.createDocumentFragment();
    var kinds = ['assets/star.png', 'assets/star1.png', 'assets/t1.png', 'assets/diamond.png', 'assets/calendar.png'];
    for (var i = 0; i < 8; i++) {
      var el = document.createElement('i');
      el.className = 'trinket junimo';   // 复用 junimo 的漂浮动画
      var src = kinds[i % kinds.length];
      var sz = 22 + Math.floor(r() * 4) * 6;
      el.style.cssText =
        'background-image:url("' + src + '");background-size:contain;background-repeat:no-repeat;' +
        'width:' + sz + 'px;height:' + sz + 'px;' +
        'left:' + (2 + r() * 96).toFixed(1) + '%;' +
        'top:' + (46 + r() * 30).toFixed(1) + '%;' +
        'animation-duration:' + (5 + r() * 4).toFixed(1) + 's;' +
        'animation-delay:-' + (r() * 8).toFixed(1) + 's;' +
        'opacity:' + (0.5 + r() * 0.4).toFixed(2) + ';';
      frag.appendChild(el);
    }
    box.appendChild(frag);
  }

  /* ---------- 模式切换 ----------
     页面上的按钮 data-bg-toggle 可以实时切素材/代码两套背景 */
  function setMode(mode) {
    root.dataset.bg = mode;
    try { localStorage.setItem('kx-bg-mode', mode); } catch (e) {}
    var btns = document.querySelectorAll('[data-bg-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('on', btns[i].getAttribute('data-bg-toggle') === mode);
    }
  }

  /* ---------- 视差：滚动时各层不同速度 ---------- */
  var layers = [
    { sel: '.ridge.far', k: 0.030 },
    { sel: '.ridge.mid', k: 0.062 },
    { sel: '.ridge.near', k: 0.098 },
    { sel: '.cloudband', k: 0.045 },
    { sel: '.starfield', k: 0.018 },
    { sel: '.sky-img', k: 0.010 }
  ];
  var ticking = false, lastY = -1;
  function onScroll() {
    var y = window.pageYOffset;
    if (y === lastY) { ticking = false; return; }
    lastY = y;
    var p = Math.min(y, 1600);   // 必须封顶，否则层会整块沉出视口
    layers.forEach(function (L) {
      var els = document.querySelectorAll(L.sel);
      for (var i = 0; i < els.length; i++) {
        els[i].style.transform = 'translate3d(0,' + (p * L.k).toFixed(2) + 'px,0)';
      }
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- 初始化 ---------- */
  function buildAll(season) {
    buildCloudBits(season);
    buildBirds();
    buildJunimos();
    buildTrinkets();
  }

  // 季节切换时重建（云的疏密会变）
  document.addEventListener('kx:season', function (e) {
    buildAll(e.detail || root.dataset.season || 'spring');
  });

  // 绑定切换按钮
  var btns = document.querySelectorAll('[data-bg-toggle]');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function () {
      setMode(this.getAttribute('data-bg-toggle'));
    });
  }

  // 恢复上次选择；没存过就默认素材模式（既然素材都放好了）
  var saved = null;
  try { saved = localStorage.getItem('kx-bg-mode'); } catch (e) {}
  setMode(saved || 'image');

  buildAll(root.dataset.season || 'spring');
})();
