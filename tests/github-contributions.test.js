const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../build/refresh-github.js');

/* 造一个和真实 GraphQL 响应同形状的 contributionsCollection。
   counts 长度不是 7 的倍数时，最后一周天然就是残周 —— 正好用来测补齐。 */
function makeCalendar(counts, startDate = '2026-09-06') {
  const d = new Date(startDate + 'T00:00:00Z');
  const days = counts.map((n) => {
    const date = d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
    return { date, contributionCount: n };
  });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push({ contributionDays: days.slice(i, i + 7) });
  return { contributionCalendar: { totalContributions: counts.reduce((a, b) => a + b, 0), weeks } };
}
const REPO = {
  isPrivate: false, isFork: false, name: 'demo', description: 'd', stargazerCount: 1,
  pushedAt: '2026-10-01T00:00:00Z', url: 'https://github.com/Alakazamc/demo',
  primaryLanguage: { name: 'Go', color: '#00ADD8' }, repositoryTopics: { nodes: [] },
  languages: { edges: [{ size: 10, node: { name: 'Go', color: '#00ADD8' } }] }
};
const withRepos = (extra) => ({ user: Object.assign({ repositories: { pageInfo: { hasNextPage: false }, nodes: [REPO] } }, extra) });

test('the query actually asks for the contribution calendar', () => {
  const q = G.buildQuery();
  assert.match(q, /contributionsCollection\s*\{/);
  assert.match(q, /contributionCalendar\s*\{/);
  assert.match(q, /contributionDays\s*\{[^}]*contributionCount/);
});

test('total sums every day of the year, not just the rendered window', () => {
  const counts = new Array(40).fill(0); counts[0] = 7; counts[39] = 5;
  assert.equal(G.deriveContributions(makeCalendar(counts)).total, 12);
});

test('keeps only the last four weeks, seven cells each', () => {
  const counts = new Array(42).fill(0).map((_, i) => i);
  const c = G.deriveContributions(makeCalendar(counts));
  assert.equal(c.recentWeeks.length, 4);
  for (const w of c.recentWeeks) assert.equal(w.length, 7);
  assert.deepEqual(c.recentWeeks[0], counts.slice(14, 21));
  assert.deepEqual(c.recentWeeks[3], counts.slice(35, 42));
});

test('pads a partial trailing week with -1 so the grid stays rectangular', () => {
  const c = G.deriveContributions(makeCalendar(new Array(27).fill(1)));
  assert.equal(c.recentWeeks.length, 4);
  assert.deepEqual(c.recentWeeks[3], [1, 1, 1, 1, 1, 1, -1]);
});

test('recentStart is the date of the first cell in the kept window', () => {
  assert.equal(G.deriveContributions(makeCalendar(new Array(42).fill(0), '2026-08-23')).recentStart, '2026-09-06');
});

test('streak counts consecutive active days ending today', () => {
  const counts = new Array(28).fill(0); counts[25] = 3; counts[26] = 1; counts[27] = 9;
  assert.equal(G.deriveContributions(makeCalendar(counts)).streak, 3);
});

test('an empty today does not break the streak', () => {
  const counts = new Array(28).fill(0); counts[24] = 3; counts[25] = 1; counts[26] = 9; counts[27] = 0;
  assert.equal(G.deriveContributions(makeCalendar(counts)).streak, 3);
});

test('a gap the day before yesterday ends the streak', () => {
  const counts = new Array(28).fill(0); counts[24] = 5; counts[26] = 2; counts[27] = 0;
  assert.equal(G.deriveContributions(makeCalendar(counts)).streak, 1);
});

test('lastActiveAt is the most recent day that had a contribution', () => {
  const counts = new Array(28).fill(0); counts[20] = 4;
  assert.equal(G.deriveContributions(makeCalendar(counts)).lastActiveAt, '2026-09-26');
});

test('an all-zero calendar yields zeros and a null last-active date', () => {
  const c = G.deriveContributions(makeCalendar(new Array(28).fill(0)));
  assert.deepEqual({ total: c.total, streak: c.streak, lastActiveAt: c.lastActiveAt }, { total: 0, streak: 0, lastActiveAt: null });
});

test('a missing or malformed collection degrades to null instead of throwing', () => {
  for (const bad of [undefined, null, {}, { contributionCalendar: null }, { contributionCalendar: { weeks: [] } }, { contributionCalendar: { weeks: [{}] } }]) {
    assert.equal(G.deriveContributions(bad), null, JSON.stringify(bad));
  }
});

test('convert() carries contributions when present and null when absent', () => {
  assert.equal(G.convert(withRepos()).contributions, null);
  const c = G.convert(withRepos({ contributionsCollection: makeCalendar([1, 2, 3]) })).contributions;
  assert.equal(c.total, 6);
  assert.equal(c.streak, 3);
});

test('convert() still returns repos when the collection is missing entirely', () => {
  const out = G.convert(withRepos());
  assert.equal(out.repos.length, 1);
  assert.equal(out.totals.repos, 1);
});

/* 私有仓库名一旦进快照就是泄露 —— build/data/github.json 是**公开可读**的
   （alakazamc.github.io/build/data/github.json）。以后谁把
   commitContributionsByRepository 加进查询，这条会红。 */
test('contributions never carry repository names, private or otherwise', () => {
  const cal = makeCalendar([1, 2, 3]);
  cal.commitContributionsByRepository = [
    { repository: { nameWithOwner: 'Alakazamc/kxsite', isPrivate: true }, contributions: { totalCount: 3 } },
    { repository: { nameWithOwner: 'SzuDesktopTeam/szudesktop', isPrivate: false }, contributions: { totalCount: 1 } }
  ];
  const json = JSON.stringify(G.convert(withRepos({ contributionsCollection: cal })).contributions);
  assert.ok(!json.includes('kxsite'), json);
  assert.ok(!json.includes('nameWithOwner'), json);
  assert.ok(!json.includes('repository'), json);
});
