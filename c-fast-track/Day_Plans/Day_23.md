# Microscopic Daily Vetting Specification
## Phase 5: Structures & Alignments | Day 23: Unions, Type Punning, and Raw Binary Serialization

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 23 of 45 | Phase: Phase 5: Structures & Alignments
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore unions, where all members share the same starting address in memory. Analyze union size constraints (equal to its largest member). Study the concepts of 'type punning' (accessing the binary bits of one type as another) and raw serialization/deserialization layouts.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a floating-point bit inspection utility using a union. Read the exponent and significand bits of a float by punning it into an unsigned integer. Use a union to serialize structured data packets into char streams and verify integrity.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Type Punning and Byte-Serialization using Unions
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
    printf("Float 1.0f raw binary bits in hex: 0x%08X\n", pun.raw_bits);
    
    packet_t tx_packet;
    tx_packet.fields.frame_id = 0xAA;
    tx_packet.fields.sensor_status = 0x01;
    tx_packet.fields.sensor_reading = 0x03FF; // 1023 in decimal
    
    printf("Serialized stream bytes: 0x%02X 0x%02X 0x%02X 0x%02X\n", 
           tx_packet.raw_bytes[0], tx_packet.raw_bytes[1], 
           tx_packet.raw_bytes[2], tx_packet.raw_bytes[3]);
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile and run. Verify the raw bits of float 1.0f is 0x3F800000 and the serialized output matches the little/big endian layout of the platform.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
