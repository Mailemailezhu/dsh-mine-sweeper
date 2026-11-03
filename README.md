# dsh-sweeper

Minesweeper overlay for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). A draggable, collapsible board floats over the left side of the conversation area — the empty strip next to the sidebar — so you can play while the agent works.

- Custom board: rows and columns 5–30, mine count 1 … rows×cols−9.
- First click is always safe (mines are planted after it, avoiding the clicked cell and its ring).
- Right-click to flag, `↻` restarts the same board, `–` collapses to a single 💣 button.
- Losing reveals every mine plus the flags that were wrong; clearing every safe cell wins.
- Nothing is persisted: state lives in React memory and is gone when you refresh or stop the service.

## Install

```sh
dsh plugin add dsh-sweeper
```

Or install the npm package `dsh-sweeper` from the plugin market, then restart `dsh web`.

## How it plugs in

The panel registers into the `shell.overlay` slot (a list slot covering the whole frame), entry id `sweeper`, order 60. It positions itself absolutely inside that layer, so it never enters the `AppFrame` grid and never pushes the sidebar, conversation or composer around.

The host half (`index.js`) is intentionally empty: everything lives in the browser bundle (`client.js`). `cordis.patch.yml` exists so the package can be installed as a bundle.

## Requirements

- DeepSeek Harness `>= 0.1.5-rc.2 < 0.3.0`
- Node.js >= 18

## Development

```sh
npm run check   # node --check on both halves
npm test        # bundle contract + game core smoke test
```

## License

MIT
