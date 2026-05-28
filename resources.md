# Reference Manuals, Textbooks & Engineering Resources

This document is the master index of all critical reference manuals, textbooks, online resources, and documentation required during the 36-week curriculum. You should refer to these resources constantly.

---

## 📚 Essential Textbooks & Reference Literature

### Embedded C & Systems Foundations
1. **"The C Programming Language" (2nd Edition)** – *Brian W. Kernighan & Dennis M. Ritchie* (The absolute classic for C basics and layout).
2. **"Embedded C Coding Standard"** – *Michael Barr (Barr Group)* (A must-read for developing clean, bug-free, safe C code).
3. **"Making Embedded Systems: Design Patterns for Great Software"** – *Elecia White* (Excellent architectural design patterns).

### MCU Architecture & Hardware Development
1. **"The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors"** – *Joseph Yiu* (The absolute bible for understanding vector tables, registers, exceptions, and NVIC).
2. **"STM32F407 Reference Manual (RM0090)"** – *STMicroelectronics* (1700+ pages of registers, registers, and registers. You will read this weekly in Phase 2).
3. **"STM32F407G-DISC1 User Manual (UM1472)"** – *STMicroelectronics* (Pinouts, board layout, and schematics).

### Linux & Systems Programming
1. **"The Linux Programming Interface (TLPI)"** – *Michael Kerrisk* (1500+ pages. The absolute authority on Linux system calls, processes, threads, memory, and sockets).
2. **"Linux System Programming"** – *Robert Love* (Practical systems programming, filesystems, and process model).
3. **"Advanced Programming in the UNIX Environment (APUE)"** – *W. Richard Stevens* (Crucial for deep POSIX threading and sockets).

### RTOS (Real-Time Operating Systems)
1. **"Mastering the FreeRTOS Real Time Kernel"** – *Real Time Engineers Ltd.* (The official and excellent user guide for FreeRTOS architectures).

### Embedded Linux & Kernel Drivers
1. **"Mastering Embedded Linux Programming" (3rd Edition)** – *Chris Simmonds* (Excellent overview of U-Boot, Bootloaders, Buildroot, and Yocto).
2. **"Linux Device Drivers" (3rd Edition)** – *Jonathan Corbet, Alessandro Rubini, & Greg Kroah-Hartman* (A bit older but still the classic conceptual reference for character drivers, locking, and memory maps).
3. **"Linux Kernel Programming"** – *Kaiwan N Billimoria* (Modern kernel internals, memory management, and writing robust modules).

---

## 🛠️ Software Toolchains & Utilities

### Microcontroller Toolchain
* **Compiler**: GCC Cross-Compiler for ARM Cortex-M: `gcc-arm-none-eabi`.
* **Debugger Engine**: OpenOCD (Open On-Chip Debugger) – acts as a GDB server bridge to the physical ST-LINK hardware interface.
* **GDB Multiarch**: `gdb-multiarch` or `arm-none-eabi-gdb` – for physical source-level debugging inside terminal or IDE.
* **Logic Analyzer Suite**: Sigrok & PulseView – open-source software for analyzing physical bus logic captured on a logic analyzer.

### Linux Systems Tools
* **Debugging & Memory Tracing**: `gdb` (GNU Debugger), `valgrind` (memory leak and access checker), `ltrace` (library calls), `strace` (system calls).
* **System Metrics & Hardware Checks**: `lsof` (list open files), `ldd` (list dynamic library dependencies), `nm` (dump symbols from object file), `objdump` (disassemble and analyze binary structures).

---

## 📡 Essential Hardware Datasheets

To write registers driver code, you must keep the following datasheets pinned in your browser tabs:
* **STM32F407xx Datasheet (DS8626)**: Pin definitions, electrical characteristics, memory sizes.
* **STM32F407xx Reference Manual (RM0090)**: Exhaustive details on register maps, bits, clock controls (RCC), GPIO, UART, SPI, I2C, interrupts.
* **MPU6050 Register Map and Description**: Required for Phase 2 Milestone, defining the I2C registers to configure registers, scales, and fetch raw accelerations/gyroscopes data.
* **ARMv7-M Architecture Reference Manual**: Specific details on core registers, NVIC logic, assembly instructions, sleep modes.

---

## 🌐 Elite Online Communities & Reference Blogs
* **Interrupt by Memfault** (`interrupt.memfault.com`): The finest technical blog on embedded debugging, CI/CD, and advanced firmware patterns.
* **Embedded FM Podcast** (`embedded.fm`): Great conceptual discussions and developer interviews.
* **Kernel.org Documentation** (`kernel.org/doc/html/latest/`): Direct documentation for the Linux Kernel, driver interfaces, Device Tree syntax.
