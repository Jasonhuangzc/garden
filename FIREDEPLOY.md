# Firebase部署指南 (FIREDEPLOY)

> **为后端工程师准备** - 快速部署和连接Firebase数据库

---

## 📦 项目信息

- **项目名称**: Vocabulary Garden
- **项目ID**: garden-c4155
- **在线地址**: https://garden-c4155.web.app
- **Firebase控制台**: https://console.firebase.google.com/project/garden-c4155

---

## 🔑 Firebase配置信息

### Web App配置
已配置在 `firebase-config.js` 中：

```javascript
{
  projectId: "garden-c4155",
  apiKey: "AIzaSyCIJeOQhDifgORqycNacIApp0HUoKw9zeY",
  authDomain: "garden-c4155.firebaseapp.com",
  storageBucket: "garden-c4155.firebasestorage.app",
  messagingSenderId: "974689156430",
  appId: "1:974689156430:web:a4a7aa78773e9b99afb21f",
  measurementId: "G-KFE03XSK5P"
}
```

---

## 📁 关键文件列表

### Firebase配置文件
1. **firebase.json** - Firebase项目配置
2. **.firebaserc** - 项目别名绑定
3. **firestore.rules** - 数据库安全规则
4. **firestore.indexes.json** - 数据库索引配置

### SDK集成文件
5. **firebase-config.js** - Firebase SDK配置和API函数
6. **FIREBASE_GUIDE.md** - 完整使用文档（详细说明）

### 前端文件
7. **index.html** - 主页面
8. **style.css** - 样式
9. **script.js** - 交互逻辑

---

## 🗄️ Firestore数据库

### 数据库信息
- **位置**: asia-east1 (台湾)
- **类型**: Firestore (NoSQL)
- **访问**: https://console.firebase.google.com/project/garden-c4155/firestore/data

### 数据结构

#### Collection: `dailyProgress`
用于存储每日学习进度

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | ✅ | 日期格式 YYYY-MM-DD |
| user1WordCount | number | ✅ | 用户1背的单词数 |
| user2WordCount | number | ✅ | 用户2背的单词数 |
| totalCoins | number | ✅ | 总金币数 |
| timestamp | string | ✅ | ISO时间戳 |
| lastUpdated | timestamp | ✅ | 最后更新时间 |

**示例数据**:
```json
{
  "date": "2026-01-28",
  "user1WordCount": 50,
  "user2WordCount": 30,
  "totalCoins": 1200,
  "timestamp": "2026-01-28T15:30:00.000Z",
  "lastUpdated": "Firestore Timestamp"
}
```

---

## 🔧 部署命令

### 前置要求
```bash
# 1. 安装Firebase CLI
npm install -g firebase-tools

# 2. 登录Firebase
firebase login

# 3. 选择项目
firebase use garden-c4155
```

### 如果需要代理
```bash
# PowerShell
$env:HTTP_PROXY="socks5://127.0.0.1:62928"
$env:HTTPS_PROXY="socks5://127.0.0.1:62928"

# Linux/Mac
export HTTP_PROXY=socks5://127.0.0.1:62928
export HTTPS_PROXY=socks5://127.0.0.1:62928
```

### 部署命令
```bash
# 部署前端 (推荐)
firebase deploy --only hosting

# 部署Firestore规则
firebase deploy --only firestore:rules

# 完整部署
firebase deploy
```

---

## 📖 数据库API使用

### 导入模块
```javascript
import { 
  saveDailyProgress, 
  getTodayProgress,
  updateCoins,
  getRecentProgress,
  getTotalStats
} from './firebase-config.js';
```

### API函数

#### 1. 保存每日进度
```javascript
// 参数: user1单词数, user2单词数, 总金币
const result = await saveDailyProgress(50, 30, 1200);
if (result.success) {
  console.log('保存成功', result.data);
}
```

#### 2. 获取今日进度
```javascript
const result = await getTodayProgress();
if (result.success) {
  const { user1WordCount, user2WordCount, totalCoins } = result.data;
}
```

#### 3. 更新金币
```javascript
// 增加金币
await updateCoins(100);

// 减少金币
await updateCoins(-50);
```

#### 4. 获取历史数据
```javascript
// 获取最近7天
const result = await getRecentProgress(7);
```

#### 5. 获取总统计
```javascript
const result = await getTotalStats();
// 返回: totalUser1Words, totalUser2Words, totalWords, totalDays, avgWordsPerDay
```

---

## 🔐 安全规则

当前配置（firestore.rules）:
- **读取**: 公开访问 ✅
- **写入**: 需要认证 ⚠️

### 如需修改权限
编辑 `firestore.rules` 后运行:
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 测试连接

### 方法1: 浏览器控制台测试
1. 访问 https://garden-c4155.web.app
2. 打开浏览器控制台 (F12)
3. 运行测试代码:
```javascript
import('./firebase-config.js').then(async (module) => {
  // 测试保存
  const result = await module.saveDailyProgress(10, 20, 300);
  console.log('测试结果:', result);
  
  // 测试读取
  const today = await module.getTodayProgress();
  console.log('今日数据:', today);
});
```

### 方法2: 直接查看Firebase控制台
访问: https://console.firebase.google.com/project/garden-c4155/firestore/data

---

## 🚨 常见问题

### 1. CORS错误
**问题**: 本地文件无法访问Firestore  
**解决**: 必须通过HTTP服务器运行
```bash
python serve.py
# 或
firebase serve
```

### 2. 写入权限错误
**问题**: 写入数据时提示权限不足  
**原因**: 当前规则要求认证  
**临时解决**: 修改firestore.rules允许公开写入（不推荐生产环境）
```javascript
allow write: if true;
```

### 3. 模块导入错误
**问题**: Cannot use import outside a module  
**解决**: 在HTML中使用 `<script type="module">`
```html
<script type="module" src="script.js"></script>
```

---

## 📞 技术支持

- **Firebase文档**: https://firebase.google.com/docs
- **Firestore指南**: https://firebase.google.com/docs/firestore
- **详细使用说明**: 查看 `FIREBASE_GUIDE.md`

---

## ✅ 快速检查清单

部署前确认:
- [ ] Firebase CLI已安装
- [ ] 已登录正确的Firebase账户
- [ ] 项目ID正确 (garden-c4155)
- [ ] 代理配置正确（如需要）
- [ ] 所有配置文件存在

部署后验证:
- [ ] 访问 https://garden-c4155.web.app 正常
- [ ] 浏览器控制台无错误
- [ ] 可以读取Firestore数据
- [ ] 可以写入Firestore数据（如已配置认证）

---

**最后更新**: 2026-01-28  
**维护者**: hzc3490228662@gmail.com
