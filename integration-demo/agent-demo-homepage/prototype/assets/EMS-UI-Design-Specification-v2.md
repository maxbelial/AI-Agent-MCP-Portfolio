# EMS 2.0 UI Design Specification v2

> **适用范围**：EMS 系统所有管理后台页面的 UI 改造
> **设计风格**：Business Clean — 干净、专业、信息密度适中
> **基准文件**：`ems-v2-common.css` + 各页面 `*-v2.html`
> **版本**：v2.2 · 2026-05-04

---

## 0. 工程结构

```
ems-v2-ui/
├── ems-v2-common.css                 # 共享 Design Tokens + 布局 + 通用组件样式
├── EMS-UI-Design-Specification-v2.md # 本文档
├── README.md                         # 项目说明
│
│  ── 工作台 ──
├── workspace-v2.html                 # 工作台（大屏仪表盘 + ECharts 图表 + 拖拽编辑）
│
│  ── 组织管理 ──
├── tenant-management-v2.html         # 租户管理（tree + table + 编辑弹窗）
├── product-management-v2.html        # 产品管理（简单列表页）
├── license-management-v2.html        # 授权管理（tree + table + stepper + 历史弹窗）
│
│  ── 权限管理 ──
├── role-management-v2.html           # 角色管理（表格 + 权限配置弹窗）
├── org-structure-v2.html             # 组织架构（组织树 + 表格）
│
│  ── 系统设置 ──
├── personal-info-v2.html             # 个人信息（表单页 + 安全评分条）
├── third-party-v2.html               # 三方对接（tree + table，启用/停用操作）
├── sync-management-v2.html           # 同步管理（全页表单 + 数据表格）
├── general-settings-v2.html          # 通用设置（tree + 5-tab 配置面板 + sticky 保存栏）
├── ai-settings-v2.html               # AI访问设置（tree + 配置表单 + token 消耗表 + sticky 保存栏）
│
│  ── ITOM 模块 ──
├── alert-center-v2.html              # 告警中心（统计卡片 + 告警表格 + AI 根因分析抽屉）
│
│  ── AI 管理 ──
└── ai-management-v2.html             # Agent Hub（模型配置 + Token 预算 + Agent 卡片 + MCP 工具表）
```

**页面总览（13 个页面）**：

| # | 页面 | 布局模式 | 核心组件 |
|---|------|----------|----------|
| 0 | 工作台 | 大屏仪表盘 | ECharts 图表、卡片布局、拖拽编辑模式 |
| 1 | 租户管理 | tree + table | 树面板、摘要栏、Tab-Toolbar、编辑弹窗 |
| 2 | 产品管理 | 简单列表 | Tab 栏、工具栏、数据表格、分页 |
| 3 | 授权管理 | tree + table | 树面板、可展开行、Stepper 弹窗、历史弹窗 |
| 4 | 角色管理 | 简单列表 | 数据表格、权限配置弹窗 |
| 5 | 组织架构 | tree + table | 组织树、成员表格 |
| 6 | 个人信息 | 表单页 | 信息表单、头像上传、安全评分条 |
| 7 | 三方对接 | tree + table | 树面板、对接渠道表格、启用/停用 |
| 8 | 同步管理 | 全页表单 + table | 配置表单、同步任务表格 |
| 9 | 通用设置 | tree + tabs + form | 树面板、5-Tab 切换、配置表单、sticky 保存栏 |
| 10 | AI访问设置 | tree + form + table | 多级树、配置表单、Token 消耗表、sticky 保存栏 |
| 11 | 告警中心 | 统计卡片 + table + drawer | 告警统计、筛选工具栏、告警表格、AI 分析抽屉 |
| 12 | Agent Hub | 统计卡片 + 卡片网格 + table | 模型配置表、Token 预算、Agent 卡片、MCP 工具表 |

**开发规范**：
- 所有页面通过 `<link rel="stylesheet" href="ems-v2-common.css">` 引入共享样式
- 页面 `<style>` 中仅写该页面独有的组件样式
- 新增页面后需手动更新所有页面的侧边栏菜单 HTML
- 菜单结构在各页面的 `<aside class="sidebar">` 中维护

