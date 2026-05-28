# Weekly Execution Plan: Week 36

## 🎯 Weekly Goal
Deliver the multi-tiered Capstone Production Project (Industrial IoT Gateway), execute complete system validations, customize your professional engineering resume, and complete system-design mock interviews.

## 🏆 Weekly Outcome
By Friday, the student will have finalized their **Industrial IoT Gateway Capstone Project**, linking a downstream real-time sensor node (FreeRTOS) with an upstream Linux Gateway (Yocto-built) communicating over secure sockets. They will defend their portfolio in a mock technical interview and stand 100% prepared for market entry as a highly competitive Systems Engineer.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Capstone Integration & Communication Setup
* **Conceptual Objective**: The project bridges all milestones built throughout the 36 weeks, combining a real-time bare-metal/RTOS microcontroller client with an embedded Linux Yocto-built gateway.
* **Practical Activity**:
  1. Assemble hardware nodes: mount target microcontroller (STM32F4) and gateway board (Raspberry Pi/BBB) onto a shared breadboard.
  2. Wire UART communication lines between the nodes, linking grounds safely.
* **Code/Circuit Reference**:
```text
Capstone Hardware Topology:
+------------------------+                     +------------------------+
| Client: STM32F4 MCU    |                     | Gateway: Raspberry Pi  |
|  - FreeRTOS Active     |                     |  - Yocto custom OS     |
|  - Reads Analog Sensor |                     |  - Multi-threaded C App|
|  - TX (PA2) -----------+-----[Serial Bus]---->|  - RX (GPIO15)         |
+------------------------+                     +------------------------+
```

### Tuesday: Multi-Threaded Gateway Processing & Socket Streaming
* **Conceptual Objective**: Master the gateway-side processing logic. The gateway runs a multi-threaded user-space daemon (compiled via a custom Yocto recipe) that reads raw sensor packets from the UART serial port, verifies integrity, and publishes statistics via secure TCP/IP sockets to a server dashboard.
* **Practical Activity**: Write the gateway processing daemon in C. Test concurrent client socket connections.
* **Code/Circuit Reference**:
```c
void* serial_reader_thread(void *arg) {
    int uart_fd = open("/dev/ttyS0", O_RDONLY | O_NOCTTY);
    // Read loop, parse frames, stream to active socket clients
}
```

### Wednesday: System Optimization & Boot Audits
* **Conceptual Objective**: Study boot-time optimization patterns. A production embedded system must boot extremely fast. Learn how to audit systemd startup sequences using `systemd-analyze` and strip unnecessary initialization scripts to achieve a total boot-time to user-space main application under 8 seconds.
* **Practical Activity**: Profile system boot time using `systemd-analyze time` and `systemd-analyze blame`. Disable unneeded system services and verify improvements.
* **Code/Circuit Reference**:
```bash
# Profile boot time
systemd-analyze time
systemd-analyze blame
```

### Thursday: Portfolio Defense & Resume Optimization
* **Conceptual Objective**: Understand how to present your physical engineering portfolio to hiring managers. The best resume is a clean GitHub repository containing well-structured, production-grade code, detailed READMEs, and logic analyzer captures of functional protocols.
* **Practical Activity**: Clean up your workspace directories. Ensure all files are styled, warning-free, and follow Conventional Commits. Update your professional resume to highlight direct hardware competencies.

### Friday: System Design Mock Interviews & Graduation
* **Conceptual Objective**: Stand ready to face technical interview pipelines. Embedded interviewers do not test simple algorithms; they grill candidates on physical registers, memory maps, concurrency, interrupt latency, and driver architectures.
* **Practical Activity**: Conduct a mock interview covering the core topics of the curriculum. Execute the final Capstone graduation defense.

---

## 🛠️ Hands-On Assignment: Industrial IoT Gateway Capstone Project

### Functional Requirements
Deliver, compile, and document the complete **Industrial IoT Gateway Capstone System**.
1. **Microcontroller Node (FreeRTOS)**:
   - Polls an analog sensor (ADC) every 100ms.
   - Packages data into a packed frame with a Start Byte (`0xAA`) and a CRC-8 checksum.
   - Transmits frames via USART TX.
2. **Gateway Node (Yocto Custom OS)**:
   - Run a custom Yocto-built Linux OS containing your proprietary layer.
   - Launch a background C systemd service `gateway_daemon` that reads raw packets from `/dev/ttyS0` (UART Rx), decodes and audits them.
   - Expose a multi-threaded TCP socket on Port `9090`. When a client connects (e.g., your host PC running a python plotter), stream parsed telemetry in real-time.
3. **Boot Optimization**: Audit the system boot flow. Reduce total boot time under 8 seconds, documenting systemd blame stats.
4. **Graduation Report**: Write a 5-page README.md for your portfolio repo detailing: block diagrams, register layouts, custom linker scripts, thread configurations, Yocto recipes, and logic analyzer timings captures.

---

## 📦 Deliverables
* [ ] Full Client source code (FreeRTOS STM32F4).
* [ ] Full Gateway source code and custom Yocto recipes directory (`meta-industrial-gateway`).
* [ ] Comprehensive Capstone Graduation Report `walkthrough.md` embedded with timing captures.

---

## ❓ Self-Check Questions
1. Differentiate the execution scopes of your microcontroller client (RTOS) versus your gateway node (Embedded Linux). How do they cooperate in the system topology?
2. How did you optimize the Yocto boot sequence? Which services did you disable and what boot-time speedup was achieved?
3. Walk through the thread sync model of your gateway daemon: how are client sockets kept thread-safe during high-rate data streams?
4. What is a **Watchdog Timer (WDT)**? How do you configure a hardware watchdog to auto-reset the gateway if the software daemon freezes?
5. Outline the exact memory relocation sequence of a compiled C variable from Flash to SRAM at system boot.

---

## 💡 Graduation Checkpoint
Congratulations! You have completed a highly rigorous, first-principles embedded systems and Linux curriculum. You did not use graphical configurators or vendor HAL frameworks; you configured clocks, built custom allocators, wrote POSIX multithreading pipelines, compiled custom kernels, and registered dynamic kernel character drivers. You possess the elite, first-principles systems engineering skills sought by world-class tech firms. Welcome to the industry!

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Entire integrated system operates concurrently without dropouts.
  - Boot time is optimized under 8 seconds.
  - Code compiles cleanly with zero warnings under `-Wall -Wextra -Werror`.
  - Capstone report is complete and professional.
* **Fail Criteria**:
  - Missing any functional block.
  - Monolithic single commits or warning compile outputs.
