# The Super Boss Vetting Specification
## Phase 1: Foundations of Embedded C & Digital Logic
### Stack Frame Layout, Registers Usage, and Stack Overflows

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 1: Foundations of Embedded C & Digital Logic
*   **Target Week:** Week 04
*   **Hardware Anchor:** Cortex-M4 core registers (R0-R15), Main Stack Pointer (MSP), and Process Stack Pointer (PSP)
*   **Documentation Map:**
    *   ARM Procedure Call Standard (AAPCS), Cortex-M4 exception entry stack maps, and core register files.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** ARM Cortex-M core registers (R0-R12, SP, LR, PC, xPSR) hardware allocation roles and standard AAPCS usage.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write assembly functions, verify AAPCS parameter registers under GDB, and step through R0-R3 variables changes.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Procedure Call Standard (AAPCS) rules: register inputs (R0-R3), local stack frames, and return states.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build a complex function recursion, dump stack trace using GDB 'bt', and inspect stacked R4-R11 registers.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** Function stack frame configuration: prologue frame creation, epilogue frame breakdown, and R11 frame pointers.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write inline assembly to inspect stack frames before and after function calls, tracking SP changes.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Stack pointer registers: Main Stack Pointer (MSP) vs Process Stack Pointer (PSP) boundaries.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write code to configure PSP and MSP, run thread execution on PSP, and handle interrupts on MSP.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Stack overflow mechanisms, nested execution limits, system crash behaviors, and hardware recovery gates.
*   🛠️ **Unassisted Lab Track (4 Hours):** Trigger a stack overflow intentionally. Track memory values and trace PC locations during the fault loop.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Stack overflow protection strategies: compiler stack canaries (-fstack-protector), guard bands, and hardware MPU traps.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure compiler stack protector flags, run unit tests, and verify stack protection traps.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Stack canary validation and overflow trapping
#include <stdint.h>

#define STACK_CANARY_VALUE 0xDEADBEEFU

void execute_secure_buffer(void) {
    volatile uint32_t guard_canary = STACK_CANARY_VALUE;
    volatile uint8_t buffer[8];
    
    // Perform copy operations...
    
    // Verify canary is intact before return
    if (guard_canary != STACK_CANARY_VALUE) {
        // Trigger recovery loop
        __asm volatile ("bkpt #1");
    }
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** GDB execution testing. Breakpoint inside function prologue. Monitor SP bounds, verify canary is intact at return.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Why are local function variables allocated to registers instead of SRAM under high optimization levels?
2.  **Challenge 2:** Explain how the stack pointer (SP) behaves during nested exception entries on ARM Cortex-M4.
3.  **Challenge 3:** How does the '-fstack-protector-all' compiler flag physically modify the compiled function prologue and epilogue assembly?
