# Weekly Execution Plan: Week 08

## 🎯 Weekly Goal
Master low-level General Purpose Input/Output (GPIO) peripheral configuration, understand peripheral clock gating (RCC), configure pin electrical parameters, and write custom bare-metal drivers using direct register writes without HAL.

## 🏆 Weekly Outcome
By Friday, the student will have written a custom **Bare-Metal GPIO Driver** in C that configures pins as inputs (with internal pull-up/down resistors) and outputs (push-pull vs open-drain), controls the peripheral clocks via RCC, toggles physical LEDs, and reads physical pushbuttons.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Clock Gating & The Reset and Clock Control (RCC)
* **Conceptual Objective**: Understand that microcontrollers disable all peripheral clocks at reset to conserve energy. Study the Reset and Clock Control (RCC) peripheral and learn how to enable peripheral clock gates (e.g., AHB1/AHB2 buses) before attempting to read/write peripheral registers.
* **Practical Activity**:
  1. Open the STM32F407 Reference Manual and locate the RCC peripheral register map.
  2. Find the exact bit in `RCC_AHB1ENR` required to enable the clock for GPIO Port A and Port D.
* **Code/Circuit Reference**:
```c
#define RCC_BASE_ADDR      0x40023800U
#define RCC_AHB1ENR        ((volatile uint32_t*)(RCC_BASE_ADDR + 0x30U))

void gpio_enable_clock(void) {
    // Enable GPIOA (bit 0) and GPIOD (bit 3) clock gates
    *RCC_AHB1ENR |= (1U << 0) | (1U << 3);
}
```

### Tuesday: GPIO Mode & Electrical Configuration Registers
* **Conceptual Objective**: Master the core configurations of a physical pin:
  - **MODER**: Mode (Input, Output, Alternate Function, Analog).
  - **OTYPER**: Output Type (Push-Pull: drives both high and low; Open-Drain: only drives low, requires pull-up resistor to pull high).
  - **OSPEEDR**: Slew Rate / Speed (Low, Medium, Fast, High speed).
  - **PUPDR**: Pull-Up/Pull-Down (No pull, Pull-up, Pull-down resistors).
* **Practical Activity**:
  1. Study register maps for GPIOx_MODER, GPIOx_OTYPER, GPIOx_OSPEEDR, and GPIOx_PUPDR.
  2. Write C mask algorithms to set Pin 5 of Port A to Output Push-Pull, High Speed.
* **Code/Circuit Reference**:
```c
#define GPIOA_BASE_ADDR    0x40020000U
#define GPIOA_MODER        ((volatile uint32_t*)(GPIOA_BASE_ADDR + 0x00U))
#define GPIOA_OTYPER       ((volatile uint32_t*)(GPIOA_BASE_ADDR + 0x04U))

void configure_pa5_output(void) {
    // PA5 -> Mode output is '01' at bits 10-11
    *GPIOA_MODER &= ~(3U << (5 * 2)); // Clear bits 10-11
    *GPIOA_MODER |= (1U << (5 * 2));  // Set bits 10-11 to 01

    // PA5 -> Output Type Push-Pull (bit 5 clear)
    *GPIOA_OTYPER &= ~(1U << 5);
}
```

### Wednesday: GPIO Data Registers (IDR vs ODR)
* **Conceptual Objective**: Understand how to write to pins and read state:
  - **Output Data Register (ODR)**: Drives output high (`1`) or low (`0`).
  - **Input Data Register (IDR)**: Read-only register reflecting the physical logic levels on input pins.
* **Practical Activity**:
  1. Connect a logic analyzer to physical GPIO output pins.
  2. Write a program that toggles the ODR register and read back the logic levels inside IDR to confirm alignment.
* **Code/Circuit Reference**:
```c
#define GPIOA_IDR          ((volatile uint32_t*)(GPIOA_BASE_ADDR + 0x10U))
#define GPIOA_ODR          ((volatile uint32_t*)(GPIOA_BASE_ADDR + 0x14U))

void toggle_output_pin(void) {
    *GPIOA_ODR ^= (1U << 5); // Toggle output state
}

bool read_input_pin(void) {
    return (*GPIOA_IDR & (1U << 0)) != 0; // Check state of PA0
}
```

