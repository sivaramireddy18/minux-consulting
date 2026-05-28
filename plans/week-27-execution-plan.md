# Weekly Execution Plan: Week 27

## 🎯 Weekly Goal
Master the Linux Device Tree specification, understand the syntax of Device Tree Source (`.dts`) and Include (`.dtsi`) files, compile device trees using the Device Tree Compiler (`dtc`), and write custom peripheral node definitions.

## 🏆 Weekly Outcome
By Friday, the student will have designed and compiled a custom **Device Tree Overlay (`.dtbo`)** to map and enable a physical hardware peripheral (such as an external LED and button) on their embedded board. They will understand address cells, size cells, device compatibility strings, and interrupt mappings.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Why Device Trees? & The Hardware Representation Model
* **Conceptual Objective**: Understand that unlike x86 PCs (which use self-describing buses like PCI/USB to auto-detect hardware at boot), embedded systems use simple memory-mapped buses that the kernel cannot auto-detect. Learn how **Device Trees** act as static hardware databases describing the exact physical addresses, clocks, and interrupts of all non-discoverable peripherals to the kernel.
* **Practical Activity**:
  1. Sketch a block diagram showing how the kernel reads the `.dtb` at boot to initialize platform devices dynamically.
  2. Differentiate between DTS (source), DTSI (include), and DTB (compiled binary).
* **Code/Circuit Reference**:
```text
Hardware Description Evolution:
Old Linux Method: Hardcoded C struct definitions inside "boardfiles" (bloated kernel!).
Modern Linux Method: Hardware described inside text `.dts` files, compiled into binary `.dtb`, and loaded into RAM by the bootloader at boot.
```

### Tuesday: Device Tree Syntax (Nodes, Properties, and Compatible Strings)
* **Conceptual Objective**: Master the tree syntax of DTS files. Understand:
  - **Nodes**: Represent physical blocks (e.g., `gpio@40020000`).
  - **Properties**: Key-value pairs (e.g., `reg = <0x40020000 0x400>`).
  - **Compatible Strings**: The critical link connecting the node to the matching kernel driver (e.g., `compatible = "brcm,bcm2835-gpio"`).
* **Practical Activity**:
  1. Read a section of the mainline SoC DTSI file.
  2. Identify the compatible strings and address mapping parameters.
* **Code/Circuit Reference**:
```dts
/* Conceptual Device Tree Node */
/ {
    soc {
        #address-cells = <1>;
        #size-cells = <1>;

        gpio@40020000 {
            compatible = "vendor,custom-gpio";
            reg = <0x40020000 0x1000>; // Base Address, Size
            gpio-controller;
            #gpio-cells = <2>;
        };
    };
};
```

### Wednesday: Address Cells, Size Cells, and Register Properties
* **Conceptual Objective**: Master memory cell parameters:
  - **`#address-cells`**: Specifies how many 32-bit words are used to represent physical base addresses.
  - **`#size-cells`**: Specifies how many words are used to represent memory sizes.
  - **`reg`**: The register address and length mapping arrays.
* **Practical Activity**:
  1. Calculate cell counts for 64-bit addresses (e.g., `#address-cells = <2>`).
  2. Construct a memory mapping block for a dual-port memory controller.
* **Code/Circuit Reference**:
```dts
/* Mapping a 64-bit address space */
soc {
    #address-cells = <2>; // 64-bit address requires two 32-bit cells
    #size-cells = <1>;    // 32-bit size

    timer@4,40000000 {
        compatible = "vendor,timer";
        reg = <0x4 0x40000000 0x1000>; // Address = 0x440000000, Size = 0x1000
    };
};
```

### Thursday: Interrupt Mappings & Pin Multiplexing (Pinctrl)
* **Conceptual Objective**: Study how interrupts and pin routing are represented inside Device Trees. Understand:
  - **`interrupt-parent`**: Identifies the core interrupt controller.
  - **`interrupts`**: Specifies the interrupt line number and trigger properties (rising/falling edge).
  - **`pinctrl`**: Configures pin alternative functions and pull-up/down behaviors.
* **Practical Activity**:
  1. Locate pinctrl definitions inside your board's DTS files.
  2. Map out how physical GPIO pins are bound to peripheral controllers.
* **Code/Circuit Reference**:
```dts
/* Interrupt routing node */
custom_sensor: sensor@40030000 {
    compatible = "vendor,custom-sensor";
    reg = <0x40030000 0x100>;
    interrupt-parent = <&gic>;
    interrupts = <0 17 4>; // IRQ Type (SPI/PPI), IRQ Number, Trigger (Active High)
};
```

