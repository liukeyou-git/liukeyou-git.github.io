# liukeyou's Blog

我的个人博客，使用 Astro 构建。

## 📁 项目结构

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── components/
│   │   ├── animations/    # 动画组件（ParticleField / SmoothScroll / ClickSpark）
│   │   ├── auth/          # 认证组件（AuthModal）
│   │   ├── blog/          # 博客相关组件（Card3D / PostCard / PostActions …）
│   │   ├── layout/        # 布局组件（Header）
│   │   └── ui/            # UI 组件（Modal / ThemeToggle / BackToTop …）
│   ├── content/
│   │   └── blog/          # 博客文章（MDX 格式）
│   ├── contexts/          # React Context（AuthContext）
│   ├── lib/               # 工具与单例（utils / supabase / lenis-instance）
│   ├── layouts/           # 页面布局模板
│   ├── pages/             # 页面路由（含 404.astro）
│   ├── styles/            # 全局样式（global.css 主题令牌）
│   └── types/             # TypeScript 类型
├── supabase-posts.sql     # Supabase 表结构与 RLS 迁移
└── package.json
```

## 🧑‍💻 技术栈

- **框架**: Astro 7.x
- **UI 交互**: React 19
- **样式**: Tailwind CSS 4.x
- **动画**: Framer Motion + GSAP + Lenis
- **部署**: GitHub Pages

## 🎨 主题切换

支持明暗双主题，无闪烁切换：

- 首屏由 `BaseLayout.astro` 中的 inline 脚本同步应用持久化主题，避免 SSR/客户端不一致导致的闪烁。
- 主题持久化在 `localStorage('theme')`，键 `'theme'`，值 `'dark' | 'light'`；无存储值时回退到系统 `prefers-color-scheme`。
- 点击右上角 ThemeToggle 切换；Tailwind 4 主题令牌在 `@theme`（亮色默认）与 `:root.dark`（暗色覆盖）中并列声明。
- 已启用 `dark:` 变体（`@custom-variant dark`）。

## ♿ 无障碍

- **prefers-reduced-motion**：全站兜底。
  - 全局 CSS 媒体查询将动画/过渡降至瞬时。
  - Framer Motion 通过 `<MotionConfig reducedMotion="user">` 自动降级。
  - Canvas（ParticleField / ClickSpark）与 Lenis 平滑滚动在 reduced-motion 下不启动。
- 模态（登录/注册、删除确认）共享 `Modal` 组件：Esc 关闭、Tab 焦点陷阱、`role="dialog" aria-modal="true"`、焦点回归触发元素。
- 卡片聚光在键盘聚焦时通过 `:focus-within` 自动触发。

## ✨ UX 补全

- **404 页面**：`src/pages/404.astro`，使用 BaseLayout + 返回首页/博客按钮，`<meta name="robots" content="noindex">`。
- **返回顶部**：`BackToTop` 组件，滚动 >400px 淡入缩放，点击经 `lenis-instance` 平滑回顶。常驻 DOM + 内联样式切换（不依赖 Framer Motion animate 或 Tailwind 动态类，避免 HMR 下工具类未生成 / animate 不更新问题）。
- **骨架屏**：`PostCardSkeleton` 复用 PostCard 布局，加载态替代 `return null`。
- **移动端菜单动画**：`AnimatePresence` 高度展开 + `aria-expanded`/`aria-controls`/`role="region"`。
- **Header 当前页高亮**：`isPathActive` 匹配 `pathname`，激活项 `text-text-primary` + 下划线常驻 + `aria-current="page"`。

## ⚡ 性能

- **Card3D** 零重渲染：倾斜用 `useMotionValue` + `useSpring` + `useMotionTemplate`，聚光用 CSS 变量，鼠标移动不触发 React 重渲染。
- **Canvas 精简**：仅保留单一环境粒子场；ClickSpark 改按需 rAF（无点击时 CPU 占用为 0）；页面不可见时暂停 rAF。
- **ParticleField** `client:idle` 延迟启动，DPR 适配，移动端粒子数降级。

### Lenis 与原生滚动桥接

Lenis 1.x 使用内部 Emitter 派发 `scroll` 事件，**不触发 window 的 native scroll 事件**。这会导致依赖 `window.addEventListener('scroll', ...)` 的组件（如 BackToTop、Header 滚动态）在 Lenis 驱动滚动时无响应。

`SmoothScroll.tsx` 中通过一行桥接解决：

```ts
lenis.on('scroll', () => window.dispatchEvent(new Event('scroll')));
```

### 编程式滚动（lenis-instance 单例）

Lenis 的 rAF 循环会覆盖原生 `window.scrollTo`（实测 scrollY 不变）。需要编程式滚动的组件必须走 Lenis 的 `scrollTo`：

```ts
import { scrollToTop, getLenis } from '../lib/lenis-instance';

// 回顶（自动判断 Lenis 是否活跃，reduced-motion 下瞬时）
scrollToTop(reducedMotion);

// 滚动到任意位置
const lenis = getLenis();
lenis?.scrollTo(target, { offset: -80 });
```

SmoothScroll 在 init 时通过 `setLenis(lenis)` 注入实例，cleanup 时置 null。reduced-motion 下不初始化 Lenis，`getLenis()` 返回 null，`scrollToTop` 自动回退原生 `window.scrollTo`。

## 🗄️ Supabase 迁移

在 Supabase SQL Editor 中按顺序执行：

1. `supabase-posts.sql` — 创建 `posts` 表与 `post_likes` 表（点赞功能依赖 `post_likes`，含 RLS 与 `UNIQUE(post_id, user_id)` 幂等约束）。

> 若点赞功能在生产静默失败，通常是 `post_likes` 表未创建。

## ⚙️ 命令

所有命令都从项目根目录运行：

| 命令 | 说明 |
| :--- | :--- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产版本到 `./dist/` |
| `npm run preview` | 本地预览构建结果 |

## 📝 内容说明

这是一个个人博客，用于分享和记录一些内容，包括技术思考、工作复盘、工具链技巧和阅读笔记。

前端开发相关内容请访问我的 [VibeCoding](https://vibecoding.cn) 账号。