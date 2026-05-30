# Microscopic Daily Vetting Specification
## Week 04, Day 5 (Friday): Custom Block Allocators Mechanics (Singly Linked Heap)

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 04 | Day 5 (Friday)
*   **Core Systems Topic:** Custom Block Allocators Mechanics (Singly Linked Heap)
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Conceptualize how an allocator operates without operating system system-calls (like `sbrk`). Learn how to partition a static array of raw bytes into a linked list of managed heap blocks.

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Design a block metadata header structure containing the size of the block and a boolean indicating whether it is free or allocated.
  2. Plan the link mechanism for traversing adjacent blocks.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
typedef struct block_header {
    size_t size;
    bool is_free;
    struct block_header *next;
} block_header_t;
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
