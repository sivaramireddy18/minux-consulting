# Week 04: Instrumentation Control (PyVISA & SCPI)

## 🎯 Weekly Goal
Master the SCPI (Standard Commands for Programmable Instruments) standard, interface with lab hardware dynamically using PyVISA, and write robust, reusable device drivers to control instruments (oscilloscopes, power supplies, load units).

## 🎓 Weekly Outcome
By the end of this week, you will be able to map active VISA resources, write a complete object-oriented driver wrapper for a programmable DC power supply, execute SCPI queries securely over raw socket and USB connections, and handle device errors gracefully.

---

## 📅 Session Breakdown

### Monday: The VISA Standard & PyVISA
* **Conceptual Focus:** The Virtual Instrument Software Architecture (VISA) standard.
  * Interfacing with instruments across different physical interfaces (USB, Ethernet, GPIB, Serial) using a unified software API.
  * Installing and configuring the PyVISA backend.
  * Querying active VISA resources.
* **Hands-on Experiment:**
  Scan for active hardware interfaces:
  ```python
  import pyvisa
  
  # Initialize VISA resource manager
  rm = pyvisa.ResourceManager()
  
  # List all detected resources
  resources = rm.list_resources()
  print("Detected instruments:")
  for res in resources:
      print(f" -> {res}")
  ```

---

### Tuesday: The SCPI Command Standard
* **Conceptual Focus:** Standard Commands for Programmable Instruments.
  * SCPI is a hierarchical tree-like text protocol.
  * Common IEEE 488.2 commands:
    * `*IDN?`: Identification query (returns manufacturer, model, serial).
    * `*RST`: Reset command (restores default safe factory configurations).
    * `*OPC?`: Operation Complete query (prevents command race conditions).
  * SCPI Syntax rules: colons (`:`), question marks (`?`), parameter spacing.
* **Hands-on Exercise:**
  Trace SCPI command structures:
  `:SOURCE:VOLTAGE:LEVEL:IMMEDIATE:AMPLITUDE 5.0` (set voltage to 5V).

---

### Wednesday: Device Driver Design Pattern
* **Conceptual Focus:** The Device Object Model (DOM).
  * Why you must **never** hardcode raw SCPI strings directly in your test suites. 
  * Wrapping raw VISA write/query calls inside clean, type-hinted object-oriented wrapper classes.
* **Hands-on Exercise:**
  Build a basic VISA instrumentation wrapper:
  ```python
  import pyvisa
  
  class PowerSupply:
      def __init__(self, visa_address: str):
          self.rm = pyvisa.ResourceManager()
          self.device = self.rm.open_resource(visa_address)
          # Set safe write/read timeouts
          self.device.timeout = 2000 # 2 seconds
          
      def reset(self) -> None:
          self.device.write("*RST")
          
      def get_identity(self) -> str:
          return str(self.device.query("*IDN?")).strip()
          
      def close(self) -> None:
          self.device.close()
  ```

---

### Thursday: Raw TCP Socket Communications
* **Conceptual Focus:** Controlling Ethernet-connected instruments without VISA layers.
  * Interfacing directly via raw TCP socket programming (often on Port 5025).
* **Hands-on Exercise:**
  Connect and query an instrument over raw sockets using Python's `socket` module.

---

### Friday: Error Queues & Status Registers
* **Conceptual Focus:** Auditing device internal states.
  * Querying system errors using `:SYSTEM:ERROR?`.
  * The necessity of clearing device error queues before and after test runs.

---

## 🛠️ Hands-On Assignment: Programmable Power Supply Driver
Design and implement a complete, fully type-annotated, and robust Python device driver class (`power_supply.py`) to wrap a programmable DC Power Supply.

### 1. Requirements
* Define a class `ProgrammablePowerSupply` utilizing PyVISA.
* Implement the following methods:
  * `__enter__` and `__exit__` context managers (resource protection).
  * `reset()`: Resets the instrument.
  * `set_voltage_limit(limit: float)`: Sets an absolute safe over-voltage protection limit.
  * `set_output(voltage: float, current: float)`: Sets output parameters, checking bounds defensively.
  * `enable_output(state: bool)`: Toggles the output relay.
  * `measure_voltage() -> float`: Queries active measured output voltage.
  * `check_errors() -> list[str]`: Queries the error queue until empty.
* All code must be strictly type-annotated and pass `mypy --strict`.

### 2. File Deliverables
* `power_supply.py`: The instrument driver class.
* `mock_instrument.py`: A simulated SCPI socket server utility that mimics a real programmable power supply (accepts connection, processes SCPI strings, and returns mock values).

---

## 📋 Deliverables Checklist
- [ ] `power_supply.py` (Mypy type-hinted, context managers)
- [ ] `mock_instrument.py` (SCPI socket simulator)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. What is the fundamental purpose of the Virtual Instrument Software Architecture (VISA) standard in engineering labs?
2. Explain the hierarchical tree structure of SCPI commands, and why short/long formats (e.g. `MEASure:VOLTage?`) are supported.
3. Why are context managers (`__enter__` / `__exit__`) essential when designing instrumentation drivers?
4. How does the SCPI command `*OPC?` prevent synchronization errors when sending slow configurations (like device resets)?
5. How does raw socket interfacing bypass the need to install heavy NI-VISA vendor backend installations?

---

## 🚀 Stretch Task
Modify your Power Supply driver to support **ramping profiles**. Implement a method `ramp_voltage(target: float, step: float, delay_ms: int)` that increments the voltage gradually from the current level to the target level, validating status states at each step to prevent hardware voltage surges.

---

## 💡 Motivation Checkpoint
In automotive, battery, and medical HIL testing labs, test racks contain millions of dollars of hardware components. If an automated script sends an incorrect SCPI voltage parameter due to a driver typo or parsing error, it can physically incinerate the device-under-test. Writing robust, fully typed, and bounds-checked drivers is a mandatory engineering safety law.

---

## 🎓 Trainer Review Rules
* Verify type-safety: Executing `mypy --strict power_supply.py` must complete with 0 alerts.
* Verify context management: Initiating a connection and intentionally triggering a Python crash must close the raw VISA socket cleanly, confirmed by socket port scans.