---

## 1. Design Tokens（CSS 变量）

所有颜色、尺寸、阴影等均通过 CSS 变量定义在 `:root` 中，**禁止在组件中硬编码色值**。

### 1.1 品牌色（Brand）

| 变量 | 色值 | 用途 |
|------|------|------|
| `--c-primary` | `#2563EB` | 主按钮、选中态、高亮链接 |
| `--c-primary-hover` | `#3B82F6` | 主色 hover 态 |
| `--c-primary-active` | `#1D4ED8` | 主色 active / pressed 态 |
| `--c-primary-bg` | `#EFF6FF` | 主色浅底（选中行、active sidebar） |
| `--c-primary-border` | `#93C5FD` | 主色边框（SKU tag 等） |

### 1.2 语义色（Semantic）

| 变量 | 色值 | 用途 |
|------|------|------|
| `--c-success` | `#10B981` | 正常/正式/启用 |
| `--c-success-bg` | `#ECFDF5` | 成功浅底 |
| `--c-success-border` | `#6EE7B7` | 成功边框 |
| `--c-warning` | `#F59E0B` | POC/停用/警告 |
| `--c-warning-bg` | `#FFFBEB` | 警告浅底 |
| `--c-warning-border` | `#FCD34D` | 警告边框 |
| `--c-danger` | `#EF4444` | 删除/过期/错误 |
| `--c-danger-bg` | `#FEF2F2` | 危险浅底 |
| `--c-danger-border` | `#FCA5A5` | 危险边框 |

### 1.3 中性色（Neutral）

| 变量 | 色值 | 用途 |
|------|------|------|
| `--c-text-1` | `#111827` | 一级文字（标题、重要内容） |
| `--c-text-2` | `#6B7280` | 二级文字（正文、表格内容） |
| `--c-text-3` | `#9CA3AF` | 三级文字（标签、辅助信息） |
| `--c-text-4` | `#D1D5DB` | 四级文字（placeholder、禁用态） |
| `--c-border` | `#E5E7EB` | 主边框 |
| `--c-border-light` | `#F3F4F6` | 浅边框（表格行分割线） |
| `--c-fill-1` | `#F9FAFB` | 一级填充（表头、hover 行） |
| `--c-fill-2` | `#F3F4F6` | 二级填充（avatar 背景） |
| `--c-bg` | `#F5F7FA` | 页面底色 |
| `--c-white` | `#FFFFFF` | 白色 |

### 1.4 布局变量

| 变量 | 值 | 说明 |
|------|-----|------|
| `--sidebar-w` | `200px` | 侧边栏宽度 |
| `--header-h` | `48px` | 顶栏高度 |

### 1.5 阴影（Shadow）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | 卡片微阴影 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` | 弹窗 |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.12)` | 大弹窗 |

### 1.6 圆角（Radius）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--r-sm` | `4px` | 小元素（分页按钮、tag） |
| `--r-md` | `6px` | 中等元素（按钮、输入框、logo-icon） |
| `--r-lg` | `8px` | 大元素（卡片、表格容器） |
| `--r-xl` | `12px` | 弹窗 |

### 1.7 动画缓动

| 变量 | 值 |
|------|-----|
| `--ease` | `cubic-bezier(.4, 0, .2, 1)` |

---

## 2. 全局基础（Global Reset）

```css
*, *::before, *::after {
    margin: 0; padding: 0; box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: var(--c-bg);
    color: var(--c-text-2);
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
}
```

**字体引入**（放在 `<head>` 中）：
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**滚动条**：6px 宽度，圆角 3px，轨道透明，滑块 `--c-text-4`，hover `--c-text-3`。

**链接**：默认 `--c-primary`，hover `--c-primary-hover`，无下划线。

---

## 3. 页面骨架（Layout）

整体为三栏布局：**固定顶栏 + 固定侧栏 + 滚动主内容区**。

