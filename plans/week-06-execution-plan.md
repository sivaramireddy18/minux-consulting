# Weekly Execution Plan: Week 06

## 🎯 Weekly Goal
Master structural layout controls, unions, memory padding, data structure alignment, and advanced preprocessor metaprogramming inside production C applications.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Serialized Frame Packetizer** in C. They will understand compiler structure packing directives, how to analyze alignment padding bytes manually, and how to write safe, macro-based code templates to automate repetitive logic.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Structures, Typedefs, and Object models
* **Conceptual Objective**: Master C struct representations. Understand how data is laid out sequentially in memory. Comprehend structure initialization methods, typedef abstractions, and passing structs to functions (by value vs by reference).
* **Practical Activity**:
  1. Write a program declaring complex nested structs.
  2. Implement functional drivers passing pointers of these structures, demonstrating efficiency improvements over passing by value.
* **Code/Circuit Reference**:
```c
typedef struct {
    uint8_t sensor_id;
    uint32_t timestamp;
    float reading;
} sensor_packet_t;

// Pass by reference (highly efficient, only transfers a 32/64-bit pointer address)
void process_packet(const sensor_packet_t *packet) {
    printf("Sensor ID: %u, Value: %.2f\n", packet->sensor_id, packet->reading);
}
```

### Tuesday: Structure Padding, Alignment, and Packing
* **Conceptual Objective**: Understand that compilers automatically insert padding bytes into structures to align multi-byte data on native boundaries (e.g., a 32-bit float must align to an address divisible by 4). Study `pragma pack` and attribute packing directives.
* **Practical Activity**:
  1. Declare the same structural components in different orders. Measure structure sizes using `sizeof()` and observe how ordering changes padding.
  2. Apply `__attribute__((packed))` to strip padding and inspect the resulting layout byte-by-byte.
* **Code/Circuit Reference**:
```c
// Size of this struct is 12 bytes due to padding:
// [char (1 byte)] + [3 padding bytes] + [int (4 bytes)] + [short (2 bytes)] + [2 padding bytes]
typedef struct {
    char a;
    int b;
    short c;
} padded_struct_t;

// Size of this struct is 7 bytes (zero padding):
typedef struct __attribute__((packed)) {
    char a;
    int b;
    short c;
} packed_struct_t;
```

### Wednesday: Advanced Preprocessor Metaprogramming (Macro Utilities)
* **Conceptual Objective**: Master preprocessor expansion mechanics. Study token concatenation (`##`), stringification (`#`), variadic macros (`__VA_ARGS__`), and how to implement compile-time assertion utilities.
* **Practical Activity**:
  1. Write macro helpers to automatically generate structural access APIs.
  2. Implement a `STATIC_ASSERT` preprocessor tool that fails compilation if a target structure size exceeds limits.
* **Code/Circuit Reference**:
```c
// Compile-time assertion macro (fails compilation if condition is false)
#define STATIC_ASSERT(cond, msg) typedef char static_assertion_##msg[(cond) ? 1 : -1]

// Verify packed struct is exactly 7 bytes at compile time!
STATIC_ASSERT(sizeof(packed_struct_t) == 7, PackedStructSizeIncorrect);
```

### Thursday: Unions for Multi-Type Message Parsing
* **Conceptual Objective**: Master union mechanics for multi-type communication messaging. Learn how to overlay a raw byte command payload with different command structures without copying memory.
* **Practical Activity**:
  1. Declare command unions defining different packet layouts.
  2. Receive a raw buffer, overlay the union, read command ID fields, and parse data members dynamically.
* **Code/Circuit Reference**:
```c
typedef enum {
    CMD_LED_CTRL,
    CMD_MOTOR_SPEED
} cmd_id_t;

typedef struct {
    uint8_t pin;
    bool state;
} cmd_led_t;

typedef struct {
    uint16_t rpm;
} cmd_motor_t;

typedef union {
    cmd_led_t led;
    cmd_motor_t motor;
} cmd_payload_t;

typedef struct {
    cmd_id_t cmd_id;
    cmd_payload_t payload;
} command_packet_t;
```

### Friday: Endianness and Structure Serializations
* **Conceptual Objective**: Master data serialization across hardware environments. Understand how big-endian and little-endian networks communicate. Learn how to safely serialize a struct to a raw byte array for transport, and unpack it on a receiving target.
* **Practical Activity**:
  1. Write serialization and deserialization functions that convert structural fields into standardized, network-endian (big-endian) byte streams.
  2. Verify byte order transitions on the host.
