# Microscopic Daily Vetting Specification
## Week 03, Day 5 (Friday): Static and Extern in Multi-File Architectures

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 03 | Day 5 (Friday)
*   **Core Systems Topic:** Static and Extern in Multi-File Architectures
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Grasp the dual role of `static` (restricts symbol visibility to the current file when applied globally; preserves variable value across function calls when applied locally). Understand `extern` (declares existence of symbol defined in another file).

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Build a C modular layout where internal functions are protected using `static` declarations.
  2. Expose specific API control structures to `main.c` via headers using `extern` correctly.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
// sensor.c
static int raw_sensor_reading; // Private global variable (internal linkage)

int get_sensor_value(void) {   // Public function (external linkage)
    return raw_sensor_reading;
}
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
