// 站点级配置 —— 改这里就够了，不用碰生成器代码。
//
// ===== 评论系统 =====
//
// 静态站点自己没法存评论（没有后端、没有数据库），所以必须挂一个现成的服务。
// 当前支持两种，改 provider 一个字段就能切换：
//
//   'giscus'  —— 评论存在 GitHub Discussions 里。
//                ✅ 零部署，把 4 个值填上就能用；数据在自己仓库里，可导出。
//                ❌ 评论者必须登录 GitHub 账号。国内读者大多没有，这是硬伤。
//
//   'twikoo'  —— 评论存在自部署的云函数里（腾讯云 / Vercel）。
//                ✅ 不用登录，填个昵称就能评；国内可直接访问。
//                ❌ 要你自己去部署一次（约 10 分钟，一次性），数据在别人家的库里。
//
//   ''        —— 不渲染评论区。文章页会显示一行说明，不是坏掉。
//
// 不填就等于关着。**没配好之前页面不会报错**，只会少一个评论区 —— 这是刻意的，
// 免得一个还没定的服务把整站构建搞挂。
const SITE = {
  name: '柯西 Alakazam',
  home: 'stardew-maximal-v3.html',
  // Provisional selection from existing public projects; descriptions remain source-backed.
  featuredRepos: ['szudesktop', 'pskit-2.0', 'ProteinAgent'],

  comments: {
    provider: 'giscus',           // '' | 'giscus' | 'twikoo'  —— 2026-09-16 柯西选了 giscus

    // ===== 已配好（2026-09-16）=====
    //
    // repoId / categoryId 是用本机 gh 的 GraphQL 直接查的（不用去 giscus.app 手抄）：
    //   gh api -X PATCH repos/Alakazamc/Alakazamc -f has_discussions=true
    //   gh api graphql -f query='{repository(owner:"Alakazamc",name:"Alakazamc")
    //     {id discussionCategories(first:10){nodes{id name}}}}'
    //
    // ⚠️ 只剩一步只能手动做：到 https://github.com/apps/giscus 把 giscus App
    //    装到 Alakazamc/Alakazamc 仓库，游客才能真正评论。
    //
    // 如果以后换仓库，重新走这三步：
    //   1. 打开 https://github.com/Alakazamc/alakazamc.github.io/settings
    //      → Features 里勾上 **Discussions**（仓库必须是 public）
    //   2. 打开 https://giscus.app/zh-CN ，按提示**安装 giscus App** 到该仓库
    //      （给仓库读写 Discussions 的权限，这是它存评论的地方）
    //   3. 回到 giscus.app 页面：
    //      · 「仓库」填 Alakazamc/alakazamc.github.io
    //      · 「Discussion 分类」选 Announcements
    //      → 页面底部「启用 giscus」会生成一段 <script>，
    //        把里面的 data-repo-id 和 data-category-id 两个值抄到下面
    //
    // 抄完跑 `node build/gen.js`，文章页底部的评论区就会长出来。
    // 没填之前**不会报错也不会留下空白块** —— 会显示一行"还差哪几个值"。
    giscus: {
      repo: 'Alakazamc/alakazamc.github.io',
      repoId: 'R_kgDOUcQh5g',     // 2026-09-16 用 gh GraphQL 直接查到,不用去 giscus.app 手抄
      category: 'Announcements',
      categoryId: 'DIC_kwDOUcQh5s4DFtSW',
      mapping: 'pathname',        // 每篇文章按 URL 路径开一个讨论帖
      reactionsEnabled: '1',
      inputPosition: 'top'
    },

    // Twikoo 的 envId：部署完云函数后拿到的地址
    twikoo: {
      envId: ''                   // 例 'https://xxx-xxx.ap-shanghai.app.tcloudbase.com'
    }
  }
};

module.exports = SITE;
