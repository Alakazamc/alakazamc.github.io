// 极简 Markdown → HTML。
//
// 为什么自己写而不用现成库：这个项目**刻意零依赖**（gen.js 纯 Node，
// 整条链能直接搬进 GitHub Actions，不用 npm install 任何东西）。
// 为了文章正文引一个 markdown 解析器不划算，而且它的输出还得再套一层样式适配。
//
// 支持的语法（写博客够用；不认识的语法会**原样输出**，不会静默吃掉内容）：
//   标题      # ## ###          →  <h2> <h3> <h4>
//   粗体      **x**
//   斜体      *x*
//   行内代码  `x`
//   链接      [文字](url)
//   图片      ![说明](url)
//   无序列表  - / * / +
//   有序列表  1. / 1)
//   引用      > x
//   分割线    ---
//   代码块    ``` 围栏
//   段落      连续两行会合成一段（软换行），空行分段
//
// ⚠️ 两个必须注意的地方（都处理了，改代码时别弄反）：
//   1. **先转义 HTML，再做行内替换**。反过来的话，正文里写 <script> 会直接生效。
//   2. **代码块里不跑行内替换**。否则 `a * b` 会被当成斜体、`[x](y)` 会变成链接。
//      （围栏内容单独走 esc()，不进 inline()。）
//
// 标题从 h2 起 —— h1 是文章标题本身，由文章页模板输出，正文再出 h1 会有两个主标题。

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// 行内语法。入参必须是**已经转义过**的字符串。
function safeUrl(url, image) {
  if (!url || /[\u0000-\u0020\u007f\\]/.test(url) || url.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return image ? /^https?:/i.test(url) : /^(https?:|mailto:)/i.test(url);
  return !url.split(/[/?#]/)[0].includes(':');
}
function inline(s) {
  // Tokenize first: generated markup, code and URL attributes never enter emphasis parsing.
  const token = /`([^`]+)`|(!?)\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let out = '', at = 0, m;
  while ((m = token.exec(s))) {
    out += s.slice(at, m.index);
    if (m[1] !== undefined) out += '<code>' + m[1] + '</code>';
    else if (m[3] !== undefined) {
      if (!safeUrl(m[4], !!m[2])) out += m[3];
      else if (m[2]) out += '<img src="' + m[4] + '" alt="' + m[3] + '" loading="lazy">';
      else out += '<a href="' + m[4] + '" target="_blank" rel="noopener noreferrer">' + inline(m[3]) + '</a>';
    } else if (m[5] !== undefined) out += '<strong>' + m[5] + '</strong>';
    else out += '<em>' + m[6] + '</em>';
    at = token.lastIndex;
  }
  return out + s.slice(at);
}
const HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const HEAD = /^\s*(#{1,4})\s+(.*)$/;
const QUOTE = /^\s*>\s?/;
const UL = /^\s*[-*+]\s+(.*)$/;
const OL = /^\s*\d+[.)]\s+(.*)$/;
const FENCE = /^\s*```/;

function render(src) {
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
  let i = 0;

  while (i < lines.length) {
    const ln = lines[i];

    if (FENCE.test(ln)) {                       // 代码块：整段原样，不进行内替换
      closeList();
      const buf = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;                                       // 吃掉收尾的 ```
      out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
      continue;
    }

    if (!ln.trim()) { closeList(); i++; continue; }

    if (HR.test(ln)) { closeList(); out.push('<hr>'); i++; continue; }

    const h = ln.match(HEAD);
    if (h) {
      closeList();
      const lv = Math.min(4, h[1].length + 1);   // # → h2（h1 留给文章标题）
      out.push('<h' + lv + '>' + inline(esc(h[2])) + '</h' + lv + '>');
      i++;
      continue;
    }

    if (QUOTE.test(ln)) {
      closeList();
      const buf = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        buf.push(lines[i].replace(QUOTE, ''));
        i++;
      }
      out.push('<blockquote>' + buf.map((l) => '<p>' + inline(esc(l)) + '</p>').join('') + '</blockquote>');
      continue;
    }

    const ul = ln.match(UL);
    const ol = ln.match(OL);
    if (ul || ol) {
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { closeList(); out.push('<' + want + '>'); list = want; }
      out.push('<li>' + inline(esc((ul || ol)[1])) + '</li>');
      i++;
      continue;
    }

    // 段落：一直吃到空行，或撞上别的块级语法为止
    closeList();
    const buf = [ln];
    i++;
    while (
      i < lines.length && lines[i].trim() &&
      !HEAD.test(lines[i]) && !QUOTE.test(lines[i]) &&
      !UL.test(lines[i]) && !OL.test(lines[i]) &&
      !FENCE.test(lines[i]) && !HR.test(lines[i])
    ) { buf.push(lines[i]); i++; }
    out.push('<p>' + inline(esc(buf.join(' '))) + '</p>');
  }

  closeList();
  return out.join('\n');
}

// 从 markdown 里抽一段纯文本摘要（时间线上用），去掉所有标记
function excerpt(src, n) {
  return String(src || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s*/gm, '')
    .replace(/[*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n || 96);
}

module.exports = { render, excerpt, esc };
