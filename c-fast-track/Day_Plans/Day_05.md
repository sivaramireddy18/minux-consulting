# Microscopic Daily Vetting Specification
## Phase 1: Compiler & Toolchains | Day 05: GNU Make, Implicit Dependencies, and Incremental Builds

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 05 of 45 | Phase: Phase 1: Compiler & Toolchains
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the architecture of GNU Make. Learn rule structures (targets, prerequisites, recipes). Study Makefile variables, automatic variables ($@, $<, $^), pattern matching, and implicit rules. Master header dependency tracking using gcc options (-MMD, -MP) to ensure incremental builds compile safely when headers change.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a professional, production-grade Makefile for a multi-file C project. Configure compiler flags, directory clean targets, and automatic header file dependency generation. Touch a header file and verify that only the affected files recompile, leaving unmodified objects intact.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
# Production-Grade Makefile template with automatic dependency tracking
CC = gcc
CFLAGS = -std=c11 -Wall -Wextra -Werror -pedantic -g3 -O2 -MMD -MP
LDFLAGS = 

SRC_DIR = src
OBJ_DIR = obj
TARGET = app

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(SRCS:$(SRC_DIR)/%.c=$(OBJ_DIR)/%.o)
DEPS = $(OBJS:.o=.d)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)

clean:
	rm -rf $(OBJ_DIR) $(TARGET)

-include $(DEPS)
.PHONY: all clean
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Create a test project with main.c and utils.h. Compile using 'make'. Change a comment inside 'utils.h', run 'make' again, and verify that only objects depending on 'utils.h' are recompiled.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
