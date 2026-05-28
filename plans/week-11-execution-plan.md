# Weekly Execution Plan: Week 11

## 🎯 Weekly Goal
Master physical-layer UART (Universal Asynchronous Receiver-Transmitter) communications, calculate precise Baud Rate divisor values directly from clock bus frequencies, write register-level transmit/receive drivers, and implement a high-reliability, interrupt-driven UART ring buffer.

## 🏆 Weekly Outcome
By Friday, the student will have written a complete, bare-metal **UART Serial Driver** on the STM32F4. They will be able to transmit and receive data cleanly, handle character reception dynamically using NVIC interrupts, and structure a thread-safe software Ring Buffer to prevent data losses at high transmission speeds (up to 115200 baud).

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The UART Physical Specification & Frame Layout
* **Conceptual Objective**: Master the timing of asynchronous communications. Understand the composition of a standard UART packet frame: Start Bit (low transition), Data Bits (typically 8 bits, sent LSB first), Parity Bit (optional error checking), and Stop Bits (high transition).
* **Practical Activity**:
  1. Sketch a physical timing diagram for the transmission of the ASCII character `'A'` (`0x41 = 0b01000001`) with configuration 8N1 (8 data bits, no parity, 1 stop bit).
  2. Map out how high and low states represent physical logic levels.
* **Code/Circuit Reference**:
```text
UART 8N1 Timing Diagram (ASCII 'A' = 0x41):
Physical line Idle: HIGH (1)
               +---+   +---+                       +---+   +---+
Idle (1) ------+   |   |   |                       |   |   |   +------ Stop (1)
               |   +---+   +-----------------------+   +---+
               | S | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
               | T |   |   |   |   |   |   |   |   |
               +---+   +---+                       +---+   +---+
              Start   D0  D1  D2  D3  D4  D5  D6  D7 (LSB First)
```

### Tuesday: UART Register Architecture & Baud Rate DIV Calculations
* **Conceptual Objective**: Study UART controller registers (SR, DR, BRR, CR1, CR2, CR3). Master the mathematics required to convert peripheral bus clocks (APB1/APB2) into target baud rates using the fractional divider inside the Baud Rate Register (BRR).
* **Practical Activity**:
  1. Write down the clock division equation: $\text{USARTDIV} = \text{Clock} / (16 \times \text{Baud})$.
  2. Compute the exact values to load into the 16-bit register USARTx_BRR to generate 115200 baud under a peripheral clock of 16MHz.
* **Code/Circuit Reference**:
```text
Baud Rate Divider Math:
Target Baud = 115200, Clock = 16,000,000Hz
USARTDIV = 16,000,000 / (16 * 115200) = 16,000,000 / 1843200 = 8.6805

Mantissa (Integer part) = 8 = 0x08
Fraction part = 0.6805 * 16 = 10.888 -> Round to nearest int = 11 = 0x0B
Result BRR Value = (Mantissa << 4) | Fraction = (0x08 << 4) | 0x0B = 0x008B
```

### Wednesday: Bare-Metal Polling UART Driver
* **Conceptual Objective**: Learn how to configure clocks, GPIO alternate function pins, and enable UART transmitter and receiver paths in software. Write simple polling transmission and reception routines using status register flags (TXE: Transmit Data Register Empty, RXNE: Read Data Register Not Empty).
* **Practical Activity**:
  1. Implement register configurations for UART2 (TX on pin PA2, RX on pin PA3).
  2. Write functional polling interfaces `uart_write_char` and `uart_read_char`.
* **Code/Circuit Reference**:
```c
#define USART2_BASE        0x40004400U
#define USART2_SR          ((volatile uint32_t*)(USART2_BASE + 0x00U))
#define USART2_DR          ((volatile uint32_t*)(USART2_BASE + 0x04U))
#define USART2_BRR         ((volatile uint32_t*)(USART2_BASE + 0x08U))
#define USART2_CR1         ((volatile uint32_t*)(USART2_BASE + 0x0CU))

void uart2_init_polling(void) {
    // Enable GPIOA clock and UART2 clock
    *((volatile uint32_t*)0x40023830U) |= (1U << 0);  // GPIOAEN
    *((volatile uint32_t*)0x40023840U) |= (1U << 17); // USART2EN

    // Route PA2/PA3 to Alt Function 7 (UART) ... (done via GPIO registers)

    // Set Baud Rate to 115200 (using calculated DIV = 0x008B)
    *USART2_BRR = 0x008BU;

    // Enable UART (bit 13), Enable Transmitter (bit 3), Enable Receiver (bit 2)
    *USART2_CR1 |= (1U << 13) | (1U << 3) | (1U << 2);
}

void uart_write_char(char c) {
    // Wait until transmit register is empty (TXE bit 7 in SR)
    while (!(*USART2_SR & (1U << 7)));
    *USART2_DR = (uint32_t)c;
}
```

