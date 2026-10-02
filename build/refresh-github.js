/* GitHub 仓库数据管线的**唯一真源**：查询串、补录名单、合并规则、快照组装。
   两个入口共用本文件：
     • 云端 —— GitHub Actions 跑 `node build/refresh-github.js`
       （GITHUB_TOKEN + fetch；见 .github/workflows/build.yml）
     • 本机 —— `node build/sources/github.js`（gh CLI 优先、支持 --offline 重放），
       它 require 本文件，只保留自己的取数方式与落盘细节。
   ⚠️ 为什么不各留一份 QUERY：这两处曾经各写一份，仓库改名/转移时只改一边就漏，
      而且**一声不响**。真实案例：szudesktop 转入 SzuDesktopTeam 组织后，
      `user(...ownerAffiliations: OWNER)` 再也查不到它 —— 工坊和首页精选同时掉了一张卡。
   ⚠️ 本文件会被 push.js 传上云端（CI_BUILD_SET 显式列了它），但 sources/ 永远不会
      （那里有 heybox-sign.js 的小黑盒签名逆向，不该公开）。所以共享代码只能放这里，
      不能放到 sources/ 下 —— 云端会 MODULE_NOT_FOUND。
   ⚠️ 关于「私有」：contributionsCollection 给的是**聚合计数**，GitHub 对任何调用方
      返回同一份（实测：用第三方身份查别人的档案，日历总数含其私有贡献，而按仓库的
      明细只列公开仓库）。私有仓库名一律拿不到 —— 快照和页面上不会出现任何私有信息，
      和 github.com/Alakazamc 公开显示的是同一份数据。也正因如此，CI 里现成的
      GITHUB_TOKEN 就够用，**不需要**额外配 PAT secret。
      所以别把 commitContributionsByRepository 加进查询：它不含私有、和 total 对不上，
      还平白多出仓库名。tests/github-contributions.test.js 守着「快照里不许出现仓库名」。
   Failure leaves the last good snapshot untouched. */
const fs=require('fs'),path=require('path');
const DATA_DIR=path.join(__dirname,'data'),USER='Alakazamc';
const SKIP=new Set(['Alakazamc','alakazamc.github.io']);

/* 显式补录：不在个人账号名下、但要上墙的仓库。
   ⚠️ 只列 owner/name，**不扫整个组织** —— 与 DEPLOY_SET 同一种「显式白名单」风格：
      组织里以后新增的仓库不会自动上墙，免得把不是自己的东西算进来。 */
const EXTRA_REPOS=[{owner:'SzuDesktopTeam',name:'szudesktop'}];

const REPO_FIELDS=`
        isPrivate
        isFork
        name
        description
        stargazerCount
        pushedAt
        url
        primaryLanguage { name color }
        repositoryTopics(first: 8) { nodes { topic { name } } }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }`;

/* 查询串：个人仓库 + 每个补录仓库一个别名字段 + 一整年的贡献日历。
   补录用 `repository(owner:, name:)` 而不是查组织的仓库列表 —— 目标是**具体这个仓库**，
   与它现在归谁无关（转组织、转回个人都不用改这里）。
   ⚠️ 日历必须整年查：年度总数和「连续活跃天数」都要跨越窗口边界才准，
      只查最近 4 周会算出假的 streak。翻页裁哪几周是渲染层的事（pageWindow），快照存整年。 */
function buildQuery(){
  const extras=EXTRA_REPOS.map((r,i)=>
    `  extra${i}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) {${REPO_FIELDS}\n  }`).join('\n');
  return `{
  user(login: ${JSON.stringify(USER)}) {
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false,
                 orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage }
      nodes {${REPO_FIELDS}
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
${extras}
}`;
}

/* 个人仓库 + 补录仓库合并，按 url 去重（同名不同归属也只留一个）。
   ⚠️ 补录项查不到时 GraphQL 返回 null 而不是报错 —— 这里静默跳过，
      由守门兜底：check-workshop.js 断言「精选名单里每个名字都能在数据里找到」。 */
