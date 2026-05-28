# Weekly Execution Plan: Week 14

## 🎯 Weekly Goal
Master compiler toolchain construction, write advanced Makefiles containing automatic dependency tracking, understand the anatomy of Executable and Linkable Format (ELF) binary files, and dissect symbols using binary utilities.

## 🏆 Weekly Outcome
By Friday, the student will have built a complex, multi-file C project coordinated entirely by a custom **Incremental Makefile** containing variable mappings and pattern rules. They will be able to dissect compiled ELF outputs, inspect symbol tables, measure section sizes, and decode compiler optimizations.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The GCC Compilation Pipeline & Core Flags
* **Conceptual Objective**: Master the flags and stages of the GNU Compiler Collection (GCC). Study optimization levels (`-O0`, `-O1`, `-O2`, `-O3`, `-Os`), debug options (`-g`), warnings (`-Wall`, `-Wextra`, `-pedantic`), and code safety flags (`-Werror`).
* **Practical Activity**:
  1. Compile a multi-file project manually using individual GCC calls.
  2. Experiment with optimizing code sizes using different flags and document results.
* **Code/Circuit Reference**:
```bash
# Compile and link with strict diagnostics
gcc -Wall -Wextra -Werror -pedantic -O2 -g -Iinclude/ -c src/helper.c -o build/helper.o
```

### Tuesday: Writing Modular Makefiles
* **Conceptual Objective**: Study GNU Make rules: Targets, Dependencies, and Commands. Understand how Make determines incremental rebuilds based on file modification timestamps. Master variables, automatic variables (`$@` target, `$<` first dependency, `$^` all dependencies), and clean commands.
* **Practical Activity**:
  1. Write a basic Makefile.
  2. Implement clean commands to wipe objects and final executables safely.
* **Code/Circuit Reference**:
```makefile
# Simple Makefile structure
CC = gcc
CFLAGS = -Wall -Wextra -O2 -Iinclude

build/app: build/main.o build/helper.o
	$(CC) $(CFLAGS) $^ -o $@

build/%.o: src/%.c
	mkdir -p build
	$(CC) $(CFLAGS) -c $< -o $@
```

### Wednesday: Makefile Auto-Dependency Generation
* **Conceptual Objective**: Understand a classic Makefile bug: if a header file (`.h`) is modified, the compiler should rebuild any C files that include it, but standard rules do not monitor headers. Study GCC's preprocessor options (`-MMD -MP`) to automatically output dependency files (`.d`) and integrate them into Make.
* **Practical Activity**:
  1. Modify your Makefile to include automatic dependency tracking.
  2. Test modifying a header and verify Make triggers incremental recompilation of dependant source files.
* **Code/Circuit Reference**:
```makefile
# Makefile with auto-dependency tracking
SRCS = $(wildcard src/*.c)
OBJS = $(SRCS:src/%.c=build/%.o)
DEPS = $(OBJS:.o=.d)

-include $(DEPS)

build/%.o: src/%.c
	mkdir -p build
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@
```

### Thursday: Executable and Linkable Format (ELF) Anatomy
* **Conceptual Objective**: Dissect the Executable and Linkable Format (ELF) specification—the universal standard for executable binaries inside Linux and embedded systems. Understand:
  - **ELF Header**: Identifies architecture, entry point address, and format.
  - **Program Header Table**: Specifies how segments map to system memory (loadable blocks).
  - **Section Header Table**: Defines locations of `.text`, `.data`, `.bss`, `.rodata`, `.symtab` (Symbol Table), and `.strtab` (String Table).
* **Practical Activity**:
  1. Compile a C binary.
  2. Run system tools (`readelf`, `file`) to extract format details and segment alignments.
* **Code/Circuit Reference**:
```bash
# Read ELF header of compiled binary
readelf -h build/app

# List all section headers and virtual addresses
readelf -S build/app
```

### Friday: Dissecting Symbols with Binary Utilities
* **Conceptual Objective**: Master the binary utilities suite (`nm`, `objdump`, `size`, `strip`) to inspect compiled binary details. Learn how to locate symbol types (Global vs Local), verify section size footprints, and disassemble machine instructions.
* **Practical Activity**:
  1. Run `size` to measure memory usage.
  2. Run `nm` to list all functions and global variables.
  3. Disassemble specific functions using `objdump -d` and trace assembly instructions.
* **Code/Circuit Reference**:
```bash
# List footprints of sections in human-readable bytes
size build/app

# Disassemble main function specifically
objdump -d build/app | grep -A 20 "<main>:"
```

