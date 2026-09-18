// Adapted from Hugo PaperMod layouts/_partials/footer.html (MIT).
// https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/footer.html
// Copyright (c) 2020 nanxiaobei and adityatelange; 2021-2026 adityatelange.
// License: papermod-LICENSE.txt. Changes: Chinese labels, scoped selector,
// await clipboard result; remove Hugo/line-number layouts and execCommand fallback.
document.querySelectorAll('.artbody pre > code').forEach((codeblock) => {
  const copybutton = document.createElement('button');
  copybutton.type = 'button';
  copybutton.classList.add('copy-code');
  copybutton.textContent = '复制代码';
  copybutton.setAttribute('aria-live', 'polite');
  function copyingDone() {
    copybutton.textContent = '已复制';
    setTimeout(() => {
      copybutton.textContent = '复制代码';
    }, 2000);
  }
  copybutton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeblock.textContent);
      copyingDone();
    } catch {
      copybutton.textContent = '复制失败，请手动选择';
    }
  });
  codeblock.parentNode.appendChild(copybutton);
});
