/* 精选项目 —— 工坊面板与工坊详情页顶部的「主打」区（柯西 2026-10-03 要求）。
 *
 * 为什么要有这一层：工坊的自动仓库卡（`data/github.json` → `.rcard`）只带
 * 名字 / 简介 / 语言 / 推送日期 —— 那是**仓库列表**，不是**作品介绍**。
 * 求职场景下真正要人一眼看到的是「我做了什么、我负责哪块、做出了什么」，
 * 这四件事 GitHub API 一个都给不了，只能手工维护。
 *
 * ⚠️ 纪律（与站点既有的「没有内容就不留占位」一脉相承）：
 *   1. **每条都必须在仓库里有出处** —— 本文件的 role / facts 全部来自仓库
 *      README、发布页、提交记录或真实运行截图，不写没验证过的形容词。
 *   2. **role 是求职里最不能编的一栏**。写了「主导开发」就要站得住：
 *      szuDesktop 在 SzuDesktopTeam 下有 123 条 Alakazamc 的提交；
 *      Music Map / Music Space 是 musicMapTeam 组织下的参赛作品（柯西 2026-10-03 确认主导开发）。
 *   3. 不是自己仓库的项目（wuu）走下面的 CONTRIB，**不混进精选**，
 *      并在标题里明写「开源贡献」—— 贡献者身份要如实标。
 *   4. 封面图统一 16:10、宽 800、jpg（`build/_make-covers.py` 生成，
 *      原图见 `_proj-raw/`，压完 40KB 上下）。路径是**站根相对**，
 *      由渲染层按所在目录加前缀（工坊页要加 `../`）。
 */
const FEATURED = [
  {
    id: 'musicspace',
    name: 'Music Space',
    role: '主导开发',
    tagline: '演唱会散场后，同场观众交换彼此没有的视角',
    event: '腾讯音乐高校 AI Hackathon',
    stack: ['Three.js', 'Node 24 · SQLite', 'TinyCLIP 端侧模型'],
    facts: [
      '三维 Livehouse：全景、人物、照片墙是同一个空间里的镜头切换',
      '照片私藏 / 本场分享 / 定向交换分别授权，越权读取一律 404',
      '招呼 → 本人接受 → 双向好友，含谢绝、撤回与屏蔽',
      '701 项测试 · 32 步多身份浏览器旅程'
    ],
    url: 'https://github.com/musicMapTeam/musicSpace',
    urlLabel: '查看仓库',
    shot: { src: 'assets/projects/musicspace.jpg', alt: 'Music Space 三维场馆里，两位观众的小人站在舞台与鼓组前' }
  },
  {
    id: 'musicmap',
    name: 'Music Map',
    role: '主导开发',
    tagline: '从喜欢，走向未知 —— 从一位华语歌手出发，沿真实的合唱录音走到下一位',
    event: '腾讯音乐高校 AI Hackathon',
    stack: ['单文件静态应用', '原生 JS + Canvas', '无后端'],
    facts: [
      '29 位歌手 / 37 份共同演唱录音 / 9 个独立回路',
      '每条边都有官方来源核对，只收署名「演唱」的合作，不收作曲与和声',
      '126 首开放曲库；战绩卡与发现卡片都在本机生成，不上传',
      '线上演示已部署，构建产物是单文件，双击也能跑'
    ],
    url: 'https://musicmapteam.github.io/musicMap/',
    urlLabel: '打开演示',
    repoUrl: 'https://github.com/musicMapTeam/musicMap',
    shot: { src: 'assets/projects/musicmap.jpg', alt: 'Music Map 首页：樱树下的夜场唱片店插画，左边是选歌手开始的地方' }
  },
  {
    id: 'szudesktop',
    name: 'szuDesktop · 荔枝庭院',
    role: '主导开发',
    tagline: '把深大的一小片校园搬到桌面：像素伙伴陪你专注，顺手把校园网连上',
    event: '深大学生自制 · 与学校官方无关',
    stack: ['Go', 'Electron', '像素美术 648 帧'],
    facts: [
      '像素庭院与桌面伙伴：648 帧动作、1,656 句台词，全部离线运行',
      '待办 / 专注 / 课程笔记 / 校历 / 公告，数据只留本机、无遥测',
      '校园网认证与断线诊断；命令行版 Windows / macOS / Linux 单文件',
      '已发布 beta0.9.6：Windows 安装版 + macOS 预览版'
    ],
    url: 'https://github.com/SzuDesktopTeam/szudesktop',
    urlLabel: '查看仓库',
    shot: { src: 'assets/projects/szudesktop.jpg', alt: 'szuDesktop 首页：雨后书屋的像素场景与今日待办' }
  }
];

