# Weekly Execution Plan: Week 19

## 🎯 Weekly Goal
Master the core concepts of Real-Time Operating Systems (RTOS), understand the architecture of FreeRTOS, learn how task control blocks (TCBs) are allocated in SRAM, and write modular, multi-tasking software architectures using task creation APIs.

## 🏆 Weekly Outcome
By Friday, the student will have successfully integrated a custom **FreeRTOS Port** on the STM32F4 microcontroller. They will have configured the FreeRTOS config file from scratch, spawned multiple tasks executing concurrently, and structured tasks with distinct priorities and stack parameters.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The RTOS Paradigm & Core Real-Time Parameters
* **Conceptual Objective**: Master the fundamental differences between bare-metal super-loops (`while(1)`) and multi-tasking real-time operating systems. Differentiate between Hard Real-Time (missing a deadline results in system failure, e.g., automotive ABS systems) and Soft Real-Time (missed deadlines degrade performance but are not catastrophic). Understand deterministic scheduling.
* **Practical Activity**:
  1. Sketch a block diagram comparing a bare-metal interrupt-polling model with an RTOS context-switching architecture.
  2. Define the real-time parameter definitions: Latency, Jitter, and Deadlines.
* **Code/Circuit Reference**:
```text
Bare-Metal Super-Loop (Sequential):
  main() -> Task_A() -> Task_B() -> Task_C() --+
    ^                                          |
    +------------------------------------------+
    * If Task_B blocks or delays, Task_C is starved!

RTOS Preemptive Model (Concurrent):
  Task_A (High Priority)   ---[Running]-------------> [Block]-------->[Running]->
  Task_B (Low Priority)    ------------[Ready]-> [Running]---> [Preempted]---->
    * The RTOS Scheduler swaps tasks dynamically based on priority.
```

### Tuesday: FreeRTOS Architecture & The Task Control Block (TCB)
* **Conceptual Objective**: Study how FreeRTOS tracks execution states. Understand the **Task Control Block (TCB)**—the primary kernel structure in SRAM representing a task:
  - Task Stack Pointer (holds the current top-of-stack of the task).
  - Task Priority.
  - Task State (Running, Ready, Blocked, Suspended).
  - Link pointers to join task-state lists.
* **Practical Activity**:
  1. Deep-dive into FreeRTOS source file `tasks.c` to locate and analyze the `TCB_t` structure.
  2. Calculate stack requirements for tasks based on local variables sizes.
* **Code/Circuit Reference**:
```c
/* Conceptual TCB structure layout in SRAM */
typedef struct tskTaskControlBlock {
    volatile StackType_t *pxTopOfStack; // Must be first member!
    ListItem_t xStateListItem;          // Task state list link
    ListItem_t xEventListItem;          // Event list link
    UBaseType_t uxPriority;             // Task Priority
    StackType_t *pxStack;               // Start address of stack
    char pcTaskName[configMAX_TASK_NAME_LEN];
} TCB_t;
```

### Wednesday: Mastering FreeRTOS Configurations
* **Conceptual Objective**: Master `FreeRTOSConfig.h`—the core configuration file that selectively enables kernel compilation modules. Study critical configuration definitions: `configCPU_CLOCK_HZ`, `configTICK_RATE_HZ` (system tick timer speed), `configMAX_PRIORITIES`, `configMINIMAL_STACK_SIZE`, and scheduling settings.
* **Practical Activity**:
  1. Construct a clean, minimal `FreeRTOSConfig.h` for the STM32F4.
  2. Differentiate `configUSE_PREEMPTION` (preemptive vs co-operative scheduling models).
* **Code/Circuit Reference**:
```c
/* Minimal FreeRTOSConfig.h for STM32F4 */
#ifndef FREERTOS_CONFIG_H
#define FREERTOS_CONFIG_H

#define configUSE_PREEMPTION                    1
#define configUSE_PORT_OPTIMISED_TASK_SELECTION 1
#define configCPU_CLOCK_HZ                      (16000000UL) // 16MHz clock
#define configTICK_RATE_HZ                      ((TickType_t)1000) // 1ms tick
#define configMAX_PRIORITIES                    (5)
#define configMINIMAL_STACK_SIZE                ((unsigned short)130)
#define configTOTAL_HEAP_SIZE                   ((size_t)(10 * 1024))
#define configMAX_TASK_NAME_LEN                 (16)

#define vPortSVCHandler                         SVC_Handler
#define xPortPendSVHandler                      PendSV_Handler
#define xPortSysTickHandler                     SysTick_Handler

#endif /* FREERTOS_CONFIG_H */
```

### Thursday: Spawning Tasks via `xTaskCreate`
* **Conceptual Objective**: Master task creation API `xTaskCreate()`. Differentiate parameters: Task Function Pointer, Task Name (string), Stack Depth (number of StackType_t variables, typically 32-bit values), Argument Parameter (`void*`), Priority, and the Task Handle output. Understand task function signatures (`void worker(void *pvParameters)` containing an infinite loop that must never return).
* **Practical Activity**:
  1. Write a program initializing 2 separate task functions with different priorities.
  2. Implement local print notifications inside each loop.
* **Code/Circuit Reference**:
```c
void vTask1(void *pvParameters) {
    (void)pvParameters;
    while (1) {
        // Task operations
        // Task must block using vTaskDelay to yield CPU!
        vTaskDelay(pdMS_TO_TICKS(500)); 
    }
}

void main(void) {
    // Spawn task
    xTaskCreate(vTask1, "Task_One", 128, NULL, 2, NULL);
    vTaskStartScheduler(); // Starts ticks and jumps to first task
}
```

