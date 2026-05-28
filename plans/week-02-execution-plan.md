# Weekly Execution Plan: Week 02

## 🎯 Weekly Goal
Master low-level data representation Formats (Binary, Hexadecimal, Octal), understand logic gate electrical behaviors, Boolean algebra theorems, and build low-level software simulations of digital hardware logic blocks.

## 🏆 Weekly Outcome
By Friday, the student will be able to perform flawless hex/bin conversions mentally, apply Boolean theorems to simplify hardware circuitry, and write a complete, modular C library simulating logical gates (AND, OR, XOR, NOT, NAND, NOR) that outputs truth tables and simulates 4-bit adders using raw bitwise manipulations.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Radix Formats, Hex, Binary, and Octal conversions
* **Conceptual Objective**: Understand base systems (binary - base 2, octal - base 8, decimal - base 10, hexadecimal - base 16). Comprehend binary scaling, signed formats (One's complement, Two's complement), and how fixed-width integers sit in core registers.
* **Practical Activity**:
  1. Complete a mental math matrix converting numbers between binary, decimal, and hexadecimal.
  2. Map out how negative integers are represented in two's complement and verify overflow limits on a 8-bit, 16-bit, and 32-bit boundary.
* **Code/Circuit Reference**:
```text
Value: 187 (Decimal)
Hexadecimal: 0xBB (11*16^1 + 11*16^0 = 176 + 11 = 187)
Binary: 0b10111011 (128 + 32 + 16 + 8 + 2 + 1 = 187)
Octal: 0273 (2*64 + 7*8 + 3 = 128 + 56 + 3 = 187)
```

### Tuesday: Boolean Algebra, Laws, and Logic Simplification
* **Conceptual Objective**: Learn logic gate logic rules (AND, OR, NOT, NAND, NOR, XOR, XNOR). Master Boolean theorems: Commutative, Associative, Distributive, Identity, and De Morgan’s Laws ($\overline{A \cdot B} = \overline{A} + \overline{B}$ and $\overline{A + B} = \overline{A} \cdot \overline{B}$).
* **Practical Activity**:
  1. Draw truth tables for all 7 fundamental logic gates.
  2. Prove De Morgan's Law algebraically and simplify a complex multi-gate circuit down to minimal gates.
* **Code/Circuit Reference**:
```text
Boolean Circuit Simplification:
Y = A·B·C + A·B·C' + A'·B
Step 1: Factor out A·B -> Y = A·B·(C + C') + A'·B
Step 2: C + C' = 1    -> Y = A·B·(1) + A'·B
Step 3: Factor out B   -> Y = B·(A + A')
Step 4: A + A' = 1    -> Y = B·(1)
Simplified Result: Y = B
```

### Wednesday: Logical Gates Implementations in C
* **Conceptual Objective**: Understand the mapping between logical gates and C bitwise programming operators (`&` for AND, `|` for OR, `^` for XOR, `~` for NOT). Avoid confusing these with logical evaluation operators (`&&`, `||`, `!`).
* **Practical Activity**:
  1. Write individual, clean functions in C that simulate AND, OR, XOR, NOT, NAND, NOR, and XNOR.
  2. The function parameters and return types must be strict booleans or single bits.
* **Code/Circuit Reference**:
```c
#include <stdbool.h>

// Core NAND gate simulation
bool gate_nand(bool input_a, bool input_b) {
    return !(input_a && input_b);
}

// Core XOR gate using basic NAND gates only
bool gate_xor(bool a, bool b) {
    bool n1 = gate_nand(a, b);
    bool n2 = gate_nand(a, n1);
    bool n3 = gate_nand(b, n1);
    return gate_nand(n2, n3);
}
```

### Thursday: Combinational Logic (Half-Adders & Full-Adders)
* **Conceptual Objective**: Understand combinational logic architectures. Study the construction of a half-adder (computes sum and carry-out of two bits) and a full-adder (computes sum and carry-out of two bits plus a carry-in).
* **Practical Activity**:
  1. Draw the block diagram for a Full-Adder using XOR, AND, and OR gates.
  2. Implement a full-adder function in C by nesting your gate functions from Wednesday.
* **Code/Circuit Reference**:
```text
Full-Adder Logical Diagram:
Inputs: A, B, Cin
Outputs: Sum, Cout

      A -----[XOR 1]------+------[XOR 2]--------> Sum
      B -----|            |      |
                          +-[AND 1]---------[OR]---> Cout
      Cin -----------------------+          |
      (A AND B) ----------------------------+
```

### Friday: Sequential Circuits Basics (Latches & Flip-Flops)
* **Conceptual Objective**: Learn the core transition from combinational to sequential logic (state-holding). Study the SR Latch, gated D Latch, and edge-triggered D Flip-Flop. Understand how clocks control propagation.
* **Practical Activity**:
  1. Trace an active-low SR NAND latch truth table and identify the "forbidden" state.
  2. Write a state-based loop in C simulating clock cycles and latch state updates.
