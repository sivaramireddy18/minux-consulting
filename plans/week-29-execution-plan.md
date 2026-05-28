# Weekly Execution Plan: Week 29

## 🎯 Weekly Goal
Master the architecture of Linux Character Device Drivers, understand Major and Minor numbers, configure device classes, implement the `file_operations` structure, and safely transfer memory buffers between user-space and kernel-space address blocks.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Linux Character Device Driver** from scratch. They will understand how physical virtual device nodes (e.g., `/dev/my_sensor`) are registered, how user-space systems calls (`open`, `read`, `write`, `close`) map directly to driver functions, and how to verify driver data flows safely.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Character Device Paradigm & Major/Minor Numbers
* **Conceptual Objective**: Master character device driver designs. Understand that a character device handles data streams sequentially byte-by-byte (like serial ports, keypads, or virtual devices). Learn about **Major Numbers** (identifies the specific driver linked to the device) and **Minor Numbers** (identifies individual physical device instances managed by that driver).
* **Practical Activity**:
  1. Study dynamic allocation APIs: `alloc_chrdev_region()` (allocates major/minor numbers dynamically) and `unregister_chrdev_region()`.
  2. Inspect `/proc/devices` to locate loaded character drivers major offsets.
* **Code/Circuit Reference**:
```c
#include <linux/fs.h>

dev_t dev_num; // Holds 32-bit major/minor number combined

static int __init chrdev_init(void) {
    // Dynamically allocate 1 device number starting at minor 0
    int ret = alloc_chrdev_region(&dev_num, 0, 1, "my_char_device");
    if (ret < 0) {
        printk(KERN_ERR "CHDEV: Failed to allocate device numbers.\n");
        return ret;
    }
    printk(KERN_INFO "CHDEV: Major = %d, Minor = %d\n", MAJOR(dev_num), MINOR(dev_num));
    return 0;
}
```

### Tuesday: File Operations (`file_operations` structure)
* **Conceptual Objective**: Master the **`file_operations` (fops)** structure—the core translation matrix of driver development. Understand how the kernel routes user-space system calls (`open()`, `read()`, `write()`, `close()`) executing on a device file to your matching driver implementation function pointers.
* **Practical Activity**:
  1. Define individual driver implementations for open, read, write, and release.
  2. Construct the `file_operations` structure, mapping it to your custom functions.
* **Code/Circuit Reference**:
```c
static int dev_open(struct inode *inodep, struct file *filep);
static int dev_release(struct inode *inodep, struct file *filep);
static ssize_t dev_read(struct file *filep, char __user *buffer, size_t len, loff_t *offset);
static ssize_t dev_write(struct file *filep, const char __user *buffer, size_t len, loff_t *offset);

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = dev_open,
    .read = dev_read,
    .write = dev_write,
    .release = dev_release,
};
```

### Wednesday: Character Device Registration (`cdev`)
* **Conceptual Objective**: Study the `cdev` structure—the kernel's internal representation of a character device. Learn how to initialize `cdev` with your `file_operations` and register it inside kernel tables using `cdev_add()`.
* **Practical Activity**:
  1. Integrate `cdev` variables inside your module.
  2. Implement proper cleanup structures inside `module_exit` to remove the device cleanly.
* **Code/Circuit Reference**:
```c
#include <linux/cdev.h>

struct cdev my_cdev;

static int register_cdev(void) {
    cdev_init(&my_cdev, &fops);
    my_cdev.owner = THIS_MODULE;
    // Add 1 device starting at dev_num
    int ret = cdev_add(&my_cdev, dev_num, 1);
    return ret;
}
```

### Thursday: Memory Segregation & Data Copy Utilities
* **Conceptual Objective**: Master the strict memory boundaries of operating systems. User-space programs use virtual pointers that cannot be accessed directly by the kernel driver without security risks. To transfer data safely, you must use kernel memory copy routines:
  - **`copy_to_user()`**: Copies data from kernel-space buffer to user-space buffer.
  - **`copy_from_user()`**: Copies data from user-space buffer to kernel-space buffer.
