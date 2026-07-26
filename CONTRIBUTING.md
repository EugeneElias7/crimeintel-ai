# Contributing to CrimeIntel AI

Thank you for considering contributing to CrimeIntel AI! This document outlines the guidelines for contributing to the project.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [First-Time Contributor Tips](#first-time-contributor-tips)

## Development Environment Setup

### Prerequisites

- **Node.js** 18.x or later
- **Python** 3.11 or later
- **Git**

### Frontend Setup

```bash
cd frontend
npm ci
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Environment Variables

Copy the example environment files and configure as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Running Tests

```bash
# Frontend
cd frontend && npm run test

# Backend
cd backend && pytest tests/ -v
```

## Code Style Guidelines

### TypeScript / JavaScript (Frontend)

- **Linter:** ESLint — run `npm run lint` before committing
- **Formatter:** Prettier — run `npm run format` to auto-format
- Configuration files are at `frontend/.eslintrc.js` and `frontend/.prettierrc`

### Python (Backend)

- **Formatter:** Black — run `black .` to auto-format
- **Linter:** Flake8 — run `flake8` to check for issues
- Configuration is in `backend/setup.cfg`

### General Rules

- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Write docstrings for public Python functions and JSDoc for public TypeScript functions
- Avoid hardcoded values; use environment variables or configuration files
- Write unit tests for all new features and bug fixes

## Branch Naming Convention

All branches should be created from `main` and follow this naming convention:

| Prefix     | Purpose                          |
|------------|----------------------------------|
| `feat/`    | New feature                      |
| `fix/`     | Bug fix                          |
| `docs/`    | Documentation changes            |
| `chore/`   | Maintenance, tooling, dependencies |

Examples: `feat/map-clustering`, `fix/login-redirect`, `docs/api-readme`, `chore/update-deps`

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description
```

**Types:**

| Type       | Usage                            |
|------------|----------------------------------|
| `feat`     | A new feature                    |
| `fix`      | A bug fix                        |
| `docs`     | Documentation changes            |
| `chore`    | Maintenance, tooling, refactoring|
| `test`     | Adding or updating tests         |
| `refactor` | Code refactoring (no feature/fix)|

**Examples:**

```
feat(analytics): add heat map time slider
fix(auth): handle token refresh race condition
docs(readme): update installation instructions
chore(deps): upgrade express to v5
test(case-explorer): add filter unit tests
```

## Pull Request Process

1. **Fork** the repository to your GitHub account
2. **Create a branch** from `main` following the branch naming convention
3. **Commit your changes** following the commit message convention
4. **Push** your branch to your fork
5. **Open a Pull Request** against the `main` branch of the original repository
6. **Ensure the PR description** clearly describes the changes and references any related issues
7. **Code review** is required — at least one maintainer must approve before merging
8. **All CI checks** must pass before merging
9. **Squash and merge** is preferred to keep history clean

## Issue Reporting Guidelines

### Bug Reports

- Use the **Bug Report** template
- Include detailed steps to reproduce the issue
- Provide environment information (browser, OS, device)
- Attach screenshots or logs if applicable

### Feature Requests

- Use the **Feature Request** template
- Explain the problem you're trying to solve
- Describe the solution you'd like to see
- Mention any alternatives you've considered

### General Guidelines

- Search existing issues before opening a new one
- Use a clear and descriptive title
- Add appropriate labels if you have permission

## First-Time Contributor Tips

- Look for issues labeled **`good first issue`** — these are beginner-friendly
- Comment on the issue to let others know you're working on it
- Don't hesitate to ask questions — we're happy to help!
- Start small: documentation fixes, typos, and simple bug fixes are great first contributions
- Run the project locally and familiarize yourself with the codebase
- Follow the [Code Style Guidelines](#code-style-guidelines) carefully
- Make sure all tests pass before submitting your PR

Thank you for contributing! 🚀
