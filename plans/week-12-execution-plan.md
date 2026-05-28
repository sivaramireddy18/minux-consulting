# Weekly Execution Plan: Week 12

## 🎯 Weekly Goal
Master synchronous serial protocols, understand the electrical properties of Inter-Integrated Circuit (I2C) and Serial Peripheral Interface (SPI) buses, calculate clock timing registers, and write custom bare-metal master controllers drivers.

## 🏆 Weekly Outcome
By Friday, the student will have written custom **Bare-Metal I2C and SPI Master Drivers** in C on the STM32F4. They will be able to interface physical sensors, execute structural register read/writes, hook up a USB Logic Analyzer to decode active clock/data lines, and complete the Phase 2 Milestone Challenge.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The I2C Specification & Physical Bus Layer
* **Conceptual Objective**: Master the electrical properties of I2C. Understand:
  - **Open-Drain Connections**: Why I2C uses open-drain pins with external pull-up resistors to construct an active-low bus.
  - **Start/Stop Conditions**: Start (SDA falling edge while SCL is High), Stop (SDA rising edge while SCL is High).
  - **Address Resolution**: 7-bit device addressing with Read/Write bit.
  - **Acknowledge (ACK/NACK)**: Receiver pulls SDA low to ACK.
* **Practical Activity**:
  1. Sketch a physical multi-device I2C bus detailing physical pull-up lines.
  2. Draw the timing sequence of a write transaction.
* **Code/Circuit Reference**:
```text
I2C Multi-Master / Multi-Slave Physical Bus Setup:
                   +5V or +3.3V
                     |   |
                    [R] [R]  Pull-up Resistors
                     |   |
    SDA (Data) ------+---+-----+-----+--------
                     |   |     |     |
    SCL (Clock) -----+---+-----+-----+--------
                     |   |     |     |
                   +-------+ +-------+
                   | Master| | Slave |
                   +-------+ +-------+
```

### Tuesday: I2C Register Map & Speed Configurations
* **Conceptual Objective**: Study I2C controller registers (CR1, CR2, OAR1, DR, SR1, SR2, CCR, TRISE). Master the calculations required to configure Fast Mode (400kHz) and Standard Mode (100kHz) clock cycles using the Clock Control Register (CCR) and Rise Time Register (TRISE).
* **Practical Activity**:
  1. Open the Reference Manual and locate I2C clock configuration sections.
  2. Calculate CCR and TRISE parameters for Standard Mode (100kHz) under an APB1 peripheral bus speed of 16MHz.
* **Code/Circuit Reference**:
```text
I2C Clock Control Register (CCR) Math (Standard Mode):
Target SCL Frequency = 100,000Hz (100kHz) -> Period = 10µs
SCL High time = 5µs, SCL Low time = 5µs
Bus Clock = 16,000,000Hz (Period = 0.0625µs = 62.5ns)
CCR Value = SCL High / Bus Period = 5µs / 62.5ns = 5,000ns / 62.5ns = 80
Result CCR Register Value = 80 = 0x50
```

### Wednesday: Bare-Metal I2C Driver implementation
* **Conceptual Objective**: Learn the exact sequence of register writes to execute I2C commands: Generate START -> Write Address -> Verify ADDR flag -> Write Data -> Wait for Byte Transfer Finished (BTF) -> Generate STOP.
* **Practical Activity**:
  1. Initialize I2C1 (SCL on PB6, SDA on PB7 configured as Alternate Function open-drain).
  2. Write robust Master Transmitter and Master Receiver APIs with timeout decrementor loops to prevent lock-ups.
* **Code/Circuit Reference**:
```c
#define I2C1_BASE          0x40005400U
#define I2C1_CR1           ((volatile uint32_t*)(I2C1_BASE + 0x00U))
#define I2C1_SR1           ((volatile uint32_t*)(I2C1_BASE + 0x14U))
#define I2C1_DR            ((volatile uint32_t*)(I2C1_BASE + 0x10U))

void i2c_start(void) {
    *I2C1_CR1 |= (1U << 8); // Generate START
    // Wait until START condition generated (SB bit 0 in SR1)
    while (!(*I2C1_SR1 & (1U << 0)));
}

void i2c_write(uint8_t data) {
    *I2C1_DR = data;
    // Wait until byte transmission complete (TXE bit 7 in SR1)
    while (!(*I2C1_SR1 & (1U << 7)));
}
```

