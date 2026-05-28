# Weekly Execution Plan: Week 20

## 🎯 Weekly Goal
Master the FreeRTOS Task State Machine, understand the mathematical mechanics of Preemptive vs Co-operative scheduling, and analyze the low-level assembly sequence of a CPU Context Switch.

## 🏆 Weekly Outcome
By Friday, the student will have built a **Context Switch Visualizer Utility** in C/Assembly. They will understand how registers are pushed and popped during task transitions, how the processor manipulates the Stack Pointer (SP) inside PendSV handlers, and how task state lists (Ready, Blocked, Suspended) are sorted dynamically by the kernel.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The FreeRTOS Task State Machine
* **Conceptual Objective**: Master the lifecycle states of a task:
  - **Running**: The CPU is actively executing the task's instructions.
  - **Ready**: Task is eligible for execution but a higher or equal priority task is running.
  - **Blocked**: Task is waiting for a temporal delay (`vTaskDelay`) or an event trigger (semaphore, queue, notification).
  - **Suspended**: Task is explicitly removed from scheduling.
* **Practical Activity**:
  1. Sketch the complete State Transition Diagram of FreeRTOS tasks.
  2. Write a task that transitions dynamically between Ready, Blocked, and Suspended states using `vTaskSuspend` and `vTaskResume`.
* **Code/Circuit Reference**:
```text
FreeRTOS Task State Transitions:
      +-----------------------------------------+
      |                                         |
      v                                         |
[Suspended] --(vTaskResume)--> [Ready] --(Scheduled)--> [Running]
  ^                             ^                         |
  |                             |                         +--(vTaskDelay)--> [Blocked]
  +-------(vTaskSuspend)--------+-------------------------+                    |
                                                                               |
                                <---(Event or Timer expires)-------------------+
```

### Tuesday: Preemptive vs Co-operative Scheduling Algorithms
* **Conceptual Objective**: Study the scheduling engines:
  - **Preemptive Time-Slicing**: The scheduler forces equal-priority tasks to swap execution every system tick (round-robin), and instantly preempts lower-priority tasks when a high-priority task becomes ready.
  - **Co-operative**: Running tasks execute continuously until they explicitly yield control (`taskYIELD()`) or block.
* **Practical Activity**:
  1. Configure two identical priority tasks.
  2. Observe scheduling execution traces under preemptive mode versus co-operative mode.
* **Code/Circuit Reference**:
```c
// Force current task to yield CPU to another ready task of equal priority
void vCooperativeWorker(void *pvParameters) {
    while (1) {
        // Perform processing chunk...
        taskYIELD(); // Yield control dynamically
    }
}
```

### Wednesday: Context Switch Mechanics I (The SysTick Trigger)
* **Conceptual Objective**: Understand how a context switch is initiated. A context switch is triggered either by a task blocking (e.g., calling `vTaskDelay`) or by the **SysTick Timer interrupt** firing every 1ms. The SysTick handler checks if a higher priority task is ready or if time-slicing is needed, and requests a **PendSV Exception** by writing to the Interrupt Control State Register (ICSR).
* **Practical Activity**:
  1. Deep-dive into PendSV exception routing.
  2. Trace SysTick interrupt triggers in assembly.
* **Code/Circuit Reference**:
```c
// Triggering a PendSV exception programmatically via ICSR register
#define SCB_ICSR           ((volatile uint32_t*)0xE000ED04U)
#define SCB_ICSR_PENDSVSET (1U << 28)

void trigger_pendsv_yield(void) {
    *SCB_ICSR = SCB_ICSR_PENDSVSET; // Request PendSV execution
}
```

