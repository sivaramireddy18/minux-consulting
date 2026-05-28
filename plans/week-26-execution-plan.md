# Weekly Execution Plan: Week 26

## 🎯 Weekly Goal
Master cross-compilation mechanics, build a dedicated cross-compilation workspace, fetch mainline Linux kernel source code, compile a custom kernel and device trees from source, and boot it on your target hardware.

## 🏆 Weekly Outcome
By Friday, the student will have compiled a custom **Linux Kernel Image (`zImage`/`Image`)** and matching **Device Tree Blob (`.dtb`)** for their target board (e.g., Raspberry Pi or BeagleBone) from source. They will have loaded it onto an SD card, connected a serial debug cable, and successfully booted their custom kernel to a command-line init prompt.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Cross-Compilation Paradigm
* **Conceptual Objective**: Master the differences between **Native Compilation** (compiling code on the host, for execution on the same host, e.g., x86 compiler on x86 PC) and **Cross-Compilation** (compiling code on the host, for execution on a completely different target architecture, e.g., compiling ARM64 binaries on an Intel x86 host). Study target triplets (e.g., `aarch64-linux-gnu-gcc`).
* **Practical Activity**:
  1. Set up cross-compilers on host: `sudo apt update && sudo apt install -y gcc-aarch64-linux-gnu gcc-arm-linux-gnueabihf bc u-boot-tools libncurses-dev libssl-dev bison flex`.
  2. Differentiate dynamic linkages inside cross-compiled objects using `file` and `readelf`.
* **Code/Circuit Reference**:
```bash
# Verify cross-compiler toolchain
aarch64-linux-gnu-gcc --version

# Differentiate dynamic libraries dependencies
aarch64-linux-gnu-readelf -d build/my_arm_app
```

### Tuesday: Fetching Kernel Sources & Defconfig Configurations
* **Conceptual Objective**: Understand that the Linux kernel is configurable: you can compile specific features (network protocols, filesystems, device drivers) directly into the kernel, or compile them as loadable modules (`.ko`), or strip them out to minimize binary footprint. Learn how configurations are managed via `.config` files and target presets (`defconfig`).
* **Practical Activity**:
  1. Clone the mainline stable Linux kernel source repository.
  2. Locate the default configurations directory (`arch/arm/configs/` or `arch/arm64/configs/`).
  3. Load the target default config (e.g., `bcm2711_defconfig` for Raspberry Pi 4).
* **Code/Circuit Reference**:
```bash
# Clone Linux Kernel (shallow clone to save space)
git clone --depth 1 --branch rpi-6.1.y https://github.com/raspberrypi/linux.git
cd linux

# Configure for Target Board (Raspberry Pi 4)
# ARCH specifies target architecture; CROSS_COMPILE defines prefix
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- bcm2711_defconfig
```

### Wednesday: Modifying Kernels via `menuconfig`
* **Conceptual Objective**: Master interactive kernel configuration tools (`menuconfig`). Learn how to navigate the textual menu system to enable/disable kernel parameters, toggle drivers between built-in (`[*]`) and module (`[M]`) formats, and set custom local kernel version tags.
* **Practical Activity**:
  1. Open the interactive config screen using `make menuconfig`.
  2. Locate and enable support for custom USB serial devices.
  3. Append a personalized string to `CONFIG_LOCALVERSION`.
* **Code/Circuit Reference**:
```bash
# Launch interactive configuration menu
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- menuconfig

# Inside menuconfig:
# General setup -> Local version - append to kernel release: "-siva-custom-v1"
# Device Drivers -> USB support -> USB Serial Converter support -> Enable FTDI
```

### Thursday: Compiling Kernel, Modules, and DTBs
* **Conceptual Objective**: Master the compilation commands of the Linux kernel. Understand what files are produced:
  - **`Image` / `zImage`**: The compiled, uncompressed or compressed executable kernel binary.
  - **Device Tree Blobs (`.dtb`)**: The compiled hardware descriptions.
  - **Kernel Modules (`.ko`)**: Dynamic driver files compiled out-of-tree.
* **Practical Activity**:
  1. Run multi-threaded kernel compilation.
  2. Compile all device tree blobs.