### Thursday: Alternate Function Multiplexing
* **Conceptual Objective**: Understand that MCU pins are shared between multiple peripherals (e.g., UART, SPI, I2C). Study the Alternate Function registers (AFRL/AFRH) which acts as internal multiplexers routing physical pins to target digital hardware controllers.
* **Practical Activity**:
  1. Locate STM32 Alternate Function Mapping tables in datasheet.
  2. Route PA2 and PA3 to UART2 TX/RX lines by writing Alternate Function Select values to AFR registers.
* **Code/Circuit Reference**:
```c
#define GPIOA_AFRL         ((volatile uint32_t*)(GPIOA_BASE_ADDR + 0x20U))

void route_pins_to_uart2(void) {
    // Enable alternate function mode on PA2 and PA3
    *GPIOA_MODER &= ~((3U << (2 * 2)) | (3U << (3 * 2)));
    *GPIOA_MODER |=  ((2U << (2 * 2)) | (2U << (3 * 2))); // Set mode '10' (Alt Function)

    // Set AF7 (UART2) on Pin 2 (AFRL[11:8]) and Pin 3 (AFRL[15:12])
    *GPIOA_AFRL &= ~((0xFU << (2 * 4)) | (0xFU << (3 * 4)));
    *GPIOA_AFRL |=  ((7U << (2 * 4)) | (7U << (3 * 4)));
}
```

### Friday: Driving GPIO atomic writes via BSRR
* **Conceptual Objective**: Master the Bit Set/Reset Register (BSRR) mechanics. Understand why BSRR enables atomic bit writes without Read-Modify-Write instructions, making it safe from preemption race conditions inside ISRs.
* **Practical Activity**:
  1. Write a speed test loop comparing execution cycles of direct ODR toggles versus BSRR writes.
  2. Document timing differences.
* **Code/Circuit Reference**:
```c
#define GPIOA_BSRR         ((volatile uint32_t*)(GPIOA_BASE_ADDR + 0x18U))

void set_pin_atomic(void) {
    *GPIOA_BSRR = (1U << 5); // Set PA5 High
}

void reset_pin_atomic(void) {
    *GPIOA_BSRR = (1U << (5 + 16)); // Reset PA5 Low (write to high half register)
}
```

---

## 🛠️ Hands-On Assignment: Custom Register-Level GPIO Driver Library

### Functional Requirements
Create a professional-grade, register-level GPIO driver library (`gpio.c`, `gpio.h`) that provides safe register manipulation and electrical protection configurations.
1. The driver must define an enumeration representing Pin Numbers (`PIN0` to `PIN15`), Modes (`INPUT`, `OUTPUT`, `ALT_FUNC`, `ANALOG`), Output Types (`PUSH_PULL`, `OPEN_DRAIN`), and Pull Resistors (`NO_PULL`, `PULL_UP`, `PULL_DOWN`).
2. Implement functional configurations APIs that cleanly calculate register bit offsets using shift operators.
3. Your input pins initialization configuration must explicitly clear other pins register space to prevent corruption.
4. Implement a custom debounce algorithm in software to read an input button. When the button is pressed, toggle an LED output.
5. Create a compilation test package targeting the STM32F4 Discovery board (Pin PA0 is the User Button, Pin PD12 is the Green LED). Hook up your logic analyzer tx line to the LED pin to measure debounce time.

