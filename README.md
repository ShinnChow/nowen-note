<div align="center">
  <img src="./electron/icon.png" alt="Nowen Note" width="104" />
  <h1>Nowen Note（弄文笔记）</h1>
  <p><strong>开源、自托管的知识库、协作笔记与任务工作台</strong></p>
  <p>
    统一知识树 · 富文本 / Markdown 双编辑器 · AI 知识问答 · 实时协作 · 任务与思维导图 · 全平台客户端
  </p>
  <p>
    <a href="./README.en.md">English</a> ·
    <a href="http://nowen.cn/">官方网站</a> ·
    <a href="http://note.nowen.cn/">在线体验</a> ·
    <a href="https://github.com/cropflre/nowen-note/releases">下载客户端</a> ·
    <a href="./docs/tutorials/README.md">教程中心</a> ·
    <a href="./CHANGELOG.md">更新日志</a>
  </p>
</div>

<div align="center">

[![GitHub Release](https://img.shields.io/github/v/release/cropflre/nowen-note?display_name=tag&sort=semver)](https://github.com/cropflre/nowen-note/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/cropflre/nowen-note?logo=docker&logoColor=white)](https://hub.docker.com/r/cropflre/nowen-note)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20v2-2496ED?logo=docker&logoColor=white)](./docker-compose.yml)

</div>

> Nowen Note 不只是一个编辑器。它希望成为一套由你掌控数据、可长期运行在 NAS / 服务器上，并能通过 Web、桌面端和移动端随时访问的个人与团队知识基础设施。

## 为什么选择 Nowen Note

| | |
| --- | --- |
| **数据真正属于你** | 支持 Docker / NAS 自托管，数据库、附件和备份均由你管理；附件可接入 S3、Cloudflare R2 与 MinIO，备份可同步到邮件或 WebDAV。 |
| **一棵树管理全部内容** | 文件夹、富文本和 Markdown 文档统一组织，根目录也能直接创建文档，支持拖拽、排序、导入、权限继承、密码保护和共享内容展示。 |
| **从短笔记到大型文档** | 富文本与 Markdown 双编辑器覆盖日常记录、技术文档和长文写作，并针对大文档提供 Worker 分析、视口渲染、增量同步与安全降级。 |
| **个人使用与团队协作兼顾** | 从标签、任务、AI 到工作区、笔记本权限、实时协作和公开知识空间，无需在多套工具之间来回切换。 |

## 核心能力

| 模块 | 当前能力 |
| --- | --- |
| **统一知识树** | 文件夹、富文本与 Markdown 文档混合组织；根目录直接创建内容、无限层级、拖拽排序、统一“+”创建菜单、Markdown 文件拖入 / 选择导入、筛选搜索、笔记数量统计、回收站、节点权限与共享目录展示。 |
| **目录安全与访问控制** | 知识树文件夹支持设置、修改、解锁密码；服务端签发短期 JWT 解锁令牌，并在受保护笔记本导入、导出时复用解锁状态，避免仅依赖前端会话标记。 |
| **富文本与 Markdown** | Tiptap 3 富文本、CodeMirror 6 Markdown、实时预览与分屏、可拖拽宽度的大纲栏、格式刷、斜杠命令、表格、稳定的代码块缩进、KaTeX、Mermaid、脚注、Callout、媒体嵌入、评论与版本历史。 |
| **图片与长文创作** | 图片裁剪、文字、画笔、箭头、形状与马赛克；支持按标题拆分长文、块级链接重定向、大文档复杂度识别、Worker 分析、视口渲染和增量保存。 |
| **知识组织与检索** | 彩色标签、收藏、置顶、全文搜索、文内查找替换、双向链接、块引用、反向链接与知识图谱。 |
| **AI 能力** | OpenAI 兼容接口、通义千问、Gemini、DeepSeek、豆包与 Ollama；支持续写、改写、翻译、标题与标签生成、总结、Embedding 索引及 RAG 知识问答。 |
| **任务与可视化** | 树形任务、列表、看板、日历、甘特图 / 时间轴、依赖关系、重复规则、提醒、模板与 AI 拆解；另含说说 / 时间线和思维导图。 |
| **协作、权限与分享** | Yjs + WebSocket 实时协作、工作区与成员角色、钉钉式笔记本访问管理、下拉用户选择器、目录级 ACL、所有权转移、集中分享管理、分享密码与有效期、访客评论、公开知识空间。 |
| **同步与编辑保护** | 支持增量同步与版本检测；版本冲突可按最新写入策略静默处理，并在同步过程中保留待提交编辑与本地快照，减少冲突弹窗和输入丢失。 |
| **导入、导出与迁移** | 支持 Markdown 拖入 / 文件选择、Word / DOCX、网页 URL、微信公众号文章、SingleFile HTML、思源 ZIP 与 Callout 等导入路径；支持 Markdown、PDF、Word、图片和完整 ZIP 导出，并提供权限映射、冲突预检、报告与受控撤销。 |
| **附件与存储** | 本地附件按 `YYYY/MM` 归档；编辑器可从文件管理器搜索并复用已有附件，插入可迁移的相对链接；支持缩略图、笔记归属、引用检查、孤儿重新扫描 / 清理和历史网络图片本地化，可使用本地磁盘或 S3 / R2 / MinIO。 |
| **账号与安全** | 多账号登录历史、记住账号 / 自动登录、远程服务连接、会话有效性校验与撤销、2FA、Personal API Token 权限范围、审计日志与安全化附件访问。 |
| **备份、自动化与开放能力** | 本地自动备份、完整 ZIP、邮件备份、凭据加密的 WebDAV 远程备份、Docker 在线升级与回滚检查、Webhook、插件系统、OpenAPI、TypeScript SDK、CLI、MCP Server 与浏览器剪藏扩展。 |
| **多端访问** | Web、Electron（Windows / macOS / Linux）、Android、iOS 工程、HarmonyOS 工程，以及 Docker / NAS 部署；移动端支持 Markdown 导入、最近优先、逐层目录和树形目录模式。 |

## 近期重点增强

### v1.4.3 · 2026-07-29

- 知识树文件夹新增密码保护，并通过短期解锁令牌覆盖后续导入、导出访问校验。
- 富文本与 Markdown 编辑器可直接打开附件库，搜索并复用已上传文件，避免重复占用存储。
- 自动备份可加密保存 WebDAV 凭据，并将已完成的本地备份同步到标准 WebDAV 服务。
- 知识树根目录可直接创建富文本或 Markdown 文档，并支持拖入 Markdown 文件快速导入。
- 笔记本权限管理升级为更直观的用户选择与访问规则配置，支持安全转移所有权。
- 移动端支持 Markdown 文件导入、最近优先、逐层目录与紧凑树形浏览，降低大量笔记时的空间占用。
- 优化 Windows 便携版启动、公开空间导航、代码块缩进、同步冲突处理和中文输入法下的斜杠菜单交互。

完整版本记录请查看 [CHANGELOG.md](./CHANGELOG.md) 与 [GitHub Releases](https://github.com/cropflre/nowen-note/releases)。

## 截图

### 桌面端

| AI 写作助手 | AI 服务商配置 |
| :---: | :---: |
| ![桌面 AI 写作](./docs/screenshots/desktop-ai-writing.png) | ![AI 设置](./docs/screenshots/settings-ai.png) |

### 移动端

| 侧边栏 | 笔记列表 | 编辑器 |
| :---: | :---: | :---: |
| ![移动端侧边栏](./docs/screenshots/mobile-sidebar.png) | ![移动端列表](./docs/screenshots/mobile-list.png) | ![移动端编辑器](./docs/screenshots/mobile-editor.png) |

## 官网与在线体验

- 官方网站：<http://nowen.cn/>
- 在线体验：<http://note.nowen.cn/>
- 账号：`demo`
- 密码：`demo123456`

> 演示账号仅用于体验，数据可能被定期重置。请勿存放敏感或重要内容。

## 快速部署

### Docker Compose（推荐）

要求已安装 Docker Engine 与 Docker Compose v2。

```bash
git clone https://github.com/cropflre/nowen-note.git
cd nowen-note
docker compose up -d
```

打开 `http://<服务器IP>:3001`。

默认管理员账号：

```text
用户名：admin
密码：admin123
```

> 首次登录后请立即修改默认密码。公网部署还应配置 HTTPS、备份、正确的公开访问地址，并按需收紧 CORS。

查看运行状态和日志：

```bash
docker compose ps
docker compose logs -f --tail=200 nowen-note
```

手动更新镜像：

```bash
docker compose pull
docker compose up -d
```

### Docker 在线升级（可选）

在线升级仅支持仓库内的官方 [`docker-compose.yml`](./docker-compose.yml)，且默认关闭。主应用容器不会挂载 Docker Socket；只有独立、内网隔离并受限运行的 updater 容器拥有 Docker Engine 权限。

```bash
cp .env.example .env
printf '\nNOWEN_UPDATER_TOKEN=%s\n' "$(openssl rand -hex 32)" >> .env

# 建议将 vX.Y.Z 替换为 Releases 中的稳定版本
NOWEN_IMAGE_TAG=vX.Y.Z docker compose --profile updater up -d
```

启用后，管理员可在「设置 → 关于 → 版本信息」执行升级前检查、完整备份、升级、健康验证和失败回滚。

> 镜像回滚不等于数据库回滚。生产环境必须保留独立备份。

完整说明见 [Docker 在线升级与恢复](./docs/docker-online-update.md)。

### 仅运行主应用

```bash
docker run -d \
  --name nowen-note \
  --restart unless-stopped \
  -p 3001:3001 \
  -e TZ=Asia/Shanghai \
  -v /opt/nowen-note/data:/app/data \
  cropflre/nowen-note:latest
```

## 数据、备份与配置

### 持久化目录

容器内的持久化根目录是 **`/app/data`**，不是 `/data`。默认 Compose 使用名为 `nowen-note-data` 的 Docker Volume。

```text
/app/data/
├── nowen-note.db
├── attachments/
├── backups/
├── fonts/
└── .jwt_secret
```

- 默认生产数据库为 SQLite，主文件是 `/app/data/nowen-note.db`。
- 附件默认存储在 `/app/data/attachments`，新文件按 `YYYY/MM` 分目录。
- 自动备份默认位于 `/app/data/backups`；WebDAV 只上传已经完成的备份文件，不作为实时数据库或附件存储。
- 生产环境建议把 `BACKUP_DIR` 映射到独立物理磁盘，并遵循 3-2-1 备份原则。
- 第三方图床上传链路已退役，新图片统一进入附件系统；历史网络图片可按需迁移到本地或对象存储。
- PostgreSQL 适配和迁移仍在验证中，当前正式部署与恢复流程继续以 SQLite 为默认基线。

### 常用环境变量

完整模板见 [`.env.example`](./.env.example)。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `NOWEN_PORT` | `3001` | Compose 对外暴露端口 |
| `TZ` | `Asia/Shanghai` | 容器时区，会影响待办日期判断 |
| `PUBLIC_WEB_ORIGIN` | 空 | 反向代理或公网域名，用于生成正确的分享链接 |
| `JWT_SECRET` | 自动生成并持久化 | 登录、会话与部分加密回退；多实例部署时必须统一配置 |
| `BACKUP_DIR` | `/app/data/backups` | 自动备份目录 |
| `BACKUP_WEBDAV_ENCRYPTION_KEY` | 回退到 `JWT_SECRET` | 加密保存 WebDAV 备份凭据，生产环境建议单独配置 |
| `CORS_ORIGINS` | 内置原生客户端来源 | 额外允许的网页 Origin，逗号分隔 |
| `MAX_ATTACHMENT_SIZE_MB` | `100` | 单个附件大小上限 |
| `ATTACHMENT_STORAGE` | `local` | 设为 `s3` 后可接入 S3 / R2 / MinIO |
| `CALENDAR_EXPORT_ENCRYPTION_KEY` | 空 | 加密日历 S3 镜像导出凭据 |
| `NOWEN_UPDATER_TOKEN` | 空 | 启用 Docker 在线升级代理 |

- [附件对象存储](./docs/object-storage.md)
- [WebDAV 远程备份](./docs/webdav-backup.md)
- [邮件备份配置](./docs/backup-email-smtp.md)

## 客户端与平台状态

| 平台 | 获取 / 构建方式 | 状态说明 |
| --- | --- | --- |
| **Web / Docker** | Docker Hub 或源码构建 | 推荐部署方式；镜像可构建 `amd64`、`arm64` 或多架构版本 |
| **Windows / macOS / Linux** | [GitHub Releases](https://github.com/cropflre/nowen-note/releases) 或 `npm run electron:build` | Electron 客户端可连接远程服务，也可使用本地后端；便携版已优化启动解压与启动提示 |
| **Android** | Releases APK 或在 `frontend/` 下使用 Capacitor 构建 | 正式维护；支持系统分享导入、Markdown 文件导入、沉浸式编辑和移动端知识树 |
| **iOS** | Capacitor 工程与 GitHub Actions / TestFlight 流程 | 需要 Apple 签名与开发者账号，详见 [iOS 发布指南](./docs/iOS-Release.md) |
| **HarmonyOS** | 使用 DevEco Studio 打开 [`nowen-harmony/`](./nowen-harmony/) | ArkTS + ArkWeb MVP；部分原生能力仍在完善 |
| **fnOS** | Releases 中的 `.fpk` | 当前 `.fpk` 主要面向 x86_64 |
| **绿联 UGOS** | Releases / 构建脚本中的 `.upk` | 依赖具体设备架构与应用安装能力 |
| **其他 NAS** | Docker Compose | 群晖、威联通、极空间等可按 Docker 方式部署 |

> 各平台实际发布的安装包以 [GitHub Releases](https://github.com/cropflre/nowen-note/releases) 为准。

## 本地开发

要求 Node.js 20+、npm、Git。Electron 和原生依赖构建还需要对应平台的编译工具链。

```bash
git clone https://github.com/cropflre/nowen-note.git
cd nowen-note
npm install
npm run install:all
```

分别启动两个终端：

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

访问 `http://localhost:5173`。

常用命令：

```bash
npm run build:all                 # 构建前端与后端
npm run electron:dev              # Electron 开发
npm run electron:build            # Electron 打包
(cd backend && npm test)          # 后端测试
(cd frontend && npm run test:run) # 前端测试
```

Android：

```bash
cd frontend
npm run cap:build
npx cap open android
```

iOS：

```bash
npm run cap:sync:ios
npm run cap:open:ios
```

## 技术架构

| 层 | 主要技术 |
| --- | --- |
| **前端** | React 18、TypeScript、Vite 5、Tailwind CSS、Tiptap 3、CodeMirror 6、Yjs、IndexedDB |
| **后端** | Node.js 20、Hono 4、WebSocket、better-sqlite3、FTS5、sqlite-vec、sharp |
| **桌面端** | Electron 33、electron-builder、electron-updater |
| **移动端** | Capacitor 8（Android / iOS）、ArkTS + ArkWeb（HarmonyOS） |
| **存储与备份** | SQLite、本地附件、S3 / Cloudflare R2 / MinIO、邮件与 WebDAV 备份；PostgreSQL 处于适配验证阶段 |
| **开放能力** | OpenAPI 3.0、TypeScript SDK、CLI、MCP Server、Webhook |

## 项目结构

```text
nowen-note/
├── frontend/       # React Web 与 Capacitor 客户端
├── backend/        # Hono API、数据库、同步与后台任务
├── electron/       # Electron 主进程与打包配置
├── packages/       # SDK、CLI、MCP 等开发者包
├── nowen-harmony/  # HarmonyOS ArkTS / ArkWeb 客户端
├── docs/           # 部署、教程与设计文档
└── scripts/        # 构建、迁移、打包与发布脚本
```

## 文档导航

- [教程与帮助中心](./docs/tutorials/README.md)
- [官网功能帮助中心](http://nowen.cn/docs/nowen-note-features)
- [官网安装与问题解答](http://nowen.cn/docs/nowen-note-help)
- [官网 API 文档](http://nowen.cn/docs/nowen-note-api)
- [完整部署指南](./docs/deployment.md)
- [Docker 在线升级与恢复](./docs/docker-online-update.md)
- [WebDAV 远程备份](./docs/webdav-backup.md)
- [附件对象存储](./docs/object-storage.md)
- [邮件备份配置](./docs/backup-email-smtp.md)
- [ARM64 部署](./docs/deploy-arm64.md)
- [iOS 发布指南](./docs/iOS-Release.md)
- [隐私策略](./docs/PRIVACY.md)
- [浏览器剪藏扩展](https://chromewebstore.google.com/detail/nowen-note-web-clipper/nglkodhfdbnfielchjpkjhenfaecafpg)
- OpenAPI：服务启动后访问 `/api/openapi.json`

## 当前边界

- **数据库**：SQLite 是当前默认且完整支持的生产方案；PostgreSQL 已有适配器、Schema 和部分双库测试，但尚未开放正式切换。
- **WebDAV**：用于上传已经完成的备份文件，不是实时同步、数据库运行目录或附件在线存储后端；远端文件生命周期需由 WebDAV 服务或管理员管理。
- **Docker 在线升级**：只支持官方 Compose 受管部署，不支持任意容器、任意镜像或 NAS 应用包。
- **第三方图床**：上传能力已退役，保留的是历史配置清理与存量图片迁移能力。
- **macOS**：安装包若未经过 Apple 公证，首次打开可能需要执行 `xattr` 解除隔离，详见 [桌面端教程](./docs/tutorials/desktop.md)。
- **移动端**：Android 维护最完整；iOS 与 HarmonyOS 的分发、签名和部分原生桥接能力仍受平台工具链限制。
- **快速迭代**：功能和安装包更新较快，请以 Releases、应用内版本信息和 [CHANGELOG.md](./CHANGELOG.md) 为准。

## 版本与更新

README 维护稳定的项目定位、能力范围、近期重点能力和部署方式；完整提交历史不在首页重复展开。

- [查看最新 Release](https://github.com/cropflre/nowen-note/releases)
- [查看完整更新日志](./CHANGELOG.md)
- [查看 Issues 与开发进度](https://github.com/cropflre/nowen-note/issues)

## 参与贡献

欢迎提交 Issue、功能建议和 Pull Request。提交代码前建议至少完成：

```bash
npm run build:all
(cd backend && npm test)
(cd frontend && npm run test:run)
```

反馈入口：

- [GitHub Issues](https://github.com/cropflre/nowen-note/issues)
- QQ 群：`1093473044`

## 支持作者

如果 Nowen Note 对你有帮助，欢迎扫码请作者喝杯咖啡。感谢每一份支持，它会帮助项目持续维护和迭代。

<table align="center">
  <tr>
    <th>微信赞赏</th>
    <th>支付宝赞赏</th>
  </tr>
  <tr>
    <td align="center"><img src="./frontend/public/weixin.jpg" alt="微信赞赏码" width="260" /></td>
    <td align="center"><img src="./frontend/public/zhifubao.png" alt="支付宝赞赏码" width="260" /></td>
  </tr>
</table>

也可以阅读 [作者感言](./AUTHOR_STORY.md)。

## License

Nowen Note 基于 [GNU General Public License v3.0](./LICENSE) 开源。

<!-- CHANGELOG:BEGIN -->
## 更新日志

> 最近 5 个版本的更新内容，完整历史见 [CHANGELOG.md](./CHANGELOG.md)。

### v1.4.4 - 2026-07-30

### ✨ 新增

- 移动端知识树支持紧凑模式 (c66752a)
- 知识树支持全部展开/收起并优化加载失败态 (7d8aedb)
- 支持笔记 Markdown 与富文本格式互转 (fda5b37)
- 笔记列表回收站空状态展示 (b11d7df)

### 🐛 修复

- **share**: show guest nickname in public comments (#543) (8dd7b47)
- **permissions**: install routes in legacy backend entry (eb645bd)
- **share**: prompt guest nickname before public comments (#541) (862fbcf)
- **editor**: restore rich-text interaction after format conversion (#539) (bf92883)
- 窗口化 Tiptap 编辑器大纲滚动定位 (afaecde)
- 右键菜单子菜单按视口智能定位 (877b7dc)
- 知识树根文档下创建子节点包裹隐藏根容器 (3a2fec3)
- 增强斜杠菜单中文输入法组合态处理 (37ec249)
- 优化 Markdown 隐藏块标记的容错与编辑器光标稳定 (8210c8f)
- 移动端抽屉导航栏宽度规则仅作用于导航项 (b4520aa)

### 📝 文档

- 设计 GitHub SignPath Windows 更新签名方案 (5c73e1f)
- **readme**: sync v1.4.3 capabilities (1f77093)

### ✅ 测试

- **permissions**: cover legacy backend route bootstrap (c2af22b)

### 🤖 CI

- **permissions**: watch legacy runtime bootstrap (45a20a9)

### v1.4.3 - 2026-07-29

### ✨ 新增

- 导出/导入支持解锁受密码保护的笔记本 (f3d1165)
- 知识树文件夹支持 JWT 解锁令牌 (d865ebe)
- 编辑器支持从文件管理插入已有附件 (ff011d9)
- 知识树文件夹支持密码保护 (8aec91e)
- **mobile**: 支持导入 Markdown 文件并优化移动端菜单交互 (2c35dc3)
- **ui**: add reusable user picker combobox (546c7dc)
- 登录会话改用 /me 校验并支持账号切换回退重登 (692bba0)
- 登录页支持记住账号与自动登录 (981b98b)
- 当前空间显示笔记本数量 (4c08908)
- 支持编辑器大纲栏拖拽宽度 (8a05e7a)
- 调整桌面和移动端知识树模式 (dfc2594)
- 知识树支持导入与权限管理 (15608c1)
- 完善图片编辑功能 (7f79618)
- **mobile**: 增加目录浏览模式开关 (6b9fe40)
- **mobile**: 最近优先与逐层目录导航 (b3b1111)
- **backup**: mount WebDAV backup settings bridge (d162785)
- **backup**: add WebDAV backup settings UI (2f88f69)
- **backup**: upload automatic backups to WebDAV (9f2168a)
- **backup**: enable WebDAV backup runtime (484323e)
- **backup**: mount WebDAV backup runtime routes (2ee8547)
- **backup**: add WebDAV configuration and upload routes (7051845)
- **backup**: add encrypted WebDAV backup service (7fb1cd3)
- **tree**: hide physical root document containers (7c09035)
- **tree**: route root document operations through compatibility layer (e41b5eb)
- **tree**: support documents at knowledge tree root (d3f2fc6)
- **tree**: route tree panel through create menu runtime (d433927)
- **tree**: add unified plus create menu runtime (d7bbd38)
- **permissions**: add DingTalk-style notebook access management (bc82df5)
- **mobile**: load compact knowledge tree styles (36acf46)
- **mobile**: add compact knowledge tree density (cc25787)
- **tree**: install Markdown file drop bridge (3ee5f77)
- **tree**: support dropping Markdown files into content tree (c2d267d)
- **import**: mount rich text callout compatibility (e4d8bfa)
- **import**: install rich text callout decorator (9609c6e)
- **import**: decorate SiYuan callouts in rich text (4af9143)
- **import**: mount Siyuan import feedback bridge (1a68337)
- **sync**: auto-resolve version conflicts before snapshot pull (7158a7c)
- **sync**: add latest-write conflict resolution strategy (7dc340c)
- 知识树嵌入优化、远程图片本地化及设置面板改进 (b6c3952)

### 🐛 修复

- 斜杠菜单中文输入法回车误触选择 (cf722d2)
- 附件面板复制保留笔记内相对链接 (e28d5dd)
- 文件管理器清理附件按钮常驻并点击重新扫描 (b9770f7)
- 修复笔记附件目录遗漏归属文件 (88f0e8f)
- **mobile**: 进一步压缩移动端知识树目录行高并修正操作按钮尺寸 (b006c70)
- **mobile**: 进一步压缩浏览器移动端树目录间距 (77d747f)
- **editor**: stabilize code block indentation and numbering (#327) (96f1162)
- **mobile**: 明显缩小移动端笔记节点间距 (8d720e2)
- **mobile**: make note rows visibly denser than folders (93413d1)
- **mobile**: scope dense tree styling to the rendered panel (ea434b0)
- **editor**: add stable code block indent commands (#327) (9ea12bd)
- **ui**: keep empty user picker exclusions stable (8ab8a47)
- **permissions**: use dropdown user picker for ACL rules (4cde233)
- **mobile**: 修复浏览器移动端树节点间距未生效 (72a16c0)
- **mobile**: scope compact tree density to mobile sidebar (b38f7c4)
- **desktop**: keep public notebook navigation inside app entry (9b3fff6)
- **desktop**: use file-safe public space navigation (9254fbd)
- **desktop**: resolve public routes from file-safe query (0555d7c)
- **desktop**: add file-safe app navigation helper (c37bebe)
- **tree**: correct note counts and compact mobile rows (d8d959c)
- **ui**: 全端默认关闭拼写检查 (84dde03)
- **tree**: simplify desktop row hover actions (4469f15)
- **desktop**: compact offline indicator (2f202c8)
- **mobile**: suppress offline status banner (20840ff)
- 鼠标悬停时隐藏笔记本数量 (a1ac584)
- **sync**: retain pending editor snapshots locally (d9e7262)
- **editor**: preserve debounced edits during conflict sync (b1ea57a)
- **sync**: preserve edits during silent conflict resolution (deac023)
- **sync**: resolve version conflicts silently (5e42b79)
- **share**: hide internal markdown block markers (a310f6a)
- **android**: limit preview tap capture to touch pointers (05d728f)
- **android**: close image preview when tapping image (270938e)
- **tree**: use anchored dropdown for new content (33e20a7)
- **backup**: harden WebDAV request parsing (80807a8)
- **backup**: use symbol-safe WebDAV route guard (bac976b)
- **permissions**: transfer unified knowledge tree ownership atomically (d075622)
- **migrations**: load permission runtime after feature registration (049b26b)
- **migrations**: keep db runtimes out of migration bootstrap (b0bc728)
- **url-import**: tighten DNS compatibility typings (0764830)
- **url-import**: load DNS compat before route modules (6772896)
- **url-import**: install DNS fallback before routes load (f18661d)
- **url-import**: add system resolver fallback for DNS checks (4686c04)
- **mobile**: tighten tree expander and icon spacing (2aa9ddf)
- **share**: 修复 Edge 分享链接复制失败 (0ea07d1)
- **tree**: include note version when writing dropped Markdown (7ecb3c8)
- **mindmap**: 切换目录时清空旧导图内容 (eacd871)
- **editor**: scope callout selector to both editor roots (0958545)
- **import**: render SiYuan progress inside import panel (12f7e35)
- **editor**: style callouts in production rich-text root (1efc07a)
- **editor**: detect callouts in actual Tiptap root (e23c8ee)
- **import**: treat SiYuan callouts as supported content (069a6be)
- **android**: open mobile tree drawer by default (7f02fee)
- **import**: detect Siyuan zip contents and show progress (52924a5)
- **markdown**: read normalized Callout data properties (e6351a8)
- **markdown**: allow hyphenated Callout HAST attributes (2e9902f)
- **import**: refresh knowledge tree after note imports (4dbb441)
- **markdown**: preserve callouts beside raw iframe HTML (2d422f1)
- **siyuan**: normalize iframe entities and heading IAL (bc8a661)

### ⚡ 优化

- **windows**: speed portable extraction and show startup splash (3d94397)
- **desktop**: shrink production backend bundle for faster startup (da25b73)
- 优化一级目录笔记本数量统计 (3af7c08)

### ♻️ 重构

- **permissions**: reuse user picker for collaborators (485f382)

### 📝 文档

- 记录附件目录归属修复设计 (1019df7)
- restore WeChat and Alipay sponsor codes (10f51f7)
- **readme**: sync current features and simplify project overview (3f35622)
- **backup**: add native WebDAV backup guide (7e948e1)
- **backup**: document WebDAV encryption key (0ad89f1)

### 💄 样式

- **mobile**: compact nested knowledge tree rows (c3caa82)
- **tree**: load desktop compact density (467dbce)
- **tree**: compact nested desktop rows (9f15085)
- **tree**: add fallback drop target highlight (9002741)
- **tree**: highlight Markdown file drop target (8f500dd)
- **import**: render SiYuan callout variants in editor (be7739f)

### ✅ 测试

- 补充附件面板复制相对链接测试 (9407320)
- **editor**: account for trailing paragraph in indent transactions (4b33aa7)
- **editor**: expose issue 327 transaction shapes (8f94193)
- **mobile**: verify note-only compact tree density (382ab9e)
- **mobile**: lock dense tree panel class (1b684dc)
- **permissions**: cover shared people pickers (fcade60)
- **editor**: cover code block indent transactions (#327) (6e122b8)
- **permissions**: lock ACL user picker behavior (5559496)
- **mobile**: cover sidebar-scoped compact tree density (19ae641)
- **desktop**: lock Windows startup performance build settings (6572c97)
- **desktop**: cover file-safe public space navigation (dd70e98)
- **mobile**: lock compact nested tree spacing (f9709de)
- **tree**: lock compact descendant row density (bf0fb86)
- **ui**: 覆盖全局拼写检查关闭 (d6f960e)
- **android**: keep desktop mouse drag unaffected (95be27e)
- **android**: cover image preview tap close (7f98dad)
- **tree**: cover anchored create dropdown (cfed8a4)
- **permissions**: cover v64 unified tree ownership transfer (8e1f632)
- **backup**: cover encrypted WebDAV configuration (dff4e96)
- **migrations**: lock feature registration before db runtime (f3b4efa)
- **tree**: initialize optional tree resource schemas (eedd474)
- **tree**: cover root rich text and markdown documents (d147e25)
- **url-import**: verify DNS installer is executable and idempotent (0bc83f6)
- **url-import**: cover system DNS fallback and bootstrap order (1771f3b)
- **mobile**: lock compact tree expander geometry (b94b947)
- **mobile**: lock compact knowledge tree contract (811076f)
- **tree**: cover external Markdown drop detection (b3145a7)
- **editor**: stabilize production-root assertion (fe4f035)
- **editor**: assert real root class contract (a7153e6)
- **import**: cover inline SiYuan progress host (15f3a0c)
- **editor**: observe callouts in production root (3a16ad9)
- **editor**: cover production Tiptap callout root (86aec10)
- **markdown**: validate live-preview Callouts independently (32a7f87)
- **markdown**: avoid CodeMirror DOM implementation assertion (5c9467b)
- **markdown**: isolate live-preview Callout blocks (743d1c5)
- **markdown**: cover five Callouts in live preview (5b0d80f)
- **markdown**: cover five SiYuan Callout preview types (fed348c)
- **import**: add SiYuan Callout fixture (e5765b3)
- **import**: cover callout bridge lifecycle (4f604a8)
- **import**: preserve callouts across rich text and markdown (175bf79)
- **import**: cover rich text callout decoration (f2794d2)
- **android**: cover default drawer and rail label layout (d3cd3d9)
- **import**: cover Siyuan zip detection and request matching (5d0b4ac)
- **sync**: cover automatic latest-write conflict resolution (5d1875c)
- **markdown**: split issue 494 preview assertions (1b6ada7)
- **import**: verify content tree refresh bridge (d226b21)
- **markdown**: isolate issue 494 callout iframe regression (03a6ba6)
- **markdown**: isolate issue 494 regression scenario (e0eb933)
- **markdown**: consolidate issue 494 coverage (3b5575b)
- **markdown**: exercise issue 494 preview path in runtime CI (59a44a0)
- **markdown**: cover issue 494 callout and iframe compatibility (dea425b)
- **siyuan**: cover issue 494 markdown regressions (9271a17)

### 📦 构建

- **windows**: add portable extraction splash asset (5c51ac3)

### 🤖 CI

- **mobile**: preserve legacy density variable aliases (5db4ff9)
- **editor**: make issue 327 integration patch resilient (c1bf619)
- **editor**: run issue 327 integration from draft PR (ca8ddbb)
- **editor**: apply and verify issue 327 integration patch (56ee76c)
- **share**: add markdown presentation regression (fbbd246)
- **android**: validate image preview tap close (ca63b99)
- **backup**: validate WebDAV backup support (af5307f)
- **migrations**: verify bootstrap ordering regression (2751b07)
- **tree**: record issue 512 validation result (b223d9f)
- **tree**: rerun issue 512 validation (d2c72af)
- **tree**: trigger issue 512 validation (3eb6d5b)
- **tree**: add issue 512 validation workflow (a8ac7bf)
- **permissions**: retain ownership regression diagnostics (1e8499a)
- **permissions**: add notebook permission management checks (799f515)
- **url-import**: verify DNS fallback and backend build (a81866f)
- **mobile**: enforce compact expander footprint (ede4dfd)
- **mobile**: cover compact knowledge tree styles (18e5f5c)
- **markdown**: split Callout preview diagnostics (1366287)
- **import**: verify Markdown Callouts in preview modes (0975f20)
- **import**: include Callout bridge lifecycle test (4f1f1a4)
- **import**: cover rich text callout compatibility (616d97f)
- **import**: validate Siyuan import feedback bridge (7ec68ac)
- pinpoint issue 494 preview regressions (108da88)
- isolate issue 494 frontend checks (c24d00a)
- run issue 494 frontend regressions (c017741)
- run SiYuan markdown regression coverage (6f9eedf)

### 🔧 其他

- remove temporary file (81cc37a)
- apply share marker fix (bdbd85a)
- **ci**: remove redundant create dropdown migration (d1e1dd8)
- **ci**: add create dropdown migration (9a2f7a1)
- **tree**: remove temporary issue 512 validation report (684d598)
- **tree**: remove issue 512 validation marker (06d02f3)
- **tree**: remove temporary issue 512 validation workflow (b52cb03)
- **tree**: remove temporary issue 512 PR workflow (1125092)
- **tree**: remove temporary issue 512 command workflow (4c0ed7f)
- **tree**: remove temporary issue 512 marker (9a25d64)
- **tree**: remove temporary issue 512 trigger workflow (1469b98)
- **tree**: remove temporary issue 512 apply workflow (8856324)
- **ci**: add PR trigger for issue 512 implementation (65dab80)
- **ci**: add issue 512 command workflow (bebedb4)
- **ci**: remove permission integration workflow (fed1cab)
- **ci**: start issue 512 implementation (3764f5b)
- **ci**: add issue 512 workflow trigger (22e9793)
- **ci**: apply issue 512 implementation (c855426)
- **ci**: trigger permission integration when ready (445c8cb)
- **ci**: run permission integration from pull request (5133737)
- **ci**: add one-shot permission management integration (605fe70)
- remove temporary Edge copy fix workflow (071cb3f)
- clean Edge copy trigger marker (1621e83)
- trigger Edge copy fix from pull request (aa7cf8b)
- add one-shot Edge share copy fix trigger (001509c)
- remove one-shot mind map fix trigger (10f1a84)
- add one-shot mind map folder fix trigger (19d9eb8)
- remove accidental temporary file (c866133)
- **import**: remove unused Callout fixture (180187b)
- remove accidental placeholder (4ab8b36)

### ⏪ 回滚

- **tree**: remove desktop compact spacing stylesheet (4f87b3b)
- **tree**: stop loading desktop compact spacing (86e9412)

### 📌 杂项

- noop (ca8b780)
- 修复知识树置顶统计 (00cb50e)

### v1.4.2 - 2026-07-27

### ✨ 新增

- 支持多账号登录历史切换 (88976e3)
- **frontend**: improve knowledge tree scrollbar performance and settings UX (b8a0e69)
- **tree**: create documents inline without modal (9ebbe49)
- **tree**: add inline create draft helpers (63fd495)
- **layout**: enforce unified-tree-only desktop and mobile navigation (15ae19f)
- **layout**: migrate legacy notebook-list preferences at startup (113dc45)
- **layout**: define unified-tree-only navigation policy (35bb333)
- **mobile**: expose global note search in nav rail (26992bb)
- **mobile**: add note search launcher helper (1aba32f)
- **frontend**: add knowledge tree sort control (0bcad89)
- **frontend**: apply selected sort mode to knowledge tree listings (2311939)
- **frontend**: add unified knowledge tree sort model (8d0d7bb)
- **editor**: integrate safe one-shot format painter (251305e)
- **editor**: add safe format painter transaction helper (df86790)
- **android**: extend immersive editing to Markdown (68cd545)
- **android**: add immersive mobile editing mode (44e8d09)
- **knowledge-tree**: add capability-aware node context menu (d04f510)
- **knowledge-tree**: make the unified tree the only Sidebar hierarchy (#467) (2f96915)
- **knowledge-tree**: coordinate legacy Notes/Notebooks hierarchy writes (#465) (00c864b)
- **knowledge-tree**: show shared mixed content in the unified tree (#463) (c0540c7)
- **navigation**: make the unified knowledge tree the primary Sidebar hierarchy (#461) (ef307e8)
- **shortcuts**: integrate customization runtime and settings (066ec9e)
- **shortcuts**: resolve overrides and validate bindings (0c70d8c)
- **shortcuts**: mark configurable commands (e969c10)
- **settings**: add shortcut customization panel (5ff7dc1)
- **shortcuts**: execute customizable rich-text bindings (3f199bc)
- **shortcuts**: add platform-scoped override storage (a06157c)
- **shortcuts**: add unified registry and help center (#456) (9edf24d)
- **issue-370**: implement P0 permissions and P1 unified knowledge tree (0d65d43)
- **shares**: add centralized share management (#447) (fdabc64)
- **perf**: add issue 210 sign-off validator (4d7c70f)
- **perf**: install issue 210 sign-off runtime (92c0d06)
- **perf**: add issue 210 runtime sign-off collector (75fa180)
- **shares**: add centralized management page (#447) (a6a7df0)
- **shares**: add management presentation helpers (#447) (86385b4)
- **shares**: add management query service (#447) (940aed3)
- **issue-370**: harden and productize split editing (140e176)
- **issue-370**: productize layout commands (015cc32)
- **issue-370**: add workspace layout helpers (c2a04dd)
- **sidebar**: add shared notebook tree component (3938152)
- **editor**: route editors through initialization watchdog (1e4f4d7)
- **editor**: wrap Tiptap initialization (d4aa92a)
- **editor**: wrap Markdown initialization (5aaa46a)
- **editor**: watch editor readiness (e3ee89b)
- **editor**: add initialization timeout policy (3fd1e20)
- **images**: 历史笔记网络图片批量本地化 (#423) (c5828a3)
- **code-block**: expose MAXScript in language picker (dc70053)
- **editor**: register MAXScript before lowlight setup (6039400)
- 移除侧栏账号入口 (a6cc5ea)
- **markdown**: highlight MAXScript fences (e699921)
- **code-block**: share MAXScript lowlight setup (a403210)
- **code-block**: add MAXScript grammar (e18dd05)
- **import**: apply permission mappings in primary import flow (7c7e55c)
- **import**: mount permission transfer centers (1c29a67)
- 移除一次性数据迁移接口 (3eee71d)
- **import**: submit explicit permission mappings (28de8a4)
- **export**: add explicit permission export dialog (9b5d36d)
- 移除桌面端服务器资料凭据 (f3b3d91)
- **export**: add permission export bridge (27d54db)
- **import**: add permission mapping modal (c53cf6c)
- **import**: add permission mapping review queue (6896f7c)
- **import**: add permission account mapping panel (ce49ba3)
- 移除连接与迁移前端功能 (25fd9aa)
- **import**: expose permission-aware package endpoints (0406d76)
- **import**: integrate permission preview and apply (2c186a2)
- **export**: make permission manifest opt-in (a00128c)
- **import**: add guarded permission undo (b2cb360)
- **import**: add v2 permission transfer service (8be6ded)
- 将拆分文档移入更多菜单 (af4fddb)
- 增加窗口化性能签收标签 (8e57ad2)
- 增加跨章节安全回退与最新快照 (1de5278)
- 绑定子文档离线更新代际 (195fcac)
- 实现子文档代际冲突与结构重分段 (768bc7e)
- 增加子文档代际迁移 (a0a7859)
- 同步恢复导入后的 Block 权威状态 (16429cf)
- 增加 Block 权威跨库原子写入 (a63e235)
- 添加 Block 权威灰度主读 (dbfdbb7)
- 接入编辑器性能门禁与分段存储基础 (002ff0f)
- **editor**: 完成 Block 权威存储与 Subdocument 窗口化 (152706c)
- **editor**: validate inline image replacement snapshots (ea12df5)
- **blocks**: validate inline image replacement nodes (4c0c1b2)
- 增强块补丁与Tiptap编辑器性能分析能力 (782fa43)
- **ai**: discover and test embedding models (34fbc4c)
- **blocks**: persist scoped list item structure patches (27c8ebf)
- **editor**: enable list item structure planning (351e8af)
- **editor**: type scoped list item structure patches (1ac3e93)
- **editor**: plan controlled list item create and delete (6c9f4ce)
- **blocks**: apply scoped list item structure patches (6e157b1)
- **blocks**: plan list item structural indexes (81b4d6a)
- **ai**: bind embedding to a saved profile (8381a08)
- **blocks**: add controlled list item create and delete (e6d94a3)
- **editor**: type list subtree index responses (3825345)
- **blocks**: use incremental list subtree indexes (1e97c74)
- **blocks**: plan incremental list subtree indexes (0a80118)
- **tasks**: move completed tasks below pending tasks (c88fa23)
- **editor**: enable list hierarchy patch planning (fded464)
- **editor**: compose list hierarchy patch planning (51f54f3)
- **editor**: plan controlled list hierarchy moves (510fe54)
- **editor**: type controlled list item moves (bacf7ac)
- **blocks**: support controlled list hierarchy patches (eb1dede)
- **blocks**: add controlled list item moves (0517674)
- **mindmap**: add minimal borderless node style (d30eaad)
- **editor**: install empty Block identity dispatch (0516390)
- **editor**: reconcile empty Block IDs without history (c318aff)
- **editor**: patch empty Tiptap documents safely (d1a433c)
- **editor**: plan rich mixed structural patches (c61c1b8)
- **editor**: type mixed index update metadata (ac03a09)
- **blocks**: expose mixed index update kind (061428e)
- **editor**: type structural index update metadata (c94f926)
- **blocks**: expose structural index update kind (8153f72)
- **blocks**: expose patch index update mode (31ee6a4)
- **blocks**: plan incremental patch index updates (a98c34c)
- **attachments**: add safe legacy image-host migration (d9f43b8)
- **electron**: prevent data directory from being set to protected system paths (57c9e19)
- **import**: add permission mapping client API (bb41225)
- **import**: mount round-trip permission mapping routes (8badde8)
- **import**: add permission package and mapping endpoints (c68ee55)
- **import**: add guarded workspace permission mapping service (1375451)
- add persistent import reports and guarded undo (#380) (ee62e2c)
- **import**: add conflict-safe round-trip incremental sync (26271e7)
- **editor**: plan rich leaf block replacements (a96d370)
- **editor**: type rich block replacement operations (3933188)
- **editor**: validate rich block replacement snapshots (4027466)
- **blocks**: apply validated rich block replacements (e892153)
- **blocks**: validate rich block replacement nodes (7a21e8a)
- **editor**: grey-roll out Tiptap Block Patch saves (1a655e0)
- **editor**: define Block Patch grey rollout policy (41218fa)
- **blocks**: expose authoritative patch response (4f1d64a)
- **blocks**: return authoritative patch snapshot (f373323)
- **editor**: plan safe Tiptap block patches (39c9f80)
- **import**: safely merge round-trip packages into existing folders (55de099)
- **blocks**: add confirmed frontend patch client (3ffc91c)
- **import**: show round-trip preflight report (9ef0f15)
- **blocks**: add atomic batch patch route (8786188)
- **blocks**: add pure Tiptap batch patch engine (86763c4)
- **block-links**: resolve split redirects before navigation (49d935c)
- **block-links**: install split redirect resolver (5eb116e)
- **block-links**: expose split redirect resolver (a1b6c81)
- **block-links**: resolve blocks moved by note splitting (c9cca98)
- **import-export**: preserve tree and attachments round trip (c70d51b)
- **note-split**: support Tiptap previews and block-link confirmation (6e07707)
- **note-split**: expose rich-text block link warning (09561e7)
- **note-split**: expose Tiptap heading split entry (3bdc48b)
- **note-split**: preview Tiptap heading sections (b11fae0)
- **note-split**: register Tiptap split routes (ef5453d)
- **note-split**: add transactional Tiptap splitting (3c0b015)
- **note-split**: add Tiptap heading split planner (67d760b)
- **note-split**: choose chapters before splitting (1c21933)
- **note-split**: send selected section indexes (236c8ad)
- **note-split**: register selected-section routes first (4b86722)
- **note-split**: support selected chapter extraction (a714bbf)
- **note-split**: build partial split source safely (0b19c24)
- **note-split**: preserve attachment ownership across split and undo (8776a75)
- **note-split**: route editor through split runtime shell (6591282)
- **note-split**: expose split action in editor (f699013)
- **note-split**: add split preview and undo dialog (f831df4)
- **note-split**: add confirmed split api client (d9c3242)
- **note-split**: add client split preview planner (e6c6955)
- **note-split**: register note split routes (94d8e0b)
- **note-split**: add transactional split and undo routes (8d68f62)
- **note-split**: add markdown split planner (a127aa9)
- **markdown**: route large editor through incremental sync shell (6bca463)
- **markdown**: sync CodeMirror and Y.Text incrementally (9cf3c5f)
- **markdown**: track incremental collaboration runtime (3298669)
- **editor**: embed pasted bilibili video links (7a453ab)
- **markdown**: add incremental CodeMirror Y.Text mapping (18895c4)
- **markdown**: enable optimized editor from viewport tier (fb64b9b)
- **markdown**: route medium docs to viewport editor (37f9112)
- **markdown**: upgrade large docs to viewport editor (4a52fee)
- **markdown**: add stale-safe worker controller (e1e7869)
- **markdown**: run document analysis in worker (33ea398)
- **markdown**: add worker-safe document analysis (2a68c05)
- **editor**: route heavy nodes through runtime shells (5d5c5a5)
- **editor**: defer mermaid rendering by viewport (55f82f5)
- **editor**: lazy mount video and iframe node views (3fa9d60)
- **editor**: support interaction-gated heavy nodes (c1a2f35)
- **editor**: expose runtime mode notice and session restore (9c8f7a7)
- **editor**: add reusable heavy-node viewport hook (1f93df2)
- **editor**: explain emergency document protection reasons (f63f9f1)
- **editor**: route notes through progressive runtime policy (e536a29)
- **editor**: add runtime mode store and long-task escalation (b779eb2)
- **editor**: add progressive runtime mode policy (230ab27)
- **editor**: add unified document complexity profiler (20ba263)
- **search**: expose sidebar search pending state (ab7a705)
- **search**: add progressive query policy (b97e6fe)
- **editor**: add lightweight editor for huge Markdown notes (aa46b7b)
- **editor**: detect unsafe large Markdown documents (263cf0f)
- **settings**: load switch card styles (f3641e3)
- **settings**: redesign preference switches (167726f)
- **auth**: secure multi-server account profiles (#343) (7645fb4)
- **sync**: poll desktop collections for external writes (b57b488)
- **sync**: install workspace refresh bridge (01cb894)
- **sync**: add desktop workspace refresh bridge (6186955)
- **note-transfer**: expose rewritten link counts to clients (#325) (62651f5)
- **note-transfer**: support atomic local and object-storage transfers (#325) (c6504f2)
- **audit**: add note transfer category (#325) (cb34a36)
- **note-transfer**: mount cross-space transfer center (#325) (13042fc)
- **note-transfer**: add copy and move transfer center UI (#325) (559354a)
- **note-transfer**: add typed frontend transfer client (#325) (ca3261e)
- **note-transfer**: mount dedicated transfer router (#325) (8ef6616)
- **note-transfer**: expose preview and execute endpoints (#325) (60c1147)
- **note-transfer**: add safe cross-workspace note transfer service (#325) (71b6386)
- **settings**: mount Docker update center (#330) (8b97e1c)
- **settings**: add Docker online update experience (#330) (7cc9aeb)
- **updater**: add admin preflight backup and apply API (#330) (dd301ba)
- **settings**: mount administrator update control plane (#330) (5003fa5)
- **updater**: expose authenticated internal control plane (#330) (1213f28)
- **updater**: persist update jobs and rollback containers (#330) (54cb7ea)
- **updater**: add restricted Docker Engine adapter (#330) (b86233d)
- **docker**: split local build compose override (#330) (4f8c0e7)
- **docker**: package updater entrypoint and health metadata (#330) (b5cbb5e)
- **docker**: add managed updater deployment profile (#330) (43cdc4b)

### 🐛 修复

- **android**: improve share import multipart handling and safe-area layout (0bbb7cb)
- **release**: 支持 AppImage 内嵌 blockmap (9344371)
- **docker**: 修复多架构构建语法 (7bb77c5)
- md (6c27a83)
- **import**: preprocess browser-saved HTML documents (73a41e5)
- **import**: normalize SingleFile HTML before note conversion (cd08dce)
- **ai**: narrow embedding settings observer target (c976fa6)
- **ai**: keep index task copy bridge idempotent (89b7e7d)
- **tree**: install custom scrollbar bridge at startup (56630b8)
- **tree**: add runtime custom scrollbar for web and desktop (a80f487)
- **tree**: restore visible desktop scrollbar (b9cef05)
- **frontend**: restore sort button beside knowledge tree filter (a618125)
- **electron**: preserve markdown text encoding on open (a87d1cb)
- **electron**: decode Windows markdown encodings (5a73653)
- **editor**: preserve nested block structure in format painter (b6369bc)
- **issue-455**: add one-shot nested block safety workflow (f9618d6)
- **issue-455**: add nested block safety patch (7f9385d)
- **editor**: keep format painter hooks in component scope (8c2f665)
- **issue-455**: add one-shot hook scope repair (de3fb7a)
- **issue-455**: add hook scope correction (337e776)
- **editor**: keep format painter hooks unconditional (1311eb1)
- **issue-455**: add hook-order repair workflow (e69d914)
- **issue-455**: add hook-order correction (954455c)
- **android**: preserve editor focus in immersive toolbar (1c783f7)
- **knowledge-tree**: keep imported documents under selected tree parent (cc92910)
- **knowledge-tree**: remove duplicate child map declaration (df5cfac)
- **knowledge-tree**: repair context-menu panel JSX (9735f92)
- **knowledge-tree**: restore directory context-menu capabilities (a6c13ed)
- **knowledge-tree**: defer insert guard trigger and fix cross-scope parent mapping (4cbb244)
- **shortcuts**: remove stale tooltip hints after clearing bindings (a8b4eff)
- **shortcuts**: support generated heading commands (24489d3)
- **yjs**: avoid no-op version bump during flush (7792d1f)
- **knowledge-tree**: initialize schema once per database connection (1aa409e)
- **knowledge-tree**: activate tree subtree before restoring resources (e9f99d7)
- **postgres**: validate tree parents only on structural updates (7719ec5)
- **knowledge-tree**: retain structural guard after runtime ensure (0c2f56b)
- **knowledge-tree**: register v64 structural guard (9e0f6a2)
- **knowledge-tree**: validate parent scope only on structural changes (2881903)
- **postgres**: preserve document parents on legacy notebook updates (01b71dd)
- **knowledge-tree**: keep hardened sync triggers after runtime ensure (ce36ca8)
- **knowledge-tree**: register v63 legacy sync migration (04dd066)
- **knowledge-tree**: split legacy notebook parent and state triggers (7f4122a)
- **knowledge-tree**: restore deleted descendants with subtree recovery (8be01ed)
- **knowledge-tree**: restore complete deleted subtrees (4ea844c)
- **permissions**: preserve workspace role for newly created nodes (f2f8efc)
- **permissions**: keep workspace creators on inherited team roles (837f39d)
- **knowledge-tree**: route listing through qualified SQL implementation (ddde99f)
- **knowledge-tree**: use unambiguous mixed-tree title ordering (4f8219c)
- **knowledge-tree**: avoid migration bootstrap schema cycle (3712f52)
- **knowledge-tree**: ensure optional resource tables before tree queries (c999f0d)
- 完善笔记删除与附件清理逻辑 (1fdad04)
- 完善编辑器分屏镜像与多编辑器集成 (29bdc37)
- 优化编辑器分屏镜像同步逻辑 (7296fb1)
- 清理前端初始化与设置相关逻辑 (8a1795a)
- **collaboration**: render complete shared notebook tree (43750b4)
- **api**: harden note content view boundary (#355) (c59f04c)
- **api/editor**: hide Markdown block IDs and route by content format (#355) (0d397a1)
- **tags**: make tag creation idempotent by scope (8a3cebd)
- **tags**: register scoped tag uniqueness migration (9d6637a)
- **tags**: migrate tag names to scoped uniqueness (1785f78)
- **tags**: add idempotent scoped tag creation (8e06def)
- **sdk**: let server derive attachment note search text (478a26f)
- **sdk**: deduplicate concurrent attachment logins (6c8a316)
- **sdk**: copy typed arrays before creating blobs (d9d196a)
- **sdk**: include web platform types for public client (5d350da)
- **ci**: install SDK without missing lockfile cache (ac15412)
- **sdk**: expose note content format types (de815dc)
- **editor**: 修复大纲生成与跳转 (f36bbbf)
- **editor**: exclude explicit-only grammars from auto mode (2d07fca)
- **code-block**: preserve automatic detection subset (f54337e)
- **editor**: 移除轻量编辑模式提示 (7fd14c2)
- **editor**: 移除视口优化提示 (93640a2)
- **import**: preserve forbidden status in undo error (2e37e2a)
- **import**: recheck admin role before permission undo (0c1e4d6)
- **export**: honor data manager workspace scope (6697434)
- **import**: show invalid permission manifests in preflight (ab13f80)
- 清理遗留服务器资料数据 (734f5ad)
- **import**: harden legacy permission mapping (58bb44d)
- 修复超长笔记滚动区域 (51e6e06)
- 修复窗口化笔记滚轮失效 (dce9211)
- 收口 M6 M7 权威存储与窗口化一致性 (5811aa3)
- 重分段后立即回退单体编辑器 (435c34b)
- **clipper**: recover missing content script receivers (a344e48)
- **blocks**: enforce list item container compatibility (c13a742)
- **editor**: prove list structure Block identities (b13ad3f)
- **editor**: fall back after rejected list structure patches (ad9c660)
- **blocks**: reuse structural index plan type (53c484f)
- **editor**: plan list moves with large subtrees (76f211f)
- **editor**: preserve list attrs and choose equivalent moves (1c7a5df)
- **blocks**: preserve list attrs when sinking items (2accf67)
- **editor**: fall back after rejected list moves (21cf1b1)
- **ai**: keep vector status messaging consistent (e918dc9)
- **blocks**: track temporary structural Block identities (a1af567)
- **ai**: clarify vector indexing states (5272ff2)
- **ai**: install embedding queue hardening (ede3455)
- **ai**: harden embedding queue recovery (8a84ffb)
- **blocks**: narrow incremental leaf operations (4faf2c6)
- **blocks**: report actual indexed Block rows (baa958a)
- **blocks**: expose ancestor index updates (d762bff)
- **blocks**: refresh indexed ancestors for leaf patches (cec9019)
- **editor**: narrow rich replacement operation types (dbabd0b)
- **editor**: fall back on rejected rich block nodes (22a1578)
- **blocks**: preserve note history during patch saves (c4bfc0b)
- **editor**: scope Tiptap runtime policy to its note (4cf9295)
- **editor**: keep empty Tiptap docs on whole-save path (19a5a34)
- **editor**: isolate Block Patch AppContext usage (b47d29e)
- **editor**: serialize title saves behind Block Patch (234d98d)
- **blocks**: type list update broadcast payload (ccc21c8)
- **editor**: isolate stale Block Patch completions (dc3b624)
- **blocks**: reject cross-note idempotency key reuse (819c95b)
- harden attachment router bootstrap (b319734)
- **blocks**: preserve valid Tiptap containers after deletes (7701035)
- **blocks**: normalize source before atomic patch (6f4a7c6)
- **editor**: align runtime search plugin key typing (41d1639)
- **block-links**: enforce ACL across redirect chains (0f3a2fb)
- **block-links**: make redirect resolver route-order independent (0e39363)
- **block-links**: preserve moved block ids across redirect chains (b29eae2)
- **note-split**: keep Tiptap out of Markdown Yjs rooms (d981c87)
- **note-split**: refresh split availability after mutation (39a27a6)
- **note-split**: keep empty Tiptap chapters valid (c16a70a)
- **note-split**: keep Tiptap directory schema clean (d2408c7)
- **note-split**: strip persisted block ids from titles (ca0e85f)
- **note-split**: hide runtime block ids from titles (3fbc1d5)
- **note-split**: generate valid internal note links (56aaf95)
- **docker**: load hardened backend entrypoint for full backups (#352) (2690bb1)
- **desktop**: 修复视频全屏与打包校验 (1ac40e3)
- **editor**: avoid syncing note format as user preference (6aa2952)
- **note-split**: rollback on transactional version races (64691f4)
- **desktop**: respect markdown format when opening notes (f89cfbc)
- **desktop**: open markdown notes in markdown editor (2349ab7)
- **markdown**: skip conversion for emergency rich text (2b0ac4a)
- **markdown**: classify normalized content for large mode (4319446)
- **markdown**: keep analysis worker compatible with old webviews (ed45702)
- **build**: use browser timer handle types (ab29e74)
- **build**: cast runtime-only note metadata safely (88a04e1)
- **build**: use numeric Tiptap end selection (de1e637)
- **build**: type lowlight runtime test doubles (1a79680)
- **build**: align editor performance diagnostic types (972687f)
- **video**: correct desktop overlay guard syntax (#367) (cf41b24)
- **video**: keep desktop native controls interactive (#367) (6bad94f)
- **editor**: keep runtime notice compatible with older webviews (6ed11f6)
- **editor**: harden viewport highlight scheduling (8bec5ce)
- **editor**: use canonical empty decoration set (db9f00b)
- **editor**: preserve rich-text threshold compatibility (649c657)
- **editor**: avoid false large-document mode for compact rich text (b5a0255)
- **search**: animate full-text search loading spinner (ead4262)
- **search**: make sidebar loading spinner rotate (d66d51f)
- **search**: buffer sidebar typing and preserve focus (c4f0394)
- 删除不必要的文件 (a88fd22)
- **editor**: bypass Tiptap and Yjs for huge rich-text notes (c0a44c7)
- **search**: preserve intentional short queries (bc40fee)
- **search**: defer progressive short queries (7e8b0e0)
- **search**: cancel stale progressive requests (394fd8b)
- **editor**: route huge Markdown notes to safe mode (61bfd1a)
- **android**: 对齐 findLast 长度转换语义 (4b37273)
- **editor**: 区分 WebView 兼容错误与笔记结构异常 (e5be206)
- **android**: 在应用启动前加载运行时兼容层 (639ddb9)
- **android**: 补齐旧版 WebView findLast 兼容 (1d15943)
- **editor**: remove task list DOM observer loop (#361) (635fda3)
- **editor**: align task and bullet list markers (#361) (82cad44)
- **search**: repair source text and bound candidate retrieval (#340) (5c4ead6)
- **editor**: keep in-note search matches visible (#328) (9a3df5f)
- **editor**: complete cache-first and split loading coverage (#351) (fb40a94)
- **editor**: smooth delayed note loading transitions (#351) (e998f9e)
- **sync**: trust server probe for LAN connectivity (#350) (14d1e11)
- **sync**: respect syncNow failure results (#350) (ac7abca)
- **sync**: harden recovery flush single-flight (#350) (a0b85a7)
- **sync**: distinguish visibility probes from real recovery (#350) (27699df)
- **sync**: tighten workspace refresh bridge types (882f678)
- **ui**: deduplicate space navigation entry (290e8dd)
- **ui**: load space action trigger guard (52450c0)
- **ui**: hide legacy transfer floating trigger (bbb6788)
- **ui**: move space actions into navigation rail (bc32d3e)
- **ui**: consolidate space actions into compact launcher (24ae016)
- **editor**: clarify block indent shortcuts (#327) (b61dc13)
- **editor**: render code block indent on NodeView (#327) (5c08f2e)
- **electron**: validate updater release assets (#329) (7b39915)
- **siyuan**: keep rich-text indexes consistent after import (#284) (9e3b805)
- **embed**: keep sandbox and fallback state synchronized (#284) (e958bbd)
- **markdown**: hide standalone SiYuan block IAL rows (#284) (4cfc5bf)
- **siyuan**: finalize rich-text imports with explicit safe mappings (#284) (06dc638)
- **siyuan**: harden rich-text mappings for imported advanced nodes (#284) (ded13ea)
- **siyuan**: canonicalize real callout and IAL AST nodes (#284) (f975e3d)
- **embed**: require password handshake and expose safe fallback (#284) (8b010fd)
- **markdown**: keep semantic preview blocks intact (#284) (2de3d82)
- **markdown**: normalize imported SiYuan callouts (#284) (ae94cc5)
- **note-transfer**: require interactive safe move execution (#325) (a15bb2c)
- **note-transfer**: keep content text references aligned (#325) (830f995)
- **note-transfer**: require complete move preview versions (#325) (37f883d)
- **note-transfer**: install active-workspace refresh bridge (#325) (6c0b7ed)
- **note-transfer**: refresh active workspace after transfer (#325) (ec59051)
- **note-transfer**: await object-storage preview and execution (#325) (9ac3a3d)
- **note-transfer**: require attachment-safe move semantics (#325) (17c82e2)
- **note-transfer**: bridge note link index synchronization (#325) (584ba3f)
- **note-transfer**: bridge attachment reference synchronization (#325) (37a7541)
- **note-transfer**: use UUID link fixtures and initialize audit schema (#325) (4622c33)
- **note-transfer**: correct preview link counts and blocker statuses (#325) (098b410)
- **upload**: finish offline image uploads deterministically (#331) (1bf9451)
- **android**: enable WebView long-press text selection (#335) (cf352e6)
- **android**: restore editor text selection actions (#335) (4b9a79c)
- **android**: install editor media scope guard before app mount (#338) (91d5525)
- **android**: isolate non-editor media buttons from editor bridge (#338) (8120ce7)

### ⚡ 优化

- **ai**: scope index copy observer to settings panel (2bad49f)
- **frontend**: scope sidebar search observer to relevant nodes (1ea704d)
- **blocks**: unify mixed patch index updates (a595ffd)
- **blocks**: incrementally index top-level structural patches (563f8f8)
- **blocks**: update leaf patch indexes incrementally (f6343e2)
- **editor**: suppress optimized-mode outline rescans (9b6fa97)
- **editor**: cache ProseMirror plain-text snapshots (8b7b831)
- **editor**: stop realtime full-document search rescans (c040f6a)
- **editor**: defer math node rendering by runtime mode (84b4c46)
- **markdown**: bypass legacy full-text diff during incremental sync (9c8d4f5)
- **editor**: limit code highlighting to active viewport (5775cfd)
- **editor**: stop code-block scans in lightweight mode (5935b18)
- **editor**: measure note fetch and runtime policy stages (90f91fb)
- **editor**: lazy-load offscreen rich-text images (c985498)
- **editor**: disable code highlighting in lightweight mode (0635080)
- **sidebar**: make notebook creation optimistic (#344) (4be7b08)
- **sidebar**: make notebook creation optimistic (b6f10c9)
- **editor**: optimize code block input and save acknowledgment (#342) (c72c971)
- **editor**: optimize code block input and save acknowledgment (39120f1)

### ♻️ 重构

- **ai**: mount embedding index task copy bridge (03d1bc6)
- **ai**: clarify embedding index task copy (d69501b)
- **tree**: group create and import actions (8e99702)
- **sidebar**: delete legacy notebook directory implementation (a8b5804)
- **layout**: retire manage mode and list-toggle shortcut (2bc0913)
- **shortcuts**: remove retired note-list layout shortcut (f1fd25d)
- **commands**: retire legacy note-list layout command (e2078cb)
- **navigation**: remove legacy all-notes directory entry (790fb77)
- **frontend**: handle all sidebar search surfaces safely (5aca659)
- **frontend**: mount unified sidebar search experience (d3e2ddb)
- **frontend**: install sidebar search compatibility bridge (16aa13c)
- **frontend**: retire duplicate sidebar search field (c613e18)
- **frontend**: remove legacy notebook tree toggle (0897353)
- **knowledge-tree**: preserve base schema helper for trigger hardening (ae49e45)
- **permissions**: preserve capability core for workspace ownership fix (50d43b8)
- **knowledge-tree**: preserve core service for listing fix (fce65cc)
- **code-block**: keep language setup in view dependency (a0939da)
- **editor**: use scoped list move operations (7908287)
- **editor**: scope list item moves (4beee4e)
- **blocks**: use scoped list move protocol (99d8465)
- **blocks**: scope list hierarchy moves (37207c8)
- **attachments**: remove retired image host wording (5e72f3f)
- **attachments**: remove third-party image hosting (f128192)
- **image-hosting**: route legacy config through repository (faf015f)
- **frontend**: 简化笔记列表拖放目标解析逻辑 (19d1661)
- **upload**: remove image-host-specific timeout constants (9dac0ac)
- **api**: remove retired image-host upload override (2e7cb0a)
- **image-hosting**: remove retired fallback policy service (146b6be)
- **image-hosting**: remove retired S3 image host service (4ec7bc7)
- **frontend**: 简化笔记本排序偏好存储并优化刷新按钮锚点 (ae33d88)
- **image-hosting**: retire upload API and preserve migration metadata (976f78c)
- **attachments**: retire third-party image upload path (be940fb)
- **navigation**: expose connection actions through account menu (473e416)
- **desktop**: turn server center into connection and account flow (d840e4e)
- **migration**: remove superseded light migration engine (dfc518c)
- **migration**: remove legacy cloud migration dialog (46c8ada)
- **desktop**: move server management into account flow (86fa803)
- **editor**: share Tiptap derived runtime policy (f53bab1)
- **editor**: isolate Tiptap derived runtime policy (e822a71)
- **editor**: unify markdown safe mode with runtime policy (17f945c)
- **releases**: share cached release lookup with updater (#330) (bab11a4)

### 📝 文档

- 设计知识树滚动条视觉方案 (25ac654)
- **perf**: document issue 210 cross-platform sign-off (7c74301)
- **sdk**: show Markdown create and update flows (882b980)
- **api**: document native Markdown note contract (c74a609)
- 设计移除视口优化提示 (fc18197)
- 编写移除侧栏账号入口计划 (3aff5ee)
- 设计移除侧栏账号入口 (16bcc6a)
- 编写移除连接与迁移功能计划 (9833ddc)
- 设计移除连接与迁移功能 (180bfd5)
- 编写拆分文档菜单实现计划 (6039616)
- 设计拆分文档入口移入更多菜单 (bac901e)
- 更新 M6～M7 灰度与代际说明 (ba91868)
- 添加 M6～M7 实施计划 (54e1e70)
- 固化 M6～M7 灰度演进设计 (c4dfd0c)
- **blocks**: document safe inline images V2-J (170c8be)
- **blocks**: document list item structure patches V2-I (737491a)
- **blocks**: describe list item structure patches (3514376)
- **blocks**: document list subtree index mode (8bab906)
- **blocks**: document list subtree index updates (b50490d)
- **blocks**: clarify list attrs and subtree planning (bbb96dc)
- **blocks**: document list hierarchy patch V2-G (7c8d442)
- **blocks**: describe controlled list hierarchy patches (1bba45f)
- **blocks**: record no-history empty Block reconciliation (f6e43ea)
- **blocks**: document empty document reconciliation V2-E (6f77735)
- **blocks**: record empty document reconciliation (66b6044)
- **blocks**: document mixed index patch V2-D (126da74)
- **blocks**: document structural index patch V2-C (ff34ed4)
- **blocks**: document incremental index updates (e9e7d97)
- **blocks**: document rich replacement patch V2 (c7dcfb0)
- **env**: remove legacy image hosting wording (b74ca53)
- **attachments**: document image-hosting retirement and migration (c97f32e)
- **desktop**: document connection-first server workflow (7e59384)
- **blocks**: document grey-save safety boundaries (b89a148)
- **blocks**: document Tiptap grey rollout (4bd7883)
- **blocks**: clarify user-level idempotency keys (8aa9a85)
- **blocks**: document Block Patch API V1 (658e547)
- **block-links**: document split redirect behavior (ade6961)
- **note-split**: record Tiptap split implementation (f180963)
- **note-split**: assess rich-text heading split (a1b3106)
- **readme**: use HTTP official and demo addresses (cac88e4)
- **tutorials**: update web guide and HTTP links (88c222d)
- **tutorials**: refresh quick start workflow (b41af29)
- **tutorials**: rebuild current help center index (b72d9cc)
- **readme**: distinguish official website and demo (42ec2d4)
- **readme**: align English project guide (ee25ab6)
- **readme**: rewrite project overview and deployment guide (6b108df)
- **docker**: update deployment and online upgrade workflow (#330) (e02e7fa)
- **updater**: add security and recovery guide (#330) (ec9b6ce)
- **docker**: document updater environment controls (#330) (2cb50aa)

### 💄 样式

- **frontend**: distinguish tree filtering from global search (b1b3ba0)
- **sdk**: remove accidental BOM (3b95332)

### ✅ 测试

- **import**: cover SingleFile HTML normalization (f23cb6a)
- **ai**: cover embedding index task copy (e74fe59)
- **tree**: lock web scrollbar runtime contract (e629c57)
- **tree**: cover custom scrollbar geometry (ee5570b)
- **tree**: lock visible desktop scrollbar contract (0b9be0c)
- **tree**: lock inline create interaction contract (c129362)
- **tree**: cover inline create title helpers (e75cb19)
- **sidebar**: accept simplified unified sidebar root guard (e1a39e3)
- **shortcuts**: remove legacy note-list shortcut expectations (842c8a7)
- **layout**: cover unified-tree-only migration and view policy (a93a7d7)
- **layout**: align editor workspace tests with unified tree (68fc21d)
- **mobile**: run note search launcher in jsdom (8d18b79)
- **mobile**: cover note search launcher sequencing (2634ceb)
- **frontend**: run knowledge tree sort tests in jsdom (4a4c05e)
- **frontend**: cover unified knowledge tree sorting (5fea266)
- **frontend**: cover sidebar search scope cleanup (134e30f)
- **electron**: cover markdown encoding detection (693d89d)
- **editor**: align format painter fixtures with schema (a24b726)
- **issue-455**: add one-shot schema fixture correction (c4441d3)
- **issue-455**: add schema-correct test fix (dfaf622)
- **editor**: protect format painter UI integration (444c4cc)
- **editor**: cover safe format painter behavior (85a9df8)
- **android**: cover Markdown immersive editing (d009e44)
- **android**: add immersive editor regression gate (90b6a7b)
- **knowledge-tree**: cover context menu capability matrix (2bc1d26)
- **shortcuts**: verify cleared bindings remove tooltip hints (bfcc334)
- **shortcuts**: model the real ProseMirror editor root (3556083)
- **shortcuts**: verify exported platform document (d9c3477)
- **shortcuts**: cover persistence validation and reset (5e002f9)
- **note-split**: destroy Yjs rooms during database cleanup (7045e4a)
- **note-split**: close database after backend suite (d29647a)
- close shared database after backend suites (4410050)
- **knowledge-tree**: trace subtree restore steps (268906b)
- **knowledge-tree**: expose failing operation phase (2c44357)
- **postgres**: cover v64 structural guard (9d25391)
- **knowledge-tree**: expect v64 structural guard schema (d20f55e)
- **postgres**: verify document-parent preservation trigger (f636ded)
- **knowledge-tree**: expect v63 legacy sync schema (1dcd713)
- **knowledge-tree**: verify complete subtree restore (8a55a79)
- **permissions**: prevent workspace creators from becoming node admins (b9a4886)
- **knowledge-tree**: avoid CommonJS top-level await (714117f)
- **shares**: mount named management router (#447) (7eeb53d)
- **shares**: cover management HTTP contract (#447) (0a42d22)
- **perf**: require complete issue 210 stability evidence (ca82c66)
- **perf**: focus the synthetic editor before save sampling (fe2c575)
- **shares**: use repository React DOM harness (#447) (4f8daeb)
- **perf**: cover issue 210 sign-off validator (12393b9)
- **shares**: stabilize page API mock (#447) (7ab181e)
- **perf**: cover issue 210 runtime collector (0a647b2)
- **shares**: cover management page rendering and filters (#447) (7cc830d)
- **shares**: cover management presentation helpers (#447) (9ee4f0e)
- **shares**: cover management filtering and access (#447) (c03b10e)
- **issue-370**: cover workspace layout helpers (a4dd3d1)
- **api**: cover authorized shared notebook subtree (45724fc)
- **sidebar**: cover shared notebook hierarchy (5f0040b)
- **block-patch**: align gate with current protocols (#355) (cb4b829)
- **editor**: cover initialization timeout downgrade (be1138d)
- **tags**: cover idempotent scoped creation (f9d7f89)
- **tags**: cover scoped uniqueness migration (bfa3f52)
- **sdk**: cover Markdown note API contract (49f9da4)
- **code-block**: separate case and autodetect checks (30f07a0)
- **code-block**: cover MAXScript picker label (f1252fc)
- **markdown**: cover MAXScript fences (89c5b0a)
- **code-block**: cover MAXScript registration (304fec0)
- **import**: require current admin role for permission undo (348e513)
- **export**: resolve data manager workspace scope (dc31740)
- **import**: read postgres import batch migration (e8cfe39)
- **import**: verify postgres permission schema contract (beea4ac)
- **import**: accept normalized markdown block ids (ecf8229)
- **import**: cover permission review and request payloads (1504186)
- **import**: cover v2 permission transfer and undo (e113372)
- 修正窗口化选择测试类型 (8d1387c)
- **editor**: send inline image Block patches (9baa4e8)
- **blocks**: cover image replacement route transactions (e1bfdba)
- **editor**: plan inline image Block replacements (f5d7e15)
- **blocks**: cover inline image replacement patches (71d005d)
- **editor**: type list structure API fixtures (88d77a2)
- **editor**: cover list structure API contract (8bba0ac)
- **editor**: reject conflicting list structure identities (f47d223)
- **blocks**: keep truly unrelated rows stable (0b45e11)
- **editor**: send list item structure Block patches (efb6bca)
- **editor**: cover list item structure planning (6042f6e)
- **blocks**: cover list item structure patch transactions (2cbc3d2)
- **blocks**: cover controlled list item structure patches (9e9c72d)
- **editor**: accept list subtree index responses (bbc26aa)
- **blocks**: cover incremental list subtree indexes (af01cba)
- **editor**: cover list moves with large subtrees (7acdd84)
- **editor**: align deterministic adjacent list move (40817fe)
- **editor**: cover ordered attrs and equivalent list moves (0df7ee7)
- **blocks**: preserve ordered list attrs on sink (86f86f6)
- **editor**: fall back after rejected list moves (5ef3b88)
- **editor**: send list hierarchy Block patches (c7cd8de)
- **blocks**: cover list hierarchy patch transactions (1e62559)
- **editor**: cover controlled list hierarchy planning (77e9349)
- **blocks**: cover controlled list hierarchy moves (b6411ba)
- **editor**: preserve undo across empty Block ID reconciliation (844c753)
- **editor**: expect empty document Block patch (d7a890b)
- **editor**: reconcile server empty Block identity (5099932)
- **editor**: plan empty document Block reconciliation (a7c48b2)
- **ai**: isolate embedding queue hardening cases (48ad3b5)
- **blocks**: cover create-then-move mixed identities (b1a6309)
- **editor**: align rich planner with unified top-level batches (556dd53)
- **ai**: cover embedding queue recovery (9c27cde)
- **blocks**: cover mixed incremental patch indexes (5988237)
- **editor**: plan rich mixed structural batches (9c7aa5b)
- **editor**: expose structural index update kind (b746651)
- **blocks**: cover incremental top-level structural indexes (901bde7)
- **blocks**: expose incremental index response metadata (b24d0b2)
- **blocks**: cover ancestor and type index updates (c36c785)
- **blocks**: cover incremental patch indexes (752523c)
- **blocks**: type route V2 count assertions (38380c2)
- **editor**: route rich block changes through patch V2 (c36e630)
- **editor**: plan safe rich block replacements (cb0da33)
- **blocks**: cover rich replacement transactions (9c5fe01)
- **blocks**: cover safe rich block replacements (5e4af1c)
- **image-hosting**: enforce repository-backed legacy cleanup (fb6c991)
- **image-hosting**: verify retired backend surface (abc9c75)
- **attachments**: lock third-party image hosting retirement (b7be8cc)
- **desktop**: cover connection-first server navigation (d0950c8)
- **import**: cover permission mapping client requests (5320cfc)
- **import**: cover permission export and guarded mapping (d3d058b)
- **editor**: cover rich node fallback classification (aa835bc)
- **editor**: cover rich block patch planning (81e9206)
- **blocks**: cover rich block replacements (5decf7c)
- **blocks**: preserve version history transactionally (3e4955d)
- **editor**: scope Block Patch runtime to owning note (8998259)
- **editor**: keep delete-all on whole-save fallback (a6d510c)
- **editor**: serialize title saves after Block Patch (dfc3cd1)
- **editor**: keep public Tiptap outside AppContext (47bbdc6)
- **editor**: cover Tiptap Block Patch runtime shell (efca5d1)
- **blocks**: cover authoritative patch response (bea1d9d)
- **blocks**: assert authoritative patch snapshots (332e46e)
- **editor**: cover Block Patch rollout policy (0aa797a)
- **editor**: cover safe Tiptap patch planning (486e1bc)
- **blocks**: reject cross-note operation ID reuse (666d9f4)
- **blocks**: cover confirmed frontend patch client (3e7d6b5)
- **blocks**: keep nested containers valid after patch deletes (8aa6696)
- **blocks**: cover atomic batch patch route (a64a716)
- **blocks**: cover pure Tiptap batch patch engine (213d8a8)
- **editor**: cover optimized Tiptap derived policy (06d61d8)
- **editor**: cover immutable derived snapshot cache (7fdf233)
- **editor**: cover Tiptap derived runtime aliases (a260aa7)
- **editor**: mirror runtime shell aliases in vitest (c833f4b)
- **editor**: avoid decoration implementation details (f2812d9)
- **editor**: cover lightweight search runtime policy (6a0f04d)
- **editor**: cover deferred math rendering (98d53ab)
- **block-links**: cover Markdown split redirects (0d34e72)
- **block-links**: cover redirected client navigation (df31de1)
- **block-links**: exercise a real two-hop block chain (fd6c0e1)
- **block-links**: cover split redirect resolution (8b90ab2)
- **note-split**: cover empty Tiptap chapter bodies (1f1dba8)
- **note-split**: cover rich-text risk confirmation (0418f31)
- **note-split**: cover Tiptap preview boundaries (2642e35)
- **note-split**: cover Tiptap planning and transactions (77a9f95)
- **note-split**: strip persisted block ids from titles (527622c)
- **note-split**: strip heading block ids in preview (728f028)
- **note-split**: verify valid directory backlinks (b9b5c1f)
- **note-split**: submit selected chapter indexes (5a80f1b)
- **note-split**: cover selected chapters and retained attachments (b961ee7)
- **docker**: guard hardened backup entrypoint (#352) (d1b97ad)
- **note-split**: preserve markdown line breaks while stripping block ids (bf61383)
- **note-split**: compare restored markdown semantically (f9265ba)
- **note-split**: verify transactional split attachment and undo flow (c9f4ed4)
- **editor**: verify format-aware mode staging (1601cca)
- **desktop**: cover markdown editor selection (bcca496)
- **note-split**: cover client split preview (6470ea1)
- **note-split**: cover markdown split planning (726172c)
- **markdown**: validate real Y.Text event deltas (a6fe049)
- **markdown**: cover incremental collaboration runtime (27b60f9)
- **editor**: make bilibili paste assertion resilient (86df640)
- **editor**: cover bilibili link paste embedding (52fefbd)
- **markdown**: cover incremental Y.Text mapping (ecd9414)
- **markdown**: cover viewport editor routing (44806ec)
- **markdown**: cover stale-safe worker controller (f4b4215)
- **markdown**: cover worker-safe analysis (63e933b)
- **editor**: stabilize deferred media node coverage (f2c64d3)
- **editor**: cover deferred video and mermaid shells (290361e)
- **editor**: cover interaction-gated heavy nodes (016bce8)
- **editor**: make viewport highlight timing deterministic (817cc0e)
- **editor**: cover runtime notice session restore (231d552)
- **editor**: cover viewport-scoped code highlighting (57cb100)
- **editor**: correct structural node expectation (41034f0)
- **editor**: avoid global act environment type conflict (2454d09)
- **editor**: cover heavy-node viewport activation (46000bb)
- **editor**: run runtime store tests in jsdom (ae53012)
- **editor**: cover progressive rich-text routing (351c580)
- **editor**: cover runtime store and capability changes (df7c4ad)
- **editor**: cover progressive runtime modes (4c91d39)
- **editor**: cover rich-text safe mode thresholds (206e28a)
- **search**: cover full-text spinner animation fallback (64b3678)
- **search**: cover sidebar spinner animation (f220471)
- **search**: cover buffered sidebar input policy (2996e2b)
- **search**: cover progressive query delay (b35dba6)
- **search**: cover progressive short query policy (2dc881a)
- **editor**: cover large Markdown safe mode thresholds (920c448)
- **editor**: add large Markdown freeze reproducer (e669742)
- **android**: 修正 findLast 回调类型约束 (02354e3)
- **android**: 稳定旧 WebView 编辑器兼容用例 (fcea8d9)
- **editor**: 覆盖 WebView 兼容错误提示 (6a76d22)
- **android**: 覆盖旧 WebView Tiptap findLast 回归 (43aaef0)
- **editor**: remove obsolete task DOM identity test (#361) (dae12bc)
- **editor**: guard against task list observer loops (#361) (7100c33)
- **sync**: cover failed recovery without success signal (#350) (2faed86)
- **sync**: cover visibility and real recovery states (#350) (3b3ba30)
- **editor**: cover code block NodeView indent (#327) (94665ce)
- **electron**: reject stale updater binaries (#329) (8dfd0e7)
- **embed**: cover acknowledged cross-origin password delivery (#284) (37ade57)
- **siyuan**: make issue 284 fixture path runner-independent (#284) (81e5697)
- **embed**: use the active jsdom origin (#284) (f6c4372)
- **siyuan**: align fixture block IDs with Spec 2 (#284) (665ca16)
- **siyuan**: cover issue 284 package import end to end (#284) (1691f73)
- **siyuan**: document issue 284 regression fixture (#284) (7a8beb1)
- **siyuan**: add valid issue 284 SiYuan AST fixture (#284) (b4f80e5)
- **embed**: cover DOM fill and password-free handshake offer (#284) (2dc9d14)
- **markdown**: render live callouts through real preview (#284) (0750027)
- **markdown**: cover imported callout aliases and IAL (#284) (8cb604b)
- **note-transfer**: cover preview guard and reference alignment (#325) (e1f8c87)
- **note-transfer**: await staged attachment transfers (#325) (585835d)
- **note-transfer**: cover cross-workspace copy and move (#325) (d1f835c)
- **android**: cover editor selection fallback decision (#335) (a4a92d2)
- **android**: cover Diary and editor media scope isolation (#338) (64aa10e)
- **updater**: cover image restrictions and config preservation (#330) (9b093e0)

### 📦 构建

- **blocks**: register batch patch route (d0befe3)
- **editor**: route Tiptap derived reads through runtime guards (1357974)
- **editor**: route math and search through runtime shells (e0a5a2b)
- **markdown**: emit classic analysis worker (64d2934)

### 🤖 CI

- **ai**: add embedding index copy regression gate (340e634)
- **issue-455**: upload typecheck diagnostics (82fb71e)
- **issue-455**: upload focused test diagnostics (011597b)
- **issue-455**: add permanent safe format painter gate (aca37ce)
- **knowledge-tree**: finalize context-menu regression gate (29f8f9c)
- **issue-468**: add one-time duplicate declaration fix runner (56a30af)
- **issue-468**: add one-time panel syntax fix runner (2ffd638)
- **knowledge-tree**: publish context-menu typecheck diagnostics (c9e3ede)
- **knowledge-tree**: cover restored context-menu capabilities (3d14924)
- **issue-468**: add controlled context-menu patch runner (5716cd7)
- **shortcuts**: use the repository typecheck command (93e5970)
- **shortcuts**: expose typecheck diagnostics (a0ac34f)
- **shortcuts**: minimize diagnostic setup output (09adfe9)
- **shortcuts**: keep failure logs compact (e1db641)
- **shortcuts**: run registry and override tests (ead8420)
- **knowledge-tree**: remove temporary Yjs patch job (7947c40)
- **note-split**: force exit after known tests finish (7eb1f2c)
- **note-split**: restore focused regression gate (9a01c57)
- **issue-370**: patch Yjs flush from branch workflow (4e1dd65)
- **note-split**: patch no-op Yjs flush before regression gate (f2e176c)
- **issue-370**: run Yjs patch on PR updates (5262d90)
- **issue-370**: apply Yjs no-op flush fix (5fcc533)
- **note-split**: expose failing test tail in diagnostics (cc747a4)
- **note-split**: print focused timeout diagnostics (098efac)
- **note-split**: expose per-suite failure status (8ea7449)
- **note-split**: publish bounded failure diagnostics (d996f02)
- **note-split**: upload diagnostics only on failure (2b6c76a)
- **note-split**: bound and isolate backend diagnostics (a56e32e)
- **note-split**: capture backend failure diagnostics (442329c)
- **knowledge-tree**: retrigger validation after restore fix (eecae9a)
- **knowledge-tree**: publish backend failure diagnostics (e2db313)
- **knowledge-tree**: report branch validation to epic (f6d8e5d)
- **knowledge-tree**: validate feature branch before PR (b6596c8)
- **shares**: document final V1 gate (#447) (22d174b)
- final sync main for issue 447 (cf4fcae)
- **shares**: retain backend diagnostics (#447) (31e34fe)
- **shares**: add management route contract test (#447) (ec9d753)
- sync latest main for issue 447 (d972108)
- **shares**: add share management regression gate (#447) (339a896)
- apply and verify issue 210 sign-off hardening (5d0f360)
- rerun issue 447 with nullable title fix (f7098b8)
- align issue 447 nullable note title (d2296d7)
- capture issue 447 TypeScript diagnostics (5ad96e0)
- upload issue 210 test diagnostics (6fee820)
- verify issue 210 performance sign-off tooling (89173fc)
- capture issue 447 frontend diagnostics (54e2eb4)
- rerun issue 447 bootstrap after test fix (7acb151)
- verify issue 447 implementation (f365a99)
- bootstrap issue 447 integration (d9ae8bf)
- **issue-370**: add layout and split checks (fa4d40e)
- bootstrap shared notebook tree patch (9127715)
- **issue-355**: sync latest main before final review (812c26f)
- **issue-355**: complete api mock shape (c77c0b2)
- **issue-355**: capture gate repair failures (83c6fb6)
- **issue-355**: repair and verify block patch gate (6bf5c73)
- **issue-355**: upload diagnostic logs (737ea8b)
- **issue-355**: diagnose block patch regression (19cb0f8)
- **issue-355**: include REST content-view contract test (ad26977)
- **editor**: add initialization timeout regression gate (5fbf00a)
- **issue-355**: verify API and projection boundaries (18f0080)
- **issue-355**: add content-format regression gate (0e23b2a)
- **issue-355**: commit verified source outside workflow paths (c172a05)
- **issue-355**: checkout source branch before rework (097f1e0)
- **issue-355**: allow PR-triggered verified rework (b998e9f)
- **issue-355**: run verified content-format rework (4980176)
- **tags**: add idempotency regression gate (d2e6f65)
- **sdk**: finalize read-only contract gate (7a6afca)
- **sdk**: capture contract test diagnostics (bb665e6)
- **sdk**: report build diagnostics on pull requests (a771393)
- **sdk**: split build and contract test steps (c4b72de)
- **sdk**: add public API contract gate (3b1849c)
- **search**: add regression gate for issue #340 (84da9c4)
- **code-block**: remove temporary diagnostics workflow (1d61f7a)
- **code-block**: split case and autodetect checks (6e385b2)
- **code-block**: isolate MAXScript grammar checks (9b8ef72)
- **editor**: isolate MAXScript validation steps (b639a7b)
- **editor**: validate code-block language extensions (4e9af99)
- **import**: cover permission undo authorization (09d9ae7)
- **import**: watch primary package import flow (627a794)
- **import**: validate postgres permission schema contract (83476d5)
- **import**: validate permission transfer v2 (c8b4c22)
- **blocks**: cover image route and runtime integration (1e9edc2)
- **blocks**: cover inline image Block patches (0c9fddf)
- **editor**: allow manual focused workflow runs (04873f4)
- **blocks**: allow manual focused workflow runs (8df1925)
- **blocks**: cover list structure client contract (c9caaf2)
- **blocks**: cover list item structure patches (69aaa01)
- **blocks**: cover list subtree index planning (6f67bd5)
- **blocks**: cover controlled list hierarchy patches (32bf59b)
- **blocks**: cover no-history empty Block reconciliation (8e1884b)
- **blocks**: cover empty document reconciliation (ac85394)
- remove embedding queue trigger (2e4276d)
- **blocks**: cover mixed incremental indexes (de71d75)
- remove one-shot embedding queue script (c3c2408)
- remove one-shot embedding queue workflow (8342a80)
- prepare embedding queue fix run (79d0d45)
- trigger embedding fix from merge push (d442816)
- run embedding queue fix validation (70bab12)
- add one-shot embedding queue fix script (6d6923f)
- replace embedding queue validation workflow (b1c9012)
- validate embedding queue recovery fix (4b3b02c)
- **blocks**: cover incremental patch indexes (be473a6)
- **blocks**: cover rich replacement patch V2 (d284ca8)
- remove verified removal artifact workflow (e99393a)
- remove one-shot image hosting removal workflow (7468644)
- **pg**: remove obsolete image hosting validator (2567b69)
- **pg**: remove image hosting final-sync hooks (da786d5)
- **pg**: remove image hosting restoration hooks (6522627)
- apply verified image hosting removal artifact (fc562cb)
- include verified hidden removal bundle (b03d15d)
- publish verified image hosting removal artifact (3e0b8ff)
- publish verified image hosting removal to result branch (d8647b4)
- trigger image hosting removal from one-shot PR (27b1bf6)
- trigger image hosting removal from issue comment (d87d7ba)
- trigger complete image hosting removal (ca67e21)
- add one-shot image hosting removal workflow (c3fe58d)
- **image-hosting**: remove retired migration trigger (710d7f1)
- **image-hosting**: remove retired migration workflow (e1372dc)
- **import**: validate round-trip permission mapping (f6f9ec7)
- **pg**: remove temporary round-trip C-1 validator (7f48e5a)
- **pg**: validate round-trip C-1 through pull requests (2ff7d15)
- **pg**: add round-trip batch metadata migration gate (a3e9342)
- **editor**: cover public Tiptap runtime context (a3aa9ed)
- **blocks**: cover public Tiptap context isolation (617877e)
- **editor**: run Tiptap Block Patch shell test (ab7395e)
- **pg**: use final synchronization gate on stable trigger (16c4dba)
- **blocks**: run Tiptap runtime shell regression (fa34f26)
- **pg**: add final latest-main synchronization gate (23c6f14)
- **editor**: cover Tiptap Block Patch rollout (5ed495f)
- **blocks**: validate Tiptap grey rollout (a44da36)
- **pg**: validate image hosting migration batch (afb021b)
- **pg**: trigger image hosting runtime migration (0063229)
- **pg**: add deterministic image hosting migration runner (f36b25a)
- **pg**: finalize image hosting runtime migration (38d013e)
- **pg**: migrate image hosting settings through runtime repository (a56ff09)
- **pg**: sync main from verified Yjs fix head (ce93fc1)
- **pg**: make Yjs fix resilient to indentation (295df2c)
- **pg**: apply verified Yjs fix to migration branch (7686e2a)
- **pg**: fix Yjs no-op version accounting (cf8e02e)
- **pg**: add note split undo diagnostics (ae5046e)
- **blocks**: validate frontend patch contract (6274d03)
- **pg**: rerun synchronized main validation with Yjs fix (bb1b3dc)
- **blocks**: validate batch patch engine and route (f21084c)
- **pg**: patch Yjs version semantics during synchronization (847bca2)
- **pg**: push Yjs fix before validation (112d6bf)
- **pg**: validate Yjs fix before main synchronization (86cda5b)
- **editor**: cover Tiptap derived runtime guards (0853664)
- **pg**: trigger Yjs fix from sync PR comment (16e198f)
- **pg**: trigger Yjs version fix (dd741ad)
- **pg**: add one-shot Yjs version fix runner (73b001a)
- **pg**: trigger synchronized main validation (023cc1a)
- **pg**: add deterministic push trigger for synchronization (cf12b08)
- **pg**: make main synchronization deterministic (d09ab16)
- **editor**: trigger when runtime test aliases change (3d25d41)
- **editor**: cover math and search runtime shells (4dc2f45)
- reconcile remaining main sync regressions (ee6de23)
- **block-links**: cover split redirect resolution (5ac89be)
- preserve reconciled PG files and upload SQLite diagnostics (a7fabd5)
- rerun failed SQLite files with detailed diagnostics (443d873)
- **note-split**: include empty Tiptap chapter regression (baa84b3)
- publish SQLite regression diagnostics during PG sync (3cae1d2)
- **note-split**: cover Tiptap split workflow (1bb24b1)
- publish PostgreSQL schema parity diagnostics during sync (4944f8e)
- publish SQLite boundary diagnostics during PG sync (87547f2)
- preserve reconciled PostgreSQL files during main sync (fcd0543)
- publish PostgreSQL sync status to fixed comment (d4436cc)
- validate token resources during PostgreSQL branch sync (cbc7995)
- include merged token route source diagnostics (5bcdfbb)
- **note-split**: include title normalization test (337ff12)
- publish PostgreSQL sync typecheck diagnostics (4acf57f)
- add one-time main to PostgreSQL branch sync workflow (0dee261)
- **note-split**: cover selected chapter workflow (6ecdca7)
- **note-split**: add frontend and backend regression workflow (cea8ecf)
- **markdown**: cover incremental Y.Text synchronization (4442bfb)
- **markdown**: cover viewport worker analysis (d28b4d0)
- **editor**: cover deferred media runtime shells (6ace8a5)
- **editor**: cover viewport highlight and runtime notice (31eabf1)
- **editor**: include code highlight runtime regression (6d249fb)
- **editor**: add progressive runtime regression checks (05f57a3)

### 🔧 其他

- ignore frontend/dist.bak build backup (e36b8dc)
- **issue-455**: remove one-shot nested block workflow (74ee0ec)
- **issue-455**: remove one-shot hook scope workflow (54a6b16)
- **issue-455**: remove one-shot test fixture workflow (7ba0e8b)
- **issue-455**: remove one-shot hook-order workflow (f379594)
- **issue-455**: remove one-shot format painter workflow (05db9d6)
- **issue-455**: add one-shot format painter integration workflow (b465f0b)
- **issue-455**: add controlled format painter integration (cadc116)
- **android**: remove one-shot immersive focus workflow (9a9640a)
- **android**: add one-shot immersive toolbar focus integration (b276f81)
- **android**: add final immersive toolbar focus fix (4afdfb8)
- **android**: remove one-shot Markdown cutover workflow (d5c22e0)
- **android**: add one-shot Markdown immersive integration (5fdbffa)
- **android**: add one-shot Markdown immersive patch (9fc2dcc)
- **editor**: remove one-shot immersive cutover workflow (cbd0974)
- **editor**: use unique immersive editor patch anchor (be543e4)
- **editor**: capture immersive patch diagnostics (41da241)
- **editor**: add one-shot Android immersive editor integration (cfc5515)
- **editor**: add one-shot Android immersive editor patch (736b964)
- **issue-468**: remove one-time duplicate declaration workflow (e578ac3)
- **issue-468**: add one-time duplicate declaration fix (a427634)
- **issue-468**: remove one-time panel syntax workflow (72a5a2a)
- **issue-468**: add one-time panel syntax fix (1a9e6bc)
- **issue-468**: remove one-time context-menu patch workflow (d442a4e)
- **issue-468**: add controlled context-menu integration patch (882e983)
- **shortcuts**: remove one-shot customization workflow [skip ci] (93486dd)
- **shortcuts**: run one-shot patch from pull request (9df5a13)
- **shortcuts**: run one-shot customization patch (a3640c0)
- **shortcuts**: add one-shot patch script (7e7ba35)
- **shortcuts**: trigger integration patch (b84a2d6)
- **shortcuts**: add one-shot customization patch (756daa7)
- **issue-370**: remove temporary Yjs auto-fix workflow (0e62ddd)
- **issue-370**: remove temporary Yjs patch workflow (18a614c)
- **issue-370**: add temporary Yjs flush auto-fix workflow (efe131d)
- **knowledge-tree**: remove restore diagnostics (e369ccc)
- **shares**: remove final main sync workflow (8b6c4f7)
- **shares**: remove temporary main sync workflow (3662257)
- **perf**: remove temporary issue 210 hardening script (d72b969)
- **shares**: remove temporary bootstrap workflow (5da94f4)
- **ci**: remove temporary issue 210 hardening workflow (8e4f66e)
- **shares**: remove temporary type fix script (de3f8a2)
- **shares**: remove temporary integration script (6bbc49f)
- **perf**: add temporary issue 210 hardening patch (d055f96)
- **ci**: remove temporary issue 210 verification workflow (cc32b32)
- **perf**: add issue 210 sign-off commands (9d11b4a)
- remove issue 365 bootstrap workflow (e643850)
- remove issue 365 bootstrap script (8b6dd61)
- add issue 365 branch patch bootstrap (34b92a7)
- **issue-355**: remove temporary main sync workflow (6247e08)
- **issue-355**: remove temporary gate repair workflow (6231c90)
- **issue-355**: remove temporary gate repair script (4327dd5)
- **issue-355**: add block patch gate repair script (c49c31b)
- **issue-355**: remove temporary boundary script (4cfbc78)
- **issue-355**: remove temporary boundary workflow (e9fe614)
- **issue-355**: add boundary verification script (3f968ee)
- **issue-355**: remove temporary rework script (a27d704)
- **issue-355**: remove temporary rework workflow (1e50013)
- **issue-355**: add verified rework script (1cd94f3)
- remove accidental file (3dc9740)
- remove accidental placeholder (573c1ae)
- placeholder (7634ac7)
- **import**: sync permission centers with latest main (4397551)
- remove unused search hotfix workflow (a0133bd)
- apply search input hotfix on main (56a8f4b)

### ⏪ 回滚

- remove accidental placeholder file (fcbe300)

### 📌 杂项

- placeholder (072420e)
- 优化分享管理的公开地址风险提示 (#457) (6649fcf)
- noop (9310bde)

### v1.4.1 - 2026-07-17

### 📝 文档

- design markdown live preview image auth fix (eaf611e)

### 🤖 CI

- remove temporary PostgreSQL access/session validator (abec8f3)
- temporarily validate PostgreSQL access and sessions (38251e6)

### 📌 杂项

- fix preserve protocol-relative markdown images (c394870)
- fix markdown live preview attachment images (13f5822)
- fix notebook export attachment auth (9bd3dd8)
- fix clipboard copy (03b2c68)
- fix notebook publication routes (5b02e06)

### v1.4.0 - 2026-07-17

### 🐛 修复

- **db**: migrate share comment source fields before indexing (ee86795)

### 📝 文档

- **db**: plan share comments migration fix (080b955)
- **db**: document share comments migration fix (7cbaf4e)

<!-- CHANGELOG:END -->
