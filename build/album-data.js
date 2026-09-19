const fs = require('fs');
const path = require('path');
function load() {
  const file = path.join(__dirname, '../content/netease-albums.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { items: [], updatedAt: '' };
}
module.exports = { load };
