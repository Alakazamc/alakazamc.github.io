// Apply public page metadata after generation; both homepage URLs share one canonical.
const fs = require('fs');
const path = require('path');
const {esc} = require('./md.js');
const ORIGIN = 'https://alakazamc-github-io.vercel.app';
function apply(root) {
  const files = ['stardew-maximal-v3.html'];
  for (const dir of ['posts','museum','workshop','gallery']) {
    for (const name of fs.readdirSync(path.join(root,dir))) if(name.endsWith('.html') && !name.startsWith('_')) files.push(dir+'/'+name);
  }
  for (const rel of files) {
    const file=path.join(root,rel);
    let html=fs.readFileSync(file,'utf8').replace(/<!-- SEO -->[\s\S]*?<!-- \/SEO -->\s*/g,'');
    const title=(html.match(/<title>(.*?)<\/title>/s)||[])[1]||'柯西 Alakazam';
    const url=ORIGIN+(rel==='stardew-maximal-v3.html'?'/':'/'+rel.replace(/index\.html$/,''));
    const description=esc('柯西 Alakazam 的个人主页，记录项目、文章、书影音与照片。');
    const type=rel.startsWith('posts/')&&!rel.endsWith('index.html')?'article':'website';
    const tags=`<!-- SEO -->
<link rel="canonical" href="${esc(url)}">
<meta name="description" content="${description}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${ORIGIN}/assets/preview.png">
<meta name="twitter:card" content="summary_large_image">
<!-- /SEO -->
`;
    fs.writeFileSync(file,html.replace('</head>',tags+'</head>'));
  }
  fs.copyFileSync(path.join(root,'stardew-maximal-v3.html'),path.join(root,'index.html'));
  const editor=path.join(root,'build','blog-editor.html');
  if(fs.existsSync(editor)) {
    fs.mkdirSync(path.join(root,'write'),{recursive:true});
    fs.copyFileSync(editor,path.join(root,'write','index.html'));
  }
}
module.exports={apply};
