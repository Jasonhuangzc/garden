# ⚙️ 单词花园游戏 - 配置说明

## 🎮 核心配置常量

### game-logic.js
```javascript
const GAME_CONFIG = {
    POINTS_PER_WORD: 1,           // 1个单词 = 1积分
    FLOWER_PRICE: 5,              // 每朵花5金币
    GARDEN_SIZE: 54,              // 花园格子总数(6x9)
    AUTO_SYNC_INTERVAL: 600000    // 自动同步间隔（10分钟=600000毫秒）
};
```

### 配置说明

| 参数 | 默认值 | 说明 | 可调整范围 |
|------|--------|------|-----------|
| POINTS_PER_WORD | 1 | 每个单词转化的积分数 | 1-10 |
| FLOWER_PRICE | 5 | 每朵花的价格（金币） | 1-20 |
| GARDEN_SIZE | 54 | 花园总格子数 | 9, 16, 25, 36, 49, 54 |
| AUTO_SYNC_INTERVAL | 600000 | 自动同步间隔（毫秒） | 60000-3600000 |

---

## 🌻 花朵配置

### 可用花朵
```javascript
const FLOWERS = {
    'rose': {
        name: '玫瑰花苞',
        price: 5,
        emoji: '🌹',
        color: '#ff69b4'
    },
    'sunflower': {
        name: '向日葵',
        price: 5,
        emoji: '🌻',
        color: '#ffd700'
    },
    'tulip': {
        name: '郁金香',
        price: 5,
        emoji: '🌷',
        color: '#ff1493'
    },
    'lavender': {
        name: '薰衣草',
        price: 5,
        emoji: '💜',
        color: '#9370db'
    }
};
```

### 添加新花朵
在 `game-logic.js` 的 `FLOWERS` 对象中添加：
```javascript
'flower_id': {
    name: '花朵名称',
    price: 5,
    emoji: '🌸',
    color: '#颜色代码'
}
```

---

## 🏗️ 花园布局配置

### 当前布局：6×9
```
总格子数：54
行数：6
列数：9
```

### CSS调整（如需更改布局）
在 `style.css` 中修改：
```css
.garden-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);  /* 列数 */
    grid-template-rows: repeat(6, 1fr);     /* 行数 */
    gap: 4px;
}
```

### 其他可选布局

| 布局 | 总格子 | grid-template-columns | grid-template-rows |
|------|--------|----------------------|-------------------|
| 3×3 | 9 | repeat(3, 1fr) | repeat(3, 1fr) |
| 4×4 | 16 | repeat(4, 1fr) | repeat(4, 1fr) |
| 5×5 | 25 | repeat(5, 1fr) | repeat(5, 1fr) |
| 6×6 | 36 | repeat(6, 1fr) | repeat(6, 1fr) |
| 7×7 | 49 | repeat(7, 1fr) | repeat(7, 1fr) |
| **6×9** | **54** | **repeat(9, 1fr)** | **repeat(6, 1fr)** |

---

## ⏰ 同步配置

### 时间间隔对照表
| 间隔 | 毫秒值 | 说明 |
|------|--------|------|
| 1分钟 | 60000 | 测试用 |
| 5分钟 | 300000 | 频繁同步 |
| 10分钟 | 600000 | **当前配置** |
| 15分钟 | 900000 | 推荐 |
| 30分钟 | 1800000 | 节省资源 |
| 1小时 | 3600000 | 低频同步 |

### script.js 配置
```javascript
// 在 initializeGame() 函数中
setInterval(async () => {
    console.log('🔄 自动同步单词数据...');
    await syncWordData();
}, 600000); // 修改这个值来调整间隔
```

---

## 🎯 积分规则配置

### 当前规则
```javascript
// 1个单词 = 1积分
currentPoints = totalWordsToday * GAME_CONFIG.POINTS_PER_WORD;
```

### 可调整方案

#### 方案1：倍率系统
```javascript
// 2个单词 = 1积分
POINTS_PER_WORD: 0.5

// 1个单词 = 2积分
POINTS_PER_WORD: 2
```

#### 方案2：阶梯奖励
```javascript
// 在 game-logic.js 的 syncUserData 函数中
let points = words * 1;  // 基础积分
if (words >= 50) points += 10;   // 50+奖励
if (words >= 100) points += 20;  // 100+奖励
```

---

## 💰 金币系统配置

### 收取规则
```javascript
// 最小收取积分
const MIN_CLAIM_POINTS = 10;
```

### 转换比例
```javascript
// 积分:金币 = 1:1
coins = points * 1;
```

