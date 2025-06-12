# AI 提示词收藏夹 (AI Prompt Collection)

[![Made with](https://img.shields.io/badge/Made%20with-HTML%2C%20CSS%2C%20JS-blue.svg)](https://github.com/your-username/your-repo-name)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

专为 AI 爱好者和创作者打造的一款本地化、高颜值、功能强大的提示词（Prompt）管理工具。它能帮助您轻松收藏、整理、搜索和使用您的 AI 提示词，所有数据均存储在您的本地浏览器中，安全、私密、高效。

---

## ✨ 项目特色 (Features)

*   **🎨 现代化 UI/UX**: 采用卡片式布局和流畅的动效，界面美观、交互体验优雅。
*   **💻 纯前端实现**: 无需后端支持，所有数据存储在浏览器的 `localStorage` 中，打开即用，保护您的数据隐私。
*   **🔍 强大的搜索与筛选**:
    *   支持按**标题、内容、标签**进行实时模糊搜索。
    *   支持按**标签**快速筛选，自动从您的收藏中提取所有标签。
*   **✍️ 完整的 CRUD 功能**:
    *   轻松**添加**新的提示词，支持多标签（逗号分隔）。
    *   随时**编辑**已有的提示词。
    *   一键**删除**不再需要的提示词。
*   **📄 内容预览与弹窗详情**:
    *   长提示词内容自动折叠，保持界面清爽。
    *   点击“展开”按钮，会以**弹窗**形式展示完整内容、标题和标签，并提供独立的复制按钮，方便查阅和使用。
*   **🖱️ 一键复制**: 每个提示词卡片和详情弹窗都提供“复制”按钮，方便您快速将提示词用于 Midjourney, Stable Diffusion, ChatGPT 等 AI 工具。
*   **📖 分页浏览**: 当提示词数量过多时，自动启用分页功能，保证加载速度和浏览体验。
*   **📱 响应式设计**: 完美适配桌面、平板和手机等不同尺寸的设备。

---

## 📸 界面展示 (Screenshots)

### 1. 主界面 - 提示词列表

在这里，您可以浏览所有已收藏的提示词。界面支持搜索、标签筛选和分页。

<!-- 在这里插入您的主界面截图 -->
<!-- 示例: <p align="center"><img src="https://user-images.githubusercontent.com/your-id/your-image-id.png" alt="主界面展示" width="800"/></p> -->
<p align="center">
  <strong>[在这里插入您的主界面截图，例如 main-view.png]</strong>
</p>

<br>

### 2. 添加与编辑提示词

点击“添加新提示词”或卡片上的“编辑”按钮，会切换到此视图。

<!-- 在这里插入您的添加/编辑界面截图 -->
<!-- 示例: <p align="center"><img src="https://user-images.githubusercontent.com/your-id/your-image-id.png" alt="添加与编辑界面" width="800"/></p> -->
<p align="center">
  <strong>[在这里插入您的添加/编辑界面截图，例如 add-edit-view.png]</strong>
</p>

<br>

### 3. 提示词详情弹窗

当提示词内容过长时，点击“展开”按钮会弹出此窗口，展示完整内容。

<!-- 在这里插入您的详情弹窗截图 -->
<!-- 示例: <p align="center"><img src="https://user-images.githubusercontent.com/your-id/your-image-id.png" alt="详情弹窗" width="600"/></p> -->
<p align="center">
  <strong>[在这里插入您的详情弹窗截图，例如 popup-view.png]</strong>
</p>

---

## 🛠️ 技术栈 (Technology Stack)

*   **HTML5**: 负责页面结构。
*   **CSS3**:
    *   使用 CSS 变量 (`:root`) 进行主题化设计，方便修改颜色、圆角等样式。
    *   使用 Flexbox 和 Grid 布局，实现响应式和现代化的界面。
    *   使用 `box-shadow`, `transition` 等属性创建丰富的视觉效果。
*   **JavaScript (ES6+)**:
    *   **原生 JS，零依赖**: 未使用任何外部框架或库，轻量且高效。
    *   **模块化逻辑**: 代码结构清晰，将 DOM 操作、事件处理、数据存储等逻辑分离。
    *   **事件委托**: 在提示词列表上使用事件委托，高效处理动态添加元素的事件。
    *   **本地存储**: 使用 `localStorage` API 实现数据的持久化存储。

---

## 🚀 如何使用 (How to Use)

本项目为纯前端应用，无需复杂的安装步骤。

1.  **下载项目**:
    *   点击本页面右上角的 `Code` -> `Download ZIP`。
    *   或者使用 Git 克隆: `git clone https://github.com/your-username/your-repo-name.git`

2.  **打开文件**:
    *   解压下载的 ZIP 文件。
    *   直接用您的浏览器（推荐 Chrome, Firefox, Edge）打开 `index.html` 文件即可开始使用。

---

## 📁 文件结构 (File Structure)

```
promote - 副本/
├── index.html      # 项目的主 HTML 结构文件
├── style.css       # 所有的样式和 UI 设计
└── script.js       # 核心的交互逻辑和数据处理
```

*   `index.html`: 定义了页面的基本骨架，包括“查看收藏”和“添加提示词”两个主视图。
*   `style.css`: 负责项目的所有视觉表现，包括布局、颜色、字体、动画效果和响应式设计。
*   `script.js`: 实现了应用的所有动态功能，包括视图切换、数据的增删改查、搜索过滤、分页、弹窗逻辑等。

---

## 🤝 贡献 (Contributing)

欢迎对本项目提出改进意见或贡献代码！您可以：

1.  Fork 本项目。
2.  创建您的特性分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)。
4.  将更改推送到分支 (`git push origin feature/AmazingFeature`)。
5.  开启一个 Pull Request。

---

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 授权。
