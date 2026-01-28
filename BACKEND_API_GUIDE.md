# 后端API集成指南 - 不背单词数据读取

## 📋 概述

本文档说明如何在后端集成不背单词组队数据读取功能，获取实时的学习数据。

---

## 🚀 快速开始

### 方式1: 直接导入Python模块（推荐）

**适用场景：** Python后端（Flask, FastAPI, Django等）

```python
from bubeidan_reader_simple import BuBeiDanReader

# 创建读取器实例
sid = "你的SID"
reader = BuBeiDanReader(sid)

# 获取最新数据
members = reader.get_team_data()

# 返回格式
# [
#   {
#     "姓名": "ida#",
#     "背单词数量": 40,
#     "背单词时间(分钟)": 17,
#     "是否为本人": "否",
#     "打卡天数": 17
#   },
#   { ... }
# ]
```

### 方式2: 调用Python脚本（跨语言）

**适用场景：** Node.js, Java, Go等其他语言后端

执行脚本：
```bash
python fetch_current_data.py
```

读取生成的文件：
- `current_team_data.json` - JSON格式数据

---

## 📡 API接口设计示例

### 1. Flask 实现示例

```python
from flask import Flask, jsonify
from bubeidan_reader_simple import BuBeiDanReader
from datetime import datetime

app = Flask(__name__)

# 配置SID（建议存储在环境变量或配置文件中）
SID = "k0t5CNBsU5GDZc1N84CAyOgO7xgq03+uYbSc8xTOpCgPU5y/uRUw0Ui38ICaeC89p2Bo/LONDpihP6+v6X3T2KsbOTY5yrlfApuKYjiysYplM3a7mB4dhGL5q/wLptL7aMaH1gGZelkdNqYP/sdojTJL9qPtSfOSHQn/XH5ZDZedyP7CvUeuhzAlyPQPUEZ9ErSXmzaocEUsXa1zL9XvBXqhsJAIk20f358zKsMsmXR0wcx7H5kgagYj9ev2QAvkNGakVdVwOeB6ArKVo1WXW0h0fH3RTieWXxNAO4YRiCO6n1jD/fwujEMwrdFVDvQNrB2F8sjIQSEcy+7DTEC0Qg=="

@app.route('/api/team-data', methods=['GET'])
def get_team_data():
    """获取组队学习数据"""
    try:
        reader = BuBeiDanReader(SID)
        members = reader.get_team_data()
        
        if members:
            return jsonify({
                "success": True,
                "data": {
                    "members": members,
                    "timestamp": datetime.now().isoformat()
                }
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "无法获取数据，SID可能已过期"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### 2. FastAPI 实现示例

```python
from fastapi import FastAPI, HTTPException
from bubeidan_reader_simple import BuBeiDanReader
from datetime import datetime
from pydantic import BaseModel
from typing import List

app = FastAPI()

# 配置SID
SID = "你的SID"

class Member(BaseModel):
    姓名: str
    背单词数量: int
    背单词时间_分钟: int = Field(alias="背单词时间(分钟)")
    是否为本人: str
    打卡天数: int

class TeamDataResponse(BaseModel):
    success: bool
    data: dict

@app.get("/api/team-data", response_model=TeamDataResponse)
async def get_team_data():
    """获取组队学习数据"""
    try:
        reader = BuBeiDanReader(SID)
        members = reader.get_team_data()
        
        if members:
            return {
                "success": True,
                "data": {
                    "members": members,
                    "timestamp": datetime.now().isoformat()
                }
            }
        else:
            raise HTTPException(status_code=500, detail="无法获取数据")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔧 Node.js 集成示例

如果你的后端是 Node.js，可以通过以下方式调用：

```javascript
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Express 路由示例
app.get('/api/team-data', async (req, res) => {
  try {
    // 执行Python脚本
    await new Promise((resolve, reject) => {
      exec('python fetch_current_data.py', (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    // 读取生成的JSON文件
    const dataPath = path.join(__dirname, 'current_team_data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const teamData = JSON.parse(data);
    
    res.json({
      success: true,
      data: teamData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 📊 API响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "姓名": "ida#",
        "背单词数量": 40,
        "背单词时间(分钟)": 17,
        "是否为本人": "否",
        "打卡天数": 17
      },
      {
        "姓名": "背够2w个",
        "背单词数量": 16,
        "背单词时间(分钟)": 44,
        "是否为本人": "是",
        "打卡天数": 17
      }
    ],
    "timestamp": "2026-01-28T14:32:11"
  }
}
```

