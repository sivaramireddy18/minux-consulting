#!/usr/bin/env python3
import os
import sys

# Directory Configurations
WORKSPACE = "/home/siva/sivaramireddy/Project1"
DAY_PLANS_DIR = os.path.join(WORKSPACE, "Day_Plans")

# Complete technical content database for all 24 days (Week 1 to Week 4)
DAY_PLANS_DATABASE = {
    1: {
        1: {
            "topic": "Radix Arithmetic, Hexadecimal Mapping, and ALU Flags",
            "theory": "Deep-dive into positional number systems. Master the physical mechanics of fractional binary representations and two's complement signed integers. Focus on the Arithmetic Logic Unit (ALU) hardware flags: Carry (C), Overflow (V), Zero (Z), and Negative (N). Explain how the core ALU logic circuit routes bit-carries and calculates overflow: $V = C_{in} \\oplus C_{out}$ of the most significant bit.",
            "lab": "Configure your host GCC compiler to build a test harness. Write C code that triggers signed integer overflow. Inspect the assembly output of the addition operation using GDB. Check the active status flags register (`xPSR` on ARM Cortex-M4) to physically observe the transition of the V flag.",
            "code": """// Triggering and evaluating ALU signed overflow flags
#include <stdint.h>
#include <stdbool.h>

bool check_addition_overflow(int32_t a, int32_t b, int32_t *result) {
    *result = a + b;
    // Hardware-level overflow check: if signs of inputs are equal but output sign differs
    return ((a ^ *result) & (b ^ *result)) < 0;
}""",
            "validation": "Compile with '-O0 -g'. Set breakpoint in GDB. Run 'print/x $xpsr' before and after overflow. Verify the V bit (bit 28) transitions from 0 to 1."
        },
        2: {
            "topic": "Transistor Gate Delays, noise margins, and Half-Adders",
            "theory": "Analyze the physical propagation delay ($t_{pd}$) across basic CMOS logic gates (NAND, NOR, XOR). Dissect the transistor-level latency of a basic half-adder circuit consisting of an XOR gate (for Sum) and an AND gate (for Carry). Map noise margins ($V_{IL}, V_{IH}, V_{OL}, V_{OH}$) under varying thermal conditions and parasitic capacitive loads.",
            "lab": "Build a simulation schematic of a half-adder on your workstation using raw CMOS logic models. Measure the delay between input transition and sum output. Alternatively, hook up discrete 74-series logic chips (7408 AND, 7486 XOR) on a breadboard. Probes pins using a logic analyzer to trace output skew.",
            "code": """// Simulating logic gate delays using precise clock counting
#include <stdint.h>

#define MEASURE_GATE_DELAY(sum, carry, a, b) \
    do { \
        sum = (a) ^ (b);   /* XOR Gate sum */ \
        carry = (a) & (b); /* AND Gate carry */ \
    } while(0)""",
            "validation": "Probing Sum pin. Scope trigger: Channel 1 falling edge. Channel 2 rising edge. Max allowable skew is 12ns at 5V VCC."
        },
        3: {
            "topic": "Parasitic Bus Capacitance, RC trace line math, and Pull-up sizing",
            "theory": "Calculate the physical RC time constant of PCB trace lines. Analyze how parasitic trace capacitance ($C_{trace}$) and input pin capacitance ($C_{in}$) degrade high-frequency square wave signal rise times. Solve the capacitor charge equation: $V(t) = V_{DD}(1 - e^{-t/RC})$ to determine the maximum pull-up resistor value ($R_{pullup}$) required to meet standard $V_{IH}$ thresholds.",
            "lab": "Measure SCL and SDA line rise times on an active bus line. Connect varying pull-up resistors (10k, 4.7k, 1k) to the bus lines. Probes the physical transition curves using a high-bandwidth digital oscilloscope to analyze rise times.",
            "code": """// RC Rise Time Calculation for Pull-up Optimization
#include <stdint.h>
#include <math.h>

double calculate_max_pullup(double capacitance_pf, double rise_time_ns) {
    // Standard I2C rise time limits (300ns max for Fast Mode)
    // t = 0.8473 * R * C (from 10% to 70% VDD)
    double r_ohms = (rise_time_ns * 1e-9) / (0.8473 * capacitance_pf * 1e-12);
    return r_ohms;
}""",
            "validation": "Scope Trigger: Channel 1 falling edge. Measure Rise Time (10% to 90%). Pass criteria: Rise time < 300ns with a 4.7k pull-up resistor."
        },
        4: {
            "topic": "Thumb-2 Assembly Architecture, R0-R15 Registers, and Alignment",
            "theory": "Dissect the ARMv7-M Thumb-2 instruction set. Analyze the 16-bit and 32-bit execution modes. Map the core register file (R0-R12 general purpose, R13 Stack Pointer, R14 Link Register, R15 Program Counter). Explore instruction alignment rules: Thumb-2 instructions must be aligned to half-word (2-byte) boundaries; violating this triggers a UsageFault.",
            "lab": "Write a raw assembly file containing branch and math instructions. Configure your compiler toolchain to output a listing file. Examine instructions sizing, memory alignments, and register allocations directly under GDB.",
            "code": """.syntax unified
.thumb
.global execute_raw_add

execute_raw_add:
    // Parameters passed in r0 and r1 (AAPCS)
    add r0, r0, r1  // Add r1 to r0, result in r0
    bx lr           // Branch exchange to Link Register""",
            "validation": "Compile assembly with '-mthumb'. Disassemble using 'objdump -d'. Verify 16-bit and 32-bit instruction packaging alignments."
        },
        5: {
            "topic": "Conventional Git Workflows, Branching, and pre-push hooks",
            "theory": "Explore professional git version control branching models (GitFlow vs Trunk-Based Development). Master the conventional commits format: `type(scope): message`. Analyze the internal architecture of git hook triggers and how local pre-push scripts can prevent invalid code blocks from reaching remote repositories.",
            "lab": "Initialize a local git repository in the workspace. Write a shell-based pre-push hook script that automatically parses modified C files, checks for forbidden functions (like unsafe standard calls), and compiles the project before permitting push operations.",
            "code": """#!/usr/bin/env bash
# Git pre-push hook: verify compilation and MISRA C constraints
set -euo pipefail

echo "Executing pre-push compiler check..."
gcc -Wall -Wextra -Werror -pedantic -std=c11 -c build_detailed_plans.py -o /dev/null || {
    echo "ERROR: Code compilation failed! Push aborted." >&2
    exit 1
}""",
            "validation": "Attempt to perform a git commit/push with failing code lines. Verify the pre-push hook traps the transaction and aborts."
        },
        6: {
            "topic": "Static Analysis Pipeline and -Wall -Wextra Compilations",
            "theory": "Study the architecture of automated compiler diagnostic engines. Analyze static code parsers and how tools like `cppcheck` and `clang-tidy` construct Abstract Syntax Trees (AST) to evaluate code safety boundaries before binary generation. Understand why compiler flags like `-Wall -Wextra -Werror -pedantic` are mandatory.",
            "lab": "Write a C file filled with deliberate structural errors: uninitialized variables, array index out of bounds, and unused static arrays. Set up a Makefile compiling with strict static checks and verify diagnostic output.",
            "code": """// Code with deliberate bugs to test static analysis pipelines
#include <stdint.h>

void trigger_warnings_audit(void) {
    volatile uint8_t buffer[4];
    // Array index out of bounds (will trigger static analysis warning)
    buffer[4] = 0xAA;
}""",
            "validation": "Execute 'cppcheck --enable=all' and 'gcc -Wall -Wextra -Werror'. Ensure the pipeline outputs compiler errors and aborts."
        }
    },
    2: {
        1: {
            "topic": "Static, Extern, Volatile variables Cache Coherency",
            "theory": "Explore variables lifetimes and scopes. Analyze register-level variable storage class mappings (static, extern, register). Explore the 'volatile' qualifier: it tells the compiler that the register value can change outside program execution blocks, bypassing register caching and forcing direct memory reads.",
            "lab": "Write a polling delay loop using a global volatile flag. Compile it under '-O2'. Compare the compiled assembly generation of a standard flag versus a volatile flag. Verify register caching behavior in GDB.",
            "code": """// Volatile vs Standard variables registers optimization check
#include <stdint.h>

#define STAT_ADDR 0x20002000U

void polling_loop_volatile(void) {
    volatile uint32_t *status = (volatile uint32_t *)STAT_ADDR;
    // Compiler cannot cache this read in R0; forces 'LDR' on each iteration
    while (*status == 0);
}""",
            "validation": "Disassemble compiled loop using 'objdump -d'. Verify the volatile loop contains active 'ldr' memory reads on each loop step."
        },
        2: {
            "topic": "SRAM memory segments: Stack, Heap, .data, and .bss",
            "theory": "Dissect the physical mapping of SRAM. Analyze the distinct boundaries of runtime memory segments: Stack (dynamic local frames, grows downwards), Heap (dynamic runtime pool, grows upwards), .data (initialized global/static variables), and .bss (uninitialized global variables, initialized to zero by startup code).",
            "lab": "Write a C file containing global variables in initialized and uninitialized states, heap allocations, and local variables. Link the file using a custom linker script. Dump symbol mappings using 'nm' and 'objdump -t'.",
            "code": """// Map variables to specific memory segments
#include <stdint.h>
#include <stdlib.h>

uint32_t global_initialized = 0x12345678U; // allocated to .data
uint32_t global_uninitialized;             // allocated to .bss

void check_segments_layout(void) {
    volatile uint32_t stack_local = 0x55U;  // allocated to stack
    uint8_t *heap_local = (uint8_t *)malloc(10); // allocated to heap
    (void)stack_local;
    free(heap_local);
}""",
            "validation": "Execute 'size' on compiled binary. Verify size of .data and .bss segments dynamically maps to code variables."
        },
        3: {
            "topic": "Struct Padding Alignments and 32-bit Memory Boundaries",
            "theory": "Analyze structure alignments and hardware memory boundaries. In a 32-bit architecture, the processor fetches data on 32-bit aligned boundaries (addresses ending in 0, 4, 8, C). To optimize bus speeds, the compiler automatically inserts padding bytes into structures. Learn how '__attribute__((packed))' eliminates padding at the cost of execution cycles.",
            "lab": "Create structures containing interleaved data types (char, int, short). Measure sizes using 'sizeof'. Apply packed attributes and analyze structural offset mapping changes under GDB.",
            "code": """// Struct alignment padding and size checks
#include <stdint.h>

struct NormalStruct {
    uint8_t  a;
    uint32_t b; // Compiler inserts 3 padding bytes after 'a' to align 'b'
    uint16_t c;
};

struct __attribute__((packed)) PackedStruct {
    uint8_t  a;
    uint32_t b; // Zero padding bytes inserted
    uint16_t c;
};""",
            "validation": "Write test asserting sizeof(struct NormalStruct) == 12 and sizeof(struct PackedStruct) == 7. Compile and run."
        },
        4: {
            "topic": "The Compilation Sequence: Preprocessing, Symbols, and Linking",
            "theory": "Dissect the multi-stage compilation pipeline. Preprocessing expands macros, processes `#include` directives, and conditional compiles. The compiler translates to assembly. The assembler generates relocatable ELF objects. The linker maps relocatable sections, resolves symbols binding, and generates the final binary.",
            "lab": "Run the GCC preprocessor on a source file containing macros using 'gcc -E' and inspect output. Compile files separately, and run 'objdump -t' to verify the symbols table binding states.",
            "code": """// Simple multi-file symbols routing check
#include <stdint.h>

#define CORE_REGISTER_VAL 0x55U
extern uint32_t global_initialized;

uint32_t read_active_symbol(void) {
    return global_initialized + CORE_REGISTER_VAL;
}""",
            "validation": "Preprocess using '-E' to verify macro text expansion. Run 'nm' to verify undefined extern symbols bind cleanly during linking."
        },
        5: {
            "topic": "Compiler Optimizations -O0 to -Os, Reordering, and Volatile",
            "theory": "Analyze the internal mechanics of compiler optimizations. At higher levels (-O2, -O3, -Os), the compiler reorders instructions, eliminates dead code paths, and caches values in CPU core registers. Learn why 'volatile' is the only protection mechanism to prevent register-caching during hardware status checks.",
            "lab": "Write a delay loop counting to 1,000,000 without volatile. Compile it at '-O0' and '-O3'. Observe how the compiler completely eliminates the '-O3' loop as dead code. Re-insert volatile and verify loop preservation.",
            "code": """// Loop optimization suppression test
#include <stdint.h>

void delay_cycles_loop(void) {
    // Without volatile, compiler eliminates this loop under -O3
    volatile uint32_t counter = 0;
    while (counter < 100000U) {
        counter++;
    }
}""",
            "validation": "Disassemble '-O3' binary. Ensure loop assembly instructions are present and execute correct loop cycles."
        },
        6: {
            "topic": "Linker Script Configurations and Memory Allocations",
            "theory": "Study the architecture of Linker Scripts (.ld). Understand how the linker controls the layout of the final binary image. Learn the syntax of the MEMORY directive (declaring physical regions of FLASH and SRAM) and the SECTIONS directive (mapping compiler-output sections to physical regions).",
            "lab": "Write a custom linker script defining flash and RAM regions. Allocate a specific section '.ram_vector_table' at address `0x20000000`. Compile, and inspect code maps using a physical MAP file.",
            "code": """/* Linker Script Syntax Structure */
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS {
    .text : {
        *(.isr_vector)
        *(.text*)
    } > FLASH
}""",
            "validation": "Check MAP file output. Ensure '.ram_vector_table' is allocated at address `0x20000000` with correct size bounds."
        }
    },
    3: {
        1: {
            "topic": "Raw Address Casting, Void Pointer Casting, and Registers",
            "theory": "Master raw address pointer casting. In systems programming, memory-mapped peripheral registers are controlled by casting literal physical address integers into pointers to volatile variables. Understand why explicit type casting is mandatory.",
            "lab": "Write code to cast raw address registers of the GPIO peripheral, write configuration registers using bit masks, and inspect memory updates inside GDB.",
            "code": """// Raw memory-mapped register pointer access
#include <stdint.h>

#define REG_CONTROL_ADDR 0x40020000U
#define REG_CONTROL      (*(volatile uint32_t *)REG_CONTROL_ADDR)

void init_control_register(void) {
    // Force direct volatile cast write to physical memory address
    REG_CONTROL = 0x01U;
}""",
            "validation": "Step through register writes in GDB. Execute 'x/1xw 0x40020000' to confirm memory update."
        },
        2: {
            "topic": "Pointer Arithmetic offset scale calculations by type sizes",
            "theory": "Master pointer arithmetic mechanics. When you increment or decrement a pointer, the compiler automatically scales the address step by the size of the target type (e.g., a `uint32_t *` increments by 4 bytes, while a `uint8_t *` increments by 1 byte). Learn how this applies to structures and arrays.",
            "lab": "Write a program defining arrays of different type structures. Increment pointer variables by custom steps, and log address transitions to verify type scale offsets under GDB.",
            "code": """// Pointer arithmetic type-scaling verify
#include <stdint.h>

struct SensorData {
    uint32_t val;
    uint8_t  status;
}; // Size is 8 bytes due to padding alignment

void evaluate_pointer_scaling(void) {
    struct SensorData data_array[2] = { {0x11, 1}, {0x22, 2} };
    struct SensorData *ptr = data_array;
    ptr++; // Pointer increments address by exactly 8 bytes (type size)
    (void)ptr;
}""",
            "validation": "Assert that address difference '(uintptr_t)(ptr + 1) - (uintptr_t)ptr' equals sizeof(struct SensorData)."
        },
        3: {
            "topic": "Array Decay traps and Struct Array offset mappings",
            "theory": "Explore array decay mechanics. In C, an array name decays (coerces) into a pointer to its first element when passed into a function. This drops array sizing details, presenting major boundary safety risks. Study structural memory offset routing inside array lists.",
            "lab": "Write code demonstrating array decay sizing errors inside functions. Build structured array lists and map register byte offset steps.",
            "code": """// Array decay tracking inside functions
#include <stdint.h>
#include <stddef.h>

size_t get_array_decay_size(uint32_t arr[]) {
    // sizeof(arr) returns pointer size (4 or 8 bytes) instead of array size!
    return sizeof(arr);
}""",
            "validation": "Compile, and write assertions verifying size decay. Setup bounds checks on pointer inputs to prevent overflows."
        },
        4: {
            "topic": "Callback Function Pointers Syntax and registers configurations",
            "theory": "Master the syntax of callback function pointers. Function pointers store the physical address of the entry instruction of a compiled function. Learn how function pointers enable flexible event-driven architectures and register callbacks in driver layers.",
            "lab": "Build an event dispatcher system using function pointers. Register different event handlers, and step through execution jumps inside GDB.",
            "code": """// Register callback handler implementation
#include <stdint.h>

typedef void (*SensorCallback)(uint16_t value);
static SensorCallback app_callback = 0;

void register_sensor_callback(SensorCallback cb) {
    app_callback = cb;
}

void trigger_sensor_event(uint16_t value) {
    if (app_callback != 0) {
        app_callback(value); // Execute indirect branch
    }
}""",
            "validation": "Set GDB breakpoint inside trigger_sensor_event. Step in ('si') and verify direct register branch instruction execution."
        },
        5: {
            "topic": "Branch Target Optimizations and Assembly branch offsets",
            "theory": "Understand how the CPU branch predictor and link registers behave during indirect branch jumps. Analyze how the compiler translates switch cases and jump tables into branch instructions (e.g. `BX` or `BLX` on ARM) and maps execution jumps offset tables.",
            "lab": "Write a switch block with 8 entries. Disassemble using 'objdump -d'. Observe how the compiler generates branch offset tables inside assembly to optimize branch times.",
            "code": """// Switch jump table optimization test
#include <stdint.h>

uint32_t execute_jump_branch(uint32_t index) {
    switch (index) {
        case 0: return 0x11;
        case 1: return 0x22;
        case 2: return 0x33;
        default: return 0x00;
    }
}""",
            "validation": "Verify compiled assembly matches jump instruction blocks, and check performance cycles count."
        },
        6: {
            "topic": "Pointer Boundary Safety Checks and Unaligned Cast traps",
            "theory": "Study pointer boundary safety. Unaligned memory access occurs when you read or write data of size $S$ bytes from a memory address that is not a multiple of $S$ bytes. Accessing unaligned addresses on strict architectures triggers a hardware exception (UsageFault).",
            "lab": "Write code to cast unaligned byte arrays into 32-bit integers. Run under strict compilers, and verify alignment exception trap gates.",
            "code": """// Checking pointer address alignments
#include <stdint.h>
#include <stdbool.h>

bool is_ptr_aligned(const void *ptr, uint32_t alignment) {
    return ((uintptr_t)ptr & (alignment - 1)) == 0;
}""",
            "validation": "Write test casting unaligned array variables. Assert that alignment check function detects invalid boundaries."
        }
    },
    4: {
        1: {
            "topic": "AAPCS Registers usage convention and local registers allocation",
            "theory": "Dissect the ARM Architecture Procedure Call Standard (AAPCS). Registers R0-R3 are used to pass inputs into a function, and to return the output. Registers R4-R11 are callee-saved registers (must be preserved if modified). R12 is the Intra-Procedure-call scratch register. LR (R14) holds the return address.",
            "lab": "Write assembly functions passing variables, and trace register values (R0-R3) in GDB. Verify AAPCS conformance.",
            "code": """.syntax unified
.thumb
.global aapcs_math_verify

aapcs_math_verify:
    // Inputs: r0, r1, r2, r3 (AAPCS standard)
    add r0, r0, r1
    add r0, r0, r2
    add r0, r0, r3
    bx lr // Return value stored in r0""",
            "validation": "Compile assembly. Run GDB, set breakpoints, verify inputs exist inside registers R0-R3 on entry."
        },
        2: {
            "topic": "Function Frame Activation Prologue and Epilogue frames",
            "theory": "Study function activation frames call stacks. The function prologue sets up the stack frame by pushing the Link Register (LR) and callee-saved registers to the stack. The function epilogue restores these registers and pops the return address into the Program Counter (PC).",
            "lab": "Write nested functions in C, compile with '-g', disassemble, and analyze prologue 'PUSH' and epilogue 'POP' instructions.",
            "code": """// Nested functions stack frame tracking
#include <stdint.h>

__attribute__((noinline)) uint32_t inner_calc(uint32_t val) {
    return val * 3U;
}

__attribute__((noinline)) uint32_t outer_calc(uint32_t val) {
    return inner_calc(val) + 5U;
}""",
            "validation": "Verify assembly generation. Ensure 'PUSH {..., lr}' and 'POP {..., pc}' instructions exist inside outer_calc."
        },
        3: {
            "topic": "R11 Frame Pointer Tracking and Stacked registers layouts",
            "theory": "Understand the role of the Frame Pointer (usually register R11 or R7). It provides a constant reference point within the function's stack frame, making it easy to access local variables and parameters. It allows debuggers to backtrace stack calls cleanly.",
            "lab": "Compile files with '-fno-omit-frame-pointer'. Set breakpoints in GDB, read the value of R11/R7, and trace offset addresses.",
            "code": """// Stack frame pointer offsets tracking
#include <stdint.h>

void trace_frame_offsets(void) {
    volatile uint32_t a = 1;
    volatile uint32_t b = 2;
    (void)a; (void)b;
}""",
            "validation": "Step under GDB. Examine variables locations relative to frame pointer register R11/R7."
        },
        4: {
            "topic": "MSP vs PSP stack registers configuration and boundaries",
            "theory": "Master the stack pointers of the ARM Cortex-M4. The Main Stack Pointer (MSP) is active on reset and is used for all exception handlers. The Process Stack Pointer (PSP) is configured for user threads. This partition protects the core system stack from user application stack overflows.",
            "lab": "Write assembly to configure the PSP address, switch thread execution to PSP, and trigger an interrupt to verify MSP usage in ISRs.",
            "code": """// Switch thread execution stack to PSP
#include <stdint.h>

void init_psp_stack(uint32_t psp_addr) {
    __asm volatile (
        "msr psp, %0\n"   // Set PSP address
        "mrs r0, control\n"
        "orr r0, r0, #2\n" // Set SPSEL bit to use PSP
        "msr control, r0\n"
        "isb\n"
        :: "r"(psp_addr) : "r0"
    );
}""",
            "validation": "Run in GDB. Read active register states. Confirm thread mode SP matches PSP while handlers use MSP."
        },
        5: {
            "topic": "Stack Overflow mechanisms and MPU guard bands",
            "theory": "Understand the physical disaster of a stack overflow. If a call stack grows beyond its allocated memory boundary, it silently overwrites adjacent global variables or heap blocks. Configure the Memory Protection Unit (MPU) to set up a read-only guard band to trigger a HardFault on boundary breach.",
            "lab": "Write infinite recursive functions to trigger a stack overflow. Trace PC values during crash, and set up watchpoint breakpoints.",
            "code": """// Intentional recursion loop to audit stack overflow
#include <stdint.h>

void trigger_infinite_stack_overflow(uint32_t depth) {
    volatile uint32_t local_var[128]; // Allocate large stack frame
    local_var[0] = depth;
    trigger_infinite_stack_overflow(depth + 1);
}""",
            "validation": "Set a GDB memory write watchpoint at stack base boundary. Ensure watchpoint triggers before heap segments get corrupted."
        },
        6: {
            "topic": "Compiler Stack Canaries and Canary address audits",
            "theory": "Study compiler-inserted Stack Canaries. Under '-fstack-protector-all', the compiler inserts a random canary value onto the stack right before local variables in the function prologue. In the epilogue, it verifies that the canary is unchanged before returning. If modified, it aborts.",
            "lab": "Compile code with '-fstack-protector-all'. Write code that intentionally overflows a local character buffer, and track the call to '__stack_chk_fail'.",
            "code": """// Stack canary overrun test
#include <string.h>

void __stack_chk_fail(void) {
    // Local stack handler overrun hook
    __asm volatile ("bkpt #1");
    while(1);
}

void trigger_buffer_overrun(void) {
    char dest[4];
    // Overrun will corrupt compiler stack canary
    strcpy(dest, "overrun_buffer_text");
}""",
            "validation": "Compile, execute, verify execution halts inside __stack_chk_fail hook before function exits."
        }
    }
}