---

## 🛠️ Hands-On Assignment: Automated Build and Symbol Dissecting System

### Functional Requirements
Create a fully modular, multi-file C math library coordinated by a custom, production-grade Makefile, and build an automated shell pipeline to analyze symbol tables.
1. The project must have clean structure: `src/main.c`, `src/math.c`, `include/math.h`, and a root `Makefile`.
2. The Makefile must:
   - Use compile flags `-Wall -Wextra -Werror -O2 -g`.
   - Maintain intermediate objects (`.o`) and dependency tracking files (`.d`) inside a dedicated `build/` directory.
   - Re-compile only modified source and header dependencies.
3. Write a shell script named `dissect_symbols.sh` that compiles the project, then programmatically parses the final ELF executable using binary tools to output a report `symbol_report.txt` containing:
   - Total text segment footprint.
   - List of all global symbols defined in `src/math.c` and their virtual memory offsets.
   - Verification that debugging symbols exist in the ELF.

### Structural Requirements & Code Skeleton
**`Makefile`**:
```makefile
CC = gcc
CFLAGS = -Wall -Wextra -Werror -O2 -g -Iinclude
SRC_DIR = src
BUILD_DIR = build
TARGET = $(BUILD_DIR)/app

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(SRCS:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)
DEPS = $(OBJS:.o=.d)

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJS)
	@mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) $^ -o $@

-include $(DEPS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

clean:
	rm -rf $(BUILD_DIR)
```

**`dissect_symbols.sh` (Shell Skeleton)**:
```bash
#!/usr/bin/env bash
set -euo pipefail

# Compile
make clean
make

REPORT="symbol_report.txt"

echo "=== ELF Symbol Dissection Report ===" > "$REPORT"
echo "Binary: build/app" >> "$REPORT"
echo "Date: $(date)" >> "$REPORT"
echo "------------------------------------" >> "$REPORT"

# 1. Section Footprints
echo "Section Sizes:" >> "$REPORT"
size build/app >> "$REPORT"
echo "------------------------------------" >> "$REPORT"

# 2. Extract math helper functions offsets
echo "Math Library Symbols (Global Functions):" >> "$REPORT"
nm build/app | grep -E ' T | t ' | grep -iE 'add|sub|mul|div|math' >> "$REPORT" || echo "No matching symbols" >> "$REPORT"
echo "------------------------------------" >> "$REPORT"

# 3. Check for debug symbols presence
if readelf -S build/app | grep -q "debug_info"; then
    echo "Debug Symbols status: PRESENT" >> "$REPORT"
else
    echo "Debug Symbols status: MISSING" >> "$REPORT"
fi

cat "$REPORT"
```

---

## 📦 Deliverables
* [ ] Multi-file C library workspace (`main.c`, `math.c`, `math.h`).
* [ ] Automated `Makefile` with pattern rules and auto-dependency generation.
* [ ] Automated Shell Analyzer `dissect_symbols.sh` and output report `symbol_report.txt`.

---

## ❓ Self-Check Questions
1. Why does the compiler compile each C file into an individual object file (`.o`) before linking? What is the function of the linker in this pipeline?
2. What are Makefile **automatic variables**? State the exact meanings of `$@`, `$<`, and `$^`.
3. How does automatic dependency tracking (`-MMD -MP`) prevent stale builds when header files are modified? Trace how Make utilizes the generated `.d` files.
4. What is the fundamental difference between the **Program Header Table** and the **Section Header Table** inside an ELF file? Which table is used by the operating system loader?
5. How does the `strip` command affect executable file sizes? Why should you never strip an ELF binary prior to debugging inside `gdb`?

---

## 🚀 Stretch Task (Optional)
Extend the Makefile to compile the C library into a **Dynamic Shared Library** (`.so` file) instead of a static binary, and verify dynamic linkages using the `ldd` utility.

## 💡 Motivation Checkpoint
Modern build systems coordinate thousands of source files. When you write custom code on an embedded board, you must understand exactly how compiled symbols are routed to target Flash/SRAM, how compiler optimization structures alter timing, and how to verify symbol placements. Understanding toolchains is the baseline differentiator of systems developers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Makefile executes incremental compilation flawlessly (modifying `math.h` triggers recomps, running double makes does nothing).
  - Symbol report accurately isolates compiler function offsets.
  - Zero warnings compiled with `-Wall -Wextra -Werror`.
* **Fail Criteria**:
  - Makefile missing automatic variable optimization rules.
  - Manual recompiles required after header changes.
