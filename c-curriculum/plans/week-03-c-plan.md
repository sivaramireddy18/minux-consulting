# Week 03: Control Flow & Defensive Branching

## 🎯 Weekly Goal
Master secure control structures, understand how conditional jumps affect CPU execution pipelines, and learn how to optimize control paths using branch-free systems coding.

## 🎓 Weekly Outcome
By the end of this week, you will be able to construct robust state machines without redundant conditional blocks, explain CPU branch prediction states, write branch-free array filters, and protect your execution flows from infinite execution loops.

---

## 📅 Session Breakdown

### Monday: The Security Risks of Control Loops
* **Conceptual Focus:** Loops are critical vectors for Denials of Service (DoS).
  * Why all `while(1)` or `for(;;)` loops inside network or parsing routines must incorporate an absolute escape threshold.
  * Ensuring loop termination conditions rely on strict monotonic counters.
* **Hands-on Experiment:**
  Analyze how unescapable conditions crash systems:
  ```c
  #include <stdio.h>
  #include <stdbool.h>
  
  void parse_data_unsafe(const char *buffer) {
      int i = 0;
      // UNSAFE: If buffer contains malformed null-termination, loop is infinite.
      while (buffer[i] != '\n') {
          // Process
          i++;
      }
  }
  
  void parse_data_safe(const char *buffer, int max_len) {
      int i = 0;
      // SAFE: Multi-bounds verification
      while (i < max_len && buffer[i] != '\n') {
          // Process
          i++;
      }
  }
  ```

---

### Tuesday: How CPUs Handle Branches
* **Conceptual Focus:** The CPU instruction pipeline.
  * Modern CPUs use pipelining to pre-fetch instructions. When the CPU encounters a branch (`if`), it *predicts* which path will be taken to avoid stalling the pipeline.
  * **Branch Misprediction Penalty:** If the prediction is wrong, the CPU must flush the entire pipeline, costing significant execution cycles.
  * Tracing how compilers compile `switch` statements into assembly **Jump Tables** for constant-time dispatch.

---

### Wednesday: Branch-Free Coding Principles
* **Conceptual Focus:** Eliminating `if` conditions inside critical inner loops.
  * Replacing branches with bitwise masks or logical operations.
  * Formula: `val = condition ? x : y;` can be rewritten as a branch-free operation.
* **Hands-on Experiment:**
  Observe the performance gap between a branched and branch-free array mapping.
  ```c
  #include <stdio.h>
  #include <time.h>
  #include <stdlib.h>
  
  #define ARRAY_SIZE 100000
  
  int main(void) {
      int *arr = malloc(ARRAY_SIZE * sizeof(int));
      for (int i = 0; i < ARRAY_SIZE; i++) arr[i] = rand() % 2;
      
      // Branched Loop
      clock_t start = clock();
      long long sum = 0;
      for (int i = 0; i < ARRAY_SIZE; i++) {
          if (arr[i] == 1) {
              sum += 10;
          }
      }
      printf("Branched time: %f s\n", (double)(clock() - start) / CLOCKS_PER_SEC);
      
      // Branch-Free Loop
      start = clock();
      sum = 0;
      for (int i = 0; i < ARRAY_SIZE; i++) {
          // Multiply value directly by logic result (0 or 1)
          sum += (arr[i] == 1) * 10;
      }
      printf("Branch-free time: %f s\n", (double)(clock() - start) / CLOCKS_PER_SEC);
      
      free(arr);
      return 0;
  }
  ```

---

### Thursday: Safety in Complex Conditions
* **Conceptual Focus:** Short-circuit evaluation hazards.
  * In C, logical `&&` and `||` evaluate left-to-right and stop as soon as the result is known.
  * Why you must **never** perform state mutations (like pointer increments or function calls) inside logical checks.
* **Hands-on Exercise:**
  Identify the short-circuit mutation bug:
  ```c
  #include <stdio.h>
  int main(void) {
      int x = 0;
      int y = 5;
      // If x is 0, the second condition is never evaluated, meaning y is not incremented!
      if (x != 0 && ++y > 5) {
          printf("Passed\n");
      }
      printf("Value of y: %d (Expected: 6, Actual: 5 due to short-circuit)\n", y);
      return 0;
  }
  ```

---

### Friday: Designing Clean State Machines
* **Conceptual Focus:** Translating chaotic `if-else` trees into clean Event-Driven Finite State Machines (FSM).
* **Hands-on Exercise:**
  Define states using `enum` and map state actions cleanly to structured targets.

---

## 🛠️ Hands-On Assignment: Branch-Free Command Interpreter
Build a high-speed string configuration command interpreter that parses and processes an operations array.

### 1. Requirements
* Eliminate nested conditional blocks inside the main execution loop.
* Parse 4 commands: `INIT`, `RUN`, `HALT`, `REBOOT`.
* State validation must occur via state transition lookup tables (FSM).
* Write unit tests that pass malformed streams to assert error recovery.

### 2. File Deliverables
* `interpreter.h`: State machine structures and validation functions.
* `interpreter.c`: Branch-free FSM routines.
* `main.c`: Unit tests.

---

## 📋 Deliverables Checklist
- [ ] `interpreter.h` (Clean structs and enumerations)
- [ ] `interpreter.c` (Zero nested branches)
- [ ] `main.c` (Test runner parsing streams)
- [ ] `Makefile` (Strict C11 compiler setup)

---

## ❓ Self-Check Questions
1. How does a branch misprediction physically stall a CPU's instruction execution pipeline?
2. Explain the mechanism compilers use to transform a `switch-case` block into an assembly Jump Table.
3. Why are increments like `i++` dangerous when placed inside short-circuit logical operators (`&&`)?
4. Write a branch-free C statement that sets variable `x` to `10` if `y > 5`, otherwise sets it to `0`.
5. What defines a monotonic loop variable, and why does it guarantee termination?

---

## 🚀 Stretch Task
Optimize your state machine processing to handle **Simd-like** parallel processing. Implement a branch-free parser that uses bitmask operations to process four 8-bit command codes packed into a single 32-bit register concurrently.

---

## 💡 Motivation Checkpoint
In safety-critical avionics firmware, the FAA requires absolute testing profiles for every possible execution branch (MC/DC coverage). Design techniques that minimize deep conditional structures not only yield massive speed performance gains but dramatically reduce testing overhead and compiler code paths complexity.

---

## 🎓 Trainer Review Rules
* Verify cyclomatic complexity: No function can exceed a complexity rating of 3 (maximum of 2 nested logic paths).
* The command execution loop must operate with zero branching elements—utilize direct jump tables or bitmask multiplication.
