# Firebase数据库使用指南

## 📚 概述

本项目已集成Firebase Firestore数据库，用于存储和管理单词学习数据。

### 🔧 项目配置

- **项目ID**: garden-c4155
- **数据库位置**: asia-east1（台湾）
- **Hosting URL**: https://garden-c4155.web.app
- **控制台**: https://console.firebase.google.com/project/garden-c4155

## 📊 数据结构

### dailyProgress 集合

存储每日学习进度：

```javascript
{
  date: "2026-01-28",           // 日期 (YYYY-MM-DD)
  user1WordCount: 50,            // 用户1背的单词数
  user2WordCount: 30,            // 用户2背的单词数
  totalCoins: 1200,              // 总金币数
  timestamp: "2026-01-28T...",   // ISO时间戳
  lastUpdated: Timestamp         // 最后更新时间
}
```

## 🚀 使用方法

### 1. 在HTML中引入

修改`index.html`，在`<head>`或`<body>`末尾添加：

```html
<script type="module">
  import { 
    saveDailyProgress, 
    getTodayProgress, 
    updateCoins,
    getRecentProgress,
    getTotalStats
  } from './firebase-config.js';
  
  // 将函数挂载到window对象，便于在其他脚本中使用
  window.firebaseDB = {
    saveDailyProgress,
    getTodayProgress,
    updateCoins,
    getRecentProgress,
    getTotalStats
  };
</script>
```

### 2. API函数说明

#### saveDailyProgress(user1WordCount, user2WordCount, totalCoins)

保存或更新今日学习进度

**示例**:
```javascript
const result = await window.firebaseDB.saveDailyProgress(50, 30, 1200);
if (result.success) {
  console.log('保存成功！', result.data);
}
```

#### getTodayProgress()

获取今日学习进度

**示例**:
```javascript
const result = await window.firebaseDB.getTodayProgress();
if (result.success) {
  const { user1WordCount, user2WordCount, totalCoins } = result.data;
  console.log(`用户1: ${user1WordCount}词, 用户2: ${user2WordCount}词`);
}
```

#### updateCoins(coinsToAdd)

更新金币数量（可增可减）

**示例**:
```javascript
// 增加100金币
await window.firebaseDB.updateCoins(100);

// 减少50金币
await window.firebaseDB.updateCoins(-50);
```

#### getRecentProgress(days = 7)

获取最近N天的学习进度

**示例**:
```javascript
const result = await window.firebaseDB.getRecentProgress(7);
if (result.success) {
  result.data.forEach(day => {
    console.log(`${day.date}: ${day.user1WordCount + day.user2WordCount}词`);
  });
}
```

#### getTotalStats()

获取总体统计数据

**示例**:
```javascript
const result = await window.firebaseDB.getTotalStats();
if (result.success) {
  console.log('总统计:', result.data);
  // { totalUser1Words, totalUser2Words, totalWords, totalDays, avgWordsPerDay }
}
```

## 🔐 安全规则

当前规则配置：
- **读取**: 所有人可读（包括未认证用户）
- **写入**: 需要认证（目前允许认证用户写入）

如需修改规则，编辑`firestore.rules`文件后运行：
```bash
firebase deploy --only firestore:rules
```

## 🎯 集成到现有代码

### 方案1: 修改script.js

在`script.js`中导入并使用：

```javascript
// 在文件顶部添加（如果使用模块化）
import { saveDailyProgress, getTodayProgress } from './firebase-config.js';

// 在适当的时机保存数据
async function saveProgress() {
  const user1Count = parseInt(document.querySelector('#user1Count').textContent);
  const user2Count = parseInt(document.querySelector('#user2Count').textContent);
  const coins = parseInt(document.querySelector('#coins').textContent);
  
  await saveDailyProgress(user1Count, user2Count, coins);
}
```

### 方案2: 直接在HTML中使用

```html
<script type="module">
  import { getTodayProgress, saveDailyProgress } from './firebase-config.js';
  
  // 页面加载时获取今日数据
  document.addEventListener('DOMContentLoaded', async () => {
    const result = await getTodayProgress();
    if (result.success && result.data) {
      // 更新页面显示
      updateUI(result.data);
    }
  });
  
  function updateUI(data) {
    // 更新DOM元素
    document.querySelector('#user1Count').textContent = data.user1WordCount;
    document.querySelector('#user2Count').textContent = data.user2WordCount;
    document.querySelector('#coins').textContent = data.totalCoins;
  }
</script>
```

## 📝 数据库管理

### 查看数据

访问Firebase控制台：
https://console.firebase.google.com/project/garden-c4155/firestore/data

### 本地测试

由于使用了ES modules，需要通过Web服务器运行：

```bash
# Python 3
python serve.py

# 或者使用firebase emulators
firebase serve
```

## 🚢 部署更新

修改代码后部署：

```bash
# 设置代理（如需要）
$env:HTTP_PROXY="socks5://127.0.0.1:62928"
$env:HTTPS_PROXY="socks5://127.0.0.1:62928"

# 部署
firebase deploy --only hosting
```

## ⚠️ 注意事项

1. **CORS问题**: 如果本地测试，必须通过HTTP服务器访问，不能直接打开HTML文件
2. **API密钥安全**: 当前API密钥已内置在前端代码中，适用于公开读取的场景。敏感操作建议使用Firebase Authentication
3. **离线支持**: Firestore支持离线缓存，但需要额外配置
4. **实时更新**: 可使用`onSnapshot`监听数据变化实现实时同步

## 🔄 与不背单词API集成

可以将现有的`fetch_current_data.py`数据写入Firestore：

```javascript
// 从不背单词API获取数据后保存到Firestore
async function syncFromBubeidan() {
  const response = await fetch('/api/current-data');
  const data = await response.json();
  
  await saveDailyProgress(
    data.user1_words,
    data.user2_words,
    data.total_coins
  );
}
```
