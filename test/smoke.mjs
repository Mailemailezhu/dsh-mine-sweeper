import assert from 'node:assert/strict'

// client.js 是给浏览器模块加载器用的脚本：先搭出它要求的最小环境再 import。
const loads = []
globalThis.window = { __ModuleLoader__: { load: (entry) => loads.push(entry) } }
const styleTags = []
globalThis.document = {
  createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v }, remove() {}, textContent: '' }),
  head: { appendChild: (el) => styleTags.push(el) },
}

await import('../client.js')

// —— 客户端 bundle 契约 ——
assert.equal(loads.length, 1, 'client.js should register exactly one module entry')
const entry = loads[0]
assert.equal(entry.id, 'dsh-mine-sweeper', 'bundle id must equal the package name')
const mod = entry.factory((spec) => {
  assert.equal(spec, 'react')
  return {}
})
assert.equal(mod.name, 'dsh-mine-sweeper')
assert.deepEqual(mod.inject, ['slots'])

// —— apply：插到 shell.overlay，并用 ctx.on('dispose') 收拾 style 标签 ——
const registered = []
const injected = []
const disposed = []
mod.apply({
  on: (event, cb) => { if (event === 'dispose') disposed.push(cb) },
  slots: {
    inject: (slot, cb) => { injected.push(slot); cb() },
    register: (opts, component) => { registered.push({ opts, component }); return () => {} },
  },
})
assert.deepEqual(injected, ['shell.overlay'])
assert.equal(registered.length, 1)
assert.deepEqual(registered[0].opts, { name: 'shell.overlay', id: 'sweeper', order: 60 })
assert.equal(typeof registered[0].component, 'function')
assert.equal(styleTags.length, 1)
disposed[0]()
assert.match(styleTags[0].textContent, /\.dsh-mine-sweeper-panel/)

// —— 纯逻辑：布雷、首点安全、翻格、插旗、输赢 ——
const core = mod.gameCore

assert.equal(core.clamp(3, 5, 30), 5)
assert.equal(core.clamp(99, 5, 30), 30)

const empty = core.makeGame(9, 9, 10)
assert.equal(empty.cells.length, 81)
assert.equal(empty.status, 'ready')

const planted = core.makeGame(9, 9, 10)
core.plant(planted, 40)
assert.equal(planted.cells.filter((c) => c.mine).length, 10, 'exactly 10 mines')
assert.equal(planted.cells[40].mine, false, 'first click is never a mine')
for (const n of core.neighbors(planted, 40)) assert.equal(planted.cells[n].mine, false, 'first-click ring is clear')

// 雷数贴上限时退化成只排开点击格，但总数仍然准确
const dense = core.makeGame(5, 9, 36)
core.plant(dense, 22)
assert.equal(dense.cells.filter((c) => c.mine).length, 36)
assert.equal(dense.cells[22].mine, false)

const zero = planted.cells.findIndex((c) => !c.mine && c.adj === 0)
assert.ok(zero >= 0, 'a 9x9 with 10 mines has a zero cell')
const flooded = core.reveal(planted, zero)
assert.ok(flooded.cells.filter((c) => c.open).length > 1, 'zero cell floods its region')
assert.equal(flooded.status, 'playing')

const flagged = core.toggleFlag(planted, 3)
assert.equal(flagged.cells[3].flag, true)
assert.equal(core.reveal(flagged, 3), flagged, 'flagged cell stays closed')

const mineIndex = planted.cells.findIndex((c) => c.mine)
const lost = core.reveal(planted, mineIndex)
assert.equal(lost.status, 'lost')
assert.equal(lost.cells[mineIndex].open, true)
assert.equal(core.reveal(lost, zero), lost, 'board is frozen after losing')

let won = core.makeGame(5, 5, 3)
core.plant(won, 12)
for (let i = 0; i < won.cells.length; i++) if (!won.cells[i].mine) won = core.reveal(won, i)
assert.equal(won.status, 'won', 'clearing every safe cell wins')
assert.equal(core.reveal(won, 0), won, 'board is frozen after winning')

// —— Host 半边仍要能被 Node 加载 ——
const host = await import('../index.js')
assert.equal(host.name, 'dsh-mine-sweeper')
assert.equal(typeof host.apply, 'function')

console.log('smoke: ok — bundle contract, slot registration, game core, host half')