```
┌─────────────────────────────────────────────┐
│  Header (fixed, z:100, h:48px)              │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Main Content                    │
│ (fixed,  │  (absolute, top:48, left:200)    │
│  w:200)  │                                  │
│  z:90    │  ┌─ page-title-bar ─────────────┐│
│          │  │ 页面标题 (18px bold)          ││
│          │  ├─ tab-bar ────────────────────┤│
│          │  │ Tab1 | Tab2 | Tab3           ││
│          │  ├─ content / content-layout ───┤│
│          │  │ [可选:Tree] + 右侧表格内容    ││
│          │  ├─ footer ─────────────────────┤│
│          │  │ EMS v0.x.x | 日期时间        ││
│          │  └──────────────────────────────┘│
└──────────┴──────────────────────────────────┘
```

---

## 4. Header 顶栏

### 结构
```html
<div class="header">
    <div class="logo">
        <img src="../archive/itom-logo.png" alt="EMS" style="height:28px;border-radius:var(--r-md)">
    </div>
    <div class="user-area">
        <div class="user-avatar">A</div>
        <span>admin</span>
        <svg><!-- 下拉箭头 --></svg>
    </div>
</div>
```

### 样式规格

| 属性 | 值 |
|------|-----|
| 高度 | `48px`（`var(--header-h)`） |
| 背景 | `var(--c-white)` |
| 下边框 | `1px solid var(--c-border)` |
| 定位 | `fixed, top:0, left:0, right:0, z-index:100` |
| 布局 | `flex, align-items:center, justify-content:space-between, padding:0 20px` |

### Logo
- 使用 `<img>` 标签，高度 28px，圆角 `var(--r-md)`

### User Area
- 圆形 avatar：28×28px，`border-radius:50%`，背景 `var(--c-fill-2)`，1px 边框
- 文字：13px，颜色 `var(--c-text-2)`
- 容器：`padding:6px 12px`，`border-radius:20px`（胶囊形），hover 背景 `var(--c-fill-2)`

---

## 5. Sidebar 侧边栏

### 结构
```html
<div class="sidebar">
    <div class="sidebar-item">
        <span class="icon"><svg><!-- 工作台图标 --></svg></span>
        工作台
    </div>
    <div class="sidebar-group">组织管理</div>
    <a class="sidebar-item [active]" style="padding-left:44px;" href="xxx-v2.html">菜单项</a>
    ...
    <div class="org-switcher">
        <div class="org-avatar">J</div>
        <div class="org-info">
            <div class="org-name">JGDemo</div>
        </div>
    </div>
</div>
```

### 样式规格

| 属性 | 值 |
|------|-----|
| 定位 | `fixed, top:var(--header-h), left:0, z-index:90` |
| 宽度 | `var(--sidebar-w)` = 200px |
| 高度 | `calc(100vh - var(--header-h))` |
| 背景 | `var(--c-white)` |
| 右边框 | `1px solid var(--c-border)` |
| 内边距 | `12px 0` |
| 溢出 | `overflow-y:auto` |

### Sidebar Group（分组标题）
- `padding:8px 20px 4px`, `font-size:11px`, 颜色 `--c-text-3`
- `text-transform:uppercase`, `letter-spacing:.5px`, `font-weight:600`
- 首个 group `margin-top:0`，其余 `margin-top:8px`

### Sidebar Item（菜单项）
- `padding:10px 20px`（子菜单 `padding-left:44px`），`font-size:13px`
- 默认颜色 `--c-text-1`
- Hover：背景 `var(--c-fill-1)`
- Active：颜色 `--c-primary`，背景 `--c-primary-bg`，**右侧 2px 实线指示条** `border-right:2px solid var(--c-primary)`，`font-weight:500`
- 图标区 `.icon`：16px，SVG stroke 样式，`stroke-width:1.5`
- 使用 `<a>` 标签实现跳转（href 指向同目录下 `-v2.html` 文件），当前页用 `<div>` + `.active`

### Org Switcher（底部组织切换器）
- `margin-top:auto`（推到底部），高度 52px
- 上边框 `1px solid var(--c-border-light)`
- Avatar：28×28px，`border-radius:var(--r-md)`，背景 `--c-fill-2`
- 组织名：13px，`font-weight:600`，颜色 `--c-text-1`

