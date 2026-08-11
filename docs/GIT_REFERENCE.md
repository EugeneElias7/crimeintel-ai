# GIT_REFERENCE.md — All the git commands you need

> Everyone on the team can look here instead of asking. PowerShell syntax (Windows).

---

## 1. One-time setup (do once per machine)

```powershell
git --version                              # check git installed
git config --global user.name "Eugene Elias"
git config --global user.email "eugene7mrt@gmail.com"
gh auth login                              # connect terminal to GitHub (pick HTTPS)
```

## 2. Everyday loop (this is 90% of what you do)

```powershell
git status                                 # what changed? what's staged?
git add <file>                             # stage ONE file
git add .                                  # stage ALL changes
git commit -m "feat: add login page"       # snapshot with a message
git push                                   # upload snapshots to GitHub
git pull                                   # download teammates' changes first!
```

Prefer prefixes: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`.

## 3. Branch workflow (how the team works)

```powershell
git checkout main                          # go to the stable branch
git pull                                   # get the latest main
git checkout -b feature/crima-ai           # create + switch to your branch
git push -u origin feature/crima-ai        # first push of a new branch ( -u remembers it)
git push                                   # later pushes (no -u needed)
```

Branches: `feature/crima-ai` (Dev 1), `feature/dashboard-cases` (Dev 2), `feature/auth-admin` (Dev 3).

## 4. Undo / fix mistakes

```powershell
git restore <file>                          # discard changes to ONE file (uncommitted)
git restore --staged <file>                 # un-stage a file, keep changes
git commit --amend -m "better message"      # rewrite the LAST commit message
git log --oneline                           # view history, one line per commit
git diff                                    # see exactly what changed (unstaged)
git diff --staged                           # see what's staged
```

## 5. Sync / merge

```powershell
git fetch                                   # download changes WITHOUT applying (peek only)
git merge <branch>                          # bring another branch's work into yours
```

> Pull = fetch + merge, done in one step.

## 6. When things go wrong

```powershell
# 1. conflict during pull/merge?
git status                    # shows "both modified" files
# fix the marked <<<<<<< ====== >>>>>>> sections in the file, then:
git add <fixed-file>
git commit -m "fix: resolve merge conflict"

# 2. accidentally committed to main?
git switch -c feature/your-branch           # move your work to a feature branch
git switch main && git reset --hard origin/main   # restore main to GitHub's version
```

## 7. Stash (save work-in-progress temporarily)

```powershell
git stash               # park uncommitted changes (e.g. before pull)
git stash pop           # bring them back
```

## 8. Our repo

```powershell
git remote -v           # shows origin -> https://github.com/EugeneElias7/crimeintel-ai.git
```

## Cheat sheet (fast memory)

| I want to... | Command |
|---|---|
| check the state | `git status` |
| stage everything | `git add .` |
| take a snapshot | `git commit -m "msg"` |
| upload | `git push` |
| download | `git pull` |
| new branch | `git checkout -b name` |
| switch branch | `git checkout name` |
| see history | `git log --oneline` |
| undo a file | `git restore file` |
| park changes | `git stash` |