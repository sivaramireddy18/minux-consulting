# Weekly Execution Plan: Week 28

## 🎯 Weekly Goal
Master the mechanics of writing, compiling, loading, and debugging Linux Loadable Kernel Modules (LKMs), understand the difference between user space and kernel space memory contexts, and write dynamic parameter interfaces.

## 🏆 Weekly Outcome
By Friday, the student will have written and compiled a custom **Linux Kernel Module (`.ko`)** from scratch. They will understand kernel module signatures, how to load and unload them dynamically via shell utilities (`insmod`, `rmmod`), pass input parameters dynamically at loading, and trace print outputs inside the kernel ring buffer (`dmesg`).

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Kernel Space vs User Space Memory Contexts
* **Conceptual Objective**: Master the fundamental separation between User Space (unprivileged, virtual memory isolated per process, cannot access hardware directly) and Kernel Space (privileged, shared flat memory, direct hardware control). Understand that kernel code must be written with extreme discipline: a single NULL pointer dereference inside a kernel module will not crash a simple process—it triggers a **Kernel Panic** or **Oops**, halting the entire operating system.
* **Practical Activity**:
  1. Sketch a virtual memory diagram showing the user/kernel space division.
  2. Study kernel programming constraints (no standard library `<stdio.h>` or `<stdlib.h>`, must use `<linux/init.h>` and `<linux/kernel.h>`).
* **Code/Circuit Reference**:
```text
Operating System Execution Contexts:
+---------------------------------------------------------+
| User Space: Processes (Virtual Memory page mapped)      |
|  - Banned direct I/O or raw register accesses.           |
+---------------------------------------------------------+
| [System Call Interface Gateway]                        |
+---------------------------------------------------------+
| Kernel Space: Shared Flat Memory (Direct Execution)      |
|  - Custom Modules, Memory Page Allocator, Core Scheduler  |
+---------------------------------------------------------+
```

### Tuesday: The Anatomy of a Kernel Module (`init` & `exit` hooks)
* **Conceptual Objective**: Study the entry and exit lifecycles of a Loadable Kernel Module (LKM). Understand:
  - **`module_init()`**: Specifies the initialization function executed when the module is loaded.
  - **`module_exit()`**: Specifies the cleanup function executed when the module is unloaded.
  - **License declarations**: `MODULE_LICENSE("GPL")` is mandatory to prevent tainting the kernel.
* **Practical Activity**:
  1. Write a minimal "Hello World" kernel module.
  2. Map out the kernel header requirements.
* **Code/Circuit Reference**:
```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Senior Mentor");
MODULE_DESCRIPTION("A minimal LKM skeleton");
MODULE_VERSION("0.1");

static int __init my_module_init(void) {
    printk(KERN_INFO "LKM: Initialized successfully.\n");
    return 0; // Success
}

static void __exit my_module_exit(void) {
    printk(KERN_INFO "LKM: Unloaded cleanly.\n");
}

module_init(my_module_init);
module_exit(my_module_exit);
```

### Wednesday: Compiling Kernel Modules (Kbuild & Makefiles)
* **Conceptual Objective**: Learn how kernel modules compile. Because kernel modules execute inside the kernel context, they must compile using the **Kbuild** build system of the target kernel source tree. You cannot compile a kernel module using standard host GCC pipelines.
* **Practical Activity**:
  1. Write a custom out-of-tree `Makefile` designed to target active kernel source trees.
  2. Compile your module and verify the generation of the `.ko` (Kernel Object) binary.
* **Code/Circuit Reference**:
```makefile
# Professional Kernel Module Makefile
obj-m += my_module.o

# KDIR points to host active kernel headers or custom cross-compiled kernel directory
KDIR ?= /lib/modules/$(shell uname -r)/build

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean
```

### Thursday: Kernel Logging via `printk` & Shell Commands
* **Conceptual Objective**: Understand that kernel modules cannot call `printf()` (which relies on standard C library user-space stdout). You must use **`printk`**—the kernel logging system. Study log levels (`KERN_EMERG`, `KERN_ERR`, `KERN_WARNING`, `KERN_INFO`, `KERN_DEBUG`). Master terminal shell utilities: `insmod` (insert module), `rmmod` (remove module), `lsmod` (list loaded modules), `modinfo` (inspect module details), and `dmesg` (read kernel circular log buffer).
* **Practical Activity**:
  1. Load your compiled `.ko` module.
  2. Monitor the dmesg output in real-time inside a separate shell terminal.
* **Code/Circuit Reference**:
```bash
# Monitor kernel logs continuously
sudo dmesg -w

# Insert module
sudo insmod my_module.ko

# Check loaded modules status
lsmod | grep my_module

# Remove module
sudo rmmod my_module
```

### Friday: Passing Parameters dynamically (`module_param`)
* **Conceptual Objective**: Learn how to pass input parameters dynamically to a kernel module at runtime (e.g., configuring hardware IRQ lines or debug settings during `insmod`). Study `module_param()` and permissions masks.
* **Practical Activity**:
  1. Declare module parameters inside your code.
  2. Insert the module with custom arguments and verify that parameter values are captured.
