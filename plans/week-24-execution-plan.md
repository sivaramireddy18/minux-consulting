# Weekly Execution Plan: Week 24

## 🎯 Weekly Goal
Master FreeRTOS Software Timers, understand the exact mechanics of ISR-to-task communication utilizing safe `FromISR` API variants, implement deferred interrupt processing, and execute real-time execution profiling.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Deferred Interrupt Debouncer & Timer Controller** using FreeRTOS. They will understand how to write safe ISR handlers that communicate with tasks without locking the kernel scheduler, how to configure software timers (one-shot vs auto-reload), and how to complete the Phase 4 Milestone Challenge.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: FreeRTOS Software Timers (One-Shot vs Auto-Reload)
* **Conceptual Objective**: Master Software Timers—timers managed by the RTOS kernel daemon task (`prvTimerTask`). Differentiate between:
  - **One-Shot Timers**: Execute their callback function exactly once when they expire, and stop.
  - **Auto-Reload Timers**: Automatically restart their timing period every time they expire, generating periodic callbacks.
* **Practical Activity**:
  1. Learn how to initialize software timers using `xTimerCreate()` and start/stop them using `xTimerStart()`.
  2. Differentiate timer callback constraints (callbacks execute inside the timer daemon task context and must *never* block or call blocking APIs).
* **Code/Circuit Reference**:
```c
#include "timers.h"

TimerHandle_t xAutoTimer = NULL;

void vTimerCallback(TimerHandle_t xTimer) {
    // Executes in the daemon task context.
    // Banned: vTaskDelay or any blocking queue take!
    toggle_pin(); 
}

void init_timers(void) {
    xAutoTimer = xTimerCreate(
        "Periodic_Timer", 
        pdMS_TO_TICKS(1000), // 1 second period
        pdTRUE, // Auto-Reload
        (void*)0, // Timer ID
        vTimerCallback
    );
    xTimerStart(xAutoTimer, 0);
}
```

### Tuesday: The Timer Daemon Task Configuration
* **Conceptual Objective**: Study how software timers are scheduled. Software timers are not hardware interrupts; they are managed by the kernel's **Timer Service/Daemon Task** (`prvTimerTask`). Master configurations inside `FreeRTOSConfig.h`: `configUSE_TIMERS`, `configTIMER_TASK_PRIORITY`, and `configTIMER_QUEUE_LENGTH`.
* **Practical Activity**:
  1. Deep-dive into `timers.c` to locate and analyze the timer command queue mechanism.
  2. Differentiate why the timer task priority must normally be set high to prevent timing delays.
* **Code/Circuit Reference**:
```c
/* FreeRTOSConfig.h Timer settings */
#define configUSE_TIMERS             1
#define configTIMER_TASK_PRIORITY    (configMAX_PRIORITIES - 1) // Set High
#define configTIMER_QUEUE_LENGTH     10
#define configTIMER_TASK_STACK_DEPTH (configMINIMAL_STACK_SIZE * 2)
```

### Wednesday: ISR-to-Task Communication & `FromISR` APIs
* **Conceptual Objective**: Master the strict segregation between Task execution context and Interrupt execution context. Standard FreeRTOS APIs (like `xQueueSend` or `xSemaphoreGive`) are banned inside an ISR because they can cause the scheduler to switch contexts in the middle of an interrupt, leading to immediate system crashes. You must exclusively use **`FromISR` API variants** (e.g., `xQueueSendFromISR`, `xSemaphoreGiveFromISR`).
* **Practical Activity**:
  1. Study `FromISR` signatures.
  2. Differentiate the role of the `pxHigherPriorityTaskWoken` parameter.
* **Code/Circuit Reference**:
```c
// Sending to a queue safely inside an ISR
void EXTI0_IRQHandler(void) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    if (*EXTI_PR & (1U << 0)) {
        uint32_t val = 42;
        // FromISR call with wake tracking
        xQueueSendFromISR(xTelemetryQueue, &val, &xHigherPriorityTaskWoken);
        
        // Clear pending interrupt flag
        *EXTI_PR = (1U << 0);
        
        // Force a context switch if a higher priority task was unblocked
        portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
    }
}
```

### Thursday: Deferred Interrupt Processing (Bottom-Half Design)
* **Conceptual Objective**: Understand that to maintain a responsive real-time system, code inside ISRs must be minimal (top-half: save state, clear flag, signal task). The actual, slow processing of the interrupt data must be deferred (bottom-half) to a high-priority task unblocked dynamically by the ISR using a Task Notification or Semaphore.
* **Practical Activity**:
  1. Write a button interrupt handler that defers processing.
  2. The ISR sends a task notification, and a high-priority task unblocks instantly to execute the debounce logic.
* **Code/Circuit Reference**:
```c
// ISR (Top-half): Simple, ultra-fast signaling
void EXTI15_10_IRQHandler(void) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    vTaskNotifyGiveFromISR(xDeferredTaskHandle, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
```

### Friday: Real-Time Execution Profiling & Milestone 4 Setup
* **Conceptual Objective**: Study real-time execution analysis. Learn how to configure runtime statistics (`configGENERATE_RUN_TIME_STATS`) to measure exactly how much CPU time in percent each task consumed. Complete the Phase 4 Milestone Challenge.
* **Practical Activity**:
  1. Configure a high-speed hardware timer to act as the runtime stats clock.
  2. Print the execution time table to the UART console.
