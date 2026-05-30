# Microscopic Daily Vetting Specification
## Week 02, Day 5 (Friday): Sequential Circuits Basics (Latches & Flip-Flops)

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 02 | Day 5 (Friday)
*   **Core Systems Topic:** Sequential Circuits Basics (Latches & Flip-Flops)
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Learn the core transition from combinational to sequential logic (state-holding). Study the SR Latch, gated D Latch, and edge-triggered D Flip-Flop. Understand how clocks control propagation.

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Trace an active-low SR NAND latch truth table and identify the "forbidden" state.
  2. Write a state-based loop in C simulating clock cycles and latch state updates.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
typedef struct {
    bool Q;
    bool Q_bar;
} sr_latch_t;

// Update latch outputs based on inputs
void update_sr_latch(bool S, bool R, sr_latch_t *latch) {
    if (!S && R) {
        latch->Q = true;
        latch->Q_bar = false;
    } else if (S && !R) {
        latch->Q = false;
        latch->Q_bar = true;
    } else if (!S && !R) {
        // Forbidden state for Active-Low Latch
        latch->Q = true;
        latch->Q_bar = true;
    }
    // S=1, R=1: Hold state (no change)
}
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
