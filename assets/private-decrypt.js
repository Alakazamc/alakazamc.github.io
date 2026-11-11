/* 私密文章：浏览器本地解密。
   页面里只有密文，没有明文、没有密码、没有密码哈希。
   密码错了 AES-GCM 会直接解密失败，据此提示即可。 */
(function () {
  'use strict';
  var raw = document.getElementById('locked-data');
  var form = document.getElementById('lock-form');
  if (!raw || !form) return;

  var pack;
  try { pack = JSON.parse(raw.textContent); } catch (e) { return; }

  var pass = document.getElementById('lock-pass');
  var err = document.getElementById('lock-err');
  var panel = document.getElementById('lock-panel');
  var body = document.getElementById('locked-body');
  var title = document.getElementById('lock-title');
  var hint = document.getElementById('lock-hint');

  function bytes(b64) {
    var s = atob(b64);
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    if (!pass.value) { err.textContent = '先输入密码。'; return; }
    if (!window.crypto || !crypto.subtle) {
      err.textContent = '当前环境不支持加密接口，请用 https 打开本站。';
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = '解开中…'; }
    var enc = new TextEncoder();

    crypto.subtle.importKey('raw', enc.encode(pass.value), 'PBKDF2', false, ['deriveKey'])
      .then(function (km) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: bytes(pack.salt), iterations: pack.iter, hash: 'SHA-256' },
          km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (key) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(pack.iv) }, key, bytes(pack.data));
      })
      .then(function (plain) {
        return JSON.parse(new TextDecoder().decode(plain));
      })
      .then(function (obj) {
        title.textContent = obj.title || '私密文章';
        document.title = (obj.title || '私密文章') + ' · 柯西 Alakazam';
        var meta = document.querySelector('.artmeta');
        if (!meta && obj.date) {
          meta = document.createElement('p');
          meta.className = 'artmeta';
          title.parentNode.insertBefore(meta, title.nextSibling);
          meta.textContent = obj.date;
        }
        if (hint) hint.style.display = 'none';
        panel.style.display = 'none';
        body.className = 'artbody';
        (obj.paras || []).forEach(function (text) {
          var p = document.createElement('p');
          p.textContent = text;
          body.appendChild(p);
        });
        pass.value = '';
      })
      .catch(function () {
        err.textContent = '密码不对，再试一次。';
        if (btn) { btn.disabled = false; btn.textContent = '解锁'; }
        pass.focus();
        pass.select();
      });
  });
})();