### 完整菜单结构

```
工作台 (icon)
[组织管理]
  租户管理 → tenant-management-v2.html
  产品管理 → product-management-v2.html
  授权管理 → license-management-v2.html
[权限管理]
  角色管理 → role-management-v2.html
  组织架构 → org-structure-v2.html
[系统设置]
  个人信息 → personal-info-v2.html
  三方对接 → third-party-v2.html
  同步管理 → sync-management-v2.html
  通用设置 → general-settings-v2.html
  AI访问设置 → ai-settings-v2.html
---
[Org Switcher: JGDemo]
```

---

## 6. Main 主内容区

### 6.1 容器
```css
.main {
    position: absolute;
    top: var(--header-h);
    left: var(--sidebar-w);
    right: 0;
    bottom: 0;
    overflow: auto;
    background: var(--c-bg);
}
.main-inner {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 0;
}
```

### 6.2 Page Title Bar
```html
<div class="page-title-bar">
    <h1>页面标题</h1>
</div>
```
- `padding:16px 20px`（无 Tab 时加 bottom `16px`），背景白色
- H1: `font-size:18px`, `font-weight:700`, `color:var(--c-text-1)`

### 6.3 Tab Bar（页签栏）
```html
<div class="tab-bar">
    <div class="tab-item active">Tab 1</div>
    <div class="tab-item">Tab 2</div>
</div>
```
- 各 tab-item `flex:1, text-align:center`（**均分宽度**）
- `padding:12px 20px`, `font-size:14px`, `font-weight:500`
- Active：颜色 `--c-primary`，`font-weight:600`，底部 **2px 实线** `border-bottom-color:var(--c-primary)`
- 整栏 `border-bottom:1px solid var(--c-border)`，背景白色，`margin-bottom:12px`

> **变体：Tab + Toolbar 合并行**（租户管理用）
> ```html
> <div class="tab-toolbar">
>     <div class="tab-toolbar-left">
>         <div class="tab-item active">Tab 1</div>
>         <div class="tab-item">Tab 2</div>
>     </div>
>     <div class="tab-toolbar-right">
>         <button class="btn btn-primary">添加</button>
>         <div class="search-wrap">...</div>
>     </div>
> </div>
> ```
> Tab 左对齐，工具栏右对齐，`padding:0 24px`。

---

## 7. 通用组件

### 7.1 Button 按钮

```html
<button class="btn">默认按钮</button>
<button class="btn btn-primary">主操作</button>
<button class="btn btn-sm">小按钮</button>
```

| 属性 | 默认 | 主操作 `.btn-primary` |
|------|------|----------------------|
| 高度 | 32px | 32px |
| 内边距 | `0 16px` | `0 16px` |
| 圆角 | `var(--r-md)` | `var(--r-md)` |
| 字号 | 13px | 13px |
| 字重 | 500 | 500 |
| 背景 | `var(--c-white)` | `var(--c-primary)` |
| 文字色 | `var(--c-text-1)` | `#fff` |
| 边框 | `1px solid var(--c-border)` | `1px solid var(--c-primary)` |
| Hover 背景 | `var(--c-fill-1)` | `var(--c-primary-hover)` |

**小按钮** `.btn-sm`：高度 28px，`padding:0 12px`，`font-size:12px`。

**图标按钮** `.btn-icon`：32×32px 正方形，居中显示 SVG（14×14），默认边框，hover 变 primary。

### 7.2 Search 搜索框

```html
<div class="search-wrap">
    <span class="search-icon"><svg><!-- 搜索图标 --></svg></span>
    <input type="text" placeholder="请输入...">
</div>
```

- 输入框 `padding:6px 12px 6px 32px`（左侧留出图标空间）
- 宽度 200~220px
- 边框 `1px solid var(--c-border)`，圆角 `var(--r-md)`
- Focus 态：`border-color:var(--c-primary)`，可选 `box-shadow:0 0 0 3px rgba(37,99,235,.1)`
- 图标：绝对定位 left 10px，14×14px，stroke `--c-text-3`

### 7.3 Data Table 数据表格

