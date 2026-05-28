# Weekly Execution Plan: Week 09

## 🎯 Weekly Goal
Master Nested Vectored Interrupt Controller (NVIC) architectures, configure physical External Interrupts (EXTI) triggered by physical input pin state transitions, understand ARM interrupt context-saving dynamics, and manage software race conditions.

## 🏆 Weekly Outcome
By Friday, the student will have written a **Bare-Metal Interrupt-Driven System** on the STM32F4. They will have configured the EXTI controller and the NVIC directly by registers, written an Interrupt Service Routine (ISR) to handle external push-button events dynamically without blocking loop controls, and implemented proper register protections to resolve shared-data race conditions.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The NVIC Architecture & Core Interrupt Controller
* **Conceptual Objective**: Study the Nested Vectored Interrupt Controller (NVIC) integrated inside the ARM core. Understand how NVIC manages prioritize exceptions, interrupt nesting (high priority preempts low priority), vector address routing, and core exception models.
* **Practical Activity**:
  1. Read the NVIC core registers specifications (ISER, ICER, ISPR, ICPR, IPR).
  2. Map out how priorities are prioritized inside ARM's 8-bit priority registers (only upper 4 bits are physically implemented on STM32F4).
* **Code/Circuit Reference**:
```c
#define NVIC_BASE_ADDR     0xE000E100U
#define NVIC_ISER0         ((volatile uint32_t*)(NVIC_BASE_ADDR + 0x00U)) // Interrupt Set-Enable Register
#define NVIC_IPR           ((volatile uint8_t*)(NVIC_BASE_ADDR + 0x300U)) // Interrupt Priority Register

void nvic_enable_irq(uint8_t irq_number) {
    // Each ISER register covers 32 IRQs
    *NVIC_ISER0 |= (1U << irq_number);
}
```

### Tuesday: External Interrupt Controller (EXTI) & System Configuration (SYSCFG)
* **Conceptual Objective**: Understand that ARM core cannot directly monitor GPIO pins for interrupts. The MCU routes GPIO lines to the External Interrupt (EXTI) controller via the System Configuration (SYSCFG) peripheral multiplexer. EXTI monitors lines for falling/rising signal edges.
* **Practical Activity**:
  1. Learn how EXTI lines (0 to 15) are mapped to GPIO pin indices.
  2. Configure SYSCFG to route Pin 0 of Port A to EXTI line 0.
* **Code/Circuit Reference**:
```c
#define SYSCFG_BASE        0x40013800U
#define SYSCFG_EXTICR1     ((volatile uint32_t*)(SYSCFG_BASE + 0x08U))

#define EXTI_BASE          0x40013C00U
#define EXTI_IMR           ((volatile uint32_t*)(EXTI_BASE + 0x00U)) // Interrupt Mask Register
#define EXTI_RTSR          ((volatile uint32_t*)(EXTI_BASE + 0x08U)) // Rising Trigger Select
#define EXTI_FTSR          ((volatile uint32_t*)(EXTI_BASE + 0x0CU)) // Falling Trigger Select

void configure_exti0_falling_edge(void) {
    // 1. Route PA0 to EXTI0 via SYSCFG_EXTICR1 (clear bits 0-3 for Port A)
    *SYSCFG_EXTICR1 &= ~(0xFU << 0);

    // 2. Unmask EXTI Line 0
    *EXTI_IMR |= (1U << 0);

    // 3. Enable Falling Edge Trigger, disable Rising Edge
    *EXTI_FTSR |= (1U << 0);
    *EXTI_RTSR &= ~(1U << 0);
}
```

### Wednesday: Interrupt Service Routine (ISR) Mechanics & Vector Table Linking
* **Conceptual Objective**: Comprehend the exact processor context-saving sequence during exception entry:
  1. Current instruction finishes execution.
  2. Core automatically pushes critical registers (R0-R3, R12, LR, PC, xPSR) to the active Stack (MSP or PSP).
  3. Core switches to Handler Mode (Privileged).
  4. Core fetches matching ISR address from the Vector Table and branches.
  5. Upon exit, the special return code (`EXC_RETURN`) written to PC triggers automatic stack restoration.
* **Practical Activity**:
  1. Open your `startup.c` file from Week 7.
  2. Implement `EXTI0_IRQHandler` in C, declare it inside the physical Vector Table array at index offset 22 (the EXTI0 slot on STM32F4).
* **Code/Circuit Reference**:
```c
// Inside startup.c
void EXTI0_IRQHandler(void) __attribute__((weak, alias("Default_Handler")));

// Vector table array updated
const element_t vector_table[] = {
    // Core exceptions...
    [16 + 6] = EXTI0_IRQHandler // Vector Table Offset mapping for EXTI0 (Interrupt ID 6)
};
```

### Thursday: Interrupt Cleansings & Edge Processing
* **Conceptual Objective**: Understand that hardware requires software to explicitly acknowledge and clear the pending state of an interrupt within the ISR (e.g., writing a `1` to the pending bit in `EXTI_PR`). If the pending bit is not cleared, the core immediately re-triggers the exception on exit, locking up the system.
* **Practical Activity**:
  1. Write the core implementation of `EXTI0_IRQHandler`.
  2. Read the active state of LED and toggle it, then clear the pending flag.
