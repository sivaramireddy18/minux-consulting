# The Super Boss Vetting Specification
## Phase 2: MCU Architecture & Bare-Metal Driver Dev
### NVIC Registers, Hardware Exception Stacking, and VTOR Relocations

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 2: MCU Architecture & Bare-Metal Driver Dev
*   **Target Week:** Week 08
*   **Hardware Anchor:** Nested Vector Interrupt Controller (NVIC), Exception Stacking Unit, and System Control Block (SCB)
*   **Documentation Map:**
    *   ARMv7-M Architecture Reference Manual Section B1.5 and Section B3.4.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Nested Vector Interrupt Controller (NVIC) memory map, ISER, ICER, ISPR, ICPR, and priority register bytes.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write custom macros configuring NVIC registers for EXTI0 (IRQ 6) and USART1 (IRQ 37).

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Cortex-M4 exception entry stacking: auto-stacked registers (R0-R3, R12, LR, PC, xPSR) to active stacks.
*   🛠️ **Unassisted Lab Track (4 Hours):** Set a breakpoint in an ISR, dump stack frame memory using GDB, and verify auto-stacked registers.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** NVIC priority configurations: priority grouping, preemption priority, subpriority, and SCB_AIRCR writes.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure SCB_AIRCR to set preemption priority split, and verify priorities under GDB.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Vector Table architecture: stack pointer address vector, reset vector, exception vectors, and VTOR offsets.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a startup assembly routine building the vector table in flash memory.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Vector Table Offset Register (SCB_VTOR) requirements: base table alignment rules and power of 2 boundaries.
*   🛠️ **Unassisted Lab Track (4 Hours):** Create a RAM-based vector table, copy flash vectors to SRAM, update SCB_VTOR, and branch to dynamic vectors.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Exception return states: EXC_RETURN values loaded to LR, MSP/PSP stacks returns, and FPU lazy stacking.
*   🛠️ **Unassisted Lab Track (4 Hours):** Verify exception return states using GDB, and examine the active stack frame pointer.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Relocate vector table to SRAM dynamically
#include <stdint.h>

#define SCB_VTOR      *(volatile uint32_t *)0xE000ED08U
#define SRAM_TABLE    0x20000000U

void relocate_vector_table(void) {
    uint32_t *flash_table = (uint32_t *)0x08000000U;
    uint32_t *ram_table = (uint32_t *)SRAM_TABLE;
    
    // Copy 98 vectors to SRAM
    for (int i = 0; i < 98; i++) {
        ram_table[i] = flash_table[i];
    }
    
    // Set VTOR to SRAM table base address (512-byte aligned)
    SCB_VTOR = SRAM_TABLE;
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Verify EXTI0 interrupt handler jumps to relocated SRAM vector. Trace PC changes and check VTOR alignment in GDB.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** What happens to the exception vector fetch sequence if the address written to VTOR is not aligned to the size of the table?
2.  **Challenge 2:** Explain the difference between preemption priority and subpriority in NVIC routing.
3.  **Challenge 3:** Detail the behavior of FPU lazy stacking during the exception entry cycle on ARM Cortex-M4.
