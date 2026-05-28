# Weekly Execution Plan: Week 05

## 🎯 Weekly Goal
Master bitwise operations, understand how to utilize bitfields and unions for memory-efficient data structures, and learn the exact register manipulation methods required to configure microcontroller peripheral registers.

## 🏆 Weekly Outcome
By Friday, the student will have built a complete, register-accurate **Software Emulation of a GPIO Controller Peripheral**. They will possess the capability to perform complex bit masking, toggle specific register pins, unpack binary streams using unions and bitfields, and read/write raw memory locations safely.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Bitwise Toolkit (AND, OR, XOR, NOT, Shifts)
* **Conceptual Objective**: Master low-level bit operations: setting bits (`|`), clearing bits (`& ~`), toggling bits (`^`), checking states (`&`), and logical shifts (`<<`, `>>`). Understand the difference between logical shifts (pads with 0) and arithmetic shifts (preserves the sign bit).
* **Practical Activity**:
  1. Complete a bit manipulation worksheet implementing quick operations.
  2. Implement a set of macro definitions to perform these actions cleanly on generic integers.
* **Code/Circuit Reference**:
```c
#define SET_BIT(reg, bit)     ((reg) |= (1U << (bit)))
#define CLEAR_BIT(reg, bit)   ((reg) &= ~(1U << (bit)))
#define TOGGLE_BIT(reg, bit)  ((reg) ^= (1U << (bit)))
#define CHECK_BIT(reg, bit)   (((reg) & (1U << (bit))) != 0)
```

### Tuesday: Bit Masking and Multi-Bit Fields Manipulation
* **Conceptual Objective**: Learn how to modify fields consisting of multiple bits without affecting surrounding registers (e.g., setting a 2-bit pin mode field at bits 10-11). Comprehend the clear-then-set design pattern.
* **Practical Activity**:
  1. Write a program to isolate and modify a 4-bit subfield located in the middle of a 32-bit variable.
  2. Print binary states dynamically to verify surrounding bits remain unchanged.
* **Code/Circuit Reference**:
```c
// Target: Set bits 4-5 of REG to 0b10 (value 2) without changing other bits
uint32_t reg = 0xABCD1234;
uint32_t mask = (3U << 4); // Mask covering bits 4 & 5

reg &= ~mask;              // Step 1: Clear the bits (REG = REG & ~(0x30))
reg |= (2U << 4);          // Step 2: Set the target value (REG = REG | 0x20)
```

### Wednesday: Struct Bitfields (Syntax & Memory Layouts)
* **Conceptual Objective**: Master C Struct Bitfields—a mechanism to declare structures with explicitly sized members (in bits). Understand the compilation rules, compiler padding, byte boundaries, and endianness issues.
* **Practical Activity**:
  1. Declare struct bitfields representing network frames or hardware control packets.
  2. Measure struct sizes using `sizeof()` and observe how compilers pack bits into bytes.
* **Code/Circuit Reference**:
```c
typedef struct {
    uint32_t pin_0 : 2;  // Mode: 2 bits
    uint32_t pin_1 : 2;  // Mode: 2 bits
    uint32_t pin_2 : 2;  // Mode: 2 bits
    uint32_t reserved : 26; // Reserved padding bits
} gpio_mode_register_t;
```

### Thursday: Unions and Bitfields (The Dual Representation Pattern)
* **Conceptual Objective**: Study Unions—structures where all members share the same memory location. Master the Dual Representation Pattern: combining struct bitfields with a raw `uint32_t` in a union to allow access to individual bit fields AND the entire register raw value.
* **Practical Activity**:
  1. Create a union mapping a register's bit fields to a raw data value.
  2. Modify individual bits in the struct, and print the raw hex representation of the union.
* **Code/Circuit Reference**:
```c
typedef union {
    struct {
        uint32_t speed  : 2; // Bits 0-1
        uint32_t parity : 1; // Bit 2
        uint32_t stop   : 1; // Bit 3
        uint32_t tx_en  : 1; // Bit 4
        uint32_t rx_en  : 1; // Bit 5
        uint32_t rsvd   : 26; // Padding
    } bits;
    uint32_t raw; // Direct register-wide access
} uart_control_reg_t;
```

### Friday: Accessing Memory-Mapped Hardware Registers
* **Conceptual Objective**: Learn how memory-mapped I/O (MMIO) functions. Understand that microcontrollers map peripheral control registers to specific hardware addresses. Learn how to cast raw address locations to pointers of volatile unions/structs.
* **Practical Activity**:
  1. Define fake register addresses matching dummy buffers.
  2. Construct a C module containing pointer macros to interact with those fake addresses.
* **Code/Circuit Reference**:
```c
// Simulating an address layout in memory
static uint32_t simulated_io_space[10];

#define SIM_GPIO_BASE_ADDR   ((uintptr_t)simulated_io_space)
#define SIM_GPIO_MODER      ((volatile uint32_t*)(SIM_GPIO_BASE_ADDR + 0x00))
#define SIM_GPIO_ODR        ((volatile uint32_t*)(SIM_GPIO_BASE_ADDR + 0x04))

void toggle_pin5(void) {
    *SIM_GPIO_ODR ^= (1U << 5); // Read-Modify-Write directly on the simulated port
}
```

