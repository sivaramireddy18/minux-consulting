# Microscopic Daily Vetting Specification
## Week 03, Day 3 (Wednesday): Variables Scopes, Lifetimes, and Linkage

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 03 | Day 3 (Wednesday)
*   **Core Systems Topic:** Variables Scopes, Lifetimes, and Linkage
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Master variable scopes (block/local, file/global) and lifetimes (automatic/stack, static/data, dynamic/heap). Understand Linkage: internal linkage (accessible only within one translation unit) vs external linkage (accessible across files).

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Write a program containing global variables, local variables, and static block variables.
  2. Trace variable addresses to observe how they map to different locations in virtual memory.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
int global_var = 10;          // External linkage, static lifetime
static int file_var = 20;     // Internal linkage, static lifetime

void function(void) {
    int local_var = 30;       // No linkage, automatic stack lifetime
    static int stat_var = 40; // No linkage, static lifetime
}
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
