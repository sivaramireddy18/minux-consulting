# Week 01: Compiler Mechanics & Build Systems

## 🎯 Weekly Goal
Understand how human-readable C files are transformed into machine-executable binaries, control every stage of the compilation pipeline (preprocessing, compilation, assembly, linking), and master automated build systems using GNU Make.

## 🎓 Weekly Outcome
By the end of this week, you will be able to dissect ELF binaries, explain compilation flags, write robust Makefiles that handle automated file dependency-tracking, and build modular, clean-compiling C libraries.

---

## 📅 Session Breakdown

### Monday: The Four Stages of C Compilation
* **Conceptual Focus:** Deep-dive into the four compilation stages:
  1. **Preprocessing (`cpp`):** Header inclusion (`#include`), macro expansion (`#define`), conditional compilation (`#ifdef`). Generates `.i` files.
  2. **Compilation (`cc1`):** Translates preprocessed C code into assembly instructions. Performs syntax audits, type checks, and optimizations. Generates `.s` files.
  3. **Assembly (`as`):** Translates assembly instructions into relocatable machine instructions (object code). Generates `.o` files.
  4. **Linking (`ld`):** Resolves symbols, binds library functions, and constructs the final executable (ELF format).
* **Hands-on Experiment:**
  We will compile a simple C file, pausing at every single stage of the compiler pipeline:
  ```bash
  # 1. Preprocess only (observe the expanded macros and headers)
  gcc -E main.c -o main.i
  
  # 2. Compile to assembly (read the assembly registers)
  gcc -S main.i -o main.s
  
  # 3. Assemble to object file (raw binary code)
  gcc -c main.s -o main.o
  
  # 4. Link to final executable
  gcc main.o -o main_exec
  ```

---

### Tuesday: The Professional Compiler Flag Suite
* **Conceptual Focus:** Mastering the flags that distinguish professional systems-level engineers from hobbyists.
* **Core Flag Index:**
  * `-Wall -Wextra -Werror -pedantic`: Force complete conformance, converting all warnings into fatal compilation errors.
  * `-O2` vs `-O0`: Understand compiler optimizations (register assignments, loop unrolling, instruction scheduling) and how they affect debugging.
  * `-g3 -ggdb`: Include rich debugging symbols for GDB, enabling you to inspect macros at runtime.
* **Hands-on Exercise:**
  Compile a C code that contains latent bugs (e.g. uninitialized variable use, unused function parameters) and observe how the flag suite prevents compilation.
  ```c
  /* unsafe.c */
  #include <stdio.h>
  int main(void) {
      int x; // Uninitialized
      printf("Value: %d\n", x);
      return 0;
  }
  ```
  Compile with:
  ```bash
  gcc -std=c11 -Wall -Wextra -Werror -pedantic -O2 unsafe.c -o unsafe
  ```
  Observe the compilation aborting immediately.

---

### Wednesday: Object Files & Symbol Resolution
* **Conceptual Focus:** Dissecting Relocatable Object Files (`.o`) and Symbol Tables.
  * What is the difference between global, static, and external symbols?
  * Understanding symbols states: Undefined (`U`), Text (`T`), Data (`D`), BSS (`B`).
* **Hands-on Tools:**
  Using `nm` and `objdump` to trace symbols and raw sections inside object files:
  ```bash
  # View all symbols inside an object file
  nm main.o
  
  # Inspect ELF sections (.text, .data, .bss, .rodata)
  objdump -h main.o
  
  # Disassemble binary code into readable assembly instructions
  objdump -d main.o
  ```

---

### Thursday: Introduction to GNU Make
* **Conceptual Focus:** Automated builds using Makefiles.
  * Makefile anatomy: Targets, Dependencies, and Commands.
  * The critical role of tabs vs spaces (Make rules *must* be indented with a single tab character).
  * Standard variables: `CC`, `CFLAGS`, `LDFLAGS`, `SRC`, `OBJ`, `TARGET`.
