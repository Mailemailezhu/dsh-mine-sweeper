# 发布 dsh-mine-sweeper 到 GitHub + npm。
# 在**新开的 PowerShell 窗口**里跑（别占用正在跑 dsh web 的那个窗口）：
#   powershell -ExecutionPolicy Bypass -File F:\bigfatfish\dsh-mine-sweeper\publish.ps1
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
Set-Location $PSScriptRoot

# 5.1 里一旦把 $ErrorActionPreference 设成 Stop，原生命令写 stderr 就会被当成
# 终止错误（git remote get-url、npm whoami 在没有结果时都会写 stderr）。
# 所以这里不设 Stop，探测统一走 cmd /c 自己吞掉 2>nul，只看退出码和 stdout。
$who = cmd /c "npm whoami --registry $Registry 2>nul"
if (-not $who) { throw "npm 未登录。先跑：npm login --registry $Registry" }
Write-Host "npm 身份：$who"

$origin = cmd /c "git config --get remote.origin.url 2>nul"
if (-not $origin) {
    $repoUrl = "https://github.com/$Owner/$Repo.git"
    $ghAuthed = $false
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        cmd /c "gh auth status >nul 2>nul"
        $ghAuthed = ($LASTEXITCODE -eq 0)
    }
    if ($ghAuthed) {
        cmd /c "gh repo create `"$Owner/$Repo`" --public --source . --remote origin --description `"Minesweeper overlay for DeepSeek Harness`""
        if ($LASTEXITCODE -ne 0) { throw 'gh repo create 失败' }
    } else {
        Write-Host "没有可用的 gh，直接按 $repoUrl 推送（需要先在网页上建好空仓库）。" -ForegroundColor Yellow
        cmd /c "git remote add origin $repoUrl"
    }
} else {
    Write-Host "origin：$origin"
}

cmd /c "git push -u origin HEAD"
if ($LASTEXITCODE -ne 0) {
    throw "git push 失败。若提示仓库不存在，先在 https://github.com/new 建空仓库 $Owner/$Repo（不要勾任何初始化文件），再重跑本脚本。"
}

cmd /c "npm publish --access public --registry $Registry"
if ($LASTEXITCODE -ne 0) { throw 'npm publish 失败' }

Write-Host "`n完成：https://github.com/$Owner/$Repo" -ForegroundColor Green
Write-Host "npm：https://www.npmjs.com/package/$Repo" -ForegroundColor Green
Write-Host '上架插件商店还差一步：往 https://github.com/awesome-dsh-plugin/awesome-dsh-plugin 提 PR，在列表里加一条指向本仓库的条目。'
