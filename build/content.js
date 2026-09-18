// 「文章」的统一模型。
//
// 站点上有两种文章：
//   A. 本站文章 —— content/posts/*.md（发帖系统的产物，柯西自己写的）
//   B. 豆瓣影评 —— build/data/douban.json 的 reviews（抓取脚本拉的，他自己在豆瓣写的）
//
// 关键决定：**这两者当成同一种东西**。它们都是「柯西写的东西」，
// 区别只在来源。所以统一成一个 Article 结构，时间线和文章页都不必再分两套代码，
// 页面上只用一枚小标签标出来源。
//
// Article 结构：
//   slug      文件名（不含 .html）→ 文章路径就是 posts/<slug>.html
//   title     标题
//   date      YYYY-MM-DD（排序键）
//   tags      []string
//   source    'site' | 'douban'
//   html      正文 HTML
//   excerpt   纯文本摘要（时间线上用）
//   cover     相对站点根目录的封面路径，没有就是 ''
//   link      外部原文链接（豆瓣影评才有，本站文章为 ''）
//   meta      一行补充信息（豆瓣是评分/阅读数，本站是标签）
//   icon      时间线圆点用的图标名

const fs = require('fs');
const path = require('path');
const md = require('./md.js');

const POST_DIR = path.join(__dirname, '..', 'content', 'posts');
const DOUBAN_FILE = path.join(__dirname, 'data', 'douban.json');

// 极简 front-matter：--- 开头 --- 结尾，冒号分隔，值可以写成 [a, b] 数组。
// 不引 YAML 库的理由和 md.js 一样：零依赖。
function parseFrontMatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i < 0 || !line.trim()) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (/^\[.*\]$/.test(v)) {
      v = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (/^".*"$/.test(v) || /^'.*'$/.test(v)) {
      v = v.slice(1, -1);
    }
    data[k] = v;
  });
  return { data, body: src.slice(m[0].length) };
}

// ---------- A. 本站文章 ----------
function loadPosts() {
  if (!fs.existsSync(POST_DIR)) return [];
  return fs.readdirSync(POST_DIR)
    // 下划线开头的是模板和草稿，构建时跳过
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const full = path.join(POST_DIR, f);
      const raw = fs.readFileSync(full, 'utf8');
      const { data, body } = parseFrontMatter(raw);
      const slug = f.replace(/\.md$/, '');
      // 没写 title 就退回正文里的第一个 # 标题，再没有才用文件名 ——
      // 宁可名字难看，也不要构建直接失败
      const h1 = /^#\s+(.+)$/m.exec(body);
      const title = String(data.title || (h1 ? h1[1] : '') || slug).trim();
      // 没写 date 用文件修改时间，保证时间线上不会掉出一条
      const date = String(data.date || fs.statSync(full).mtime.toISOString().slice(0, 10)).slice(0, 10);
      return {
        slug,
        title,
        date,
        dateKnown: !!data.date,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [String(data.tags)] : []),
        source: 'site',
        html: md.render(body),
        excerpt: String(data.summary || '').trim() || md.excerpt(body, 96),
        cover: String(data.cover || '').trim(),
        link: '',
        meta: '',
        icon: 'wateringcan'
      };
    })
    .filter((a) => a.date);
}

// ---------- B. 豆瓣影评 ----------
//
// 影评的正文从接口的 `content` 里来，抓取脚本已经切成段落数组存在 paras 里。
// 页面上要标出来源并留一条回豆瓣原文的链接 —— 内容虽是他写的，
// 但豆瓣才是首发地，读者想去点赞/看别人的评论得能找到路。
function loadReviews() {
  if (!fs.existsSync(DOUBAN_FILE)) return [];
  let j;
  try { j = JSON.parse(fs.readFileSync(DOUBAN_FILE, 'utf8')); } catch { return []; }
  const reviews = (j && j.reviews) || [];
  return reviews.map((r) => {
    const sub = r.subject || {};
    const stars = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '';
    const bits = [stars, sub.title, r.readCount ? r.readCount + ' 人读过' : ''].filter(Boolean);
    return {
      slug: 'douban-' + r.id,
      title: r.title,
      date: String(r.date || '').slice(0, 10),
      tags: ['豆瓣影评'].concat(sub.type === 'tv' ? ['剧集'] : ['电影']),
      source: 'douban',
      html: (r.paras || []).map((p) => '<p>' + md.esc(p) + '</p>').join('\n'),
      excerpt: r.abstract || md.excerpt((r.paras || []).join(' '), 96),
      cover: sub.cover ? 'assets/covers/' + sub.cover : '',
      link: r.url || '',
      meta: bits.join(' · '),
      // 有评分就用星星当圆点，没评分用书
      icon: r.rating ? 'star' : 'book',
      rating: r.rating || null,
      subject: sub.title || '',
      subtitle: sub.subtitle || ''
    };
  }).filter((a) => a.date && a.html);
}

// 合并 + 按日期倒序（同一天的本站文章排在影评前面，让"自己站里写的"更显眼）
function articles() {
  return loadPosts()
    .concat(loadReviews())
    .sort((a, b) => {
      const d = String(b.date).localeCompare(String(a.date));
      if (d) return d;
      return (a.source === 'site' ? -1 : 1);
    });
}

module.exports = { articles, loadPosts, loadReviews, parseFrontMatter, POST_DIR };
