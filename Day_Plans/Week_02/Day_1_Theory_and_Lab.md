# Microscopic Daily Vetting Specification
## Week 02, Day 1 (Monday): Radix Formats, Hex, Binary, and Octal conversions

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 02 | Day 1 (Monday)
*   **Core Systems Topic:** Radix Formats, Hex, Binary, and Octal conversions
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand base systems (binary - base 2, octal - base 8, decimal - base 10, hexadecimal - base 16). Comprehend binary scaling, signed formats (One's complement, Two's complement), and how fixed-width integers sit in core registers.

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Complete a mental math matrix converting numbers between binary, decimal, and hexadecimal.
  2. Map out how negative integers are represented in two's complement and verify overflow limits on a 8-bit, 16-bit, and 32-bit boundary.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
Value: 187 (Decimal)
Hexadecimal: 0xBB (11*16^1 + 11*16^0 = 176 + 11 = 187)
Binary: 0b10111011 (128 + 32 + 16 + 8 + 2 + 1 = 187)
Octal: 0273 (2*64 + 7*8 + 3 = 128 + 56 + 3 = 187)
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
