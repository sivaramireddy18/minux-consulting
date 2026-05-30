# Microscopic Daily Vetting Specification
## Week 04, Day 6 (Saturday): Comprehensive Capstone & Vetting Verification

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 04 | Day 6 (Saturday)
*   **Core Systems Topic:** Comprehensive Capstone & Vetting Verification
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Integrate all weekly systems concepts into a unified production-grade model. Audit corner conditions and performance boundaries.

#### 🛠️ Unassisted Lab Track (4 Hours)
Raw Static Array Memory Allocator

### Functional Requirements
Create a custom, high-reliability memory allocation library (`my_alloc.c`, `my_alloc.h`) that partitions and manages a static memory pool array of 4KB ($4096$ bytes) using a raw block linked list.
1. The library must implement two core functions: `void* my_malloc(size_t size)` and `void my_free(void *ptr)`.
2. Do *not* use standard library `<stdlib.h>` functions (`malloc`, `free`, `realloc`).
3. Every allocated block must be preceded by a `block_header_t` block metadata node.
4. `my_malloc` must use a **First-Fit** algorithm: searc...

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
#ifndef MY_ALLOC_H
#define MY_ALLOC_H

#include <stddef.h>
#include <stdbool.h>

void my_alloc_init(void);
void* my_malloc(size_t size);
void my_free(void *ptr);
void my_alloc_dump(void); // Utility to print layout of heap memory

#endif // MY_ALLOC_H
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
