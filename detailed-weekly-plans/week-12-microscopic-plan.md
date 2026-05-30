# The Super Boss Vetting Specification
## Phase 2: MCU Architecture & Bare-Metal Driver Dev
### I2C Multi-Master Bus Routing, Clock Stretch, and Status Registers

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 2: MCU Architecture & Bare-Metal Driver Dev
*   **Target Week:** Week 12
*   **Hardware Anchor:** Inter-Integrated Circuit (I2C) peripheral registers, bus status gates, and SDA/SCL lines
*   **Documentation Map:**
    *   STM32F407 Reference Manual Section 28 (I2C), I2C protocol specs, and timing maps.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Inter-Integrated Circuit (I2C) bus architecture: open-drain signal lines, pull-up dimensions, and addressing rules.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write custom code to enable the clock gates for I2C1, and configure alternate open-drain GPIO pins.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** I2C Start/Stop conditions: physical signaling boundaries, and addressing sequences.
*   🛠️ **Unassisted Lab Track (4 Hours):** Configure I2C clock control registers (CCR) to generate exactly 100kHz standard mode timing.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** I2C clock trees: Standard vs Fast modes, clock stretch configurations, and timing setups.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write polling routines mapping start bit generations, address transmissions, and status flags.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** I2C Control Registers: START generation bits, STOP generation, Acknowledge configuration, and address matching registers.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build an I2C transaction engine, and verify the physical signals layout using a Logic Analyzer.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** I2C Status Registers: Address Sent (ADDR), Byte Transfer Finished (BTF), and Master/Slave status flags.
*   🛠️ **Unassisted Lab Track (4 Hours):** Implement a raw register-level I2C read routine, and capture byte streams.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** I2C bus errors: Arbitration Lost (ARLO), Acknowledge Fail (AF), and bus lockups recovery.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write I2C bus recovery code: configure pins as GPIO output to manually pulse SCL 9 times to clear locked SDA lines.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Bare-metal I2C master start address transaction
#include <stdint.h>

#define I2C1_BASE   0x40005400U
#define I2C1_CR1    *(volatile uint32_t *)(I2C1_BASE + 0x00U)
#define I2C1_SR1    *(volatile uint32_t *)(I2C1_BASE + 0x14U)
#define I2C1_SR2    *(volatile uint32_t *)(I2C1_BASE + 0x18U)
#define I2C1_DR     *(volatile uint32_t *)(I2C1_BASE + 0x10U)

void i2c1_start_address(uint8_t addr) {
    I2C1_CR1 |= (1U << 8); // Generate START
    
    // Wait for SB (Start bit generated) in SR1
    while (!(I2C1_SR1 & (1U << 0)));
    
    // Write 7-bit address + Write bit (0)
    I2C1_DR = (addr << 1) & ~1U;
    
    // Wait for ADDR (Address sent) in SR1
    while (!(I2C1_SR1 & (1U << 1)));
    
    // Clear ADDR flag by reading SR1 followed by SR2
    (void)I2C1_SR1;
    (void)I2C1_SR2;
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Logic Analyzer trace. Trigger on I2C Start condition. Verify address acknowledge bit state, and timing margins.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Why does I2C require pull-up resistors on both the SCL and SDA lines?
2.  **Challenge 2:** Explain the mechanism of Clock Stretching and how an I2C slave device halts execution on a master.
3.  **Challenge 3:** What physical bus state causes an Arbitration Lost (ARLO) error in a multi-master I2C system?
