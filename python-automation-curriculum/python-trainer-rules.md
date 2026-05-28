# Professional Coach: Python Automation operating Rules & Laws

As an automation architect and Senior Systems Coach, my role is to hold you to the absolute highest software engineering standards. Below are the **strict rules and laws** governing all Python code submissions during this 12-week intensive Automation Framework track.

Any violation of these rules results in an automatic **FAIL** for that week's assignment. No exceptions.

---

## 🚫 Rule 1: The "Strict-Type" Directive
All Python files must incorporate explicit C-like static type annotations. 
* **The Law:** You must type all function inputs, outputs, and class member variables. The `typing` module (`List`, `Dict`, `Union`, `Callable`) must be leveraged for complex mappings.
* **The Verification:** Every submission is audited using **Mypy**:
  ```bash
  mypy --strict src/
  ```
  If Mypy emits a single warning, typing omission, or dynamic type conversion alert, your code is rejected immediately without further review.
* **The Logic:** Dynamic typing is a primary source of runtime bugs in large automation frameworks. Explicit static type hints act as compile-time documentation, preventing hardware command parameter mismatches.

---

## 🧠 Rule 2: Strict Hardware Connection & Thread Safety
When automation scripts interface with physical instruments (VISA, Serial, TCP), connections must be guarded.
* **The Law:** All hardware connections must implement **Context Managers** (`__enter__` and `__exit__`) to guarantee that ports and sockets are closed cleanly on errors.
* **Concurrency Law:** When reading telemetry streams inside parallel threads, shared objects must be accessed safely via thread-safe structures (`queue.Queue`) or guarded by execution Locks (`threading.Lock`).

---

## 🏗️ Rule 3: Mandatory Design Patterns for Hardware Control
To write maintainable HIL test suites, you must adhere to three core object-oriented design patterns:

| Pattern Name | Application | Rationale |
| :--- | :--- | :--- |
| **Singleton Handle** | Dedicated connection drivers (e.g. `VISAConnectionManager`). | Prevents open-port lock conflicts by ensuring only a single dynamic connection handler instance exists for each instrument. |
| **Device Object (DOM)** | Mapping raw register bytes to high-level device classes. | Decouples raw hardware commands (e.g., `write("*RST")`) from logical assertions (e.g., `scope.reset()`). |
| **Factory Pattern** | Dynamic test runner hardware target variants. | Allows test frameworks to swap mock hardware objects with physical hardware dynamically based on test configurations. |

---

## 🛠️ Rule 4: pytest Hardening & Fixture Isolation
* **The Law:** Raw test functions must be stateless. All setups (powering up instrument) and teardowns (graceful shutdown) must occur within scoped **pytest fixtures**.
* **Global States Forbidden:** Global variables used to store test states or hardware handles are strictly banned. Everything must be passed dynamically via fixture dependency injection.

---

## 🎓 Coach's Grading Rubric

Each week, your coach evaluates your deliverables out of a 10-point scale:

### 🔴 0 to 6 points: Rejected / Remediation Required
* **Criteria:** Static typing warnings present under `mypy --strict`, unhandled hardware resource leaks, global variables in test states, or missing teardowns in fixtures.
* **Coach's Directive:** Resubmit within 48 hours after applying required design patterns and type hardening.

### 🟡 7 to 8 points: Passed
* **Criteria:** Zero Mypy errors, clean pytest test runs, proper context managers. However, there are minor layout, lack of parameterization, or sub-optimal threading designs.
* **Coach's Directive:** Approved to advance, but styling fixes must be applied before the next milestone audit.

### 🟢 9 to 10 points: Passed with Distinction
* **Criteria:** Flawless typed architecture, 100% unit/integration coverage, elegant design pattern implementation, and completion of the complex **Stretch Task**.
* **Coach's Directive:** Approved to advance with commendation.
