# Bilibili视频字幕提取工具

🌐 **在线使用**: https://zxcgzx.github.io/bilibili-subtitle-extractor/

一个功能强大的在线工具，用于提取Bilibili视频的字幕并支持多种格式下载。完全基于前端技术，无需服务器，可直接在GitHub Pages上运行。

## ✨ 功能特点

- 🎬 支持Bilibili视频字幕数据处理（需手动获取JSON）
- 📝 支持多种字幕格式转换：SRT、VTT、TXT
- 🖥️ 现代化的用户界面，清新浅色主题
- 📱 完美支持移动端设备，响应式设计
- 🚀 纯前端实现，无需服务器，完全静态
- 🎨 玻璃拟态设计，流畅动画效果
- 🔒 隐私安全，所有处理都在本地完成
- ⚡ 快速提取，实时预览
- 🔗 支持多种Bilibili链接格式
- 💾 一键下载，自动命名

## 🚀 快速开始

### 环境要求

- Node.js 14.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd bilibili-subtitle-extractor
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **启动后端服务**
   ```bash
   npm start
   ```
   
   开发模式（支持热重载）：
   ```bash
   npm run dev
   ```

4. **访问应用**
   
   打开浏览器访问：`http://localhost:3001`

## 📖 使用说明

### 基本使用

#### 方式一：智能提取模式（推荐）
1. **复制视频链接**
   - 在Bilibili视频页面复制完整的视频链接
2. **智能提取**
   - 将链接粘贴到输入框中，点击"智能提取"按钮
   - 如果成功，直接预览和下载字幕

#### 方式二：文件上传模式（100%可靠）
1. **获取字幕JSON文件**
   - 根据视频类型使用不同的搜索关键词（见下方说明）
2. **上传文件**
   - 将JSON文件拖拽到上传区域或点击选择文件
3. **转换下载**
   - 选择编码和换行符格式，一键转换下载

### ⚠️ 重要说明：不同视频类型的处理方法

| 视频类型 | 搜索关键词 | 说明 |
|---------|-----------|------|
| **有外挂字幕的视频** | `subtitle` | 视频有专门的字幕文件，质量较高，推荐优先使用 |
| **有字幕按钮但无外挂字幕** | `ai_subtitle` | 使用AI生成字幕，准确度可能略低 |
| **无字幕按钮的视频** | 无解决方案 | 既没有外挂字幕也没有AI字幕，暂时无法提取 |

### 获取字幕JSON文件的详细步骤

1. **打开视频页面**
   - 在Bilibili上打开要提取字幕的视频，确认是否有字幕按钮

2. **打开开发者工具**
   - 按F12键打开浏览器开发者工具
   - 切换到Network(网络)标签页

3. **刷新页面并搜索**
   - 刷新视频页面
   - 根据视频类型在过滤框中搜索对应关键词：
     - 有外挂字幕：搜索 `subtitle`
     - 仅AI字幕：搜索 `ai_subtitle`

4. **查找字幕请求**
   - 在请求列表中找到返回字幕数据的请求
   - 通常是JSON格式的响应

5. **保存JSON文件**
   - 右键点击字幕请求，选择"Save as"保存为JSON文件
   - 然后上传到本工具进行转换

### 支持的链接格式

```
https://www.bilibili.com/video/BV1234567890
https://www.bilibili.com/video/av123456789
https://bilibili.com/video/BV1234567890
https://m.bilibili.com/video/BV1234567890
```

### 支持的下载格式

- **SRT格式** - 标准字幕格式，兼容性最好
- **VTT格式** - 网页字幕格式，适用于HTML5
- **TXT格式** - 纯文本格式，仅包含字幕内容

## 🔧 项目结构

```
bilibili-subtitle-extractor/
├── backend/                 # 后端服务
│   ├── server.js           # Express 服务器
│   ├── package.json        # 后端依赖配置
│   └── utils/
│       └── subtitle.js     # 字幕提取核心逻辑
├── frontend/               # 前端页面
│   ├── index.html         # 主页面
│   ├── style.css          # 样式文件
│   ├── script.js          # 前端逻辑
│   └── assets/            # 静态资源
└── README.md              # 项目说明
```

## 🛠️ 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **Axios** - HTTP 客户端
- **Cheerio** - HTML 解析（备用）

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式和动画
- **JavaScript (ES6+)** - 交互逻辑
- **Fetch API** - 网络请求

## 📡 API 接口

### 字幕提取
```http
POST /api/extract-subtitle
Content-Type: application/json

{
  "url": "https://www.bilibili.com/video/BV1234567890"
}
```

### 格式转换
```http
POST /api/convert-subtitle
Content-Type: application/json

{
  "subtitles": [...],
  "format": "srt"
}
```

### 健康检查
```http
GET /api/health
```

## 🔍 功能说明

### 字幕提取流程

1. **链接解析** - 从URL中提取视频ID（BV号或AV号）
2. **视频信息获取** - 调用Bilibili API获取视频基本信息
3. **字幕列表获取** - 获取视频可用的字幕列表
4. **字幕内容下载** - 下载字幕数据并解析
5. **格式转换** - 支持转换为不同的字幕格式

### 错误处理

- 无效链接检测
- 网络错误处理
- 字幕不存在提示
- 服务器错误处理

## 🎨 界面特性

- **现代化设计** - 采用现代设计语言
- **响应式布局** - 完美适配各种设备
- **动画效果** - 流畅的交互动画
- **深色模式** - 自动检测系统主题
- **无障碍设计** - 支持键盘导航

## 🚨 注意事项

1. **仅支持公开视频** - 私有或需要登录的视频无法提取
2. **字幕可用性** - 只能提取视频本身包含的字幕
3. **使用频率** - 请合理使用，避免过度请求
4. **法律法规** - 仅用于学习交流，请遵守相关法律法规

## 🔧 开发模式

### 启动开发服务器
```bash
cd backend
npm run dev
```

### 调试模式
在URL中添加 `?debug=true` 参数启用调试模式：
```
http://localhost:3001?debug=true
```

调试模式提供的工具：
```javascript
// 访问应用实例
window.debugTools.app()

// 测试提取功能
window.debugTools.testExtract('https://www.bilibili.com/video/BV1234567890')

// 清除结果
window.debugTools.clearResults()
```

## 📋 环境变量

```bash
PORT=3001              # 服务器端口
NODE_ENV=development   # 运行环境
```

## 🚀 部署说明

### 生产部署

1. **设置环境变量**
   ```bash
   export NODE_ENV=production
   export PORT=3001
   ```

2. **启动服务**
   ```bash
   cd backend
   npm start
   ```

### Docker 部署（可选）

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Bilibili 提供的公开 API
- 开源社区的贡献和支持

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**免责声明：** 本工具仅用于学习和研究目的，请遵守相关法律法规，尊重内容创作者的权益。