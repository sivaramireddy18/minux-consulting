# Weekly Execution Plan: Week 25

## 🎯 Weekly Goal
Master the high-level architecture of Embedded Linux systems, understand the complete, multi-stage hardware boot sequence from power-on reset to user-space main application launch, and analyze U-Boot bootloader configurations.

## 🏆 Weekly Outcome
By Friday, the student will have dissected a physical **Linux Boot Log** captured from a serial console. They will be able to explain the roles of ROM Boot, SPL (Secondary Program Loader), U-Boot, Kernel unpacking, Device Tree loading, and the transitioning of control to the `init` process in rootfs.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Four Pillars of Embedded Linux
* **Conceptual Objective**: Understand that unlike microcontrollers (where code is compiled into a single binary running on bare-metal), an Embedded Linux system is composed of four distinct, independent software blocks:
  1. **Toolchain**: The compiler suite targeting the specific hardware architecture.
  2. **Bootloader**: Initializes memory and boots the OS.
  3. **Linux Kernel**: Manages processes, virtual memory, and hardware drivers.
  4. **Root Filesystem (Rootfs)**: Contains user-space libraries, configurations, and applications.
* **Practical Activity**:
  1. Sketch a block diagram showing how these four components interact.
  2. Define the architectural boundaries of each component.
* **Code/Circuit Reference**:
```text
Embedded Linux System Stack:
+-------------------------------------------------------------+
| User Space: Applications, Shells, Libraries (libc), Init    |
+-------------------------------------------------------------+
| Kernel Space: System Call VFS, Sched, Drivers, Device Tree  |
+-------------------------------------------------------------+
| Hardware Layer: CPU, SDRAM, Flash, UART, GPIO Peripherals   |
+-------------------------------------------------------------+
```

### Tuesday: The Multi-Stage Boot Flow (ROM to U-Boot)
* **Conceptual Objective**: Master the exact boot stages of an embedded processor (e.g., ARM Cortex-A):
  - **Stage 1 (ROM Code)**: Hardcoded in silicon. Powers on, initializes basic clocks, searches for boot media (SD card, eMMC, NAND), loads the next stage into internal SRAM, and runs it.
  - **Stage 2 (SPL / Secondary Program Loader)**: A minimal bootloader (like U-Boot SPL). Initializes DRAM memory, loads the full bootloader (U-Boot) from flash/SD into DRAM, and jumps to it.
  - **Stage 3 (Full Bootloader - U-Boot)**: Fully initializes buses, USB, Ethernet. Provides an interactive command line shell. Loads the Linux Kernel (`uImage` or `zImage`) and the Device Tree Blob (`.dtb`) into RAM.
* **Practical Activity**:
  1. Study U-Boot configuration setups.
  2. Draw the step-by-step memory relocation maps of U-Boot.
* **Code/Circuit Reference**:
```text
Multi-Stage Boot Relocation:
[Power On] 
   |
   v
[ROM Code] ------(Loads SPL into SRAM)------> [SPL (Internal RAM)]
                                                    |
                                          (Initializes DRAM)
                                                    |
                                                    v
                                           [U-Boot (DDR SDRAM)]
```

### Wednesday: U-Boot Shell Operations & Environment Control
* **Conceptual Objective**: Learn how to operate the interactive U-Boot serial console. Master core U-Boot commands: listing files (`ext4ls`, `fatls`), reading memory (`md`, `mw`), loading binaries into RAM (`fatload`, `tftp`), and configuring environment parameters (`printenv`, `setenv`, `saveenv`). Understand the `bootcmd` environment variable.
* **Practical Activity**:
  1. Connect a serial console to your target board (Raspberry Pi/BBB).
  2. Interrupt the boot sequence to enter the U-Boot shell.
  3. Manually modify boot parameters to alter configurations.
