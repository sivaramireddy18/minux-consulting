# Master Roadmap: 36-Week Embedded Systems & Linux curriculum

This document provides a birds-eye timeline of the entire 36-week program, broken down into six major phases. Each phase represents a thematic block ending in a gatekeeper milestone challenge.

---

## 📅 High-Level Phase Overview

| Phase | Duration | Focus Area | Capstone Gateway |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Weeks 01–06 | C Programming & Digital Logic | Custom Allocator & Software Logic Gate Simulator |
| **Phase 2** | Weeks 07–12 | Cortex-M MCU Bare-Metal Drivers | Full Bare-Metal I2C Peripheral Driver (MPU6050) |
| **Phase 3** | Weeks 13–18 | Systems Programming & Linux Toolchain | Multi-Threaded IPC Network Packet Processor |
| **Phase 4** | Weeks 19–24 | Real-Time Operating Systems (RTOS) | FreeRTOS-Based Data Logger with Interrupt-to-Task DMA |
| **Phase 5** | Weeks 25–30 | Embedded Linux & Kernel Modules | Linux Kernel Driver for HW Peripheral with Sysfs & Interrupts |
| **Phase 6** | Weeks 31–36 | Buildroot, Yocto & Production Capstone | Yocto-built Real-time Sensor Gateway with Remote Web/API Interface |

---

## 🗺️ Weekly Curriculum Timeline

### Phase 1: Foundations of Embedded C & Digital Logic (Weeks 01–06)
* **Goal**: Establish ironclad C programming skills, repo hygiene, development environments, and a foundational understanding of hardware logic and memory mapping.
* **Week 01**: Dev Environment Setup, Git Workflows, and Conventional Commits.
* **Week 02**: Digital Logic Refresh, Number Systems (Bin, Hex, Oct), Logical Operators & Gates.
* **Week 03**: Embedded C Fundamentals: Types, Constants, Volatile, Compilation Pipeline.
* **Week 04**: Advanced Pointers, Memory Layout of C, and Dynamic Allocations.
* **Week 05**: Bitwise Operations, Bitfields, and Register Manipulation Techniques.
* **Week 06**: Structs, Unions, Typedefs, Memory Padding/Alignment, and the C Preprocessor.
* **Milestone 1 Gatekeeper Check**: Complete and defend Phase 1 Milestone.

### Phase 2: MCU Architecture & Bare-Metal Driver Development (Weeks 07–12)
* **Goal**: Master ARM Cortex-M architecture, read technical datasheets, register-map calculations, and write custom peripheral drivers without HALs.
* **Week 07**: ARM Cortex-M4 Architecture, Vector Table, Memory Map, Registers.
* **Week 08**: GPIO Driver Development (Clocks, Pins, Electrical configurations).
* **Week 09**: Nested Vectored Interrupt Controller (NVIC), Exceptions, Race Conditions.
* **Week 10**: Timers & Counters (SysTick, General Purpose, Input Capture, Output Compare).
* **Week 11**: Communication Protocols I: UART (Baud Rate, Polling, Interrupts, Ring Buffers).
* **Week 12**: Communication Protocols II: I2C & SPI (Timings, Master/Slave, Register maps).
* **Milestone 2 Gatekeeper Check**: Complete and defend Phase 2 Milestone.

### Phase 3: Systems Programming & Linux Essentials (Weeks 13–18)
* **Goal**: Transition to Linux environments, command line mastery, compiling mechanics, low-level I/O, IPCs, and concurrency.
* **Week 13**: Linux OS Command Line Mastery, FHS, and System Configuration.
* **Week 14**: Compiler Toolchains: GCC, Makefiles, Linker Scripts, ELF File Anatomy.
* **Week 15**: Low-Level System Call File I/O (`open`, `read`, `write`, `ioctl`, `mmap`).
* **Week 16**: Linux Process Control (`fork`, `exec`, `wait`, IPC: Pipes, FIFOs, Shared Memory).
* **Week 17**: POSIX Threads (`pthread`, Mutexes, Semaphores, Thread Safety, Race Conditions).
* **Week 18**: Linux Shell Scripting & Automation (Bash, `sed`, `awk`, Performance tools).
* **Milestone 3 Gatekeeper Check**: Complete and defend Phase 3 Milestone.

### Phase 4: Real-Time Operating Systems (RTOS) (Weeks 19–24)
* **Goal**: Shift from polling loops to real-time scheduling, concurrency, resource allocation, and synchronization under FreeRTOS.
* **Week 19**: Introduction to RTOS, FreeRTOS Port, Task Creation, Idle Task.
* **Week 20**: Task Scheduler, Co-operative vs Preemptive, Context Switch Mechanics.
* **Week 21**: Task Synchronization: Binary/Counting Semaphores, Mutexes, Priority Inversion.
* **Week 22**: Inter-Task Communication: Message Queues, Event Groups, Task Notifications.
* **Week 23**: Memory Management (heap_1 to heap_5), Memory Profiling, Stack Overflow Protection.
* **Week 24**: Software Timers, ISR-to-Task Communication (`FromISR` APIs), RTOS Debugging.
* **Milestone 4 Gatekeeper Check**: Complete and defend Phase 4 Milestone.

### Phase 5: Embedded Linux & Kernel Drivers (Weeks 25–30)
* **Goal**: Build custom Embedded Linux architectures, compile kernels, construct device trees, and write physical kernel-space drivers.
* **Week 25**: Embedded Linux Architecture & Boot Flow (ROM, SPL, U-Boot, Kernel, Rootfs).
* **Week 26**: Cross-Compilation, Custom Kernel Compilation, Serial Consoles, Boot Log Analysis.
* **Week 27**: Device Trees (DTS/DTSI/DTC), Nodes, Properties, Custom Device Bindings.
* **Week 28**: Linux Kernel Modules (Build rules, LKM structure, Parameters, `printk`).
* **Week 29**: Character Drivers (FOPs, Major/Minor, Class, Dev Nodes, Kernel I/O buffers).
* **Week 30**: Kernel Hardware Access (GPIO, Memory Map, Virtual Memory, Kernel Interrupts).
* **Milestone 5 Gatekeeper Check**: Complete and defend Phase 5 Milestone.

### Phase 6: Buildroot, Yocto, & Advanced Capstone (Weeks 31–36)
* **Goal**: Master system integration engines, debug production systems, write network socket layers, and deliver a production capstone product.
* **Week 31**: Rootfs Automation with Buildroot (Configs, overlays, package generation).
* **Week 32**: Production-grade OS Creation with Yocto (BitBake, Recipes, Layers, Classes).
* **Week 33**: Real-World Peripheral Integration: Analog-to-Digital (ADC) & PWM Drivers.
* **Week 34**: Network Programming (Socket API, TCP/UDP client-server, embedded HTTP/REST).
* **Week 35**: Advanced Debugging & Profiling (Valgrind, GDB Server, Strace, LDD, NM, Perf).
* **Week 36**: Capstone Project Delivery, Portfolio Defense, System Design Mock Interviews.
* **Milestone 6 Gatekeeper Check**: Capstone evaluation and graduation.

---

## 🏆 Graduation and Career Readiness
Upon passing all 6 Milestone Gatekeeper evaluations, you will undergo target resume customization, comprehensive LinkedIn profiling, and mock technical grilling sessions centered strictly around the real hardware and kernel driver modules built over the course of this training program.
