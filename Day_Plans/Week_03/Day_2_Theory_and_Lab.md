# Microscopic Daily Vetting Specification
## Week 03, Day 2 (Tuesday): Compilation & Assembly Phases

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 03 | Day 2 (Tuesday)
*   **Core Systems Topic:** Compilation & Assembly Phases
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study the compilation pipeline: translation from C to assembly representation (`.s`), optimization parameters (`-O0`, `-O1`, `-O2`, `-O3`, `-Os`), and translation of assembly to machine instructions inside binary object files (`.o`).

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Compile a simple loop function under different optimization levels (`-O0` vs `-O2`).
  2. Inspect the resulting assembly code (`.s`) and compare how register usage and loop structures are optimized by the compiler.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
# Generate assembly file from C
gcc -S -O2 src/math.c -o build/math.s

# Trace assembly instructions
cat build/math.s
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