### Friday: The Idle Task & Dynamic Thread starvations
* **Conceptual Objective**: Study the **Idle Task**—automatically spawned by the kernel when the scheduler starts, running at priority `0`. Understand that the Idle Task keeps the CPU from locking when all application tasks are in the Blocked state, and executes memory reclamation of terminated tasks.
* **Practical Activity**:
  1. Write a program where a high-priority task enters an infinite loop without calling block or delay APIs (`vTaskDelay`).
  2. Observe how the high-priority task starves all lower-priority tasks and the Idle task, locking execution.
* **Code/Circuit Reference**:
```c
void vStarvationTask(void *pvParameters) {
    (void)pvParameters;
    while (1) {
        // Busy loop (no vTaskDelay).
        // Starves any task of priority < current!
    }
}
```

---

## 🛠️ Hands-On Assignment: Custom Ported Concurrent LED Blinker

### Functional Requirements
Create a fully modular FreeRTOS application compiling natively on the STM32F4 using your custom startup/linker tools, spawning concurrent task threads.
1. The project must compile the core FreeRTOS source files: `tasks.c`, `list.c`, `queue.c`, `port.c` (Cortex-M4 Port), and `heap_4.c` (dynamic memory).
2. Configure `FreeRTOSConfig.h` to set the system clock to 16MHz and ticks to 1ms.
3. Spawn two distinct tasks:
   - **`vLedGreenTask` (Priority 2)**: Toggles LED PD12 every 200ms.
   - **`vLedRedTask` (Priority 1)**: Toggles LED PD14 every 600ms.
4. Utilize `vTaskDelay` exclusively inside the task loops to manage timing. Do *not* use bare-metal delay loops.
5. In `startup.c`, ensure the Vector Table routes `SVC_Handler`, `PendSV_Handler`, and `SysTick_Handler` to their matching FreeRTOS port entry points (defined as aliases in your config file).
6. Verify concurrent execution: hook up your logic analyzer to PD12 and PD14 to capture the stable, non-interfering blink cycles.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include "FreeRTOS.h"
#include "task.h"
#include <stdint.h>

void vLedGreenTask(void *pvParameters) {
    volatile uint32_t *odr = (volatile uint32_t*)0x40020C14U;
    while (1) {
        *odr ^= (1U << 12); // Toggle PD12
        vTaskDelay(pdMS_TO_TICKS(200));
    }
}

void vLedRedTask(void *pvParameters) {
    volatile uint32_t *odr = (volatile uint32_t*)0x40020C14U;
    while (1) {
        *odr ^= (1U << 14); // Toggle PD14
        vTaskDelay(pdMS_TO_TICKS(600));
    }
}

void configure_leds(void) {
    // Enable GPIOD Clock
    *((volatile uint32_t*)0x40023830U) |= (1U << 3);
    
    // Configure PD12 and PD14 as output
    volatile uint32_t *moder = (volatile uint32_t*)0x40020C00U;
    *moder &= ~((3U << (12 * 2)) | (3U << (14 * 2)));
    *moder |=  ((1U << (12 * 2)) | (1U << (14 * 2)));
}

int main(void) {
    configure_leds();

    // Spawn green task (High Priority)
    xTaskCreate(vLedGreenTask, "Green_Blinker", 128, NULL, 2, NULL);

    // Spawn red task (Low Priority)
    xTaskCreate(vLedRedTask, "Red_Blinker", 128, NULL, 1, NULL);

    // Start Scheduler (does not return)
    vTaskStartScheduler();

    while (1);
    return 0;
}
```

---

## 📦 Deliverables
* [ ] Complete project directory containing FreeRTOS source libraries.
* [ ] Configured `FreeRTOSConfig.h` and updated bare-metal `startup.c`.
* [ ] Compilation Makefile building dynamic binaries cleanly.
* [ ] Capture trace waveform `rtos_blink.log` proving concurrent execution frequencies of both tasks.

---

## ❓ Self-Check Questions
1. Differentiate **Preemptive Scheduling** from **Co-operative Scheduling**. How does setting `configUSE_PREEMPTION` to `0` change task execution dynamics?
2. What are the mechanical roles of `SVC_Handler` and `PendSV_Handler` inside the FreeRTOS context-switching pipeline?
3. Why does the TCB structure place the `pxTopOfStack` pointer as the very first member? How does the assembly port utilize this layout during context swaps?
4. What is **Task Starvation**? How do you prevent a high-priority CPU-bound task from starving low-priority threads?
5. What is the role of the Idle Task inside FreeRTOS? Can you put the processor into a sleep mode inside the Idle Task hook function to conserve energy?

---

## 🚀 Stretch Task (Optional)
Implement an **Idle Task Hook function** (`vApplicationIdleHook`) that configures the microcontroller core to enter low-power sleep mode (`__WFI` - Wait For Interrupt) whenever the CPU is inactive, wake up dynamically on task timers, and output CPU usage metrics.

## 💡 Motivation Checkpoint
Bare-metal firmware super-loops are completely unsuitable for complex modern designs: if a single peripheral locks up while polling, the entire system freezes. Operating systems (RTOS) resolve this by enforcing time-slice preemption and priority guarantees. Mastering FreeRTOS configurations, TCB architectures, and scheduler ports is a core step to building industrial IoT firmwares.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Tasks compile and run successfully using FreeRTOS.
  - Context switching functions cleanly (LEDs flash concurrently).
  - Standard delay routines are banned (must use `vTaskDelay`).
* **Fail Criteria**:
  - Task execution blocks due to incorrect Vector Table routing of handlers.
  - Direct stack manipulations inside task functions.
