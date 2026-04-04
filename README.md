<div align="center">
  <h1>HyTicker v1.0.0 🚀</h1>
  <p>一个极简的桌面点阵时间感知 & 番茄钟工具，让时间的流逝「看得见」。</p>
  
  [![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
  [![Vue](https://img.shields.io/badge/Vue-3-brightgreen?logo=vue.js)](https://vuejs.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
</div>

## ✨ 简介

在无数个分心的瞬间，你是否感受不到时间的消逝？

**HyTicker** 用优雅的点阵矩阵将时间具象化 —— 每一个小圆点代表一段时间单元，随着时间推移逐个亮起。这不仅仅是一个桌面时钟，更是一个帮你找回专注力的桌面艺术品。内置完善的番茄钟模式，专为沉浸式专注与防走神设计。

## 📸 特性一览

### 多维度时间感知
- 四大自然时间模式（日 / 周 / 月 / 年），直观感受时间进度从指尖溜走。

### 沉浸式番茄钟
- 开始专注后边缘 UI 自动隐去，屏幕上只留下一颗颗亮起的圆点陪你。
- 支持自定义专注时长，后台切出切入也不会丢失当前精度。

### 视觉动画
- **矩阵点亮**：新圆点亮起伴随平滑弹入动画。
- **磁力特效**：鼠标靠近点亮的圆点时，会产生有灵性的排斥与震荡效果。

### 数据面板
- **任务标签管理**：为不同类型的专注设定专属标签与辨识颜色。
- **全景统计**：今日及历史累计专注时长/番茄数、近 7 日柱状趋势图以及详细打卡记录。
- 采用 \@tauri-apps/plugin-store\ 本地数据自动持久化，你的专注数据绝对隐私安全。

### 可定制化
- 多彩主题色支持，圆点形状（圆形/方形）、点阵粗细/密度随时可调。
- 全局窗口透明度、背景色以及 UI 缩放随心设置。
- 双语全面支持（中文 / English）。

### 无边框体验
- 完美的沉浸式无边框视口，支持窗口随意拖拽、位置锁定、全局置顶保留。
- 支持最小化至系统托盘静默运行，并提供本地专注完成的系统通知弹窗。

## ▶️ 预览

<div align="center">
  <video src="./public/Preview.mp4" width="50%" autoplay loop muted playsinline></video>
</div>

## 🛠️ 技术栈应用

| 层级 | 技术方案 |
|------|------|
| **Desktop 桌面端** | Tauri v2 (Rust) |
| **Frontend 前端** | Vue 3 (\<script setup>\) + TypeScript |
| **Styling 样式设定** | TailwindCSS v4 |
| **Animation 骨骼动画**| GSAP 3 + CSS Anim (@Keyframes) |
| **持久化 & 通知** | \@tauri-apps/plugin-store\ & \
otification\ |
| **构建链** | Vite 6 |

## 🚀 快速开始

### 系统要求

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/tools/install) ≥ 1.70
- [Tauri v2 环境预配置](https://v2.tauri.app/start/prerequisites/)

### 编译 & 运行

```bash
# 1. 克隆项目到本地
git clone https://github.com/Hyr1sky/HyTicker.git
cd HyTicker

# 2. 安装前端组件依赖
npm install

# 3. 启动本地开发模式
npm run tauri dev

# 4. 构建生产安装包 (用于生成 Mac / Windows / Linux 独立客户端)
npm run tauri build
```

## 📝 快捷操作指南

| 动作 | 效果说明 |
|------|------|
| **拖拽标题栏** | 以任何角度移动窗口位置 |
| **锁定** 🔒 | 彻底锁定窗口位置，防止作业时误触拖动 |
| **置顶** 📌 | 让时间画板始终保持在屏幕的最高层级 |
| **番茄钟沉浸交互** | 时间流动时边缘自动隐藏；鼠标落回点阵内显示框架，点击空白处实现暂停/恢复 |
| **自定任务分类** | 番茄模式下选择“标签”，快速指派对应颜色的专注项目，事后在统计中追溯 |

## 📄 License

本项目基于 [MIT](LICENSE) 开源协议分发与更新。

---

> Built with ☕ by Hyrisky. Stay focused, stay present.
