# The Super Boss Vetting Specification
## Phase 2: MCU Architecture & Bare-Metal Driver Dev
### SPI Synchronous Protocol, Serial Registers, and Logic Analysis

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 2: MCU Architecture & Bare-Metal Driver Dev
*   **Target Week:** Week 11
*   **Hardware Anchor:** Serial Peripheral Interface (SPI) peripheral registers, transceiver shifts, and Chip Select pins
*   **Documentation Map:**
    *   STM32F407 Reference Manual Section 27 (SPI), SPI frame specs, and logic trace formats.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Serial Peripheral Interface (SPI) synchronous bus architecture: Master-Slave relationships, MISO, MOSI, and SCK lines.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write custom code to enable the clock gates for SPI1 via APB2ENR, and configure GPIOAlternate Functions.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** SPI Clock Modes: clock polarity (CPOL), clock phase (CPHA), timing transitions, and shift triggers.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure the SPI_CR1 register to set Clock Mode 0, MSB first, and Baud rate divider.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** SPI Control Registers: Baud rate calculations, data frame size selection, and MSB/LSB first configurations.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a polling driver mapping SPI_DR data registers, and transmitting bytes.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Hardware SPI status gates: Transmit Buffer Empty (TXE), Receive Buffer Not Empty (RXNE), and Busy Flag (BSY).
*   🛠️ **Unassisted Lab Track (4 Hours):** Write code to configure a software GPIO pin as Chip Select, toggling the line to map SPI peripheral targets.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Chip Select (CS) configuration: software-managed vs hardware-managed CS pins, and physical addressing modes.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build an SPI transaction engine, and verify transmitted signal patterns using a physical Logic Analyzer.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** SPI logic trace analysis: bus signals synchronization check, logic analyzer triggers configuration, and timing sweeps.
*   🛠️ **Unassisted Lab Track (4 Hours):** Test high-frequency SPI transfers at 21MHz, and verify signal transitions timing deviations.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Bare-metal SPI byte transaction driver
#include <stdint.h>

#define SPI1_BASE   0x40013000U
#define SPI1_CR1    *(volatile uint32_t *)(SPI1_BASE + 0x00U)
#define SPI1_SR     *(volatile uint32_t *)(SPI1_BASE + 0x08U)
#define SPI1_DR     *(volatile uint32_t *)(SPI1_BASE + 0x0CU)

uint8_t spi1_transfer(uint8_t data) {
    // Wait for TXE (Transmit buffer empty)
    while (!(SPI1_SR & (1U << 1)));
    
    // Write byte to Data Register
    SPI1_DR = data;
    
    // Wait for RXNE (Receive buffer not empty)
    while (!(SPI1_SR & (1U << 0)));
    
    // Return received byte
    return (uint8_t)SPI1_DR;
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Logic Analyzer trace. Trigger on Chip Select falling edge. Verify correct bitwise clock cycles alignment on rising SCK.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Explain the difference between SPI Clock phase (CPHA) 0 and 1. On which clock edge is data sampled in each mode?
2.  **Challenge 2:** Why must we wait for the SPI BSY (Busy) flag to clear before de-asserting the Chip Select (CS) output line?
3.  **Challenge 3:** What is the exact physical impact of signal line capacitance on high-speed SPI clock lines?
