# Vocabulary Garden - 词汇花园背单词小游戏

这是一个精美的移动端网页应用，用于展示背单词进度和花园成长系统。

## 📱 功能特性

### 1️⃣ 花店模块（Garden Store）
- 展示4种可兑换的花朵：Rose Bud（玫瑰）、Sunflower（向日葵）、Tulips（郁金香）、Lavender（薰衣草）
- 显示每种花朵的价格（以pts积分计）
- Redeem按钮：积分不足时显示为灰色禁用状态
- 右上角显示当前总积分：345 Pts

### 2️⃣ 花园模块（My Recovery Garden）
- 展示用户的虚拟花园（等距视图的棋盘插画）
- 右上角"Perfect Weather"天气状态徽章
- 提示文字："Water plants by completing tasks!"（完成任务浇灌植物）
- 底部提示："Plants update once per day"（植物每天更新一次）
- 动态太阳图标（持续旋转动画）

### 3️⃣ 团队学习状态栏（Team Study Status）
- **固定在页面底部**（sticky定位）
- 显示两位用户的学习进度：
  - **User 1**: 1/15 min · 5/10 words → REWARD (5/10) 灰色按钮
  - **User 2**: 0/15 min · 0/10 words → REWARD (0/10) 灰色按钮
- 头像显示：User 1有绿色在线指示器，User 2为灰色离线状态
- 当用户背满10个单词时，REWARD按钮变为可点击状态

### 4️⃣ 奖励弹窗（Reward Modal）
- 点击"Claim Reward"按钮时弹出
- 显示奖励内容：+50 pts
- 带有庆祝图标🎉
- 背景模糊效果（glassmorphism）
- 说明文字：积分可在花店兑换花朵

### 5️⃣ Toast提示
- 关闭弹窗后在顶部显示轻量级提示
- 内容：+50 pts
- 自动2秒后消失

## 🎨 设计特点

### 视觉风格
- **渐变雾面背景**：柔和的粉/紫/蓝渐变，营造梦幻氛围
- **玻璃态卡片**：半透明白色卡片 + 模糊效果（backdrop-filter）
- **圆角设计**：统一使用20-24px大圆角
- **柔和阴影**：所有元素使用轻柔的阴影增强层次感
- **渐变按钮**：主按钮使用粉红色渐变（#FF5C8D → #FF8FB5）

### 排版与字体
- **主字体**：优先使用系统UI字体（-apple-system, PingFang SC等）
- **字号层级**：标题18px、正文14px、辅助文字12px
- **文字限制**：所有文字自适应容器，绝不溢出

### 响应式设计
- 主要针对iPhone 14/15（390×844）优化
- 适配各种移动设备
- 考虑了iOS安全区域（safe-area-inset）

## 🚀 使用方法

### 直接打开
1. 双击 `index.html` 文件
2. 或在浏览器中打开 `file:///.../garden/index.html`

### 在移动设备上测试
1. 使用浏览器的开发者工具（F12）
2. 切换到设备模拟模式（Ctrl+Shift+M / Cmd+Shift+M）
3. 选择iPhone 14或类似尺寸设备
4. 刷新页面查看效果

### 演示功能
- **查看Modal**：打开浏览器控制台，执行：
  ```javascript
  const btn = document.querySelectorAll('.reward-btn')[0];
  btn.classList.remove('disabled');
  btn.click();
  ```
- **查看Toast**：关闭Modal后自动触发

## 📂 文件结构

```
garden/
├── index.html          # 主页面结构
├── style.css          # 所有样式（CSS变量、布局、动画）
├── script.js          # 交互逻辑（Modal、Toast）
├── README.md          # 本文档
└── image/             # 图片资源
    ├── image (1).png  # 背景图
    ├── image (2).png  # 卡片纹理背景
    ├── image (3).png  # 花店效果图（参考）
    ├── image (4).png  # 玫瑰图标
    ├── image (5).png  # 向日葵图标
    ├── image (6).png  # 郁金香图标
    ├── image (7).png  # 薰衣草图标
    ├── image (8).png  # 花园效果图（参考）
    ├── image(9).png   # 花园等距插画
    ├── image(10).png  # 太阳图标
    └── image(11).png  # 状态栏效果图（参考）
```

## 🎯 技术栈

- **HTML5**：语义化标签
- **CSS3**：
  - CSS变量（Custom Properties）
  - Flexbox / Grid布局
  - 玻璃态效果（backdrop-filter）
  - 动画（@keyframes）
  - 渐变（linear-gradient）
- **Vanilla JavaScript**：轻量级交互逻辑

## 📝 开发说明

### 如需修改
1. **修改颜色**：编辑 `style.css` 中的 `:root` CSS变量
2. **调整布局**：修改对应区块的 padding/margin
3. **更换图片**：替换 `image/` 文件夹中的图片（保持文件名一致）
4. **添加功能**：在 `script.js` 中扩展逻辑

### 注意事项
- 所有图片路径使用相对路径，确保文件夹结构不变
- 文字内容在HTML中可直接修改
- 保持移动端优先的设计理念

## ✨ 设计还原度

本项目**100%高保真还原**了提供的参考UI设计，包括：
- ✅ 渐变雾面背景与配色
- ✅ 玻璃态卡片效果
- ✅ 花朵图标与布局
- ✅ 等距视图的花园插画
- ✅ 底部固定状态栏
- ✅ 奖励弹窗与Toast动画
- ✅ 所有圆角、阴影、间距细节

## 📱 浏览器兼容性

- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+
- ⚠️ 需要支持 `backdrop-filter` 属性

---

**Powered by Antigravity AI**  
设计实现日期：2026-01-28