### Thursday: The SPI Specification & Register Architecture
* **Conceptual Objective**: Master the Serial Peripheral Interface (SPI) physical layer: full-duplex synchronous communication using four dedicated lines:
  - **MOSI**: Master Out Slave In.
  - **MISO**: Master In Slave Out.
  - **SCK**: Serial Clock.
  - **CS/NSS**: Chip Select / Slave Select (active low).
  Study clock polarity (CPOL) and phase (CPHA) modes.
* **Practical Activity**:
  1. Draw timing charts for SPI Mode 0 (CPOL=0, CPHA=0) and Mode 3 (CPOL=1, CPHA=1).
  2. Map out the SPI status and control registers.
* **Code/Circuit Reference**:
```c
#define SPI1_BASE          0x40013000U
#define SPI1_CR1           ((volatile uint32_t*)(SPI1_BASE + 0x00U))
#define SPI1_SR            ((volatile uint32_t*)(SPI1_BASE + 0x08U))
#define SPI1_DR            ((volatile uint32_t*)(SPI1_BASE + 0x0CU))

void spi1_init_master(void) {
    // Clock prescaler = 2, Mode 0 (CPOL=0, CPHA=0), Master Configuration
    *SPI1_CR1 = (1U << 2) | (0 << 1) | (0 << 0);
    // Enable SPI
    *SPI1_CR1 |= (1U << 6);
}
```

### Friday: Logical Decoding and Phase 2 Milestone Launch
* **Conceptual Objective**: Understand how to connect a USB Logic Analyzer to active SPI/I2C buses to debug electrical transactions. Start the Phase 2 Milestone Challenge.
* **Practical Activity**:
  1. Hook up logic analyzer lines to PB6/PB7. Execute an I2C transaction.
  2. Use Sigrok/PulseView to capture, trigger, and decode raw Hex codes on the bus.
* **Code/Circuit Reference**:
```bash
# Capture and decode standard I2C frames using Sigrok CLI
sigrok-cli --driver=fx2lafw --config samplerate=1m --channels D0=SCL,D1=SDA --limit-samples 100000 -P i2c
```

---

## 🛠️ Hands-On Assignment: Bare-Metal MPU6050 Accelerometer Interfacing

### Functional Requirements
Create a fully functional, bare-metal application that reads raw data from a physical **MPU6050 6-Axis Accelerometer sensor** via direct register I2C control.
1. Configure PB6 and PB7 as Alternate Function open-drain output pins.
2. Initialize **I2C1** in Standard Master Mode at 100kHz under 16MHz clock conditions. Complete all CCR and TRISE calculations.
3. Write robust register read/write helper functions:
   - `bool i2c_write_register(uint8_t dev_addr, uint8_t reg_addr, uint8_t data)`
   - `bool i2c_read_registers(uint8_t dev_addr, uint8_t reg_addr, uint8_t *buffer, size_t size)`
4. Every polling check on Status Registers (SR1/SR2) must contain a timeout decrementor loop. If a timeout occurs, return an error code instead of locking up the CPU.
5. In `main.c`:
   - Initialize the I2C peripheral.
   - Read the MPU6050 "Who Am I" register (`0x75`). Verify the returned signature matches `0x68`.
   - Write to the power management register (`0x6B`) to wake the sensor from default sleep mode.
   - Read raw Accelerometer X/Y/Z data registers sequentially in a loop, converting bytes to integers and streaming them to the UART console.

### Structural Requirements & Code Skeleton
**`i2c.h`**:
```ifndef I2C_H
#define I2C_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

void i2c1_init(void);
bool i2c_write_register(uint8_t dev_addr, uint8_t reg_addr, uint8_t data);
bool i2c_read_registers(uint8_t dev_addr, uint8_t reg_addr, uint8_t *buffer, size_t size);

#endif // I2C_H
```

