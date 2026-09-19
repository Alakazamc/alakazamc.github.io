// Public listening charts only. No login, audio downloads, or private album collection.
const fs = require('fs');
const path = require('path');
const UID = 98752754;
const DATA = path.join(__dirname, 'data');
const snapshotPath = path.join(DATA, 'netease.json');
const statusPath = path.join(DATA, 'external-sync.json');
const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};

async function chart(type) {
  const response = await fetch(`https://music.163.com/api/v1/play/record?uid=${UID}&type=${type}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw Error('网易云 HTTP ' + response.status);
  const result = await response.json();
  const rows = result[type === 1 ? 'weekData' : 'allData'];
  if (result.code !== 200 || !Array.isArray(rows)) throw Error('网易云排行暂不可用');
  return rows.map(({ song }, index) => ({
    rank: index + 1, id: song.id, title: song.name,
    artist: (song.ar || song.artists).map(x => x.name).join(' / '),
    album: (song.al || song.album).name,
    cover: (song.al || song.album).picUrl.replace(/^http:/, 'https:'),
    url: `https://music.163.com/#/song?id=${song.id}`
  }));
}

async function main() {
  const state = read(statusPath);
  const request = read(path.join(__dirname, '../content/sync-request.json'));
  if (fs.existsSync(snapshotPath) && process.env.REFRESH_DATA !== 'true' &&
      (!request.id || request.id === state.handledRequest)) {
    console.log('网易云排行无刷新请求。');
    return;
  }
  const attemptedAt = new Date().toISOString();
  state.sources ||= {};
  try {
    const [week, all] = await Promise.all([chart(1), chart(0)]);
    const snapshot = { uid: UID, updatedAt: attemptedAt, week, all };
    fs.writeFileSync(snapshotPath + '.tmp', JSON.stringify(snapshot, null, 2));
    fs.renameSync(snapshotPath + '.tmp', snapshotPath);
    state.sources.netease = { status: 'success', lastSuccess: attemptedAt, weekCount: week.length, allCount: all.length };
    console.log(`网易云排行已更新：本周 ${week.length} 首，所有时间 ${all.length} 首。`);
  } catch (error) {
    state.sources.netease = { ...state.sources.netease, status: 'failed', attemptedAt, message: '本次同步失败，保留上次排行' };
    console.error('::warning::网易云同步失败，保留上次排行：' + error.message);
    process.exitCode = 1;
  }
  fs.writeFileSync(statusPath, JSON.stringify(state, null, 2));
}
module.exports = { chart, main };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
