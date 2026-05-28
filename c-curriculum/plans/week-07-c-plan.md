# Week 07: Dynamic Memory Management (Heap)

## 🎯 Weekly Goal
Master the mechanics of heap memory management, explore system virtual memory layouts, analyze allocator fragmentation, and write high-performance custom Arena and Object-pool allocators.

## 🎓 Weekly Outcome
By the end of this week, you will be able to construct specialized memory allocators that operate in constant time, eliminate standard `malloc` allocation latency, diagnose memory leaks using Valgrind, and manage memory alignment configurations from first-principles.

---

## 📅 Session Breakdown

### Monday: The Virtual Memory Layout & System Heap
* **Conceptual Focus:** The OS virtual address space map:
  * **Text Segment:** Read-only assembly instructions.
  * **Data & BSS Segments:** Global and static variables.
  * **Stack Segment:** Local context call frames.
  * **Heap Segment:** Dynamic allocations growing upwards towards the stack.
  * How the operating system manages the heap break pointer using `brk` and `sbrk` system calls, or allocates massive page blocks via `mmap`.
* **Hands-on Experiment:**
  Inspect memory segment boundaries at runtime:
  ```c
  #include <stdio.h>
  #include <stdlib.h>
  
  int global_initialized = 42; // Data segment
  int global_uninitialized;    // BSS segment
  
  int main(void) {
      int stack_var = 10;
      int *heap_var = malloc(sizeof(int));
      
      printf("Text Segment (main):       %p\n", (void *)main);
      printf("Data Segment (initialized): %p\n", (void *)&global_initialized);
      printf("BSS Segment (uninitialized):%p\n", (void *)&global_uninitialized);
      printf("Heap Segment (allocation):  %p\n", (void *)heap_var);
      printf("Stack Segment (local var):  %p\n", (void *)&stack_var);
      
      free(heap_var);
      return 0;
  }
  ```

---

### Tuesday: How Allocators Work (`malloc`/`free` Internals)
* **Conceptual Focus:** The algorithmic design of dynamic memory managers.
  * Allocation blocks: Payload and Header (stores block size and allocation flag).
  * **Implicit vs Explicit Free Lists:** Finding free blocks using First Fit, Best Fit, or Next Fit algorithms.
  * **Coalescing:** Merging adjacent free memory blocks to prevent memory fragmentation.
* **Hands-on Exercise:**
  Trace block splitting and fragmentation in memory layouts through theoretical diagrams and structures.

---

### Wednesday: Memory Arena Allocator Design
* **Conceptual Focus:** High-speed bulk linear allocations.
  * An **Arena Allocator** pre-allocates a massive static block of memory. 
  * Allocation occurs by incrementing an offset pointer in O(1) constant time.
  * Freeing individual allocations is blocked. Instead, the entire Arena is cleared in bulk in a single step.
  * **Alignment:** Arena pointers *must* align allocations to 8-byte boundaries to prevent CPU alignment performance degradation.

---

### Thursday: Object Pool Allocators
* **Conceptual Focus:** Fixed-size chunk allocation managers.
  * An **Object Pool Allocator** manages a collection of fixed-size blocks (e.g. 64-byte blocks).
  * Excellent for allocating/freeing structures of the same type dynamically.
  * Tracking allocation states using a **Free-List Stack** or a **Bitmap Index**.
  * No external fragmentation, zero runtime overhead, constant time O(1) allocation/deallocation.

---

### Friday: Debugging with Valgrind Memcheck
* **Conceptual Focus:** Memory diagnostic tools.
  * Using Valgrind to audit allocations.
  * Catching out-of-bounds array writes, accessing freed memory (Use-After-Free), and identifying unfreed bytes leaks.

---

## 🛠️ Hands-On Assignment: Constant-Time Memory Manager
Design and implement a custom memory allocator system containing a fast linear **Arena Allocator** and a fast fixed-size **Object Pool Allocator**.

### 1. Specifications
* **Arena Allocator:**
  * `void arena_init(Arena *a, void *buffer, size_t size)`
  * `void *arena_alloc(Arena *a, size_t size)` (must align return addresses to 8-byte boundaries).
  * `void arena_reset(Arena *a)` (resets the allocation pointer to 0).
* **Object Pool Allocator:**
  * `void pool_init(Pool *p, void *buffer, size_t block_size, size_t num_blocks)`
  * `void *pool_alloc(Pool *p)` (constant time O(1) check).
  * `void pool_free(Pool *p, void *ptr)` (constant time O(1) check using free-list).
* **Strict Law:** Banish the use of standard `malloc` and `free` inside active test loops.

### 2. File Deliverables
* `allocators.h`: Structures definitions and alignment formulas.
* `allocators.c`: Arena pointer-offset and Pool free-list tracking.
* `main.c`: Unit tests and benchmarks comparing your allocators against standard `malloc` speed.

---

## 📋 Deliverables Checklist
- [ ] `allocators.h` (Strict structures, alignment macros)
- [ ] `allocators.c` (O(1) allocation mechanics)
- [ ] `main.c` (Rich speed benchmarks and validations)
- [ ] `Makefile` (Strict C11 compiler setup)

---

## ❓ Self-Check Questions
1. What is the system break pointer, and how does the operating system adjust it using `brk`?
2. Explain the difference between internal fragmentation and external fragmentation inside memory heap pools.
3. Why does an Arena Allocator require offset alignment to 8-byte boundaries, and what is the formula to align a pointer?
4. How does a Free-List stack allow an Object Pool Allocator to perform allocations and frees in O(1) time?
5. What does Valgrind mean when it reports a "Use-After-Free" runtime warning?

---

## 🚀 Stretch Task
Implement an **Arena Backed Object Pool**. Create an architecture where your Object Pool allocator requests block memory extensions dynamically from an Arena allocator when it runs out of local block units, allowing the pool to expand on demand.

---

## 💡 Motivation Checkpoint
High-frequency trading platforms, game engines, and operating system kernels cannot afford the latency of standard `malloc` allocations, which are non-deterministic and can trigger system context switches. By building specialized, custom memory pools, you achieve latency-free execution and absolute control over memory lifetimes.

---

## 🎓 Trainer Review Rules
* Compile with zero warnings. Auditing with `valgrind --leak-check=full` must report zero leaks and zero errors.
* The Arena allocator must return pointers aligned to 8-byte boundaries. Address addresses ending in `0`, `8` or hexadecimal `C` must be checked and asserted inside tests.
