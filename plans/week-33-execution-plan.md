# Weekly Execution Plan: Week 33

## 🎯 Weekly Goal
Master real-world analog and actuator hardware interfaces, configure Analog-to-Digital Converters (ADC) and Pulse-Width Modulation (PWM) channels strictly via register writes, and build multi-tasking, RTOS-based sensor data processors.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Real-Time Actuator & Sensor Control Node** using FreeRTOS on the STM32F4. They will have configured the ADC peripheral to read analog inputs, mapped a general-purpose timer to generate physical PWM outputs, and integrated safe closed-loop task control feedback.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Analog-to-Digital Conversion (ADC) Architecture & Registers
* **Conceptual Objective**: Master the principles of Successive Approximation Register (SAR) ADCs. Understand sample times, resolution (12-bit on STM32), input voltage scales ($0\dots V_{REF}$), and critical control registers (SR, CR1, CR2, SMPR, SQR, DR).
* **Practical Activity**:
  1. Study sampling rate calculations and prescaler configurations.
  2. Write a C macro to initialize ADC1 on Pin PA1 (ADC Channel 1).
* **Code/Circuit Reference**:
```c
#define ADC1_BASE          0x40012000U
#define ADC1_CR1           ((volatile uint32_t*)(ADC1_BASE + 0x04U))
#define ADC1_CR2           ((volatile uint32_t*)(ADC1_BASE + 0x08U))
#define ADC1_DR            ((volatile uint32_t*)(ADC1_BASE + 0x4CU)) // Data Register
#define ADC1_SQR3          ((volatile uint32_t*)(ADC1_BASE + 0x34U)) // Regular Sequence 3

void adc1_init_pa1(void) {
    // 1. Enable GPIOA and ADC1 clock gates
    *((volatile uint32_t*)0x40023830U) |= (1U << 0); // GPIOAEN
    *((volatile uint32_t*)0x40023844U) |= (1U << 8); // ADC1EN

    // 2. Configure PA1 as Analog mode (MODER '11')
    *((volatile uint32_t*)0x40020000U) |= (3U << (1 * 2));

    // 3. Configure ADC regular sequence: Channel 1 first (SQR3 = 1)
    *ADC1_SQR3 = 1U;

    // 4. Enable ADC (ADON bit 0 in CR2)
    *ADC1_CR2 |= (1U << 0);
}
```

### Tuesday: Polling & Interrupt-Driven ADC Reads
* **Conceptual Objective**: Learn how to trigger conversions and read values. Study polling conversions using status registers (EOC: End of Conversion flag) compared to interrupt-driven conversions unblocking tasks.
* **Practical Activity**:
  1. Implement a polling read API `uint16_t adc_read_value(void)`.
  2. Implement an interrupt-driven ADC task signaling completion.
* **Code/Circuit Reference**:
```c
uint16_t adc_read_value(void) {
    // Start conversion (SWSTART bit 30 in CR2)
    *ADC1_CR2 |= (1U << 30);
    
    // Wait until conversion complete (EOC bit 1 in SR)
    volatile uint32_t *sr = (volatile uint32_t*)0x40012000U; // ADC_SR
    while (!(*sr & (1U << 1)));
    
    return (uint16_t)(*ADC1_DR & 0xFFF); // Return 12-bit reading
}
```

### Wednesday: Pulse-Width Modulation (PWM) Actuator Control
* **Conceptual Objective**: Master Pulse-Width Modulation (PWM)—a technique to generate simulated analog output voltages by toggling digital pins at high frequencies, controlling the **Duty Cycle** (ratio of High time to total period). Study Timer Capture/Compare Mode Registers (CCMR) and Capture/Compare Enable Register (CCER) configuration.
* **Practical Activity**:
  1. Configure TIM3 Channel 1 to generate a 1kHz PWM signal.
  2. Route the output to Pin PA6 (Timer 3 Channel 1 alternate function AF2).
* **Code/Circuit Reference**:
```c
#define TIM3_BASE          0x40000400U
#define TIM3_CR1           ((volatile uint32_t*)(TIM3_BASE + 0x00U))
#define TIM3_PSC           ((volatile uint32_t*)(TIM3_BASE + 0x28U))
#define TIM3_ARR           ((volatile uint32_t*)(TIM3_BASE + 0x2CU))
#define TIM3_CCR1          ((volatile uint32_t*)(TIM3_BASE + 0x34U)) // Duty cycle control
#define TIM3_CCMR1         ((volatile uint32_t*)(TIM3_BASE + 0x18U))
#define TIM3_CCER          ((volatile uint32_t*)(TIM3_BASE + 0x20U))

void pwm_tim3_ch1_init(void) {
    *((volatile uint32_t*)0x40023840U) |= (1U << 1); // Enable TIM3 Clock
    *TIM3_PSC = 15; // Clock ticks at 1MHz
    *TIM3_ARR = 999; // Period = 1ms = 1kHz PWM

    // Configure PWM Mode 1 (bits 6:4 = 110) and enable output preload (bit 3)
    *TIM3_CCMR1 = (6U << 4) | (1U << 3);

    // Enable Channel 1 Output Compare (bit 0 in CCER)
    *TIM3_CCER |= (1U << 0);

    *TIM3_CCR1 = 500; // Default 50% duty cycle (500/1000)
    *TIM3_CR1 |= (1U << 0); // Enable Timer
}
```

