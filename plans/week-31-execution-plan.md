# Weekly Execution Plan: Week 31

## 🎯 Weekly Goal
Master automated Root Filesystem (Rootfs) generation using the **Buildroot** build system, configure custom system overlays, add custom C applications as packages, and generate lightweight, minimal flashable operating system images.

## 🏆 Weekly Outcome
By Friday, the student will have built a fully custom, lightweight **Embedded Linux Image** (total size under 30MB) using Buildroot. They will have configured system initialization scripts, integrated custom user-space packages, and flashed and booted their custom system successfully on target hardware.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Buildroot Paradigm & Workspace Setup
* **Conceptual Objective**: Differentiate manual rootfs construction (copying library files and compiling busybox by hand) from automated build engines. Understand that Buildroot is a simple, efficient, and easy-to-use tool that utilizes standard **Kconfig (menuconfig)** structures to automate the cross-compilation of cross-toolchains, bootloaders, kernels, and root filesystems.
* **Practical Activity**:
  1. Clone the mainline stable Buildroot repository.
  2. Explore directory trees (`configs/`, `package/`, `system/`, `fs/`).
  3. Load the target default SoC configuration.
* **Code/Circuit Reference**:
```bash
# Clone Buildroot stable branch
git clone git://git.buildroot.net/buildroot --depth 1 --branch 2023.02.x
cd buildroot

# Load target board configuration (e.g., Raspberry Pi 4)
make raspberrypi4_64_defconfig
```

### Tuesday: Buildroot Menuconfig & Custom Packages Selection
* **Conceptual Objective**: Master the interactive Buildroot configuration utility. Learn how to configure target system parameters (architecture, toolchains), select pre-built third-party user-space libraries and packages (e.g., OpenSSH, python, sqlite), and configure system logins/passwords.
* **Practical Activity**:
  1. Open the interactive config menu.
  2. Enable toolchain options (compiler parameters).
  3. Enable required third-party system debug utilities (such as `strace`, `htop`, `gdb`).
* **Code/Circuit Reference**:
```bash
# Launch interactive configuration menu
make menuconfig

# Inside menuconfig:
# Target options -> Target Architecture (AArch64)
# Toolchain -> Toolchain type (Buildroot toolchain) -> C library (glibc)
# Target packages -> Debugging, profiling and benchmark -> Enable strace, gdb, htop
# System configuration -> System password (set to "root")
```

### Wednesday: System Directory Overlays & Init Configurations
* **Conceptual Objective**: Understand that compiled filesystems are generic. To add custom configuration files (e.g., custom network configs inside `/etc/network/interfaces` or startup scripts in `/etc/init.d/`), you must use **System Directory Overlays**. An overlay is a host directory structure copied directly on top of the generated rootfs before the final flash image is packed.
* **Practical Activity**:
  1. Create a custom overlay folder mapping target directories.
  2. Configure a startup shell script that automatically runs at boot.
* **Code/Circuit Reference**:
```bash
# Create custom overlay inside buildroot root directory
mkdir -p my_overlay/etc/init.d/
mkdir -p my_overlay/usr/bin/

# Write startup service script
cat << 'EOF' > my_overlay/etc/init.d/S99telemetry
#!/bin/sh
case "$1" in
  start)
    echo "Starting custom telemetry daemon..."
    /usr/bin/telemetry_daemon &
    ;;
  stop)
    killall telemetry_daemon
    ;;
esac
exit 0
EOF
chmod +x my_overlay/etc/init.d/S99telemetry
```

### Thursday: Compiling Custom Packages in Buildroot
* **Conceptual Objective**: Learn how to add a custom C application as a compiled package inside Buildroot. Understand that Buildroot requires a package directory inside `package/` containing:
  - **`Config.in`**: Defines the package selection option in menuconfig.
  - **`package.mk`**: The Makefile script describing where to fetch source code and how to compile and install binaries.
* **Practical Activity**:
  1. Create a custom package directory `package/telemetry/`.
  2. Write the Kconfig and Makefile scripts, enable it in menuconfig, and compile.
* **Code/Circuit Reference**:
```makefile
# package/telemetry/telemetry.mk
TELEMETRY_VERSION = 1.0
TELEMETRY_SITE = $(subst ",,$(BR2_EXTERNAL_TELEMETRY_PATH))/src
TELEMETRY_SITE_METHOD = local

define TELEMETRY_BUILD_CMDS
	$(MAKE) CC="$(TARGET_CC)" LD="$(TARGET_LD)" -C $(@D)
endef

define TELEMETRY_INSTALL_TARGET_CMDS
	$(INSTALL) -D -m 0755 $(@D)/telemetry_daemon $(TARGET_DIR)/usr/bin/telemetry_daemon
endef

$(eval $(generic-package))
```