```html
<div class="table-card">
    <div class="table-card-scroll">
        <table class="data-table">
            <thead>
                <tr><th>列标题</th>...</tr>
            </thead>
            <tbody>
                <tr><td>内容</td>...</tr>
            </tbody>
        </table>
    </div>
    <div class="pagination">...</div>
</div>
```

#### 表格容器 `.table-card`
- 可选：`border:1px solid var(--c-border)`, `border-radius:var(--r-lg)`, `box-shadow:var(--shadow-sm)`
- 或直接白色背景无边框（取决于布局是否有外层白色容器）

#### 表头 `th`
- 背景 `var(--c-fill-1)`
- `padding:10px 14px`, `font-size:11px`, `font-weight:600`
- 颜色 `var(--c-text-3)`
- `text-transform:uppercase`, `letter-spacing:.3px`
- 底部 `border-bottom:1px solid var(--c-border)`

#### 表格单元格 `td`
- `padding:12px 14px`, `font-size:13px`, 颜色 `var(--c-text-2)`
- 行分割线 `border-bottom:1px solid var(--c-border-light)`
- 行 hover：`background:var(--c-fill-1)` 或 `rgba(37,99,235,.02)`

#### Operation Links（操作列）
```html
<div class="op-links">
    <button class="op-link">编辑</button>
    <button class="op-link op-link-danger">删除</button>
    <button class="op-link op-link-warn">停用</button>
</div>
```
- 无边框无背景，13px，颜色 `--c-primary`，hover 下划线
- `.op-link-danger`：`--c-danger`
- `.op-link-warn`：`--c-warning`
- `.op-link-success`：`--c-success`（如「启用」「转正式」）
- 间距 `gap:12px`（或用分隔线 `.op-sep`）

### 7.4 Pagination 分页

```html
<div class="pagination">
    <div>共 <strong>N</strong> 条</div>
    <div class="pagination-right">
        <select class="pg-select">
            <option>15 条/页</option>
            <option>30 条/页</option>
        </select>
        <button class="pg-btn" disabled>‹</button>
        <button class="pg-btn is-active">1</button>
        <button class="pg-btn" disabled>›</button>
    </div>
</div>
```

- 两端对齐（`justify-content:space-between`），`padding:12px 16px`
- 上边框分隔：`border-top:1px solid var(--c-border-light)`
- 字号 13px，颜色 `--c-text-3`
- 间距 `gap:8px`
- 页码按钮 `.pg-btn`：28×28px，`border-radius:var(--r-sm)`
- Active 页码：`background:var(--c-primary)`, `color:#fff`
- Disabled：`opacity:.5`, `cursor:not-allowed`
- 每页选择器 `.pg-select`：12px，自定义箭头 SVG（`appearance:none`）
- **不包含"前往X页"跳转输入框**（EMS 数据量小，通常不超过一页）

### 7.5 Status Badge 状态徽标

```html
<span class="status-badge active">已激活</span>
<span class="status-badge trial">试用</span>
<span class="status-badge expired">已过期</span>
```
- 胶囊形：`border-radius:12px`, `padding:3px 10px`, `font-size:11px`, `font-weight:600`
- 带圆点：`::before` 伪元素 6×6px 圆，颜色同文字
- `.active`：success 色系；`.trial`：primary 色系；`.expired`：danger 色系

**简单状态**（表格内）也可用内联写法：
```html
<span style="color:var(--c-success)">● 正常</span>
```

### 7.6 Tag 标签

```html
<span class="tag tag-msp">MSP</span>
<span class="feat-tag on">✓ 已开</span>
<span class="feat-tag off">✗ 未开</span>
```
- 基础 tag：`padding:1px 6px`, `border-radius:3px`, `font-size:10px`, `font-weight:600`
- Feature tag `.feat-tag`：`padding:2px 8px`, `border-radius:4px`, `font-size:11px`
  - `.on`：success 色系带 border
  - `.off`：fill-1 底色，text-4 文字

### 7.7 Modal 弹窗

