# Weekly Execution Plan: Week 15

## 🎯 Weekly Goal
Master low-level Linux file system operations, understand File Descriptors (FD), differentiate between standard buffered library I/O and low-level unbuffered system call I/O, configure custom devices via `ioctl`, and implement memory-mapped I/O using `mmap`.

## 🏆 Weekly Outcome
By Friday, the student will have written a **Low-Level System I/O Engine** in C. They will understand file permission flags, read/write error boundary handling, how control registers are queried via `ioctl`, and how to read/write large files highly efficiently using virtual memory page mapping via `mmap`.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Standard Buffered vs Low-Level Unbuffered I/O
* **Conceptual Objective**: Understand how the Linux Virtual File System (VFS) handles I/O. Study the fundamental architectural differences between standard C library buffered calls (`fopen`, `fread`, `fwrite`, `printf` - which utilize user-space buffer caches) and low-level kernel system calls (`open`, `read`, `write`, `close` - which enter the kernel directly).
* **Practical Activity**:
  1. Write two applications: one using `fwrite` and one using `write`.
  2. Use the system tool `strace` to trace the system calls triggered by both binaries. Notice how many standard library writes are cached before triggering a physical system call.
* **Code/Circuit Reference**:
```bash
# Trace system calls of standard print program
gcc -O2 src/stdio_demo.c -o build/stdio_demo
strace ./build/stdio_demo
```

### Tuesday: File Descriptors & System Calls (open, read, write, close)
* **Conceptual Objective**: Master the Linux File Descriptor (FD) concept: non-negative integers representing open system files inside a process's FD table. Study standard file descriptors: `0` (stdin), `1` (stdout), `2` (stderr). Understand call flags (`O_RDONLY`, `O_WRONLY`, `O_CREAT`, `O_APPEND`) and octal permission masks.
* **Practical Activity**:
  1. Write a C program to copy a file using `open`, `read`, `write`, and `close`.
  2. Implement robust error checking for every system call (e.g., return value is `-1` and read `errno` from `<errno.h>`).
* **Code/Circuit Reference**:
```c
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>

void safe_write_string(const char *path, const char *text) {
    // Open for writing, create if not exist, append, set user rw permissions (0644)
    int fd = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
    if (fd < 0) {
        perror("Error opening file");
        return;
    }

    size_t len = 0;
    while (text[len]) len++;

    ssize_t bytes_written = write(fd, text, len);
    if (bytes_written < 0) {
        perror("Error writing to file");
    }

    close(fd);
}
```

### Wednesday: Device Control Operations via `ioctl`
* **Conceptual Objective**: Learn about the input/output control system call (`ioctl`)—the universal gateway to interface with custom hardware devices and kernel drivers from user space. Understand how `ioctl` acts as a multi-purpose command interface to set hardware parameters (baud rates, frequencies, modes) that do not fit standard read/write formats.
* **Practical Activity**:
  1. Write a program to query the size of active terminal windows dynamically using standard system TTY `ioctl` commands.
  2. Log row and column count outputs.
* **Code/Circuit Reference**:
```c
#include <sys/ioctl.h>
#include <unistd.h>
#include <stdio.h>

void print_terminal_size(void) {
    struct winsize w;
    // STDOUT_FILENO = 1
    if (ioctl(STDOUT_FILENO, TIOCGWINSZ, &w) == 0) {
        printf("Terminal Rows: %d, Columns: %d\n", w.ws_row, w.ws_col);
    } else {
        perror("ioctl error");
    }
}
```