* **Code/Circuit Reference**:
```bash
# Compile Kernel, Device Trees, and Modules (using 8 parallel CPU cores)
make -j8 ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- Image modules dtbs

# Locate compiled outputs
# Kernel: arch/arm64/boot/Image
# DTB: arch/arm64/boot/dts/broadcom/bcm2711-rpi-4-b.dtb
```

### Friday: Formatting Boot Media & First Target Boot
* **Conceptual Objective**: Learn how to partition and format flash media (SD Card) to boot your custom system. Partition into a FAT32 boot partition (holds U-Boot/SPL, kernel `Image`, and `.dtb`) and an ext4 rootfs partition. Configure standard config boot parameters.
* **Practical Activity**:
  1. Insert an SD card and create partitions using `fdisk`.
  2. Copy compiled kernel `Image` and matching `bcm2711-rpi-4-b.dtb` to the boot partition.
  3. Connect serial debug converter wires to the target board TX/RX pins, open serial minicom console on host, power on target, and watch your custom kernel boot cleanly.
* **Code/Circuit Reference**:
```bash
# Mount SD card boot partition
sudo mount /dev/sdX1 /mnt/boot

# Copy compiled outputs
sudo cp arch/arm64/boot/Image /mnt/boot/kernel8.img
sudo cp arch/arm64/boot/dts/broadcom/bcm2711-rpi-4-b.dtb /mnt/boot/bcm2711-rpi-4-b.dtb

# Unmount cleanly to sync caches
sudo umount /mnt/boot
```

---

## 🛠️ Hands-On Assignment: Custom Compiled Kernel Boot & Log Verification

### Functional Requirements
Compile a custom Linux kernel from source, boot it on your target board, and verify your configurations inside the running terminal.
1. Download, configure, and compile a stable Linux kernel for your target board from source.
2. Customize `CONFIG_LOCALVERSION` to contain a custom string (e.g., `-custom-mentor-v1`).
3. Compile all required Device Tree Blobs.
4. Partition an SD card, copy the compiled kernel and DTB, and boot the target board.
5. Connect via Serial Debugger. Once booted, enter the terminal (or check boot parameters) and execute `uname -r` to verify your custom kernel version string is active.
6. Retrieve the active kernel config from `/proc/config.gz` (or `/boot/config-*`) and verify that your custom-enabled drivers are active.

### Structural Requirements & Code Skeleton
**Kernel Verification Pipeline**:
```bash
# 1. Check kernel release version in booted system terminal
uname -r
# Output must match: e.g., 6.1.21-custom-mentor-v1

# 2. Check active boot command parameters
cat /proc/cmdline

# 3. Verify driver module presence
lsmod | grep -i ftdi || echo "FTDI compiled as built-in or inactive"
```

---

## 📦 Deliverables
* [ ] Detailed compilation steps text file `compile_steps.txt`.
* [ ] Compiled target kernel image `Image` (or `zImage`).
* [ ] Output verification screenshots showing the `uname -r` command execution on the physical target terminal.

---

## ❓ Self-Check Questions
1. Why can you not execute a standard GCC compiled binary (e.g., `gcc main.c -o main`) compiled on your host PC inside your ARM-based Raspberry Pi?
2. What are the roles of `-j8` or `-j$(nproc)` flags during compilation runs? What is the impact on compile speed?
3. Differentiate between compiling a device driver as **Built-in (`*`)** versus compiling it as a **Module (`M`)**. How does the kernel load modules dynamically?
4. What is the role of `/proc/config.gz`? How do you enable this feature inside kernel configurations?
5. Explain what target triplets (e.g., `arm-linux-gnueabihf`) represent. Identify the meaning of each word.

---

## 🚀 Stretch Task (Optional)
Modify the kernel configurations to **disable** all unnecessary network and multimedia drivers, reducing the compiled kernel `Image` footprint size by at least $40\%$. Measure and compare the boot timings of the minimal kernel versus the default build.

## 💡 Motivation Checkpoint
Standard Linux distributions (like Raspberry Pi OS or Debian) are bloated, packed with drivers for devices you will never connect, and slow to boot. When designing professional medical devices, smart vehicle gateways, or industrial controllers, you must compile minimal, secured, and highly optimized custom kernels tailored strictly to your specific target hardware.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Custom kernel compiles successfully without errors.
  - Target system boots successfully over serial line.
  - `uname -r` matches the customized local version tag.
* **Fail Criteria**:
  - Kernel panic on boot due to missing device tree configurations.
  - Bypassed compilation stages.
