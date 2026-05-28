# Weekly Execution Plan: Week 10

## 🎯 Weekly Goal
Master microcontroller hardware timer architectures, configure the SysTick core timer for precise millisecond-level tick generation, understand prescalers and Auto-Reload registers (ARR), and generate precise software delays and timed interrupts.

## 🏆 Weekly Outcome
By Friday, the student will have configured both the **SysTick Timer** and a general-purpose hardware timer (**TIM2**) at the register level on the STM32F4. They will be able to calculate timer parameters, write precise non-blocking delay routines, and generate periodic interrupts to drive background tasks.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The ARM SysTick Core Timer
* **Conceptual Objective**: Study the SysTick Timer—a simple, 24-bit down-counter integrated inside the ARM Cortex-M core. Understand how it acts as the primary timekeeping engine for operating systems (RTOS) and basic timing systems.
* **Practical Activity**:
  1. Read the SysTick registers specifications (CSR, RVR, CVR, CALIB).
  2. Calculate the Reload Value required to generate a precise 1ms interrupt under a core system clock of 16MHz.
* **Code/Circuit Reference**:
```c
#define SYST_BASE          0xE000E010U
#define SYST_CSR           ((volatile uint32_t*)(SYST_BASE + 0x00U)) // Control and Status
#define SYST_RVR           ((volatile uint32_t*)(SYST_BASE + 0x04U)) // Reload Value
#define SYST_CVR           ((volatile uint32_t*)(SYST_BASE + 0x08U)) // Current Value

volatile uint32_t g_system_ticks = 0;

void systick_init_1ms(uint32_t system_clock_hz) {
    // 1. Calculate reload value (Value = Clock / 1000 - 1)
    *SYST_RVR = (system_clock_hz / 1000U) - 1U;

    // 2. Clear current value
    *SYST_CVR = 0;

    // 3. Enable SysTick: Core Clock Source (bit 2), Interrupt Enable (bit 1), Counter Enable (bit 0)
    *SYST_CSR |= (1U << 2) | (1U << 1) | (1U << 0);
}
```

### Tuesday: Writing SysTick ISR & Delay Functions
* **Conceptual Objective**: Learn how to write the SysTick Interrupt Handler to manage time. Study how to construct non-blocking delays using timed variables compared to basic, CPU-blocking delays.
* **Practical Activity**:
  1. Add `SysTick_Handler` to your startup file Vector Table at index 15.
  2. Write a highly accurate millisecond delay function `delay_ms(uint32_t ms)`.
* **Code/Circuit Reference**:
```c
// Inside startup.c vector table slot 15:
// [15] = SysTick_Handler

void SysTick_Handler(void) {
    g_system_ticks++;
}

// Precise milli-second delay
void delay_ms(uint32_t ms) {
    uint32_t start = g_system_ticks;
    while ((g_system_ticks - start) < ms) {
        // Yield or wait (using volatile checks)
    }
}
```

### Wednesday: General-Purpose Timer Architectures (TIM2-TIM5)
* **Conceptual Objective**: Master the architecture of a 16-bit/32-bit general-purpose hardware timer block. Understand:
  - **Prescaler (PSC)**: Divides the input bus clock to run the timer at a lower, calculated frequency.
  - **Auto-Reload Register (ARR)**: Holds the maximum count value. When the counter reaches ARR, it overflows (resets to 0) and generates an Update Event.
  - **Counter (CNT)**: The physical register that increments on every timer tick.
* **Practical Activity**:
  1. Open the STM32F4 Reference Manual and locate the TIM2 register map (TIMx_CR1, TIMx_DIER, TIMx_SR, TIMx_PSC, TIMx_ARR, TIMx_CNT).
  2. Calculate PSC and ARR values to configure TIM2 to run at 10kHz and trigger an update interrupt every $500\text{ms}$.
* **Code/Circuit Reference**:
```text
Timer Clock Equation:
Target frequency (f) = Bus Clock / ((PSC + 1) * (ARR + 1))
Example: Bus Clock = 16,000,000Hz (16MHz)
Choose PSC = 1599 (Timer clock = 16,000,000 / (1599 + 1) = 10,000Hz = 10kHz)
Choose ARR = 4999 (Update rate = 10,000 / (4999 + 1) = 2Hz = 0.5s = 500ms)
```

### Thursday: Timer Interrupt Configurations
* **Conceptual Objective**: Learn how to route timer update events to trigger NVIC interrupts. Study the Timer DMA/Interrupt Enable register (DIER) and status register (SR).
* **Practical Activity**:
  1. Write a C function initializing TIM2 with calculated PSC/ARR values.
  2. Enable the Update Interrupt bit inside TIM2_DIER and enable TIM2 (IRQ position 28) inside the NVIC ISER register.
* **Code/Circuit Reference**:
```c
#define TIM2_BASE          0x40000000U
#define TIM2_CR1           ((volatile uint32_t*)(TIM2_BASE + 0x00U))
#define TIM2_DIER          ((volatile uint32_t*)(TIM2_BASE + 0x0CU)) // DMA/Interrupt Enable
#define TIM2_SR            ((volatile uint32_t*)(TIM2_BASE + 0x10U)) // Status Register
#define TIM2_PSC           ((volatile uint32_t*)(TIM2_BASE + 0x28U))
#define TIM2_ARR           ((volatile uint32_t*)(TIM2_BASE + 0x2CU))

#define RCC_APB1ENR        ((volatile uint32_t*)0x40023840U)

void tim2_init_500ms(void) {
    // 1. Enable TIM2 clock gate on APB1 bus (bit 0)
    *RCC_APB1ENR |= (1U << 0);

    // 2. Set Prescaler and Auto-reload
    *TIM2_PSC = 1599U;
    *TIM2_ARR = 4999U;

    // 3. Enable Update Interrupt
    *TIM2_DIER |= (1U << 0); // UIE bit

    // 4. Enable Counter
    *TIM2_CR1 |= (1U << 0);  // CEN bit
}
```