### 失败响应

```json
{
  "success": false,
  "error": "无法获取数据，SID可能已过期"
}
```

---

## 🔑 SID管理

### 什么是SID？
SID是不背单词的会话标识符，用于身份验证。

### 如何获取SID？
1. 使用抓包工具（Charles, Fiddler等）
2. 打开不背单词APP的组队页面
3. 找到请求URL中的`sid`参数

### SID存储建议

**方式1: 环境变量（推荐）**
```python
import os
SID = os.getenv('BUBEIDAN_SID')
```

**方式2: 配置文件**
```python
# config.py
BUBEIDAN_SID = "你的SID"
```

**方式3: 数据库**
存储在用户配置表中

### ⚠️ 重要提示
- SID会过期，需要定期更新
- 不要将SID硬编码在代码中
- 不要将SID提交到Git仓库

---

## 📝 API端点规范

### GET `/api/team-data`

**请求参数:** 无

**响应:**
- **200 OK** - 成功获取数据
- **500 Internal Server Error** - 获取失败

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 请求是否成功 |
| data.members | array | 成员列表 |
| data.members[].姓名 | string | 成员昵称 |
| data.members[].背单词数量 | number | 今日背单词数量 |
| data.members[].背单词时间(分钟) | number | 今日学习时长（分钟） |
| data.members[].是否为本人 | string | "是" 或 "否" |
| data.members[].打卡天数 | number | 累计打卡天数 |
| data.timestamp | string | 数据获取时间（ISO格式） |

---

## 🧪 测试API

### 使用curl测试

```bash
curl http://localhost:5000/api/team-data
```

### 使用Python测试

```python
import requests

response = requests.get('http://localhost:5000/api/team-data')
data = response.json()

if data['success']:
    for member in data['data']['members']:
        print(f"{member['姓名']}: {member['背单词数量']}个单词")
else:
    print(f"错误: {data['error']}")
```

### 使用JavaScript测试

```javascript
fetch('http://localhost:5000/api/team-data')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      data.data.members.forEach(member => {
        console.log(`${member.姓名}: ${member.背单词数量}个单词`);
      });
    }
  });
```

---

## 💡 最佳实践

### 1. 缓存策略
数据更新频率较低，建议使用缓存：

```python
from functools import lru_cache
from datetime import datetime, timedelta

_cache = {'data': None, 'time': None}

def get_team_data_cached():
    """带缓存的数据获取（5分钟缓存）"""
    now = datetime.now()
    
    if _cache['data'] is None or \
       _cache['time'] is None or \
       (now - _cache['time']) > timedelta(minutes=5):
        
        reader = BuBeiDanReader(SID)
        _cache['data'] = reader.get_team_data()
        _cache['time'] = now
    
    return _cache['data']
```

### 2. 错误处理
```python
@app.route('/api/team-data')
def get_team_data():
    try:
        reader = BuBeiDanReader(SID)
        members = reader.get_team_data()
        
        if not members:
            return jsonify({
                "success": False,
                "error": "SID可能已过期，请更新配置"
            }), 401
            
        return jsonify({"success": True, "data": {"members": members}})
        
    except Exception as e:
        app.logger.error(f"获取数据失败: {str(e)}")
        return jsonify({"success": False, "error": "服务器错误"}), 500
```

### 3. 日志记录
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_team_data():
    logger.info("开始获取组队数据")
    reader = BuBeiDanReader(SID)
    members = reader.get_team_data()
    
    if members:
        logger.info(f"成功获取{len(members)}个成员的数据")
    else:
        logger.warning("数据获取失败")
    
    return members
```

---

## 📦 依赖安装

后端需要安装以下Python依赖：

```bash
pip install requests flask  # Flask方案
# 或
pip install requests fastapi uvicorn  # FastAPI方案
```

---

## 🔄 部署注意事项

1. **环境变量配置**
   ```bash
   export BUBEIDAN_SID="你的SID"
   ```

2. **定期更新SID**
   - 建议设置监控，当API返回401时提醒更新SID

3. **HTTPS部署**
   - 生产环境建议使用HTTPS保护数据传输

4. **CORS配置**（如果前端跨域请求）
   ```python
   from flask_cors import CORS
   CORS(app)
   ```

---

## 📞 联系支持

- **文档位置:** `BUBEIDAN_README.md`
- **测试脚本:** `test_bubeidan.py`
- **核心模块:** `bubeidan_reader_simple.py`

---

**最后更新:** 2026-01-28
