# Professional C Systems Programming: Milestone Scorecard

To progress through the curriculum, the student must successfully clear the **Gatekeeper Assignment** at the end of each milestone. Standard GPA curves are banned: these assessments are scored on an industrial **Pass/Fail** basis against a strict engineering rubric.

---

## 🏆 Milestone 1 Gatekeeper: High-Performance Command Parser Engine
* **Checkpoint:** End of Week 03 (Milestone 1)
* **Goal:** Verify compiler flags command, safe bit-shifting, branch-free logic, state machines, and Makefile dependency tracking.

### 📝 Core Specifications
1. Write a custom command line parser that processes binary configurations directly from standard input.
2. The engine must compile with zero warnings using `-std=c11 -Wall -Wextra -Werror -pedantic`.
3. Use a branch-free state machine to parse strings into operations (e.g. `ADD`, `SUB`, `SHIFT_LEFT`, `MASK`). No complex nested `if-else` blocks inside core loop paths.
4. Integrate a self-dependency Makefile that rebuilds modules only if code/header dependencies change.

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Warnings & Build** | Compiles with GCC cleanly under strict flags; Makefile contains `all` and `clean`. | Single compile warning, or raw GCC commands inside shell scripts (instead of Makefile). |
| **Logic & Control** | Parser operates with cyclomatic complexity <= 3 in all functions. State machine operates correctly. | Nested logical structures, raw `goto` calls, or infinite loop hazards. |
| **Tooling & Cleanliness** | Code passed through `cppcheck --enable=all` with zero style/warning reports. | Portability or design flaws flagged by static analysis. |

---

## 🏆 Milestone 2 Gatekeeper: Binary Protocol Serialization Engine
* **Checkpoint:** End of Week 06 (Milestone 2)
* **Goal:** Verify understanding of call frames, pointer casting, struct layouts, structure packing/alignment, and serial stream mapping.

### 📝 Core Specifications
1. Design a binary network protocol telemetry package containing header, payload, dynamic sensor arrays, checksum, and footer.
2. Force the structure alignments to match standard network transport streams without padding bytes (`#pragma pack` or `_Alignas`).
3. Build serialize and deserialize functions using pointer offsets and casting to map telemetry frames to structures.
4. Implement automatic byte-swapping to ensure Big-Endian/Little-Endian host compatibility (network byte order translation).

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Data Alignment** | Struct sizes match expected payload byte size exactly. Alignment verified via compile-time assertions (`_Static_assert`). | Extra structure padding bytes detected; missing byte-swapping checks. |
| **Pointers & Casting** | Cast operations handled without violating strict aliasing rules; pointer math bounds checked. | Buffer overflow hazards, raw out-of-bounds pointer offsets. |
| **Testing** | Automated unit tests covering serialization/deserialization correctness under multiple endian setups. | No unit tests; tests fail to mock packet corruptions. |

---

## 🏆 Milestone 3 Gatekeeper: Custom Memory Arena & Object Pool Allocator
* **Checkpoint:** End of Week 09 (Milestone 3)
* **Goal:** Verify understanding of dynamic memory management, low-level heap mappings, file I/O operations, and X-Macros.

### 📝 Core Specifications
1. Implement a custom memory manager that creates a massive contiguous pool of memory using `mmap` or standard structures.
2. Provide two allocators:
   * **Arena Allocator:** Fast linear allocations with a bulk free capability.
   * **Object Pool Allocator:** Constant-time fixed-size block allocations with random-access freeing and metadata bitmapping.
3. Completely ban the use of standard `malloc` and `free` inside active application code blocks.
4. Generate diagnostic logging that tracks current allocations, fragmentation margins, and leak states. Write logs to file via unbuffered low-level systems I/O (`write`).

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Memory Mechanics** | Custom allocator handles alignments properly; linear allocation speeds validated; zero dynamic leaks on pool exit. | Valgrind flags dynamic pool memory leaks, uninitialized reads, or invalid frees. |
| **Systems I/O** | Log file writing utilizes direct system calls (`open`, `write`, `close`) with error diagnostics mapped to `errno`. | Using buffered standard `fopen`/`fprintf` streams. |
| **Code Generation** | X-Macros utilized to dynamically declare object structure types and their pool instances automatically. | Manual boilerplate pool expansion code. |

---

## 🏆 Milestone 4 Gatekeeper: Thread-Safe Concurrent Systems Shell
* **Checkpoint:** End of Week 12 (Milestone 4 / Graduation)
* **Goal:** Verify complete understanding of thread concurrency, race conditions, POSIX locks, defensive code standards, and production profiling.

### 📝 Core Specifications
1. Build a custom multi-threaded execution shell capable of processing background tasks, pipelined commands, and thread pools.
2. Ensure 100% compliance with a selected safety-critical subset of MISRA-C guidelines.
3. Manage concurrency safely: use mutexes and condition variables to schedule execution threads; eliminate all race conditions on the task pool queue.
4. Perform system performance audits using `gprof` or `perf` to profile and eliminate thread execution locks bottlenecks.
5. Code must be 100% clean under Valgrind's leak-check and thread-check (`helgrind`/`drd`) tools.

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Thread Concurrency** | Zero deadlocks; zero race conditions; tasks processed in parallel. Helgrind/DRD executes with zero warnings. | Thread synchronization issues, deadlocks, or lock bouncing. |
| **Safety Standards** | Passed `cppcheck` under MISRA standard checkers with zero flags. Buffer lengths verified defensively. | Unsafe standard string function calls; MISRA violations. |
| **Graduation Audit** | Complete portfolio review presenting execution profiles, zero memory leaks, Makefile, and robust multi-threading test suite. | Dynamic memory leaks, failure to spawn parallel task workers. |
