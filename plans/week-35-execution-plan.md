# Weekly Execution Plan: Week 35

## 🎯 Weekly Goal
Master advanced embedded systems debugging, memory leak profiling, system call tracking, and performance diagnostics using `gdbserver`, `valgrind`, `strace`, `ldd`, `nm`, and `perf`.

## 🏆 Weekly Outcome
By Friday, the student will have conducted a comprehensive **Systems Diagnostics Audit** on a compiled application. They will be able to locate memory access errors, track dynamic libraries, profile kernel system calls in real-time, execute remote source-level debugging, and identify slow code loops using performance counters.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: System Call Tracing via `strace` & Library Analysis (`ldd`)
* **Conceptual Objective**: Master the diagnostic utilities for system execution:
  - **`strace`**: Intercepts and logs all system calls triggered by a running process, providing immediate visibility into kernel interactions (e.g., file opens, network socket transactions, memory allocations).
  - **`ldd`**: Lists all dynamic shared library (`.so`) dependencies required by an executable.
* **Practical Activity**:
  1. Profile a compiled binary using `ldd` and track where libraries reside in the host FHS directory.
  2. Run `strace` on a networking binary to trace the socket system calls.
* **Code/Circuit Reference**:
```bash
# List dynamic shared libraries of an executable
ldd build/app

# Trace specific system calls (e.g., only file and memory calls)
strace -e trace=open,read,mmap ./build/app
```

### Tuesday: Memory Auditing via `valgrind`
* **Conceptual Objective**: Master memory diagnostic suites. Learn how **Valgrind (Memcheck)** instruments compiled code to detect critical memory safety violations in real-time:
  - Memory leaks (allocating memory via `malloc` and forgetting to `free`).
  - Use of uninitialized values.
  - Out-of-bounds array reads and writes.
  - Double-frees.
* **Practical Activity**:
  1. Write a C program containing memory safety bugs.
  2. Run the application under Valgrind, analyze the stack trace logs, and resolve the errors.
* **Code/Circuit Reference**:
```bash
# Compile with debug symbols active (-g) and optimization disabled (-O0)
gcc -g -O0 src/buggy_app.c -o build/buggy_app

# Run Valgrind with complete leak tracking
valgrind --leak-check=full --show-leak-kinds=all ./build/buggy_app
```

### Wednesday: Remote Debugging via `gdbserver`
* **Conceptual Objective**: Understand that embedded targets have limited resources: you cannot run a giant graphic IDE or compile debugging structures directly on the target. Learn the **GDB Server** design pattern:
  - Run `gdbserver` on the lightweight target embedded board, binding it to a target port.
  - Run the full source-level `gdb` debugger on the powerful host development PC, connecting remotely to the target board over Ethernet.
* **Practical Activity**:
  1. Start `gdbserver` on target board.
  2. Connect from host PC using `gdb-multiarch`.
  3. Step through code, inspect registers, and set breakpoints remotely.
* **Code/Circuit Reference**:
```bash
# Target Board terminal: start gdbserver on port 1234
gdbserver :1234 ./build/app

# Host PC terminal: connect remotely
gdb-multiarch ./build/app
(gdb) target remote <target_ip>:1234
(gdb) break main
(gdb) continue
```

### Thursday: Symbol Inspections (`nm` & `objdump`)
* **Conceptual Objective**: Study binary symbol tables and disassemblers. Understand how `nm` dumps symbol names, types, and addresses, and how `objdump` disassembles raw binary sections back to assembly instructions.
* **Practical Activity**:
  1. Run `nm` to isolate global and static functions in a compiled binary.
  2. Disassemble specific sections and locate the physical assembly instructions of C loops.
* **Code/Circuit Reference**:
```bash
# List all symbols sorted by size
nm --size-sort -S build/app

# Disassemble the text segment showing source code inline
objdump -S -d build/app > build/disassembly.txt
```

### Friday: System Performance Profiling (`perf`)
* **Conceptual Objective**: Master the Linux **`perf`** utility—the official tool for performance auditing. Understand how `perf` uses CPU hardware performance counters to sample system executions, identifying **Hotspots** (the exact functions or loops where the CPU spends most of its execution cycles).
* **Practical Activity**:
  1. Run `perf record` on a CPU-intensive calculations binary.
  2. Generate a performance report using `perf report` and isolate the execution hotspots.
* **Code/Circuit Reference**:
```bash
# Record system execution statistics
perf record -g ./build/app

# Analyze performance report
perf report
```

---

## 🛠️ Hands-On Assignment: Custom Systems Diagnostics Audit

### Functional Requirements
Create a fully integrated, multi-file C database application containing intentional memory safety and efficiency bugs. Then, execute a complete systems diagnostics audit to resolve all errors.
1. The C application `audit_app.c` must:
   - Allocate memory dynamically inside a loop.
   - Intentionally contain a memory leak (forgetting to free a subset of allocations).
   - Intentionally read past an array boundary.
   - Execute a highly inefficient CPU-bound calculation loop.
2. Compile the application with debug symbols active (`-g -O0`).
3. Conduct the Systems Audit using host utilities, generating an audit report `diagnostics_audit.txt` containing:
   - **Shared Libraries**: Output of `ldd` listing dynamic dependencies.
   - **System Call Footprint**: Output of `strace` isolating total file opens and memory mappings.
   - **Memory Audit**: Output of `valgrind` identifying the exact line numbers of the memory leak and the out-of-bounds read, followed by code modifications resolving them.
   - **Performance Audit**: Output of `perf report` isolating the hotspot function.
4. Resolve all bugs, re-compile, and re-run Valgrind to prove a clean execution (zero memory leaks, zero errors).

---

## 📦 Deliverables
* [ ] Buggy source file `audit_app.c` and corrected file `safe_app.c`.
* [ ] Compilation Makefile.
* [ ] Systems diagnostics audit report `diagnostics_audit.txt`.

---

## ❓ Self-Check Questions
1. Why does `valgrind` require compilation flag `-O0` and `-g` to print accurate debug reports? What happens if you run it on a stripped `-O3` binary?
2. Differentiate the roles of `strace` versus `valgrind`. Which tool is used to monitor kernel-space interactions and which is used for user-space memory safety?
3. How does remote debugging using `gdbserver` optimize resources? Explain the host-target connection model.
4. What is a **memory leak**? Trace how a memory leak degraded system performance over time.
5. How does `perf` determine CPU execution hotspots? Differentiate sampling rate statistics from direct execution tracing.

---

## 🚀 Stretch Task (Optional)
Extend the remote debugging pipeline to configure **GDB inside VS Code**: map a custom launch configuration that automatically launches the remote target `gdbserver` connection over SSH, allowing graphic breakpoints mapping directly on host workspaces.

## 💡 Motivation Checkpoint
A junior developer spends hours inserting `printf` statements to debug a crash. A senior systems engineer runs `strace` and `valgrind`, isolates the exact system call failure or memory leak address in 2 minutes, and resolves the issue programmatically. Master the professional diagnostics suite to master systems engineering.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Audit report cleanly isolates and documents all memory leaks, system calls, and hotspots.
  - Final corrected application compiles without warnings and runs cleanly under Valgrind (0 leaks, 0 errors).
* **Fail Criteria**:
  - Unresolved memory leaks or out-of-bounds reads in the final target.
  - Monolithic diagnostics reports lacking structural details.
