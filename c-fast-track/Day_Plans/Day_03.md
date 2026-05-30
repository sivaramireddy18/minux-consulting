# Microscopic Daily Vetting Specification
## Phase 1: Compiler & Toolchains | Day 03: Relocatable Object Files Dissection and Symbol Resolution

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 03 of 45 | Phase: Phase 1: Compiler & Toolchains
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore relocatable object files (.o) and ELF segment architecture. Map the physical layout of standard sections: .text (machine code), .data (initialized global/static variables), .bss (uninitialized variables zeroed out at startup), and .rodata (read-only constants). Understand symbol tables and states (Text 'T', Data 'D', BSS 'B', Undefined 'U').

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a C file defining variables in each of these sections. Compile to an object file using the '-c' flag. Use 'nm', 'objdump', and 'readelf' to dissect the symbols and sections. Confirm that global variables mapped to appropriate segments and trace dynamic relocations.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Mapping variables to ELF Segments and auditing symbols
#include <stdint.h>

// Initialized global - maps to .data
uint32_t active_state_flag = 0xDEADC0DEU;

// Uninitialized global - maps to .bss
uint32_t sensor_telemetry_buffer[100];

// Read-only constant - maps to .rodata
const char device_serial_number[] = "SN-2026-X8";

// Local static initialized - maps to .data
uint32_t get_system_ticks(void) {
    static uint32_t tick_counter = 1000U;
    return ++tick_counter;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Run 'nm -S -S symbol_test.o' and 'objdump -h symbol_test.o'. Verify that active_state_flag is in the 'D' (data) section, sensor_telemetry_buffer is in the 'B' (bss) section, and device_serial_number is in the 'R' (rodata) section.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