```html
<div class="modal-overlay [visible/is-open]">
    <div class="modal-box / modal">
        <div class="modal-header">
            <h3>弹窗标题</h3>
            <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
            <!-- 表单内容 -->
        </div>
        <div class="modal-footer">
            <button class="btn">取消</button>
            <button class="btn btn-primary">保存</button>
        </div>
    </div>
</div>
```

| 属性 | 值 |
|------|-----|
| Overlay | `rgba(0,0,0,.4)`, 可选 `backdrop-filter:blur(4px)` |
| 弹窗面板 | `border-radius:var(--r-xl)`, `box-shadow:var(--shadow-lg)` |
| 标题 | 16px, `font-weight:700` |
| Header padding | `20px 24px` |
| Body padding | `24px` |
| Footer | flex, `justify-content:flex-end`, `gap:10px`, 上边框 |
| 动画 | fadeIn + slideUp (translateY 16px → 0) |

### 7.8 Form 表单

```html
<div class="form-row">
    <label class="form-label"><span class="req">*</span> 字段名</label>
    <div class="form-control">
        <input class="form-input" type="text" placeholder="请输入">
        <div class="form-hint">说明文字</div>
    </div>
</div>
```

| 元素 | 规格 |
|------|------|
| `.form-label` | 宽 90px, 右对齐, 13px, `--c-text-2`, `line-height:34px` |
| `.form-input` | 高 34px, `padding:0 12px`, 圆角 `--r-md`, focus 带蓝色光晕 |
| `.form-select` | 同 form-input |
| `.form-hint` | 12px, `--c-text-3`, `margin-top:6px` |
| 必填标记 `.req` | `color:var(--c-danger)` |
| 行间距 | `margin-bottom:20px` |

---

## 8. 复合布局模式

### 8.1 简单列表页（产品管理）

最简模式，适用于无左侧树的列表：

```
page-title-bar → tab-bar → content (toolbar + table + pagination)
```

- `.content`：`padding:16px 20px`, 白色背景

### 8.2 树 + 表格页（租户管理、授权管理）

左侧树面板 + 右侧内容区：

```
page-title-bar → content-layout
                  ├── tree-panel (220~240px)
                  └── right-content (flex:1)
```

#### Tree Panel
- 宽度 220~240px，`flex-shrink:0`，白色背景
- 右边框 `1px solid var(--c-border)`
- `margin-left:12px`（给予与左侧栏的间距）
- 内部结构：header + search + tree-body

#### Tree Node
- `padding:6px 8px 6px 24px`（子节点缩进 `padding-left` 根据层级递增 16px）
- `font-size:13px`, `border-radius:var(--r-sm)`
- Active：`background:var(--c-primary-bg)`, `color:var(--c-primary)`, `font-weight:500~600`

#### Tree Node Avatar（头像规则）

所有树面板节点使用 20×20px 首字母头像，统一灰底灰字+边框：

```css
.node-avatar {
  width: 20px; height: 20px;
  border-radius: var(--r-sm);           /* 方形（默认） */
  font-size: 9px; font-weight: 600;
  color: var(--c-text-3);
  background: var(--c-fill-2) !important; /* 覆盖任何内联样式 */
  border: 1px solid var(--c-border);
}
```

**形状规则**：
| 租户类型 | 头像形状 | CSS |
|---------|---------|-----|
| 平台管理员 / MSP | **方形** | `border-radius: var(--r-sm)` （默认） |
| 最终用户（Enduser） | **圆形** | `.node-avatar.is-enduser { border-radius: 50% !important; }` |

- JS 渲染时根据 `type === 'Enduser'` 给 avatar 追加 `is-enduser` class
- Active 状态下头像文字变为 `color: var(--c-primary)`

#### Tree Org Title（一级节点 / 父节点）
- 12px, `font-weight:600`, `--c-text-3`, `text-transform:uppercase`
- 带展开箭头，旋转 90° 表示展开
- 可选 count badge（`--c-fill-2` 底色）

### 8.3 Summary Bar + Tab-Toolbar（租户管理详情）

位于右侧内容区顶部，显示选中项的摘要信息+操作：

```
tenant-summary → tab-toolbar → table-area
```

### 8.4 可展开行（授权管理）