* **Practical Activity**:
  1. Deep-dive into buffer bounds checks.
  2. Write safe data copy blocks verifying return checks.
* **Code/Circuit Reference**:
```c
static ssize_t dev_read(struct file *filep, char __user *buffer, size_t len, loff_t *offset) {
    char message[] = "Hello User Space!";
    size_t msg_len = sizeof(message);
    
    if (*offset >= msg_len) return 0; // EOF reached
    
    // copy_to_user returns 0 on complete success, or number of uncopied bytes
    if (copy_to_user(buffer, message + *offset, msg_len - *offset) != 0) {
        return -EFAULT; // Bad address error
    }
    
    *offset += msg_len;
    return msg_len;
}
```

### Friday: Dynamic Device Nodes Creation (`sysfs` & `class`)
* **Conceptual Objective**: Understand that in modern Linux systems, you do not create physical device nodes (e.g., `/dev/my_device`) manually using `mknod` commands. The kernel manages **Classes** (`sysfs`). Creating a device class (`class_create()`) and device parent (`device_create()`) triggers the system daemon **`udevd`** to automatically generate the physical `/dev/` file node upon module insertion.
* **Practical Activity**:
  1. Implement device class creation and device registers inside your module.
  2. Load module and verify the dynamic appearance of your `/dev/` node.
* **Code/Circuit Reference**:
```c
#include <linux/device.h>

static struct class* my_class = NULL;
static struct device* my_device = NULL;

static int init_sysfs(void) {
    // 1. Create class
    my_class = class_create("my_sensor_class");
    
    // 2. Create device (triggers udev to create /dev/my_sensor)
    my_device = device_create(my_class, NULL, dev_num, NULL, "my_sensor");
    return 0;
}

static void cleanup_sysfs(void) {
    device_destroy(my_class, dev_num);
    class_destroy(my_class);
}
```

---

## 🛠️ Hands-On Assignment: Virtual Ring Buffer Character Driver

### Functional Requirements
Create a fully operational, robust Linux Character Device Driver that implements a virtual character buffer, allowing user-space applications to read and write bytes safely.
1. The driver must compile as a loadable module `vbuf_driver.ko`.
2. Upon initialization:
   - Dynamically allocate Major/Minor numbers.
   - Create a device class `vbuf_class` and a device node `/dev/vbuf`.
   - Allocate a static internal kernel memory buffer of 1024 bytes.
3. Implement file operations:
   - **`open`**: Print a diagnostic log inside the kernel buffer.
   - **`write`**: Receive data from a user-space string using `copy_from_user()`, write it into the internal kernel buffer up to limits, and update the write pointer offset.
   - **`read`**: Copy data from the internal kernel buffer to the user-space buffer using `copy_to_user()`, update the read offset, and return the exact byte length.
   - **`release`**: Print diagnostic exit messages.
4. Implement clean error checks. If any step in module initialization fails, rollback all previous registrations (e.g., destroy device, destroy class, unregister region) in reverse order to prevent memory leak corruptions.
5. Write a user-space test program `test_driver.c` that writes a message string into `/dev/vbuf` and reads it back to confirm functional loopback operation.