function collectNodes(data){
  if(!data?.user?.repositories?.nodes||data.user.repositories.pageInfo?.hasNextPage)throw Error('Incomplete repository response');
  const nodes=[];
  for(const n of data.user.repositories.nodes)nodes.push(n);
  for(const k of Object.keys(data))if(/^extra\d+$/.test(k)&&data[k])nodes.push(data[k]);
  const seen=new Set(),out=[];
  for(const r of nodes){if(!r||!r.url||seen.has(r.url))continue;seen.add(r.url);out.push(r);}
  return out;
}

/* 首页热力图**一屏只画最近 PER_PAGE 周**（可前后翻页）—— 全年 53 周里非空的只有 32 格（9%），
   一次性画出来是一整片灰，反而在说「这人一年没动几天」。实测密度：4 周 64%、6 周 48%、
   12 周 31%、全年 9%；而近 4 周已经覆盖全年 84% 的贡献量。
   ⚠️ 密度是 2026-10 快照当天的，活跃分布会变。哪天觉得格子又空了，改这一个常量。 */
const PER_PAGE = 4;

/* 把整年日历压成快照 + 三个数字。
   只留数字和日期，不留任何仓库名（见文件头「关于私有」）。
   ⚠️ **整年都存**，不止一屏那几周：首页要能往前翻到底，年度总数和连续天数
      也得跨越窗口边界才准。格子里的 -1 表示「这天还不存在」（残周尾部补位）。
   拿不到就返回 null —— 调用方按「没有这块」降级渲染，绝不让构建失败。 */
function deriveContributions(collection) {
  const weeks = collection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks) || !weeks.length) return null;
  const days = [];
  for (const w of weeks) {
    if (!Array.isArray(w?.contributionDays)) return null;
    for (const d of w.contributionDays) {
      if (!d || typeof d.date !== 'string' || typeof d.contributionCount !== 'number') return null;
      days.push({ date: d.date, count: d.contributionCount });
    }
  }
  if (!days.length) return null;

  let total = 0;
  for (const d of days) total += d.count;

  /* 连续天数：今天还没提交不算「断」。否则每天 06:23 定时构建时，只要当天还没动过，
     首页就会顶着「连续活跃 0 天」直到你提交第一次 —— GitHub 个人页也是这个规则。 */
  let i = days.length - 1;
  if (days[i].count === 0) i--;
  let streak = 0;
  for (; i >= 0 && days[i].count > 0; i--) streak++;

  let lastActiveAt = null;
  for (let k = days.length - 1; k >= 0; k--) if (days[k].count > 0) { lastActiveAt = days[k].date; break; }

  /* 残周补 -1：GitHub 的日历最后一周常常不满 7 天（今年就是 370 格 = 52 周 + 6 天），
     不补齐 CSS grid 会少一格、整列错位。渲染时把 -1 当占位空格跳过。 */
  const rows = weeks.map((w) => {
    const row = w.contributionDays.map((d) => d.contributionCount);
    while (row.length < 7) row.push(-1);
    return row;
  });

  return { total, streak, lastActiveAt, start: days[0].date, weeks: rows };
}

/* 翻页：page 从 0（最新一屏）往大翻到更早。
   返回的 from/to 是窗口里**真实存在**的那些天，不含 -1 补位 ——
   否则区间末尾会虚报一个还不存在的日子（实测最后一周只有 6 天）。
   ⚠️ 首页热力图的日期全从这里推（区间标签、悬浮气泡、月份分隔），
      所以做成纯函数放本文件：它会被 push.js 传上云端，又能被 node:test 直接 require。 */
function pageWindow(weeks, start, page, perPage) {
  if (!Array.isArray(weeks) || !weeks.length || !start || !(perPage > 0)) return null;
  const total = weeks.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(0, Number.isFinite(page) ? Math.floor(page) : 0), pages - 1);
  const end = Math.max(perPage, total - p * perPage);
  const begin = Math.max(0, end - perPage);
  const rows = weeks.slice(begin, end);
  const addDays = (date, n) => {
    const d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const cellDate = (w, d) => addDays(start, w * 7 + d);
  const first = Math.max(0, rows[0].findIndex((n) => n >= 0));
  const lastRow = rows[rows.length - 1];
  let last = lastRow.length - 1;
  while (last >= 0 && lastRow[last] < 0) last--;
  return { rows, page: p, pages, begin, from: cellDate(begin, first), to: cellDate(end - 1, last), perPage };
}

