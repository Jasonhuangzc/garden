# 不背单词数据读取器

## 功能说明
这是一个用于读取"不背单词"组队学习数据的Python脚本，可以提取：
- ✅ 成员姓名
- ✅ 背单词数量
- ✅ 背单词时间（分钟）
- ✅ 打卡天数
- ✅ 是否为本人

## 安装依赖

```bash
pip install requests
```

## 使用方法

### 方法1：直接运行（格式化输出）

```bash
python bubeidan_reader.py
```

输出示例：
```
============================================================
📚 不背单词 - 组队学习数据
============================================================

👤 成员 1:
   姓名: ida#
   背单词数量: 44 个
   背单词时间: 15 分钟
   打卡天数: 16 天
   是否本人: 否

👤 成员 2:
   姓名: 背够2w个
   背单词数量: 80 个
   背单词时间: 17 分钟
   打卡天数: 16 天
   是否本人: 是

============================================================
```

### 方法2：作为模块导入（自定义处理）

```python
from bubeidan_reader import BuBeiDanReader

# 替换成你的SID
sid = "你的SID字符串"

# 创建读取器
reader = BuBeiDanReader(sid)

# 获取原始数据列表
members = reader.get_team_data()

if members:
    for member in members:
        print(f"{member['姓名']} 今天背了 {member['背单词数量']} 个单词")
```

### 方法3：集成到现有项目

```python
from bubeidan_reader import BuBeiDanReader

# 在你的代码中使用
reader = BuBeiDanReader(sid="你的SID")
team_data = reader.get_team_data()

# 返回的数据格式：
# [
#     {
#         '姓名': 'ida#',
#         '背单词数量': 44,
#         '背单词时间(分钟)': 15,
#         '是否为本人': '否',
#         '打卡天数': 16
#     },
#     { ... }
# ]
```

## 如何获取SID

1. 使用抓包工具（如Charles、Fiddler）
2. 打开"不背单词"APP的组队页面
3. 找到 `https://learnywhere.cn/api/bb/20/09/gstudy/inapp/index-data` 请求
4. 复制URL中的 `sid` 参数值（已URL解码）

## 注意事项

⚠️ **重要**：
- SID是你的登录凭证，请勿泄露
- SID可能会过期，需要重新抓取
- 脚本不会修改任何数据，只读取
- 确保网络连接正常

## API说明

### `BuBeiDanReader` 类

#### 初始化
```python
reader = BuBeiDanReader(sid="你的SID")
```

#### 主要方法

1. **`get_team_data()`** - 获取组队数据
   - 返回：成员信息列表 `List[Dict]`
   - 失败返回：`None`

2. **`display_team_data()`** - 格式化显示数据
   - 直接打印到控制台

3. **`fetch_data(season, timezone)`** - 底层API请求
   - `season`: 赛季编号（默认68）
   - `timezone`: 时区偏移（默认480，即UTC+8）

## 错误处理

脚本会处理以下错误：
- ❌ 网络请求失败
- ❌ JSON解析失败
- ❌ API返回错误码
- ❌ 数据结构异常

所有错误都会显示友好的中文提示。

## 更新SID

如果SID过期，只需修改 `bubeidan_reader.py` 文件中 `main()` 函数里的 `sid` 变量，或者在导入使用时传入新的SID。