### Thursday: High-Performance Memory Mapping (`mmap`)
* **Conceptual Objective**: Master the memory-mapping system call (`mmap`). Differentiate between standard file reading (which copies data from disk -> kernel page cache -> user buffer) and `mmap` (which maps file segments directly into the process's virtual address space, eliminating user-space copying overhead).
* **Practical Activity**:
  1. Write a program that opens a large text file, maps it to a pointer using `mmap`, and modifies the content directly by modifying pointer elements.
  2. Verify that modifications are synced back to disk.
* **Code/Circuit Reference**:
```c
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>

void map_file_to_pointer(const char *path) {
    int fd = open(path, O_RDWR);
    struct stat sb;
    fstat(fd, &sb); // Get file size

    // Map file to virtual memory
    char *addr = mmap(NULL, sb.st_size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (addr == MAP_FAILED) {
        perror("mmap error");
        close(fd);
        return;
    }

    // Read and modify direct memory offset
    printf("File contents: %s\n", addr);
    addr[0] = 'H'; // Changes the first character of the physical file!

    // Clean up
    munmap(addr, sb.st_size);
    close(fd);
}
```

### Friday: Advanced File Multiplexing Concepts (select, poll)
* **Conceptual Objective**: Understand what happens when you attempt to read from a slow file interface (like a serial port or network pipe). The read blocks, stopping execution. Study the concepts of non-blocking I/O (`O_NONBLOCK`) and file multiplexing (`select`, `poll`) to monitor multiple file descriptors concurrently.
* **Practical Activity**:
  1. Read the `poll()` system call specifications.
  2. Draw the multi-stream polling workflow architecture diagram.

---

## 🛠️ Hands-On Assignment: Custom Memory-Mapped DB Processor

### Functional Requirements
Create a high-performance database processor application that processes records from a custom binary file using low-level unbuffered system calls and memory-mapped virtual regions.
1. Define a database record structure containing a 32-bit ID, an array representing a 32-byte string value, and a 32-bit floating-point numeric value. The structure must be explicitly packed.
2. The application must support command-line arguments:
   - `-w`: Create the file database and write 10 dummy records using unbuffered `write()` system calls.
   - `-r`: Read the file database using memory-mapped I/O (`mmap()`), print out all active records, and modify the floating-point values of specific record IDs directly via memory pointer modifications.
3. Every single system call (`open`, `read`, `write`, `mmap`, `munmap`, `fstat`) must contain robust error validation. If a failure occurs, the program must output the exact error description using `perror()` or `strerror(errno)` and exit with a clean failure status code.
4. Provide a Makefile that builds the program cleanly.

### Structural Requirements & Code Skeleton
**`db_processor.c` (C-Skeleton)**:
```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <errno.h>

#define DB_FILE "records.db"
#define RECORD_COUNT 10

typedef struct __attribute__((packed)) {
    uint32_t id;
    char name[32];
    float value;
} db_record_t;

void write_db(void) {
    int fd = open(DB_FILE, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) {
        perror("Error creating DB file");
        exit(EXIT_FAILURE);
    }

    db_record_t record;
    for (uint32_t i = 0; i < RECORD_COUNT; i++) {
        record.id = i;
        snprintf(record.name, sizeof(record.name), "Record_Node_%u", i);
        record.value = (float)i * 10.5f;

        ssize_t bytes = write(fd, &record, sizeof(db_record_t));
        if (bytes < 0) {
            perror("Error writing record");
            close(fd);
            exit(EXIT_FAILURE);
        }
    }
    close(fd);
    printf("Successfully wrote %d records to %s\n", RECORD_COUNT, DB_FILE);
}

void process_db_mmap(void) {
    int fd = open(DB_FILE, O_RDWR);
    if (fd < 0) {
        perror("Error opening DB file");
        exit(EXIT_FAILURE);
    }

    struct stat sb;
    if (fstat(fd, &sb) < 0) {
        perror("Error statting file");
        close(fd);
        exit(EXIT_FAILURE);
    }

    // Map the file
    db_record_t *records = mmap(NULL, sb.st_size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (records == MAP_FAILED) {
        perror("Error mmapping DB");
        close(fd);
        exit(EXIT_FAILURE);
    }

    size_t count = sb.st_size / sizeof(db_record_t);
    printf("Reading %zu records from memory map:\n", count);
    for (size_t i = 0; i < count; i++) {
        printf("ID: %u, Name: %s, Value: %.2f\n", records[i].id, records[i].name, records[i].value);

        // Modify values directly in mapped space (will sync back to disk)
        if (records[i].id == 5) {
            records[i].value = 999.99f;
            printf(" -> Updated record 5 value to 999.99\n");
        }
    }

    // Sync modifications
    if (msync(records, sb.st_size, MS_SYNC) < 0) {
        perror("msync failed");
    }

    // Clean up
    munmap(records, sb.st_size);
    close(fd);
}
```

---

## 📦 Deliverables
* [ ] Database processor C source file `db_processor.c`.
* [ ] Compilation Makefile.
* [ ] Extracted system call log file `strace_output.txt` captured during runs of `-w` and `-r` runs.

---

## ❓ Self-Check Questions
1. Why does using standard `fwrite()` result in fewer physical write system calls than direct `write()` loops? Differentiate user-space cache buffering from kernel-space buffering.
2. What are the file permission octal symbols? Explain what access limitations are applied by permission mask `0644` vs `0600`.
3. How does `fstat()` retrieve file data? Which structure fields track total file size in bytes?
4. What is the fundamental difference between memory mapping with `MAP_SHARED` versus `MAP_PRIVATE` flags? Which flag must be used to sync modifications back to physical disk files?
5. How does `ioctl()` allow developers to build configurations that are not supported by standard read/write APIs? Give a real-world driver context example.

---

## 🚀 Stretch Task (Optional)
Extend the database processor to support **Multi-process Locking**. Use the `flock` or `fcntl` system calls to lock the database file during reads/writes to prevent multiple concurrent processes from corrupting the memory-mapped virtual region.

## 💡 Motivation Checkpoint
In production systems, processing millions of telemetry packets or managing local database logs requires speed and absolute execution safety. Standard high-level I/O streams are too slow and mask errors behind caching layers. Mastering direct system calls, `ioctl` configurations, and `mmap` page caches is standard architecture requirement for elite systems engineers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Code compiles without warnings with `-Wall -Wextra -Werror`.
  - All system call returns are verified for errors (`< 0`).
  - Binary processes mmap mappings and outputs correctly.
  - `strace_output.txt` shows correct dynamic allocations and system calls.
* **Fail Criteria**:
  - Monolithic logic that assumes system calls never fail.
  - Missing file descriptor closings.
