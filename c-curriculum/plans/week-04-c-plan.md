# Week 04: The Call Stack & Execution Frames

## 🎯 Weekly Goal
Master the mechanics of the CPU call stack, understand how function calls allocate memory dynamically at runtime, control storage lifetimes (`static`, `extern`), and prevent stack corruption and buffer overflow exploits.

## 🎓 Weekly Outcome
By the end of this week, you will be able to map stack frame activation records, audit function calling conventions (`cdecl`, `stdcall`), trace local scopes in assembly, explain stack variable lifetimes, and deploy defensive bounds checks to protect the stack frame.

---

## 📅 Session Breakdown

### Monday: Call Stack Anatomy & Activation Records
* **Conceptual Focus:** The LIFO (Last-In-First-Out) runtime stack.
  * Stack directions (growth from high memory to low memory).
  * **The Stack Frame (Activation Record):** What gets pushed when a function is called:
    1. Function Arguments.
    2. Return Address (where the CPU returns after execution).
    3. Saved Frame Pointer (`EBP`/`RBP`).
    4. Local Variables.
* **Hands-on Experiment:**
  Trace stack growth direction by checking addresses of nested local variables:
  ```c
  #include <stdio.h>
  
  void nest(int depth) {
      int local;
      printf("Depth %d: Local variable address: %p\n", depth, (void *)&local);
      if (depth < 3) {
          nest(depth + 1);
      }
  }
  
  int main(void) {
      nest(1);
      return 0;
  }
  ```
  Observe that the memory addresses decrease as depth increases, demonstrating downward stack growth.

---

### Tuesday: CPU Calling Conventions
* **Conceptual Focus:** The agreement between caller and callee.
  * Who cleans the stack (caller or callee)?
  * **cdecl (C Default):** Caller cleans the stack. Supports variable argument lengths (`printf`).
  * **stdcall (Win32):** Callee cleans the stack.
  * **fastcall:** Passes first arguments in registers (`RCX`, `RDX`) for ultra-fast executions.
* **Hands-on Exercise:**
  Inspect disassembly to see how parameters are passed to functions (stack pushing vs register loading).

---

### Wednesday: Variables Lifetime & Scopes
* **Conceptual Focus:** Storage Durations:
  * **Automatic (`auto`):** Allocated on stack upon block entry, destroyed on exit.
  * **Static (`static`):** Persistent memory allocated in the `.data` or `.bss` segments for the lifetime of the program.
  * **External (`extern`):** Global symbol reference declared in another compile unit.
* **Hands-on Experiment:**
  Verify persistent storage states:
  ```c
  #include <stdio.h>
  
  int counter(void) {
      static int count = 0; // Stored in .data segment, not on the stack!
      return ++count;
  }
  
  int main(void) {
      printf("Run 1: %d\n", counter());
      printf("Run 2: %d\n", counter());
      return 0;
  }
  ```

---

### Thursday: Stack Corruption & Buffer Overflows
* **Conceptual Focus:** Exploiting stack overflows.
  * What happens when writing past array boundaries allocated on the stack.
  * Overwriting the stored **Return Address** with shellcode or malformed addresses.
  * Compiler defense mechanisms: **Stack Canaries** (`-fstack-protector`).
* **Hands-on Exercise:**
  Trace a basic stack overflow layout using a debugger:
  ```c
  #include <stdio.h>
  #include <string.h>
  
  void unsafe_copy(const char *input) {
      char buffer[8];
      // If input > 8 bytes, buffer overflow!
      strcpy(buffer, input); 
      printf("Buffer: %s\n", buffer);
  }
  ```

---

### Friday: Compiler Assembly Analysis
* **Conceptual Focus:** Inspecting function prologue and epilogue.
  * **Prologue:** `push rbp; mov rbp, rsp; sub rsp, N` (allocates local space).
  * **Epilogue:** `leave; ret` (cleans local space and returns).
* **Hands-on Exercise:** Disassemble and read prologue steps of your local binaries using GCC and objdump.

---

## 🛠️ Hands-On Assignment: Stack Call Frame Emulator
Write a simulator in C that mimics CPU stack frames allocation, parameter passing, and tracks register pointers.

### 1. Requirements
* Implement a struct representing the CPU state (`Registers`: `ESP`, `EBP`, `EIP`).
* Mimic function execution calls: `sim_push_frame()`, `sim_pop_frame()`, and parameter allocations.
* Log all activation record parameters inside a stack dump visualizer.
* The simulator must gracefully catch "stack overflows" before frame limits are violated.

### 2. File Deliverables
* `stack_sim.h`: Registers, Frame structures, and boundaries.
* `stack_sim.c`: Pushing and popping emulator functions.
* `main.c`: Unit tests.

---

## 📋 Deliverables Checklist
- [ ] `stack_sim.h` (Clean CPU registry representations)
- [ ] `stack_sim.c` (Safe emulated stack limits checks)
- [ ] `main.c` (Test suites tracking allocations)
- [ ] `Makefile` (Strict C11 rules compile)

---

## ❓ Self-Check Questions
1. Why does the CPU call stack grow downwards on most modern computer architectures?
2. What are the mechanical trade-offs between `cdecl` and `stdcall` calling conventions?
3. How does declaring a variable `static` inside a function block change its storage allocation and lifetime?
4. Explain how a "Stack Canary" prevents malicious execution redirection during a buffer overflow event.
5. In assembly, what exact steps do the instructions `push rbp` and `mov rbp, rsp` accomplish?

---

## 🚀 Stretch Task
Implement an automated **Stack Tracing Profiler** inside your simulator. Add logic to record function depth, measure maximum simulated stack depth, and output a detailed profile graph illustrating call-tree operations.

---

## 💡 Motivation Checkpoint
Buffer overflows on the stack have been the base of legendary cyber-attacks, such as the 1988 Morris Worm (which brought down 10% of the early internet using a `gets` call exploit in fingerd). Operating in systems programming means recognizing that memory safety is an architectural absolute, not an afterthought.

---

## 🎓 Trainer Review Rules
* Verify stack simulation boundaries: The program must successfully trigger custom simulated "segmentation faults" if the frame sizes overflow limits.
* All variable allocations inside the simulation must have explicit type sizes. No raw pointer adjustments without scale calculations.