* **Code/Circuit Reference**:
```bash
# U-Boot Shell commands
# List files on fat partition of MMC 0
fatls mmc 0:1

# Load kernel zImage into DRAM offset 0x82000000
fatload mmc 0:1 0x82000000 zImage

# Set custom boot command and save permanently
setenv bootcmd "fatload mmc 0:1 0x82000000 zImage; fatload mmc 0:1 0x88000000 board.dtb; bootz 0x82000000 - 0x88000000"
saveenv
```

### Thursday: The Kernel Initialization Phase & Device Trees
* **Conceptual Objective**: Study what the Linux Kernel does when U-Boot branches to its execution entry point (`bootz` or `bootm`). The kernel:
  1. Unpacks itself in RAM.
  2. Initializes virtual memory, page tables, and scheduler ticks.
  3. Parses the **Device Tree Binary (DTB)** to locate and initialize hardware peripherals.
  4. Mounts the **Root Filesystem (Rootfs)** specified by the `bootargs` variable.
* **Practical Activity**:
  1. Trace kernel init logs.
  2. Differentiate how `bootargs` directs the mount target (e.g., `root=/dev/mmcblk0p2 rootwait rw`).
* **Code/Circuit Reference**:
```bash
# Example bootargs configuration passed by U-Boot to Kernel
setenv bootargs "console=ttyS0,115200 root=/dev/mmcblk0p2 rootwait rw earlyprintk"
```

### Friday: Entering User Space (The Init Process)
* **Conceptual Objective**: Understand the exact transition from Kernel space to User space. Once the kernel mounts the root filesystem, it spawns the first user-space process: `/sbin/init` (PID 1). Init reads system configuration tables (Systemd, SystemV init scripts, or busybox `inittab`), spawns system services, and launches login shell terminals.
* **Practical Activity**:
  1. Analyze a complete, raw Linux boot log.
  2. Isolate and highlight the exact transitions between ROM, U-Boot, Kernel init, and User-space Init launch.
* **Code/Circuit Reference**:
```bash
# Trace output in serial boot log showing user space entry:
[    3.456789] VFS: Mounted root (ext4 filesystem) on device 179:2.
[    3.468200] devtmpfs: mounted
[    3.475412] Freeing unused kernel memory: 1024K
[    3.489020] Run /sbin/init as init process
Starting syslogd: OK
Starting klogd: OK
```

---

## 🛠️ Hands-On Assignment: Linux Boot Log Dissector & Analyzer

### Functional Requirements
Create a robust automated text-parsing pipeline using standard Linux scripting utilities (`grep`, `sed`, `awk`) to analyze a raw, 1000-line Linux Boot Log and generate a detailed system health diagnostic report.
1. The analysis tool must be a Bash script `dissect_boot.sh` parsing a raw boot log text file `boot.log` as a parameter.
2. The script must parse, isolate, and output:
   - **Bootloader Details**: Extract the U-Boot compile date, version number, and detected DRAM size.
   - **Kernel Details**: Extract the Linux Kernel version and the boot arguments (`bootargs` command line).
   - **Peripheral Enumeration**: Scan and list all detected hardware peripherals (extract lines mapping I2C, SPI, UART, and MMC controllers initialization).
   - **Timing Latency Calculations**: Locate the timestamp of the first kernel log line and the timestamp of the `/sbin/init` user-space launch. Calculate the exact elapsed time (in seconds) the kernel took to boot.
   - **Failure & Warnings Audit**: Scan the log for any line containing `"fail"`, `"error"`, `"warning"`, or `"corrupt"`. Isolate them cleanly and list them under a warning block.
3. Output the parsed metrics cleanly to a report file `boot_analysis_report.txt`.

