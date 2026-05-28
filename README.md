# Master Curriculum: Beginner-to-Job-Ready Embedded Systems & Linux (36-Week Program)

Welcome to the ultimate, highly rigorous training curriculum designed to transition a fresh Electronics and Communication Engineering (ECE) or Computer Science Engineering (CSE) graduate into a production-capable, highly competitive Embedded Systems and Linux Engineer.

---

## 🎯 Target Goal
By the end of this 36-week program, you will not just know concepts; you will have written bare-metal peripheral drivers for ARM Cortex-M microcontrollers, built real-time scheduling applications using FreeRTOS, written multi-threaded Unix systems programming solutions, compiled custom Linux kernels and device trees, created custom distributions using Buildroot and Yocto, and developed functional Linux character device drivers.

---

## 📂 Workspace Directory Layout
This repository is structured to mirror professional software development environments. Every week, module, and configuration is modularized:

```text
/home/siva/sivaramireddy/Project1/
├── README.md                          # Curriculum Overview, Hardware checklist & Onboarding (This file)
├── trainer-operating-rules.md         # The pedagogical "constitution" and review rules for mentors
├── 36-week-roadmap.md                 # Timeline breakdown across 6 major milestones
├── weekly-trainer-template.md         # Template used to maintain weekly plan consistency
├── daily-study-tracker.md             # Standardized daily execution and reflection sheet
├── habit-scorecard.md                 # Accountability matrix tracking code-style & professional discipline
├── milestone-scorecard.md             # Pass/fail rubric gatekeepers for each phase transition
├── resources.md                       # Comprehensive guide to datasheets, textbooks, and software
└── plans/                             # The core execution engine (36 weekly master plans)
    ├── week-01-execution-plan.md      # Phase 1: Git & Dev Setup
    ├── week-02-execution-plan.md      # Digital Logic & Number Systems
    ├── ...
    └── week-36-execution-plan.md      # Phase 6: Final Capstone & Job Readiness
```

---

## 🛠️ Hardware Requirements (Target Development Kit)
To complete this curriculum successfully, you will need physical hardware. Simulation is discouraged for peripheral interfacing.
1. **Host Computer**: A workstation running a native Linux distribution (preferably Ubuntu 22.04 LTS or Debian 12), or a macOS/Windows machine running Ubuntu 22.04 LTS via a dedicated virtual machine or Dual Boot. Windows WSL2 is acceptable but requires advanced USB-IP mapping for hardware debugging.
2. **Microcontroller Board**: **STM32F407G-DISC1** (Discovery board with STM32F407VG MCU, ARM Cortex-M4 with FPU) or **NUCLEO-F429ZI**. These are highly documented industry-standard boards.
3. **Embedded Linux Board**: **Raspberry Pi 4 Model B (4GB or 8GB)** or **BeagleBone Black (BBB)**. Both are excellent for device tree, custom kernel, and driver development.
4. **Debugging and Prototyping Gear**:
   - FTDI USB-to-UART TTL Serial Adapter (e.g., FT232RL or CH340G).
   - 8-Channel USB Logic Analyzer (24MHz sampling rate, compatible with Sigrok/PulseView).
   - High-quality solderless breadboard, premium jumper wires (M-M, M-F, F-F).
   - I2C peripheral (e.g., MPU6050 6-Axis Accelerometer/Gyro or BMP280 Barometric Pressure Sensor).
   - SPI peripheral (e.g., RC522 RFID module or a SPI OLED Display SSD1306).
   - Standard electronics toolkit: Multimeter, resistors (220Ω, 1kΩ, 10kΩ), LEDs, tactile pushbuttons.

---

## 💻 Software Prerequisites (Host Setup)
We will install and configure all of these tools during the first two weeks of the curriculum:
- **Build Utilities**: `build-essential`, `gcc`, `g++`, `make`, `cmake`.
- **Cross-Compilation Toolchains**: `gcc-arm-none-eabi` (for bare-metal), `gcc-aarch64-linux-gnu` / `gcc-arm-linux-gnueabihf` (for Embedded Linux target).
- **Embedded Debugging Tools**: `openocd`, `gdb-multiarch`, `minicom`, `picocom`, `screen`.
- **System Analysis & Diagnostics**: `strace`, `ltrace`, `ldd`, `nm`, `objdump`, `readelf`, `valgrind`, `htop`, `wireshark`.
- **Version Control & Repository Discipline**: `git`, `github-cli` (optional).
- **Embedded Linux Environment**: `buildroot`, `yocto` (poky repository), `u-boot-tools`.

---

## 🚀 How to Utilize This Curriculum
1. **Consult the Roadmap**: Open [36-week-roadmap.md](file:///home/siva/sivaramireddy/Project1/36-week-roadmap.md) to understand the long-term scope and milestones.
2. **Fill in Trackables Daily**: Every morning, copy the template in [daily-study-tracker.md](file:///home/siva/sivaramireddy/Project1/daily-study-tracker.md) to log your work, and update your [habit-scorecard.md](file:///home/siva/sivaramireddy/Project1/habit-scorecard.md).
3. **Execute Weekly Plans**: Enter the `plans/` folder and open the corresponding execution plan for the week. Follow the day-by-day instructions precisely.
4. **Grading Gatekeepers**: At the end of each milestone phase (6 weeks), you must complete the practical assignment defined in [milestone-scorecard.md](file:///home/siva/sivaramireddy/Project1/milestone-scorecard.md) and have it reviewed by a mentor or cross-checked against the *Trainer Operating Rules*.

---

## 🎓 The Educational Philosophy
This program operates under a **no-black-box** policy:
- **No HAL Libraries**: You will not use CubeMX HAL or Arduino-style libraries during the micro-controller phase. You will configure clocks, timers, and serial channels by direct register writes using pointers and memory-mapped register offsets based strictly on target datasheets and reference manuals.
- **No Pre-Packaged Kernels**: You will not use standard pre-built Linux distributions. You will fetch the mainline Linux kernel and U-boot source code, write a custom device tree, cross-compile the architecture, and structure a custom Root Filesystem from scratch.
- **Strict Coding Standards**: Every C file must conform to MISRA-C guidelines (where appropriate) and be checked with static analysis tools. Commits must be atomic and follow conventional commit styling.

Let the journey to becoming a world-class systems engineer begin!
