# Microscopic Daily Vetting Specification
## Week 01, Day 1 (Monday): The Linux Host & FHS Basics

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 01 | Day 1 (Monday)
*   **Core Systems Topic:** The Linux Host & FHS Basics
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the Linux Directory Structure (Filesystem Hierarchy Standard - FHS). Comprehend the role of `/usr/bin`, `/usr/local/bin`, `/opt`, `/etc`, and user home paths in cross-compilation and toolchain management.

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Boot Linux host (Ubuntu 22.04 LTS native or VM).
  2. Perform system package update.
  3. Install core build tools: `sudo apt update && sudo apt install -y build-essential git openocd cppcheck clang-tidy valgrind minicom picocom`.
  4. Create a clean workspace structure under `/home/$USER/workspace`.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
# Verify host compiler capability
gcc --version
make --version

# FHS Checklist
ls /
file /usr/bin/gcc
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