### Thursday: Designing a Circular Ring Buffer Architecture
* **Conceptual Objective**: Understand that polling for data is highly vulnerable to data loss: if the CPU is busy processing other tasks when a character arrives, the UART controller's single character buffer is overwritten, causing an Overrun Error (ORE). Study the architecture of a thread-safe software **Ring Buffer** (FIFO queue) to queue data dynamically.
* **Practical Activity**:
  1. Define a Ring Buffer structure containing a storage array, head pointer, tail pointer, and write/read tracker metrics.
  2. Implement functional, non-blocking queue operations.
* **Code/Circuit Reference**:
```c
#define RING_BUF_SIZE 128

typedef struct {
    uint8_t buffer[RING_BUF_SIZE];
    volatile uint32_t head;
    volatile uint32_t tail;
} ring_buffer_t;

bool ring_buffer_push(ring_buffer_t *rb, uint8_t val) {
    uint32_t next = (rb->head + 1) % RING_BUF_SIZE;
    if (next == rb->tail) {
        return false; // Buffer full! Data overflowed.
    }
    rb->buffer[rb->head] = val;
    rb->head = next;
    return true;
}
```

### Friday: Interrupt-Driven UART RX Ring Buffer
* **Conceptual Objective**: Learn how to configure UART to generate a hardware interrupt automatically when a character is received (RXNEIE: RXNE Interrupt Enable). Route the interrupt to the NVIC and implement the ISR to read data instantly and queue it inside your ring buffer.
* **Practical Activity**:
  1. Connect a USB-to-UART converter between your microcontroller and your PC host.
  2. Execute a serial terminal program (e.g., Minicom). Transmit blocks of characters at high speed and verify that zero letters are dropped by the microcontroller using your ring buffer.
* **Code/Circuit Reference**:
```c
// Inside USART2 Init:
*USART2_CR1 |= (1U << 5); // Enable RXNE Interrupt

// USART2 IRQ Handler in startup.c
void USART2_IRQHandler(void) {
    if (*USART2_SR & (1U << 5)) { // Check RXNE flag
        uint8_t received_data = (uint8_t)(*USART2_DR & 0xFF);
        ring_buffer_push(&g_rx_buffer, received_data); // Push dynamically
    }
}
```

---

## 🛠️ Hands-On Assignment: Reliable Interrupt-Driven UART Driver Suite

### Functional Requirements
Create a professional-grade, bare-metal UART driver suite containing high-reliability interrupt-driven character queuing.
1. The driver must support two files: `uart.c` and `uart.h`.
2. Configure **USART2** to run at **115200 Baud, 8N1** (8 data bits, no parity, 1 stop bit) under 16MHz clock conditions.
3. Configure and initialize an RX ring buffer structure dynamically.
4. Enable the **RXNE Interrupt** on USART2 and map `USART2_IRQHandler` at position 38 in the Vector Table.
5. Provide a non-blocking API: `bool uart_read_byte(uint8_t *data)` that extracts data from the Ring Buffer. If the buffer is empty, it returns `false`.
6. Write a robust string transmitter API: `void uart_write_string(const char *str)`.
7. In `main.c`, build a command-line echo system: whenever a character is received via interrupt and pushed to the ring buffer, the main loop must extract it safely, convert it to uppercase, and transmit it back to the host terminal.

### Structural Requirements & Code Skeleton
**`uart.h`**:
```ifndef UART_H
#define UART_H

#include <stdint.h>
#include <stdbool.h>

void uart2_init(void);
void uart_write_byte(uint8_t byte);
void uart_write_string(const char *str);
bool uart_read_byte(uint8_t *data);

#endif // UART_H
```