**`i2c.c` (C-Skeleton)**:
```c
#include "i2c.h"

#define I2C1_BASE    0x40005400U
typedef struct {
    volatile uint32_t CR1;
    volatile uint32_t CR2;
    volatile uint32_t OAR1;
    volatile uint32_t OAR2;
    volatile uint32_t DR;
    volatile uint32_t SR1;
    volatile uint32_t SR2;
    volatile uint32_t CCR;
    volatile uint32_t TRISE;
} i2c_registers_t;

#define I2C1   ((i2c_registers_t*)I2C1_BASE)

void i2c1_init(void) {
    // Enable GPIO and I2C Clocks
    *((volatile uint32_t*)0x40023830U) |= (1U << 1);  // GPIOB
    *((volatile uint32_t*)0x40023840U) |= (1U << 21); // I2C1

    // Configure Pins PB6 (SCL) and PB7 (SDA) Alt Function open-drain pull-ups
    // [GPIO Configuration goes here]

    // Initialize I2C: set input clock speed (16MHz)
    I2C1->CR2 = 16U; 

    // Set standard mode clock control (100kHz) -> CCR = 80
    I2C1->CCR = 80U;

    // Set maximum rise time (TRISE = Input Clock / 1MHz + 1 = 16 + 1 = 17)
    I2C1->TRISE = 17U;

    // Enable Peripheral
    I2C1->CR1 |= (1U << 0);
}

// Write helper with security check
bool i2c_write_register(uint8_t dev_addr, uint8_t reg_addr, uint8_t data) {
    uint32_t timeout = 500000;

    // Generate Start
    I2C1->CR1 |= (1U << 8);
    while (!(I2C1->SR1 & (1U << 0))) { if (--timeout == 0) return false; } // SB

    // Write Address (LSB = 0 for write)
    I2C1->DR = (dev_addr << 1);
    while (!(I2C1->SR1 & (1U << 1))) { if (--timeout == 0) return false; } // ADDR
    (void)I2C1->SR2; // Clear ADDR flag by reading SR2

    // Write Register Address
    I2C1->DR = reg_addr;
    while (!(I2C1->SR1 & (1U << 7))) { if (--timeout == 0) return false; } // TXE

    // Write Data
    I2C1->DR = data;
    while (!(I2C1->SR1 & (1U << 7))) { if (--timeout == 0) return false; } // TXE
    while (!(I2C1->SR1 & (1U << 2))) { if (--timeout == 0) return false; } // BTF

    // Generate Stop
    I2C1->CR1 |= (1U << 9);
    return true;
}
```

---

## 📦 Deliverables
* [ ] Master I2C driver files `i2c.c` and `i2c.h`.
* [ ] Application entry point `main.c` configuring MPU6050 and streaming accelerometer data to console.
* [ ] Capture trace analysis report `i2c_trace.log` or screenshot confirming successful MPU6050 Register Read transactions.

---

## ❓ Self-Check Questions
1. Why must the I2C physical bus pins be configured as **open-drain** instead of standard push-pull? What electrical issue occurs if two push-pull devices attempt to communicate simultaneously on a shared line?
2. What are the key differences between **Standard Mode (100kHz)** and **Fast Mode (400kHz)** I2C timing configurations inside the Clock Control Register (CCR)?
3. Why does the I2C master driver clear the ADDR flag inside the Status Register by reading `SR1` followed by reading `SR2`? What happens if this register access sequence is bypassed?
4. Explain how **Clock Stretching** enables a slow I2C slave node to hold the master from transmitting data too quickly. Which physical line is held low?
5. What are the advantages of SPI over I2C in high-speed applications (such as color LCD displays or SD card blocks)? What are the pinout complexity tradeoffs?

---

## 🚀 Stretch Task (Optional)
Extend the I2C master driver to support **Multi-Byte DMA Reads**. Configure the DMA peripheral (DMA1 Stream 0 Channel 1) to automatically read accelerometer raw buffers from the I2C Data Register and transfer them directly into memory, freeing up the processor during data transfers.

## 💡 Motivation Checkpoint
Synchronous serial protocols (I2C and SPI) are the bedrock of physical sensor integration. Whether you are collecting data from accelerometers, gyroscopes, magnetometers, barometer sensors, or reading high-capacity SD storage blocks, you must implement reliable clock/data bus controls. Direct register-level setups guarantee deep protocol comprehension.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - All configurations mapped strictly via raw register offsets.
  - Zero reference to ST HAL structures.
  - Timing captures on logic analyzer prove stable 100kHz SCL clock timings.
  - Data correctly decodes accelerometer movements.
* **Fail Criteria**:
  - Monolithic register configurations that lock up permanently if sensor is disconnected (absence of timeout decrementor loop).
