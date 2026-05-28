# Week 06: Hardware-in-the-Loop (HIL) & Fault Injection

## 🎯 Weekly Goal
Master the principles of Hardware-in-the-Loop (HIL) testing, control physical relay boards to dynamically manipulate electrical signals, and build automated fault injection scenarios to stress-test device safety responses.

## 🎓 Weekly Outcome
By the end of this week, you will be able to construct HIL test loops, write driver layers to control multi-channel USB/Ethernet relay boards, automate physical fault injections (signal short-circuits, brownouts, power cuts), and monitor asynchronous target responses under load.

---

## 📅 Session Breakdown

### Monday: Hardware-in-the-Loop (HIL) Principles
* **Conceptual Focus:** Testing physical hardware in a closed loop.
  * In advanced systems, software cannot be tested in pure isolation on PC simulators. It must run on the actual target microcontroller.
  * **The HIL Concept:** The target microcontroller's pins are connected to a test rack containing automated testing instruments and relay boards. Python controls the test rack to simulate a real physical environment (sensors, signals, power grids).
  * closed-loop vs open-loop test architectures.
* **Hands-on Experiment:**
  Trace block schematics of a standard HIL test loop connecting host scripts, simulated sensor buses (I2C/SPI), and physical target pins.

---

### Tuesday: Relay Board Driver Design
* **Conceptual Focus:** Dynamically switching physical connections.
  * What is a relay? An electromagnetically operated switch.
  * Using multi-channel USB/Ethernet relay boards to connect and disconnect lines.
  * De-energizing and energizing channels dynamically from Python via serial commands or raw socket controls.
* **Hands-on Exercise:**
  Build a clean class wrapping a standard USB relay controller:
  ```python
  import serial
  
  class RelayController:
      def __init__(self, port: str):
          self.ser = serial.Serial(port, 9600, timeout=1.0)
          
      def set_channel(self, channel: int, state: bool) -> None:
          # Standard hex protocol for a typical USB relay board
          cmd = bytearray([0xA0, channel, 0x01 if state else 0x00, 0x00])
          # Calculate verification sum
          cmd[3] = (cmd[0] + cmd[1] + cmd[2]) & 0xFF
          self.ser.write(cmd)
          
      def close(self) -> None:
          self.ser.close()
  ```

---

### Wednesday: Fault Injection Paradigms
* **Conceptual Focus:** Intentional system abuse.
  * To verify that safety-critical firmware reacts correctly to physical hazards, we must *inject* faults during operation.
  * **Core Fault Scenarios:**
    1. **Power Faults:** Brownouts (reducing voltage to critical boundaries), raw power cuts.
    2. **Bus Faults:** Disconnecting communication lines (SDA/SCL) mid-transaction.
    3. **Signal Faults:** Short-circuiting pins to Ground or 3.3V rails.
* **Hands-on Exercise:** Design the logical flow chart for an automated brownout injection test sequence.

---

### Thursday: Asynchronous Failure Monitoring
* **Conceptual Focus:** Spotting failures in real time.
  * When a fault is injected, the target MCU might emit crash data over UART or trigger a physical GPIO alarm.
  * Python must run asynchronous listening threads that watch for these indicators while the main test thread is executing fault steps.
* **Hands-on Exercise:** Write a Python thread that monitors a target serial output for crash messages (`"PANIC"`, `"ASSERT"`) during testing.

---

### Friday: Safe HIL Recovery Routines
* **Conceptual Focus:** Cleaning up after chaos.
  * If a fault injection test case aborts or crashes, the HIL rack must restore instruments and relays to safe, neutral, de-energized states to prevent equipment damage.

---

## 🛠️ Hands-On Assignment: HIL Fault Injection Test Harness
Build an automated **HIL Fault Injection Test Harness** (`hil_fault_harness.py`) that simulates power anomalies and evaluates a virtual target MCU's recovery capabilities.

### 1. Requirements
* Wrap the `RelayController` and `ProgrammablePowerSupply` inside unified pytest fixtures.
* Implement a HIL test sequence that:
  1. Powers up the virtual target device at `3.3V`.
  2. Spawns an asynchronous monitoring thread listening to the target's serial telemetry channel.
  3. Uses a relay channel to simulate an "I2C Bus Disconnect" fault (energize relay to disconnect SDA line).
  4. Asserts that the target telemetry channel registers a `"BUS_ERROR"` warning within 500ms.
  5. Recovers by de-energizing the relay (reconnecting SDA) and verifies that the target returns to `"SYSTEM_OK"` status.
* All code must be strictly type-annotated, checked with Mypy, and Black formatted.

### 2. File Deliverables
* `hil_fault_harness.py`: The pytest HIL execution file.
* `virtual_target.py`: A socket utility that simulates a physical target microcontroller's telemetry port, responding to simulated power variations and relay signals.

---

## 📋 Deliverables Checklist
- [ ] `hil_fault_harness.py` (Mypy type-hinted, context managers)
- [ ] `virtual_target.py` (Telemetry socket simulator)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is Hardware-in-the-Loop (HIL) testing critical in automotive and safety-critical industries?
2. Explain how relay boards are leveraged in automated testing to simulate communication line cutoffs.
3. What is a "Brownout Fault," and how does a programmable power supply simulate it under script control?
4. Why must fault-monitoring threads execute asynchronously while HIL test cases execute?
5. What are the core safety recovery steps a HIL test suite must execute if a test crashes midway?

---

## 🚀 Stretch Task
Implement an **automated recovery loop** that checks for target freeze conditions. If the virtual target stops emitting telemetry completely (deadlock or crash), trigger a relay to completely cycle the target's physical power line (Hard Reset), verifying that it boots back up cleanly.

---

## 💡 Motivation Checkpoint
Automated HIL fault-injection is the baseline requirement for obtaining safety certifications (like ISO 26262 for automotive ECUs). Companies like Boeing or Mercedes-Benz run millions of automated fault-injection cycles on test rigs, simulating engine failures, sensor outages, and battery short circuits to verify that safety-critical control loops protect human passengers.

---

## 🎓 Trainer Review Rules
* Verify type-safety: Executing `mypy --strict hil_fault_harness.py` must complete with 0 alerts.
* The test execution log must show that all asynchronous threads are terminated cleanly. No zombie threads or unclosed socket connections are permitted.
