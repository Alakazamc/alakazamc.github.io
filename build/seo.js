// Apply public page metadata after generation; both homepage URLs share one canonical.
const fs = require('fs');
const path = require('path');
const {esc} = require('./md.js');
const {articles} = require('./content.js');
const {rssXml} = require('./papermod.js');
const SITE = require('./site.config.js');
const ORIGIN = 'https://alakazamc-github-io.vercel.app';
function apply(root) {
  const list = articles();
  const byPage = new Map(list.map(a => ['posts/'+a.slug+'.html', a]));
  const files = ['stardew-maximal-v3.html'];
  for (const dir of ['posts','museum','workshop','gallery','harvest']) {
    for (const name of fs.readdirSync(path.join(root,dir))) if(name.endsWith('.html') && !name.startsWith('_')) files.push(dir+'/'+name);
  }
  for (const rel of files) {
    const file=path.join(root,rel);
    let html=fs.readFileSync(file,'utf8').replace(/<!-- SEO -->[\s\S]*?<!-- \/SEO -->\s*/g,'');
    const title=(html.match(/<title>(.*?)<\/title>/s)||[])[1]||'柯西 Alakazam';
    const url=ORIGIN+(rel==='stardew-maximal-v3.html'?'/':'/'+rel.replace(/index\.html$/,''));
    const article=byPage.get(rel);
    const description=esc(article ? article.excerpt : '柯西 Alakazam 的个人主页，记录项目、文章、书影音与照片。');
    const image=article?.cover ? new URL(article.cover, ORIGIN+'/').href : ORIGIN+'/assets/preview.png';
    const type=rel.startsWith('posts/')&&!rel.endsWith('index.html')?'article':'website';
    const tags=`<!-- SEO -->
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.name)} · RSS" href="${ORIGIN}/rss.xml">
<meta name="description" content="${description}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<!-- /SEO -->
`;
    fs.writeFileSync(file,html.replace('</head>',tags+'</head>'));
  }
  fs.writeFileSync(path.join(root,'rss.xml'),rssXml(list,ORIGIN,SITE.name));
  const urls=files.map(rel=>new URL(rel==='stardew-maximal-v3.html'?'/':'/'+rel.replace(/index\.html$/,''),ORIGIN).href);
  fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>'<url><loc>'+esc(url)+'</loc></url>').join('\n')+'\n</urlset>\n');
  fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n');
  fs.copyFileSync(path.join(root,'stardew-maximal-v3.html'),path.join(root,'index.html'));
  const editor=path.join(root,'build','blog-editor.html');
  if(fs.existsSync(editor)) {
    fs.mkdirSync(path.join(root,'write'),{recursive:true});
    fs.copyFileSync(editor,path.join(root,'write','index.html'));
  }
}
module.exports={apply};
