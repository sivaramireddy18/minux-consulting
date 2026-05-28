# Weekly Execution Plan: Week 21

## 🎯 Weekly Goal
Master resource synchronization in Real-Time Operating Systems, configure Binary and Counting Semaphores, implement Mutexes for exclusive resource locking, and analyze/resolve the critical issue of **Priority Inversion** utilizing **Priority Inheritance**.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Secure Shared Hardware Resource Manager** using FreeRTOS. They will understand the mathematical dynamics of priority scheduling, how to prevent race conditions when tasks share hardware interfaces, and how to verify that priority inheritance operates on physical tasks.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Binary Semaphores (Signaling & Task Sync)
* **Conceptual Objective**: Master the Binary Semaphore—a synchronization block that can hold a value of `0` (unavailable) or `1` (available). Differentiate between a semaphore and a lock: semaphores are designed for **task signaling** (Task A does work, then posts to the semaphore to signal Task B to execute) and do not have ownership (any task or ISR can post).
* **Practical Activity**:
  1. Learn how to initialize binary semaphores using `xSemaphoreCreateBinary()`.
  2. Implement a two-task signaling loop where Task 1 waits on `xSemaphoreTake` until Task 2 executes `xSemaphoreGive`.
* **Code/Circuit Reference**:
```c
#include "semphr.h"

SemaphoreHandle_t xSignalSem = NULL;

void vSenderTask(void *pvParameters) {
    while (1) {
        // Perform work...
        xSemaphoreGive(xSignalSem); // Signal receiver
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void vReceiverTask(void *pvParameters) {
    while (1) {
        if (xSemaphoreTake(xSignalSem, portMAX_DELAY) == pdTRUE) {
            // Wake up instantly on signal!
        }
    }
}
```

### Tuesday: Counting Semaphores (Resource Counting Pools)
* **Conceptual Objective**: Study Counting Semaphores—synchronization structures initialized with a maximum count value greater than 1. Understand how counting semaphores monitor a pool of identical resources (e.g., managing access to a buffer array containing 3 empty memory slots).
* **Practical Activity**:
  1. Initialize a counting semaphore using `xSemaphoreCreateCounting()`.
  2. Write a simulated printer-pool allocator managing 3 virtual print nodes across 5 requestor tasks.
* **Code/Circuit Reference**:
```c
// Create counting semaphore: Max Count = 3, Initial Count = 3
SemaphoreHandle_t xPoolSem = xSemaphoreCreateCounting(3, 3);

void vUserTask(void *pvParameters) {
    while (1) {
        if (xSemaphoreTake(xPoolSem, pdMS_TO_TICKS(100)) == pdTRUE) {
            // Acquired 1 resource from the pool of 3
            // Perform processing...
            xSemaphoreGive(xPoolSem); // Release back to pool
        }
    }
}
```

### Wednesday: Mutexes (Mutual Exclusion & Ownership)
* **Conceptual Objective**: Master the Mutual Exclusion (Mutex) primitive. Differentiate a Mutex from a Binary Semaphore:
  - **Ownership**: A mutex has a strict owner concept: the task that takes the mutex *must* be the task that releases it.
  - **Usage**: Mutexes are designed strictly for **mutual exclusion** (protecting a shared memory block or physical peripheral from concurrent access corruptions).
* **Practical Activity**:
  1. Initialize a mutex using `xSemaphoreCreateMutex()`.
  2. Write a driver where multiple tasks attempt to transmit data over a single UART port concurrently, protecting the UART peripheral from data interleavings using a Mutex.
* **Code/Circuit Reference**:
```c
SemaphoreHandle_t xUartMutex = NULL;

void print_uart_safe(const char *str) {
    if (xSemaphoreTake(xUartMutex, portMAX_DELAY) == pdTRUE) {
        // Crucial: Only one task can execute this block at a time
        while (*str) {
            write_char(*str++);
        }
        xSemaphoreGive(xUartMutex); // Release ownership
    }
}
```

### Thursday: The Priority Inversion Disaster
* **Conceptual Objective**: Deep-dive into **Priority Inversion**—a catastrophic real-time scheduling failure that occurs when a low-priority task holds a shared resource (via a simple semaphore) needed by a high-priority task, and a medium-priority task preempts the low-priority task, indefinitely blocking the high-priority task from executing. (Recall the classic Mars Pathfinder lock-up!).
* **Practical Activity**:
  1. Sketch a detailed timeline diagram showing three tasks (High, Med, Low) entering a priority inversion loop.
  2. Define the architectural sequence of the scheduling breakdown.
* **Code/Circuit Reference**:
```text
Priority Inversion Timeline (No Priority Inheritance):
Low Task (P1)  ---[Locks Sem]----------------------------------------->[Preempted by Med]--->
Med Task (P2)  ----------------------[Starts Running]----------------------------->
High Task (P3) -----------------[Blocks on Sem held by Low (Starved)]--------------->
* Medium Task (P2) is running, preventing Low Task (P1) from releasing the Semaphore.
* Consequently, High Task (P3) is indefinitely blocked (Inverted priority!).
```

