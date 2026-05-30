# Microscopic Daily Vetting Specification
## Phase 6: Custom Allocators | Day 29: Dynamic Free Lists, Block Splitting, and Coalescing

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 29 of 45 | Phase: Phase 6: Custom Allocators
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study the internal mechanics of general-purpose dynamic allocators that support variable-sized malloc/free requests. Learn about boundary tags, free list traversal strategies (First-Fit, Best-Fit), block splitting on allocation, and block coalescing (merging adjacent free blocks) on deallocation.

#### 🛠️ Unassisted Lab Track (4 Hours)
Implement a conceptual First-Fit memory allocator with block headers tracking block sizes and free states. Write a coalescing function that traverses headers to merge contiguous free blocks, resolving external fragmentation.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Block Header definitions and Coalescing logics
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

typedef struct block_header {
    size_t size;
    bool   is_free;
    struct block_header *next;
} block_header_t;

// Traverse and merge contiguous free blocks in the list
void coalesce_free_blocks(block_header_t *head) {
    block_header_t *current = head;
    while (current != NULL && current->next != NULL) {
        if (current->is_free && current->next->is_free) {
            // Merge current and next block
            current->size += sizeof(block_header_t) + current->next->size;
            current->next = current->next->next;
            // Do not advance; check if new adjacent block can also merge
        } else {
            current = current->next;
        }
    }
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Create three dummy blocks, mark them as free, trigger the coalesce function, and assert that the first block size now encompasses all three blocks.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
