# The Super Boss Vetting Specification
## Phase 2: MCU Architecture & Bare-Metal Driver Dev
### USART Driver Architecture, FIFO Ring Buffers, and Status Polls

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 2: MCU Architecture & Bare-Metal Driver Dev
*   **Target Week:** Week 10
*   **Hardware Anchor:** Universal Synchronous Asynchronous Receiver Transmitter (USART) registers and transceiver status gates
*   **Documentation Map:**
    *   STM32F407 Reference Manual Section 26 (USART), Baud rate tables, and ring buffer schemas.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** USART serial interface architecture: transmitter/receiver shift registers, and control data registers.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write custom code to enable the clock gates for USART2 via APB1ENR, and configure GPIO alternate functions.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Baud rate generation: integer and fractional baud rate dividers, oversampling configurations, and clock fractions.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure the USART_BRR register to configure exactly 115200 Baud rate under 42MHz APB1 clock.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** Transceiver status gates: Transmit Data Register Empty (TXE), Transmission Complete (TC), and Read Data Register Not Empty (RXNE).
*   🛠️ **Unassisted Lab Track (4 Hours):** Write raw polling routines checking the USART_SR status bits to transmit a character stream.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Ring buffer structures: Circular FIFO data models, write/read pointers tracking, and thread-safe lock scopes.
*   🛠️ **Unassisted Lab Track (4 Hours):** Implement a circular FIFO ring buffer in C tracking read and write index pointers.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Interrupt-driven USART: TXE/RXNE exception triggers, NVIC routing, and register state clearing.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write an interrupt-driven serial transceiver unmasking USART_CR1 register flags, and routing ISRs.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Direct Memory Access (DMA) overview: serial stream transfers, memory-to-peripheral configurations, and double-buffering.
*   🛠️ **Unassisted Lab Track (4 Hours):** Test DMA USART circular transfers, configure memory pointers, and verify data throughput.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Circular ring buffer transceiver implementation
#include <stdint.h>

#define RING_BUFFER_SIZE 256U
typedef struct {
    uint8_t buffer[RING_BUFFER_SIZE];
    volatile uint32_t head;
    volatile uint32_t tail;
} RingBuffer;

void ring_buf_push(RingBuffer *rb, uint8_t byte) {
    uint32_t next = (rb->head + 1U) & (RING_BUFFER_SIZE - 1U);
    if (next != rb->tail) {
        rb->buffer[rb->head] = byte;
        rb->head = next;
    }
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Logic Analyzer trace. Trigger on USART start bit. Monitor RXNE interrupts, verify 0 dropped bytes at 115200 Baud.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** How does the fractional baud rate divider calculate DIV_Mantissa and DIV_Fraction for a target baud rate under an active bus clock?
2.  **Challenge 2:** Explain the difference between the Transmit Data Register Empty (TXE) flag and the Transmission Complete (TC) flag.
3.  **Challenge 3:** Why must head and tail index pointers of a circular ring buffer be declared as 'volatile' in a concurrent system?