### Friday: Resolving Priority Inversion via Priority Inheritance
* **Conceptual Objective**: Study how **Priority Inheritance** resolves Priority Inversion. When a high-priority task blocks on a Mutex held by a low-priority task, the kernel temporarily boosts the priority of the low-priority task to match that of the high-priority task. This allows the low-priority task to run, finish its critical section, and release the Mutex, at which point its priority is restored, and the high-priority task instantly preempts it and runs.
* **Practical Activity**:
  1. Configure FreeRTOS with Mutexes (priority inheritance is enabled by default in FreeRTOS mutexes).
  2. Write a test case spawning three tasks (High, Med, Low) sharing a Mutex.
  3. Observe priority inheritance preventing task starvation.
* **Code/Circuit Reference**:
```c
// FreeRTOS Mutex automatically applies Priority Inheritance!
SemaphoreHandle_t xInheritMutex = xSemaphoreCreateMutex();
```

---

## 🛠️ Hands-On Assignment: Secure Multi-Tasking UART Resource Manager

### Functional Requirements
Create a robust FreeRTOS application that implements a secure, synchronized UART printer driver, demonstrating and verifying the mechanics of Priority Inversion and Priority Inheritance.
1. The application must initialize three tasks:
   - **`vLowPriorityTask` (Priority 1)**: Periodically takes a shared lock, writes a long message (e.g., `"Low Task processing shared UART resource..."`) character-by-character to the UART, and holds the lock.
   - **`vMediumPriorityTask` (Priority 2)**: Periodically triggers a CPU-bound busy loop simulating calculations, running continuously without blocking.
   - **`vHighPriorityTask` (Priority 3)**: Spawns after a delay, attempts to take the shared lock, and writes a short message.
2. **Scenario 1 (Failure)**: Implement the shared lock using a standard **Binary Semaphore**. Run the system and observe Priority Inversion: the Medium Task preempts the Low Task, indefinitely starving the High Task. Show this starvation on your serial terminal.
3. **Scenario 2 (Success)**: Replace the Binary Semaphore with a **Mutex** (which possesses Priority Inheritance). Run the system and demonstrate that the Low Task's priority is boosted, allowing it to complete and release the lock, preventing the Medium Task from starving the High Task.
4. Capture timing differences and document your findings.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"
#include <stdio.h>

// Shared lock handles
SemaphoreHandle_t xSharedLock = NULL;

void vLowPriorityTask(void *pvParameters) {
    while (1) {
        if (xSemaphoreTake(xSharedLock, portMAX_DELAY) == pdTRUE) {
            printf("[LOW] Acquired Lock. Starting slow UART write...\n");
            
            // Simulate slow write
            for (int i = 0; i < 50; i++) {
                printf(".");
                fflush(stdout);
                vTaskDelay(pdMS_TO_TICKS(10)); // Yield slightly
            }
            printf("\n[LOW] Releasing Lock.\n");
            xSemaphoreGive(xSharedLock);
        }
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void vMediumPriorityTask(void *pvParameters) {
    vTaskDelay(pdMS_TO_TICKS(100)); // Start slightly after Low
    while (1) {
        printf("[MED] Running CPU Busy loop...\n");
        // Simulate busy loop
        for (volatile uint32_t i = 0; i < 5000000; i++);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

void vHighPriorityTask(void *pvParameters) {
    vTaskDelay(pdMS_TO_TICKS(200)); // Start last
    while (1) {
        printf("[HIGH] Attempting to acquire Lock...\n");
        if (xSemaphoreTake(xSharedLock, portMAX_DELAY) == pdTRUE) {
            printf("[HIGH] SUCCESS: Acquired Lock instantly!\n");
            xSemaphoreGive(xSharedLock);
        }
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
```

---

## 📦 Deliverables
* [ ] Source file `main.c` containing task definitions.
* [ ] Compilation Makefile.
* [ ] Output analysis log `inversion_proof.log` showing stdout prints of Scenario 1 (High task starved) vs Scenario 2 (High task runs successfully).

---

## ❓ Self-Check Questions
1. Why are Binary Semaphores considered unsafe for mutual exclusion? Explain how they differ from Mutexes regarding ownership and priority inheritance.
2. Walk through the Mars Pathfinder Priority Inversion bug. What were the task priorities, what was the shared resource, and how did engineers patch it remotely?
3. How does Priority Inheritance physically boost a task's priority? Trace what happens inside the TCB of the Low Task when the High Task attempts to take the Mutex.
4. Can you take or give a Mutex inside an Interrupt Service Routine (ISR)? Why does FreeRTOS restrict Mutex operations inside interrupt contexts?
5. What is a **Counting Semaphore**? Give a real-world example of when a counting semaphore should be used instead of a binary semaphore.

---

## 🚀 Stretch Task (Optional)
Implement a **Recursive Mutex** (`xSemaphoreCreateRecursiveMutex`) that allows a single task to take the lock multiple times nested-style without deadlocking itself, and verify stack releases.

## 💡 Motivation Checkpoint
Concurrency is the baseline of modern computing. But concurrent systems are highly vulnerable to race conditions and synchronization deadlocks. In automotive-grade firmwares, a single priority inversion on a braking or steering communication bus can cause physical accidents. Mastering synchronization primitives and priority inheritance is the primary rule of reliable firmware.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Code compiles without warnings with `-Wall -Wextra -Werror`.
  - Inversion demonstration shows successful isolation of tasks.
  - Priority Inheritance successfully bypasses Medium task preemptions.
* **Fail Criteria**:
  - Missing return status validations.
  - System lock-ups during execution due to unreleased locks.
