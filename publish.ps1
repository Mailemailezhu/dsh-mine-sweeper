# 发布 dsh-sweeper 到 GitHub + npm。需要已经登录 gh 和 npm（本机目前都没有）。
#   gh auth login
#   npm login --registry https://registry.npmjs.org
param(
    [string]$Repo = 'dsh-sweeper',
    [string]$Owner = 'tianyaojiudi-prog'
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$ok = $true
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Host '缺 gh CLI，装好并 gh auth login 再跑' -ForegroundColor Yellow; $ok = $false }
else { gh auth status 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { Write-Host 'gh 未登录：gh auth login' -ForegroundColor Yellow; $ok = $false } }

$who = (npm whoami --registry https://registry.npmjs.org 2>$null)
if (-not $who) { Write-Host 'npm 未登录：npm login --registry https://registry.npmjs.org' -ForegroundColor Yellow; $ok = $false }

# 本机 npm 默认走 npmmirror 镜像，那边不收发布，所以显式指定官方源。
if ($ok) {
    gh repo view "$Owner/$Repo" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        gh repo create "$Owner/$Repo" --public --source . --remote origin --description '扫雷浮层 / Minesweeper overlay for DeepSeek Harness'
    } elseif (-not (git remote get-url origin 2>$null)) {
        git remote add origin "https://github.com/$Owner/$Repo.git"
    }

    git push -u origin HEAD
    if ($LASTEXITCODE -ne 0) { throw 'git push 失败' }

    npm publish --access public --registry https://registry.npmjs.org
    if ($LASTEXITCODE -ne 0) { throw 'npm publish 失败' }

    Write-Host "`n完成：https://github.com/$Owner/$Repo" -ForegroundColor Green
    Write-Host '上架插件商店还差一步：往 awesome-dsh-plugin 提 PR 加一条条目（见 CATALOG-ENTRY.md）。'
}