### Structural Requirements & Code Skeleton
**`gpio.h`**:
```c
#ifndef GPIO_H
#define GPIO_H

#include <stdint.h>
#include <stdbool.h>

// Register structure representing GPIO controller block
typedef struct {
    volatile uint32_t MODER;   // Offset 0x00
    volatile uint32_t OTYPER;  // Offset 0x04
    volatile uint32_t OSPEEDR; // Offset 0x08
    volatile uint32_t PUPDR;   // Offset 0x0C
    volatile uint32_t IDR;     // Offset 0x10
    volatile uint32_t ODR;     // Offset 0x14
    volatile uint32_t BSRR;    // Offset 0x18
} gpio_registers_t;

// Port addresses mapped directly to memory
#define GPIOA_PORT   ((gpio_registers_t*)0x40020000U)
#define GPIOD_PORT   ((gpio_registers_t*)0x40020C00U)

typedef enum {
    MODE_IN = 0,
    MODE_OUT = 1,
    MODE_ALT = 2,
    MODE_ANALOG = 3
} gpio_mode_t;

typedef enum {
    PULL_NONE = 0,
    PULL_UP = 1,
    PULL_DOWN = 2
} gpio_pull_t;

void gpio_init_pin(gpio_registers_t *port, uint8_t pin, gpio_mode_t mode, gpio_pull_t pull);
void gpio_write(gpio_registers_t *port, uint8_t pin, bool state);
void gpio_toggle(gpio_registers_t *port, uint8_t pin);
bool gpio_read(const gpio_registers_t *port, uint8_t pin);

#endif // GPIO_H
```

**`gpio.c` (C-Skeleton)**:
```c
#include "gpio.h"

#define RCC_AHB1ENR  ((volatile uint32_t*)0x40023830U)

void gpio_init_pin(gpio_registers_t *port, uint8_t pin, gpio_mode_t mode, gpio_pull_t pull) {
    // 1. Enable Clocks depending on port address
    if (port == GPIOA_PORT) {
        *RCC_AHB1ENR |= (1U << 0);
    } else if (port == GPIOD_PORT) {
        *RCC_AHB1ENR |= (1U << 3);
    }

    // 2. Configure Mode
    port->MODER &= ~(3U << (pin * 2));
    port->MODER |= ((uint32_t)mode << (pin * 2));

    // 3. Configure Pull-up/pull-down
    port->PUPDR &= ~(3U << (pin * 2));
    port->PUPDR |= ((uint32_t)pull << (pin * 2));
}

void gpio_write(gpio_registers_t *port, uint8_t pin, bool state) {
    if (state) {
        port->BSRR = (1U << pin); // Set atomic
    } else {
        port->BSRR = (1U << (pin + 16)); // Reset atomic
    }
}

void gpio_toggle(gpio_registers_t *port, uint8_t pin) {
    port->ODR ^= (1U << pin);
}

bool gpio_read(const gpio_registers_t *port, uint8_t pin) {
    return (port->IDR & (1U << pin)) != 0;
}
```

---

## 📦 Deliverables
* [ ] Driver library files `gpio.h` and `gpio.c`.
* [ ] Application entry point `main.c` polling button PA0 and toggling LED PD12 using custom software debounce metrics.
* [ ] Makefile building output binaries.

---

## ❓ Self-Check Questions
1. Why must peripheral clocks be enabled before writing config parameters to peripheral registers? What is the physical core response if clock gating is bypassed?
2. What are the electrical differences between **Push-Pull** and **Open-Drain** output types? Give a standard real-world communication peripheral example that requires open-drain pins.
3. How do **Pull-up** and **Pull-down** resistors secure input pin voltages? What is a floating electrical state, and what is its effect on microcontroller power consumption?
4. Explain how a software button-debounce loop works. What is the physical duration range of mechanical button bouncing?
5. Why are writes to BSRR faster and safer than read-modify-write structures like `ODR |= MASK` inside real-time operating systems?

---

## 🚀 Stretch Task (Optional)
Extend the GPIO driver library to support configuring and enabling Alternate Functions via APIs like `gpio_init_alt_func(gpio_registers_t *port, uint8_t pin, uint8_t af_number)`. Integrate strict bounds-checking to automatically isolate between AFRL (pins 0-7) and AFRH (pins 8-15) boundaries.

## 💡 Motivation Checkpoint
GPIO config is the absolute entry point to any hardware physical design. Whether you are lighting an indicator LED, reading a proximity sensor, triggering an external reset line, or routing physical signals to high-speed UART buses, you must manually align electrical configurations. Direct register writes ensure your configurations are precise and footprint-minimal.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - GPIO registers mapped using exact offsets via structure pointer mappings.
  - Driver does not reference ST HAL structures.
  - Clock gating is handled dynamically.
  - Debounce logic is fully functional on target button.
* **Fail Criteria**:
  - Hard-coded magic parameters inside registers write loop.
  - Bouncing outputs captured on logic analyzer Tx testing.