### Friday: Target Flashing and Booting
* **Conceptual Objective**: Master image compilation and SD media formatting. When compilation completes, Buildroot generates flashable files inside `output/images/`:
  - `rootfs.tar`: The uncompressed rootfs.
  - `sdcard.img`: A pre-partitioned, single-file flash image containing both boot and rootfs partitions.
* **Practical Activity**:
  1. Trigger full system compilation.
  2. Flash the compiled `sdcard.img` directly to an SD card using the `dd` command, boot your target, and verify.
* **Code/Circuit Reference**:
```bash
# Compile everything from scratch (takes 1-2 hours on first run!)
make

# Flash final image to SD card cleanly
sudo dd if=output/images/sdcard.img of=/dev/sdX bs=4M conv=fsync status=progress
```

---

## 🛠️ Hands-On Assignment: Minimal Custom OS with Boot Daemon

### Functional Requirements
Create a fully custom, lightweight Linux operating system using Buildroot that automatically boots, logs in as root, and launches a custom compiled C telemetry daemon.
1. Download Buildroot and configure it for your target board.
2. Integrate a custom **System Directory Overlay** that:
   - Configures a static IP address in `/etc/network/interfaces`.
   - Places a custom startup init script `S99telemetry` inside `/etc/init.d/`.
3. Create a custom user-space package `telemetry` containing a simple C program `telemetry_daemon.c` that loops writing system status logs to a local file `/var/log/telemetry.log` every 5 seconds.
4. Enable the custom package inside `make menuconfig`.
5. Compile the system to generate a final `sdcard.img` under 50MB.
6. Flash the image, boot the board, and verify that the C daemon is running as a background service and successfully logging data.

### Structural Requirements & Code Skeleton
**`package/telemetry/Config.in`**:
```kconfig
config BR2_PACKAGE_TELEMETRY
    bool "telemetry"
    help
      Installs a custom background telemetry daemon.
```

**`package/telemetry/src/telemetry_daemon.c`**:
```c
#include <stdio.h>
#include <unistd.h>
#include <time.h>

int main(void) {
    FILE *log = fopen("/var/log/telemetry.log", "a");
    if (!log) return 1;

    while (1) {
        time_t now = time(NULL);
        fprintf(log, "[TELEMETRY LOG] Time: %s", ctime(&now));
        fflush(log);
        sleep(5);
    }
    fclose(log);
    return 0;
}
```

---

## 📦 Deliverables
* [ ] Custom Buildroot package configuration files (`Config.in`, `telemetry.mk`).
* [ ] Telemetry daemon C source code `telemetry_daemon.c`.
* [ ] Verification log `boot_run.log` from target serial console proving startup.

---

## ❓ Self-Check Questions
1. Differentiate the roles of **Buildroot** versus standard **Yocto Project**. Under what architectural specifications is Buildroot preferred?
2. What are **System Directory Overlays**? Why are they highly efficient for placing local configuration files into target filesystems?
3. Walk through the role of the variables `TARGET_CC` and `TARGET_DIR` inside Buildroot package Makefile scripts.
4. Why is a tar archive of rootfs (`rootfs.tar`) produced? How do you manually unpack it onto a target SD card partition?
5. How does busybox integrate multiple standard system tools (like `ls`, `grep`, `cd`) inside a single dynamic executable binary?

---

## 🚀 Stretch Task (Optional)
Extend the Buildroot configuration to compile and bundle a custom **Linux Out-of-tree Kernel Module** dynamically during the system build run, loading it automatically at boot.

## 💡 Motivation Checkpoint
Commercial IoT gateways, routers, and automotive ECUs do not run standard desktop OS images. They run minimal, secured, and lightning-fast custom operating systems compiled directly from source. Mastering automated build engines like Buildroot is a core requirement for production-level embedded Linux developers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Buildroot compiles cleanly, producing a flashable `sdcard.img`.
  - Core image boots cleanly to login shell.
  - Custom C daemon starts automatically as a background systemd/init service.
* **Fail Criteria**:
  - Image size exceeds 100MB (indicates unnecessary bloated packages).
  - Unhandled script errors during compilation.
