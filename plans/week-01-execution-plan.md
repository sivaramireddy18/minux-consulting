# Weekly Execution Plan: Week 01

## 🎯 Weekly Goal
Establish a high-discipline, industry-standard development environment on the Linux host, master professional version control workflows using Git, and enforce strict commit structures utilizing Conventional Commits and Git hooks.

## 🏆 Weekly Outcome
By Friday, the student will have a fully bootstrapped Linux development environment (native or VM), configured custom bash alias controls, established global Git conventions, and written an automated shell-script Git hook (`commit-msg`) that programmatically blocks any commit violating Conventional Commit guidelines.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Linux Host & FHS Basics
* **Conceptual Objective**: Understand the Linux Directory Structure (Filesystem Hierarchy Standard - FHS). Comprehend the role of `/usr/bin`, `/usr/local/bin`, `/opt`, `/etc`, and user home paths in cross-compilation and toolchain management.
* **Practical Activity**:
  1. Boot Linux host (Ubuntu 22.04 LTS native or VM).
  2. Perform system package update.
  3. Install core build tools: `sudo apt update && sudo apt install -y build-essential git openocd cppcheck clang-tidy valgrind minicom picocom`.
  4. Create a clean workspace structure under `/home/$USER/workspace`.
* **Code/Circuit Reference**:
```bash
# Verify host compiler capability
gcc --version
make --version

# FHS Checklist
ls /
file /usr/bin/gcc
```

### Tuesday: Advanced Bash Environment Configuration
* **Conceptual Objective**: Learn how the shell initializes (`.bashrc` vs `.bash_profile`), path variable manipulation (`PATH`), export dynamics, and configuring environment variables for embedded cross-compilers.
* **Practical Activity**:
  1. Open `~/.bashrc` and construct custom aliases for system information and micro-controller connection monitoring.
  2. Map a dedicated variable `EMBEDDED_TOOLS_DIR` to `/opt/toolchains`.
  3. Source `.bashrc` and verify modification using print commands.
* **Code/Circuit Reference**:
```bash
# Append to ~/.bashrc
export TOOLS_PATH="$HOME/embedded_tools"
export PATH="$PATH:$TOOLS_PATH"

# Custom utility alias
alias check-usb="lsusb | grep -iE 'stlink|ftdi|ch340|cp210x'"
alias print-env="echo 'PATH='$PATH && arm-none-eabi-gcc --version 2>/dev/null || echo 'No cross-compiler yet'"
```

### Wednesday: Git Foundations & Advanced Log Mechanics
* **Conceptual Objective**: Understand Git internals: the three-stage architecture (working directory, staging area, local repository), commit graph DAGs (Directed Acyclic Graphs), and the differences between merges, rebases, and fast-forwards.
* **Practical Activity**:
  1. Initialize a new Git repository cleanly.
  2. Configure global user identity parameters.
  3. Master directory and file exclusion by drafting a comprehensive `.gitignore` targeting system binary objects, build outputs, and editor swap files.
* **Code/Circuit Reference**:
```ini
# Core contents of a standard embedded C .gitignore
*.o
*.elf
*.bin
*.hex
*.map
*.su
.vscode/
.idea/
*~
*.swp
build/
```

### Thursday: Conventional Commits Syntax & Atomic Commits
* **Conceptual Objective**: Master the Conventional Commits v1.0.0 specification. Understand the structure: `type(scope): description`, where type is `feat`, `fix`, `docs`, `style`, `refactor`, `test`, or `chore`. Comprehend the importance of atomic commits (one logical change per commit).
* **Practical Activity**:
  1. Practice staging and committing incremental changes.
  2. Analyze repository history using custom graph formatting commands.
* **Code/Circuit Reference**:
```bash
# Good Commit Messages
git commit -m "feat(env): add custom stlink detection aliases to bashrc"
git commit -m "docs(readme): document physical hardware requirements"

# Beautiful Git Log Graph Alias
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

### Friday: Git Hooks & Scripted Repo Discipline
* **Conceptual Objective**: Learn about Git Hooks—shell scripts executed automatically before or after key Git lifecycle events. Focus specifically on the `commit-msg` hook to programmatically audit commit messages.
* **Practical Activity**:
  1. Create a custom shell script inside `.git/hooks/commit-msg`.
  2. Grant the script executable permissions.
  3. Test the hook by trying to commit non-conforming messages.
* **Code/Circuit Reference**:
```bash
# Setup the commit-msg hook
cat << 'EOF' > .git/hooks/commit-msg
#!/usr/bin/env bash
commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Regular expression to match conventional commits
pattern="^(feat|fix|docs|style|refactor|test|chore)(\([a-zA-Z0-9_-]+\))?: .+"

