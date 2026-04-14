# 🎮 玩出来 Peekaboo

> 婴儿亲子游戏周计划推送系统 — Ethan 的专属亲子互动引擎

## 项目简介

"玩出来"是一个基于循证发展心理学设计的婴幼儿亲子游戏推荐系统，专为忙碌的父亲 Ethan 打造。系统根据宝宝的校正月龄自动计算发展阶段，推送适龄的、有科学依据的游戏方案。

## 核心功能

- **月龄自动计算**：基于出生日期和早产校正，实时计算校正月龄和发展阶段
- **工作日版推送**（周一）：5分钟晨间仪式 + 5天傍晚20分钟游戏
- **周末版推送**（周五）：周六/周日各一套完整游戏方案
- **6大发展领域覆盖**：大运动、精细运动、认知、语言、社会情感、感知觉整合
- **反馈系统**：记录游戏成果和宝宝发展观察
- **产品建议留档**：持续改进的反馈闭环
- **发展统计**：可视化宝宝的游戏参与和领域覆盖

## 理论基础

- Bowlby/Ainsworth 安全依恋理论
- Paquette 激活性依恋系统
- Piaget 感知运动期理论
- Vygotsky 最近发展区（ZPD）
- Harvard Serve & Return 模型
- RIE 尊重式育儿
- Ayres 感觉统合理论
- AAP / Zero to Three / EYFS 循证指南

## 技术栈

- 纯前端 HTML/CSS/JS（零依赖）
- localStorage 数据持久化
- GitHub Pages 部署
- 响应式设计，移动端优先

## 部署

```bash
git add .
git commit -m "deploy: peekaboo app"
git push origin main
```

GitHub Pages 会自动部署到 https://ego1013.github.io/ethanycjin/

## 文件结构

```
Peekaboo/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式
├── js/
│   ├── engine.js       # 核心引擎（月龄计算、游戏数据库、反馈系统）
│   └── app.js          # 应用逻辑（页面渲染、交互）
├── data/               # 数据目录
├── feedback/           # 反馈数据目录
└── README.md
```
