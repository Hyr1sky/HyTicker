# HyTicker v0.1.0

> 一个极简的桌面点阵时间感知 & 番茄钟工具，让时间的流逝「看得见」。

![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)
![Vue](https://img.shields.io/badge/Vue-3-brightgreen?logo=vue.js)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 简介

~~兄弟兄弟，我有ADHD怎么办~~

HyTicker 用点阵矩阵可视化时间流逝 —— 每一个小圆点代表一段时间单元，随着时间推移逐个点亮，让你直观感受时间的消逝。同时内置番茄钟模式，支持沉浸式专注体验。

## 📸 特性一览

- **多维度时间感知** — 日 / 周 / 月 / 年四种自然时间模式，粒度从分钟到天
- **番茄钟** — 自定义时长，启动后自动进入沉浸模式（隐藏 UI，仅保留点阵）
- **点阵动效** — 新点亮的圆点带有弹入动画（GSAP 驱动）
- **游玩特效** — 鼠标靠近有色圆点会产生磁力排斥效果，灵感来源于 Magnetic Balls
- **任务标签** — 为不同专注任务分配标签和颜色，统计时分类展示
- **统计面板** — 今日 / 累计专注时长与番茄数、7 日柱状图、每日详细记录
- **桌面通知** — 番茄钟完成时推送系统通知
- **数据持久化** — 设置、标签、统计数据本地持久存储
- **系统托盘** — 最小化到托盘，随时唤出
- **高度可定制** — 主题色、圆点形状、点阵密度、字体/按钮大小、窗口透明度、背景颜色
- **双语支持** — 中文 / English
- **无边框窗口** — 可拖拽、可锁定位置、可置顶

## ▶️ 预览

<div align="center">
  <img src="./dist/assets/Preview.png" alt="MainPage" width="50%" />
</div>

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Tauri v2](https://v2.tauri.app/) |
| 前端框架 | Vue 3 (`<script setup>` + TypeScript) |
| 样式 | TailwindCSS v4 |
| 动画 | GSAP 3 |
| 持久化 | @tauri-apps/plugin-store |
| 通知 | @tauri-apps/plugin-notification |
| 构建 | Vite 6 |

## 📁 项目结构

```
src/
├── components/
│   ├── TitleBar.vue          # 自定义标题栏（拖拽/锁定/置顶/统计/设置/关闭）
│   ├── ControlPanel.vue      # 模式切换 & 番茄钟控制
│   ├── MatrixRenderer.vue    # 点阵渲染（DOM + Canvas 双模式 + GSAP 特效）
│   ├── SettingsPanel.vue     # 设置面板
│   ├── StatsPanel.vue        # 统计面板（7日柱状图 + 记录列表）
│   └── TaskLabelBar.vue      # 任务标签选择器
├── composables/
│   ├── useTimeEngine.ts      # 核心时间引擎（rAF + 绝对时间戳）
│   ├── useSettings.ts        # 全局设置状态 + 自动持久化
│   ├── useI18n.ts            # 轻量 i18n（zh/en）
│   ├── useStats.ts           # 番茄钟统计
│   ├── useLabels.ts          # 任务标签管理
│   └── useStore.ts           # 持久化抽象层
├── App.vue
├── main.ts
└── style.css
src-tauri/
├── src/lib.rs                # Tauri 后端（托盘图标 + 插件注册）
└── tauri.conf.json
```

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/tools/install) ≥ 1.70
- [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/)

### 安装 & 运行

```bash
# 克隆项目
git clone https://github.com/<your-username>/HyTicker.git
cd HyTicker

# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 构建安装包
npm run tauri build
```

## 📝 使用说明

| 操作 | 说明 |
|------|------|
| 拖拽标题栏 | 移动窗口 |
| 🔒 锁定 | 禁止拖拽 |
| 📌 置顶 | 窗口始终在最前 |
| ⚙️ 设置 | 打开设置面板 |
| 📊 统计 | 查看专注数据 |
| 番茄钟沉浸模式 | 启动番茄钟后 UI 自动隐藏，点击点阵区域暂停恢复 |
| 切换 Tab | 番茄钟进度不会丢失 |
| 任务标签 | 番茄钟模式下可新建带颜色的标签，点击空白处退出新建 |

## 📄 License

[MIT](LICENSE)

---

> Build with ☕ by Hyrisky, I need them both.