* **Code/Circuit Reference**:
```c
static int debug_level = 0;
// Parameter: Variable Name, Type (int, charp), Permission (Sysfs read/write)
module_param(debug_level, int, 0660); 
MODULE_PARM_DESC(debug_level, "Debug logging level (0-3)");
```

---

## 🛠️ Hands-On Assignment: Custom Telemetry Parameter LKM

### Functional Requirements
Create a fully functional, out-of-tree Linux Loadable Kernel Module that manages dynamic input parameters, checks system limits, and logs footprints safely inside the kernel space.
1. The module must be named `telemetry_lkm.c`.
2. Define three dynamic parameters:
   - **`sensor_id`** (int) - Default value `100`.
   - **`log_interval_ms`** (int) - Default `1000`.
   - **`device_name`** (charp) - Default `"dummy-sensor"`.
3. In `module_init`:
   - Print a clean welcome log including author details.
   - Print the values of all three parameters.
   - If `log_interval_ms` is negative or exceeds `10000`, print an error log using `KERN_ERR` and return `EINVAL` (Error Invalid Argument) to **prevent the module from loading**.
4. In `module_exit`:
   - Print a clean shutdown log indicating successful unmapping.
5. Provide a Makefile that supports out-of-tree compilation targeting the host system kernel.
6. Test loading the module with different parameter configurations and verify logs using `dmesg`.

### Structural Requirements & Code Skeleton
**`telemetry_lkm.c` (C-Skeleton)**:
```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/moduleparam.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Embedded Mentor");
MODULE_DESCRIPTION("LKM Telemetry Parameter Driver");
MODULE_VERSION("1.0");

static int sensor_id = 100;
static int log_interval_ms = 1000;
static char* device_name = "dummy-sensor";

module_param(sensor_id, int, 0660);
MODULE_PARM_DESC(sensor_id, "Unique ID of the sensor");

module_param(log_interval_ms, int, 0660);
MODULE_PARM_DESC(log_interval_ms, "Sampling log interval in milliseconds");

module_param(device_name, charp, 0660);
MODULE_PARM_DESC(device_name, "Name string of the device");

static int __init telemetry_init(void) {
    printk(KERN_INFO "TELEMETRY: Loading module...\n");
    
    // Bounds Check
    if (log_interval_ms < 10 || log_interval_ms > 10000) {
        printk(KERN_ERR "TELEMETRY: ERROR: Invalid log_interval_ms %d (Range: 10-10000)\n", log_interval_ms);
        return -EINVAL; // Prevents loading!
    }

    printk(KERN_INFO "TELEMETRY: Device Name  : %s\n", device_name);
    printk(KERN_INFO "TELEMETRY: Sensor ID    : %d\n", sensor_id);
    printk(KERN_INFO "TELEMETRY: Interval     : %d ms\n", log_interval_ms);
    return 0;
}

static void __exit telemetry_exit(void) {
    printk(KERN_INFO "TELEMETRY: Module unloaded cleanly. Goodbye!\n");
}

module_init(telemetry_init);
module_exit(telemetry_exit);
```

---

## 📦 Deliverables
* [ ] Kernel module source file `telemetry_lkm.c`.
* [ ] Compilation `Makefile`.
* [ ] Capture trace log file `dmesg_run.log` showing:
  - Welcome prints with custom parameters on success.
  - Rejection prints and shell outputs when attempting to load with invalid interval parameters (`sudo insmod telemetry_lkm.ko log_interval_ms=99999`).

---

## ❓ Self-Check Questions
1. Why does code running inside Kernel Space have the power to destroy the system upon simple pointer corruption, whereas User-Space application crashes are isolated?
2. Why can you not use standard header libraries like `<stdio.h>` or call functions like `printf()` inside a Linux kernel module?
3. Walk through the role of the Kbuild Makefile structure. What does the variable flag `obj-m += my_module.o` tell the compilation engine?
4. How do you return error states in `module_init` to programmatically reject module loading? Give a standard error macro example.
5. What is the role of `lsmod`? Where does the utility query this information dynamically in the filesystem?

---

## 🚀 Stretch Task (Optional)
Extend the telemetry module to expose the parameters dynamically inside `/sys/module/telemetry_lkm/parameters/`. Demonstrate that you can read and write the values of the parameters from the user space shell using `cat` and `echo`.

## 💡 Motivation Checkpoint
Standard application developers compile packages that run on top of operating systems. But embedded systems engineers *write* the operating system interfaces. When a new custom board comes from the manufacturing line, you must write the kernel integration code to route peripherals dynamically. Mastering Loadable Kernel Modules is the baseline of kernel development.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Module compiles cleanly using target Kbuild systems.
  - Parameter checks successfully block loading on invalid ranges, returning `EINVAL` to `insmod`.
  - Kernel circular buffer traces confirm prints.
* **Fail Criteria**:
  - Memory leaks or pointer corruptions that trigger kernel Oops.
  - Bypassing standard Kbuild compile rules.
