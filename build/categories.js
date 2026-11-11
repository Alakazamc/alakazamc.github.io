// 文章分类（2026-11-11）。
//
// 只做「归类 + 计数」，不改动任何文章源文件：分类从 tags / slug 推导，
// 少数几篇用显式覆盖。好处是云端写作台新增文章时不用记得填分类字段，
// 也不会因为漏填而掉出列表。
//
// ⚠️ 私密文章**不进 articles()**（它根本没有 md 源文件），所以这里只有入口，
//    没有 categoryOf 的返回值。它的正文是密文，见 private.js。
const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'ai', label: 'AI 与模型' },
  { id: 'ontology', label: '本体论笔记' },
  { id: 'eng', label: '工程实践' },
  { id: 'essay', label: '随笔' },
  { id: 'media', label: '书影音' }
];

// 规则顺序即优先级；先命中的赢。
// eng 只收真正的基础设施 / 排查类；「代码审查」「软件工程」这类词在 AI 文章里
// 也会出现，放进去会把「AI 审批与代码检查」「DeepSeek Harness」误分到工程实践。
const RULES = [
  ['ontology', /Utopia|Ontology|本体论|utopia/i],
  ['eng', /校园网|网络排查|SZUDesktop|Docker|K8s|Jenkins|部署/i],
  ['ai', /AI|模型|Agent|BERT|置信度|评测|工具调用|ReAct|Harness/i],
  ['essay', /随笔|读书|编程/i]
];

// 少数文章按 tags 会归错类，这里点名纠正。
const OVERRIDE = {
  'ai-coding-and-necessary-precision': 'essay',
  'how-to-live-with-ai': 'essay'
};

function categoryOf(a) {
  if (a.source === 'douban') return 'media';
  if (OVERRIDE[a.slug]) return OVERRIDE[a.slug];
  const hay = (a.slug || '') + ' ' + (a.tags || []).join(' ');
  for (const [id, re] of RULES) if (re.test(hay)) return id;
  return 'essay';
}

module.exports = { CATEGORIES, categoryOf, OVERRIDE };
