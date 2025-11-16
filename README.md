# 📚 书签管理系统

> **完全重构版本** - 数据库改为 D1，原项目在 [back 分支](https://github.com/deerwan/nav/tree/back)

基于 Cloudflare Pages + D1 + Vue 3 构建的现代化书签管理系统。

## ✨ 功能特性

### 📚 核心功能

- 📑 **分类管理**：创建、编辑、删除书签分类，支持多级嵌套分类
- 🔖 **书签管理**：添加、编辑、删除书签，支持拖拽排序
- 🔒 **私密书签**：支持设置私密书签，仅登录后可见
- 🔍 **实时搜索**：按名称、URL 或描述快速搜索书签，支持分类筛选和防抖优化
- 📥 **导入导出**：支持导出为 JSON/HTML 格式，导入浏览器书签（支持进度显示）
- 💾 **云端备份**：支持将数据备份到 Cloudflare R2 存储，支持备份列表管理、恢复和自定义备份名称（可选功能）
- ⚡ **批量操作**：批量移动、批量编辑属性（私密/公开）、批量删除书签和分类
- 🧹 **清理空分类**：自动检测并清理空分类
- 📊 **数据统计**：显示书签总数和私密书签统计

### 🎨 外观定制

- 🎨 **主题切换**：支持亮色/暗色/跟随系统三种主题模式
- 🖼️ **随机壁纸**：支持自定义壁纸 API，可设置页面背景壁纸
- 📝 **自定义标题**：自定义页面顶部标题文字
- 📄 **自定义页脚**：自定义页面底部内容（支持 HTML）
- 📋 **显示模式**：标准模式和高效模式（紧凑布局）两种显示方式
- 🔍 **显示控制**：可隐藏/显示搜索栏，隐藏空分类

### 🔐 安全与访问

- 🔐 **登录保护**：管理功能需要登录认证
- 🌐 **访问模式**：支持公开/非公开模式切换（公开模式下未登录用户可查看公开书签）

### 🤖 AI 智能功能

- 🤖 **智能生成描述**：AI 根据网站名称和 URL 自动生成书签描述
- 🏷️ **分类推荐**：AI 分析书签内容，推荐最合适的分类
- 📦 **批量生成**：支持为多个书签批量生成描述，提升效率
- 🔌 **通用 API 支持**：支持所有 OpenAI 兼容 API（OpenAI、Claude、Gemini等）
- ⚙️ **灵活配置**：支持自定义 API 地址、模型、认证方式等高级配置
- 📝 **自定义 Prompt**：支持自定义 AI 提示词，完美支持中文等多语言

### 🛠️ 便捷功能

- 🖼️ **自动获取图标**：自动从多个源获取网站 favicon，支持自定义图标
- 📋 **自动获取元数据**：添加书签时自动获取网站标题和描述
- 🔔 **更新通知**：版本更新提示功能
- ⬆️ **回到顶部**：滚动时显示回到顶部按钮
- 🌐 **浏览器扩展**：支持 Chrome、Edge、Brave、Firefox 等主流浏览器扩展

### ⚡ 技术特性

- ⚡ **边缘部署**：基于 Cloudflare Pages，全球加速
- 📱 **响应式设计**：完美适配桌面端和移动端
- 🔄 **实时同步**：设置实时同步到数据库

## 🛠️ 技术栈

- **前端框架**：Vue 3 + Composition API
- **构建工具**：Vite
- **后端**：Cloudflare Pages Functions
- **数据库**：Cloudflare D1 (SQLite)
- **存储**：Cloudflare R2（备份功能，可选）
- **认证**：JWT Token
- **样式**：原生 CSS (现代化设计)

## 🎬 视频教程

- Bilibili 教程视频：[书签管理系统 部署与使用教程](https://www.bilibili.com/video/BV1zR2MB6EnW/?spm_id_from=333.1387.upload.video_card.click&vd_source=404b85ee2cae5b46707ca55291730edb)

## 🚀 快速部署

### 1. 创建 D1 数据库
在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中：
- 进入 `Workers & Pages` > `D1`
- 点击 `Create database`，名称：`bookmark-db`
- 进入数据库 > `Console`，复制 `schema.sql` 内容并执行


**重要：配置 wrangler.toml**
- 首次部署时，需要从 `wrangler.toml.example` 复制并创建 `wrangler.toml` 文件：
- 创建数据库后，在数据库详情页面可以看到 `Database ID`
- 编辑 `wrangler.toml` 文件，将第8行的 `database_id` 替换为你刚创建的数据库 ID
- ⚠️ **注意**：`wrangler.toml` 不会被 Git 跟踪，所以同步代码时不会覆盖你的配置

### 2. 部署 Pages 项目
- Fork [本仓库](https://github.com/deerwan/nav) 到你的 GitHub
- 在 Cloudflare Dashboard 创建 Pages 项目
- 连接 GitHub 仓库
- 构建设置：
  - 构建命令：`npm run build`
  - 输出目录：`dist`

**关于环境变量**：
- ⚠️ 首次部署时的"环境变量 (高级)"选项**不会保存环境变量**
- ✅ 环境变量需要在部署后手动配置（见步骤 4）
- ✅ 项目可以先部署，后续再添加环境变量，不影响部署过程

### 3. 绑定数据库
在 Pages 项目中：
- `Settings` > `Functions` > `D1 database bindings`
- 添加绑定：变量名 `DB`，选择 `bookmark-db`

**注意：** 如果绑定失败，请确保：
- 数据库名称与 `wrangler.toml` 中的 `database_name` 一致
- 数据库 ID 已正确更新到 `wrangler.toml` 文件中
- 如果还没有 `wrangler.toml` 文件，请从 `wrangler.toml.example` 复制并配置

### 4. 配置环境变量

**重要说明**：
- ⚠️ Cloudflare Pages 的环境变量**必须在 Dashboard 中手动配置**
- ⚠️ 首次部署时的"环境变量 (高级)"选项**不会保存环境变量**

#### 配置方式

**部署后配置**
1. 完成首次部署
2. 部署完成后，进入 Pages 项目
3. 点击 `Settings` > `Variables and Secrets`（变量和机密）
4. 点击"添加"按钮，逐个添加环境变量
5. 保存环境变量后，需要手动触发重新部署：
   - 进入 `Deployments`（部署）页面
   - 找到最新的部署记录，点击右上角的 `...` 菜单
   - 选择 `Retry deployment`（重试部署）
   - 或者推送到 GitHub 仓库触发新的部署
6. 等待重新部署完成后，环境变量生效

#### 环境变量列表

**必须的环境变量**（不配置将无法使用管理功能）：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `你的密码` |
| `JWT_SECRET` | JWT 密钥，用于生成登录 token | 至少32位的随机字符串 |

**可选的环境变量**（不配置不影响基本功能）：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENAI_API_KEY` | OpenAI API Key 或兼容服务的密钥 | - |
| `OPENAI_BASE_URL` | API 基础地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 模型名称 | `gpt-4o-mini` |
| `OPENAI_AUTH_HEADER` | 认证 Header 名称 | `Authorization` |
| `OPENAI_AUTH_PREFIX` | 认证前缀 | `Bearer `（注意末尾有空格）|

**参考模板**：
- 项目根目录下的 `.env.example.txt` 文件提供了完整的环境变量模板
- 可以参考该文件了解需要配置的环境变量


**注意事项**：
- 环境变量是敏感信息，请妥善保管
- 不要将环境变量提交到 Git 仓库
- 环境变量修改后需要等待重新部署完成才能生效
- 如果首次部署时不添加环境变量，项目可以正常部署，但无法使用登录和管理功能

### 5. 配置 R2 备份功能（可选）

备份功能是可选的，如果不使用备份功能，可以跳过此步骤。

**启用备份功能**：

1. **在 Cloudflare R2 创建**（名称：`bookmark-backups`）
   - 在 Cloudflare Dashboard 中进入 `Workers & Pages` > `R2`
   - 点击 `Create bucket`，名称：`bookmark-backups`

2. **取消 `wrangler.toml` 中 R2 配置的注释**
   - 如果还没有 `wrangler.toml` 文件，请从 `wrangler.toml.example` 复制并配置
   - 编辑 `wrangler.toml` 文件
   - 取消第 12-14 行的注释：

     ```toml
     [[r2_buckets]]
     binding = "BACKUP_BUCKET"
     bucket_name = "bookmark-backups"
     ```

3. **重试部署**
   - 提交更改并推送到 GitHub（注意：`wrangler.toml` 不会被提交，因为它在 `.gitignore` 中）
   - 或在 Cloudflare Pages 的 `Deployments` 页面手动重试部署

**备份功能特性**：
- ✅ 全量备份：备份所有分类、书签和设置（不包括敏感信息）
- ✅ 自定义名称：支持为备份设置自定义名称
- ✅ 备份列表：查看所有备份，显示备份时间、大小等信息
- ✅ 一键恢复：从备份中恢复数据
- ✅ 备份下载：下载备份文件到本地
- ✅ 备份删除：删除不需要的备份

**注意**：
- 备份功能需要配置 R2 存储，否则会在设置页面显示配置提示
- 即使未配置 R2，项目也可以正常部署和运行，其他功能不受影响
- 备份不包括以 `secret_` 开头的设置（如 AI API Key 等敏感信息）

完成！访问你的 Pages URL 即可使用。

## 🧩 浏览器扩展

项目提供了官方浏览器扩展，支持 Chrome、Edge、Brave、Firefox 等主流浏览器。

### 功能特性

- 📑 **一键保存**：快速保存当前网页到书签管理系统
- 🗂️ **分类管理**：支持多级分类选择
- 🔒 **私密标记**：可设置书签为私密
- 🤖 **AI 辅助**：自动生成书签描述（需服务器启用）
- 🎯 **右键菜单**：右键快速添加书签
- 🔄 **自动续期**：Token 自动续期，无需频繁登录

### 安装方法

1. **下载扩展**
   - 在 [Releases](https://github.com/deerwan/nav/releases) 页面下载对应浏览器的扩展文件
   - Chrome/Edge/Brave: `bookmark-manager-chromium.zip`
   - Firefox: `bookmark-manager-firefox.zip`

2. **安装扩展**
   - **Chrome/Edge/Brave**: 解压 zip 文件，打开 `chrome://extensions/`，开启"开发者模式"，点击"加载已解压的扩展程序"，选择解压后的文件夹
   - **Firefox**: 解压 zip 文件，打开 `about:debugging#/runtime/this-firefox`，点击"临时载入附加组件"，选择解压后的 `manifest.json` 文件

3. **配置扩展**
   - 点击扩展图标 → "设置"
   - 输入书签管理系统地址（例如：`https://your-site.pages.dev`）
   - 输入管理员用户名和密码
   - 勾选"自动续期"（可选，Token 过期前自动刷新）
   - 点击"登录并保存"

### 使用方法

- **保存当前页面**：点击扩展图标，确认信息后保存
- **右键保存**：在页面或链接上右键 → "添加书签"
- **AI 生成描述**：填写标题和 URL 后，点击"🤖 AI生成描述"

### ⚠️ 关于 Chrome Web Store 上架

由于 Chrome Web Store 需要支付 **$5 美元**的一次性注册费用，扩展暂时无法上架到商店。如需使用扩展，请从 [Releases](https://github.com/deerwan/nav/releases) 页面下载并手动安装。

如果你希望扩展上架到 Chrome Web Store，欢迎通过下方的赞助方式支持！当收到足够的赞助后，将会注册开发者账号并上架扩展。

<img src="images/google.png" alt="Chrome Web Store 注册费用" width="600">

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

[GitHub 仓库](https://github.com/deerwan/nav)

## 💰 赞助

如果这个项目对你有帮助，欢迎赞助支持！

**特别说明**：收到的赞助将用于：
- 支付 Chrome Web Store 开发者注册费用（$5），以便上架扩展
- 支持项目的持续开发和维护

<table>
  <tr>
    <td align="center">
      <strong>微信</strong><br>
      <img src="images/zsm.jpeg" alt="微信" width="200">
    </td>
    <td align="center">
      <strong>支付宝</strong><br>
      <img src="images/zfb.JPG" alt="支付宝" width="200">
    </td>
    <td align="center">
      <strong>红包码</strong><br>
      <img src="images/hbm.PNG" alt="红包码" width="200">
    </td>
  </tr>
</table>

---

## 📝 许可证

Apache License 2.0

## 🙏 致谢

- **图标设计**：项目图标由 [MdTaslimUddinSakib](https://www.flaticon.com/authors/mdtaslimuddinsakib) 设计。

Made with ❤️ using Vue 3 and Cloudflare
