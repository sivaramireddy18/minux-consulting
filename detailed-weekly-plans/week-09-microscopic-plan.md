# The Super Boss Vetting Specification
## Phase 2: MCU Architecture & Bare-Metal Driver Dev
### SysTick Timers, Periodic Interrupts, and Polling delay loops

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 2: MCU Architecture & Bare-Metal Driver Dev
*   **Target Week:** Week 09
*   **Hardware Anchor:** Cortex-M4 System Timer (SysTick), clock calibrator, and interrupt controllers
*   **Documentation Map:**
    *   Cortex-M4 Generic User Guide Section 4.4 (System Timer, SysTick) and clock configurations.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** System Timer (SysTick) peripheral: reload register, value register, control register, and clock source selectors.
*   🛠️ **Unassisted Lab Track (4 Hours):** Enable the SysTick peripheral clock, set the source to Processor Clock, and verify control register bits.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Clock calibration calculations: SysTick clock source frequency divisions, tick interval maths, and counts limits.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure SysTick to generate exactly 1 millisecond periodic ticks on a 168MHz system clock.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** Periodic interrupts generation: SysTick exception enabling, reload thresholds, and handler routing.
*   🛠️ **Unassisted Lab Track (4 Hours):** Implement the 'SysTick_Handler', toggle a GPIO pin, and verify periodic ticks frequency on an oscilloscope.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Polling delay loops: hardware timer checks, countdown methods, and overhead cycles tracking.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a basic polling delay loop checking the SysTick count flag register.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Precise delay design: microsecond timer delays, hardware registers check loops, and compiler optimizing guards.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a precise microsecond delay driver, disable optimization on register checks, and verify timings.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Multi-priority timing constraints: delay loops execution under nesting interrupts, and clock drifts.
*   🛠️ **Unassisted Lab Track (4 Hours):** Test SysTick drift rates under high-priority nested interrupt loops, and calculate timing deviations.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// High-precision bare-metal SysTick microsecond delay driver
#include <stdint.h>

typedef struct {
    volatile uint32_t CTRL;
    volatile uint32_t LOAD;
    volatile uint32_t VAL;
    volatile uint32_t CALIB;
} SysTick_Type;

#define SysTick ((SysTick_Type *)0xE000E010U)

void systick_delay_us(uint32_t us) {
    SysTick->LOAD = (us * 168U) - 1U; // 168 cycles per us at 168MHz
    SysTick->VAL = 0U;                // Clear current value register
    SysTick->CTRL = (1U << 2) | (1U << 0); // Enable SysTick, Core Clock source
    
    // Polling COUNTFLAG (bit 16)
    while (!(SysTick->CTRL & (1U << 16)));
    
    SysTick->CTRL = 0U; // Disable SysTick
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Scope timing capture. Monitor pin toggle latency over 100,000 cycles. Verify exact pulse widths under varying compiler optimizations.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** What is the maximum delay duration that can be configured in a single SysTick cycle on a 168MHz processor?
2.  **Challenge 2:** Explain how the COUNTFLAG bit behaves when the SysTick reload register overflows during active polling.
3.  **Challenge 3:** How do we prevent timing drift in low-priority software timers when high-priority hardware interrupts preempt execution?