function convert(data){
  const repos=collectNodes(data)
    .filter((r)=>r.isPrivate!==true&&r.isFork!==true&&!SKIP.has(r.name))
    .map((r)=>({
      name: r.name,
      description: r.description || '',
      url: r.url,
      stars: r.stargazerCount || 0,
      pushedAt: (r.pushedAt || '').slice(0, 10),
      language: (r.primaryLanguage && r.primaryLanguage.name) || '',
      color: (r.primaryLanguage && r.primaryLanguage.color) || '',
      topics: ((r.repositoryTopics && r.repositoryTopics.nodes) || [])
        .map((t) => t.topic.name).slice(0, 4),
      langs: ((r.languages && r.languages.edges) || [])
        .map((e) => ({ name: e.node.name, color: e.node.color, size: e.size }))
    }))
    /* 接口已按 PUSHED_AT 倒序返回个人仓库，但补录项是拼在末尾的 ——
       统一按推送时间重排，最近的排在最前（首页/工坊都按这个顺序展示）。 */
    .sort((a,b)=>(b.pushedAt||'').localeCompare(a.pushedAt||''));

  // ---- 语言聚合(技术栈面板用) ----
  // ⚠️ 这是 GitHub 按**字节数**统计的,不是"写了多少逻辑"。
  // 典型失真:szudesktop 描述写着 Go 单文件,但仓库里 HTML 模板更多,
  // 主语言就被判成 HTML。所以面板上的措辞是「代码构成」而不是「技能熟练度」。
  const langMap = new Map();
  for (const r of repos) {
    for (const l of r.langs) {
      const cur = langMap.get(l.name) || { name: l.name, color: l.color, size: 0 };
      cur.size += l.size;
      langMap.set(l.name, cur);
    }
  }
  const langTotal = [...langMap.values()].reduce((a, b) => a + b.size, 0) || 1;
  const languages = [...langMap.values()]
    .sort((a, b) => b.size - a.size)
    .map((l) => ({ name: l.name, color: l.color, size: l.size, percent: l.size / langTotal }));

  return {
    user: USER,
    updatedAt: new Date().toISOString(),
    repos,
    languages,
    totals: {
      repos: repos.length,
      stars: repos.reduce((a, r) => a + r.stars, 0),
      languages: languages.length
    },
    contributions: deriveContributions(data?.user?.contributionsCollection)
  };
}

async function refresh(fetcher=fetch){
 const token=process.env.GITHUB_TOKEN;if(!token)throw Error('GitHub token unavailable');
 const r=await fetcher('https://api.github.com/graphql',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query:buildQuery()}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('GitHub HTTP '+r.status);
 const result=await r.json();if(result.errors)throw Error('GitHub query failed');
 const out=convert(result.data);if(!out.repos.length)throw Error('Empty response; keeping prior snapshot');
 const target=path.join(DATA_DIR,'github.json');
 const old=JSON.parse(fs.readFileSync(target,'utf8'));
 if(JSON.stringify({...old,updatedAt:''})===JSON.stringify({...out,updatedAt:''}))return false;
 const tmp=target+'.tmp';fs.writeFileSync(tmp,JSON.stringify(out,null,1));fs.renameSync(tmp,target);return true;
}
module.exports={USER,SKIP,EXTRA_REPOS,PER_PAGE,buildQuery,collectNodes,deriveContributions,pageWindow,convert,refresh};
if(require.main===module)refresh().then(changed=>console.log(changed?'GitHub data refreshed':'GitHub data unchanged')).catch(e=>{console.error('Keeping last snapshot: '+e.message);process.exitCode=1});