### Thursday: Context Switch Mechanics II (Assembly Register Stacking)
* **Conceptual Objective**: Master the assembly-level mechanics of the PendSV Handler during a context swap:
  1. Hardware automatically stacks **R0-R3, R12, LR, PC, xPSR** registers onto the active stack pointer.
  2. Assembly code blocks interrupts and manually stacks remaining registers **R4-R11** using `push` or `stmdb` instructions.
  3. Load the address of the current TCB structure. Save the current Stack Pointer to `pxTopOfStack`.
  4. Call the C scheduler function `vTaskSwitchContext` to update `pxCurrentTCB` to point to the new highest-priority Ready task.
  5. Load the new Stack Pointer from the new TCB's `pxTopOfStack`.
  6. Manually pop registers **R4-R11** from the new stack.
  7. Exit PendSV. Hardware automatically restores **R0-R3, R12, LR, PC, xPSR** from the new stack.
* **Practical Activity**:
  1. Study the physical ARM Cortex-M4 assembly code inside FreeRTOS port file `port.c`.
  2. Draw stack structures showing values before and after context swaps.
* **Code/Circuit Reference**:
```assembly
/* Conceptual PendSV assembly implementation (Cortex-M) */
.thumb
.align 2
.global xPortPendSVHandler
xPortPendSVHandler:
    mrs r0, psp                 /* Get active Process Stack Pointer (PSP) */
    
    ldr r3, =pxCurrentTCB       /* Get current TCB address pointer */
    ldr r2, [r3]                /* Load current TCB memory block */
    
    stmdb r0!, {r4-r11}         /* Manually push R4-R11 to PSP stack */
    str r0, [r2]                /* Save new top of stack pointer inside TCB */
    
    bl vTaskSwitchContext       /* Call C function to select next task */
    
    ldr r3, =pxCurrentTCB
    ldr r2, [r3]
    ldr r0, [r2]                /* Load new stack pointer address from TCB */
    
    ldmia r0!, {r4-r11}         /* Manually pop R4-R11 from new stack */
    msr psp, r0                 /* Update PSP to point to new stack */
    bx lr                       /* Exit. Hardware automatically pops R0-R3 etc. */
```

### Friday: Task Yielding & List Operations
* **Conceptual Objective**: Understand how the kernel manages task list transitions. When a task delays, it is removed from the `pxReadyTasksLists` array and linked to `pxDelayedTaskList`. Learn how list heads are traversed dynamically during scheduling context switches.
* **Practical Activity**:
  1. Trace task list linkings inside `list.c`.
  2. Document list traversal speeds.

---

## 🛠️ Hands-On Assignment: Assembly Context Switch Visualizer

### Functional Requirements
Create a mock context switch visualizer application in C that simulates the register state transformations of two tasks during a context switch.
1. The application must define a structure `mock_stack_frame_t` representing the register layout of an ARM stack frame after a context swap (containing R0-R12, LR, PC, xPSR).
2. Allocate separate `uint32_t stack_task_a[256]` and `stack_task_b[256]` arrays.
3. Write an initialization function `void init_mock_stack(uint32_t *stack, void (*task_func)(void))` that programmatically writes initial values into the stack arrays:
   - Sets the initial PC to the address of the task function.
   - Sets the initial xPSR to `0x01000000` (thumb mode active).
   - Set general purpose registers to unique dummy signatures (e.g., R0 = `0x00000000`, R4 = `0x44444444`).
4. Write a simulated context switch function `void simulate_context_switch(uint32_t **current_sp, uint32_t *new_sp)` in C/Assembly. This function must simulate saving the "registers" of Task A, switching stack pointers, and loading the "registers" of Task B.
5. Print out the step-by-step register states to verify successful stack frame initialization and execution transitions.