表格行支持点击展开显示详情：

```html
<tr><!-- 主行 --></tr>
<tr class="expand-row">
    <td colspan="N">
        <div class="expand-content [is-open]">
            <!-- 详细信息 -->
        </div>
    </td>
</tr>
```

- 展开按钮 `.expand-btn`：22×22px，箭头旋转 90° 表示展开
- 展开内容背景 `--c-fill-1`
- `max-height` 动画实现展开/折叠

### 8.5 表单页（个人信息）

无左侧树，纯表单布局：

```
page-header → content (info-section + security-bar)
```

- `.info-section`：白色卡片，`padding:24px`，`border-bottom` 分隔
- 头像上传区：80×80px 圆形，dashed 边框，hover 变 primary
- 安全评分条：三段等宽（`flex:1`），高度 6px，`border-radius:3px`
  - 已完成段：`background:var(--c-success)`
  - 未完成段：`background:var(--c-fill-2)`

### 8.6 树 + Tab 配置页（通用设置）

左侧租户树 + 右侧多 Tab 配置面板 + 底部 sticky 保存栏：

```
page-header → content-layout
                ├── tree-panel (240px)
                └── right-content
                    ├── settings-tab-bar (邮件网关|短信网关|企业微信|钉钉|账号安全)
                    ├── settings-panel (active tab 的表单)
                    └── save-bar (sticky, bottom:0)
```

- Tab 栏 `.settings-tab-bar`：左对齐（非均分），`border-bottom`，每个 tab `padding:12px 24px`
- Active tab：`color:--c-primary`，`font-weight:600`，底部 2px 蓝色指示线
- 表单面板 `.settings-panel`：`padding:24px`，一次只显示一个
- 密码字段带 `.password-toggle`（眼睛图标）切换明文/密文

### 8.7 树 + 配置表单 + 数据表页（AI访问设置）

左侧多级树 + 右侧配置表单 + Token 消耗表：

```
page-header → content-layout
                ├── tree-panel (240px, 多级树)
                └── right-content
                    ├── config-section (AI开关 + 基础配置)
                    ├── config-section (头像/浮标配置)
                    ├── token-section (Token 消耗表)
                    └── save-bar (sticky, bottom:0)
```

- 多级树支持递归渲染，`padding-left` 按 `10 + level * 16` 递增
- AI 开关 `.toggle-track`：40×22px，圆角 11px，带滑块动画
- 预览框 `.preview-box`：80×80px，dashed 边框，支持图片上传

### 8.8 全页表单 + 表格页（同步管理）

无左侧树，上方为配置表单，下方为数据表格：

```
page-header → content
                ├── form-section (同步配置表单)
                └── table-section (同步任务列表)
```

- 表单与表格在同一白色容器内
- 表格含状态列（成功/失败）和操作列（编辑/立即同步/删除）

### 8.9 Save Bar（保存按钮栏）

用于配置类页面（通用设置、AI访问设置），始终可见于首屏：

```css
.save-bar {
  position: sticky;
  bottom: 0;
  margin-left: 12px;     /* 与 tree-panel margin-left 保持一致 */
  padding: 12px 24px;
  background: var(--c-white);
  border-top: 1px solid var(--c-border);
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}
```

- `position:sticky` + `bottom:0` 确保在 13 寸屏首屏即可见，滚动后自然跟随
- `margin-left:12px` 与租户列表左侧间距一致
- 放在 `content-layout` 之后、`footer` 之前

---

## 9. Toolbar 工具栏

位于表格上方，左右两端对齐：

```html
<div class="toolbar">
    <div class="toolbar-left">
        <button class="btn btn-primary">+ 新建</button>
        <button class="btn">导出</button>
    </div>
    <div class="search-wrap">
        <span class="search-icon">...</span>
        <input type="text" placeholder="搜索...">
    </div>
</div>
```

- `margin-bottom:16px`
- 主操作按钮在左侧，搜索框在右侧

---

## 10. Footer 页脚

```html
<div class="footer">EMS v0.2.1-xxxx | 2026-04-28 08:47:54</div>
```