/* 开源贡献：给别人仓库提的 PR。
   ⚠️ 和上面**必须分开**：作者与贡献者是两件事，混在一起排会读成"这些都我的"。
   事实出处：本机 D:/wuu 的 git log（author=Alakazamc）与 GitHub 上被合并的 PR #394 / #408。 */
const CONTRIB = [
  {
    name: 'wuu',
    what: '桌面端 AI agent 应用',
    by: '吴佳翮的开源项目',
    items: [
      '自动化插件的任务调度：排队中的 run 收不到生命周期事件，界面永远停在「排队中」',
      '重启后的补派发：错过时点的任务被一次注定失败的执行消耗掉，之后再也不会跑',
      '2026-09 起多次修复被合并（含与他人共同署名的 PR）'
    ],
    url: 'https://github.com/blueberrycongee/wuu'
  }
];

/* ---------- 渲染 ----------
   放在本文件而不是 gen.js：工坊详情页（workshop.js）要用**同一份**渲染结果。
   两处各写一遍 = 卡片会长得不一样，而且改一处忘一处不会报错。 */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-${n}"></use></svg>`;

/* prefix：所在目录相对站根的补丁 —— 首页传 ''，工坊详情页传 '../'。
   ⚠️ 只补在图片上（链接一律站外绝对地址）；漏传会让工坊页的封面全 404，
   而 404 的 img 在 CSS 里不占位 → 卡片顶上直接少一块，静默。 */
function featuredHtml(prefix = '') {
  const cards = FEATURED.map((f, i) => `
      <a class="pjcard" style="--i:${i}" href="${esc(f.url)}" target="_blank" rel="noopener">
        <span class="pjshot"><img src="${esc(prefix + f.shot.src)}" alt="${esc(f.shot.alt)}" width="800" height="500" loading="lazy"></span>
        <span class="pjbody">
          <span class="pjh"><b class="pjname">${esc(f.name)}</b><i class="pjrole">${esc(f.role)}</i></span>
          <span class="pjevent">${esc(f.event)}</span>
          <span class="pjtag">${esc(f.tagline)}</span>
          <span class="pjstack">${f.stack.map((s) => `<i>${esc(s)}</i>`).join('')}</span>
          <span class="pjfacts">${f.facts.map((s) => `<i>${esc(s)}</i>`).join('')}</span>
          <span class="pjgo">${esc(f.urlLabel)}${icon('arrow', 'sm')}</span>
        </span>
      </a>`).join('');

  return `<div class="pjblock" id="featured-projects">
    <p class="pjhead">${icon('chest', 'sm')}<span>精选项目</span>${icon('crystal', 'sm')}</p>
    <div class="pjgrid">${cards}</div>
  </div>`;
}

function contribHtml() {
  const box = CONTRIB.map((c) => `
      <div class="pjcbox">
        <p class="pjcname"><b>${esc(c.name)}</b><i>${esc(c.what)} · ${esc(c.by)}</i></p>
        <span class="pjfacts">${c.items.map((s) => `<i>${esc(s)}</i>`).join('')}</span>
        <a class="pjgo" href="${esc(c.url)}" target="_blank" rel="noopener">查看仓库${icon('arrow', 'sm')}</a>
      </div>`).join('');

  return `<div class="pjblock pjcontrib" id="open-source">
    <p class="pjhead">${icon('gear', 'sm')}<span>开源贡献</span>${icon('key', 'sm')}</p>
    ${box}
  </div>`;
}

module.exports = { FEATURED, CONTRIB, featuredHtml, contribHtml };
