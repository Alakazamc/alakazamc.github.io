// Public GitHub data only. Failure leaves the last good snapshot untouched.
const fs=require('fs'),path=require('path');
const DATA_DIR=path.join(__dirname,'data'),USER='Alakazamc';
const SKIP=new Set(['Alakazamc','alakazamc.github.io']);
const QUERY="{\n  user(login: \"Alakazamc\") {\n    repositories(first: 100, ownerAffiliations: OWNER, isFork: false,\n                 orderBy: {field: PUSHED_AT, direction: DESC}) {\n      pageInfo { hasNextPage }\n      nodes {\n        isPrivate\n        isFork\n        name\n        description\n        stargazerCount\n        pushedAt\n        url\n        primaryLanguage { name color }\n        repositoryTopics(first: 8) { nodes { topic { name } } }\n        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {\n          edges { size node { name color } }\n        }\n      }\n    }\n  }\n}";
function convert(data){
 if(!data?.user?.repositories?.nodes || data.user.repositories.pageInfo?.hasNextPage)throw Error('Incomplete repository response');
  const all = (data.user && data.user.repositories && data.user.repositories.nodes) || [];

  const repos = all
    .filter((r) => r.isPrivate === false && r.isFork === false && !SKIP.has(r.name))
    .map((r) => ({
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
    }));

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

  const out = {
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


 return out;
}
async function refresh(fetcher=fetch){
 const token=process.env.GITHUB_TOKEN;if(!token)throw Error('GitHub token unavailable');
 const r=await fetcher('https://api.github.com/graphql',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query:QUERY}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('GitHub HTTP '+r.status);
 const result=await r.json();if(result.errors)throw Error('GitHub query failed');
 const out=convert(result.data);if(!out.repos.length)throw Error('Empty response; keeping prior snapshot');
 const target=path.join(DATA_DIR,'github.json');
 const old=JSON.parse(fs.readFileSync(target,'utf8'));
 if(JSON.stringify({...old,updatedAt:''})===JSON.stringify({...out,updatedAt:''}))return false;
 const tmp=target+'.tmp';fs.writeFileSync(tmp,JSON.stringify(out,null,1));fs.renameSync(tmp,target);return true;
}
module.exports={convert,refresh};
if(require.main===module)refresh().then(changed=>console.log(changed?'GitHub data refreshed':'GitHub data unchanged')).catch(e=>{console.error('Keeping last snapshot: '+e.message);process.exitCode=1});
