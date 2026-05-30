# Microscopic Daily Vetting Specification
## Phase 7: POSIX System Boundaries | Day 31: System Call Boundaries and Unbuffered POSIX I/O

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 31 of 45 | Phase: Phase 7: POSIX System Boundaries
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study the interface boundary between user space and kernel space. Contrast standard C library buffered calls (fopen, fread, fwrite) with POSIX unbuffered system calls (open, read, write, close). Understand file descriptors, system call context switches, and read/write buffering performance differences.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a file copying utility using raw POSIX 'open', 'read', 'write', and 'close' system calls. Run performance benchmark comparisons against a standard 'fread'/'fwrite' buffered implementation using large block sizes.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// File copy utility using POSIX system calls
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdint.h>

#define BUFFER_SIZE 4096

int copy_file_posix(const char *src_path, const char *dest_path) {
    int src_fd = open(src_path, O_RDONLY);
    if (src_fd < 0) return -1;
    
    // Open destination: write-only, create if missing, truncate if exists, permission 0644
    int dest_fd = open(dest_path, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (dest_fd < 0) {
        close(src_fd);
        return -2;
    }
    
    uint8_t buffer[BUFFER_SIZE];
    ssize_t bytes_read;
    while ((bytes_read = read(src_fd, buffer, BUFFER_SIZE)) > 0) {
        ssize_t bytes_written = write(dest_fd, buffer, bytes_read);
        if (bytes_written != bytes_read) {
            close(src_fd);
            close(dest_fd);
            return -3; // Write error
        }
    }
    
    close(src_fd);
    close(dest_fd);
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile the utility. Run with large source text files. Confirm the copied output matches the source file exactly using the 'md5sum' or 'diff' terminal utilities.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