### Friday: Input Capture and Output Compare Concepts
* **Conceptual Objective**: Introduce advanced timer peripheral functions:
  - **Output Compare**: Automatically toggles/sets a physical pin state when the CNT matches a predefined Capture/Compare Register (CCR) value (basis of PWM).
  - **Input Capture**: Records the exact value of CNT when a signal transition (rising/falling edge) occurs on a physical pin (basis of frequency measurement).
* **Practical Activity**:
  1. Study CCR and CCMR registers maps.
  2. Draw the functional block comparison flowchart of output compare matching.

---

## 🛠️ Hands-On Assignment: Bare-Metal Timer & Heartbeat Interrupt Generator

### Functional Requirements
Create a fully functional, bare-metal application that uses SysTick for millisecond timing delays and TIM2 periodic interrupts to toggle a heartbeat LED.
1. Configure **SysTick** to trigger an interrupt every 1ms under a 16MHz CPU frequency. Write a non-blocking `delay_ms(uint32_t ms)` function based on a volatile global system tick.
2. Initialize **TIM2** at the register level to generate a periodic update event every 500ms. Enable the TIM2 update interrupt.
3. Enable TIM2 interrupt (IRQ position 28) inside the NVIC. Set its priority lower than SysTick.
4. Implement `TIM2_IRQHandler` in `startup.c` (slot offset 44 in Vector Table). Inside the handler:
   - Check the update interrupt pending status flag in `TIM2_SR`.
   - Clear the status flag (write `0` to bit 0 of `TIM2_SR`).
   - Toggle a second LED (e.g., PD13).
5. In `main.c`, use your SysTick-based `delay_ms` inside the background loop to toggle PD12 LED every 1 second. The TIM2 interrupt must run concurrently, producing a rapid 500ms blink on PD13 alongside the slower 1-second blink on PD12.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include <stdint.h>
#include <stdbool.h>

extern volatile uint32_t g_system_ticks;
void delay_ms(uint32_t ms);
void systick_init_1ms(uint32_t clk);
void tim2_init_500ms(void);
void configure_leds(void);

void main(void) {
    systick_init_1ms(16000000U);
    tim2_init_500ms();
    configure_leds();

    // Enable IRQ 28 (TIM2) in NVIC
    volatile uint32_t *iser0 = (volatile uint32_t*)0xE000E100U;
    *iser0 |= (1U << 28);

    volatile uint32_t *bsrr = (volatile uint32_t*)0x40020C18U;

    while (1) {
        // Toggle PD12 Led using SysTick delay
        *bsrr = (1U << 12); // High
        delay_ms(1000);
        *bsrr = (1U << (12 + 16)); // Low
        delay_ms(1000);
    }
}
```

**`TIM2_IRQHandler` (C-Skeleton)**:
```c
#define TIM2_SR    ((volatile uint32_t*)0x40000010U)
#define GPIOD_ODR  ((volatile uint32_t*)0x40020C14U)

void TIM2_IRQHandler(void) {
    if (*TIM2_SR & (1U << 0)) {
        // Toggle PD13 LED
        *GPIOD_ODR ^= (1U << 13);

        // Clear update interrupt flag
        *TIM2_SR &= ~(1U << 0);
    }
}
```

---

## 📦 Deliverables
* [ ] Updated `startup.c` containing Vector Table slots for `SysTick_Handler` and `TIM2_IRQHandler`.
* [ ] Application source code `main.c` containing initialization equations, delay loops, and ISRs.
* [ ] Clean compilation Makefile.

---

## ❓ Self-Check Questions
1. How does timer clock prescaling physically differ from clock division? How does the processor use the Prescaler (PSC) and Auto-Reload (ARR) registers together to control timing?
2. Why is it necessary to declare `g_system_ticks` with the `volatile` qualifier? What error would occur if the compiler optimized away reads to this variable inside `delay_ms()`?
3. Show the math calculation required to generate a 1-second periodic update rate on TIM2 if the APB1 clock is running at 42MHz.
4. Why must you clear the update status register flag in `TIM2_SR` inside the ISR? What happens if you clear it at the beginning of the ISR vs at the end of the ISR?
5. Why are hardware timer delays superior to simple assembly-instruction delay loops (e.g., `for(int i=0; i<10000; i++);`)?

---

## 🚀 Stretch Task (Optional)
Modify the project to configure **TIM2** in **Output Compare Mode**. Connect your logic analyzer to the physical pin associated with TIM2 Channel 1 (e.g., PA5) and demonstrate a hardware-generated PWM clock signal running at 1kHz. Change the Compare Register value dynamically to change duty cycles.

## 💡 Motivation Checkpoint
In automotive subsystems, avionics networks, and robotics actuators, timing is everything. Whether you are generating precise motor control steps, calculating UART packet timeout bounds, or executing motor PWM, standard delay loops are useless because they waste CPU power. Mastering hardware prescalers, SysTick, and NVIC timed interrupts is a core skill for any embedded engineer.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Timer and SysTick configured purely by register assignments.
  - SysTick delay does not lock up or slip ticks during interrupt execution.
  - Capturing PD12 and PD13 LED waveforms on logic analyzer proves exact frequencies of 1.0Hz and 2.0Hz.
* **Fail Criteria**:
  - Hard-coded clock timing loop adjustments.
  - Missing status register clears.
