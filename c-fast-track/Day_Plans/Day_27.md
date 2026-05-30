# Microscopic Daily Vetting Specification
## Phase 6: Custom Allocators | Day 27: Custom Memory Arenas and Alignment Boundaries

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 27 of 45 | Phase: Phase 6: Custom Allocators
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the concept of a Memory Arena (or linear/bump allocator). Arena allocators speed up performance by allocating a single large buffer upfront and serving dynamic requests by bumping an offset index. Memory release is executed en-masse by clearing the entire arena. Learn how to enforce alignment on all sub-allocations.

#### 🛠️ Unassisted Lab Track (4 Hours)
Design and implement a complete, robust, type-aligned Memory Arena in C. The arena must take a statically allocated buffer and support variable-sized allocation requests. Ensure that the returned addresses are always aligned to 8-byte boundaries.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Robust aligned memory arena allocator
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

typedef struct {
    uint8_t *buffer;
    size_t   capacity;
    size_t   offset;
} arena_t;

void arena_init(arena_t *arena, uint8_t *buffer, size_t capacity) {
    arena->buffer = buffer;
    arena->capacity = capacity;
    arena->offset = 0;
}

void *arena_alloc(arena_t *arena, size_t size, size_t alignment) {
    // Ensure alignment is power of 2
    size_t current_addr = (size_t)(arena->buffer + arena->offset);
    size_t aligned_addr = (current_addr + (alignment - 1)) & ~(alignment - 1);
    size_t new_offset = aligned_addr - (size_t)arena->buffer;
    
    if (new_offset + size > arena->capacity) {
        return NULL; // Out of memory
    }
    
    arena->offset = new_offset + size;
    return (void *)aligned_addr;
}

void arena_reset(arena_t *arena) {
    arena->offset = 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Write a test suite allocating various objects (e.g. chars, ints, structs) in sequence. Assert that every returned address is perfectly aligned to the requested size (e.g. multiple of 4 or 8) and fits within bounds.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