### Structural Requirements & Code Skeleton
**`vbuf_driver.c` (C-Skeleton)**:
```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Embedded System Architect");
MODULE_DESCRIPTION("Virtual Buffer Character Driver");
MODULE_VERSION("1.0");

#define DEVICE_NAME "vbuf"
#define BUF_SIZE 1024

static dev_t dev_num;
static struct cdev char_cdev;
static struct class *dev_class = NULL;
static struct device *dev_device = NULL;

static char kernel_buffer[BUF_SIZE];
static size_t data_len = 0;

static int dev_open(struct inode *inodep, struct file *filep) {
    printk(KERN_INFO "VBUF: Device opened.\n");
    return 0;
}

static int dev_release(struct inode *inodep, struct file *filep) {
    printk(KERN_INFO "VBUF: Device closed.\n");
    return 0;
}

static ssize_t dev_read(struct file *filep, char __user *buffer, size_t len, loff_t *offset) {
    size_t to_copy = (len < (data_len - *offset)) ? len : (data_len - *offset);
    if (to_copy == 0) return 0; // EOF

    if (copy_to_user(buffer, kernel_buffer + *offset, to_copy) != 0) {
        return -EFAULT;
    }
    *offset += to_copy;
    return to_copy;
}

static ssize_t dev_write(struct file *filep, const char __user *buffer, size_t len, loff_t *offset) {
    size_t to_copy = (len < (BUF_SIZE - *offset)) ? len : (BUF_SIZE - *offset);
    if (to_copy == 0) return -ENOMEM; // Out of memory

    if (copy_from_user(kernel_buffer + *offset, buffer, to_copy) != 0) {
        return -EFAULT;
    }
    *offset += to_copy;
    data_len = *offset;
    return to_copy;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = dev_open,
    .release = dev_release,
    .read = dev_read,
    .write = dev_write,
};

static int __init vbuf_init(void) {
    // 1. Allocate device numbers
    if (alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME) < 0) return -1;

    // 2. Initialize cdev
    cdev_init(&char_cdev, &fops);
    if (cdev_add(&char_cdev, dev_num, 1) < 0) goto r_class;

    // 3. Create class
    dev_class = class_create("vbuf_class");
    if (IS_ERR(dev_class)) goto r_cdev;

    // 4. Create device node
    dev_device = device_create(dev_class, NULL, dev_num, NULL, DEVICE_NAME);
    if (IS_ERR(dev_device)) goto r_device;

    printk(KERN_INFO "VBUF: Driver loaded. /dev/%s active.\n", DEVICE_NAME);
    return 0;

r_device:
    class_destroy(dev_class);
r_cdev:
    cdev_del(&char_cdev);
r_class:
    unregister_chrdev_region(dev_num, 1);
    return -1;
}

static void __exit vbuf_cleanup(void) {
    device_destroy(dev_class, dev_num);
    class_destroy(dev_class);
    cdev_del(&char_cdev);
    unregister_chrdev_region(dev_num, 1);
    printk(KERN_INFO "VBUF: Driver unloaded.\n");
}

module_init(vbuf_init);
module_exit(vbuf_cleanup);
```

---

## 📦 Deliverables
* [ ] Character driver source file `vbuf_driver.c`.
* [ ] User test application `test_driver.c`.
* [ ] Compilation `Makefile`.
* [ ] Terminal capture verification log demonstrating successful execution of writing a string from the user test into `/dev/vbuf` and reading it back cleanly.

---

## ❓ Self-Check Questions
1. Why can a user-space application not access the memory address of a kernel driver directly using a standard C pointer? Explain the memory isolation boundaries of the operating system.
2. What are the roles of Major and Minor numbers? How do you map major allocations dynamically?
3. Walk through the parameter variables of the `file_operations` write function. What is the role of `loff_t *offset`?
4. What is the consequence if the kernel module initialization fails and you forget to execute dynamic unregistrations (rollback) of previously allocated memory region pools?
5. How does the `udevd` system daemon automatically capture `device_create()` outputs to generate dynamic physical nodes in `/dev/`?

---

## 🚀 Stretch Task (Optional)
Extend the virtual character driver to support the **`ioctl` system call interface**: implement custom control commands that allow the user-space test application to wipe the internal kernel buffer or query memory usage parameters.

## 💡 Motivation Checkpoint
Inside any operating system, character device drivers are the bridge to the physical world. Whether you are interfacing an industrial UART controller, a custom FPGA data register, or reading sensor buses, you must write character drivers to route the raw bytes to the user space cleanly. Mastering character drivers is standard requirement for kernel engineers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Driver successfully registers Major/Minor numbers dynamically.
  - Dynamically creates `/dev/vbuf` node upon insertion.
  - Memory copy operations check all bounds and prevent heap overflows.
  - Zero warnings compiled using Kbuild.
* **Fail Criteria**:
  - Direct pointer dereferences crossing user-kernel space boundaries without `copy_to/from_user`.
  - System lock-up due to unreleased dynamic allocations on failure rollbacks.
