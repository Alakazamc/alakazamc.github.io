const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../build/md.js');

test('renders the original two-column timeline table without changing its text', () => {
  const source = `| 时间轴 | 本例含义 |
| --- | --- |
| 世界时间 | 张三从3月1日起负责。 |
| 记录时间 | 系统3月5日才保存这项信息。 |`;
  assert.equal(render(source), '<div class="arttable"><table><thead><tr>' +
    '<th scope="col">时间轴</th><th scope="col">本例含义</th></tr></thead><tbody>\n' +
    '<tr><td>世界时间</td><td>张三从3月1日起负责。</td></tr>\n' +
    '<tr><td>记录时间</td><td>系统3月5日才保存这项信息。</td></tr>\n' +
    '</tbody></table></div>');
});

test('preserves all cells in the original three-column permissions table', () => {
  const source = `| 知识库角色 | 初学者的理解 | A项目的例子 |
| --- | --- | --- |
| Viewer | 读取获准的知识 | 王五查看负责人和依据 |
| Editor | 在具体写接口要求下编辑与审核 | 张三提交材料、核验更正 |
| Admin | 管理库内权限等设置 | 管理员维护成员角色 |`;
  const output = render(source);
  assert.equal((output.match(/<th scope="col">/g) || []).length, 3);
  assert.equal((output.match(/<td>/g) || []).length, 9);
  for (const row of source.split('\n').filter(line => !line.includes('---'))) {
    for (const cell of row.slice(1, -1).split('|').map(cell => cell.trim())) {
      assert.ok(output.includes('>' + cell + '<'), cell);
    }
  }
});

test('uses the existing inline renderer and escapes HTML inside table cells', () => {
  const output = render(`| 内容 | 依据 |
| --- | --- |
| <script>alert("x")</script> | [实现](https://example.com/source) |
| \`at\` 和 **时间** | [不安全](javascript:alert) |`);
  assert.ok(output.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(output.includes('<code>at</code> 和 <strong>时间</strong>'));
  assert.ok(output.includes('<a href="https://example.com/source" target="_blank" rel="noopener noreferrer">实现</a>'));
  assert.ok(output.includes('<td>不安全</td>'));
  assert.ok(!output.includes('<script>'));
  assert.ok(!output.includes('href="javascript:'));
});

test('ordinary pipe text and code blocks retain their prior rendering', () => {
  assert.equal(render('A | B\nC | D'), '<p>A | B C | D</p>');
  assert.equal(render('| A | B |\n| x | y |'), '<p>| A | B | | x | y |</p>');
  assert.equal(render('| A | B |\n| --- | --- | --- |'), '<p>| A | B | | --- | --- | --- |</p>');
  const code = '| A | B |\n| --- | --- |\n| x | y |';
  assert.equal(render('```text\n' + code + '\n```'), '<pre><code>' + code + '</code></pre>');
});

test('a table ends the preceding paragraph and yields to the following content', () => {
  const output = render('正文\n| A | B |\n| --- | --- |\n| x | y |\n下一段\n\n# 后续');
  assert.ok(output.startsWith('<p>正文</p>\n<div class="arttable">'));
  assert.ok(output.endsWith('</tbody></table></div>\n<p>下一段</p>\n<h2>后续</h2>'));
});
