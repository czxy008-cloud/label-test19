# 电子发票管理器

基于 Electron + React 的电子发票归档与管理桌面应用。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5
- **构建工具**: Vite + vite-plugin-electron
- **桌面框架**: Electron 31
- **数据库**: better-sqlite3
- **图表库**: Recharts
- **PDF解析**: pdf-parse
- **Excel导出**: SheetJS (xlsx)

## 功能特性

1. **发票录入**: 支持PDF上传自动解析关键字段，或手动录入
2. **分类管理**: 自定义发票类别（餐饮、交通、办公等），支持颜色标记
3. **高级检索**: 多条件组合筛选、模糊搜索、金额范围筛选
4. **数据统计**: 按月/季度展示支出饼图与趋势折线图
5. **数据导出**: 支持将筛选结果导出为CSV或Excel格式
6. **主题切换**: 支持浅色/深色主题切换
7. **系统托盘**: 窗口最小化至托盘运行

## 项目结构

```
├── electron/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts   # 主进程入口
│   │   ├── window.ts  # 窗口管理
│   │   ├── tray.ts    # 托盘管理
│   │   ├── db.ts      # 数据库模块
│   │   └── ipc.ts     # IPC通信处理
│   └── preload/       # 预加载脚本
│       └── index.ts   # 暴露API给渲染进程
├── src/               # React 前端代码
│   ├── layouts/       # 布局组件
│   ├── pages/         # 页面组件
│   ├── theme/         # 主题配置
│   ├── types/         # TypeScript 类型定义
│   ├── App.tsx        # 主应用组件
│   ├── main.tsx       # React 入口
│   └── index.css      # 全局样式
├── index.html         # HTML 模板
├── package.json       # 项目配置
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置
└── .gitignore         # Git 忽略文件
```

## 安装与运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行已构建的应用

```bash
npm start
```

## 数据库

应用使用 SQLite 本地数据库，数据库文件存储位置：
- Windows: `%APPDATA%/electron-invoice-manager/invoices.db`

数据库会在首次运行时自动创建，并初始化默认分类。

## 许可证

MIT
