// Adapted from Hugo PaperMod (MIT), commit d3768854d00ad003b0a8dbdba254ce9224377a01.
// Sources: layouts/_partials/toc.html and layouts/rss.xml.
// Copyright (c) 2020 nanxiaobei and adityatelange; 2021-2026 adityatelange.
// License: assets/vendor/papermod-LICENSE.txt.
// Hugo template expressions are ported to Node; TOC nesting uses depth indentation.
const {esc} = require('./md.js');

function tableOfContents(html) {
  const headings = [];
  const body = html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_, level, content) => {
    const id = 'section-' + (headings.length + 1);
    headings.push({id, level: Number(level), text: content.replace(/<[^>]*>/g, '')});
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
  if (!headings.length) return {body, toc: ''};
  const largest = Math.min(...headings.map(h => h.level));
  const toc = `<details class="toc" open>
    <summary><span class="title">文章目录</span></summary>
    <nav class="inner" aria-label="文章目录"><ul>
      ${headings.map(h => `<li style="margin-left:${(h.level-largest)*16}px"><a href="#${h.id}">${h.text}</a></li>`).join('\n')}
    </ul></nav>
  </details>`;
  return {body, toc};
}

function rssXml(list, origin, title) {
  const permalink = a => new URL('/posts/' + a.slug + '.html', origin).href;
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${origin}/</link>
    <description>${esc(title)}的文章与影评</description>
    <language>zh-CN</language>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
    ${list.map(a => `<item>
      <title>${esc(a.title)}</title>
      <link>${esc(permalink(a))}</link>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <guid>${esc(permalink(a))}</guid>
      <description>${esc(a.excerpt)}</description>
    </item>`).join('\n')}
  </channel>
</rss>\n`;
}

module.exports = {tableOfContents, rssXml};
