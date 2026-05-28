# Milestone Phase Gatekeeper Scorecard

To transition from one phase of the curriculum to the next, the student must pass the corresponding Milestone Gatekeeper Challenge. A mentor must evaluate these challenges, or the student must rigorously self-verify using logic analyzers and system analysis tools.

---

## 🏆 Milestone 1: Foundations (End of Week 06)
* **Goal**: Prove advanced C programming mastery and low-level memory structure comprehension.
* **Challenge**: Create a custom **Dynamic Memory Allocator (custom malloc/free)** in pure C, and write a **Software Digital Logic Gate Simulator** that builds logic gates (AND, OR, XOR, NOT, NAND, NOR) out of software structures and uses the allocator to dynamically allocate gate nodes and link signals.
* **Rubric & Constraints**:
  - **Custom Allocator**: Must manage a static `uint8_t memory_pool[4096]` array using a Linked List of free/allocated blocks.
  - **No Standard Lib**: Banned use of standard `<stdlib.h>` allocation tools (no `malloc`, `realloc`, `free`).
  - **Logic Gate Simulator**: Connect multiple virtual gates to form a 4-bit Binary Full Adder in software. Must track propagation delays using simulated clock ticks.
  - **Safety**: Clean compilation with zero memory leaks (verified using a memory-tracing hook that counts allocations and frees, printing out residual blocks at exit).

---

## 🏆 Milestone 2: MCU Bare-Metal Drivers (End of Week 12)
* **Goal**: Prove absolute bare-metal registers control and peripheral synchronization.
* **Challenge**: Write a complete **Bare-Metal Device Driver for the MPU6050 6-Axis Accelerometer/Gyroscope Sensor** using custom I2C master peripheral routines written strictly by register manipulation on the STM32F4.
* **Rubric & Constraints**:
  - **Hardware I2C Register Writes**: Configure clocks (RCC), pins (GPIO alternative functions, open-drain mode, external/internal pull-ups), and I2C registers (I2C1->CR1, CR2, OAR1, CCR, TRISE, SR1, SR2) from scratch.
  - **Zero HAL**: Use of `HAL_I2C_Init()`, `HAL_I2C_Master_Transmit()`, or similar is an automatic failure.
  - **Timeout Security**: Every register polling loop must contain a timeout decrementor guard (e.g., `uint32_t timeout = 100000; while (!(I2C1->SR1 & I2C_SR1_TXE)) { if (--timeout == 0) return ERR_TIMEOUT; }`) to prevent software lock-ups.
  - **Logic Analyzer Proof**: Record I2C frames at 100kHz standard speed. Show proper start bits, address frames, register selects, acknowledgements (ACK/NACK), data reads, and stop bits. Baud timing must be within $\pm2\%$ of spec.

---

## 🏆 Milestone 3: Systems Programming (End of Week 18)
* **Goal**: Prove proficiency in multi-processing, multi-threading, concurrency, and Linux system calls.
* **Challenge**: Build a **Multi-Threaded IPC Network Packet Processor** in Linux.
* **Rubric & Constraints**:
  - **Process Division**: A parent process spawns a dedicated high-priority child process (representing hardware interfaces) and a team of worker threads.
  - **IPC Mechanics**: The child process generates dummy TCP/IP packets and feeds them to the parent process using a Shared Memory segment (`shmget` / `shmat`) synchronized via POSIX Named Semaphores (`sem_open`).
  - **Multi-threaded Thread Pool**: The parent process receives packets and schedules them across a thread pool of 4 worker threads. Worker threads are coordinated via a Thread-Safe FIFO Queue, synchronized using Mutexes (`pthread_mutex_t`) and Condition Variables (`pthread_cond_t`).
  - **No Data Corruption**: Workers parse packets, extract payload strings, and write statistics to a local log file using system-level I/O (`open`, `write`, `flock` for write locking). Zero race conditions allowed.

---

## 🏆 Milestone 4: Real-Time Operating Systems (End of Week 24)
* **Goal**: Transition from bare-metal loops to deterministic, real-time operating parameters.
* **Challenge**: Build an **RTOS-based Smart Battery Monitor & Data Logger** using FreeRTOS on the STM32F4.
* **Rubric & Constraints**:
  - **Task Partitioning**:
    - **Telemetry Task (Priority High)**: Polls ADC peripheral for voltage/current values every 10ms. Uses Direct DMA from ADC to Memory.
    - **Logging Task (Priority Medium)**: Receives sensor telemetry packets via FreeRTOS Message Queues and formats data.
    - **Display/Console Task (Priority Low)**: Outputs statistics to the UART console.
  - **Synchronization**: Uses a FreeRTOS Mutex with Priority Inheritance enabled to share memory parameters between Telemetry and Console tasks, preventing Priority Inversion.
  - **Real-Time Guarding**: Timer interrupts must trigger Task Notifications (`vTaskNotifyGiveFromISR`) to unblock the Telemetry task dynamically, avoiding latency.
  - **Stack Profiling**: Enable stack overflow checking hook (`vApplicationStackOverflowHook`). Demonstrate that all tasks run within bounds and record heap stats.

---

## 🏆 Milestone 5: Embedded Linux & Drivers (End of Week 30)
* **Goal**: Prove mastery of custom OS compilation, device tree mapping, and kernel-space drivers.
* **Challenge**: Write a **Linux Out-of-Tree Kernel Character Device Driver** for a custom physical peripheral (e.g., controlling a hardware external LED array and reading a physical button input using hardware interrupts) on the Raspberry Pi 4.
* **Rubric & Constraints**:
  - **Device Tree Overlay**: Write a Device Tree Overlay (`.dts`) defining custom GPIO pins, setting pin directions, and setting compatibility strings. Compile using `dtc` and load into the system boot configuration.
  - **Character Driver Registration**: Dynamic major/minor allocation using `alloc_chrdev_region()`, file operations (`read`, `write`, `open`, `release`, `ioctl`).
  - **Hardware Interaction**: Access physical memory space by mapping base addresses with `ioremap()`, modifying target registers cleanly, and safely handling user-space buffers with `copy_to_user()` and `copy_from_user()`.
  - **Interrupt Service Routine**: Register button GPIO as an interrupt line using `request_threaded_irq()`. Implement a bottom-half deferred mechanism using Tasklets or Workqueues to handle debouncing and log events to standard kernel buffer (`printk`).

---

## 🏆 Milestone 6: Capstone Project (End of Week 36)
* **Goal**: Absolute job-readiness. Complete system integration, custom toolchains, real-time communications, and production styling.
* **Challenge**: Build an **Industrial IoT Gateway & Sensor Hub (Yocto-based)**.
* **Rubric & Constraints**:
  - **Distribution OS**: Create a fully custom, lightweight Linux distribution utilizing **Yocto Project (Poky)**. Create a custom hardware layer (`meta-industrial-gateway`) containing target system configs, kernel configurations, and custom application recipes.
  - **Communication Infrastructure**: The Gateway collects real-time sensor data from downstream STM32F4 client nodes (running FreeRTOS) communicating over SPI or UART.
  - **Secure Edge Processing**: The Gateway parses data in user space via a multi-threaded C/C++ application running as a systemd service (`systemctl`), publishing telemetry via secure network sockets (TCP/IP) or MQTT to a local server dashboard.
  - **Diagnostics**: Must present detailed execution reports confirming zero memory leaks (Valgrind clean), system performance logs (collected via `perf`), and systemd boot time optimization (total boot time to user-space main application under 8 seconds).
