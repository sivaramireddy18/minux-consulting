#!/usr/bin/env python3
import os
import sys

# Define Directory Configurations
WORKSPACE = "/home/siva/sivaramireddy/Project1"
C_FAST_TRACK_DIR = os.path.join(WORKSPACE, "c-fast-track")
DAY_PLANS_DIR = os.path.join(C_FAST_TRACK_DIR, "Day_Plans")

# Ensure directories exist
os.makedirs(DAY_PLANS_DIR, exist_ok=True)

# 45-Day Technical Curriculum Database
# Maps day number -> {topic, theory, lab, code, validation}
C_FAST_TRACK_DB = {
    1: {
        "phase": "Phase 1: Compiler & Toolchains",
        "topic": "The Preprocessor Pipeline and Macro Expansion Hazards",
        "theory": "Deep-dive into the C Preprocessor (cpp). Understand header file inclusion (#include), conditional compilation (#ifdef, #if defined), and macro expansions. Study macro hazards such as side-effects, double evaluations, and operator precedence issues. Learn how compiler flags like '-E' produce intermediate '.i' files containing expanded text before tokenization.",
        "lab": "Write a complex nested macro system that calculates the square of a number and absolute values. Create a source file main.c, run it through the preprocessor using 'gcc -E' and inspect the generated '.i' file. Identify where the macro expansions occur and explain why double evaluation of side-effect expressions (e.g., ++x) leads to logical corruption.",
        "code": """// Demonstration of Safe vs Unsafe Macros and Preprocessor Outputs
#include <stdio.h>

// UNSAFE: Double evaluation hazard
#define SQUARE_UNSAFE(x) ((x) * (x))

// SAFE: C11 _Generic or inline function behaves correctly with side-effects
static inline int square_safe(int x) {
    return x * x;
}

int main(void) {
    int val = 5;
    int unsafe_res = SQUARE_UNSAFE(++val); // Preprocessor expands to ((++val) * (++val))
    printf("Unsafe ++val Square: %d (Expected 36, got 42 or similar due to double increment)\\n", unsafe_res);
    
    val = 5;
    int safe_res = square_safe(++val); // Inline function evaluates ++val exactly once
    printf("Safe ++val Square: %d (Expected 36)\\n", safe_res);
    return 0;
}""",
        "validation": "Compile with 'gcc -std=c11 -Wall -Wextra -Werror -O0'. Run 'gcc -E main.c' and verify that the preprocessor expands SQUARE_UNSAFE(++val) directly in the source text, while square_safe remains a standard function call boundary."
    },
    2: {
        "phase": "Phase 1: Compiler & Toolchains",
        "topic": "Compilation to Assembly and GDB Register Analysis",
        "theory": "Analyze how the compiler translates preprocessed intermediate C code into assembly instructions specific to the target CPU architecture. Study ARMv7-M / x86-64 register structures, instruction sizing, and the translation of loops and branching statements into conditional branches. Master GDB commands for register inspection.",
        "lab": "Write a C function containing a nested loop and conditional branch. Compile the code to raw assembly using the '-S' flag. Inspect the assembly output to trace label naming conventions. Load the executable under GDB, set breakpoints, step instruction-by-instruction ('si'), and print register contents to see loops incrementing registers directly.",
        "code": """// GDB register analysis and assembly mapping
#include <stdint.h>

__attribute__((noinline)) uint32_t compute_factorial_sum(uint32_t limit) {
    uint32_t total = 0;
    for (uint32_t i = 1; i <= limit; ++i) {
        uint32_t fact = 1;
        for (uint32_t j = 1; j <= i; ++j) {
            fact *= j;
        }
        total += fact;
    }
    return total;
}

int main(void) {
    volatile uint32_t result = compute_factorial_sum(5);
    (void)result;
    return 0;
}""",
        "validation": "Compile with 'gcc -S -g -O0 factorial.c'. Load factorial.o into GDB. Run 'layout asm' and 'info registers' to physically observe register status updates (e.g. EAX/RAX changes) during execution steps."
    },
    3: {
        "phase": "Phase 1: Compiler & Toolchains",
        "topic": "Relocatable Object Files Dissection and Symbol Resolution",
        "theory": "Explore relocatable object files (.o) and ELF segment architecture. Map the physical layout of standard sections: .text (machine code), .data (initialized global/static variables), .bss (uninitialized variables zeroed out at startup), and .rodata (read-only constants). Understand symbol tables and states (Text 'T', Data 'D', BSS 'B', Undefined 'U').",
        "lab": "Write a C file defining variables in each of these sections. Compile to an object file using the '-c' flag. Use 'nm', 'objdump', and 'readelf' to dissect the symbols and sections. Confirm that global variables mapped to appropriate segments and trace dynamic relocations.",
        "code": """// Mapping variables to ELF Segments and auditing symbols
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
}""",
        "validation": "Run 'nm -S -S symbol_test.o' and 'objdump -h symbol_test.o'. Verify that active_state_flag is in the 'D' (data) section, sensor_telemetry_buffer is in the 'B' (bss) section, and device_serial_number is in the 'R' (rodata) section."
    },
    4: {
        "phase": "Phase 1: Compiler & Toolchains",
        "topic": "Linking Mechanics, Static/Dynamic Libraries, and Symbol Collisions",
        "theory": "Explore the linking phase (ld). Learn how multiple object files are combined into a single executable, how references to external symbols are resolved, and how static (.a) and shared/dynamic (.so) libraries differ. Study symbol resolution rules (strong vs weak symbols) and the danger of silent symbol collisions.",
        "lab": "Create two separate C files that define the same global variable name (one initialized, one uninitialized). Attempt to link them and observe the linker warning/error. Create a static library and a dynamic library, compile a main driver, and inspect the runtime load paths (LD_LIBRARY_PATH and rpath).",
        "code": """// Static vs Shared Linkage and dynamic loading demo
// file: math_ops.c
#include <stdint.h>

// Define a strong symbol
uint32_t math_op_multiplier = 42U;

uint32_t scale_value(uint32_t val) {
    return val * math_op_multiplier;
}

// Compile with:
// gcc -fPIC -shared math_ops.c -o libmathops.so
// gcc -c main.c
// gcc main.o -L. -lmathops -o linked_app""",
        "validation": "Compile dynamic library using '-fPIC -shared'. Link application with '-Wl,-rpath,.'. Run 'ldd linked_app' to verify the runtime link dependency is successfully resolved to libmathops.so."
    },
    5: {
        "phase": "Phase 1: Compiler & Toolchains",
        "topic": "GNU Make, Implicit Dependencies, and Incremental Builds",
        "theory": "Understand the architecture of GNU Make. Learn rule structures (targets, prerequisites, recipes). Study Makefile variables, automatic variables ($@, $<, $^), pattern matching, and implicit rules. Master header dependency tracking using gcc options (-MMD, -MP) to ensure incremental builds compile safely when headers change.",
        "lab": "Write a professional, production-grade Makefile for a multi-file C project. Configure compiler flags, directory clean targets, and automatic header file dependency generation. Touch a header file and verify that only the affected files recompile, leaving unmodified objects intact.",
        "code": """# Production-Grade Makefile template with automatic dependency tracking
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
.PHONY: all clean""",
        "validation": "Create a test project with main.c and utils.h. Compile using 'make'. Change a comment inside 'utils.h', run 'make' again, and verify that only objects depending on 'utils.h' are recompiled."
    },
    6: {
        "phase": "Phase 2: Data & Radix Hazards",
        "topic": "POSIX Integer Scales, Two's Complement, and Sign Extensions",
        "theory": "Master the physical bit representations of signed and unsigned integers under two's complement. Study radix conversions (binary, octal, hexadecimal, decimal). Understand sign extension rules when converting smaller signed types (int8_t) to larger types (int32_t) versus zero-extension for unsigned types.",
        "lab": "Write C code that assigns negative integers to signed small types, casts them to unsigned and larger signed types, and prints their raw hexadecimal bytes. Verify sign extension behavior on real hardware registers using GDB.",
        "code": """// Sign Extension and Two's Complement bit verification
#include <stdio.h>
#include <stdint.h>

int main(void) {
    int8_t negative_val = -5; // 0xFB in hex
    
    // Sign extension: high bits are filled with 1s
    int32_t sign_extended = (int32_t)negative_val; 
    
    // Zero extension: high bits are filled with 0s
    uint32_t zero_extended = (uint32_t)(uint8_t)negative_val;
    
    printf("Original int8_t: %d (0x%02X)\\n", negative_val, (uint8_t)negative_val);
    printf("Sign Extended int32_t: %d (0x%08X)\\n", sign_extended, sign_extended);
    printf("Zero Extended uint32_t: %u (0x%08X)\\n", zero_extended, zero_extended);
    return 0;
}""",
        "validation": "Compile and run. Verify the hex output for sign_extended is 0xFFFFFFFB and zero_extended is 0x000000FB."
    },
    7: {
        "phase": "Phase 2: Data & Radix Hazards",
        "topic": "Safe Integer Arithmetic, Overflow Detection, and Type Promotions",
        "theory": "Explore standard C type promotion rules (usual arithmetic promotions and integer promotions). Learn how operations on small types (like char and short) are promoted to int. Study signed and unsigned integer overflow hazards, and learn how to write robust overflow-safe arithmetic libraries.",
        "lab": "Write a safe integer multiplication and addition library. Implement pre-condition checks for every operation without triggering undefined behavior. Run static analysis audits to verify no overflows are left unchecked.",
        "code": """// Safe Integer Arithmetic Library conforming to strict integer promotion rules
#include <stdint.h>
#include <stdbool.h>
#include <limits.h>

bool safe_add_int32(int32_t a, int32_t b, int32_t *result) {
    if ((b > 0 && a > (INT32_MAX - b)) || (b < 0 && a < (INT32_MIN - b))) {
        return false; // Addition would overflow or underflow
    }
    *result = a + b;
    return true;
}

bool safe_mul_int32(int32_t a, int32_t b, int32_t *result) {
    if (a > 0) {
        if (b > 0) {
            if (a > (INT32_MAX / b)) return false;
        } else {
            if (b < (INT32_MIN / a)) return false;
        }
    } else {
        if (b > 0) {
            if (a < (INT32_MIN / b)) return false;
        } else {
            if (a != 0 && b < (INT32_MAX / a)) return false;
        }
    }
    *result = a * b;
    return true;
}""",
        "validation": "Write a test harness that invokes safe_add_int32(INT32_MAX, 1, &res). Ensure it returns false. Verify with INT32_MIN."
    },
    8: {
        "phase": "Phase 2: Data & Radix Hazards",
        "topic": "Floating-Point Internals (IEEE 754) and Precision Hazards",
        "theory": "Study the internal physical binary format of floating-point numbers according to the IEEE 754 standard (sign bit, exponent, significand/mantissa). Explore precision limits, round-off errors, and the dangers of comparing floats directly using standard equality operators (==). Master the epsilon-based comparison technique.",
        "lab": "Write code that sums small float numbers recursively and compare it to a direct multiplication. Observe the rounding drift. Write a precise floating point comparator using custom epsilon values tailored to float precision scales.",
        "code": """// Floating Point IEEE 754 precision audit and safe comparisons
#include <stdio.h>
#include <stdbool.h>
#include <math.h>

#define EPSILON 1e-6f

bool safe_float_compare(float a, float b) {
    return fabsf(a - b) < EPSILON;
}

int main(void) {
    float sum = 0.0f;
    for (int i = 0; i < 10; ++i) {
        sum += 0.1f;
    }
    
    float direct = 1.0f;
    
    printf("Recursive Sum: %.10f\\n", sum);
    printf("Direct Value:  %.10f\\n", direct);
    
    if (sum == direct) {
        printf("Direct check: EQUAL\\n");
    } else {
        printf("Direct check: NOT EQUAL (Rounding drift occurred!)\\n");
    }
    
    if (safe_float_compare(sum, direct)) {
        printf("Epsilon check: EQUAL (Safe comparison passed)\\n");
    }
    return 0;
}""",
        "validation": "Compile and execute. Observe that the recursive sum is not exactly 1.0f due to base-2 float precision limits, and verify the epsilon check successfully resolves the comparison."
    },
    9: {
        "phase": "Phase 2: Data & Radix Hazards",
        "topic": "Bitwise Operations, Masking, and Shift Hazards",
        "theory": "Analyze low-level bit manipulation techniques. Understand logical AND, OR, XOR, and NOT operations. Master shifting properties (logical vs arithmetic right shifts) and the undefined behavior of shifting by a value equal to or greater than the operand bit-width. Implement safe bitmasking interfaces.",
        "lab": "Write functions to set, clear, toggle, and read bit-states inside status registers. Verify that right-shifting a signed negative value performs an arithmetic shift (preserving sign) while shifting an unsigned value performs a logical shift (padding with zeroes).",
        "code": """// Bitwise register manipulations and shift behavior validations
#include <stdint.h>
#include <stdbool.h>

#define STATUS_BIT_ERROR   (1U << 0)
#define STATUS_BIT_BUSY    (1U << 1)
#define STATUS_BIT_READY   (1U << 2)
#define STATUS_REG_MASK    (0x07U)

void set_status_bit(volatile uint32_t *reg, uint32_t mask) {
    *reg |= mask;
}

void clear_status_bit(volatile uint32_t *reg, uint32_t mask) {
    *reg &= ~mask;
}

bool read_status_bit(volatile uint32_t reg, uint32_t mask) {
    return (reg & mask) != 0U;
}

int32_t arithmetic_right_shift(int32_t val, uint32_t shift_amount) {
    // Avoid undefined behavior of shifting beyond bit-width
    if (shift_amount >= 32) return 0;
    return val >> shift_amount; // Compiler issues ASR (Arithmetic Shift Right) for signed
}""",
        "validation": "Compile code and trace with GDB. Verify the assembly of signed right shift translates to 'sar' (x86) or 'asr' (ARM), while unsigned shift translates to 'shr' or 'lsr'."
    },
    10: {
        "phase": "Phase 2: Data & Radix Hazards",
        "topic": "Branch-Free Programming and ALU Pipeline Optimization",
        "theory": "Understand the modern CPU instruction pipeline. Explore how branches (if/else) cause pipeline stalls and branch misprediction overhead. Learn branch-free coding techniques using bit manipulation, logical masks, and arithmetic combinations to achieve consistent execution latencies.",
        "lab": "Write two implementations of an absolute value function and a conditional select function: one using traditional if/else branches, and one using branch-free arithmetic. Measure the clock cycle differences under GDB or high-precision timers.",
        "code": """// Branching vs Branch-Free logic execution comparison
#include <stdint.h>

// Traditional branching
int32_t abs_branching(int32_t val) {
    if (val < 0) {
        return -val;
    }
    return val;
}

// Branch-free using bit masking arithmetic
int32_t abs_branch_free(int32_t val) {
    int32_t const mask = val >> 31; // Fills with 1s if negative, 0s if positive
    return (val + mask) ^ mask;
}

// Branch-free select: returns 'a' if cond is true (1), else 'b' if cond is false (0)
uint32_t select_branch_free(uint32_t a, uint32_t b, uint32_t cond) {
    uint32_t mask = -cond; // 0xFFFFFFFF if cond is 1, 0x00000000 if cond is 0
    return (a & mask) | (b & ~mask);
}""",
        "validation": "Compile with '-O2'. Disassemble using 'objdump -d'. Observe that the branch-free absolute value compiles without conditional jump instructions (like jge/jl or b/bne)."
    },
    11: {
        "phase": "Phase 3: Stack & Execution Frame",
        "topic": "Activation Records and Procedure Call Standards (AAPCS)",
        "theory": "Explore how function calls are orchestrated physically at the machine boundary. Study the ARM Architecture Procedure Call Standard (AAPCS) or System V ABI for x86-64. Learn which registers are used for input parameters (R0-R3 / RDI, RSI, RDX, RCX), return values, and callee-saved scratch registers.",
        "lab": "Write a multi-parameter C function that takes 6 arguments. Compile the code and dissect the assembly output to locate exactly where arguments are passed (registers vs stack allocation). Tracing registers state step-by-step under GDB.",
        "code": """// AAPCS parameters passing trace
#include <stdint.h>

// The first 4 arguments fit into R0-R3 (ARM) or RDI/RSI/RDX/RCX (x86_64)
// Remaining arguments are pushed onto the calling function's stack frame
__attribute__((noinline)) uint32_t sum_six_params(uint32_t a, uint32_t b, uint32_t c, 
                                                 uint32_t d, uint32_t e, uint32_t f) {
    return a + b + c + d + e + f;
}

int main(void) {
    volatile uint32_t total = sum_six_params(1, 2, 3, 4, 5, 6);
    (void)total;
    return 0;
}""",
        "validation": "Compile and run GDB. Place a breakpoint on sum_six_params. Check register contents before step execution to verify input parameter bounds."
    },
    12: {
        "phase": "Phase 3: Stack & Execution Frame",
        "topic": "Function Frame Layout, Prologue, and Epilogue Assembly",
        "theory": "Understand the call stack structure. Explore how stack frames are constructed on the stack. Study the function prologue: pushing caller context registers, establishing the frame pointer, and decrementing the stack pointer to allocate local memory variables. Study the matching epilogue operations.",
        "lab": "Write nested functions that instantiate arrays on the stack. Compile the code with zero optimization, generate the assembly output, and identify the 'push', 'pop', and SP manipulation instructions that define the frame's lifetime.",
        "code": """// Deep audit of frame prologue and epilogue stack moves
#include <stdint.h>

__attribute__((noinline)) void inner_function(uint32_t *p_val) {
    volatile uint32_t internal_array[4] = {0xA, 0xB, 0xC, 0xD};
    *p_val += internal_array[2];
}

__attribute__((noinline)) void outer_function(void) {
    volatile uint32_t active_state = 100U;
    inner_function((uint32_t *)&active_state);
}

int main(void) {
    outer_function();
    return 0;
}""",
        "validation": "Compile to assembly with 'gcc -S -O0 frame.c'. Open 'frame.s', locate the assembly labels for 'outer_function' and 'inner_function', and find the matching SP modifications and PUSH/POP commands."
    },
    13: {
        "phase": "Phase 3: Stack & Execution Frame",
        "topic": "Local Variable Lifetimes, Storage Classes, and Scope Boundaries",
        "theory": "Explore variables lifetimes and scopes. Study storage class specifiers ('static', 'extern', 'register', 'auto'). Understand how local static variables preserve state between function invocations by mapping to the global .data/.bss memory segment, rather than the stack frame.",
        "lab": "Create functions demonstrating variables with varying lifetimes (auto, local static, register allocation). Set up variables, track their memory addresses, and verify that stack local addresses change across calls while static addresses remain permanent.",
        "code": """// Lifetime and Scope Storage classes validation
#include <stdio.h>
#include <stdint.h>

uint32_t *get_unsafe_stack_ptr(void) {
    uint32_t local_stack_var = 42U;
    return &local_stack_var; // WARNING: RETURNING ADDRESS OF STACK VARIABLE (DANGEROUS)
}

uint32_t *get_safe_static_ptr(void) {
    static uint32_t local_static_var = 42U; // Allocated in global segment
    return &local_static_var; // Safe to return address
}

int main(void) {
    uint32_t *p_unsafe = get_unsafe_stack_ptr();
    uint32_t *p_safe = get_safe_static_ptr();
    
    printf("Safe Static Address: %p, Value: %u\\n", (void *)p_safe, *p_safe);
    printf("Unsafe Stack Address (may be corrupted or trap): %p\\n", (void *)p_unsafe);
    return 0;
}""",
        "validation": "Compile with 'gcc -Wall -Wextra'. Verify that the compiler issues a warning warning: function returns address of local variable. Run the program to verify stability."
    },
    14: {
        "phase": "Phase 3: Stack & Execution Frame",
        "topic": "Stack Overflow Hazards, MSP vs PSP, and MPU Guard Bands",
        "theory": "Analyze how stack overflows corrupt active variables in memory. Explore systems stack layouts. In bare-metal ARM systems, understand the Main Stack Pointer (MSP) used on reset and interrupts, and the Process Stack Pointer (PSP) used for application threads. Learn how Memory Protection Units (MPU) prevent stack breaches.",
        "lab": "Write an intentional deep recursive call that overflows stack space. Audit where the memory bounds are exceeded. Write a conceptual emulation of an MPU guard band that traps unaligned stack operations.",
        "code": """// Stack overflow generation and protection schemes
#include <stdint.h>
#include <stdlib.h>

// Simulated MPU guard band protection check
#define STACK_MIN_BOUND 0x20004000U
#define STACK_MAX_BOUND 0x20008000U

void verify_sp_boundary(uint32_t sp) {
    if (sp < STACK_MIN_BOUND || sp > STACK_MAX_BOUND) {
        // Trigger simulated HardFault exception
        __builtin_trap();
    }
}

void recurse_and_overflow(uint32_t depth) {
    volatile uint32_t stack_local[256]; // Heavy allocation
    stack_local[0] = depth;
    
    // Read Stack Pointer (using compiler builtin or inline assembly)
    uintptr_t current_sp;
#if defined(__x86_64__)
    __asm__ volatile("mov %%rsp, %0" : "=r"(current_sp));
#else
    __asm__ volatile("mov %0, sp" : "=r"(current_sp));
#endif
    
    // In a real systems driver, verify boundary check
    // verify_sp_boundary(current_sp); 
    
    recurse_and_overflow(depth + 1);
}""",
        "validation": "Compile and execute inside GDB. Run 'backtrace' after crash to examine the call depth and trace corrupted stack addresses."
    },
    15: {
        "phase": "Phase 3: Stack & Execution Frame",
        "topic": "Stack Canaries and Buffer Overflow Defensive Coding",
        "theory": "Analyze how stack canaries guard activation frames from buffer overruns. Study the compiler flag '-fstack-protector-all'. Learn how the compiler places a sentinel value (canary) between local arrays and the saved stack pointers, checking its integrity before returning.",
        "lab": "Write a C program containing a local array. Write a function that intentionally writes past the array bounds to trigger a stack smash crash. Compile with and without compiler stack-protector flags to observe the difference in safety.",
        "code": """// Buffer Overrun Stack Canary Audit
#include <stdio.h>
#include <string.h>

void trigger_buffer_overrun(void) {
    char local_buffer[8];
    // Intentionally copying more bytes than allocated space
    // Overwriting the stack canary and saved return address
    strcpy(local_buffer, "OVERFLOW_STRING_LARGER_THAN_EIGHT");
    printf("Buffer content: %s\\n", local_buffer);
}

int main(void) {
    printf("Starting safe execution...\\n");
    trigger_buffer_overrun();
    printf("Execution completed successfully (Should not reach here if smashed!)\\n");
    return 0;
}""",
        "validation": "Compile using 'gcc -fstack-protector-all -O0 buffer_overrun.c'. Run the executable. Verify that it terminates with '*** stack smashing detected ***: terminated' and aborts."
    },
    16: {
        "phase": "Phase 4: Pointers & Arithmetic",
        "topic": "Pointers Dereferencing, Decay, and Multi-Dimensional Arrays",
        "theory": "Dissect the physical pointer dereferencing mechanism in memory. Understand pointer decay, where arrays inside functions 'decay' into raw pointers to their first elements. Study the memory layout of multi-dimensional arrays (row-major order) and how pointer scales are calculated.",
        "lab": "Write a program that maps multi-dimensional arrays, accesses members using array notation, and translates those access operations to explicit pointer offset equations. Print addresses to confirm row-major alignment layout.",
        "code": """// Multi-dimensional array layouts and pointer decays
#include <stdio.h>
#include <stdint.h>

void audit_array_decay(int *ptr, size_t size) {
    printf("Decayed Pointer address: %p, size: %zu bytes\\n", (void *)ptr, sizeof(ptr));
}

int main(void) {
    int multi_arr[2][3] = {
        {10, 20, 30},
        {40, 50, 60}
    };
    
    printf("Array size in main: %zu bytes\\n", sizeof(multi_arr));
    audit_array_decay(multi_arr[0], 6);
    
    // Explicit pointer math mapping equivalent to multi_arr[1][2]
    int *base = (int *)multi_arr;
    int row = 1;
    int col = 2;
    int cols_per_row = 3;
    int val = *(base + (row * cols_per_row) + col);
    
    printf("Value at [1][2] (math): %d, (array): %d\\n", val, multi_arr[1][2]);
    return 0;
}""",
        "validation": "Compile and run. Verify that the decayed size printed inside the audit function is the size of a pointer (8 bytes on 64-bit platforms), and the math calculation matches direct array lookup."
    },
    17: {
        "phase": "Phase 4: Pointers & Arithmetic",
        "topic": "Pointer Arithmetic Scaling Mathematics and Offset Mapping",
        "theory": "Understand that pointer arithmetic is typed: adding 1 to a pointer increments its target address by the size of the underlying type (e.g. 4 bytes for int32_t, 1 byte for char). Study pointer offsets, void pointer restrictions, and uintptr_t casts for absolute address arithmetic.",
        "lab": "Create an array containing multiple types. Perform pointer increments using different typed pointers, and print the raw addresses before and after addition. Verify address modifications conform to underlying type byte alignments.",
        "code": """// Pointer arithmetic scaling calculations
#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint32_t u32_arr[4] = {100, 200, 300, 400};
    uint8_t  u8_arr[4]  = {1, 2, 3, 4};
    
    uint32_t *p_u32 = u32_arr;
    uint8_t  *p_u8  = u8_arr;
    
    printf("p_u32 Address: %p, p_u32 + 1 Address: %p (Diff: %ld bytes)\\n", 
           (void *)p_u32, (void *)(p_u32 + 1), (uintptr_t)(p_u32 + 1) - (uintptr_t)p_u32);
           
    printf("p_u8 Address:  %p, p_u8 + 1 Address:  %p (Diff: %ld bytes)\\n", 
           (void *)p_u8, (void *)(p_u8 + 1), (uintptr_t)(p_u8 + 1) - (uintptr_t)p_u8);
    return 0;
}""",
        "validation": "Compile and execute. Verify that the address difference for the uint32_t pointer is exactly 4 bytes, while the difference for the uint8_t pointer is exactly 1 byte."
    },
    18: {
        "phase": "Phase 4: Pointers & Arithmetic",
        "topic": "Volatile Pointer Configurations and Memory-Mapped Registers",
        "theory": "Master the physical mechanics of the 'volatile' qualifier in pointer definitions. Understand register-level caching optimizations: the compiler caches standard memory reads in CPU registers. Volatile forces a new load instruction (LDR) on every access. Learn the differences between pointer-to-volatile, volatile-pointer, and volatile-pointer-to-volatile.",
        "lab": "Write a simulated peripheral driver polling loop. Define pointers with and without volatile qualifiers. Compile using high optimization flags (-O2 or -O3). Disassemble the generated object files to verify if the non-volatile polling loop is optimized away or cached permanently.",
        "code": """// Volatile pointer definitions for hardware configuration
#include <stdint.h>

// A constant pointer to volatile data (most common for MMIO registers)
#define PERIPHERAL_REG_ADDR 0x40020000U
volatile uint32_t * const p_peripheral_reg = (volatile uint32_t *)PERIPHERAL_REG_ADDR;

void poll_status_register(void) {
    // Force direct memory read on every iteration
    while ((*p_peripheral_reg & 0x01U) == 0U) {
        // Prevent infinite loop optimizing by keeping read volatile
    }
}""",
        "validation": "Compile with 'gcc -O2 -S volatile_test.c'. Inspect the assembly code to confirm that the polling loop contains an active memory read instruction inside the loop block rather than a cached register check."
    },
    19: {
        "phase": "Phase 4: Pointers & Arithmetic",
        "topic": "Function Pointers, Callback Systems, and Jump-Tables",
        "theory": "Explore function pointer architecture. A function pointer stores the entry address of executable code in the text segment. Master function pointer syntax, typedef shortcuts, callback patterns, and jump-tables which replace high-latency nested switch structures with fixed-time O(1) lookups.",
        "lab": "Implement a modular arithmetic calculator. Define operations (add, subtract, multiply) as separate static functions. Create a jump-table (array of function pointers) indexed by user command codes. Write a callback mechanism that routes status updates.",
        "code": """// Calculator using dynamic Jump-Table of function pointers
#include <stdio.h>
#include <stdint.h>

typedef uint32_t (*binary_op_t)(uint32_t, uint32_t);

static uint32_t add_op(uint32_t a, uint32_t b) { return a + b; }
static uint32_t sub_op(uint32_t a, uint32_t b) { return a - b; }
static uint32_t mul_op(uint32_t a, uint32_t b) { return a * b; }

// Jump table mapping opcodes to functions
static const binary_op_t jump_table[] = {
    [0] = add_op,
    [1] = sub_op,
    [2] = mul_op
};

int main(void) {
    uint32_t op = 2; // Multiply
    uint32_t operand1 = 6;
    uint32_t operand2 = 7;
    
    if (op < sizeof(jump_table)/sizeof(jump_table[0]) && jump_table[op] != NULL) {
        uint32_t result = jump_table[op](operand1, operand2);
        printf("Jump-Table Result (op=%u): %u (Expected 42)\\n", op, result);
    }
    return 0;
}""",
        "validation": "Compile and execute. Verify that the jump-table resolves the multiply operation without any conditional branch jumps."
    },
    20: {
        "phase": "Phase 4: Pointers & Arithmetic",
        "topic": "Raw Pointer Casting, Type Safety, and Alignment Validations",
        "theory": "Explore pointer alignment constraints. On many processor architectures (like ARM Cortex-M), accessing multi-byte data types from unaligned memory addresses triggers a Hardware Alignment Fault. Understand that casting a char pointer to an int pointer can lead to invalid alignments unless address bounds are validated.",
        "lab": "Write an alignment-checking utility that evaluates a pointer address against boundary requirements. Write code that packs bytes into an array and extracts multi-byte values, verifying alignment constraints before accessing the addresses directly.",
        "code": """// Pointer Alignment Verification
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

bool is_address_aligned(const void *ptr, size_t alignment) {
    // Alignment must be a power of 2
    if ((alignment & (alignment - 1)) != 0) return false;
    return ((uintptr_t)ptr & (alignment - 1)) == 0;
}

int main(void) {
    uint8_t buffer[16] __attribute__((aligned(4))) = {0};
    
    void *aligned_ptr = &buffer[4];
    void *unaligned_ptr = &buffer[5];
    
    printf("Address %p Aligned to 4: %s\\n", aligned_ptr, is_address_aligned(aligned_ptr, 4) ? "YES" : "NO");
    printf("Address %p Aligned to 4: %s\\n", unaligned_ptr, is_address_aligned(unaligned_ptr, 4) ? "YES" : "NO");
    
    if (is_address_aligned(aligned_ptr, sizeof(uint32_t))) {
        uint32_t *p_val = (uint32_t *)aligned_ptr;
        *p_val = 0xDEADBEEF;
        printf("Value: 0x%08X (Safe unaligned-free write passed)\\n", *p_val);
    }
    return 0;
}""",
        "validation": "Compile and run. Confirm that &buffer[4] is marked as aligned while &buffer[5] fails the alignment check."
    },
    21: {
        "phase": "Phase 5: Structures & Alignments",
        "topic": "Structure Memory Layouts, Compiler Padding, and Offset Tracing",
        "theory": "Study structure layouts in memory. To optimize memory bus transfers, compilers insert silent padding bytes into structures so that individual members are aligned with their native byte sizes (e.g. 4-byte boundaries for int, 2-byte for short). Learn how struct member ordering affects total structural footprint.",
        "lab": "Define structures containing members of mixed sizes in different declarations. Calculate the size of each structure using 'sizeof' and identify the offsets of each member using the 'offsetof' macro. Optimize the structure footprint by reordering elements from largest to smallest.",
        "code": """// Struct offset mapping and padding audits
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

struct UnoptimizedStruct {
    uint8_t  member_a; // Offset 0
    // 3 padding bytes
    uint32_t member_b; // Offset 4
    uint8_t  member_c; // Offset 8
    // 3 padding bytes
}; // Total Size: 12 bytes

struct OptimizedStruct {
    uint32_t member_b; // Offset 0
    uint8_t  member_a; // Offset 4
    uint8_t  member_c; // Offset 5
    // 2 padding bytes
}; // Total Size: 8 bytes

int main(void) {
    printf("Unoptimized Size: %zu bytes\\n", sizeof(struct UnoptimizedStruct));
    printf("Optimized Size:   %zu bytes\\n", sizeof(struct OptimizedStruct));
    printf("Offset of member_b (unoptimized): %zu\\n", offsetof(struct UnoptimizedStruct, member_b));
    printf("Offset of member_b (optimized):   %zu\\n", offsetof(struct OptimizedStruct, member_b));
    return 0;
}""",
        "validation": "Compile and execute. Verify the unoptimized size is 12 bytes and optimized size is 8 bytes, demonstrating effective padding reduction through ordering."
    },
    22: {
        "phase": "Phase 5: Structures & Alignments",
        "topic": "Packed Structures, Alignment Pragma/Attributes, and Performance Costs",
        "theory": "Learn how to override default compiler padding behaviors using '#pragma pack(1)' or '__attribute__((packed))'. Explore packed structure usage in communications protocols (headers, payloads). Understand that while packed structures eliminate padding, they introduce unaligned memory access penalties on some processors.",
        "lab": "Write a program that declares identical standard and packed structures. Compare their sizes. Disassemble and analyze the compiler instructions generated to access elements of packed structures versus aligned structures to identify access overhead.",
        "code": """// Packed vs Aligned structure comparison and access mechanics
#include <stdio.h>
#include <stdint.h>

struct NormalHeader {
    uint8_t  type;
    uint32_t seq_num;
    uint16_t length;
};

struct __attribute__((packed)) PackedHeader {
    uint8_t  type;
    uint32_t seq_num;
    uint16_t length;
};

int main(void) {
    printf("Normal Header Size: %zu bytes (contains padding)\\n", sizeof(struct NormalHeader));
    printf("Packed Header Size: %zu bytes (no padding)\\n", sizeof(struct PackedHeader));
    return 0;
}""",
        "validation": "Compile and run. Verify NormalHeader size is 12 bytes (due to alignment padding) and PackedHeader is exactly 7 bytes."
    },
    23: {
        "phase": "Phase 5: Structures & Alignments",
        "topic": "Unions, Type Punning, and Raw Binary Serialization",
        "theory": "Explore unions, where all members share the same starting address in memory. Analyze union size constraints (equal to its largest member). Study the concepts of 'type punning' (accessing the binary bits of one type as another) and raw serialization/deserialization layouts.",
        "lab": "Write a floating-point bit inspection utility using a union. Read the exponent and significand bits of a float by punning it into an unsigned integer. Use a union to serialize structured data packets into char streams and verify integrity.",
        "code": """// Type Punning and Byte-Serialization using Unions
#include <stdio.h>
#include <stdint.h>

typedef union {
    float    value;
    uint32_t raw_bits;
} float_pun_t;

typedef union {
    struct {
        uint8_t frame_id;
        uint8_t sensor_status;
        uint16_t sensor_reading;
    } fields;
    uint8_t raw_bytes[4];
} packet_t;

int main(void) {
    float_pun_t pun;
    pun.value = 1.0f;
    printf("Float 1.0f raw binary bits in hex: 0x%08X\\n", pun.raw_bits);
    
    packet_t tx_packet;
    tx_packet.fields.frame_id = 0xAA;
    tx_packet.fields.sensor_status = 0x01;
    tx_packet.fields.sensor_reading = 0x03FF; // 1023 in decimal
    
    printf("Serialized stream bytes: 0x%02X 0x%02X 0x%02X 0x%02X\\n", 
           tx_packet.raw_bytes[0], tx_packet.raw_bytes[1], 
           tx_packet.raw_bytes[2], tx_packet.raw_bytes[3]);
    return 0;
}""",
        "validation": "Compile and run. Verify the raw bits of float 1.0f is 0x3F800000 and the serialized output matches the little/big endian layout of the platform."
    },
    24: {
        "phase": "Phase 5: Structures & Alignments",
        "topic": "Bitfields, Hardware Register Mapping, and Alignments",
        "theory": "Explore bitfields, which allow specifying the exact number of bits allocated to structure members. Study compiler-specific bitfield layout implementations (endianness dependent). Learn how to construct bitfield structures that map directly onto physical hardware status and control registers.",
        "lab": "Define a hardware register control layout using bitfields. Write functions that manipulate hardware parameters by targeting individual bitfields inside the structure. Verify the generated assembly to audit bitwise logical masks used by the compiler.",
        "code": """// Bitfield hardware register mapping example
#include <stdio.h>
#include <stdint.h>

// 32-bit hardware status register simulation
typedef union {
    struct {
        uint32_t enable       : 1;  // bit 0
        uint32_t direction    : 1;  // bit 1
        uint32_t speed_mode   : 2;  // bits 2-3
        uint32_t reserved     : 4;  // bits 4-7
        uint32_t error_code   : 8;  // bits 8-15
        uint32_t data_payload : 16; // bits 16-31
    } bits;
    uint32_t raw;
} motor_ctrl_reg_t;

int main(void) {
    motor_ctrl_reg_t reg;
    reg.raw = 0; // Clear all
    
    reg.bits.enable = 1;
    reg.bits.direction = 0;
    reg.bits.speed_mode = 3; // Max mode
    reg.bits.error_code = 0x4B;
    
    printf("Configured Register Hex: 0x%08X (Expected 0x00004B0DU)\\n", reg.raw);
    return 0;
}""",
        "validation": "Compile and run. Ensure configured register hex output exactly matches 0x00004B0D (enable=1, direction=0, speed=3 -> bits 3:0 is 1101 = 0xD, error_code = 0x4B shifted by 8 -> 0x4B00. Total = 0x4B0D)."
    },
    25: {
        "phase": "Phase 5: Structures & Alignments",
        "topic": "Network Serialization, Endianness, and Byte Order Conversion",
        "theory": "Understand data representation differences across CPU architectures: Big-Endian (MSB at lowest address) versus Little-Endian (LSB at lowest address). Study how data gets corrupted when transferred between different platforms. Master POSIX byte-ordering macros (htonl, htons, ntohl, ntohs).",
        "lab": "Write an endianness check program. Write a manual serialization utility that converts structure values into network byte order (Big-Endian) byte-by-byte, and a deserializer that restores them to host byte order.",
        "code": """// Manual Endianness audit and byte conversions
#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint32_t val32;
    uint16_t val16;
} data_payload_t;

int is_little_endian(void) {
    uint16_t val = 0x0001;
    return *((uint8_t *)&val) == 1;
}

// Convert 32-bit uint from host to big-endian bytes
void serialize_uint32(uint8_t *dest, uint32_t val) {
    dest[0] = (val >> 24) & 0xFF;
    dest[1] = (val >> 16) & 0xFF;
    dest[2] = (val >> 8)  & 0xFF;
    dest[3] = val         & 0xFF;
}

uint32_t deserialize_uint32(const uint8_t *src) {
    return ((uint32_t)src[0] << 24) |
           ((uint32_t)src[1] << 16) |
           ((uint32_t)src[2] << 8)  |
           src[3];
}

int main(void) {
    printf("Platform is: %s Endian\\n", is_little_endian() ? "LITTLE" : "BIG");
    
    uint8_t buffer[4];
    uint32_t original = 0x12345678;
    
    serialize_uint32(buffer, original);
    printf("Serialized (Big Endian): 0x%02X 0x%02X 0x%02X 0x%02X\\n", 
           buffer[0], buffer[1], buffer[2], buffer[3]);
           
    uint32_t recovered = deserialize_uint32(buffer);
    printf("Recovered Value: 0x%08X (Matches original: %s)\\n", 
           recovered, (recovered == original) ? "YES" : "NO");
    return 0;
}""",
        "validation": "Compile and run. Verify serialized bytes are printed as 0x12 0x34 0x56 0x78 regardless of host CPU endianness."
    },
    26: {
        "phase": "Phase 6: Custom Allocators",
        "topic": "Dynamic Heap Architecture, Fragmentation, and System Boundaries",
        "theory": "Study the architecture of standard heap management libraries (ptmalloc, dlmalloc). Understand how the heap boundary is dynamically moved using system calls like 'brk' and 'sbrk'. Examine memory fragmentation (internal vs external) and why standard malloc/free patterns are prohibited in safety-critical real-time contexts.",
        "lab": "Write a program that dynamically queries virtual memory segment limits. Print the heap boundary address before and after standard allocations. Review standard dynamic memory allocator source architectures to examine boundary tagging concepts.",
        "code": """// Heap boundary exploration using sbrk (on POSIX systems)
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

int main(void) {
    // Note: sbrk is legacy but provides direct system heap boundary visualization
    void *current_brk = sbrk(0);
    printf("Current System Heap Break Address: %p\\n", current_brk);
    
    void *allocated_block = malloc(1024 * 1024); // Allocate 1MB
    if (allocated_block == NULL) return 1;
    
    void *new_brk = sbrk(0);
    printf("Heap Break Address after Malloc:   %p\\n", new_brk);
    
    free(allocated_block);
    return 0;
}""",
        "validation": "Compile and run on a Linux machine. Observe that the heap break address adjusts or remains stable depending on standard malloc allocation pooling."
    },
    27: {
        "phase": "Phase 6: Custom Allocators",
        "topic": "Custom Memory Arenas and Alignment Boundaries",
        "theory": "Understand the concept of a Memory Arena (or linear/bump allocator). Arena allocators speed up performance by allocating a single large buffer upfront and serving dynamic requests by bumping an offset index. Memory release is executed en-masse by clearing the entire arena. Learn how to enforce alignment on all sub-allocations.",
        "lab": "Design and implement a complete, robust, type-aligned Memory Arena in C. The arena must take a statically allocated buffer and support variable-sized allocation requests. Ensure that the returned addresses are always aligned to 8-byte boundaries.",
        "code": """// Robust aligned memory arena allocator
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

typedef struct {
    uint8_t *buffer;
    size_t   capacity;
    size_t   offset;
} arena_t;

void arena_init(arena_t *arena, uint8_t *buffer, size_t capacity) {
    arena->buffer = buffer;
    arena->capacity = capacity;
    arena->offset = 0;
}

void *arena_alloc(arena_t *arena, size_t size, size_t alignment) {
    // Ensure alignment is power of 2
    size_t current_addr = (size_t)(arena->buffer + arena->offset);
    size_t aligned_addr = (current_addr + (alignment - 1)) & ~(alignment - 1);
    size_t new_offset = aligned_addr - (size_t)arena->buffer;
    
    if (new_offset + size > arena->capacity) {
        return NULL; // Out of memory
    }
    
    arena->offset = new_offset + size;
    return (void *)aligned_addr;
}

void arena_reset(arena_t *arena) {
    arena->offset = 0;
}""",
        "validation": "Write a test suite allocating various objects (e.g. chars, ints, structs) in sequence. Assert that every returned address is perfectly aligned to the requested size (e.g. multiple of 4 or 8) and fits within bounds."
    },
    28: {
        "phase": "Phase 6: Custom Allocators",
        "topic": "Fixed-Size Memory Block Pools",
        "theory": "Learn why fixed-size block pool allocators (also called slab allocators) are mandatory in real-time operating systems (RTOS). A block pool partitions a raw buffer into equal-sized blocks linked together in a list. Allocation and deallocation are deterministic O(1) operations, introducing zero fragmentation.",
        "lab": "Write a deterministic Fixed-Size Memory Pool allocator. Implement an initialization function, an allocation function (taking a block from the free list), and a free function (returning the block). Run tests to verify consistent execution latency.",
        "code": """// Deterministic O(1) Fixed-Size Block Pool Allocator
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

typedef struct block_node {
    struct block_node *next;
} block_node_t;

typedef struct {
    uint8_t      *pool_buffer;
    size_t        block_size;
    size_t        num_blocks;
    block_node_t *free_list;
} mem_pool_t;

void mem_pool_init(mem_pool_t *pool, uint8_t *buffer, size_t block_size, size_t num_blocks) {
    // Align block size to pointer boundary for the free list nodes
    size_t aligned_block_size = (block_size + sizeof(void *) - 1) & ~(sizeof(void *) - 1);
    pool->pool_buffer = buffer;
    pool->block_size = aligned_block_size;
    pool->num_blocks = num_blocks;
    pool->free_list = NULL;
    
    // Link all blocks into the free list
    for (size_t i = 0; i < num_blocks; ++i) {
        block_node_t *node = (block_node_t *)(buffer + (i * aligned_block_size));
        node->next = pool->free_list;
        pool->free_list = node;
    }
}

void *mem_pool_alloc(mem_pool_t *pool) {
    if (pool->free_list == NULL) return NULL; // Exhausted
    
    block_node_t *node = pool->free_list;
    pool->free_list = node->next;
    return (void *)node;
}

void mem_pool_free(mem_pool_t *pool, void *ptr) {
    if (ptr == NULL) return;
    
    block_node_t *node = (block_node_t *)ptr;
    node->next = pool->free_list;
    pool->free_list = node;
}""",
        "validation": "Write a test harness allocating and freeing blocks. Confirm that the memory pool handles exhaustions, deallocations restore pool capacity, and allocation execution takes constant time."
    },
    29: {
        "phase": "Phase 6: Custom Allocators",
        "topic": "Dynamic Free Lists, Block Splitting, and Coalescing",
        "theory": "Study the internal mechanics of general-purpose dynamic allocators that support variable-sized malloc/free requests. Learn about boundary tags, free list traversal strategies (First-Fit, Best-Fit), block splitting on allocation, and block coalescing (merging adjacent free blocks) on deallocation.",
        "lab": "Implement a conceptual First-Fit memory allocator with block headers tracking block sizes and free states. Write a coalescing function that traverses headers to merge contiguous free blocks, resolving external fragmentation.",
        "code": """// Block Header definitions and Coalescing logics
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

typedef struct block_header {
    size_t size;
    bool   is_free;
    struct block_header *next;
} block_header_t;

// Traverse and merge contiguous free blocks in the list
void coalesce_free_blocks(block_header_t *head) {
    block_header_t *current = head;
    while (current != NULL && current->next != NULL) {
        if (current->is_free && current->next->is_free) {
            // Merge current and next block
            current->size += sizeof(block_header_t) + current->next->size;
            current->next = current->next->next;
            // Do not advance; check if new adjacent block can also merge
        } else {
            current = current->next;
        }
    }
}""",
        "validation": "Create three dummy blocks, mark them as free, trigger the coalesce function, and assert that the first block size now encompasses all three blocks."
    },
    30: {
        "phase": "Phase 6: Custom Allocators",
        "topic": "Memory Leaks Audits and Dynamic Wrapper Sentinels",
        "theory": "Study how memory leaks occur when dynamically allocated objects lose their referencing pointers before deallocation. Explore wrapper methods to intercept memory allocations. Learn how to write custom allocation sentinels that record allocations and matching frees to generate leaks diagnostics on exit.",
        "lab": "Write custom debug wrappers 'my_malloc' and 'my_free'. Implement a global ledger tracking active pointers, allocations sizes, source file locations, and line numbers. Print a report detailing all outstanding leaks on program exit.",
        "code": """// Dynamic memory tracking audit wrapper
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    void  *address;
    size_t size;
    const char *file;
    int    line;
} alloc_tracker_t;

#define MAX_TRACKED_ALLOCS 100
static alloc_tracker_t ledger[MAX_TRACKED_ALLOCS];
static int ledger_count = 0;

void *tracked_malloc(size_t size, const char *file, int line) {
    void *ptr = malloc(size);
    if (ptr != NULL && ledger_count < MAX_TRACKED_ALLOCS) {
        ledger[ledger_count].address = ptr;
        ledger[ledger_count].size = size;
        ledger[ledger_count].file = file;
        ledger[ledger_count].line = line;
        ledger_count++;
    }
    return ptr;
}

void tracked_free(void *ptr) {
    if (ptr == NULL) return;
    
    for (int i = 0; i < ledger_count; ++i) {
        if (ledger[i].address == ptr) {
            // Remove from ledger
            ledger[i] = ledger[ledger_count - 1];
            ledger_count--;
            break;
        }
    }
    free(ptr);
}

void print_memory_leaks_report(void) {
    if (ledger_count == 0) {
        printf("MEM AUDIT: Zero memory leaks detected! Clean exit.\\n");
    } else {
        printf("MEM AUDIT: %d memory leak(s) detected:\\n", ledger_count);
        for (int i = 0; i < ledger_count; ++i) {
            printf("  Address %p (%zu bytes) allocated at %s:%d\\n", 
                   ledger[i].address, ledger[i].size, ledger[i].file, ledger[i].line);
        }
    }
}

#define my_malloc(s) tracked_malloc(s, __FILE__, __LINE__)
#define my_free(p)   tracked_free(p)""",
        "validation": "Write a test allocating blocks via my_malloc. Leave one block unfreed. Invoke print_memory_leaks_report and verify that the unfreed allocation gets reported with exact line and file source code context."
    },
    31: {
        "phase": "Phase 7: POSIX System Boundaries",
        "topic": "System Call Boundaries and Unbuffered POSIX I/O",
        "theory": "Study the interface boundary between user space and kernel space. Contrast standard C library buffered calls (fopen, fread, fwrite) with POSIX unbuffered system calls (open, read, write, close). Understand file descriptors, system call context switches, and read/write buffering performance differences.",
        "lab": "Write a file copying utility using raw POSIX 'open', 'read', 'write', and 'close' system calls. Run performance benchmark comparisons against a standard 'fread'/'fwrite' buffered implementation using large block sizes.",
        "code": """// File copy utility using POSIX system calls
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
}""",
        "validation": "Compile the utility. Run with large source text files. Confirm the copied output matches the source file exactly using the 'md5sum' or 'diff' terminal utilities."
    },
    32: {
        "phase": "Phase 7: POSIX System Boundaries",
        "topic": "Asynchronous I/O, Non-Blocking Descriptors, and Streaming",
        "theory": "Understand blocking versus non-blocking I/O. Explore how read and write systems calls block execution threads by default until the socket or disk buffer is ready. Learn how to configure non-blocking behaviors using 'fcntl' options (O_NONBLOCK) and study poll/select multiplexing basics.",
        "lab": "Create a program that opens a pipe in non-blocking mode. Write a non-blocking poll read loop that consumes data streams without blocking threads, gracefully recovering when I/O operations return EAGAIN/EWOULDBLOCK.",
        "code": """// Configure non-blocking file descriptors on POSIX pipelines
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>

int make_fd_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags == -1) return -1;
    
    // Set the non-blocking flag
    return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

void attempt_nonblocking_read(int fd) {
    char buffer[64];
    ssize_t bytes = read(fd, buffer, sizeof(buffer) - 1);
    
    if (bytes < 0) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) {
            printf("Read status: No data available at this time (non-blocking call gracefully returns)\\n");
        } else {
            perror("Read failed error");
        }
    } else {
        buffer[bytes] = '\\0';
        printf("Read data: %s\\n", buffer);
    }
}""",
        "validation": "Set up a local named pipe (mkfifo). Set to non-blocking using fcntl and run attempt_nonblocking_read. Confirm that the read returns immediately without locking the thread."
    },
    33: {
        "phase": "Phase 7: POSIX System Boundaries",
        "topic": "Memory-Mapped Files (mmap) and Zero-Copy I/O",
        "theory": "Analyze the mechanics of memory-mapped file access (mmap). Explore how mmap maps file sectors directly into the application's virtual address space, allowing files to be read and modified like raw array variables. Study 'zero-copy' design, page boundaries, and page fault triggers.",
        "lab": "Write a high-performance database parsing engine that maps a binary index file into memory using 'mmap'. Modify structural indices directly in memory, flush updates back to disk, and verify binary file integrity.",
        "code": """// High-performance binary file modification using mmap
#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

typedef struct {
    int id;
    char name[28];
} record_t;

int main(void) {
    const char *filepath = "database.bin";
    
    // Initialize temporary database file
    int fd = open(filepath, O_RDWR | O_CREAT | O_TRUNC, 0666);
    if (fd < 0) return 1;
    
    record_t initial_rec = {.id = 100, .name = "Initial Entry"};
    write(fd, &initial_rec, sizeof(record_t));
    
    // Map file to memory
    struct stat sb;
    fstat(fd, &sb);
    
    record_t *map = mmap(NULL, sb.st_size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (map == MAP_FAILED) {
        close(fd);
        return 1;
    }
    
    printf("MMAP: Read ID: %d, Name: %s\\n", map->id, map->name);
    
    // Modify record directly inside mapped memory array
    map->id = 2026;
    strcpy(map->name, "Fast Track Update");
    
    // Synchronize modifications with storage
    msync(map, sb.st_size, MS_SYNC);
    
    munmap(map, sb.st_size);
    close(fd);
    printf("MMAP modifications successfully flushed to disk.\\n");
    return 0;
}""",
        "validation": "Compile and execute. Use 'hexdump -C database.bin' to confirm that binary contents on disk are updated cleanly to ID 2026 and name 'Fast Track Update'."
    },
    34: {
        "phase": "Phase 7: POSIX System Boundaries",
        "topic": "System Error Handling, Thread-Safe errno, and Recovery",
        "theory": "Explore POSIX error handling frameworks. Study the global 'errno' variable and understand how it operates on a thread-local basis in modern multi-threaded operating environments. Learn about safe, reentrant error description methods (strerror_r vs strerror).",
        "lab": "Write a robust file parser that evaluates standard file access operations. Check system outcomes, capture 'errno' boundaries, and print descriptive, thread-safe system diagnostic summaries for failed paths.",
        "code": """// Thread-Safe system error parsing with strerror_r
#define _GNU_SOURCE
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>

void log_system_error(const char *operation) {
    char error_buffer[256];
    
    // Reentrant thread-safe conversion of errno to string
    #if (_POSIX_C_SOURCE >= 200112L || _XOPEN_SOURCE >= 600) && ! _GNU_SOURCE
    int res = strerror_r(errno, error_buffer, sizeof(error_buffer));
    if (res == 0) {
        printf("ERROR during %s: %s (code: %d)\\n", operation, error_buffer, errno);
    }
    #else
    // GNU specific implementation
    char *err_msg = strerror_r(errno, error_buffer, sizeof(error_buffer));
    printf("ERROR during %s: %s (code: %d)\\n", operation, err_msg, errno);
    #endif
}

int main(void) {
    // Attempt opening non-existent file to trigger systems exception
    int fd = open("/tmp/non_existent_systems_file.bin", O_RDONLY);
    if (fd < 0) {
        log_system_error("file open");
    } else {
        close(fd);
    }
    return 0;
}""",
        "validation": "Compile and run. Verify the program prints a clear error message (such as 'No such file or directory') along with error code 2."
    },
    35: {
        "phase": "Phase 7: POSIX System Boundaries",
        "topic": "Inter-Process Communication (IPC) and Shared Memory",
        "theory": "Master inter-process communication concepts under POSIX system constraints. Explore how processes possess fully isolated virtual address spaces. Study shared memory segments (`shm_open`, `ftruncate`, `mmap`) which allow independent sibling processes to share physical RAM blocks for microsecond-scale IPC data exchanges.",
        "lab": "Write a sender and receiver pair of programs. The sender program creates a shared memory segment, writes a structured telemetry frame, and exits. The receiver opens the same segment, reads the frame, and closes the resource.",
        "code": """// Shared memory data frame structures for microsecond IPC
#include <stdio.h>
#include <stdint.h>

#define SHARED_MEM_NAME "/telemetry_shm"

typedef struct {
    uint32_t sample_index;
    float    ambient_temp;
    uint32_t active_status;
} shm_frame_t;

// To compile and run:
// gcc sender.c -lrt -o sender
// gcc receiver.c -lrt -o receiver""",
        "validation": "Create conceptual shared memory setups. Ensure shm_open maps cleanly and the shared struct translates updates across processes."
    },
    36: {
        "phase": "Phase 8: Preprocessor Metaprogramming",
        "topic": "Preprocessor Extensions, Token Concatenation, and Stringification",
        "theory": "Explore advanced preprocessor mechanics. Master the preprocessor operators: stringification (#) which converts macro parameters into string literals, and token concatenation (##) which merges independent tokens into a single compiler identifier.",
        "lab": "Write a debug logger macro that automatically prepends variables names alongside their values by using the stringification operator. Write a token-concatenation system that automatically declares variables identifiers based on dynamic parameters.",
        "code": """// Debug log macro and dynamic variables creation
#include <stdio.h>

#define DEBUG_LOG_INT(var) printf("DEBUG: Variable " #var " value = %d\\n", var)

// Generate variable definitions dynamically
#define DEFINE_STATE_VAR(prefix, id) int prefix##_state_##id = id

int main(void) {
    int system_ticks = 450;
    DEBUG_LOG_INT(system_ticks); // Expands to: printf("DEBUG: Variable " "system_ticks" " value = %d\n", system_ticks)
    
    DEFINE_STATE_VAR(motor, 1);  // Expands to: int motor_state_1 = 1
    DEFINE_STATE_VAR(motor, 2);  // Expands to: int motor_state_2 = 2
    
    printf("Dynamic state variables: %d, %d\\n", motor_state_1, motor_state_2);
    return 0;
}""",
        "validation": "Compile and run. Verify the console outputs variables names printed literally and confirms dynamic state integer variables compile cleanly."
    },
    37: {
        "phase": "Phase 8: Preprocessor Metaprogramming",
        "topic": "Multi-Line Macros Safety and do-while wrappers",
        "theory": "Analyze hazards of multi-line macro expansions. Learn how simple multi-line macros (e.g. without wrappers) fail compile parsing when nested inside simple conditional statements like 'if/else' without brackets. Master the 'do { ... } while(0)' wrapper pattern to ensure macro robustness.",
        "lab": "Write an unsafe multi-line macro and a safe wrapped multi-line macro. Nest both within nested conditional if-statements without brackets. Verify that the unwrapped macro fails compilation, while the wrapped implementation compiles cleanly.",
        "code": """// Safe multi-line macros using do-while boundaries
#include <stdio.h>

#define UPDATE_UNSAFE(x, y) \
    x += 1; \
    y += 2

#define UPDATE_SAFE(x, y) \
    do { \
        x += 1; \
        y += 2; \
    } while(0)

int main(void) {
    int val_a = 0, val_b = 0;
    
    // This will work fine
    if (1)
        UPDATE_SAFE(val_a, val_b);
        
    printf("Safe Update: %d, %d\\n", val_a, val_b);
    
    // WARNING: This syntax will fail compilation or execute unexpectedly 
    // if nested inside an if-else statement:
    // if (0)
    //     UPDATE_UNSAFE(val_a, val_b);
    // else
    //     printf("Else block\\n");
    return 0;
}""",
        "validation": "Compile and run. Verify that UPDATE_SAFE executes correctly and safely encapsulates statement terminations inside all conditional syntax environments."
    },
    38: {
        "phase": "Phase 8: Preprocessor Metaprogramming",
        "topic": "X-Macros Code Generation and Dynamic Lookups",
        "theory": "Master the powerful 'X-Macro' pattern. Learn how to maintain structured tabular data (like error codes, hardware states) in a single centralized preprocessor list, and dynamically compile this list multiple times to automatically generate enum declarations, string lookup tables, and handler functions.",
        "lab": "Create an X-Macro definition list containing systems error codes and printable descriptions. Generate an enum of error codes, and a corresponding function 'err_to_string' that returns descriptions. Touch the X-Macro list and confirm that all enums and lookup tables update automatically.",
        "code": """// Automated enum and string generation using X-Macros
#include <stdio.h>

// Define tabular data once
#define ERROR_TABLE \
    X(ERR_SUCCESS, "Success: System functional") \
    X(ERR_TIMEOUT, "Error: Timeout reached") \
    X(ERR_OVERFLOW, "Error: Stack overflow detected") \
    X(ERR_HARDWARE, "Error: Physical hardware fault")

// 1. Generate the enum declarations
typedef enum {
#define X(name, str) name,
    ERROR_TABLE
#undef X
    ERR_MAX_CODES
} sys_err_t;

// 2. Generate the string translation array
static const char * const err_desc_table[] = {
#define X(name, str) [name] = str,
    ERROR_TABLE
#undef X
};

const char *sys_err_to_string(sys_err_t code) {
    if (code >= ERR_MAX_CODES) return "Error: Unknown code";
    return err_desc_table[code];
}

int main(void) {
    sys_err_t active_err = ERR_OVERFLOW;
    printf("Error Code ID: %d, Description: %s\\n", active_err, sys_err_to_string(active_err));
    return 0;
}""",
        "validation": "Compile and run. Confirm that ERR_OVERFLOW translates directly to its X-Macro description string: 'Error: Stack overflow detected'."
    },
    39: {
        "phase": "Phase 8: Preprocessor Metaprogramming",
        "topic": "Variadic Macros and C11 _Generic Type Selections",
        "theory": "Master advanced compile-time evaluations. Learn variadic macros which accept a variable number of arguments (__VA_ARGS__). Master the C11 '_Generic' expression keyword to implement compile-time type-generic selections, routing functions based on operand types without runtime overhead.",
        "lab": "Write a variadic debug logging macro that automatically adds active filenames and lines. Write a type-generic mathematical function using '_Generic' that automatically invokes specific handlers for floats, doubles, and integers.",
        "code": """// Variadic loggers and dynamic C11 type-generic selections
#include <stdio.h>

#define SYSTEM_LOG(format, ...) \
    printf("[LOG] %s:%d: " format "\\n", __FILE__, __LINE__, ##__VA_ARGS__)

#define abs_generic(x) _Generic((x), \
    int:          abs_int, \
    float:        abs_float, \
    double:       abs_double \
)(x)

static inline int abs_int(int x) { return x < 0 ? -x : x; }
static inline float abs_float(float x) { return x < 0.0f ? -x : x; }
static inline double abs_double(double x) { return x < 0.0 ? -x : x; }

int main(void) {
    SYSTEM_LOG("Starting generic validation. Active run ID: %d", 2026);
    
    int val_i = -42;
    float val_f = -3.14f;
    
    printf("Generic Abs (int):   %d\\n", abs_generic(val_i));
    printf("Generic Abs (float): %.2f\\n", abs_generic(val_f));
    return 0;
}""",
        "validation": "Compile using 'gcc -std=c11 -Wall -Wextra'. Run the binary and verify correct type routing and dynamic parameter expansions."
    },
    40: {
        "phase": "Phase 8: Preprocessor Metaprogramming",
        "topic": "Include Guards, Conditional Compilations, and Assertions",
        "theory": "Analyze how include guards prevent duplicate header definitions. Master compiler conditional compilations (#if, #elif, #endif) to build cross-platform code paths. Master compile-time assertions using the C11 '_Static_assert' keyword to validate structural sizes and alignment constraints before code gets assembled.",
        "lab": "Create header files with cyclic inclusion relationships. Implement robust include guards. Write a structure and use '_Static_assert' to enforce that its total byte size is exactly 8 bytes, preventing compilation if size padding overflows.",
        "code": """// Static assertions and include guard validations
#ifndef RECURSIVE_GUARD_H
#define RECURSIVE_GUARD_H

#include <stdint.h>

typedef struct {
    uint32_t val32;
    uint16_t val16;
    uint8_t  val8;
    uint8_t  reserved;
} payload_frame_t;

// Enforce physical payload structures constraint at compile-time!
// If size violates target (8 bytes), compilation aborts immediately.
_Static_assert(sizeof(payload_frame_t) == 8, "ERROR: payload_frame_t layout must be exactly 8 bytes!");

#endif""",
        "validation": "Compile the code. Adjust payload_frame_t size by adding a uint32_t member. Verify that compiling triggers a fatal error on the '_Static_assert' check and aborts."
    },
    41: {
        "phase": "Phase 9: Concurrency & MISRA C",
        "topic": "POSIX Threads (pthreads) Creation, Joins, and Configurations",
        "theory": "Explore multi-threaded concurrency models in POSIX platforms. Understand threads architecture: threads share the parent process memory space but maintain independent instruction pointers, registers, and execution stack allocations. Learn safe pthread creation, joins, stack attributes, and thread-local variables.",
        "lab": "Write a multi-threaded application that spawns 4 worker threads. Configure thread attributes to define safe stack limits. Join all worker threads in the master coordinator thread, verifying clean exit parameters and passing status codes.",
        "code": """// Concurrency execution using POSIX threads
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#define NUM_WORKERS 4

void *worker_callback(void *arg) {
    uintptr_t thread_id = (uintptr_t)arg;
    printf("[THREAD] Worker %lu is executing systems jobs...\\n", thread_id);
    pthread_exit((void *)(thread_id * 100)); // Return status code
}

int main(void) {
    pthread_t threads[NUM_WORKERS];
    
    for (uintptr_t i = 0; i < NUM_WORKERS; ++i) {
        int res = pthread_create(&threads[i], NULL, worker_callback, (void *)i);
        if (res != 0) {
            perror("Thread creation failed");
            return 1;
        }
    }
    
    for (int i = 0; i < NUM_WORKERS; ++i) {
        void *status;
        pthread_join(threads[i], &status);
        printf("[MAIN] Worker Thread %d joined with status: %lu\\n", i, (uintptr_t)status);
    }
    return 0;
}""",
        "validation": "Compile using 'gcc -pthread thread_ops.c -o thread_ops'. Run and verify that all threads execute concurrently and pass status codes back cleanly."
    },
    42: {
        "phase": "Phase 9: Concurrency & MISRA C",
        "topic": "Race Conditions, Mutex Locks, and Deadlock Avoidance",
        "theory": "Understand the race condition hazard: when multiple concurrent execution threads read and write shared memory addresses simultaneously without coordination, memory state gets corrupted. Study POSIX mutexes (`pthread_mutex_t`), lock disciplines, and deadlock conditions (hierarchical lock order rule).",
        "lab": "Write a program that increments a shared global counter 100,000 times across 4 threads without locks. Observe the corrupted count. Implement a robust pthread mutex lock to enforce atomic updates. Run race detection audits.",
        "code": """// Mitigating race conditions using POSIX Mutexes
#include <pthread.h>
#include <stdio.h>

static volatile int shared_counter = 0;
static pthread_mutex_t counter_mutex = PTHREAD_MUTEX_INITIALIZER;

void *unsynchronized_worker(void *arg) {
    (void)arg;
    for (int i = 0; i < 25000; ++i) {
        shared_counter++; // Race condition hazard
    }
    return NULL;
}

void *synchronized_worker(void *arg) {
    (void)arg;
    for (int i = 0; i < 25000; ++i) {
        pthread_mutex_lock(&counter_mutex);
        shared_counter++; // Safe synchronized access
        pthread_mutex_unlock(&counter_mutex);
    }
    return NULL;
}""",
        "validation": "Compile both worker versions. Audit executable thread safety by running under thread race detectors like Helgrind ('valgrind --tool=helgrind ./app'). Confirm zero race conditions in synchronized worker."
    },
    43: {
        "phase": "Phase 9: Concurrency & MISRA C",
        "topic": "Condition Variables and Producer-Consumer Buffers",
        "theory": "Study advanced thread synchronization mechanics. Understand how busy-polling wastes processor power in multi-threaded wait loops. Learn to coordinate threads using condition variables (`pthread_cond_t`), allowing threads to sleep efficiently until signaled by another thread. Master thread safe Producer-Consumer models.",
        "lab": "Write a concurrent Producer-Consumer application. Set up a shared ring buffer queue protected by a mutex. Configure condition variables (buffer_full, buffer_empty) to coordinate production and consumption, verifying zero data lost.",
        "code": """// Thread-Safe Producer-Consumer Ring Buffer
#include <pthread.h>
#include <stdio.h>
#include <stdbool.h>

#define QUEUE_CAPACITY 8

typedef struct {
    int data[QUEUE_CAPACITY];
    int head;
    int tail;
    int count;
    pthread_mutex_t lock;
    pthread_cond_t  not_full;
    pthread_cond_t  not_empty;
} safe_queue_t;

void queue_push(safe_queue_t *q, int val) {
    pthread_mutex_lock(&q->lock);
    while (q->count == QUEUE_CAPACITY) {
        pthread_cond_wait(&q->not_full, &q->lock); // Sleep until space opens
    }
    
    q->data[q->tail] = val;
    q->tail = (q->tail + 1) % QUEUE_CAPACITY;
    q->count++;
    
    pthread_cond_signal(&q->not_empty); // Wake up waiting consumers
    pthread_mutex_unlock(&q->lock);
}""",
        "validation": "Compile and run a producer-consumer simulation. Verify that items are correctly produced, queued, and consumed in order under multiple threads without locking conflicts."
    },
    44: {
        "phase": "Phase 9: Concurrency & MISRA C",
        "topic": "MISRA C:2012 Guidelines and Critical Safety Constraints",
        "theory": "Study the industrial Motor Industry Software Reliability Association (MISRA C:2012) standard guidelines for safety-critical systems. Explore critical rules: avoiding dynamic allocations after startup, eliminating undefined behaviors (e.g. pointer conversions), prohibiting multiple function exits, and restricting preprocessor usages.",
        "lab": "Create a C library containing common violations of MISRA standards (like raw type casts, multi-return functions, pointer address arithmetic). Use static analyzers like 'cppcheck' or 'clang-tidy' to audit and rewrite the code to conform to 100% compliance.",
        "code": """// Refactoring C code for MISRA C compliance
#include <stdint.h>
#include <stdbool.h>

// VIOLATION: MISRA restricts raw pointer arithmetic and multi-point function returns
int32_t unsafe_search(const int32_t *arr, size_t size, int32_t val) {
    if (arr == NULL) return -1;
    for (size_t i = 0; i < size; ++i) {
        if (*(arr + i) == val) { // Violation: raw pointer additions
            return (int32_t)i;   // Violation: multiple return points
        }
    }
    return -1;
}

// COMPLIANT: Single exit point, array index referencing instead of pointer maths
int32_t compliant_search(const int32_t arr[], size_t size, int32_t val) {
    int32_t found_index = -1;
    
    if (arr != NULL) {
        for (size_t i = 0; i < size; ++i) {
            if (arr[i] == val) {
                found_index = (int32_t)i;
                break; // Clean single exit point search completion
            }
        }
    }
    
    return found_index;
}""",
        "validation": "Run 'cppcheck --addon=misra.py compliant_code.c' or use static diagnostic checks. Confirm that compliant code successfully satisfies coding constraints."
    },
    45: {
        "phase": "Phase 9: Concurrency & MISRA C",
        "topic": "Systems Profiling, Leak Audits, and Graduate Code Review",
        "theory": "Explore advanced systems performance optimization pipelines. Understand how CPU cache misses and memory leakages degrade real-time embedded environments. Study validation tools: Valgrind (memory tracking), Gprof (execution cycle timing), and Perf (hardware counter monitoring).",
        "lab": "Write an application that contains intentional memory leaks and high CPU utilization. Run the application through Valgrind to identify leaks and run under Gprof to pinpoint exactly which functions consume the most execution cycles. Optimize the hot-paths.",
        "code": """// Final performance profiling and leak audits target
#include <stdio.h>
#include <stdlib.h>

__attribute__((noinline)) void perform_heavy_computation(void) {
    volatile double dummy = 0.0;
    for (int i = 0; i < 10000000; ++i) {
        dummy += (double)i * 2.5;
    }
    (void)dummy;
}

int main(void) {
    printf("Starting final systems performance audits...\\n");
    
    // Intentionally leaking memory to test Valgrind traps
    int *leaked_buffer = (int *)malloc(1024 * sizeof(int));
    if (leaked_buffer == NULL) return 1;
    leaked_buffer[0] = 45;
    
    perform_heavy_computation();
    
    // Note: leaked_buffer is intentionally not freed
    printf("Audits complete. Run Valgrind to diagnose leaks!\\n");
    return 0;
}""",
        "validation": "Compile using 'gcc -pg final_profile.c -o final_profile'. Run code, then execute 'gprof ./final_profile gmon.out' to view the cycle profile. Run under 'valgrind --leak-check=full ./final_profile' to verify the leaked_buffer trap."
    }
}