### 花朵价格
```javascript
// 统一价格
FLOWER_PRICE: 5

// 或差异化定价
const FLOWERS = {
    'rose': { price: 5 },      // 便宜
    'sunflower': { price: 8 },  // 中等
    'tulip': { price: 10 },     // 较贵
    'lavender': { price: 15 }   // 昂贵
};
```

---

## 🔧 高级配置

### Firebase实时监听
```javascript
// 在 game-logic.js 中
export function watchRealtimeData(callback) {
    // 监听频率由Firebase自动控制
    // 无需手动配置
}
```

### 数据库结构
```javascript
// Firestore集合
collections = {
    'users': {
        'user1': {...},
        'user2': {...}
    },
    'sharedAccount': {
        'coins': {...}
    },
    'garden': {
        'plots': {...}
    }
}
```

---

## 📝 修改配置步骤

### 步骤1：修改常量
在 `game-logic.js` 第6-11行：
```javascript
const GAME_CONFIG = {
    POINTS_PER_WORD: 1,           // 修改这里
    FLOWER_PRICE: 5,              // 修改这里
    GARDEN_SIZE: 54,              // 修改这里
    AUTO_SYNC_INTERVAL: 600000    // 修改这里
};
```

### 步骤2：同步前端
如果修改了 `AUTO_SYNC_INTERVAL`，需要同步到 `script.js`：
```javascript
// script.js 第51-54行
setInterval(async () => {
    console.log('🔄 自动同步单词数据...');
    await syncWordData();
}, 600000); // 与 game-logic.js 保持一致
```

### 步骤3：更新UI（如需要）
如果修改了花园布局，需要调整 CSS：
```css
/* style.css 中的 .garden-grid */
grid-template-columns: repeat(X, 1fr);
grid-template-rows: repeat(Y, 1fr);
```

### 步骤4：刷新页面
```bash
# 无需重启服务器
# 浏览器中按 Ctrl+Shift+R 强制刷新
```

---

## ⚠️ 注意事项

### 重要提醒
1. **GARDEN_SIZE 必须与 CSS 布局匹配**
   - game-logic.js: `GARDEN_SIZE: 54`
   - style.css: `repeat(9, 1fr) × repeat(6, 1fr) = 54`

2. **同步间隔不要太频繁**
   - 最小值建议：60000（1分钟）
   - 太频繁会增加API调用成本

3. **修改后需要测试**
   - 验证UI显示正确
   - 测试所有功能
   - 检查控制台无错误

4. **配置前先备份**
   ```bash
   git commit -m "backup before config change"
   ```

---

## 🎯 推荐配置（生产环境）

```javascript
const GAME_CONFIG = {
    POINTS_PER_WORD: 1,        // 保持简单
    FLOWER_PRICE: 5,           // 平衡难度
    GARDEN_SIZE: 54,           // 可种植54朵花
    AUTO_SYNC_INTERVAL: 600000 // 10分钟同步一次
};
```

**理由**：
- ✅ 简单易懂的1:1积分系统
- ✅ 适中的花朵价格（10单词=2朵花）
- ✅ 足够大的花园空间（需背270个单词才能填满）
- ✅ 合理的同步频率（平衡实时性和资源消耗）

---

## 📊 配置影响分析

### 积分系统影响
```
POINTS_PER_WORD = 1
├─ 背10个单词 = 可收取10积分 = 10金币 = 2朵花
├─ 背50个单词 = 可收取50积分 = 50金币 = 10朵花
└─ 填满花园(54朵) = 需要270金币 = 270个单词

POINTS_PER_WORD = 2
└─ 填满花园(54朵) = 只需135个单词（太简单）

POINTS_PER_WORD = 0.5
└─ 填满花园(54朵) = 需要540个单词（太难）
```

### 花园大小影响
```
GARDEN_SIZE = 54 (6×9)
└─ 可种植54朵花 = 需背270个单词

GARDEN_SIZE = 36 (6×6)
└─ 可种植36朵花 = 需背180个单词

GARDEN_SIZE = 81 (9×9)
└─ 可种植81朵花 = 需背405个单词
```

---

## 🔗 相关文件

- `game-logic.js` - 主配置文件
- `script.js` - 同步间隔配置
- `style.css` - 花园布局样式
- `BACKEND_COMPLETE.md` - 完整文档
- `VERIFICATION_REPORT.md` - 验证报告

---

**最后更新**：2026-01-28  
**配置版本**：v1.0  
**维护者**：Antigravity AI
