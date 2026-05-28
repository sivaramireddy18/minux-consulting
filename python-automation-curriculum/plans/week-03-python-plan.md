# Week 03: MicroPython & Microcontroller Prototyping

## 🎯 Weekly Goal
Master the execution context of MicroPython running on edge microcontroller hardware (ESP32/RP2040), control physical peripherals (GPIO, ADC, PWM), write interrupt service routines defensively, and automate host-to-target scripts deployment.

## 🎓 Weekly Outcome
By the end of this week, you will be able to program microcontrollers using MicroPython, configure hardware register abstractions, write clean hardware interrupt routines, manage edge data storage, and deploy automated flashing scripts using command-line wrappers.

---

## 📅 Session Breakdown

### Monday: The MicroPython Paradigm
* **Conceptual Focus:** Python in silicon.
  * How MicroPython wraps a C-based interpreter that fits inside microcontrollers with limited SRAM (typically < 512KB).
  * The boot sequence: `boot.py` (runs once at power-up) and `main.py` (runs the main loop).
  * Interacting with the MicroPython REPL (Read-Eval-Print Loop) dynamically over USB serial.
* **Hands-on Experiment:**
  Auditing standard modules and memory inside the MicroPython shell:
  ```python
  import gc
  import machine
  
  # Check free RAM in bytes
  print(f"Free memory: {gc.mem_free()} bytes")
  ```

---

### Tuesday: GPIO & Peripheral Control
* **Conceptual Focus:** Reading and writing signals.
  * Controlling pins using `machine.Pin`.
  * **Digital Output:** Driving pins High (3.3V) or Low (0V).
  * **Digital Input:** Reading button states with pull-up/pull-down resistor configurations.
* **Hands-on Exercise:**
  Define and blink an LED pin:
  ```python
  from machine import Pin
  import time
  
  # Configure Pin 2 as output
  led = Pin(2, Pin.OUT)
  
  # Toggle pin state
  for _ in range(5):
      led.value(1)
      time.sleep_ms(500)
      led.value(0)
      time.sleep_ms(500)
  ```

---

### Wednesday: Analog Interfacing & PWM (ADC / PWM)
* **Conceptual Focus:** Continuous wave manipulation.
  * **Analog-to-Digital Converter (ADC):** Reading sensor voltages (e.g. temperature sensors, potentiometers) and mapping them to digital ranges (e.g., 12-bit range 0-4095).
  * **Pulse-Width Modulation (PWM):** Controlling LED brightness or motor speeds by adjusting duty cycles.
* **Hands-on Exercise:** Read analog voltages and write PWM outputs dynamically.

---

### Thursday: Defensive Hardware Interrupts (IRQs)
* **Conceptual Focus:** Asynchronous physical events.
  * **Interrupt Service Routine (ISR):** A function triggered immediately by a hardware pin transition (e.g., button press).
  * **Critical Rules for ISRs in MicroPython:**
    * Keep it short! Long routines block other system operations.
    * **No Allocations:** Banish standard list creation or string formatting inside ISRs (allocating memory triggers errors inside interrupt contexts).
    * Use `micropython.alloc_emergency_exception_buf` to capture ISR crash diagnostics.
* **Hands-on Exercise:**
  Configure a safe, low-latency button interrupt:
  ```python
  import micropython
  from machine import Pin
  
  # Allocate emergency buffer for interrupts
  micropython.alloc_emergency_exception_buf(100)
  
  btn_pressed = False
  
  def button_handler(pin):
      global btn_pressed
      btn_pressed = True # Short operation, zero allocations
  
  btn = Pin(12, Pin.IN, Pin.PULL_UP)
  btn.irq(trigger=Pin.IRQ_FALLING, handler=button_handler)
  ```

---

### Friday: Host-Target Deployment Automation
* **Conceptual Focus:** Automating code deployments.
  * Bypassing manual copy-pasting. Using Python host tools (`ampy`, `rshell`) to upload files dynamically.

---

## 🛠️ Hands-On Assignment: Edge Data-Logger Node
Design and write a complete MicroPython application (`main.py`) that acts as an **Edge Temperature Data-Logger** with hardware interrupt triggers.

### 1. Requirements
* Periodically read temperature from an analog sensor using ADC every 2 seconds.
* If temperature exceeds a ceiling threshold (e.g. 35°C), trigger a flashing LED alert using PWM.
* Provide an emergency stop interrupt: pressing a button must trigger an ISR that halts logging and safely de-energizes the LED immediately.
* Log all sensor records (timestamp, value, alert_state) into a local CSV file on the target's flash memory, checking that files are closed cleanly to prevent flash wear.

### 2. File Deliverables
* `boot.py`: Configures target setup.
* `main.c` (MicroPython `main.py`): The core sensor and interrupt logging loop.
* `deploy.py`: A host-side Python automation script that automatically flashes the target files over serial USB.

---

## 📋 Deliverables Checklist
- [ ] `boot.py` (Initialization code)
- [ ] `main.py` (Hardened interrupt and logging loops)
- [ ] `deploy.py` (Automated flashing python script)

---

## ❓ Self-Check Questions
1. Why is the available memory (RAM) in MicroPython significantly smaller than in standard desktop CPython?
2. Explain why dynamic memory allocations (e.g. string formatting) are prohibited inside MicroPython hardware Interrupt Service Routines (ISRs).
3. How does `machine.Pin.PULL_UP` prevent digital input floating pin states?
4. What does the emergency exception buffer `micropython.alloc_emergency_exception_buf()` resolve when debugging ISRs?
5. How can you automate file transfers to a MicroPython microcontroller using command-line wrappers?

---

## 🚀 Stretch Task
Implement an **asynchronous logger** using MicroPython's `uasyncio` module. Structure your logging code to execute as concurrent async tasks (one task reading sensors, one task flashing LEDs, and one task monitoring interrupts), avoiding blocking loops entirely.

---

## 💡 Motivation Checkpoint
IoT edge nodes (like smart home sensors, agricultural monitors, and predictive maintenance collars) must run for years on small batteries. MicroPython allows rapid prototyping of these systems. Writing defensive, low-latency, interrupt-driven edge code ensures that devices stay online without crashing or draining battery reserves.

---

## 🎓 Trainer Review Rules
* Verify ISR execution: Pressing the emergency button must trigger an immediate de-energization loop within microseconds.
* Verify memory discipline: Run garbage collection checks inside the loops to verify that active operations do not trigger memory leaks or excessive garbage collection sweeps.
