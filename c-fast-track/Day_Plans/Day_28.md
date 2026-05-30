# Microscopic Daily Vetting Specification
## Phase 6: Custom Allocators | Day 28: Fixed-Size Memory Block Pools

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 28 of 45 | Phase: Phase 6: Custom Allocators
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Learn why fixed-size block pool allocators (also called slab allocators) are mandatory in real-time operating systems (RTOS). A block pool partitions a raw buffer into equal-sized blocks linked together in a list. Allocation and deallocation are deterministic O(1) operations, introducing zero fragmentation.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a deterministic Fixed-Size Memory Pool allocator. Implement an initialization function, an allocation function (taking a block from the free list), and a free function (returning the block). Run tests to verify consistent execution latency.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Deterministic O(1) Fixed-Size Block Pool Allocator
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

typedef struct block_node {
    struct block_node *next;
} block_node_t;

typedef struct {
    uint8_t      *pool_buffer;
    size_t        block_size;
    size_t        num_blocks;
    block_node_t *free_list;
} mem_pool_t;

void mem_pool_init(mem_pool_t *pool, uint8_t *buffer, size_t block_size, size_t num_blocks) {
    // Align block size to pointer boundary for the free list nodes
    size_t aligned_block_size = (block_size + sizeof(void *) - 1) & ~(sizeof(void *) - 1);
    pool->pool_buffer = buffer;
    pool->block_size = aligned_block_size;
    pool->num_blocks = num_blocks;
    pool->free_list = NULL;
    
    // Link all blocks into the free list
    for (size_t i = 0; i < num_blocks; ++i) {
        block_node_t *node = (block_node_t *)(buffer + (i * aligned_block_size));
        node->next = pool->free_list;
        pool->free_list = node;
    }
}

void *mem_pool_alloc(mem_pool_t *pool) {
    if (pool->free_list == NULL) return NULL; // Exhausted
    
    block_node_t *node = pool->free_list;
    pool->free_list = node->next;
    return (void *)node;
}

void mem_pool_free(mem_pool_t *pool, void *ptr) {
    if (ptr == NULL) return;
    
    block_node_t *node = (block_node_t *)ptr;
    node->next = pool->free_list;
    pool->free_list = node;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Write a test harness allocating and freeing blocks. Confirm that the memory pool handles exhaustions, deallocations restore pool capacity, and allocation execution takes constant time.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
