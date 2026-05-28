# Week 02: Hardware Scripting & Serial Communications

## 🎯 Weekly Goal
Master serial communication protocols from the host side using PySerial, read and write raw byte streams defensively, and serialize/deserialize complex data structures using Python's `struct` module.

## 🎓 Weekly Outcome
By the end of this week, you will be able to establish robust serial USB connections, manage serial stream buffer read loops, map raw incoming bytes to high-level Python dataclasses using `struct.unpack`, and validate data integrity using CRC-16 checks.

---

## 📅 Session Breakdown

### Monday: The PySerial Communications Layer
* **Conceptual Focus:** Interfacing with serial channels.
  * Configuring port names, baudrates, timeouts, parity, and stop bits.
  * **The Trap:** Blocking read operations without timeouts. Your read loops must always execute defensively using non-zero read timeouts.
  * Clearing input/output buffers: `reset_input_buffer()`, `reset_output_buffer()`.
* **Hands-on Experiment:**
  Establish and open a serial connection:
  ```python
  import serial
  
  # Configure serial port defensively
  try:
      with serial.Serial(port="/dev/ttyUSB0", baudrate=115200, timeout=1.0) as ser:
          print(f"Serial port {ser.name} opened successfully!")
          # Perform safe write
          ser.write(b"PING\n")
  except serial.SerialException as e:
      print(f"Connection failed: {e}")
  ```

---

### Tuesday: The `struct` Packing Module
* **Conceptual Focus:** Binary conversions in Python.
  * Microcontrollers output data as raw binary bytes. Python must map these bytes to floats, ints, or chars.
  * **The Solution:** Python's built-in `struct` module.
  * Code formatting codes: `f` (float), `H` (16-bit unsigned int), `B` (8-bit unsigned int), `<` (force Little-Endian), `>` (force Big-Endian).
* **Hands-on Exercise:**
  Pack and unpack telemetry data:
  ```python
  import struct
  
  # Pack: 8-bit ID (1), 32-bit float temp (25.5), 16-bit counter (100)
  # Little-Endian format: '< B f H'
  binary_packet = struct.pack("<BfH", 1, 25.5, 100)
  print(f"Packed Bytes: {binary_packet.hex().upper()}")
  
  # Unpack
  device_id, temp, counter = struct.unpack("<BfH", binary_packet)
  print(f"Unpacked -> ID: {device_id}, Temp: {temp}, Counter: {counter}")
  ```

---

### Wednesday: Telemetry Byte Stream Parsing
* **Conceptual Focus:** Finding packet boundaries.
  * When reading raw byte streams over serial, data is not delivered in neat, separate packets. It arrives as a continuous stream of random bytes.
  * **Framing:** Using start-of-packet (`SOP`) and end-of-packet (`EOP`) byte codes (e.g. `0x02` and `0x03`) to identify valid packet blocks.
* **Hands-on Exercise:** Write a defensive parser loop that scans incoming bytes and extracts complete packet frames.

---

### Thursday: CRC-16 Checksums & Data Integrity
* **Conceptual Focus:** Validating hardware packet transmissions.
  * Serial connections are noisy. EMI interference can flip bits.
  * Using **Cyclic Redundancy Checks (CRC-16)** to detect packet corruptions.
* **Hands-on Exercise:** Write a pure Python CRC-16 calculation function to validate packet frames before parsing.

---

### Friday: Defensive Byte Mapping with Dataclasses
* **Conceptual Focus:** Packaging raw values into clean, type-hinted object models (`dataclasses`).

---

## 🛠️ Hands-On Assignment: Hardware Telemetry Parser
Build a robust Python program named `telemetry_parser.py` that connects to a virtual serial port, extracts framed packets, checks CRC-16, and logs outputs.

### 1. Requirements
* Define a packet frame structure: `SOP` (1 byte, `0xAA`), `Device_ID` (1 byte), `Voltage` (32-bit float), `Counter` (16-bit int), `CRC-16` (2 bytes), `EOP` (1 byte, `0xBB`).
* Implement a serial reader loop:
  1. Continually read bytes from the serial handle.
  2. Locate valid frames bounded by `SOP` and `EOP`.
  3. Validate the payload using a custom CRC-16 calculation function.
  4. If CRC passes, unpack components using the `struct` module and store them inside a type-hinted Python dataclass.
* Code must be fully type-hinted, checked with `mypy --strict`, and format-locked via Black.

### 2. File Deliverables
* `telemetry_parser.py`: Main parsing script containing connection and loops.
* `virtual_serial.py`: A simulated serial port utility that generates raw byte telemetry streams with randomized data corruptions.

---

## 📋 Deliverables Checklist
- [ ] `telemetry_parser.py` (Mypy type-hinted, zero warnings)
- [ ] `virtual_serial.py` (Mock telemetry generator utility)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is setting an explicit read timeout critical inside serial loop connection handles?
2. What do the character codes `<` and `>` represent inside Python `struct` format strings, and why are they mandatory for cross-target parsing?
3. Explain the mechanical steps of locating a packet frame inside a raw continuous byte stream.
4. How does a Cyclic Redundancy Check (CRC) identify bitwise data corruption in noisy transmission environments?
5. Why are standard Python dataclasses superior to raw index tuples for representing unpacked telemetry values?

---

## 🚀 Stretch Task
Modify your telemetry parser to support **CSV telemetry recording**. Integrate logic to automatically write valid telemetry packets into a thread-safe CSV log file, rotating logs dynamically when file sizes exceed 1MB.

---

## 💡 Motivation Checkpoint
Telemetry tracking is the heartbeat of spacecraft, automotive, and aeronautics control. During space missions (like Apollo or Mars Lander), data-logging scripts parse thousands of binary frames a second. If a script lacks robust boundary scanning or CRC validation, a single bit flip can corrupt the metrics dashboard and blind flight controllers.

---

## 🎓 Trainer Review Rules
* Verify type-safety: Executing `mypy --strict telemetry_parser.py` must complete with 0 alerts.
* Verify fault-tolerance: Passing malformed packets containing invalid CRCs or truncated lengths must be caught and logged cleanly without throwing unhandled Python parser exceptions.