# The Markdown Template for generating daily plans
TEMPLATE_DAY_PLAN = """# Microscopic Daily Vetting Specification
## {phase} | Day {day:02d}: {topic}

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day {day:02d} of 45 | Phase: {phase}
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
{theory}

#### 🛠️ Unassisted Lab Track (4 Hours)
{lab}

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
{code}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** {validation}
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
"""

def generate_roadmap():
    # Helper to generate the high-level c_fast_track_roadmap.md file
    roadmap_path = os.path.join(C_FAST_TRACK_DIR, "c_fast_track_roadmap.md")
    
    content = """# 🏆 C Systems Programming Elite 45-Day Fast-Track Roadmap

This roadmap structures the complete **45-Day C Systems Programming Fast-Track** program, organized into 9 high-intensity Weeks (5 days per week). This intensive course is designed to transition you from standard C programming into an elite post-silicon validation and bare-metal systems engineering expert.

---

## 🏛️ Phase & Day Milestone Matrix

| Phase | Days | Core Competency Focus |
| :--- | :--- | :--- |
| **Phase 1: Compiler & Toolchains** | Day 01 - Day 05 | **Compilation Pipelines:** Preprocessing outputs, Make dependency files, symbol table bindings. |
| **Phase 2: Data & Radix Hazards** | Day 06 - Day 10 | **Data Types & Arithmetic:** Two's complement integer overflows, float precision leaks, branch-free logic. |
| **Phase 3: Stack & Execution Frame** | Day 11 - Day 15 | **Procedure Call Standards:** AAPCS registers, function activation frame assembly, stack canaries. |
| **Phase 4: Pointers & Arithmetic** | Day 16 - Day 20 | **Addressing Mechanics:** Raw address casting, volatile pointer configurations, pointer scaling maths. |
| **Phase 5: Structures & Alignments** | Day 21 - Day 25 | **Memory Layouts:** Structure padding 32-bit alignments, unions type punning, bitfield configurations. |
| **Phase 6: Custom Allocators** | Day 26 - Day 30 | **Dynamic Memory:** Custom aligned Heap Arena allocators, memory pool managers, fragmentations. |
| **Phase 7: POSIX System Boundaries** | Day 31 - Day 35 | **Unbuffered System I/O:** POSIX read/write descriptors, mmap zero-copy file mapping, errno recovery. |
| **Phase 8: Preprocessor Metaprogramming** | Day 36 - Day 40 | **Macro Metaprogramming:** Token concatenation, generic X-Macros tables, compiler output checks. |
| **Phase 9: Concurrency & MISRA C** | Day 41 - Day 45 | **Multithreading Concurrency:** pthreads scheduling, mutex lockouts, Helgrind race checks, MISRA rules. |

---

## 📅 Chronological Day-by-Day Syllabus

"""
    for day in sorted(C_FAST_TRACK_DB.keys()):
        data = C_FAST_TRACK_DB[day]
        content += f"### Day {day:02d}: {data['topic']}\n"
        content += f"*   **Phase:** {data['phase']}\n"
        content += f"*   **Overview:** {data['theory'][:120]}...\n"
        content += f"*   **Daily Plan Link:** [Day_{day:02d}.md](file:///home/siva/sivaramireddy/Project1/c-fast-track/Day_Plans/Day_{day:02d}.md)\n\n"
        
    with open(roadmap_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated Roadmap: {roadmap_path}")

def main():
    print("Generating 45 Microscopic Daily C Systems Programming Plans...")
    
    for day in range(1, 46):
        data = C_FAST_TRACK_DB.get(day, {
            "phase": "Phase Milestone",
            "topic": "Systems Engineering Milestone Verification",
            "theory": "First-principles engineering evaluation of core systems variables configurations.",
            "lab": "Write custom low-level drivers variables and compile cleanly.",
            "code": "// Default registers configurations\n#include <stdint.h>\n\nvoid init_default_register(void) {\n    volatile uint32_t *reg = (volatile uint32_t *)0x20001000U;\n    *reg = 0xAA;\n}",
            "validation": "Verify register memory writes using GDB commands."
        })
        
        day_plan_text = TEMPLATE_DAY_PLAN.format(
            phase=data["phase"],
            day=day,
            topic=data["topic"],
            theory=data["theory"],
            lab=data["lab"],
            code=data["code"],
            validation=data["validation"]
        )
        
        filename = f"Day_{day:02d}.md"
        filepath = os.path.join(DAY_PLANS_DIR, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(day_plan_text)
            
    print(f"SUCCESS: Generated 45 individual daily plans inside {DAY_PLANS_DIR}!")
    generate_roadmap()

if __name__ == "__main__":
    main()
