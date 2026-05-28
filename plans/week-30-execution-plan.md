# Weekly Execution Plan: Week 30

## 🎯 Weekly Goal
Master physical hardware access inside Linux Kernel Drivers, understand memory-mapped I/O mapping using `ioremap()`, read and write device control registers safely inside kernel space, configure GPIO pins directly from drivers, and register hardware interrupts in the kernel.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Physical Hardware Linux Kernel Driver** on their embedded target. They will have mapped physical hardware base registers, configured a physical GPIO output pin to toggle an LED, registered a physical button GPIO as an interrupt source inside the kernel, and successfully completed the Phase 5 Milestone Challenge.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Kernel Memory-Mapped I/O (`ioremap`)
* **Conceptual Objective**: Master memory-mapped I/O inside kernel space. Understand that to access physical hardware registers, the driver must explicitly map the physical base addresses of the SoC peripherals into the kernel's virtual memory map using `ioremap()`.
* **Practical Activity**: remap target base register addresses and set up clean unmappings.
* **Code/Circuit Reference**:
```c
#include <asm/io.h>

void __iomem *gpio_base = NULL;

static int map_hardware(void) {
    gpio_base = ioremap(0xFE200000, 256);
    if (gpio_base == NULL) {
        printk(KERN_ERR "HWDRV: ioremap failed.\n");
        return -ENOMEM;
    }
    return 0;
}
```

### Tuesday: Kernel Register Reads & Writes (readl/writel)
* **Conceptual Objective**: Study register access functions. You must never read/write remapped memory-mapped pointers using direct C pointer assignments. You must use standardized kernel register access macros (`readl`, `writel`).
* **Code/Circuit Reference**:
```c
#define GPSET0_OFFSET 0x1C 

void set_gpio_pin(void) {
    uint32_t reg_val = readl(gpio_base + GPSET0_OFFSET);
    reg_val |= (1U << 18);
    writel(reg_val, gpio_base + GPSET0_OFFSET);
}
```

### Wednesday: The Kernel GPIO Subsystem (Legacy vs Modern gpiod)
* **Conceptual Objective**: Study the standardized kernel GPIO subsystem framework designed to abstract SoC-specific register maps. Request pins (`gpio_request()`), configure directions (`gpio_direction_output()`), and write pin states.
* **Code/Circuit Reference**:
```c
#include <linux/gpio.h>
#define LED_GPIO 18

static int init_gpio(void) {
    if (gpio_request(LED_GPIO, "sys_led") < 0) return -1;
    gpio_direction_output(LED_GPIO, 0);
    return 0;
}
```

### Thursday: Hardware Interrupts in Kernel Space
* **Conceptual Objective**: Master the registration of hardware interrupts inside kernel space. Convert a physical GPIO pin into a kernel-compatible Interrupt Request (IRQ) number using `gpio_to_irq()` and attach an ISR callback using `request_irq()`.
* **Code/Circuit Reference**:
```c
#include <linux/interrupt.h>
#define BTN_GPIO 23

static irqreturn_t button_isr(int irq, void *dev_id) {
    printk(KERN_INFO "HWDRV: Interrupt Triggered inside Kernel!\n");
    return IRQ_HANDLED;
}
```

### Friday: Interrupt Bottom-Halves (Tasklets vs Workqueues)
* **Conceptual Objective**: Differentiate execution contexts inside kernel interrupts. A kernel ISR must run extremely fast and must *never* sleep. Slow tasks must be deferred to the bottom-half: Tasklets (softirq context) or Workqueues (kernel thread context). Launch the Phase 5 Milestone Challenge.

---

## 🛠️ Hands-On Assignment: Physical LED and Button Interrupt Kernel Driver

### Functional Requirements
Create a fully functional, out-of-tree Linux Character Device Driver that maps physical hardware pins, controls a physical LED, and registers a physical button as a hardware interrupt source inside the kernel.
1. The driver must compile as a loadable module `hardware_driver.ko`.
2. Upon initialization:
   - Dynamically allocate character major/minor regions and register `/dev/hw_ctrl` node class.
   - Request physical LED GPIO pin (e.g., GPIO18) as output.
   - Request physical Button GPIO pin (e.g., GPIO23) as input.
   - Convert Button GPIO to an IRQ number, and register a kernel ISR triggered on **Falling Edges** (active-low transition).
