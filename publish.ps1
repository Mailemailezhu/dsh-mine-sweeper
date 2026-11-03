# 发布 dsh-mine-sweeper 到 GitHub + npm。
# 在**新开的 PowerShell 窗口**里跑（别占用正在跑 dsh web 的那个窗口）：
#   pwsh F:\bigfatfish\dsh-mine-sweeper\publish.ps1
#
# 前置：npm 已登录（脚本会检查）。GitHub 侧不强制装 gh CLI：
#   - 装了 gh 且登录过：脚本直接建仓库
#   - 没装 gh：先在网页上建一个空的公有仓库 dsh-mine-sweeper（不要勾 README），
#     脚本会用 git push 推上去，第一次 push 会弹 GitHub 登录窗口。
param(
    [string]$Repo = 'dsh-mine-sweeper',
    [string]$Owner = 'Mailemailezhu',
    # 本机 npm 默认走 npmmirror 镜像，那边不收发布，所以必须显式指定官方源。
    [string]$Registry = 'https://registry.npmjs.org'
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (npm whoami --registry $Registry 2>$null)) {
    throw "npm 未登录。先跑：npm login --registry $Registry"
}

$hasGh = [bool](Get-Command gh -ErrorAction SilentlyContinue)
$origin = (git remote get-url origin 2>$null)

if (-not $origin) {
    $ghOk = $false
    if ($hasGh) {
        gh auth status 2>&1 | Out-Null
        $ghOk = ($LASTEXITCODE -eq 0)
        if (-not $ghOk) { Write-Host 'gh 没登录，跳过建仓库，改用 git remote 手动推。' -ForegroundColor Yellow }
    }
    if ($ghOk) {
        gh repo create "$Owner/$Repo" --public --source . --remote origin --description 'Minesweeper overlay for DeepSeek Harness'
    } else {
        git remote add origin "https://github.com/$Owner/$Repo.git"
    }
}

git push -u origin HEAD
if ($LASTEXITCODE -ne 0) {
    throw "git push 失败。若提示仓库不存在，先在 https://github.com/new 建一个空的公有仓库 $Owner/$Repo（不要勾任何初始化文件），再重跑本脚本。"
}

npm publish --access public --registry $Registry
if ($LASTEXITCODE -ne 0) { throw 'npm publish 失败' }

Write-Host "`n完成：https://github.com/$Owner/$Repo" -ForegroundColor Green
Write-Host "npm：https://www.npmjs.com/package/$Repo" -ForegroundColor Green
Write-Host '上架插件商店还差一步：往 https://github.com/awesome-dsh-plugin/awesome-dsh-plugin 提 PR，在列表里加一条指向本仓库的条目。'
