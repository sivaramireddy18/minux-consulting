# Weekly Execution Plan: Week 07

## 🎯 Weekly Goal
Master the internal architecture of the ARM Cortex-M4 microcontroller core, understand the physical register set, the memory map, the CPU boot sequence, and the anatomy of the Vector Table.

## 🏆 Weekly Outcome
By Friday, the student will have written a custom, bare-metal Startup C/Assembly file and a bare-metal Linker Script from scratch. They will be able to explain how the hardware reads the Vector Table at boot, initializes the Stack Pointer (MSP), and branches to the `main()` entry point without relying on any IDE-generated wizard files.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The ARM Cortex-M Core Architecture
* **Conceptual Objective**: Understand the Harvard Architecture (separate instruction and data buses), CPU operational modes (Thread Mode vs Handler Mode), privilege levels (Privileged vs Unprivileged), and the physical registers set (R0-R12 general purpose, R13 Stack Pointer MSP/PSP, R14 Link Register, R15 Program Counter).
* **Practical Activity**:
  1. Read the ARMv7-M Architecture Reference Manual core registers chapter.
  2. Draw the register layout block diagram highlighting the Special Registers (xPSR, PRIMASK, FAULTMASK, BASEPRI, CONTROL).
* **Code/Circuit Reference**:
```text
Cortex-M Core Register File:
+---------------------------------------------------+
| R0 - R12   : General Purpose Registers            |
+---------------------------------------------------+
| R13 (SP)   : Stack Pointer (MSP / PSP)            |
+---------------------------------------------------+
| R14 (LR)   : Link Register (Holds Return Address) |
+---------------------------------------------------+
| R15 (PC)   : Program Counter (Holds Exec Address) |
+---------------------------------------------------+
| xPSR       : Program Status Register (flags)      |
+---------------------------------------------------+
```

### Tuesday: Memory-Mapped I/O & The STM32 Memory Map
* **Conceptual Objective**: Study the $4\text{GB}$ addressable memory space of ARM 32-bit cores. Understand the physical partitioning: Flash memory (starts at `0x08000000` on STM32), SRAM (starts at `0x20000000`), Peripherals (starts at `0x40000000`), and the System Control Block (SCB) region.
* **Practical Activity**:
  1. Open the STM32F407xx Datasheet and locate the boundary addresses of flash memory, SRAM1, SRAM2, and GPIOA peripheral.
  2. Construct a C program defining pointer macros mapped directly to these base addresses.
* **Code/Circuit Reference**:
```c
#define FLASH_BASE_ADDR   0x08000000U
#define SRAM_BASE_ADDR    0x20000000U
#define PERIPH_BASE_ADDR  0x40000000U

#define GPIOA_BASE_ADDR   (PERIPH_BASE_ADDR + 0x00020000U) // GPIOA mapped to 0x40020000
```

### Wednesday: The Boot Sequence & Vector Table Mechanics
* **Conceptual Objective**: Comprehend the exact, hardware-level boot sequence of the processor. At power-on or reset, the core:
  1. Reads memory address `0x00000000` (or booted alias like `0x08000000`) to fetch the Initial Stack Pointer value and loads it into MSP.
  2. Reads address `0x00000004` to fetch the address of the Reset Handler and loads it into PC.
  3. Begins executing the Reset Handler instruction.
* **Practical Activity**:
  1. Design a C structure representing the Vector Table containing Exception vectors (Reset, NMI, HardFault, SVC, PendSV, SysTick) and Peripheral interrupts.
  2. Mark the Vector Table to be placed at the very beginning of Flash memory.
* **Code/Circuit Reference**:
```c
// Vector Table declaration using C function pointers
typedef void (*element_t)(void);

// Force placement in a specific linker section
__attribute__((section(".isr_vector")))
const element_t vector_table[] = {
    (element_t)0x20020000, // 1. Initial Stack Pointer (Top of SRAM, 128KB on F4)
    Reset_Handler,         // 2. Reset Handler (Address PC starts execution)
    NMI_Handler,           // 3. Non-Maskable Interrupt Handler
    HardFault_Handler,     // 4. Hard Fault Handler
};
```

### Thursday: Designing a Bare-Metal Linker Script
* **Conceptual Objective**: Understand what a Linker Script (`.ld`) does: it defines the physical memory regions of the hardware target and specifies where the linker should place compiled code sections (`.text`, `.data`, `.bss`, `.rodata`).
* **Practical Activity**:
  1. Create a custom `linker_script.ld` specifying FLASH and SRAM sizes for the STM32F407VG ($1\text{MB}$ Flash, $128\text{KB}$ SRAM).
  2. Define section mappings to place `.isr_vector` strictly at the start of Flash.
* **Code/Circuit Reference**:
```ld
/* Minimal Linker Script: linker_script.ld */
ENTRY(Reset_Handler)

MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS
{
    .text :
    {
        KEEP(*(.isr_vector))
        *(.text)
        *(.text.*)
        *(.rodata)
        *(.rodata.*)
        _etext = .; /* Define end of text symbol */
    } > FLASH

    .data : AT(_etext)
    {
        _sdata = .;
        *(.data)
        *(.data.*)
        _edata = .;
    } > SRAM

    .bss :
    {
        _sbss = .;
        *(.bss)
        *(.bss.*)
        _ebss = .;
    } > SRAM
}
```