### Friday: Compiling Overlays via DTC
* **Conceptual Objective**: Master the **Device Tree Compiler (`dtc`)**. Learn how to compile source DTS files into target DTB files. Study **Device Tree Overlays (`.dto` / `.dts`)**—a modular compilation mechanism that allows modifying the main system device tree dynamically at runtime without recompiling the entire SoC OS tree.
* **Practical Activity**:
  1. Write a custom Device Tree Overlay defining a physical LED pin.
  2. Compile it using `dtc` into a `.dtbo` and load it into your system configuration.
* **Code/Circuit Reference**:
```bash
# Compile DTS to DTB
dtc -I dts -O dtb -o board.dtb board.dts

# Compile Overlay to DTBO
dtc -@ -I dts -O dtb -o overlay.dtbo overlay.dts
```

---

## 🛠️ Hands-On Assignment: Custom GPIO & Button Device Tree Overlay

### Functional Requirements
Write, compile, and configure a custom Device Tree Overlay that maps and enables a physical LED output and a physical Pushbutton input on your target hardware.
1. The overlay source file must be named `hardware_overlay.dts`.
2. Define a custom compatible string `compatible = "custom-gpio-led"`.
3. The overlay must:
   - Map a physical GPIO pin to act as an output LED.
   - Map a physical GPIO pin to act as an input button, setting its default pull-down resistor and configuring it as an active-low trigger source.
4. Compile the overlay using the `dtc` compiler utility to generate `hardware_overlay.dtbo`.
5. Copy the `.dtbo` file to the target boot partition overlays directory (e.g., `/boot/overlays/`).
6. Enable the overlay in the target boot configuration file (e.g., `config.txt` or `uEnv.txt`).
7. Boot the system and verify the overlay node is active by navigating the virtual filesystem `/proc/device-tree/` to locate your new compatible device node.

### Structural Requirements & Code Skeleton
**`hardware_overlay.dts`**:
```dts
/dts-v1/;
/plugin/;

/ {
    compatible = "brcm,bcm2711"; // Target SoC compatible

    fragment@0 {
        target = <&gpio>;
        __overlay__ {
            custom_led_pins: custom_led_pins {
                brcm,pins = <18>;      // GPIO18
                brcm,function = <1>;  // Output
                brcm,pull = <0>;      // No pull
            };

            custom_btn_pins: custom_btn_pins {
                brcm,pins = <23>;      // GPIO23
                brcm,function = <0>;  // Input
                brcm,pull = <2>;      // Pull-down
            };
        };
    };

    fragment@1 {
        target-path = "/";
        __overlay__ {
            custom_hardware {
                compatible = "custom-gpio-peripheral";
                pinctrl-names = "default";
                pinctrl-0 = <&custom_led_pins &custom_btn_pins>;
                led-gpios = <&gpio 18 0>; // GPIO18, Active High
                btn-gpios = <&gpio 23 1>; // GPIO23, Active Low
                status = "okay";
            };
        };
    };
};
```

---

## 📦 Deliverables
* [ ] Device Tree Overlay source file `hardware_overlay.dts`.
* [ ] Compiled binary overlay `hardware_overlay.dtbo`.
* [ ] Verification report `dt_verification.txt` listing the active nodes found under `/sys/firmware/devicetree/base/` or `/proc/device-tree/`.

---

## ❓ Self-Check Questions
1. Why does an Intel x86 PC not require Device Tree files to boot and initialize its peripherals, whereas an ARM-based SoC requires them?
2. What are **Compatible Strings**? Explain how the kernel matches a device tree node to a compiled driver.
3. How do `#address-cells` and `#size-cells` control the formatting of the `reg` property array?
4. What are Device Tree Overlays? Why are they highly useful when prototyping custom shield boards?
5. How do you check if a device tree node was successfully loaded by the kernel at runtime?

---

## 🚀 Stretch Task (Optional)
Extend the overlay to define an I2C sensor peripheral (e.g., MPU6050) linked to the primary I2C bus node. Set its I2C slave address property to `0x68` and configure its interrupt line.

## 💡 Motivation Checkpoint
In modern Linux systems, drivers are generic: you do not write a separate driver for every board. The driver only handles the general chip control logic. The specific physical pin mappings and base addresses are fed to the driver dynamically at boot via the Device Tree. Understanding Device Trees is the primary step to hardware systems integration.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Device Tree overlay compiles without syntax errors.
  - Overlay successfully updates the kernel hardware list.
  - Custom nodes are visible under `/proc/device-tree/`.
* **Fail Criteria**:
  - Direct hardware conflicts due to incorrect pin selections.
  - DTC compiler warnings.