if [[ ! $commit_msg =~ $pattern ]]; then
    echo "ERROR: Invalid commit message format: '$commit_msg'"
    echo "Commit message must follow Conventional Commits specification."
    echo "Example: feat(gpio): configure pin PA5 as output"
    exit 1
fi
EOF
chmod +x .git/hooks/commit-msg
```

---

## 🛠️ Hands-On Assignment: Custom Validation Hook Infrastructure

### Functional Requirements
Create a fully operational C project directory structure with a customized pre-commit validation shell script.
1. The project must have a standard directory structure: `src/`, `include/`, `build/`.
2. A bash script named `validate.sh` must be written in the root directory. It must automatically scan all `.c` and `.h` files under `src/` and `include/` and fail if any file contains:
   - Trailing whitespaces.
   - Banned standard library allocations (`malloc`, `free`, `realloc`).
3. You must install a `pre-commit` Git hook that automatically runs `./validate.sh`. If `validate.sh` returns a failure exit code, the commit must be blocked.

### Structural Requirements & Code Skeleton
```text
project-repo/
├── .git/
├── .gitignore
├── validate.sh
├── src/
│   └── main.c
├── include/
│   └── main.h
└── .git/hooks/
    └── pre-commit -> (linked to or copying execution of validate.sh)
```

**`validate.sh` Shell Skeleton**:
```bash
#!/usr/bin/env bash
# Script to validate code rules before commit

errors=0

echo "Running pre-commit validation..."

# Check for trailing whitespaces
trailing_space_files=$(grep -rl '[[:space:]]$' src/ include/ 2>/dev/null)
if [ ! -z "$trailing_space_files" ]; then
    echo "FAIL: Trailing whitespaces found in:"
    echo "$trailing_space_files"
    errors=$((errors+1))
fi

# Check for forbidden dynamic allocations
forbidden_calls=$(grep -rnE 'malloc\(|free\(|realloc\(' src/ include/ 2>/dev/null)
if [ ! -z "$forbidden_calls" ]; then
    echo "FAIL: Forbidden dynamic allocation functions used:"
    echo "$forbidden_calls"
    errors=$((errors+1))
fi

if [ $errors -ne 0 ]; then
    echo "Validation FAILED. Blocked commit."
    exit 1
fi

echo "Validation PASSED. Committing..."
exit 0
```

---

## 📦 Deliverables
* [ ] Git repository initialized with `.gitignore` and conventional log alias configured.
* [ ] Physical `.git/hooks/commit-msg` active and blocking non-conforming messages.
* [ ] Project directory setup containing `validate.sh` and linked `.git/hooks/pre-commit` blocking trailing spaces and standard library allocations.
* [ ] Active system logs or output recordings demonstrating the hooks in action (blocking bad commits, accepting conforming ones).

---

## ❓ Self-Check Questions
1. Why is the Filesystem Hierarchy Standard (FHS) critical to understand when dealing with cross-compilation toolchains? Where should a custom compiler toolchain normally be placed?
2. What is the difference between a Fast-Forward Merge and a Three-Way Merge in Git? How does rebasing change history?
3. How does a shell environment execute script commands (explain `PATH` resolution dynamics)?
4. Under what circumstances will Git refuse to execute a hook script?
5. Why are functions like `malloc()` and `free()` considered forbidden abstractions in high-reliability embedded system firmwares?

---

## 🚀 Stretch Task (Optional)
Extend `validate.sh` to automatically run `cppcheck --enable=all --error-exitcode=1 src/` inside the pre-commit hook. The commit must be cleanly blocked if the static analyzer catches any unitialized variables, array bounds violations, or styling warnings.

## 💡 Motivation Checkpoint
In production-level software organizations (such as SpaceX, Tesla, or Apple), thousands of commits are pushed daily. If developer code style, repository discipline, and commit hygiene are unmonitored, history quickly becomes incomprehensible, and bugs slip through compilation boundaries. Mastering automated scripting validation and Git hooks makes you an asset to team architectures on Day 1.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - `git log` shows conforming Conventional Commits.
  - Attempting to commit a message like `"fixed bug"` is rejected with the custom regex error.
  - Attempting to commit code containing `malloc()` is successfully blocked.
  - Project directory is warning-free under compiler checks.
* **Fail Criteria**:
  - Any compilation warning or bypass of validation routines.
  - Absence of conventional commits in history.
