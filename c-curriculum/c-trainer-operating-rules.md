# Professional Coach: C Systems Programming Operating Rules & Laws

As a Senior Systems Coach, my role is to hold you to the absolute highest industry standards. Below are the **strict pedagogical laws** governing all code submissions during this 12-week intensive C Programming track. 

Any violation of these rules results in an automatic **FAIL** for that week's assignment. No exceptions.

---

## 🚫 Rule 1: The "Zero-Warning" Directive
All submissions must compile under **GCC** or **Clang** using the following compiler flags:
```bash
-std=c11 -Wall -Wextra -Werror -pedantic
```
* **The Law:** If a single warning is emitted, compilation fails, and your submission is rejected without review.
* **The Logic:** Warnings indicate code ambiguity, compiler assumptions, or latent compiler bugs. In high-stakes systems programming, warnings are bugs waiting to explode.

---

## 🧠 Rule 2: Strict Memory Security & Leak Laws
Dynamic memory allocation (`malloc`, `calloc`, `realloc`) must be managed with flawless ownership logic.
* **The Law:** Every byte allocated *must* be freed cleanly before program termination. Zero dynamic memory leaks are permitted.
* **The Verification:** Every assignment binary is executed through **Valgrind Memcheck**:
  ```bash
  valgrind --leak-check=full --show-leak-kinds=all --errors-to-code=1 ./assignment_bin
  ```
  If Valgrind reports a single byte lost, uninitialized read, array out-of-bounds, or invalid free, the assignment fails.

---

## 📜 Rule 3: Defensive C & MISRA-C Safety Principles
You must adhere to a strict subset of the **MISRA C (Guidelines for the Use of the C Language in Critical Systems)** standards:

| Violation Category | Forbidden / Mandatory Patterns | Rationale |
| :--- | :--- | :--- |
| **Buffer Security** | **FORBIDDEN:** `strcpy`, `strcat`, `sprintf`, `gets`, `scanf` | Susceptible to classic stack buffer overflows. Use secure, bounded functions (`strncpy`, `strncat`, `snprintf`, `fgets`). |
| **Pointer Arithmetic** | **MANDATORY:** Bounds checking on all offset calculations. | Out-of-bounds pointer adjustments trigger undefined behavior and memory exploitation. |
| **Variable Scope** | **MANDATORY:** Initialize all variables at declaration. Define variables in the narrowest possible scope. | Uninitialized stack variables contain random trash data, leading to non-deterministic execution bugs. |
| **Control Structures** | **MANDATORY:** Use braces `{}` for all conditional branches (`if`, `else`, `while`, `for`), even single-line blocks. | Prevents dangling-else logic bugs and compiler parser confusion (e.g., Apple's famous `goto fail` bug). |
| **Data Types** | **MANDATORY:** Use explicit fixed-width integers (`uint8_t`, `int32_t`, `uintptr_t`) for all data processing. | Raw type sizes (`int`, `long`) vary across cross-compilation targets, causing overflow/truncation bugs. |

---

## 🛠️ Rule 4: Mandatory Static Analysis & Code Quality Checks
Before presenting your code to your coach, you must run automated static analysis:
```bash
cppcheck --enable=all --inconclusive --error-exitcode=1 src/
```
* **The Law:** Static analysis must report **zero style, performance, portability, or warning errors**.
* **The Logic:** Static analysis scans for semantic flaws (like dead code, logical redundancies, and API misuse) that normal compilers sometimes miss.

---

## 🏗️ Rule 5: Pure C and Modular Compilation
* **The Law:** Every assignment must compile via an automated **Makefile** that supports incremental compilation and dependency tracking.
* **The Make Rules:** All Makefiles must contain the following standard targets:
  * `all`: Build the main executable.
  * `clean`: Remove all compilation artifacts (`.o`, `.d`, binaries).
  * `test`: Compile and run the automated unit testing suite.
* **Header Discipline:** Avoid declaring variables or writing functional code inside headers (`.h`). Headers must only contain function signatures, struct/union declarations, macro definitions, and external declarations (`extern`).

---

## 🎓 Coach's Grading Rubric

Each week, your coach evaluates your deliverables out of a 10-point technical scale, mapped to three performance bands:

### 🔴 0 to 6 points: Rejected / Remediation Required
* **Criteria:** Compile warnings present, memory leak detected by Valgrind, missing unit tests, or safety violations (e.g. using `strcpy`).
* **Coach's Directive:** You are blocked from advancing. You must execute the week's remediation plan and resubmit within 48 hours.

### 🟡 7 to 8 points: Passed
* **Criteria:** Code compiles cleanly, zero memory leaks, and passes functional unit tests. However, there are minor layout, stylistic issues, or sub-optimal execution paths.
* **Coach's Directive:** Approved to advance, but you must apply style fixes to the codebase before the next milestone audit.

### 🟢 9 to 10 points: Passed with Distinction
* **Criteria:** Perfect clean code, robust Makefile dependencies, 100% test coverage, elegant structure, and completion of the highly complex **Stretch Task**.
* **Coach's Directive:** Exemplary systems-level execution. Approved to advance with commendation.
