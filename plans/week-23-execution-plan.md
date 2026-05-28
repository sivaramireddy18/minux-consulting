# Weekly Execution Plan: Week 23

## 🎯 Weekly Goal
Master low-level dynamic memory allocation inside Real-Time Operating Systems, analyze the exact differences between the five FreeRTOS allocation models (`heap_1` to `heap_5`), configure stack overflow detection guards, and profile heap limits.

## 🏆 Weekly Outcome
By Friday, the student will have built a **Memory Sentinel Logger Utility** under FreeRTOS. They will have configured dynamic heap boundaries, resolved stack overflow hook triggers, and structured diagnostic routines that monitor and print available heap bytes and stack high-water marks in real-time.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The FreeRTOS Dynamic Heap Schemes (`heap_1` & `heap_2`)
* **Conceptual Objective**: Master the fundamental mechanics of FreeRTOS memory schemes:
  - **`heap_1`**: The simplest model. Only allows allocation (`pvPortMalloc`); once memory is allocated, it **cannot be freed**. This is the most secure and deterministic model, universally used in high-reliability firmwares where dynamic freeing is banned.
  - **`heap_2`**: Allows allocation and freeing, but does not merge (coalesce) adjacent free memory blocks. This is susceptible to severe fragmentation.
* **Practical Activity**:
  1. Compile a project using `heap_1` and verify that any attempt to free memory has no effect.
  2. Inspect memory layout registers in a debug map.
* **Code/Circuit Reference**:
```c
// heap_1.c core allocation concept:
// Moves a simple index offset along a static array.
// No free mechanism exists: vPortFree is an empty stub.
void vPortFree( void *pv ) {
    ( void ) pv;
    // Banned operation!
}
```

### Tuesday: Advanced Heap Allocators (`heap_3` & `heap_4`)
* **Conceptual Objective**: Master the standard dynamic allocators:
  - **`heap_3`**: A simple wrapper around standard C library `malloc` and `free`. It is non-deterministic and requires the compiler to set up linker heap spaces.
  - **`heap_4`**: The most widely used allocator. It manages a static byte array, allocates memory chunks, and automatically **coalesces (merges)** adjacent free blocks to prevent fragmentation. It is highly robust.
* **Practical Activity**:
  1. Compile a project using `heap_4`.
  2. Call `xPortGetFreeHeapSize()` and `xPortGetMinimumEverFreeHeapSize()` to trace memory metrics.
* **Code/Circuit Reference**:
```c
// Trace active heap metrics in heap_4
size_t free_bytes = xPortGetFreeHeapSize();
size_t min_free = xPortGetMinimumEverFreeHeapSize(); // High water mark of memory allocation
```

### Wednesday: Multi-Segment Heap Allocations via `heap_5`
* **Conceptual Objective**: Study `heap_5`. Differentiate it from `heap_4`: while `heap_4` only allows allocating from a single static array in SRAM, `heap_5` can span **multiple independent memory segments** across different physical RAM blocks (e.g., SRAM1, external SDRAM, CCM RAM) using `vPortDefineHeapRegions()`.
* **Practical Activity**:
  1. Construct a C region map defining two independent RAM segments.
  2. Initialize `heap_5` using the region array.
* **Code/Circuit Reference**:
```c
#include "FreeRTOS.h"

// Define independent memory regions
const HeapRegion_t xHeapRegions[] = {
    { (uint8_t*)0x20000000UL, 0x10000 }, // Region 1: 64KB in SRAM1
    { (uint8_t*)0x10000000UL, 0x08000 }, // Region 2: 32KB in CCM RAM
    { NULL, 0 } // Terminator
};

void init_heap_5(void) {
    // Must be called before any pvPortMalloc!
    vPortDefineHeapRegions(xHeapRegions); 
}
```

### Thursday: Stack Overflow Detection Hooks
* **Conceptual Objective**: Master Stack Overflow mechanics. Every task has its own private stack in SRAM. If a task nests deeply or allocates large local variables, it grows past its stack limits, corrupting adjacent TCB or task memory. Study the two FreeRTOS stack overflow check methods:
  - **Method 1**: Checks if the Stack Pointer grew past limits during context switches (fast, misses overflows occurring in the middle of task runs).
  - **Method 2**: Writes a dummy pattern at the end of the stack at task creation, and checks if the pattern is corrupted during context switches (slower, highly reliable).
* **Practical Activity**:
  1. Enable Method 2 in your configurations.
  2. Write the stack overflow hook handler.
* **Code/Circuit Reference**:
```c
// Inside FreeRTOSConfig.h:
#define configCHECK_FOR_STACK_OVERFLOW 2

// The application hook function executed automatically on overflow detection
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName) {
    // Trap execution! Safe diagnostic shutdown.
    printf("CRITICAL ERROR: Stack Overflow in task: %s\n", pcTaskName);
    while (1);
}
```

### Friday: Stack High-Water Mark Profiling
* **Conceptual Objective**: Learn how to profile task stack usage dynamically. The API `uxTaskGetStackHighWaterMark()` returns the minimum number of free stack bytes ever remaining in a task since it started running.
* **Practical Activity**:
  1. Write a periodic diagnostics task.
  2. Poll and print stack high-water marks for all running tasks.
* **Code/Circuit Reference**:
```c
void vDiagnosticsTask(void *pvParameters) {
    while (1) {
        // High-water mark return: closer to 0 means closer to overflow!
        UBaseType_t high_water = uxTaskGetStackHighWaterMark(NULL);
        printf("[DIAG] Stack High Water Mark: %u words\n", (unsigned int)high_water);
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
```

