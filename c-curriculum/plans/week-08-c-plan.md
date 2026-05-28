# Week 08: Low-Level File I/O & Error Handling

## 🎯 Weekly Goal
Master the boundaries between user applications and the operating system kernel, understand file descriptors, handle system errors dynamically using `errno`, and implement lightning-fast file operations using memory mapping (`mmap`).

## 🎓 Weekly Outcome
By the end of this week, you will be able to bypass standard buffered standard I/O library streams, read and write files using unbuffered system calls, recover safely from file descriptors errors, and map file segments directly into virtual memory paths for high-performance reading and writing.

---

## 📅 Session Breakdown

### Monday: System Calls vs Library Streams
* **Conceptual Focus:** The boundary between user mode and kernel mode.
  * **Standard Library (`stdio.h`):** Buffered operations (like `fopen`, `fread`, `printf`). Data is stored in a user-space buffer before being flushed to the disk.
  * **System Calls (`unistd.h`):** Unbuffered direct requests to the kernel (like `open`, `read`, `write`, `close`). Each system call forces a CPU context switch to kernel execution mode.
  * Performance implications: When to use buffered vs unbuffered approaches.
* **Hands-on Experiment:**
  Compare the execution speed of writing 100,000 bytes via `fwrite` vs raw `write` calls. Note how standard library buffering reduces the frequency of slow context switches.

---

### Tuesday: File Descriptors & The Kernel File Table
* **Conceptual Focus:** How the operating system manages resources.
  * **File Descriptor (FD):** A non-negative integer that represents an open file index in the process's descriptor table.
  * Standard File Descriptors: Standard Input (`0`, `STDIN_FILENO`), Standard Output (`1`, `STDOUT_FILENO`), Standard Error (`2`, `STDERR_FILENO`).
  * Creating, reading, and writing files using low-level calls:
    ```c
    #include <fcntl.h>
    #include <unistd.h>
    
    int main(void) {
        // Open file for writing, create if not exist, truncate size to 0.
        int fd = open("log.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (fd < 0) {
            return -1;
        }
        write(fd, "Data\n", 5);
        close(fd);
        return 0;
    }
    ```

---

### Wednesday: Defensive Error Handling & `errno`
* **Conceptual Focus:** Diagnosing kernel failures.
  * When a system call fails, it returns `-1` and sets a global integer variable `errno` to indicate the error code.
  * Diagnosing errors using standard macros: `EACCES` (Permission denied), `ENOENT` (No such file), `EAGAIN` (Resource temporarily unavailable).
  * Safe error mapping: using `strerror` and `perror` to translate integer codes into readable strings.
  * **Safety warning:** `strerror` is not thread-safe. Use `strerror_r` in concurrent code.

---

### Thursday: Memory-Mapped Files (`mmap`)
* **Conceptual Focus:** Direct virtual mapping.
  * Instead of executing slow `read`/`write` calls to copy data between disk caches and user space buffers, `mmap` maps a file's disk sectors directly into the process's virtual memory map.
  * Reading from the file is as fast as reading directly from a pointer!
  * Modifying the mapped pointer automatically flushes changes to the disk.
* **Hands-on Exercise:**
  Map a file into memory and print its contents using pure character pointer arithmetic:
  ```c
  #include <stdio.h>
  #include <sys/mman.h>
  #include <sys/stat.h>
  #include <fcntl.h>
  #include <unistd.h>
  
  int main(void) {
      int fd = open("log.txt", O_RDONLY);
      if (fd < 0) return -1;
      
      struct stat sb;
      fstat(fd, &sb); // Get file details
      
      // Map file to memory
      char *mapped = mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
      if (mapped == MAP_FAILED) {
          close(fd);
          return -1;
      }
      
      // Print mapped contents
      for (off_t i = 0; i < sb.st_size; i++) {
          putchar(mapped[i]);
      }
      
      munmap(mapped, sb.st_size); // Unmap
      close(fd);
      return 0;
  }
  ```

---

### Friday: Defensive System Call Integrations
* **Conceptual Focus:** Managing partial writes and EINTR interrupts.
  * System calls can be interrupted by signals (`EINTR`). Your code must handle loop recovery.
  * Partial writes: `write` might only write some of your buffer. You must track and retry.

---

## 🛠️ Hands-On Assignment: High-Performance Log File Parser
Design and build a low-level, high-performance file parsing engine that scans logs using `mmap` and compiles error reports using unbuffered I/O.

### 1. Requirements
* Open files using `open()` with safe permissions checks.
* Map files into memory using `mmap()`.
* Parse files line-by-line, searching for lines containing `"ERROR"` or `"CRITICAL"`.
* Write matching log events to an output file named `audit.log` using unbuffered system calls (`write()`).
* Incorporate robust `errno` checking at every stage (opening, mapping, parsing, writing).

### 2. File Deliverables
* `parser.h`: Buffer sizes, function prototypes, and boundaries.
* `parser.c`: Memory-mapped parsing and direct file writes.
* `main.c`: Unit tests and log generators.

---

## 📋 Deliverables Checklist
- [ ] `parser.h` (Clean interface declarations)
- [ ] `parser.c` (Safe `mmap` execution, loop retry controls)
- [ ] `main.c` (Log generator and test validations)
- [ ] `Makefile` (Strict C11 compiler setup)

---

## ❓ Self-Check Questions
1. Why does standard library buffered I/O outperform unbuffered system calls when performing massive numbers of small write operations?
2. What are the three standard file descriptors, and what integer values represent them in the kernel table?
3. How does `errno` behave in multi-threaded programs, and why is `strerror` considered thread-unsafe?
4. Explain the mechanics of memory paging and how `mmap` links disk sectors directly to virtual address pointer paths.
5. Why must you loop the `write()` system call when serializing a buffer to an output channel?

---

## 🚀 Stretch Task
Implement a **Read-Write Memory Mapper** log editor. Write an application that opens a binary log, maps it with write permissions (`PROT_WRITE` / `MAP_SHARED`), scans for coordinates values, and modifies them in place directly via pointer modification, verifying that updates persist to disk.

---

## 💡 Motivation Checkpoint
High-performance database engines (like RocksDB, SQLite, and MongoDB) use memory-mapping and low-level unbuffered file handles to bypass OS operating system caching layers. This allows database engines to achieve maximum read speeds and control raw disk operations with absolute sub-millisecond precision.

---

## 🎓 Trainer Review Rules
* Verify error paths: Attempting to parse missing or protected files must set explicit custom diagnostic outputs and report the correct `errno` message.
* Standard buffered streams (like `fopen`, `fprintf`, `fscanf`) are strictly banned from your parser files. Everything must be written via system-level unbuffered calls.