**`uart.c` (C-Skeleton)**:
```c
#include "uart.h"

#define USART2_BASE   0x40004400U
#define USART2_SR     ((volatile uint32_t*)(USART2_BASE + 0x00))
#define USART2_DR     ((volatile uint32_t*)(USART2_BASE + 0x04))
#define USART2_BRR    ((volatile uint32_t*)(USART2_BASE + 0x08))
#define USART2_CR1    ((volatile uint32_t*)(USART2_BASE + 0x0C))

#define RING_BUF_SIZE 256
typedef struct {
    uint8_t buffer[RING_BUF_SIZE];
    volatile uint32_t head;
    volatile uint32_t tail;
} ring_buffer_t;

static ring_buffer_t rx_buffer = { {0}, 0, 0 };

void uart2_init(void) {
    // 1. Enable Clocks for GPIOA and USART2
    *((volatile uint32_t*)0x40023830U) |= (1U << 0);  // GPIOA
    *((volatile uint32_t*)0x40023840U) |= (1U << 17); // USART2

    // 2. Configure Pin Modes (Alt Function PA2 & PA3)
    // [GPIO pin routes AF7 to PA2 and PA3]

    // 3. Set Baud Rate to 115200 (DIV = 0x008B)
    *USART2_BRR = 0x008BU;

    // 4. Enable RXNE interrupt
    *USART2_CR1 |= (1U << 5);

    // 5. Enable UART, TX, RX
    *USART2_CR1 |= (1U << 13) | (1U << 3) | (1U << 2);
}

void uart_write_byte(uint8_t byte) {
    while (!(*USART2_SR & (1U << 7))); // Wait for TXE
    *USART2_DR = byte;
}

void uart_write_string(const char *str) {
    while (*str) {
        uart_write_byte((uint8_t)*str++);
    }
}

bool uart_read_byte(uint8_t *data) {
    // Enter critical section to protect index read/write
    __asm volatile("cpsid i" : : : "memory");
    if (rx_buffer.head == rx_buffer.tail) {
        __asm volatile("cpsie i" : : : "memory");
        return false; // Empty
    }
    *data = rx_buffer.buffer[rx_buffer.tail];
    rx_buffer.tail = (rx_buffer.tail + 1) % RING_BUF_SIZE;
    __asm volatile("cpsie i" : : : "memory");
    return true;
}

void USART2_IRQHandler(void) {
    if (*USART2_SR & (1U << 5)) { // RXNE active
        uint8_t data = (uint8_t)(*USART2_DR & 0xFF);
        uint32_t next = (rx_buffer.head + 1) % RING_BUF_SIZE;
        if (next != rx_buffer.tail) { // Not full
            rx_buffer.buffer[rx_buffer.head] = data;
            rx_buffer.head = next;
        }
    }
}
```

---

## 📦 Deliverables
* [ ] Driver library files `uart.c` and `uart.h`.
* [ ] Application entry point `main.c` showing the uppercase command echo loop.
* [ ] Captured USB Logic Analyzer waveform log showing a complete serial transmission packet confirming baud rate and timing calculations.

---

## ❓ Self-Check Questions
1. Show how to calculate the USART_BRR configuration register value if you are routing communication on USART1 mapped to APB2 clock bus running at 84MHz with a target Baud Rate of 9600.
2. What are the logical differences between **asynchronous** (e.g., UART) and **synchronous** (e.g., SPI) protocols? Why does UART require strict, predefined clock parameters on both nodes?
3. What is an **Overrun Error (ORE)**, and what register configurations inside UART cause it? How do you clear a pending ORE?
4. Why is a Ring Buffer critical for high-speed serial data handling? How does it resolve the latency delta between hardware event triggers and main loop processing?
5. Under what circumstances will a global index write (e.g., modifying `tail` inside `uart_read_byte`) create a race condition with the ISR pushing to the buffer? How does the critical section protect it?

---

## 🚀 Stretch Task (Optional)
Extend the serial driver to support **DMA-driven Transmissions**. Configure the DMA peripheral (DMA1 Stream 6 Channel 4) to automatically pull character buffers from memory and stream them to the USART transmitter dynamically without invoking the CPU.

## 💡 Motivation Checkpoint
UART is the universal debugging port of the electronics industry. From small IoT microcontrollers to giant server racks and automated vehicles, UART serial ports provide the direct diagnostic channel (boot logs, command shells, diagnostic trace data). Mastering reliable, non-blocking serial drivers is the primary step to establishing hardware visibility.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - USART and pins configured purely by register alignments.
  - Zero dropped characters during a continuous transmission block of 1000 characters.
  - Ring buffer read/write indices safely guarded against race conditions.
* **Fail Criteria**:
  - Use of polling receiver commands inside ISRs.
  - Hard-coded character buffering arrays.