### Thursday: ADC to PWM Closed-Loop RTOS Design
* **Conceptual Objective**: Study closed-loop feedback designs. Design an RTOS task pipeline where an analog sensor reading dynamically scales the speed or brightness of an actuator (LED/Motor) using the PWM duty cycle.
* **Practical Activity**:
  1. Create a sensor polling task (Priority High) and an actuator controller task (Priority Low).
  2. Route values safely via a message queue.
* **Code/Circuit Reference**:
```c
void vControlTask(void *pvParameters) {
    uint16_t adc_val;
    while (1) {
        if (xQueueReceive(xAdcQueue, &adc_val, portMAX_DELAY) == pdTRUE) {
            // Map 12-bit ADC (0-4095) to 10-bit PWM Period (0-999)
            uint32_t duty = (adc_val * 999U) / 4095U;
            *TIM3_CCR1 = duty; // Dynamically update PWM output compare register
        }
    }
}
```

### Friday: Hardware Diagnostics and Verification
* **Conceptual Objective**: Learn how to verify analog inputs and PWM waveforms using debugging gear.
* **Practical Activity**:
  1. Capture the PWM output on a physical logic analyzer.
  2. Verify that changing the analog input voltage (via a potentiometer) dynamically and linearly modifies the duty cycle Bit Width timing on the analyzer trace.

---

## 🛠️ Hands-On Assignment: RTOS Analog Dimmer Controller

### Functional Requirements
Create a fully modular FreeRTOS application that implements an Analog LED Dimmer: an analog input dynamically controls the brightness of an LED using register-level PWM adjustments.
1. Initialize **ADC1 Channel 1** on Pin **PA1** (potentiometer analog input source).
2. Configure **TIM3 Channel 1** to output a **2kHz PWM signal** on Pin **PA6** (routes to PD12 LED or external LED).
3. Spawn two tasks:
   - **`vAnalogReaderTask` (Priority 2)**: Polls the ADC every 50ms, reads the 12-bit value, and writes it to `xSharedAdcQueue`.
   - **`vDimmerControllerTask` (Priority 3)**: Blocks on `xSharedAdcQueue`, reads values, calculates duty scale, and updates `TIM3_CCR1`.
4. Implement a watchdog safety task: if no ADC value is received for 1 second (timeout), force the PWM duty cycle to `0` (turn off actuator) and print an error alert.
5. Provide a Makefile that builds the program cleanly.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include <stdint.h>
#include <stdio.h>

QueueHandle_t xSharedAdcQueue = NULL;

void vAnalogReaderTask(void *pvParameters) {
    adc1_init_pa1();
    while (1) {
        uint16_t val = adc_read_value();
        xQueueSend(xSharedAdcQueue, &val, 0);
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void vDimmerControllerTask(void *pvParameters) {
    pwm_tim3_ch1_init();
    uint16_t adc_val;

    while (1) {
        // Block with a 1-second timeout (watchdog safety check)
        if (xQueueReceive(xSharedAdcQueue, &adc_val, pdMS_TO_TICKS(1000)) == pdTRUE) {
            // Scale: 4095 -> 999 (MAX ARR)
            uint32_t duty = (adc_val * 999U) / 4095U;
            *TIM3_CCR1 = duty; // Update PWM duty cycle
        } else {
            // Watchdog Timeout: Turn off LED
            printf("[WARNING] Sensor inactive. Actuator safety shutoff activated.\n");
            *TIM3_CCR1 = 0; 
        }
    }
}
```

---

## 📦 Deliverables
* [ ] Driver source files `main.c` and compilation `Makefile`.
* [ ] Captured Logic Analyzer trace report `pwm_duty.log` proving varying duty cycles (e.g., captures at 25%, 50%, 75% duty states).

---

## ❓ Self-Check Questions
1. Why is a Sample Time parameter needed inside an Analog-to-Digital Converter? What happens if sample times are set too short for high-impedance analog sources?
2. Walk through the mathematics required to configure a 2kHz PWM wave using a Timer clocked at 16MHz. Calculate PSC and ARR values.
3. Differentiate **PWM Mode 1** from **PWM Mode 2** inside the Timer CCMR registers configurations.
4. What is a Watchdog task? Why is it critical inside industrial environments to have automatic fallback timeouts that disable actuator outputs?
5. How does DMA-driven ADC reading prevent task latency over regular software polling loops?

---

## 🚀 Stretch Task (Optional)
Extend the system to support a **Closed-Loop PI Controller**: write a software proportional-integral control loop that reads motor speed feedback and dynamically adjusts the PWM duty cycle to maintain a target speed.

## 💡 Motivation Checkpoint
Inside chemical plants, robotics lines, and automotive systems, microcontrollers do not just read parameters—they execute changes. Whether you are driving a fuel injector solenoid, a steering motor actuator, or reading temperature scales, you must coordinate analog sensors to duty-cycle actuators. Direct register programming guarantees footprint safety and real-time reliability.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - ADC and PWM configured cleanly strictly via register registers.
  - Dimmer functions correctly without timing lockups.
  - Watchdog safety shutdown triggers correctly on sensor disconnects.
* **Fail Criteria**:
  - Polling timers inside task loops without RTOS delay yields.
  - Missing bounds validations.
