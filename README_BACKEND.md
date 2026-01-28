# 后端集成简要说明

## 📌 数据接口说明

### 后端需要提供的数据格式

将下面的JSON格式数据写入 `current_team_data.json` 文件，或通过API返回相同格式：

```json
{
  "timestamp": "2026-01-28 14:57:50",
  "members": [
    {
      "user_id": "user1",
      "姓名": "ida#",
      "avatar": "image/avatar_ida.jpg",
      "gender": "female",
      "背单词数量": 40,
      "背单词时间(分钟)": 17,
      "是否为本人": "否",
      "打卡天数": 17
    },
    {
      "user_id": "user2",
      "姓名": "背够2w个",
      "avatar": "image/avatar_beigou2w.jpg",
      "gender": "male",
      "背单词数量": 16,
      "背单词时间(分钟)": 44,
      "是否为本人": "是",
      "打卡天数": 17
    }
  ]
}
```

## 🔧 快速开始

### 方式1: 使用静态JSON文件

1. 运行Python脚本生成数据：
```bash
python fetch_current_data.py
```

2. 这会在项目根目录生成 `current_team_data.json`

3. 前端会自动读取并显示数据

### 方式2: 使用API（推荐）

修改 `script.js` 第6行：
```javascript
// 从：
const response = await fetch('current_team_data.json');

// 改为：
const response = await fetch('http://your-api-domain/api/team-data');
```

## 📊 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | ✅ | 用户ID (user1 或 user2) |
| 姓名 | string | ✅ | 用户昵称 |
| avatar | string | ✅ | 头像路径 |
| gender | string | ❌ | 性别 (male/female) |
| 背单词数量 | number | ✅ | 今日背单词数 |
| 背单词时间(分钟) | number | ✅ | 今日学习时长 |
| 是否为本人 | string | ❌ | "是" 或 "否" |
| 打卡天数 | number | ❌ | 累计打卡天数 |

## 🎯 用户映射规则

- **ida#** → user1（女性头像）
- **背够2w个** → user2（男性头像）

## ⚡ 数据更新

### 自动刷新
前端每5分钟自动刷新一次数据

### 手动刷新
刷新页面即可获取最新数据

### 定时更新后端数据
建议每分钟执行一次：
```bash
# Windows (任务计划程序)
python fetch_current_data.py

# Linux (crontab)
* * * * * cd /path/to/garden && python fetch_current_data.py
```

## 🚀 使用现成的API服务器

启动Flask API服务器：
```bash
pip install flask flask-cors
python api_server.py
```

访问：`http://localhost:5000/api/team-data`

修改前端配置使用API：
```javascript
const response = await fetch('http://localhost:5000/api/team-data');
```

## 📋 API响应示例

```json
{
  "success": true,
  "data": {
    "members": [...],
    "timestamp": "2026-01-28T14:57:50",
    "cached": false
  }
}
```

## ✅ 测试清单

- [ ] 确认 `current_team_data.json` 存在
- [ ] 打开浏览器控制台，确认无错误
- [ ] 查看控制台输出 "✅ Team data loaded successfully"
- [ ] 确认头像正常显示
- [ ] 确认单词数和时长正确显示
- [ ] 当单词数≥10时，REWARD按钮应该可点击

## 📞 联系

- 详细API文档：`BACKEND_API_GUIDE.md`
- Python脚本：`bubeidan_reader_simple.py`
- 获取数据：`fetch_current_data.py`
- API服务器：`api_server.py`