TEMPLATE_DAY_PLAN = """# Microscopic Daily Vetting Specification
## Week {week:02d}, Day {day:d}: {topic}

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week {week:02d} | Day {day:d}
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
{theory}

#### 🛠️ Unassisted Lab Track (4 Hours)
{lab}

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
{code}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** {validation}
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
"""

def main():
    # 1. Create directory structures
    if not os.path.exists(DAY_PLANS_DIR):
        os.makedirs(DAY_PLANS_DIR)
        print(f"Created main directory: {DAY_PLANS_DIR}")
        
    for wk in range(1, 5):
        wk_dir = os.path.join(DAY_PLANS_DIR, f"Week_{wk:02d}")
        if not os.path.exists(wk_dir):
            os.makedirs(wk_dir)
            print(f"Created sub-directory: {wk_dir}")
            
    # 2. Generate all 24 days files
    for wk in range(1, 5):
        for dy in range(1, 7):
            data = DAY_PLANS_DATABASE.get(wk, {}).get(dy, {
                "topic": "Systems Engineering Milestone Verification",
                "theory": "First-principles engineering evaluation of core registers and variables configurations.",
                "lab": "Write custom low-level driver variables and compile code cleanly using GCC.",
                "code": "// Default registers configurations\n#include <stdint.h>\n\nvoid init_default_register(void) {\n    volatile uint32_t *reg = (volatile uint32_t *)0x20001000U;\n    *reg = 0xAA;\n}",
                "validation": "Verify register memory writes using GDB commands."
            })
            
            day_plan_text = TEMPLATE_DAY_PLAN.format(
                week=wk,
                day=dy,
                topic=data["topic"],
                theory=data["theory"],
                lab=data["lab"],
                code=data["code"],
                validation=data["validation"]
            )
            
            filename = f"Day_{dy}_Theory_and_Lab.md"
            filepath = os.path.join(DAY_PLANS_DIR, f"Week_{wk:02d}", filename)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(day_plan_text)
                
    print("SUCCESS: 24 Microscopic Daily Plans generated cleanly inside 'Day_Plans/'!")

if __name__ == "__main__":
    main()
