# The Super Boss Vetting Specification
## Phase 2: MCU Architecture & Bare-Metal Driver Dev
### STM32 Clock Trees, RCC Registers, and GPIO Base Configurations

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 2: MCU Architecture & Bare-Metal Driver Dev
*   **Target Week:** Week 07
*   **Hardware Anchor:** Reset and Clock Control (RCC) clock mux, Phase-Locked Loop (PLL), and GPIO Ports (A to I)
*   **Documentation Map:**
    *   STM32F407 Reference Manual (RM0090) Section 6 (RCC) and Section 8 (GPIO).
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Microcontroller clock distribution network: High-Speed Internal (HSI), High-Speed External (HSE), PLL setup, and peripheral bus clocks.
*   🛠️ **Unassisted Lab Track (4 Hours):** Enable HSE clock source, configure PLL registers to run at 168MHz, and verify clock frequency.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Peripheral clock gating: why all peripheral clocks are disabled at reset, and APB/AHB bus clock enables.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write custom code to enable the clock gates for Port A and Port D via the RCC registers.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** GPIO electrical characteristics: MODER (Input, Output, Alternate, Analog), OTYPER (Push-Pull, Open-Drain), and PUPDR.
*   🛠️ **Unassisted Lab Track (4 Hours):** Set GPIOA Pin 5 to Output Push-Pull, High Speed, with internal Pull-up enabled using raw pointers.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** GPIO speed registers: OSPEEDR configurations, slew-rate transitions, noise limits, and high-frequency EMI hazards.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure GPIOD Pin 12 to high speed. Measure output pin slew-rate using an oscilloscope.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** GPIO data paths: Input Data Register (IDR) vs Output Data Register (ODR) and internal register mappings.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build an input reading loop checking the IDR register state and toggling the ODR register status.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Bit Set/Reset Register (BSRR) architecture: atomic write mechanics, and preemption race protection.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a competitive benchmark test comparing ODR bit toggles vs atomic BSRR writes under active nesting interrupts.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Raw atomic GPIO write driver using BSRR
#include <stdint.h>

#define GPIOD_BASE   0x40020C00U
#define GPIOD_MODER  *(volatile uint32_t *)(GPIOD_BASE + 0x00U)
#define GPIOD_BSRR   *(volatile uint32_t *)(GPIOD_BASE + 0x18U)

void init_gpiod_pin12(void) {
    // Clear and set Pin 12 to output
    GPIOD_MODER &= ~(3U << (12 * 2));
    GPIOD_MODER |= (1U << (12 * 2));
}

void set_gpiod_pin12_high(void) {
    GPIOD_BSRR = (1U << 12); // Atomic Set
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Oscilloscope pin profiling. Slew rate measurement. Verify clock tree configuration outputs correct frequency on MCO pins.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Why must we enable the peripheral clock *before* writing configuration parameters to the peripheral registers?
2.  **Challenge 2:** Explain the physical structural difference between Push-Pull and Open-Drain output configurations.
3.  **Challenge 3:** Why is the Bit Set/Reset Register (BSRR) immune to read-modify-write data race conditions?