---

## 🛠️ Hands-On Assignment: GPIO Register Controller Emulator

### Functional Requirements
Create a register-accurate Software Emulator of an ARM Cortex-M GPIO peripheral block.
1. Define a `gpio_port_t` structure that mirrors the physical register layout of STM32F4 GPIO ports (MODER, OTYPER, OSPEEDR, PUPDR, IDR, ODR, BSRR).
2. The registers must be defined using a clean combination of **unions and struct bitfields** to allow both raw register-wide access and bit-field member access.
3. MODER must allocate 2 bits per pin for 16 pins:
   - `00` = Input, `01` = General Purpose Output, `10` = Alternate Function, `11` = Analog.
4. Write modular, register-level API functions to:
   - `void gpio_set_mode(gpio_port_t *port, uint8_t pin, uint8_t mode)`
   - `void gpio_write_pin(gpio_port_t *port, uint8_t pin, bool state)`
   - `void gpio_toggle_pin(gpio_port_t *port, uint8_t pin)`
   - `bool gpio_read_pin(const gpio_port_t *port, uint8_t pin)`
5. Implement the Bit Set/Reset Register (BSRR) functionality. BSRR is a 32-bit write-only register: writing `1` to bits 0-15 sets the corresponding ODR bit; writing `1` to bits 16-31 resets the corresponding ODR bit. Writing `0` does nothing. Your emulation loop must monitor BSRR writes and update ODR accordingly.

### Structural Requirements & Code Skeleton
**`gpio_emulator.h`**:
```c
#ifndef GPIO_EMULATOR_H
#define GPIO_EMULATOR_H

#include <stdint.h>
#include <stdbool.h>

// Register structure representing GPIO port registers
typedef struct {
    union {
        struct {
            uint32_t pin0 : 2;
            uint32_t pin1 : 2;
            uint32_t pin2 : 2;
            uint32_t pin3 : 2;
            uint32_t pin4 : 2;
            uint32_t pin5 : 2;
            uint32_t pin6 : 2;
            uint32_t pin7 : 2;
            uint32_t pin8 : 2;
            uint32_t pin9 : 2;
            uint32_t pin10 : 2;
            uint32_t pin11 : 2;
            uint32_t pin12 : 2;
            uint32_t pin13 : 2;
            uint32_t pin14 : 2;
            uint32_t pin15 : 2;
        } pin;
        uint32_t raw;
    } MODER;

    uint32_t OTYPER;
    uint32_t OSPEEDR;
    uint32_t PUPDR;
    uint32_t IDR;
    uint32_t ODR;
    uint32_t BSRR;
} gpio_port_t;

// APIs
void gpio_init(gpio_port_t *port);
void gpio_update_bsrr_logic(gpio_port_t *port); // Processes BSRR writes to update ODR
void gpio_set_mode(gpio_port_t *port, uint8_t pin, uint8_t mode);
void gpio_write_pin(gpio_port_t *port, uint8_t pin, bool state);
void gpio_toggle_pin(gpio_port_t *port, uint8_t pin);
bool gpio_read_pin(const gpio_port_t *port, uint8_t pin);

#endif // GPIO_EMULATOR_H
```

---

## 📦 Deliverables
* [ ] Hardware emulation source files `gpio_emulator.c` and `gpio_emulator.h`.
* [ ] Application test suite `main.c` validating register states, BSRR writes, MODER masks, and toggles.
* [ ] Makefile producing a warning-free compilation binary.

---

## ❓ Self-Check Questions
1. Why is a simple assignment like `REG = (1 << 5);` highly dangerous inside dynamic register setups? What is the correct way to modify single bits without disturbing others?
2. Explain how the BSRR register achieves atomic bit setting and resetting in microcontrollers without requiring Read-Modify-Write instructions. Why is this critical to prevent race conditions?
3. How does compiler optimization affect struct bitfields? Can you rely on the physical layout order of bitfields when porting code across different compilers or architectures?
4. What is the difference between Big-Endian and Little-Endian byte ordering? Show how the 32-bit hex value `0x12345678` is laid out in memory under both environments.
5. Why must variables representing hardware registers always be declared with the `volatile` keyword?

---

## 🚀 Stretch Task (Optional)
Extend the emulation to model physical input pins. Create a separate background execution thread that dynamically updates the Input Data Register (IDR) to simulate a physical button press bouncing (simulate states bouncing between 1 and 0 every few milliseconds before settling).

## 💡 Motivation Checkpoint
At the physical silicon layer, microcontrollers have no concepts of "interfaces", "screens", or "sensors". The processor core sees the universe purely as arrays of memory addresses. Peripheral drivers are written entirely by applying bit masks to target registers. Mastering register manipulations is the foundational key to unlocking microcontroller peripheral control.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - GPIO emulator accurately maps bitfields (setting `port->MODER.pin.pin5 = 1` changes raw value to correct index bitmask).
  - Writing to BSRR correctly modifies ODR register bits (checked inside the BSRR logic monitor function).
  - Code compiles without warnings with `-Wall -Wextra -Werror`.
* **Fail Criteria**:
  - Using standard logic operators where bitwise is required.
  - ODR or MODER configuration corrupted on adjacent pins during single pin writes.
