# Week 05: The Pointers Paradigm & Direct Memory Access

## 🎯 Weekly Goal
Demystify raw memory addressing, master pointer arithmetic, understand arrays decay mechanics, harness generic `void *` pointers, and build dynamic call architectures using function pointers.

## 🎓 Weekly Outcome
By the end of this week, you will be able to perform safe pointer offsets, map multidimensional memory tables, write generic data processing functions, and design robust callback systems using function pointer jump-tables.

---

## 📅 Session Breakdown

### Monday: The Address Space & Dereferencing
* **Conceptual Focus:** The pointer as a memory address storage register.
  * Size of pointers (4 bytes on 32-bit CPU, 8 bytes on 64-bit CPU).
  * The dereference operator (`*`) and address-of operator (`&`).
  * Type scale multiplier: How `p + 1` increments the address by `sizeof(*p)` bytes rather than just 1 raw byte.
* **Hands-on Experiment:**
  Prove pointer increment scaling:
  ```c
  #include <stdio.h>
  #include <stdint.h>
  
  int main(void) {
      uint32_t arr[3] = {10, 20, 30};
      uint32_t *p = arr;
      
      printf("Address of p: %p, Value: %u\n", (void *)p, *p);
      printf("Address of p+1: %p, Value: %u\n", (void *)(p + 1), *(p + 1));
      
      // Calculate raw address difference in bytes
      uintptr_t diff = (uintptr_t)(p + 1) - (uintptr_t)p;
      printf("Raw byte offset: %lu bytes (sizeof(uint32_t) = %lu)\n", diff, sizeof(uint32_t));
      return 0;
  }
  ```

---

### Tuesday: Array Decay & Pointer Arithmetic
* **Conceptual Focus:** Array and pointer relationship.
  * Array names decay to pointers to their first elements when passed to functions.
  * Multidimensional arrays layout (Row-Major layout in memory).
  * Safe pointer limits bounds verification.
* **Hands-on Exercise:**
  Trace multidimensional offset access without index operators:
  ```c
  #include <stdio.h>
  int main(void) {
      int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
      int *p = &grid[0][0];
      // Access row 1, col 2 (value 6) using pure arithmetic offset
      int val = *(p + (1 * 3) + 2);
      printf("Val: %d (Expected: 6)\n", val);
      return 0;
  }
  ```

---

### Wednesday: Generic Pointers (`void *`) & Casts
* **Conceptual Focus:** Data abstraction.
  * `void *` pointers represent pure untyped memory addresses.
  * To read data, `void *` must be cast to a concrete type.
  * Custom implementations of generic algorithms (e.g. `memcpy`, custom `qsort` style comparators).
* **Hands-on Exercise:**
  Write a generic memory swap function:
  ```c
  #include <stdio.h>
  #include <string.h>
  
  void swap_generic(void *a, void *b, size_t size) {
      char temp[128]; // Local stack buffer
      memcpy(temp, a, size);
      memcpy(a, b, size);
      memcpy(b, temp, size);
  }
  ```

---

### Thursday: Function Pointers
* **Conceptual Focus:** Execution callbacks.
  * Function pointers store the entry address of executable code sections (`.text`).
  * Syntax of function pointers declaration: `return_type (*pointer_name)(arg_types)`.
  * Building event-dispatch loops and decoupled subsystems callbacks.
* **Hands-on Exercise:**
  Execute a call using a function pointer:
  ```c
  #include <stdio.h>
  
  void handler(int code) {
      printf("Handled code: %d\n", code);
  }
  
  int main(void) {
      void (*func_p)(int) = handler;
      func_p(42); // Trigger callback
      return 0;
  }
  ```

---

### Friday: Jump Tables & Dispatch Architectures
* **Conceptual Focus:** High-speed function dispatches.
  * Bypassing heavy `if-else` cascades using an array of function pointers.
* **Hands-on Exercise:** Map operations to integer indices and invoke actions instantly.

---

## 🛠️ Hands-On Assignment: Dynamic Callback Event Dispatcher
Design and build a dynamic **Event Dispatcher System** that registers callbacks to handle specific system state alerts.

### 1. Requirements
* Define 4 Event Types: `TEMP_ALERT`, `PRESSURE_ALERT`, `SYS_HALT`, `RECOVERY`.
* Implement the callback signature: `typedef void (*EventCallback)(const void *event_data)`.
* Implement:
  * `int register_callback(int event_type, EventCallback cb)` which registers handlers dynamically.
  * `int dispatch_event(int event_type, const void *data)` which calls all registered events.
* Code must check for register duplicates and bounds, returning `-1` on errors.

### 2. File Deliverables
* `dispatcher.h`: Callback typings and arrays structure.
* `dispatcher.c`: Registration and jump-table dispatch logic.
* `main.c`: Unit tests simulating alerts triggers.

---

## 📋 Deliverables Checklist
- [ ] `dispatcher.h` (Clean typings and boundaries)
- [ ] `dispatcher.c` (Bounds-checked registration)
- [ ] `main.c` (Rich callbacks validation scenario)
- [ ] `Makefile` (Strict C11 compiler setup)

---

## ❓ Self-Check Questions
1. Why does pointer increment math (`p + 1`) adjust different byte offsets depending on the target type size?
2. What does the term "Array Decay" mean mechanically when passing arrays as parameters in C?
3. Why is it illegal to directly dereference a generic `void *` pointer without performing a type-cast?
4. Write the declaration for an array of 5 function pointers that return `void` and accept `double` as an argument.
5. In security audits, why are uninitialized function pointers a critical target for buffer-overflow execution hijacking?

---

## 🚀 Stretch Task
Modify your Dispatcher system to support **priority-based dispatches**. Allow handlers to register with a priority score (1-5). During execution dispatch, sort and fire callbacks in chronological order of their priority level.

---

## 💡 Motivation Checkpoint
Function pointer jump-tables are the backbone of high-performance dispatches in Unix operating systems. For example, character device driver file operations (`open`, `read`, `write`, `close`) are mapped inside the Linux kernel using a struct of function pointers (`struct file_operations`). This enables clean, polymorphic object-oriented programming in pure, raw C.

---

## 🎓 Trainer Review Rules
* Verify registration bounds: Attempting to register callbacks beyond index thresholds must return error codes immediately.
* The dispatch routine must execute using a direct array-index jump path. Traditional `if-else` or `switch` selectors inside core dispatches are forbidden.