- `text-align:center`, `font-size:11px`, `color:var(--c-text-4)`
- `margin-top:auto`（推到底部），`padding:20px 0 12px`

---

## 11. 响应式 & 滚动

- **当前版本不做移动端适配**，最小宽度约 1024px
- 主内容区 `.main` 自身滚动（`overflow:auto`）
- Header 和 Sidebar 固定不动
- 表格横向溢出用 `.table-card-scroll` + `overflow-x:auto`

---

## 12. 新页面开发 Checklist

开发新 EMS 页面时，按照以下步骤：

1. **复制模板**：从 `product-management-v2.html`（最简页面）开始复制
2. **修改标题**：更新 `<title>` 和 `.page-header h1`
3. **更新菜单**：在所有页面的 `<aside class="sidebar">` 中添加新页面菜单条目
4. **验证导航**：确保新页面与其他页面的侧栏菜单互相跳转正确
5. **选择布局**：根据页面类型选择布局模式（见第 8 节）
6. **填充内容**：使用上述组件样式规格搭建主内容区
7. **树面板头像**：如有租户树，注意 avatar 形状规则（方形 vs 圆形）
8. **添加 Footer**：使用统一版本号格式
9. **验证跳转**：打开浏览器检查所有菜单跳转链接是否正确

---

## 13. CSS 变量完整拷贝模板

以下为开发新页面时直接拷贝使用的完整 `:root` 块：

```css
:root {
    /* Brand — EMS 2.0 Design System */
    --c-primary: #2563EB;
    --c-primary-hover: #3B82F6;
    --c-primary-active: #1D4ED8;
    --c-primary-bg: #EFF6FF;
    --c-primary-border: #93C5FD;
    /* Semantic */
    --c-success: #10B981;
    --c-success-bg: #ECFDF5;
    --c-success-border: #6EE7B7;
    --c-warning: #F59E0B;
    --c-warning-bg: #FFFBEB;
    --c-warning-border: #FCD34D;
    --c-danger: #EF4444;
    --c-danger-bg: #FEF2F2;
    --c-danger-border: #FCA5A5;
    /* Neutral */
    --c-text-1: #111827;
    --c-text-2: #6B7280;
    --c-text-3: #9CA3AF;
    --c-text-4: #D1D5DB;
    --c-border: #E5E7EB;
    --c-border-light: #F3F4F6;
    --c-fill-1: #F9FAFB;
    --c-fill-2: #F3F4F6;
    --c-bg: #F5F7FA;
    --c-white: #FFFFFF;
    /* Layout */
    --sidebar-w: 200px;
    --header-h: 48px;
    /* Shadow */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);
    --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
    /* Radius */
    --r-sm: 4px;
    --r-md: 6px;
    --r-lg: 8px;
    --r-xl: 12px;
    /* Transition */
    --ease: cubic-bezier(.4, 0, .2, 1);
}
```

---

## 14. SVG 图标约定

- 统一使用 **stroke 风格**（outline/line icon），不用 fill 风格
- 默认属性：`stroke:currentColor`, `fill:none`, `stroke-width:1.5`, `stroke-linecap:round`, `stroke-linejoin:round`
- 尺寸：侧栏导航 16×16，按钮内 14×14，页面图标 20×20
- 搜索图标统一：circle cx=11 cy=11 r=8 + line (21,21)→(16.65,16.65)，stroke-width:2
- 下拉箭头：`<path d="M6 9l6 6 6-6"/>`, 12×12

---

## 15. 配色速查表

| 场景 | 文字色 | 背景色 | 边框色 |
|------|--------|--------|--------|
| 正常/正式 | `--c-success` | `--c-success-bg` | `--c-success-border` |
| POC/试用 | `#3B82F6` | `--c-primary-bg` | — |
| 警告/停用 | `--c-warning` | `--c-warning-bg` | `--c-warning-border` |
| 错误/过期/删除 | `--c-danger` | `--c-danger-bg` | `--c-danger-border` |
| MSP 标签 | `#1D4ED8` | `#DBEAFE` | — |
| 选中/Active | `--c-primary` | `--c-primary-bg` | `--c-primary-border` |
