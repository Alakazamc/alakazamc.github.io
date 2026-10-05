// 时刻表行（V20 第 6.7 节）：首页「最新文章」面板、概览「最近写下」和博客列表页共用这一个渲染函数，
// 取代原来 gen.js 与 posts.js 里两份逐字节同构的 card()。
// 列：日期 ｜ 轴线站点 ｜ 标题块（标题、一行摘要、标签）｜ 箭头。行里不放封面：封面留给文章页头图与分享卡。
// opts.href：文章链接（首页 posts/<slug>.html，博客页同级 <slug>.html）；opts.lead：最近一篇稍大；opts.ic：调用方的图标函数。
// 行末箭头用 icons.js 的 play（游戏菜单里的 ▶ 选择指针）：同名的 arrow 其实是鼠标光标的像素图，放在行末像一枚卡住的指针。
const { esc } = require('./md.js');
const { TAG_ICON } = require('./content.js');

function row(a, i, { href, lead, ic }) {
  const [y, m, d] = String(a.date).split('-');
  // 来源标签在前（本站／豆瓣影评），再跟至多两个文章标签。
  const tags = [a.source === 'douban' ? '豆瓣影评' : '本站']
    .concat(a.tags.filter((t) => t !== '豆瓣影评'))
    .slice(0, 3);
  return `
      <li class="tl-item${lead ? ' lead' : ''}">
        <div class="tl-when"><b>${m}.${d}</b><i>${y}</i></div>
        <div class="tl-axis"><span class="tl-dot">${ic(a.icon, 'sm')}</span></div>
        <a class="tl-card" style="--i:${i}" href="${esc(href)}">
          <div class="tl-body">
            <b class="tl-title">${esc(a.title)}</b>
            <p class="tl-exc">${esc(a.excerpt.slice(0, 110))}</p>
            <div class="tl-tags">${tags.map((t) => `<span class="tl-tag">${TAG_ICON[t] ? ic(TAG_ICON[t], 'xs') : ''}${esc(t)}</span>`).join('')}</div>
          </div>
          ${ic('play', 'sm tl-go')}
        </a>
      </li>`;
}

module.exports = { row };
