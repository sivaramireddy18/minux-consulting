# Microscopic Daily Vetting Specification
## Week 01, Day 5 (Friday): Git Hooks & Scripted Repo Discipline

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 01 | Day 5 (Friday)
*   **Core Systems Topic:** Git Hooks & Scripted Repo Discipline
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Learn about Git Hooks—shell scripts executed automatically before or after key Git lifecycle events. Focus specifically on the `commit-msg` hook to programmatically audit commit messages.

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Create a custom shell script inside `.git/hooks/commit-msg`.
  2. Grant the script executable permissions.
  3. Test the hook by trying to commit non-conforming messages.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
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

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