### Friday: Writing the Reset Handler Startup File
* **Conceptual Objective**: Study what a Startup File must do before jumping to `main()`:
  1. Copy the initialized data section (`.data`) from Flash memory (where it is stored) to SRAM (where it runs).
  2. Clear the uninitialized data section (`.bss`) in SRAM to zero.
  3. Call the `main()` function.
* **Practical Activity**:
  1. Write a custom `startup.c` file containing the Reset Handler and all core exception vectors as weak aliases to a default dummy loop.
  2. Compile and link using `arm-none-eabi-gcc` and your linker script.
* **Code/Circuit Reference**:
```c
// startup.c
#define SRAM_START 0x20000000U
#define SRAM_SIZE  (128U * 1024U)
#define STACK_TOP  (SRAM_START + SRAM_SIZE)

extern unsigned int _etext; // Linker symbols
extern unsigned int _sdata;
extern unsigned int _edata;
extern unsigned int _sbss;
extern unsigned int _ebss;

void main(void);

void Reset_Handler(void) {
    // 1. Copy .data section from Flash to SRAM
    unsigned int *src = &_etext;
    unsigned int *dst = &_sdata;
    while (dst < &_edata) {
        *dst++ = *src++;
    }

    // 2. Clear .bss section to 0
    dst = &_sbss;
    while (dst < &_ebss) {
        *dst++ = 0;
    }

    // 3. Call application main
    main();

    // 4. Infinite trap loop if main returns
    while(1);
}
```

---

## 🛠️ Hands-On Assignment: Custom Startup & Linker Pipeline

### Functional Requirements
Create a fully custom, bare-metal build environment that compiles a simple C application without any pre-packaged IDE files.
1. The project must consist of four files: `main.c`, `startup.c`, `linker_script.ld`, and `Makefile`.
2. Do *not* link standard library startup routines (compile with `-nostdlib` flag).
3. The Vector Table in `startup.c` must define at least Reset_Handler, NMI_Handler, and HardFault_Handler.
4. The Reset Handler must manually perform `.data` copying and `.bss` clearing before jumping to `main()`.
5. `main.c` should implement a simple loop.
6. The Makefile must use the `arm-none-eabi-gcc` cross-compiler toolchain, generate a final `.elf` binary, compile with `-g` to embed debugging symbols, and generate a memory map file (`-Wl,-Map=build/output.map`) to verify symbol placement.

### Structural Requirements & Code Skeleton
**`main.c`**:
```c
int counter = 42; // Placed in .data (initialized global)
int uninit_var;   // Placed in .bss (cleared to 0)

void main(void) {
    uninit_var = 100;
    while (1) {
        counter++;
        if (counter > 1000) {
            counter = uninit_var;
        }
    }
}
```

**`Makefile`**:
```makefile
CC = arm-none-eabi-gcc
LD = arm-none-eabi-ld
OBJCOPY = arm-none-eabi-objcopy

CFLAGS = -mcpu=cortex-m4 -mthumb -nostdlib -Wall -Wextra -O0 -g
LDFLAGS = -T linker_script.ld -Wl,-Map=build/output.map

all: build/output.elf build/output.bin

build/output.elf: main.c startup.c
	mkdir -p build
	$(CC) $(CFLAGS) $(LDFLAGS) startup.c main.c -o $@

build/output.bin: build/output.elf
	$(OBJCOPY) -O binary $< $@

clean:
	rm -rf build
```

---

## 📦 Deliverables
* [ ] Custom linker script file `linker_script.ld`.
* [ ] Startup source file `startup.c` with Vector Table.
* [ ] Test program `main.c` and compilation Makefile.
* [ ] Extracted memory map file `build/output.map` verifying that `.isr_vector` is at `0x08000000`, `counter` is in SRAM, and `uninit_var` is in SRAM and initialized to 0.

---

## ❓ Self-Check Questions
1. Why does the processor read the initial Stack Pointer (MSP) *before* the Reset Vector address at boot? What is the consequence if these two values are corrupted in Flash?
2. What does the `-mthumb` compiler flag tell the ARM processor? What happens if you try to compile ARM Cortex-M code without it?
3. What is the difference between physical load addresses (LMA) and virtual execution addresses (VMA) of the `.data` section? How does the Linker Script coordinate this using `AT()`?
4. How do you declare a custom C function to be placed inside a specific linker-defined section instead of the default `.text` section?
5. What is the role of the Vector Table Offset Register (VTOR) inside the System Control Block (SCB)? Why is VTOR critical when developing custom bootloaders?

---

## 🚀 Stretch Task (Optional)
Modify the custom Linker Script to define a custom stack limit symbol and write a simple `Stack_Overflow_Detector` check inside the startup file that sets a hardware register flag if the stack pointer grows past memory allocations.

## 💡 Motivation Checkpoint
Every IDE (such as Keil, IAR, or STM32CubeIDE) hides the startup assembly and linker configuration from you behind templates. But when you move to automotive-grade ECUs, secure boot architectures, or custom bootloaders, you *cannot* use IDE templates. You must partition flash memories manually, direct code into secure sections, and initialize cores by manual scripts. Mastering startup sequences is the bridge to becoming a senior system architect.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - `build/output.map` maps `.isr_vector` exactly at address `0x08000000` (no offset).
  - Executable links with zero standard libraries and builds with zero warnings.
  - Startup copies initialized globals correctly (can be verified inside `gdb`).
* **Fail Criteria**:
  - Linking standard library startup files (presence of standard libraries).
  - Memory map shows unaligned sections or incorrect stack base limits.