* **Code/Circuit Reference**:
```c
typedef struct {
    bool Q;
    bool Q_bar;
} sr_latch_t;

// Update latch outputs based on inputs
void update_sr_latch(bool S, bool R, sr_latch_t *latch) {
    if (!S && R) {
        latch->Q = true;
        latch->Q_bar = false;
    } else if (S && !R) {
        latch->Q = false;
        latch->Q_bar = true;
    } else if (!S && !R) {
        // Forbidden state for Active-Low Latch
        latch->Q = true;
        latch->Q_bar = true;
    }
    // S=1, R=1: Hold state (no change)
}
```

---

## 🛠️ Hands-On Assignment: 4-Bit Binary Full-Adder Emulator

### Functional Requirements
Write a production-grade C library that models hardware logic gates and assemblies a complete 4-bit Binary Full-Adder.
1. The library must define distinct structures for `gate` behaviors. No standard logical operators `&&`, `||`, or `!` may be used inside the adder implementation—it must construct logic exclusively by calling your individual gate functions.
2. The user must be able to input two 4-bit integers (e.g., $10$ and $7$) represented in arrays of bits.
3. The adder must output the binary array showing sum bits and carry-out, as well as print the truth table demonstrating correct calculation.
4. Verify edge cases: maximum addition ($15 + 15 = 30$) showing correct carry-over.

### Structural Requirements & Code Skeleton
**`logic_gates.h`**:
```c
#ifndef LOGIC_GATES_H
#define LOGIC_GATES_H

#include <stdbool.h>

// Fundamental gates
bool gate_and(bool a, bool b);
bool gate_or(bool a, bool b);
bool gate_not(bool a);

// Compound gates built on fundamentals
bool gate_nand(bool a, bool b);
bool gate_nor(bool a, bool b);
bool gate_xor(bool a, bool b);

// Adders
typedef struct {
    bool sum;
    bool carry_out;
} adder_result_t;

adder_result_t half_adder(bool a, bool b);
adder_result_t full_adder(bool a, bool b, bool carry_in);

#endif // LOGIC_GATES_H
```

**`adder_4bit.c` (C-Skeleton)**:
```c
#include "logic_gates.h"
#include <stdio.h>

void adder_4bit(const bool a[4], const bool b[4], bool sum[4], bool *carry_out) {
    adder_result_t bit0 = full_adder(a[0], b[0], false);
    sum[0] = bit0.sum;

    adder_result_t bit1 = full_adder(a[1], b[1], bit0.carry_out);
    sum[1] = bit1.sum;

    adder_result_t bit2 = full_adder(a[2], b[2], bit1.carry_out);
    sum[2] = bit2.sum;

    adder_result_t bit3 = full_adder(a[3], b[3], bit2.carry_out);
    sum[3] = bit3.sum;

    *carry_out = bit3.carry_out;
}
```

---

## 📦 Deliverables
* [ ] Complete `logic_gates.c` and `logic_gates.h` source files.
* [ ] Test program `main.c` that validates 4-bit addition over all inputs $0\dots15$.
* [ ] Clean Makefile to compile with `-Wall -Wextra -Werror` flags.
* [ ] Truth table output logs in file `adder_validation.log`.

---

## ❓ Self-Check Questions
1. Why is the number format **Two's Complement** universally preferred inside CPU arithmetic logic units (ALUs) over **One's Complement** or **Signed-Magnitude** formats?
2. What are the logical gate formulations for De Morgan's theorems? State them mathematically and draw the gate mappings.
3. Show how a standard 2-to-1 Multiplexer (MUX) can be constructed strictly using NAND gates.
4. What is the cause of **propagation delay** in physical hardware logic gates? Why must a software logic simulator account for simulated time blocks if doing cycle-accurate modeling?
5. Write the hexadecimal representation for the 32-bit signed integer `-42` in Two's Complement.

---

## 🚀 Stretch Task (Optional)
Extend the 4-bit emulator to model propagation delay. Assign a default delay (e.g., AND/OR = 2ns, NOT = 1ns, XOR = 3ns). Modify gate functions to compute and track cumulative signal propagation times. Output the exact maximum timing delay observed for a full 4-bit calculation transition (e.g., from `0111 + 0001` to `1000`).

## 💡 Motivation Checkpoint
Inside any modern processor core, millions of transistors form logic gates, which aggregate to construct ALUs, vector pipelines, and bus routers. When you write a simple C instruction `x = a + b;`, it compiled directly to CPU assembly commands that physically route electron streams through this exact sequence of adders and carry lines. Understanding logic gating removes the mystery of computer math.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Code compiles without any warnings.
  - Zero standard logical operators (`&&`, `||`, `!`) appear inside `adder_4bit.c` (must call gate functions).
  - Adder produces correct sums and carry-overs for all 256 test cases of 4-bit inputs.
* **Fail Criteria**:
  - Magic values used for binary manipulation.
  - Direct logical operators inside adder algorithms instead of functional gate abstraction layers.
