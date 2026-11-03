/**
 * dsh-sweeper — Host 半边。
 *
 * 这个插件全部逻辑都在浏览器里（client.js），Host 侧只留一个空壳：
 * cordis.patch.yml 的插件行需要一个能被 Node 侧加载的包，而 package.json 的
 * dsh.client 会另外把 client.js 注册成 Web 插件表的一行。没有空壳，安装流程
 * 会认为这个包没有任何 Host 贡献而报错。
 */
export const name = 'dsh-sweeper'

export function apply() {}
