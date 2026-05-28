# Week 12: Production-Grade Capstone Systems Project

## 🎯 Weekly Goal
Assemble all your tools, concurrency controls, compiler mastery, and memory managers to build a production-grade **Concurrent CLI Systems Command Shell** from scratch, profile its execution speed, and assemble an elite systems portfolio.

## 🎓 Weekly Outcome
By the end of this week, you will be able to write complex concurrent C projects from scratch, use profiling tools (`gprof`) to target execution hot-spots, audit code paths for memory efficiency, design decoupled file execution systems, and present your work inside professional portfolio frameworks.

---

## 📅 Session Breakdown

### Monday: The System Architectural Design
* **Conceptual Focus:** Architecture of an interactive CLI Shell.
  * The Read-Eval-Print-Loop (REPL) structure.
  * Parsing tokenized string commands defensively.
  * Forking child processes using `fork()`, loading executable images using `execvp()`, and managing process exit states via `waitpid()`.
* **Hands-on Experiment:**
  Map out structure maps illustrating process fork operations and pipe paths.

---

### Tuesday: Threaded Subprocess Pipelines
* **Conceptual Focus:** Managing parallel task jobs.
  * Spawning execution processes inside separate background threads to ensure the main interactive shell never locks or freezes.
  * Intercepting Standard Input and Output descriptors to implement shell pipes (`|`) and redirection (`>`, `<`) using the `dup2()` system call.

---

### Wednesday: Performance Profiling with `gprof`
* **Conceptual Focus:** Identifying execution performance bottlenecks.
  * You cannot optimize what you do not measure. 
  * Compile code with profiling symbols (`-pg`).
  * Run the execution scenario to compile profiling telemetry data.
  * Analyze execution statistics using `gprof` to pinpoint functions consuming excessive clock cycles or triggering lock blockages.
* **Hands-on Exercise:**
  Compile a CPU-heavy application with profiling enabled:
  ```bash
  # Compile with profiling support
  gcc -pg -O2 main.c -o app
  
  # Run the application (generates gmon.out)
  ./app
  
  # Render the profiling report
  gprof ./app gmon.out > profile_report.txt
  ```

---

### Thursday: Optimization Strategies
* **Conceptual Focus:** Safe, compiler-aided optimization patterns.
  * Bypassing double evaluations.
  * Minimizing scope dereferences.
  * Replacing dynamic allocation in high-frequency loops with local memory arenas.
  * Inlining critical functions (`inline`).

---

### Friday: Graduation Portfolio Review
* **Conceptual Focus:** Landing embedded systems roles.
  * How to organize code repositories to impress technical reviewers.
  * Building premium README guides explaining architectures, memory leak logs, and unit test coverage.
  * Mock interview systems-level conceptual review.

---

## 🛠️ Hands-On Assignment: Concurrent CLI Command Shell
Design and build a fully functional, memory-hardened **Concurrent CLI Systems Command Shell** (named `c-shell`) in pure C.

### 1. Requirements
* Implement a robust REPL loop reading standard input with safe constraints.
* Support concurrent background execution: typing a command ending with `&` must spawn it in a separate thread/process without locking the shell CLI prompt.
* Implement built-in commands: `cd` (directory change), `status` (system info), `exit`.
* Support piping: `command1 | command2` (using `pipe()` and `dup2()`).
* Code must compile cleanly under strict flags, have **zero memory leaks** (Valgrind verified), and include a robust automated Makefile.

### 2. File Deliverables
* `shell.h`: Command token structures and state interfaces.
* `shell.c`: Fork pipelines, token parsing, and thread redirections.
* `main.c`: The core REPL loop execution file.

---

## 📋 Deliverables Checklist
- [ ] `shell.h` (Clean interface declarations)
- [ ] `shell.c` (Zero warnings, safe unbuffered I/O and process forks)
- [ ] `main.c` (High-integrity REPL loop)
- [ ] `Makefile` (Automated targets and clean symbols profiling)

---

## ❓ Self-Check Questions
1. How does the `fork()` system call replicate process memory maps while `execvp()` replaces them?
2. Explain how `dup2()` redirects standard file descriptors to custom file descriptors or pipes.
3. What profiling metrics does the `-pg` flag record, and how do you read a `gprof` flat profile?
4. Why are background job executions in shells usually launched in separate process groups?
5. What are the core layout files and logs that must be present in a professional GitHub systems portfolio?

---

## 🚀 Stretch Task
Add support for **Environment Variables** storage and retrieval. Implement custom shell built-ins `export NAME=VALUE` and parse inputs dynamically so that typing `echo $NAME` retrieves and prints variables from a thread-safe global environment map struct.

---

## 💡 Motivation Checkpoint
Writing a custom shell is the classic graduation test of systems programming. It requires combining string processing, low-level process maps, unbuffered descriptors redirection, concurrency thread blocks, and absolute memory control. Completing this assignment successfully demonstrates that you are ready to build production-grade operating systems systems.

---

## 🎓 Trainer Review Rules
* Compile with zero warnings. Running under `valgrind --leak-check=full` during standard operations must report 0 bytes lost.
* The shell must successfully execute command piping (e.g. `ls -l | grep c-shell`) and background operations without memory corruption or orphan processes.