* **Code/Circuit Reference**:
```c
#define EXTI_PR            ((volatile uint32_t*)(EXTI_BASE + 0x14U)) // Pending Register
#define GPIOD_ODR          ((volatile uint32_t*)0x40020C14U)

void EXTI0_IRQHandler(void) {
    // Verify interrupt is active on EXTI0
    if (*EXTI_PR & (1U << 0)) {
        // Toggle PD12 LED
        *GPIOD_ODR ^= (1U << 12);

        // Clear pending bit (write 1 to clear in STM32!)
        *EXTI_PR = (1U << 0);
    }
}
```

### Friday: Race Conditions & Shared Resource Protections
* **Conceptual Objective**: Master the concept of a Race Condition—corruptions that occur when an ISR modifies a shared global variable while the background main loop is reading/modifying it. Learn how to protect critical sections using global interrupt disable controls (`__disable_irq()` / `__enable_irq()`).
* **Practical Activity**:
  1. Write a program where a global counter is modified inside an ISR and inside a main loop.
  2. Implement proper atomic boundaries around the main loop access using primitive registers blocks.
* **Code/Circuit Reference**:
```c
volatile uint32_t g_event_counter = 0; // volatile correct

void process_data_safely(void) {
    // Enter Critical Section: disable interrupts
    __asm volatile("cpsid i" : : : "memory"); 

    // Safe access
    uint32_t local_copy = g_event_counter;
    g_event_counter = 0;

    // Exit Critical Section: enable interrupts
    __asm volatile("cpsie i" : : : "memory");
}
```

---

## 🛠️ Hands-On Assignment: Bare-Metal Interrupt Driver with Critical Sections

### Functional Requirements
Create a fully functional, bare-metal interrupt-driven application on the STM32F4.
1. Wire an external pushbutton to Pin PA0 (or use the onboard User Button). Configure PA0 as an input with Pull-down resistor.
2. Route PA0 to EXTI0 via SYSCFG. EXTI0 must trigger on a Rising Edge (when button is pressed).
3. Enable EXTI0 (Interrupt position 6) inside the NVIC. Configure priority to level 2.
4. Set up PD12 (LED) as a General Purpose Output.
5. In `startup.c`, ensure the Vector Table maps `EXTI0_IRQHandler` at vector position 22.
6. The ISR `EXTI0_IRQHandler` must:
   - Verify the EXTI pending bit.
   - Increment a volatile global counter variable `g_button_press_count`.
   - Clear the pending EXTI register flag.
7. In the `main.c` background loop, check `g_button_press_count`. If it is non-zero, print the count (or simulate a serial output) and decrement the counter safely. You must protect this check-and-decrement step inside the main loop using a **critical section** to prevent data corruption.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include <stdint.h>
#include <stdbool.h>

// Shared resource
volatile uint32_t g_button_press_count = 0;

void configure_peripherals(void);

void main(void) {
    configure_peripherals();

    while (1) {
        uint32_t count = 0;

        // 1. Enter Critical Section to read and reset shared variable
        __asm volatile("cpsid i" : : : "memory");
        if (g_button_press_count > 0) {
            count = g_button_press_count;
            g_button_press_count = 0; // Clear it
        }
        __asm volatile("cpsie i" : : : "memory");

        // 2. Process data outside critical section to keep interrupts unblocked
        if (count > 0) {
            // Toggle LED PD12
            volatile uint32_t *odr = (volatile uint32_t*)0x40020C14U;
            *odr ^= (1U << 12);
        }
    }
}
```

---

## 📦 Deliverables
* [ ] Startup file `startup.c` containing the updated Vector Table array.
* [ ] Application file `main.c` containing EXTI and NVIC configurations, the critical section protection routines, and the target ISR.
* [ ] Clean compilation Makefile.

---

## ❓ Self-Check Questions
1. Why must the EXTI pending bit be cleared inside the ISR? What physically happens if you forget to write to the pending register bit?
2. What registers does the Cortex-M4 core push to the stack automatically during interrupt entry? Why are R4-R11 left off the stacking list, and who is responsible for protecting them?
3. How does priority grouping work inside the NVIC? Explain the difference between **Preemption Priority** and **Sub-priority**.
4. What is the role of the C compiler keyword `volatile` when applied to global variables shared between an ISR and `main()`? What happens if `volatile` is omitted?
5. Why should code inside an ISR run as fast as possible? What is the architectural penalty of placing long delay loops or processing calls inside an ISR?

---

## 🚀 Stretch Task (Optional)
Extend the NVIC driver to configure a second interrupt channel (e.g., EXTI1 mapped to pin PA1). Establish different priorities for EXTI0 (High priority) and EXTI1 (Low priority). Write code demonstrating preemption: trigger EXTI1, execute a delay loop, trigger EXTI0, and verify EXTI0 instantly interrupts EXTI1.

## 💡 Motivation Checkpoint
Using polling routines (`while(button_state == 0)`) to monitor events is highly inefficient; the CPU is wasted spinning in circles, unable to process other computations. Real-time systems operate strictly on **Interrupt-Driven Architectures**. But introducing interrupts introduces concurrency, which yields race conditions. Mastering NVIC, EXTI registers, and critical section isolation is standard requirement for high-reliability engineers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - EXTI configuration done strictly via direct register addresses.
  - Vector Table maps `EXTI0_IRQHandler` at index position 22.
  - Critical sections are isolated using assembly interrupt control instructions (`cpsid i` / `cpsie i`).
  - System executes flawlessly without lock-ups during rapid button presses.
* **Fail Criteria**:
  - Delay loops or polling loops inside ISR blocks.
  - Shared data access inside main loop executed without atomic protection wrappers.
