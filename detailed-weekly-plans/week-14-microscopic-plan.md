# The Super Boss Vetting Specification
## Phase 3: Systems Programming & Linux Essentials
### Unix Pipes, Process Redirects, and fork-execvp execution

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 3: Systems Programming & Linux Essentials
*   **Target Week:** Week 14
*   **Hardware Anchor:** Process context schedulers, MMU page translation tables, and OS pipe buffers
*   **Documentation Map:**
    *   POSIX execution specs, Linux process lifecycles, and pipe stream boundaries.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Process execution lifecycle: address maps copying, page table clones, and COW (Copy-On-Write) structures.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write fork() routines tracking memory address isolation across parent and child scopes.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Process forks: fork() return checks, process parent-child tracking, and address isolations.
*   🛠️ **Unassisted Lab Track (4 Hours):** Implement a program executing shell CLI inputs dynamically using fork() and execvp().

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** Process replacement: execvp() family systems, argument vector maps, and process registers loads.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build a pipe communication ring passing byte arrays through child and parent loops.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Unix pipes: pipe() allocation descriptor routes, kernel byte queues, and synchronous blocking.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a standard streams redirector using dup2() routing output files cleanly to log files.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** File descriptor redirections: dup2() mechanics, standard streams redirection, and IPC routing.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build a robust process supervisor monitoring child processes exits and handling zombie states.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Orphaned and Zombie process management: wait() and waitpid() systems, and child exit code captures.
*   🛠️ **Unassisted Lab Track (4 Hours):** Examine context switching time variations during high-load process spams.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Safe child process execution with pipe IPC redirection
#include <unistd.h>
#include <sys/wait.h>
#include <stdint.h>

void execute_child_pipe(void) {
    int pipefd[2];
    if (pipe(pipefd) == -1) return;
    
    pid_t pid = fork();
    if (pid == 0) { // Child
        close(pipefd[0]);          // Close read end
        dup2(pipefd[1], STDOUT_FILENO); // Redirect stdout to pipe
        char *args[] = {"/bin/ls", "-l", NULL};
        execvp(args[0], args);
        _exit(1);
    } else if (pid > 0) { // Parent
        close(pipefd[1]); // Close write end
        wait(NULL);       // Clean zombie
    }
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Monitor process creation via 'pstree' and 'htop'. Verify zero zombie processes remain on exit, and check pipe stdout data.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Explain how the Copy-On-Write (COW) optimization avoids memory copying during a 'fork()' system call.
2.  **Challenge 2:** What occurs to open file descriptors inside a child process when the 'execvp()' system call executes successfully?
3.  **Challenge 3:** How does a parent process handle clean termination of a child if a 'SIGCHLD' signal is emitted?
