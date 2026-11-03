# dsh-mine-sweeper

DeepSeek Harness 的扫雷浮层。一块可拖动、可折叠的棋盘悬浮在会话区左侧那条空白里，agent 干活的时候顺手玩。

- 自定义棋盘：行、列 5–30，雷数 1 … 行×列−9。
- 首点必安全：雷在你点下第一格之后才布，且避开这一格和它周围一圈。
- 右击插旗，`↻` 重开同一块盘，`–` 折叠成一个 💣 按钮。
- 踩雷会亮出全部雷和被标错的旗；把所有非雷格翻完就通关。
- 不写盘：状态只在 React 内存里，刷新页面或停掉服务就清空。

## 安装

```sh
dsh plugin add dsh-mine-sweeper
```

或者从插件市场装 npm 包 `dsh-mine-sweeper`，然后重启 `dsh web`。

## 接在哪

面板注册进 `shell.overlay` 插槽（整帧浮层，list 类型），条目 id `sweeper`，order 60。它在这层里自己绝对定位，所以不进 `AppFrame` 的 grid，不会挤动侧栏、会话和输入框。

Host 半边（`index.js`）是故意留空的：全部逻辑在浏览器包 `client.js` 里。`cordis.patch.yml` 让它能以 bundle 形式安装。

## 环境要求

- DeepSeek Harness `>= 0.1.5-rc.2 < 0.3.0`
- Node.js >= 18

## 开发

```sh
npm run check   # 两个半边的语法检查
npm test        # bundle 契约 + 游戏核心的冒烟测试
```

## License

MIT
