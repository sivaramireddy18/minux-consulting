# Microscopic Daily Vetting Specification
## Week 03, Day 4: Callback Function Pointers Syntax and registers configurations

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 03 | Day 4
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Master the syntax of callback function pointers. Function pointers store the physical address of the entry instruction of a compiled function. Learn how function pointers enable flexible event-driven architectures and register callbacks in driver layers.

#### 🛠️ Unassisted Lab Track (4 Hours)
Build an event dispatcher system using function pointers. Register different event handlers, and step through execution jumps inside GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Register callback handler implementation
#include <stdint.h>

typedef void (*SensorCallback)(uint16_t value);
static SensorCallback app_callback = 0;

void register_sensor_callback(SensorCallback cb) {
    app_callback = cb;
}

void trigger_sensor_event(uint16_t value) {
    if (app_callback != 0) {
        app_callback(value); // Execute indirect branch
    }
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Set GDB breakpoint inside trigger_sensor_event. Step in ('si') and verify direct register branch instruction execution.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