* **Code/Circuit Reference**:
```c
// Print human-readable runtime table
char stats_buffer[512];
vTaskGetRunTimeStats(stats_buffer);
printf("%s\n", stats_buffer);
```

---

## 🛠️ Hands-On Assignment: Deferred Interrupt Debouncer & Software Timer Controller

### Functional Requirements
Create a highly robust, bare-metal and FreeRTOS application that implements a Deferred Interrupt Button Debouncer and coordinates LED indicators using Software Timers.
1. Configure **EXTI0** linked to Button PA0 to generate a hardware rising-edge interrupt.
2. Implement **`EXTI0_IRQHandler`**. The ISR must be minimal: send a direct **Task Notification** to `vDeferredDebounceTask` and yield using `portYIELD_FROM_ISR`.
3. Implement **`vDeferredDebounceTask` (Priority 3 - High)**:
   - Blocks on `ulTaskNotifyTake(pdTRUE, portMAX_DELAY)`.
   - Upon unblocking, start a 50ms **One-Shot Software Timer** (`xDebounceTimer`) to simulate debounce wait time.
4. Implement the **`xDebounceTimer` Callback**:
   - Executes 50ms after the physical button press.
   - Verifies the physical PA0 pin state. If the pin is still High, toggle LED PD12 and toggle a periodic **Auto-Reload Software Timer** (`xLedAlertTimer`) that blinks PD13 continuously.
5. In `main.c`:
   - Initialize FreeRTOS software timers.
   - Enable EXTI0 interrupts in the NVIC.
   - Run the scheduler.
6. Verify deferred response timings: capture the signal delay on your logic analyzer to prove the 50ms debounce gap.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include "FreeRTOS.h"
#include "task.h"
#include "timers.h"
#include <stdio.h>

TaskHandle_t xDeferredDebounceHandle = NULL;
TimerHandle_t xDebounceTimer = NULL;
TimerHandle_t xLedAlertTimer = NULL;

void vDebounceTimerCallback(TimerHandle_t xTimer) {
    // 50ms has elapsed. Verify pin PA0 state.
    volatile uint32_t *idr = (volatile uint32_t*)0x40020010U;
    if (*idr & (1U << 0)) { // Button still pressed
        printf("[TIMER] Debounced Button Press Confirmed! Toggling Alert Timer.\n");
        // Start or Stop the periodic alert timer
        if (xTimerIsTimerActive(xLedAlertTimer)) {
            xTimerStop(xLedAlertTimer, 0);
            *((volatile uint32_t*)0x40020C18U) = (1U << (13 + 16)); // Turn off PD13
        } else {
            xTimerStart(xLedAlertTimer, 0);
        }
    }
}

void vLedAlertCallback(TimerHandle_t xTimer) {
    // Toggles PD13 every 500ms
    volatile uint32_t *odr = (volatile uint32_t*)0x40020C14U;
    *odr ^= (1U << 13);
}

void vDeferredDebounceTask(void *pvParameters) {
    while (1) {
        // Block until ISR signals button press
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
        printf("[DEFERRED TASK] ISR received. Launching 50ms software debounce timer...\n");
        xTimerStart(xDebounceTimer, 0);
    }
}

void EXTI0_IRQHandler(void) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    volatile uint32_t *pr = (volatile uint32_t*)0x40013C14U;

    if (*pr & (1U << 0)) {
        // Signal the deferred task instantly
        vTaskNotifyGiveFromISR(xDeferredDebounceHandle, &xHigherPriorityTaskWoken);
        
        *pr = (1U << 0); // Clear pending bit
        portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
    }
}
```

---

## 📦 Deliverables
* [ ] Updated `startup.c` with the `EXTI0_IRQHandler` vector hook.
* [ ] Application source code `main.c`.
* [ ] Compilation Makefile.
* [ ] Console output report `deferred_timers.log` showing:
  - Startup logs.
  - Software debounce confirmation logs.
  - Periodic alert timer starts and stops.

---

## ❓ Self-Check Questions
1. Why are standard blocking APIs (like `vTaskDelay`) strictly banned inside Software Timer Callback functions? What happens to the system if a callback blocks?
2. Trace the parameter `pxHigherPriorityTaskWoken` inside `FromISR` API calls. What does it physically do, and why is `portYIELD_FROM_ISR()` required?
3. Differentiate between a **Top-Half** and a **Bottom-Half** interrupt design. Why is this model mandatory for high-performance, real-time operating systems?
4. What is the role of the Timer Service/Daemon Task (`prvTimerTask`)? Which priority should it hold compared to other tasks?
5. How does a one-shot software timer physically differ from an auto-reload software timer?

---

## 🚀 Stretch Task (Optional)
Configure FreeRTOS **Runtime Stats** using a custom timer. Implement a terminal command parsing interface that dynamically prints task execution runtime percentages on a UART console when requested.

## 💡 Motivation Checkpoint
High-reliability real-time firmwares require absolute timing deterministic parameters. When an critical interrupt fires, the CPU must exit the hardware handler as fast as possible to avoid blocking other hardware lines. Deferred interrupt processing using `FromISR` Task Notifications is the universal design pattern of elite firmware engineers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - `EXTI0_IRQHandler` only triggers notifications, containing no loops or prints.
  - Software debounce timer accurately waits 50ms before evaluating button state.
  - Periodic alert timers trigger stable blinks.
* **Fail Criteria**:
  - Use of raw delay functions inside ISRs or Callback functions.
  - Missing interrupt pending cleans.
