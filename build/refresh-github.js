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
   Public GitHub data only. Failure leaves the last good snapshot untouched. */
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

/* 查询串：个人仓库 + 每个补录仓库一个别名字段。
   补录用 `repository(owner:, name:)` 而不是查组织的仓库列表 —— 目标是**具体这个仓库**，
   与它现在归谁无关（转组织、转回个人都不用改这里）。 */
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
    }
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
module.exports={USER,SKIP,EXTRA_REPOS,buildQuery,collectNodes,convert,refresh};
if(require.main===module)refresh().then(changed=>console.log(changed?'GitHub data refreshed':'GitHub data unchanged')).catch(e=>{console.error('Keeping last snapshot: '+e.message);process.exitCode=1});
