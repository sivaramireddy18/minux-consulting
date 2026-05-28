# Week 06: Compound Data Structures & Layout

## 🎯 Weekly Goal
Master the exact layout of compound structures inside computer memory, control byte alignment and structure padding, exploit unions for type punning, and implement safe binary packet serialization routines.

## 🎓 Weekly Outcome
By the end of this week, you will be able to construct non-padded structures matching industrial hardware standards, analyze layout offsets using compile-time assertions, pack bit-level telemetry variables using bitfields, and serialize structures securely for network transmission.

---

## 📅 Session Breakdown

### Monday: Structure Padding & Byte Alignment
* **Conceptual Focus:** The CPU alignment optimization.
  * Modern 32-bit or 64-bit CPUs fetch memory in word blocks (4 or 8 bytes). If variables cross word boundaries, the CPU must make multiple read cycles.
  * To optimize, compilers automatically insert "padding bytes" to align variables to addresses matching their size.
  * **The Alignment Rule:** Every basic type is aligned to an address that is a multiple of its size (e.g. `double` aligned to 8-byte boundaries).
* **Hands-on Experiment:**
  Inspect structure size expansion and observe padding bytes:
  ```c
  #include <stdio.h>
  #include <stddef.h>
  
  struct Padded {
      char a;      // 1 byte
      // 3 padding bytes inserted here to align b (int is 4 bytes)
      int b;       // 4 bytes
      char c;      // 1 byte
      // 3 padding bytes inserted here to align structure total size to multiple of 4
  };
  
  struct Optimized {
      int b;       // 4 bytes
      char a;      // 1 byte
      char c;      // 1 byte
      // 2 padding bytes inserted at end
  };
  
  int main(void) {
      printf("Padded structure size: %lu bytes (Expected: 12)\n", sizeof(struct Padded));
      printf("Optimized structure size: %lu bytes (Expected: 8)\n", sizeof(struct Optimized));
      printf("Offset of b in Padded: %lu bytes\n", offsetof(struct Padded, b));
      return 0;
  }
  ```

---

### Tuesday: Packing Structures
* **Conceptual Focus:** Forcing zero-padding layout.
  * When writing drivers or mapping network packets, structure layout must match the protocol exactly.
  * **Forcing packing:** Using GCC attributes `__attribute__((packed))` or `#pragma pack(1)`.
  * **Trade-off:** Packing saves memory and simplifies serialization but can cause performance penalties or hardware faults on architectures that do not support unaligned memory accesses (like some ARM Cortex chips).
* **Hands-on Exercise:**
  Construct and verify compile-time assertion size checks:
  ```c
  #include <stdio.h>
  
  struct __attribute__((packed)) PackedStruct {
      char a;
      int b;
      char c;
  };
  
  // Static compile-time assertion (fails compile if struct layout is incorrect)
  _Static_assert(sizeof(struct PackedStruct) == 6, "PackedStruct layout alignment failed!");
  
  int main(void) {
      printf("Size: %lu bytes\n", sizeof(struct PackedStruct));
      return 0;
  }
  ```

---

### Wednesday: Unions & Type Punning
* **Conceptual Focus:** Shared memory locations.
  * Unions allocate a single block of memory matching the size of their largest member.
  * **Type Punning:** Reading the same memory address as a different data type. Excellent for decomposing floats into byte streams.
* **Hands-on Exercise:**
  Inspect float bytes using unions:
  ```c
  #include <stdio.h>
  #include <stdint.h>
  
  union FloatPunder {
      float f_val;
      uint32_t raw_bits;
  };
  
  int main(void) {
      union FloatPunder punner;
      punner.f_val = 1.0f;
      printf("Float: %f, Binary bits: 0x%08X\n", punner.f_val, punner.raw_bits);
      return 0;
  }
  ```

---

### Thursday: Bitfields
* **Conceptual Focus:** Bit-level structures packing.
  * Declaring variables with precise bit widths inside structures.
  * Syntax: `type name : bit_width;`.
  * Real-world usage: Register configuration maps.

---

### Friday: Binary Serialization over Channels
* **Conceptual Focus:** Packing structures safely into transport-ready byte streams and resolving endian mismatches securely.

---

## 🛠️ Hands-On Assignment: Telemetry Frame Pack/Unpack Engine
Design and build a byte-aligned **Telemetry Serialization Engine** that packs sensor measurements into unpadded byte frames.

### 1. Requirements
* Define a Telemetry Frame containing: `device_id` (8-bit), `status_flags` (8-bit bitfield), `temperature` (32-bit float), `counter` (16-bit unsigned).
* Force zero-padding using strict attributes, and verify sizes using `_Static_assert`.
* Implement:
  * `int serialize_frame(const Telemetry *t, uint8_t *buffer, size_t max_len)`
  * `int deserialize_frame(Telemetry *t, const uint8_t *buffer, size_t len)`
* Ensure correct Endian translation when serializing (Big-Endian network byte format conversion).

### 2. File Deliverables
* `telemetry.h`: Structure layouts and bitfields definitions.
* `telemetry.c`: Serialization and Endian swaps execution.
* `main.c`: Test scenarios asserting data integrity across byte networks.

---

## 📋 Deliverables Checklist
- [ ] `telemetry.h` (Zero-padded structures, assertions)
- [ ] `telemetry.c` (Safe endian conversion logic)
- [ ] `main.c` (Precision checks verification)
- [ ] `Makefile` (Strict C11 compiler setup)

---

## ❓ Self-Check Questions
1. Why does the compiler automatically add padding bytes to structure configurations?
2. What are the performance penalties associated with unaligned memory access on RISC hardware architectures?
3. How does `_Static_assert` differ from standard runtime `assert()` functions?
4. Explain how a union allows you to decompose a floating-point number into four raw bytes without casting or math operations.
5. In bitfield declarations, why are data types like `uint8_t` or `uint32_t` preferred over raw signed integers?

---

## 🚀 Stretch Task
Implement an automated **Structure Packing Visualizer** function. Write C code that reads structural addresses and outputs an ASCII map illustrating the exact memory location and spacing of every member, highlighting padding bytes visually.

---

## 💡 Motivation Checkpoint
Space missions require hyper-efficient telemetry formatting. In space probes (like the Voyager or Mars Rover), every byte transmitted back to Earth takes massive power and signal time. Forcing tight, unpadded, bit-level data structures ensures that zero bandwidth is wasted on blank padding bytes.

---

## 🎓 Trainer Review Rules
* Verify structure sizes: `sizeof(Telemetry)` must be exactly 8 bytes (1+1+4+2), validated via a compile-time static assertion.
* The serialize routine must translate the internal float structure into Big-Endian layout using portable bit shift mechanisms or standard network conversion routines (`htonl`/`ntohl` style punning).
