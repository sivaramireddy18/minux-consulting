# Microscopic Daily Vetting Specification
## Phase 6: Custom Allocators | Day 30: Memory Leaks Audits and Dynamic Wrapper Sentinels

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 30 of 45 | Phase: Phase 6: Custom Allocators
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study how memory leaks occur when dynamically allocated objects lose their referencing pointers before deallocation. Explore wrapper methods to intercept memory allocations. Learn how to write custom allocation sentinels that record allocations and matching frees to generate leaks diagnostics on exit.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write custom debug wrappers 'my_malloc' and 'my_free'. Implement a global ledger tracking active pointers, allocations sizes, source file locations, and line numbers. Print a report detailing all outstanding leaks on program exit.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Dynamic memory tracking audit wrapper
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    void  *address;
    size_t size;
    const char *file;
    int    line;
} alloc_tracker_t;

#define MAX_TRACKED_ALLOCS 100
static alloc_tracker_t ledger[MAX_TRACKED_ALLOCS];
static int ledger_count = 0;

void *tracked_malloc(size_t size, const char *file, int line) {
    void *ptr = malloc(size);
    if (ptr != NULL && ledger_count < MAX_TRACKED_ALLOCS) {
        ledger[ledger_count].address = ptr;
        ledger[ledger_count].size = size;
        ledger[ledger_count].file = file;
        ledger[ledger_count].line = line;
        ledger_count++;
    }
    return ptr;
}

void tracked_free(void *ptr) {
    if (ptr == NULL) return;
    
    for (int i = 0; i < ledger_count; ++i) {
        if (ledger[i].address == ptr) {
            // Remove from ledger
            ledger[i] = ledger[ledger_count - 1];
            ledger_count--;
            break;
        }
    }
    free(ptr);
}

void print_memory_leaks_report(void) {
    if (ledger_count == 0) {
        printf("MEM AUDIT: Zero memory leaks detected! Clean exit.\n");
    } else {
        printf("MEM AUDIT: %d memory leak(s) detected:\n", ledger_count);
        for (int i = 0; i < ledger_count; ++i) {
            printf("  Address %p (%zu bytes) allocated at %s:%d\n", 
                   ledger[i].address, ledger[i].size, ledger[i].file, ledger[i].line);
        }
    }
}

#define my_malloc(s) tracked_malloc(s, __FILE__, __LINE__)
#define my_free(p)   tracked_free(p)
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Write a test allocating blocks via my_malloc. Leave one block unfreed. Invoke print_memory_leaks_report and verify that the unfreed allocation gets reported with exact line and file source code context.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