### Structural Requirements & Code Skeleton
**`dissect_boot.sh` (Shell Skeleton)**:
```bash
#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <boot_log_file>"
    exit 1
fi

BOOT_LOG="$1"
REPORT="boot_analysis_report.txt"

echo "=== Embedded Linux Boot Log Analysis ===" > "$REPORT"
echo "Log File: $BOOT_LOG" >> "$REPORT"
echo "Timestamp: $(date)" >> "$REPORT"
echo "========================================" >> "$REPORT"

# 1. Extract U-Boot Metadata
echo "[1] Bootloader Info:" >> "$REPORT"
grep -i "U-Boot" "$BOOT_LOG" | head -n 2 >> "$REPORT" || echo "No U-Boot signature" >> "$REPORT"
grep -iE "dram:|ram:|memory:" "$BOOT_LOG" | head -n 1 >> "$REPORT" || true
echo "----------------------------------------" >> "$REPORT"

# 2. Extract Kernel Version & Bootargs
echo "[2] Linux Kernel Info:" >> "$REPORT"
grep -i "Linux version" "$BOOT_LOG" | head -n 1 >> "$REPORT" || echo "No kernel version found" >> "$REPORT"
grep -i "Kernel command line" "$BOOT_LOG" | head -n 1 >> "$REPORT" || true
echo "----------------------------------------" >> "$REPORT"

# 3. Calculate Boot Latency using awk
echo "[3] Kernel Boot Latency:" >> "$REPORT"
awk '
BEGIN { first = -1; last = -1; }
/^\[[ ]*[0-9]+\.[0-9]+/ {
    split($1, parts, "[][]");
    val = parts[2];
    if (first == -1) first = val;
    last = val;
}
END {
    if (first != -1 && last != -1) {
        printf "First Kernel Log: %.6f seconds\n", first;
        printf "Last Kernel Log (User space entry): %.6f seconds\n", last;
        printf "Total Kernel Execution Duration: %.6f seconds\n", (last - first);
    }
}
' "$BOOT_LOG" >> "$REPORT"
echo "----------------------------------------" >> "$REPORT"

# 4. Extract Peripherals
echo "[4] Detected Hardware Peripherals:" >> "$REPORT"
grep -iE 'i2c|spi|uart|mmc' "$BOOT_LOG" | grep -vE 'command line' | sort -u | head -n 15 >> "$REPORT" || true
echo "----------------------------------------" >> "$REPORT"

# 5. Warnings and Errors
echo "[5] Warnings & Errors Detected during Boot:" >> "$REPORT"
grep -inE 'fail|error|warning|corrupt' "$BOOT_LOG" | head -n 20 >> "$REPORT" || echo "No warnings detected" >> "$REPORT"

cat "$REPORT"
```

---

## 📦 Deliverables
* [ ] Automated script `dissect_boot.sh`.
* [ ] Sample boot log file `boot.log` containing raw console logs.
* [ ] Generated diagnostics output report `boot_analysis_report.txt`.

---

## ❓ Self-Check Questions
1. Why does an embedded processor require a multi-stage boot process (ROM -> SPL -> U-Boot)? Why can ROM code not load the kernel directly?
2. What is the role of the U-Boot environment variable `bootcmd`? How does it differ from the `bootargs` variable?
3. How does the Linux Kernel locate hardware peripherals during boot? What is the function of the Device Tree Blob (`.dtb`) in this process?
4. What is the first process launched in user-space by the kernel? What is its Process ID (PID)?
5. How can you capture serial boot logs physically from an embedded target? What hardware tools and configurations are required?

---

## 🚀 Stretch Task (Optional)
Extend the boot log dissector to parse standard **systemd boot-up performance** logs (`systemd-analyze plot`) and generate a graphical timing chart isolating slow system startup scripts.

## 💡 Motivation Checkpoint
When an embedded product locks up, crashes, or fails to boot in the field, there is no monitor or debugger attached. You must diagnose failures strictly by connecting a serial debug line, dumping the raw console logs, and analyzing where the boot sequence broke down. Mastering bootlog diagnostics is a core skill for any systems developer.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Script successfully parses boot timelines.
  - Latency math is calculated accurately using awk.
  - Zero unhandled exit failures inside script logic.
* **Fail Criteria**:
  - Direct shell crashes when parsing empty search fields.