* **Code/Circuit Reference**:
```c
// Safe serialization helper for a 16-bit integer (converts to Big-Endian network format)
void serialize_uint16(uint8_t *buffer, uint16_t value) {
    buffer[0] = (uint8_t)((value >> 8) & 0xFF);
    buffer[1] = (uint8_t)(value & 0xFF);
}

uint16_t deserialize_uint16(const uint8_t *buffer) {
    return (uint16_t)((buffer[0] << 8) | buffer[1]);
}
```

---

## 🛠️ Hands-On Assignment: Serialized Command Packetizer

### Functional Requirements
Create a robust Serialized Command Packetizer that serializes and deserializes structured command frames for a simulated UART physical serial interface.
1. The project must define a packet frame structure containing:
   - Start Byte (`0xAA`) - 1 byte.
   - Command Type - 1 byte.
   - Data Length - 1 byte.
   - Data Payload - up to 8 bytes.
   - CRC-8 Checksum - 1 byte.
2. The packet structure must be explicitly **packed** to prevent any compiler padding bytes from corrupting the layout.
3. Write serialization APIs: `size_t serialize_packet(const packet_t *pkt, uint8_t *buffer)` and `bool deserialize_packet(const uint8_t *buffer, size_t len, packet_t *pkt)`.
4. The serialization must enforce Big-Endian byte ordering for any multi-byte fields (such as multi-byte payloads).
5. Implement a simple CRC-8 checksum calculation routine and verify packet integrity upon deserialization.
6. Fail deserialization if the start byte is incorrect, the payload length is out of range, or the checksum fails.

### Structural Requirements & Code Skeleton
**`packetizer.h`**:
```c
#ifndef PACKETIZER_H
#define PACKETIZER_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define START_BYTE 0xAA
#define MAX_PAYLOAD_SIZE 8

typedef enum {
    CMD_PING = 0x01,
    CMD_SET_SPEED = 0x02,
    CMD_GET_TEMP = 0x03
} cmd_type_t;

// Packed structure definition
typedef struct __attribute__((packed)) {
    uint8_t start_byte;
    uint8_t cmd_type;
    uint8_t length;
    uint8_t payload[MAX_PAYLOAD_SIZE];
    uint8_t checksum;
} packet_t;

size_t serialize_packet(const packet_t *pkt, uint8_t *buffer);
bool deserialize_packet(const uint8_t *buffer, size_t len, packet_t *pkt);
uint8_t calculate_crc8(const uint8_t *data, size_t len);

#endif // PACKETIZER_H
```

---

## 📦 Deliverables
* [ ] Serializer source files `packetizer.c` and `packetizer.h`.
* [ ] Application test script `main.c` showing multiple serialization transactions, intentional payload corruptions (corrupted checksum), and verifying correct handling.
* [ ] Makefile compiling with strict warnings and optimizations.

---

## ❓ Self-Check Questions
1. Why does the compiler add padding bytes to structures? What is the hardware penalty of unaligned memory access on modern processors?
2. What is the fundamental difference between `#define` macros and `typedef` in C? Why is `typedef` safer for declaring pointer types?
3. How does `#pragma pack(1)` differ from `__attribute__((packed))`? Which is safer for cross-compiler compatibility?
4. Write a preprocessor macro `GET_ARRAY_SIZE(arr)` that automatically calculates the number of elements in an array at compile time.
5. Why are float values particularly risky to serialize directly via `memcpy` between an ARM microcontroller and an Intel x86 server host?

---

## 🚀 Stretch Task (Optional)
Extend the packetizer to support variable-sized payloads using a custom preprocessor metaprogramming tool that automatically generates custom serialization code blocks based on command schemas.

## 💡 Motivation Checkpoint
When serializing configurations, sensor frames, or actuator commands across networks (like CAN bus in cars, Modbus in factories, or UART serial connections in consumer electronics), data alignment must be exact down to the individual bit. If one node pads data by a single byte, the receiver parses corrupted values. Mastering serialization and packing is a key milestone for interface development.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - `sizeof(packet_t)` matches expected size exactly (checked via a custom preprocessor assert).
  - Attempting to deserialize a packet with a mutated data checksum fails and returns `false`.
  - Binary outputs show correct Big-Endian conversion for multi-byte payloads.
* **Fail Criteria**:
  - Direct array element assignment without checking length limits.
  - Zero static assertion checks for packed sizes.
