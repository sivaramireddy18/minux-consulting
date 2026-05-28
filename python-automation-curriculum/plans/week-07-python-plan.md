# Week 07: Firmware Analysis & Binary Parsing

## 🎯 Weekly Goal
Master the structure of compiled firmware files (Executable and Linkable Format - ELF), write Python tools to parse symbols and sections using the `pyelftools` library, and build automated static memory audits to prevent microcontroller stack-to-heap overlaps.

## 🎓 Weekly Outcome
By the end of this week, you will be able to dissect ELF headers, map memory section sizes (`.text`, `.data`, `.bss`), extract specific symbol memory offsets, parse compiler map files, and build automated pre-flashing validation gates.

---

## 📅 Session Breakdown

### Monday: The ELF Layout & Header Parser
* **Conceptual Focus:** The Executable and Linkable Format (ELF) structure.
  * Standard segments in compiled embedded binaries:
    * **ELF Header:** Identifies target architecture (ARM, RISC-V, x86), endianness, and entry address.
    * **Section Header Table:** Maps raw binary segments (.text, .rodata, .data, .bss).
    * **Symbol Table (`.symtab`):** Contains names and memory addresses of all functions and global variables.
* **Hands-on Experiment:**
  Write a Python script to parse basic ELF header info using `pyelftools`:
  ```python
  from elftools.elf.elffile import ELFFile
  
  with open("firmware.elf", "rb") as f:
      elf = ELFFile(f)
      print("ELF Header Details:")
      print(f" -> Architecture: {elf.get_machine_arch()}")
      print(f" -> Endianness: {elf.little_endian}")
  ```

---

### Tuesday: Mapping Memory Sections
* **Conceptual Focus:** Auditing static memory footprint.
  * Microcontrollers have highly constrained Flash (typically < 1MB) and SRAM (typically < 128KB).
  * **.text:** Compiled code size (consumes Flash).
  * **.data / .bss:** Static and global variables (consumes SRAM).
  * Why test automation must audit these sizes to prevent hardware out-of-memory crashes.
* **Hands-on Exercise:**
  Extract and print the sizes of all segments:
  ```python
  from elftools.elf.elffile import ELFFile
  
  with open("firmware.elf", "rb") as f:
      elf = ELFFile(f)
      for section in elf.iter_sections():
          print(f"Section: {section.name:<10} | Size: {section['sh_size']:<6} bytes | Addr: {hex(section['sh_addr'])}")
  ```

---

### Wednesday: Extracting Symbols & Offsets
* **Conceptual Focus:** Dynamic symbol parsing.
  * Locating specific variables in memory dynamically.
  * Automating debugging: mapping symbol addresses to GDB breakpoints or checking variables during HIL runtime memory inspections.
* **Hands-on Exercise:** Write a Python function that returns the hex address of any given function symbol name by iterating over the ELF `.symtab` section.

---

### Thursday: Parsing Compiler Map Files
* **Conceptual Focus:** Extracting allocation summaries from text logs.
  * Most compilers (GCC) output detailed `.map` files during builds.
  * Using regex in Python to scan map files and identify massive global arrays that consume SRAM.

---

### Friday: Pre-Flashing Integrity Validation
* **Conceptual Focus:** Designing CI/CD validation gates.
  * Automated testing checks: Block the flashing process immediately if the static SRAM allocation exceeds 90% of physical microcontroller limits, preventing bricked hardware.

---

## 🛠️ Hands-On Assignment: Automated Memory Footprint Auditor
Design and build a Python command-line utility named `firmware_auditor.py` that parses compiled ELF binaries, audits segment allocations, and checks limits.

### 1. Requirements
* Provide a CLI interface that accepts: `--elf` (path to compiled firmware file), `--flash-limit` (Flash size limit in bytes), and `--sram-limit` (SRAM size limit in bytes).
* The script must:
  1. Parse the ELF file sections using `pyelftools`.
  2. Compute Total Flash Usage (`.text` + `.data` + `.rodata`) and Total SRAM Usage (`.data` + `.bss`).
  3. Validate these sizes against the parsed limits.
  4. If size allocations exceed 90%, print a warnings list. If they exceed 100%, print a fatal error message and exit with return code `-1`.
* All code must be strictly type-annotated, checked with Mypy, and Black formatted.

### 2. File Deliverables
* `firmware_auditor.py`: The static memory analysis script.
* `test_workspace/`: Directory containing dynamic mockup ELF binary files for test runs.

---

## 📋 Deliverables Checklist
- [ ] `firmware_auditor.py` (Mypy type-hinted, zero warnings)
- [ ] `test_workspace/` (C compile mockups)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. What are the differences between relocatable object files and Executable and Linkable Format (ELF) structures?
2. How does the size of the `.bss` section in an ELF file differ from the actual size it occupies on the physical disk?
3. Explain how static memory allocations (.data and .bss) can trigger hardware heap/stack overlaps at microcontroller runtime.
4. Why is it useful to extract function symbols address offsets dynamically using Python in automated test environments?
5. What does a compiler `.map` file record, and how does regex help parse it?

---

## 🚀 Stretch Task
Implement an **automated symbol address hook**. Expand your tool so that it reads a target firmware ELF, extracts the exact memory address of a global telemetry array variable, and writes this address directly into a test configuration file to automate runtime memory injection assertions.

---

## 💡 Motivation Checkpoint
In safety-critical avionics firmware development, software is strictly audited for SRAM allocation footprint. Exceeding stack/heap allocations can trigger memory overrides, causing non-deterministic crashes mid-flight. Pre-flashing ELF validation scripts are the first line of defense in hardware release pipelines.

---

## 🎓 Trainer Review Rules
* Verify type-safety: Executing `mypy --strict firmware_auditor.py` must complete with 0 alerts.
* Verify limits verification: Inputting limits smaller than target ELF sections must exit with exact error codes and report the precise byte overflow calculations cleanly.
