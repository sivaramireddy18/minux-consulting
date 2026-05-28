# Professional Engineering Habit Scorecard

This accountability scorecard is designed to track non-functional engineering habits that separate novice coders from elite, industry-ready Systems Engineers. Track these parameters weekly.

---

## 📊 Habit Categories & Scoring Grid

Rate yourself or your student weekly from **1 (Poor)** to **5 (Outstanding)** in each of the following areas:

| Habit Category | Core Engineering Principle | Week 1-6 | Week 7-12 | Week 13-18 | Week 19-24 | Week 25-30 | Week 31-36 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Git Hygiene** | Conventional commits, atomic sizing, clean branching. | | | | | | |
| **Warnings Clean** | Zero compilation warnings (compiled with `-Werror`). | | | | | | |
| **Static Compliance** | Static analysis (Cppcheck/Tidy) runs with 0 errors. | | | | | | |
| **No Magic Numbers** | Bit masks and pin macros utilized instead of raw numbers. | | | | | | |
| **Hardware Care** | Safe wiring, ESD grounding, power rails double-checked. | | | | | | |
| **Defensive I/O** | All system calls and peripheral API return values checked.| | | | | | |
| **Memory Rigor** | No unmanaged pointers, no stack overflows, no heap leaks. | | | | | | |
| **Documentation** | Code comments describe "Why", not "What". logs kept. | | | | | | |

---

## 🔍 Scoring Definitions & Expectations

### 1. Git Hygiene & Repo Discipline
* **5 (Outstanding)**: Each feature, driver, or peripheral addition resides on a separate Git branch. Pull requests contain clear descriptions of changes. Commits are atomic (no two unrelated changes in a single commit) and strictly follow Conventional Commits formatting (e.g., `feat(gpio): implement debounce logic via software timer`).
* **3 (Acceptable)**: Commits occur daily on the `main` branch. Commit messages are clear but do not follow the strict Conventional Commits syntax.
* **1 (Failure)**: Multi-week monolithic commits. Git history consists of generic statements like *"fixed code"*, *"debugging"*, or *"final push"*. Compiled files (`.elf`, `.bin`, `.o`) are committed.

### 2. Compilation and Code Safety Compliance
* **5 (Outstanding)**: Code compiles flawlessly with `-Wall -Wextra -pedantic -Werror` on the host, or equivalent strict flags on the cross-compiler. Zero compiler warnings exist. Cppcheck static analyzer is integrated into the build pipeline and yields zero errors or style warnings.
* **3 (Acceptable)**: Code compiles with warnings. Warnings are ignored as long as the binary functions correctly. No static analysis is performed.
* **1 (Failure)**: Project compiles only after modifying compiler configurations to ignore warning errors, or fails to build completely.

### 3. Hardware Care & Handling Safety
* **5 (Outstanding)**: Before powering any custom circuit, the student uses a multimeter to verify zero short-circuits between the positive power rail ($3.3\text{V}$ or $5\text{V}$) and Ground ($\text{GND}$). The board is kept on an ESD-safe mat. The microcontroller is disconnected from USB power *before* changing breadboard wire connections.
* **3 (Acceptable)**: Jumper wires are hot-swapped while the micro-controller is powered. The board sits on top of standard conductive surfaces (metal/static bags). No short-circuit checking is done, relying on the USB hub's overcurrent protection.
* **1 (Failure)**: Microcontroller board is permanently damaged due to shorts, reverse-polarity power connection, or ESD discharge due to gross negligence.

### 4. Code Standards & Architecture (Anti-Magic Numbers)
* **5 (Outstanding)**: Every register manipulation is explicitly detailed using shift operators and pre-defined register structures. 
  * *Correct*: `GPIOA->MODER &= ~(3U << (5 * 2)); GPIOA->MODER |= (1U << (5 * 2)); // Configure PA5 as output`
  * *Incorrect*: `GPIOA->MODER = 0x00000400; // PA5 output (magic value resets other pins!)`
* **3 (Acceptable)**: Masking is done but magic hex constants are used without clear comments explaining the calculation.
* **1 (Failure)**: Code is packed with direct decimal/hex writes to registers, making it impossible to read without having the processor's 1000-page Reference Manual open on a matching page.
