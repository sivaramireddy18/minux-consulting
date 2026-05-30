# Microscopic Daily Vetting Specification
## Week 01, Day 3: Parasitic Bus Capacitance, RC trace line math, and Pull-up sizing

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 01 | Day 3
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Calculate the physical RC time constant of PCB trace lines. Analyze how parasitic trace capacitance ($C_{trace}$) and input pin capacitance ($C_{in}$) degrade high-frequency square wave signal rise times. Solve the capacitor charge equation: $V(t) = V_{DD}(1 - e^{-t/RC})$ to determine the maximum pull-up resistor value ($R_{pullup}$) required to meet standard $V_{IH}$ thresholds.

#### 🛠️ Unassisted Lab Track (4 Hours)
Measure SCL and SDA line rise times on an active bus line. Connect varying pull-up resistors (10k, 4.7k, 1k) to the bus lines. Probes the physical transition curves using a high-bandwidth digital oscilloscope to analyze rise times.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// RC Rise Time Calculation for Pull-up Optimization
#include <stdint.h>
#include <math.h>

double calculate_max_pullup(double capacitance_pf, double rise_time_ns) {
    // Standard I2C rise time limits (300ns max for Fast Mode)
    // t = 0.8473 * R * C (from 10% to 70% VDD)
    double r_ohms = (rise_time_ns * 1e-9) / (0.8473 * capacitance_pf * 1e-12);
    return r_ohms;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Scope Trigger: Channel 1 falling edge. Measure Rise Time (10% to 90%). Pass criteria: Rise time < 300ns with a 4.7k pull-up resistor.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
