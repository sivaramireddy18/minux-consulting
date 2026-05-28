# Weekly Execution Plan: Week 16

## 🎯 Weekly Goal
Master Linux multi-processing architectures, understand process scheduling, learn process cloning (`fork`) and executable replacements (`exec`), synchronize termination (`wait`, `waitpid`), and build secure Inter-Process Communication (IPC) pipelines using Pipes, FIFOs, and Shared Memory.

## 🏆 Weekly Outcome
By Friday, the student will have written a **Multi-Process IPC Pipeline** in C. They will understand child cloning, child process reaping, how to prevent zombie/orphan processes, how to redirect input/output streams dynamically, and how to transfer high-rate data between independent processes using Shared Memory.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Process Creation via `fork` & Process Lifecycles
* **Conceptual Objective**: Understand that the kernel tracks every running program as a process containing a unique Process ID (PID). Master `fork()`—the system call that clones the calling process, creating an identical child process. Learn about the dual-return value of `fork()` (returns `0` inside the child, returns the child's PID inside the parent).
* **Practical Activity**:
  1. Write a program that forks multiple child processes.
  2. Print PIDs and Parent PIDs (`getpid()`, `getppid()`) to map out parent-child family trees.
* **Code/Circuit Reference**:
```c
#include <unistd.h>
#include <stdio.h>
#include <sys/types.h>

void fork_demo(void) {
    pid_t pid = fork();
    if (pid < 0) {
        perror("fork failed");
        return;
    }

    if (pid == 0) {
        // Child Process
        printf("Child Process: PID=%d, Parent PID=%d\n", getpid(), getppid());
    } else {
        // Parent Process
        printf("Parent Process: PID=%d, Spawned Child PID=%d\n", getpid(), pid);
    }
}
```

### Tuesday: Executive Replacements (`exec`) & Process Reaping
* **Conceptual Objective**: Master the `exec` family of system calls (`execl`, `execv`, `execp`). Understand how `exec` completely overwrites the calling process's virtual memory, stack, and text segment with a new target binary. Learn about child process status reaping (`wait`, `waitpid`) to prevent the creation of **Zombie Processes** (terminated children whose exit status remains un-read in kernel tables) and **Orphan Processes** (children running after parent terminates).
* **Practical Activity**:
  1. Write a parent program that forks a child.
  2. The child replaces itself with a system command (like `ls -la`) using `execl`.
  3. The parent blocks on `waitpid()` and prints the child's exit status.
* **Code/Circuit Reference**:
```c
#include <sys/wait.h>
#include <unistd.h>
#include <stdio.h>

void exec_reap_demo(void) {
    pid_t pid = fork();
    if (pid == 0) {
        // Overwrite child with target command
        execl("/bin/ls", "ls", "-la", NULL);
        perror("exec failed"); // Only prints if exec fails!
        _exit(1);
    } else {
        int status;
        waitpid(pid, &status, 0); // Wait for child to exit
        if (WIFEXITED(status)) {
            printf("Child exited with code: %d\n", WEXITSTATUS(status));
        }
    }
}
```

### Wednesday: Unnamed Pipes & I/O Redirections (`dup2`)
* **Conceptual Objective**: Study the classic Inter-Process Communication mechanism: the **Pipe** (a unidirectional channel in kernel memory with a read FD and a write FD). Understand how to redirect standard outputs of one process to the standard input of another using `dup2()`.
* **Practical Activity**:
  1. Write a program that forks a child and pipes data from the parent to the child.
  2. Recreate the command line shell pipe command `ls | wc -l` in C using `pipe()`, `fork()`, and `dup2()`.
* **Code/Circuit Reference**:
```c
#include <unistd.h>
#include <stdio.h>

void pipe_demo(void) {
    int pipefd[2];
    pipe(pipefd); // pipefd[0] is read, pipefd[1] is write

    if (fork() == 0) {
        // Child: Read from pipe
        close(pipefd[1]); // Close unused write end
        char buf[32];
        read(pipefd[0], buf, sizeof(buf));
        printf("Child received: %s\n", buf);
        close(pipefd[0]);
    } else {
        // Parent: Write to pipe
        close(pipefd[0]); // Close unused read end
        write(pipefd[1], "Hello Child", 11);
        close(pipefd[1]);
    }
}
```

### Thursday: Named Pipes (FIFOs)
* **Conceptual Objective**: Understand that standard unnamed pipes require a common parent-child ancestor process relationship because file descriptors must be shared. Study Named Pipes (FIFOs)—virtual files residing inside the filesystem directory that allow completely independent, unrelated processes to communicate.
* **Practical Activity**:
  1. Create a FIFO file on disk using `mkfifo()`.
  2. Write two separate independent programs: `writer.c` (opens FIFO in write-only mode) and `reader.c` (opens FIFO in read-only mode).
  3. Transfer text blocks between the two independent shell instances.
* **Code/Circuit Reference**:
```bash
# Create FIFO manually in terminal
mkfifo /tmp/my_fifo

# Terminal 1: write to it
echo "Hello from terminal 1" > /tmp/my_fifo

# Terminal 2: read from it (blocks until terminal 1 writes)
cat /tmp/my_fifo
```

### Friday: High-Performance Shared Memory (SHM)
* **Conceptual Objective**: Master POSIX Shared Memory (`shm_open`, `ftruncate`, `mmap`). Understand that Shared Memory is the fastest possible IPC mechanism because the kernel maps a shared physical memory frame into the virtual space of both processes, allowing direct pointer-to-pointer data writes without context switches or kernel system copies.
* **Practical Activity**:
  1. Write parent-child programs that initialize a shared memory segment.
  2. Read and write structures directly via the mapped pointers.
* **Code/Circuit Reference**:
```c
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

#define SHM_NAME "/my_shared_memory"
#define SHM_SIZE 4096

void create_shm(void) {
    // Open shared memory block
    int shm_fd = shm_open(SHM_NAME, O_CREAT | O_RDWR, 0666);
    ftruncate(shm_fd, SHM_SIZE);

    // Map to pointer
    void *ptr = mmap(NULL, SHM_SIZE, PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);
    // ptr can now be read/written by independent processes!
}
```

---

## 🛠️ Hands-On Assignment: Multi-Process Real-Time IPC Gateway

### Functional Requirements
Create a multi-process gateway architecture where a high-priority Sensor Simulator process communicates with a Data Logging process using Shared Memory and Named Semaphores.
1. The project must build two independent binaries: `sensor_sim` and `data_logger`.
2. **`sensor_sim`** (cloned child or independent process) must:
   - Create or open a POSIX Shared Memory segment named `/sensor_shm`.
   - Initialize and map a packed structure containing: sensor ID, timestamp, and raw data values.
   - Run a loop updating data values every 100ms.
   - Use a **POSIX Named Semaphore** (`sem_open`) to synchronize writes, preventing the logger from reading incomplete structures.
3. **`data_logger`** must:
   - Open and map `/sensor_shm`.
   - Read the structure safely when the semaphore signals that data is ready.
   - Process the values and log them to a file `telemetry.csv` using unbuffered system calls.
4. If a termination signal (`SIGINT` or `Ctrl-C`) is caught, both processes must shut down cleanly, unmapping memory segments (`munmap`), deleting shared segments (`shm_unlink`), and closing semaphores (`sem_close`, `sem_unlink`) to prevent memory leaks in system tables.

### Structural Requirements & Code Skeleton
**`shared_def.h`**:
```c
#ifndef SHARED_DEF_H
#define SHARED_DEF_H

#include <stdint.h>

#define SHM_NAME "/sensor_shm"
#define SEM_NAME "/sensor_sem"

typedef struct __attribute__((packed)) {
    uint32_t sensor_id;
    uint32_t timestamp;
    float reading;
    uint8_t status_flag;
} sensor_data_t;

#endif // SHARED_DEF_H
```

**`sensor_sim.c` (C-Skeleton)**:
```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>
#include <semaphore.h>
#include <signal.h>
#include "shared_def.h"

int shm_fd = -1;
sensor_data_t *shared_data = NULL;
sem_t *sem = NULL;

void cleanup(int sig) {
    (void)sig;
    if (shared_data != NULL) munmap(shared_data, sizeof(sensor_data_t));
    if (shm_fd != -1) close(shm_fd);
    if (sem != NULL) sem_close(sem);
    shm_unlink(SHM_NAME);
    sem_unlink(SEM_NAME);
    printf("\nCleaned up shared memory and exited.\n");
    exit(0);
}

int main(void) {
    signal(SIGINT, cleanup);

    // 1. Create Shared Memory
    shm_fd = shm_open(SHM_NAME, O_CREAT | O_RDWR, 0666);
    ftruncate(shm_fd, sizeof(sensor_data_t));

    // 2. Map Shared Memory
    shared_data = mmap(NULL, sizeof(sensor_data_t), PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);

    // 3. Create Named Semaphore (initial value = 1)
    sem = sem_open(SEM_NAME, O_CREAT, 0666, 1);

    uint32_t tick = 0;
    while (1) {
        sem_wait(sem); // Lock segment

        // Update shared structure
        shared_data->sensor_id = 101;
        shared_data->timestamp = tick++;
        shared_data->reading = 22.4f + ((float)(rand() % 100) / 10.0f);
        shared_data->status_flag = 0xAA;

        sem_post(sem); // Unlock segment
        usleep(100000); // Wait 100ms
    }
    return 0;
}
```

---

## 📦 Deliverables
* [ ] Common header file `shared_def.h`.
* [ ] Independent source files `sensor_sim.c` and `data_logger.c`.
* [ ] Compilation Makefile building both binaries cleanly.
* [ ] Telemetry outputs log `telemetry.csv` demonstrating successful IPC writes.

---

## ❓ Self-Check Questions
1. Why does a cloned child process created by `fork()` inherit open file descriptors? What is the impact if a parent closes a file descriptor inside its own thread, and how does it affect the child?
2. What is a **Zombie Process**? What is its footprint inside the operating system, and how does reaping with `waitpid()` resolve the issue?
3. How does a named FIFO differ from an unnamed pipe? Why can unrelated shell processes communicate via a FIFO but not via a pipe?
4. Why is Shared Memory the absolute fastest possible Inter-Process Communication mechanism? What is the role of Semaphores when accessing shared segments?
5. What are signal handlers? Explain how catching `SIGINT` enables dynamic cleanup of persistent IPC resources on disk.

---

## 🚀 Stretch Task (Optional)
Extend the database logger to handle multiple simulation clients dynamically: manage an array of semaphores to monitor updates from up to 5 concurrent sensor simulators, logging all data structures into a unified telemetry file.

## 💡 Motivation Checkpoint
In automotive ECUs, flight controllers, or complex Linux gateways, tasks are divided across separate execution units to secure isolation: if a UI renderer crashes, the critical telemetry capture process must continue unaffected. Separating tasks into processes protects the system, but requires mastery of IPC to sync communication cleanly.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Independent processes compile cleanly with zero warnings.
  - POSIX shared segments are correctly initialized, synced, and unlinked.
  - Shared memory structures are protected using Named Semaphores to resolve race conditions.
* **Fail Criteria**:
  - Memory mapping bypasses semaphore protection.
  - Persistent IPC blocks are orphaned on disk after exit.