3. The kernel ISR must:
   - Print notifications to kernel log circular buffers (`printk`).
   - Toggle the state of the physical LED pin instantly.
4. Implement clean error rollbacks. If interrupt registration fails, request releases of all acquired GPIO pins and dynamically free major/minor character spaces.
5. In the module exit cleanup function, release the IRQ channel (`free_irq`) and release the GPIO pins (`gpio_free`) to prevent hardware pin lockups.
6. Test on target hardware, press the button, and verify instant LED toggle response, tracking log outputs inside `dmesg`.

### Structural Requirements & Code Skeleton
**`hardware_driver.c`**:
```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/gpio.h>
#include <linux/interrupt.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Embedded Kernels Dev");
MODULE_DESCRIPTION("LED and Button Interrupt Driver");
MODULE_VERSION("1.0");

#define LED_PIN 18
#define BTN_PIN 23

static dev_t dev_num;
static struct cdev char_cdev;
static struct class *dev_class = NULL;
static struct device *dev_device = NULL;

static int button_irq = -1;
static bool led_state = false;

static irqreturn_t button_isr(int irq, void *dev_id) {
    led_state = !led_state;
    gpio_set_value(LED_PIN, led_state ? 1 : 0);
    printk(KERN_INFO "HW_CTRL: Interrupt! Toggled LED state to: %s\n", led_state ? "ON" : "OFF");
    return IRQ_HANDLED;
}

static int dev_open(struct inode *inodep, struct file *filep) { return 0; }
static int dev_release(struct inode *inodep, struct file *filep) { return 0; }

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = dev_open,
    .release = dev_release,
};

static int __init hw_driver_init(void) {
    if (alloc_chrdev_region(&dev_num, 0, 1, "hw_ctrl") < 0) return -1;

    cdev_init(&char_cdev, &fops);
    if (cdev_add(&char_cdev, dev_num, 1) < 0) goto r_unreg;

    dev_class = class_create("hw_ctrl_class");
    if (IS_ERR(dev_class)) goto r_cdev;

    dev_device = device_create(dev_class, NULL, dev_num, NULL, "hw_ctrl");
    if (IS_ERR(dev_device)) goto r_class;

    if (gpio_request(LED_PIN, "sys_led") < 0) goto r_device;
    gpio_direction_output(LED_PIN, 0);

    if (gpio_request(BTN_PIN, "sys_btn") < 0) goto r_led;
    gpio_direction_input(BTN_PIN);
    gpio_set_debounce(BTN_PIN, 200); 

    button_irq = gpio_to_irq(BTN_PIN);
    if (request_irq(button_irq, button_isr, IRQF_TRIGGER_FALLING, "hw_ctrl_btn", NULL) < 0) goto r_btn;

    printk(KERN_INFO "HW_CTRL: Custom Hardware Driver Loaded successfully.\n");
    return 0;

r_btn:
    gpio_free(BTN_PIN);
r_led:
    gpio_free(LED_PIN);
r_device:
    device_destroy(dev_class, dev_num);
r_class:
    class_destroy(dev_class);
r_cdev:
    cdev_del(&char_cdev);
r_unreg:
    unregister_chrdev_region(dev_num, 1);
    return -1;
}

static void __exit hw_driver_exit(void) {
    free_irq(button_irq, NULL);
    gpio_free(BTN_PIN);
    gpio_set_value(LED_PIN, 0); 
    gpio_free(LED_PIN);
    
    device_destroy(dev_class, dev_num);
    class_destroy(dev_class);
    cdev_del(&char_cdev);
    unregister_chrdev_region(dev_num, 1);
    printk(KERN_INFO "HW_CTRL: Driver Unloaded cleanly.\n");
}

module_init(hw_driver_init);
module_exit(hw_driver_exit);
```