---

## 🛠️ Hands-On Assignment: RTOS Memory Sentinel & Leak Auditor

### Functional Requirements
Create a highly robust FreeRTOS application that implements a Memory Sentinel Logger, validating stack bounds and heap metrics under dynamic memory stresses.
1. Configure `FreeRTOSConfig.h` to enable:
   - `configCHECK_FOR_STACK_OVERFLOW` set to `2`.
   - `configSUPPORT_DYNAMIC_ALLOCATION` set to `1`.
2. Compile your application using the **`heap_4.c`** memory allocator.
3. Spawn three tasks:
   - **`vDynamicWorkerTask` (Priority 2)**: Dynamically allocates byte chunks of varying sizes ($100\dots 500$ bytes) using `pvPortMalloc()`, writes dummy values, and frees them using `vPortFree()`.
   - **`vRecursiveStackTask` (Priority 1)**: Executes a recursive calculation function. On each loop, increment local stack usage. This is designed to intentionally trigger a stack overflow for validation.
   - **`vSentinelTask` (Priority 3)**: Periodically (every 1 second) reads and prints: current free heap bytes, the minimum ever free heap bytes since boot, and the stack high-water marks of both worker tasks.
4. Implement the `vApplicationStackOverflowHook` handler.
5. Demonstrate the sentinel logging heap parameters cleanly on the console. Then, trigger the stack overflow task and verify that the system is safely trapped and logs the exact name of the overflowing task before halting.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include "FreeRTOS.h"
#include "task.h"
#include <stdio.h>

TaskHandle_t xDynamicWorkerHandle = NULL;
TaskHandle_t xStackWorkerHandle = NULL;

// Recursive function to force stack overflow
uint32_t recursive_sum(uint32_t n) {
    uint32_t large_array[16] = {0}; // Allocates 64 bytes on stack per call
    large_array[0] = n;
    if (n == 0) return 0;
    return large_array[0] + recursive_sum(n - 1);
}

void vRecursiveStackTask(void *pvParameters) {
    vTaskDelay(pdMS_TO_TICKS(3000)); // Let sentinel run first
    printf("[STACK WORKER] Starting recursive stack stress test...\n");
    recursive_sum(100); // Will trigger overflow hook!
    vTaskDelete(NULL);
}

void vDynamicWorkerTask(void *pvParameters) {
    while (1) {
        size_t size = 128 + (rand() % 256);
        void *ptr = pvPortMalloc(size);
        if (ptr != NULL) {
            // Simulate processing
            vTaskDelay(pdMS_TO_TICKS(50));
            vPortFree(ptr);
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void vSentinelTask(void *pvParameters) {
    while (1) {
        size_t free_heap = xPortGetFreeHeapSize();
        size_t min_heap = xPortGetMinimumEverFreeHeapSize();
        
        UBaseType_t dyn_stack = uxTaskGetStackHighWaterMark(xDynamicWorkerHandle);
        
        printf("[SENTINEL] Free Heap: %zu bytes | Min Ever Free: %zu bytes\n", free_heap, min_heap);
        printf("[SENTINEL] Dynamic Task Stack High-Water: %u words\n", (unsigned int)dyn_stack);
        
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName) {
    // Trapped execution safely
    printf("\nCRITICAL EMERGENCY: STACK OVERFLOW DETECTED!\n");
    printf("Offending Task: %s\n", pcTaskName);
    while (1); // Safe halt
}
```

---

## 📦 Deliverables
* [ ] Source file `main.c` containing tasks.
* [ ] Compilation Makefile.
* [ ] Console output log `memory_sentinel.log` showing:
  - Stable sentinel metrics of heap usage.
  - The exact crash traceback sequence showing the Stack Overflow Hook catching and trapping the `vRecursiveStackTask` overflow event.

---

## ❓ Self-Check Questions
1. Differentiate the memory behaviors of `heap_1` vs `heap_4`. Under what security parameters is `heap_1` mandatory inside flight controller firmwares?
2. What is the cause of **Heap Fragmentation**? How does `heap_4` resolve this issue compared to `heap_2`?
3. How does `heap_5` initialize multi-segment memory? Write a region structure mapping 32KB RAM at `0x20000000` and 64KB RAM at `0x10000000`.
4. Walk through the physical operations of the **Stack Overflow Check Method 2** inside FreeRTOS. What bytes are written at stack boundaries and when are they verified?
5. What is the unit of size returned by `uxTaskGetStackHighWaterMark()`? (Hint: is it in bytes or StackType_t words?).

---

## 🚀 Stretch Task (Optional)
Implement an **Out-Of-Memory Recovery Hook** (`vApplicationMallocFailedHook`) that automatically checks for dynamic allocation failures, frees cached telemetry buffers, and re-allocates memory safely without crashing the system.

## 💡 Motivation Checkpoint
A major cause of microcontroller failures inside autonomous devices is stack overflows. Because microcontrollers do not have physical MMU hardware to isolate memory pages, a stack overflow on one task silently overwrites global configurations, causing random crashes that are impossible to debug without proper diagnostic tracking hooks.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Memory sentinel log runs cleanly with heap tracking.
  - Stack overflow hook successfully catches the recursive overflow and prints the exact task name before halting.
  - Zero compiler warnings.
* **Fail Criteria**:
  - Use of standard library `malloc()` or `free()` inside FreeRTOS tasks.
  - Missing stack overflow hook registrations.
