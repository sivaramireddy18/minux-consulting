# Week 02: Types, Representations, & CPU Realities

## 🎯 Weekly Goal
Master the physical layout of data types in memory, understand CPU radix formats, explore float representation limits, and implement robust overflow/underflow detection in C.

## 🎓 Weekly Outcome
By the end of this week, you will be able to write architecture-independent code using explicit fixed-width integers, identify floating-point round-off flaws, detect arithmetic integer overflows *before* they occur, and manipulate raw binary bits securely.

---

## 📅 Session Breakdown

### Monday: The Integer Representation Layer
* **Conceptual Focus:** How integers are stored in silicon:
  * **Unsigned Integers:** Pure binary counting.
  * **Signed Integers (Two's Complement):** To negate a number, invert all bits and add 1. Understand why this layout makes CPU addition circuits identical for signed and unsigned math.
  * **Sign Extension:** What happens when casting a smaller signed type (e.g., `int8_t`) to a larger type (e.g., `int32_t`). Explain how the sign bit is duplicated to preserve the negative value.
* **Hands-on Experiment:**
  Inspect memory bytes using a pointer type-cast union:
  ```c
  #include <stdio.h>
  #include <stdint.h>
  
  int main(void) {
      int8_t a = -5;
      uint8_t *p = (uint8_t *)&a;
      printf("Value: %d, Hex byte in memory: 0x%02X\n", a, *p);
      
      // Perform cast and observe sign extension
      int32_t extended = a;
      printf("Extended value: %d, Hex representation: 0x%08X\n", extended, extended);
      return 0;
  }
  ```

---

### Tuesday: Fixed-Width Integers (`stdint.h`)
* **Conceptual Focus:** The portability trap.
  * In standard C, the size of raw types (`int`, `long`, `short`) is compiler and hardware dependent (e.g., `int` is 16-bit on old MCUs, 32-bit on modern x86/ARM CPUs).
  * Why standard libraries for safety-critical coding demand fixed-width integers: `uint8_t`, `int16_t`, `uint32_t`, `int64_t`.
* **Hands-on Exercise:**
  Investigate architecture limits using standard macros:
  ```c
  #include <stdio.h>
  #include <stdint.h>
  #include <limits.h>
  
  int main(void) {
      printf("Max uint32_t: %u\n", UINT32_MAX);
      printf("Min int16_t: %d, Max int16_t: %d\n", INT16_MIN, INT16_MAX);
      return 0;
  }
  ```

---

### Wednesday: IEEE-754 Floating-Point Realities
* **Conceptual Focus:** Decimal representation limits.
  * Single-precision (`float`) and Double-precision (`double`) representations: Sign bit, Exponent, and Significand (Mantissa).
  * Why some fractions (like `0.1`) cannot be represented exactly in binary, causing infinite recurring decimals and round-off accumulation errors.
  * Why **never** to use `==` or `!=` comparisons on floats.
* **Hands-on Experiment:**
  Demonstrate float precision leakage:
  ```c
  #include <stdio.h>
  int main(void) {
      float sum = 0.0f;
      for (int i = 0; i < 10; i++) {
          sum += 0.1f;
      }
      printf("Sum of 0.1 ten times: %.10f\n", sum);
      if (sum == 1.0f) {
          printf("Exactly 1.0\n");
      } else {
          printf("Not 1.0! Precision leakage occurred.\n");
      }
      return 0;
  }
  ```
  Learn to compare floats using an epsilon value: `if (fabs(sum - 1.0f) < 1e-6)`.

---

### Thursday: Integer Overflow & Underflow Disasters
* **Conceptual Focus:** The catastrophic safety hazard.
  * In signed math, integer overflow is **undefined behavior (UB)**—the compiler might optimize away checks entirely.
  * In unsigned math, overflow wraps around silently (`UINT_MAX + 1 == 0`).
  * How overflow leads to heap buffer overflow exploits.
* **Hands-on Exercise:**
  Write defensive checking functions *before* executing the addition:
  ```c
  #include <stdio.h>
  #include <stdint.h>
  #include <stdbool.h>
  
  bool safe_add_uint32(uint32_t a, uint32_t b, uint32_t *result) {
      if (UINT32_MAX - a < b) {
          return false; // Overflow warning
      }
      *result = a + b;
      return true;
  }
  ```

---

### Friday: Endianness & Byte Swapping
* **Conceptual Focus:** Hardware architectures store bytes differently.
  * **Little-Endian (x86, ARM default):** Least Significant Byte (LSB) stored at lowest memory address.
  * **Big-Endian (Network protocols):** Most Significant Byte (MSB) stored at lowest address.
* **Hands-on Exercise:**
  Detect host endianness at runtime and write a custom byte-swapper function.

---

## 🛠️ Hands-On Assignment: Safe Float Parser & Numeric Auditor
Implement a high-integrity parser that converts clean string inputs to numeric float coordinates and audits unsigned binary arithmetic arrays, protecting against overflows.

### 1. Requirements
* Implement `int parse_coordinate(const char *str, float *val)` which extracts coordinates safely, checking for parse boundary limits and returning `0` on success, `-1` on format error.
* Implement `int safe_array_sum(const uint32_t *arr, int len, uint64_t *sum_out)` which computes sums and safely detects overflows, returning `-1` if array indices trigger bounds failures.

### 2. File Deliverables
* `auditor.h`: Declarations of boundary structures and functions.
* `auditor.c`: Boundary checks implementation.
* `main.c`: Unit tests asserting parser performance against overflow patterns.

---

## 📋 Deliverables Checklist
- [ ] `auditor.h` (Strict header constraints)
- [ ] `auditor.c` (Safe addition and parse functions)
- [ ] `main.c` (Test runner demonstrating safe sum checks)
- [ ] `Makefile` (Zero warnings compile setup)

---

## ❓ Self-Check Questions
1. Why does Two's Complement representation make hardware logic subtraction identical to addition?
2. What happens to the sign bit of an `int8_t` when cast to an `unsigned int` (sign extension vs raw byte mapping)?
3. Why does single-precision float `0.1` cause recurring decimal errors in binary representation?
4. Write a defensive condition to verify if multiplying two `uint32_t` values will trigger an overflow.
5. How can you identify if your Linux host system is Little-Endian or Big-Endian in pure C without calling system tools?

---

## 🚀 Stretch Task
Implement an **Arbitrary Precision Integer Addition Engine** ("BigInt") that stores extremely massive numbers as an array of `uint8_t` digits (representing digits 0-9) and performs arithmetic addition using safe column-by-column carrying, allowing you to add numbers up to 100 digits long without overflow.

---

## 💡 Motivation Checkpoint
Integer overflows are one of the most exploited security vulnerabilities in software history. In 1996, the Ariane 5 rocket exploded 40 seconds after launch due to an unhandled 64-bit float to 16-bit signed integer conversion overflow, costing $370 million. Operating at a systems level means designing safe bounds checks into every transaction.

---

## 🎓 Trainer Review Rules
* Validate parsing robustness: input strings with excessive spaces, negative signs, and non-numeric characters must fail cleanly.
* Unsigned addition arithmetic must trigger error return codes immediately upon boundary breach, without relying on wrap-around detection.
