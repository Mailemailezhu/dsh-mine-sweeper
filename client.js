/* dsh-sweeper — 客户端半边。
 *
 * 注册到 shell.overlay（整帧浮层，list 插槽）：条目自己绝对定位在会话区左侧，
 * 不进 AppFrame 的 grid，所以不会挤压会话、输入框或侧栏。折叠后只剩一个 💣 按钮。
 * 全部状态都在 React 内存里：刷新或关掉服务就没了，不写盘。
 */
// Node 里跑冒烟测试时没有 window；补一个空壳只影响测试，不影响浏览器。
globalThis.window = globalThis.window || {}

window.__ModuleLoader__.load({
  id: 'dsh-sweeper',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var React = require('react')
    var h = React.createElement
    var NAME = 'dsh-sweeper'
    var SLOT = 'shell.overlay'
    var ENTRY_ID = 'sweeper'

    var CSS = [
      '.dsh-sweeper-panel{position:absolute;display:flex;flex-direction:column;border-radius:12px;',
      'background:var(--dsw-alias-bg-overlay,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.15));',
      'box-shadow:0 18px 44px rgba(0,0,0,.24);color:var(--dsw-alias-label-primary,inherit);',
      "font:12px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif;user-select:none;overflow:hidden}",
      '.dsh-sweeper-head{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));cursor:grab;touch-action:none}',
      '.dsh-sweeper-head:active{cursor:grabbing}',
      '.dsh-sweeper-title{font-weight:600;flex:1 1 auto}',
      '.dsh-sweeper-meta{color:var(--dsw-alias-label-secondary,#888);font-variant-numeric:tabular-nums}',
      '.dsh-sweeper-btn{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-1,transparent);color:inherit;border-radius:6px;height:22px;min-width:22px;padding:0 6px;cursor:pointer;font:inherit;line-height:1}',
      '.dsh-sweeper-btn:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.06))}',
      '.dsh-sweeper-cfg{display:flex;align-items:center;gap:8px;padding:8px 10px 4px}',
      '.dsh-sweeper-field{display:inline-flex;align-items:center;gap:3px;color:var(--dsw-alias-label-secondary,#888)}',
      '.dsh-sweeper-num{width:40px;height:22px;box-sizing:border-box;padding:0 4px;border-radius:6px;text-align:center;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-1,transparent);color:inherit;font:inherit}',
      '.dsh-sweeper-apply{margin-left:auto;height:24px}',
      '.dsh-sweeper-status{padding:4px 10px 8px;color:var(--dsw-alias-label-secondary,#888)}',
      '.dsh-sweeper-scroll{overflow:auto;max-height:min(60vh,600px);padding:0 10px 10px}',
      '.dsh-sweeper-board{display:grid;gap:2px;justify-content:start}',
      '.dsh-sweeper-cell{width:22px;height:22px;padding:0;border:1px solid transparent;border-radius:4px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.07));color:var(--dsw-alias-label-primary,inherit);font-size:11px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit}',
      '.dsh-sweeper-cell:hover:not([data-open]):not([data-mine]){background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.12))}',
      '.dsh-sweeper-cell[data-open]{background:transparent;border-color:var(--dsw-alias-border-l1,rgba(0,0,0,.1));cursor:default}',
      '.dsh-sweeper-cell[data-flag]{color:var(--dsw-alias-state-warn-primary,#d97706)}',
      '.dsh-sweeper-cell[data-mine]{background:var(--dsw-alias-state-error-primary,#dc2626);color:#fff}',
      '.dsh-sweeper-cell[data-n="1"]{color:#3b82f6}',
      '.dsh-sweeper-cell[data-n="2"]{color:#16a34a}',
      '.dsh-sweeper-cell[data-n="3"]{color:#dc2626}',
      '.dsh-sweeper-cell[data-n="4"]{color:#7c3aed}',
      '.dsh-sweeper-cell[data-n="5"]{color:#b45309}',
      '.dsh-sweeper-cell[data-n="6"]{color:#0891b2}',
      '.dsh-sweeper-cell[data-n="7"]{color:#db2777}',
      '.dsh-sweeper-cell[data-n="8"]{color:#4b5563}',
      '.dsh-sweeper-tab{position:absolute;width:34px;height:34px;padding:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;background:var(--dsw-alias-bg-overlay,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.15));box-shadow:0 8px 20px rgba(0,0,0,.2)}',
      '.dsh-sweeper-tab:hover{border-color:var(--dsw-alias-brand-primary,#3b82f6)}',
    ].join('\n')

    var clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

    function makeGame(rows, cols, mines) {
      const cells = []
      for (let i = 0; i < rows * cols; i++) cells.push({ mine: false, adj: 0, open: false, flag: false })
      return { rows: rows, cols: cols, mines: mines, cells: cells, status: 'ready', planted: false }
    }

    function clone(g) {
      return {
        rows: g.rows, cols: g.cols, mines: g.mines, status: g.status, planted: g.planted,
        cells: g.cells.map((c) => ({ mine: c.mine, adj: c.adj, open: c.open, flag: c.flag })),
      }
    }

    function neighbors(g, i) {
      const r = Math.floor(i / g.cols)
      const c = i % g.cols
      const out = []
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const rr = r + dr
          const cc = c + dc
          if (rr < 0 || cc < 0 || rr >= g.rows || cc >= g.cols) continue
          out.push(rr * g.cols + cc)
        }
      }
      return out
    }

    // 首点必不踩雷：布雷时排开点击格及其周围一圈。雷太多排不开时退化为只排开点击格。
    function plant(g, safe) {
      const total = g.rows * g.cols
      const blocked = {}
      blocked[safe] = true
      for (const n of neighbors(g, safe)) blocked[n] = true
      let pool = []
      for (let i = 0; i < total; i++) if (!blocked[i]) pool.push(i)
      if (pool.length < g.mines) {
        pool = []
        for (let i = 0; i < total; i++) if (i !== safe) pool.push(i)
      }
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const t = pool[i]
        pool[i] = pool[j]
        pool[j] = t
      }
      for (let k = 0; k < g.mines && k < pool.length; k++) g.cells[pool[k]].mine = true
      for (let i = 0; i < total; i++) {
        let n = 0
        for (const nb of neighbors(g, i)) if (g.cells[nb].mine) n++
        g.cells[i].adj = n
      }
      g.planted = true
      g.status = 'playing'
    }

    function isWon(g) {
      for (const c of g.cells) if (!c.mine && !c.open) return false
      return true
    }

    function reveal(g, i) {
      if (g.status === 'won' || g.status === 'lost') return g
      const cell = g.cells[i]
      if (cell.open || cell.flag) return g
      const ng = clone(g)
      if (!ng.planted) plant(ng, i)
      if (ng.cells[i].mine) {
        ng.cells[i].open = true
        ng.status = 'lost'
        return ng
      }
      const stack = [i]
      while (stack.length > 0) {
        const cur = stack.pop()
        const c = ng.cells[cur]
        if (c.open || c.flag || c.mine) continue
        c.open = true
        if (c.adj === 0) for (const nb of neighbors(ng, cur)) if (!ng.cells[nb].open) stack.push(nb)
      }
      ng.status = isWon(ng) ? 'won' : 'playing'
      return ng
    }

    function toggleFlag(g, i) {
      if (g.status === 'won' || g.status === 'lost') return g
      if (g.cells[i].open) return g
      const ng = clone(g)
      ng.cells[i].flag = !ng.cells[i].flag
      return ng
    }

    function Game() {
      // 输入框里存字符串：清空时不会先跳成 0，"新游戏" 再统一解析并夹到合法区间。
      const [cfg, setCfg] = React.useState({ rows: '9', cols: '9', mines: '10' })
      const [game, setGame] = React.useState(() => makeGame(9, 9, 10))
      const [collapsed, setCollapsed] = React.useState(false)
      const [pos, setPos] = React.useState({ left: 280, top: 84 })
      const panelRef = React.useRef(null)
      const dragRef = React.useRef(null)

      const width = Math.max(276, Math.min(game.cols * 24 + 26, 780))
      const flags = game.cells.reduce((n, c) => n + (c.flag ? 1 : 0), 0)
      const remaining = Math.max(0, game.mines - flags)

      const setField = (key) => (e) => {
        const v = String(e.target.value)
        setCfg((c) => Object.assign({}, c, { [key]: v }))
      }

      const applyCfg = () => {
        const rows = clamp(Math.round(Number(cfg.rows)) || 9, 5, 30)
        const cols = clamp(Math.round(Number(cfg.cols)) || 9, 5, 30)
        const mines = clamp(Math.round(Number(cfg.mines)) || 10, 1, rows * cols - 9)
        setCfg({ rows: String(rows), cols: String(cols), mines: String(mines) })
        setGame(makeGame(rows, cols, mines))
      }

      const restart = () => setGame(makeGame(game.rows, game.cols, game.mines))

      const onHeadDown = (e) => {
        if (e.button !== 0) return
        if (e.target && e.target.closest && e.target.closest('button')) return
        // 边界用浮层容器的尺寸算，不用 window：浮层就是会话区的可视范围。
        const host = panelRef.current ? panelRef.current.offsetParent : null
        dragRef.current = {
          x: e.clientX, y: e.clientY, left: pos.left, top: pos.top,
          w: host ? host.clientWidth : 1280,
          h: host ? host.clientHeight : 800,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
      }

      const onHeadMove = (e) => {
        const d = dragRef.current
        if (!d) return
        setPos({
          left: clamp(d.left + e.clientX - d.x, 4, Math.max(4, d.w - width - 4)),
          top: clamp(d.top + e.clientY - d.y, 4, Math.max(4, d.h - 96)),
        })
      }

      const onHeadUp = () => { dragRef.current = null }

      if (collapsed) {
        return h('button', {
          className: 'dsh-sweeper-tab',
          title: '打开扫雷',
          style: { left: pos.left + 'px', top: pos.top + 'px' },
          onClick: () => setCollapsed(false),
        }, '💣')
      }

      const statusText = game.status === 'won'
        ? '🎉 通关！'
        : game.status === 'lost'
          ? '💥 踩雷了，点 ↻ 重开'
          : game.planted ? '右击插旗' : '点一格开始（首点安全）'

      const cells = game.cells.map((c, i) => {
        const boom = game.status === 'lost' && c.mine
        const wrong = game.status === 'lost' && c.flag && !c.mine
        const label = boom ? '💣' : wrong ? '❌' : c.flag ? '🚩' : (c.open && c.adj > 0 ? String(c.adj) : '')
        return h('button', {
          key: i,
          type: 'button',
          className: 'dsh-sweeper-cell',
          'data-open': c.open && !c.mine ? '' : undefined,
          'data-mine': boom ? '' : undefined,
          'data-flag': c.flag && !wrong ? '' : undefined,
          'data-n': c.open && c.adj > 0 ? String(c.adj) : undefined,
          onContextMenu: (e) => { e.preventDefault(); setGame((g) => toggleFlag(g, i)) },
          onClick: () => setGame((g) => reveal(g, i)),
        }, label)
      })

      return h('div', {
        ref: panelRef,
        className: 'dsh-sweeper-panel',
        style: { left: pos.left + 'px', top: pos.top + 'px', width: width + 'px' },
      },
        h('div', {
          className: 'dsh-sweeper-head',
          onPointerDown: onHeadDown,
          onPointerMove: onHeadMove,
          onPointerUp: onHeadUp,
          onPointerCancel: onHeadUp,
        },
          h('span', { className: 'dsh-sweeper-title' }, '扫雷'),
          h('span', { className: 'dsh-sweeper-meta' }, '💣 ' + remaining),
          h('button', { type: 'button', className: 'dsh-sweeper-btn', title: '重开本局', onClick: restart }, '↻'),
          h('button', { type: 'button', className: 'dsh-sweeper-btn', title: '折叠', onClick: () => setCollapsed(true) }, '–'),
        ),
        h('div', { className: 'dsh-sweeper-cfg' },
          h('label', { className: 'dsh-sweeper-field' }, '行',
            h('input', { className: 'dsh-sweeper-num', type: 'number', min: 5, max: 30, value: cfg.rows, onChange: setField('rows') })),
          h('label', { className: 'dsh-sweeper-field' }, '列',
            h('input', { className: 'dsh-sweeper-num', type: 'number', min: 5, max: 30, value: cfg.cols, onChange: setField('cols') })),
          h('label', { className: 'dsh-sweeper-field' }, '雷',
            h('input', { className: 'dsh-sweeper-num', type: 'number', min: 1, max: 800, value: cfg.mines, onChange: setField('mines') })),
          h('button', { type: 'button', className: 'dsh-sweeper-btn dsh-sweeper-apply', onClick: applyCfg }, '新游戏'),
        ),
        h('div', { className: 'dsh-sweeper-status' }, statusText),
        h('div', { className: 'dsh-sweeper-scroll' },
          h('div', { className: 'dsh-sweeper-board', style: { gridTemplateColumns: 'repeat(' + game.cols + ', 22px)' } }, cells),
        ),
      )
    }

    function apply(ctx) {
      if (typeof document === 'undefined') return
      const tag = document.createElement('style')
      tag.setAttribute('data-dsh-sweeper', '')
      tag.textContent = CSS
      document.head.appendChild(tag)
      ctx.on('dispose', () => { tag.remove() })

      // inject 等 shell.overlay 被布局声明出来再挂：它属于 ui-layout，不保证先于本插件就绪。
      ctx.slots.inject(SLOT, () => ctx.slots.register(
        { name: SLOT, id: ENTRY_ID, order: 60 },
        Game,
      ))
    }

    exports.name = NAME
    exports.inject = ['slots']
    exports.apply = apply
    // 冒烟测试驱动纯逻辑用；浏览器侧不读它。
    exports.gameCore = { makeGame, clone, neighbors, plant, isWon, reveal, toggleFlag, clamp }
    return module.exports
  },
})