### Structural Requirements & Code Skeleton
**`switch_visualizer.c` (C-Skeleton)**:
```c
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct {
    // Manually stacked registers (R4 - R11)
    uint32_t r4;  uint32_t r5;  uint32_t r6;  uint32_t r7;
    uint32_t r8;  uint32_t r9;  uint32_t r10; uint32_t r11;
    // Automatically stacked registers (R0 - R3, R12, LR, PC, xPSR)
    uint32_t r0;  uint32_t r1;  uint32_t r2;  uint32_t r3;
    uint32_t r12; uint32_t lr;  uint32_t pc;  uint32_t xpsr;
} mock_stack_frame_t;

void task_a(void) { printf("Inside Virtual Task A!\n"); }
void task_b(void) { printf("Inside Virtual Task B!\n"); }

uint32_t* init_mock_stack(uint32_t *stack_limit, void (*task_func)(void), uint32_t task_id) {
    // Align pointer to the top of stack
    mock_stack_frame_t *frame = (mock_stack_frame_t*)(stack_limit - sizeof(mock_stack_frame_t)/sizeof(uint32_t));
    
    // Initialize automatic registers
    frame->xpsr = 0x01000000; // Thumb mode
    frame->pc = (uint32_t)task_func;
    frame->lr = 0xDEADBEEF;   // Dummy return address
    frame->r12 = 0x12121212;
    frame->r3 = 0x33333333;
    frame->r2 = 0x22222222;
    frame->r1 = 0x11111111;
    frame->r0 = task_id;      // Pass Task ID in R0!

    // Initialize manual registers
    frame->r11 = 0x11111111;
    frame->r10 = 0x10101010;
    frame->r9 = 0x09090909;
    frame->r8 = 0x08080808;
    frame->r7 = 0x07070707;
    frame->r6 = 0x06060606;
    frame->r5 = 0x05050505;
    frame->r4 = 0x04040404;

    return (uint32_t*)frame; // Return new Top of Stack pointer
}

void print_stack_frame(const uint32_t *sp) {
    const mock_stack_frame_t *frame = (const mock_stack_frame_t*)sp;
    printf("--- Stack Frame Dump (SP = %p) ---\n", (void*)sp);
    printf("  PC  : 0x%08X | xPSR: 0x%08X\n", frame->pc, frame->xpsr);
    printf("  R0  : 0x%08X | LR  : 0x%08X\n", frame->r0, frame->lr);
    printf("  R4  : 0x%08X | R5  : 0x%08X\n", frame->r4, frame->r5);
    printf("  R11 : 0x%08X | R12 : 0x%08X\n", frame->r11, frame->r12);
    printf("----------------------------------------\n");
}
```

---

## 📦 Deliverables
* [ ] Visualizer C source file `switch_visualizer.c`.
* [ ] Compilation Makefile compiling under standard warnings.
* [ ] Output analysis report `context_swap_flow.txt` documenting the step-by-step register changes during stack transitions.

---

## ❓ Self-Check Questions
1. Why must a task function block inside FreeRTOS (e.g., using `vTaskDelay`) instead of running simple empty loops? What happens physically to the ready task lists if a task runs a CPU-bound loop?
2. What are the four core task states in FreeRTOS? Which state does a task enter when it is waiting for an I2C data packet to arrive?
3. Why are context switches executed inside the **PendSV exception handler** instead of directly inside the SysTick timer handler? Differentiate execution priority contexts.
4. Explain step-by-step what CPU registers are stacked by hardware and what are stacked by software during Cortex-M interrupt entries.
5. What does the variable `pxCurrentTCB` represent inside the FreeRTOS kernel? How does `vTaskSwitchContext()` modify it?

---

## 🚀 Stretch Task (Optional)
Implement a **Run-Time Performance Monitor** script in C that reads the stack pointers dynamically during task executions and prints active stack usage percentages.

## 💡 Motivation Checkpoint
Context switching is the magic that allows a single CPU core to run dozens of threads concurrently, creating the illusion of parallel processing. But context switching is highly timing-critical: every register push/pop adds execution latency. Mastering the low-level assembly dynamics of PendSV is standard requirement for real-time systems designers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Virtual stack frames are correctly initialized with Thumb mode and program addresses.
  - Context switch simulation runs successfully without address faults or memory leaks.
  - Logic analyzer/assembly traces verify correct register assignments.
* **Fail Criteria**:
  - Unaligned stack pointer bounds.
  - System lock-up due to incorrect context calculations.
