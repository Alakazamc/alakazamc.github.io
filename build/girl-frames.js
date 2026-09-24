// 星露谷短发小女孩 · 三帧像素稿（16×16 字符网格）
//
// 来源：**CC0 素材量化**（柯西 2026-09-24「能不能用别人的」）。
//   素材：OpenGameArt「Girl with Clothes」（作者 draganasgamesart，CC0 公共领域，
//   https://opengameart.org/content/girl-with-clothes ，原图留档 `_ref/girl-clothes-16.png`）
//   —— 16×16 粉发 bob 短发女孩，含 idle / walk / jump 帧，已上色。
// 量化：按 16×16 切格 → 逐像素找站内 PAL 里欧氏距离最近的颜色 → 字符网格
//   （思路见技能 `pixel-sprite-from-cc0`，转换脚本用过即删）。
//   好处：素材真变成 icons.js 能生成、check-icons 能守的符号；颜色被强制换成站内
//   调色板 → 画风自动统一（粉发→f/F、肤色→s、红衣→R/Q、眼→b、鞋→k）。
// 手工修正（自动量化必然有的色偏，共 4 处）：
//   行 7 下巴整行 o(橙)→s(肤色)；行 4/5/6 脸两侧发缘 o(橙)→F(粉暗)。
//   不改的话下巴是一条橙带 —— 只有 160px 详查图看得出来。
//
// 配色：**星露谷风**（柯西 2026-09-25「能不能用星露谷里面的」）。
//   星露谷官方 sprite 是商业美术资产，**直接取像素不能用**；但"风格/配色"不受版权保护 ——
//   这里把同一套 CC0 素材改成星露谷女农民的经典搭配：**棕发（h 亮 / d 暗）+ 蓝衣（u 亮 / U 暗）**，
//   腮红保留粉 F。像素仍是 CC0 素材 + 站内调色板，零版权风险。
//   （想切回 CC0 原配色：头发 h/d ↔ f/F、衣服 u/U ↔ R/Q，逐行对照 `_probe-sdcolor` 的映射即可。）
//
// ⚠️ 实施时把这个对象直接搬进 `build/icons.js` 的 ICONS，不要另起一份。
const GIRL = {
  // 站立（素材 idle 帧）：双脚着地
  girl: [
    '................',
    '....hhhhhhh.....',
    '...hhhhhhhhh....',
    '...hhdhhhdhh....',
    '..hhdsbsbsdhh...',
    '..hhddsssddhh...',
    '..hhdssQssdhh...',
    '..hhssssssshh...',
    '..hhFFsssFFhh...',
    '..UUUuuuuuUUU...',
    '....UuuuuuU.....',
    '....suuuuus.....',
    '.....uuuuu......',
    '....UUUUUUU.....',
    '.....ss.ss......',
    '....kkk.kkk.....'
  ],
  // 走路帧 1：右脚离地（右鞋上提一行）+ 左手前摆
  girl_b: [
    '................',
    '....hhhhhhh.....',
    '...hhhhhhhhh....',
    '...hhdhhhdhh....',
    '..hhdsbsbsdhh...',
    '..hhddsssddhh...',
    '..hhdssQssdhh...',
    '..hhssssssshh...',
    '..hhFFsssFFhh...',
    '..UUUuuuuuUUU...',
    '....UuuuuuU.....',
    '....suuuuu.s....',
    '.....uuuuu......',
    '....UUUUUUU.....',
    '.....ss.kkk.....',
    '....kkk.........'
  ],
  // 走路帧 2：左脚离地 + 右手前摆
  girl_c: [
    '................',
    '....hhhhhhh.....',
    '...hhhhhhhhh....',
    '...hhdhhhdhh....',
    '..hhdsbsbsdhh...',
    '..hhddsssddhh...',
    '..hhdssQssdhh...',
    '..hhssssssshh...',
    '..hhFFsssFFhh...',
    '..UUUuuuuuUUU...',
    '....UuuuuuU.....',
    '...s.uuuuus.....',
    '.....uuuuu......',
    '....UUUUUUU.....',
    '.....kkk.ss.....',
    '........kkk.....'
  ]
};

// 三帧循环顺序（240ms/圈）
const FRAMES = ['girl', 'girl_b', 'girl_c'];

module.exports = { GIRL, FRAMES };