* **Hands-on Experiment:**
  Write a basic Makefile that compiles a three-file project.
  ```makefile
  CC = gcc
  CFLAGS = -std=c11 -Wall -Wextra -Werror -pedantic -g
  
  all: app
  
  app: main.o utils.o
  	$(CC) $(CFLAGS) main.o utils.o -o app
  
  main.o: main.c
  	$(CC) $(CFLAGS) -c main.c -o main.o
  
  utils.o: utils.c
  	$(CC) $(CFLAGS) -c utils.c -o utils.o
  
  clean:
  	rm -f *.o app
  ```

---

### Friday: Advanced Makefiles & Auto-Dependency Tracking
* **Conceptual Focus:** Hand-writing manual dependency rules scales poorly. If a header file (`utils.h`) changes, `main.c` must be recompiled.
* **Dynamic Dependency Generation:** Using GCC flags `-MMD -MP` to auto-generate dependency files (`.d`) containing all header relationships.
* **Hands-on Project:**
  Build a production-grade, reusable Makefile that handles directory separation (`src/`, `build/`, `bin/`) and automatically tracks all header changes.

---

## 🛠️ Hands-On Assignment: Modular Matrix Math Library
Design, build, and modularize a multi-file matrix operations library containing matrix addition, transpose, and scalar multiplication, governed by a professional Makefile.

### 1. Code Architecture
Create three files:
* `matrix.h`: Data structures and safe function declarations.
* `matrix.c`: Implementations of matrix operations with safe boundary check inputs.
* `main.c`: Test scenarios and performance audits.

### 2. Header Structure (`matrix.h`)
```c
#ifndef MATRIX_H
#define MATRIX_H

#define MAX_ROWS 10
#define MAX_COLS 10

typedef struct {
    int rows;
    int cols;
    double data[MAX_ROWS][MAX_COLS];
} Matrix;

/* Safely initialize a matrix */
int matrix_init(Matrix *m, int rows, int cols, const double *values);

/* Safely print a matrix */
void matrix_print(const Matrix *m);

/* Add m1 and m2, store result in dest. Return 0 on success, -1 on size mismatch. */
int matrix_add(const Matrix *m1, const Matrix *m2, Matrix *dest);

#endif /* MATRIX_H */
```

### 3. The Professional Makefile
Write an automated Makefile that compiles your files. It *must* generate a `.d` dependency file for every source file, so that updating `matrix.h` automatically triggers the rebuild of all C files that include it.

---

## 📋 Deliverables Checklist
- [ ] `matrix.h` (Clean interfaces, header guards)
- [ ] `matrix.c` (Bounds-checked matrix routines)
- [ ] `main.c` (Rich test framework)
- [ ] `Makefile` (Automated dependencies, separate `build/` directory)

---

## ❓ Self-Check Questions
1. Why does the compiler preprocessor expand `#include <stdio.h>` by copying the raw file content instead of linking it directly?
2. What is the difference between compiler warnings with and without the `-pedantic` flag?
3. How do the compiler flags `-MMD` and `-MP` work together to generate Makefile dependencies automatically?
4. What is the distinction between relocatable object files (`.o`) and executables (`ELF`) during symbol resolution?
5. Why are variables defined inside header files (`.h`) a major hazard when compiling multi-file C programs?

---

## 🚀 Stretch Task
Modify your Makefile to build your matrix operations into a **Dynamic Shared Library** (`.so`) file. Update the Makefile to link your test binary against this dynamic library at compile time, and configure the runtime search path (`-Wl,-rpath`) so the executable can locate the `.so` without system-wide installation.

---

## 💡 Motivation Checkpoint
In large-scale systems (like the Linux kernel, which has over 20 million lines of C code), compiling the entire system from scratch on every minor change is impossible. Mastering incremental compilation, dependency generation, and symbol tables is the baseline skill that allows you to work inside professional systems architectures without breaking builds or wasting compilation hours.

---

## 🎓 Trainer Review Rules
* Compile code using `make`—it must compile with zero errors or warnings under the mandatory flag suite.
* Verify incremental compiling: modifying `matrix.h` must recompile `matrix.c` and `main.c`. Modifying *only* `main.c` must *not* recompile `matrix.c`.
* The Makefile must clear all object files and dependencies cleanly on `make clean`.
