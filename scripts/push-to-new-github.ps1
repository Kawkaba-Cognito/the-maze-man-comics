# Creates a private repo on the logged-in GitHub account and pushes main.
# Prerequisite: gh auth login (new account)

$ErrorActionPreference = 'Stop'
$RepoName = 'the-maze-man-comics'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error 'GitHub CLI (gh) is not installed. Install from https://cli.github.com/'
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Not logged into GitHub. Run: gh auth login`n$auth"
}

$user = gh api user -q .login
Write-Host "Logged in as: $user"

$remotes = git remote
if ($remotes -contains 'origin') {
  $url = git remote get-url origin
  if ($url -notmatch "github\.com/$user/") {
    if ($remotes -notcontains 'kawkaba-origin') {
      git remote rename origin kawkaba-origin
      Write-Host 'Renamed old origin -> kawkaba-origin'
    }
  }
}

if (git remote get-url origin 2>$null) {
  $originUrl = git remote get-url origin
  if ($originUrl -match "github\.com/$user/$RepoName") {
    Write-Host "Remote origin already points at $user/$RepoName"
    git push -u origin main
  } else {
    Write-Error "origin exists but is not $user/$RepoName : $originUrl"
  }
} else {
  gh repo create $RepoName --private --description 'The Maze Man Comics — private app source' --source=. --remote=origin --push
}

$vis = gh repo view "$user/$RepoName" --json visibility,isPrivate -q '.visibility'
Write-Host "Done. Repo: https://github.com/$user/$RepoName (visibility: $vis)"
