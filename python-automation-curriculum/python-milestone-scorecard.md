# Professional Python Automation: Milestone Scorecard

To progress through the curriculum, the student must successfully clear the **Gatekeeper Assignment** at the end of each milestone. Standard curves are banned: these assessments are scored on an industrial **Pass/Fail** basis against a strict engineering rubric.

---

## 🏆 Milestone 1 Gatekeeper: Dynamic MicroPython Telemetry Node
* **Checkpoint:** End of Week 03 (Milestone 1)
* **Goal:** Verify compiler subprocess wrapping, pySerial communications, MicroPython REPL scripting, and packet serialization checks.

### 📝 Core Specifications
1. Write an automated host-side controller in Python that connects to an edge microcontroller running MicroPython over serial USB.
2. The host must wrap the `ampy` or `rshell` command-line tools to dynamically flash the MicroPython telemetry code.
3. Once flashed, the host must connect over PySerial, parse raw binary streams packet-by-packet (`struct` unpack), and validate each payload using a 16-bit Cyclic Redundancy Check (CRC-16).
4. Code must be 100% type-annotated, checked with `mypy --strict`, and formatted cleanly with `black`.

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Typing & Formatting** | `mypy --strict` passes with 0 warnings; Black formatter returns zero style shifts. | Single untyped parameter, use of `Any` type, or formatting check errors. |
| **Telemetry Parsing** | Unpacks raw byte streams successfully; detects CRC checksum mismatches. | Buffer overflow exceptions, missing CRC checks, or unclosed serial ports. |
| **CLI Wrapper** | Subprocess flashing executes with strict timeouts and grabs execution errors. | Hanging subprocess commands without timeout configurations. |

---

## 🏆 Milestone 2 Gatekeeper: Instrumented Hardware-in-the-Loop Test Suite
* **Checkpoint:** End of Week 06 (Milestone 2)
* **Goal:** Verify VISA instrumentation wrapping, pytest fixtures architectures, parameterizations, and automated fault-injection HIL scripting.

### 📝 Core Specifications
1. Wrap simulated lab instruments (Power Supply, Multimeter, Oscilloscope) using the **Singleton pattern** for raw VISA connection handles.
2. Implement **Device Object Models (DOM)** to provide clean APIs (e.g. `power_supply.set_voltage(5.0)`).
3. Build a pytest-driven automated testing harness containing:
   * A class-scoped `hardware_setup` fixture establishing VISA connections and configuring standard safe voltage ceilings.
   * Functional test cases that inject faults (e.g. commanding the power supply to brownout) and assert that the device behaves defensively.
4. Manage setups and teardowns safely within fixtures, ensuring instrument power rails are shut off in all exit paths.

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Resource Safety** | Instrument connections closed in all exit paths using context managers or fixture teardowns. | Unclosed sockets, lingering VISA sessions, or failing to cut power on failure. |
| **Fixture Discipline** | All setup/teardowns governed via dynamic fixture dependency injections; 0 global states. | Using global variables to store test states or connection pointers. |
| **Parametrization** | Test cases utilize `@pytest.mark.parametrize` to scale verification across multiple voltage bounds. | Redundant copy-pasted test cases for individual values. |

---

## 🏆 Milestone 3 Gatekeeper: ELF Firmware Analyzer & Telemetry Plotter
* **Checkpoint:** End of Week 09 (Milestone 3)
* **Goal:** Verify ELF binary structural auditing (`pyelftools`), multi-threaded telemetry logging, and CLI metrics reporting.

### 📝 Core Specifications
1. Write a firmware static memory analysis tool using `pyelftools` that parses a compiled ELF image. The tool must:
   * Audit memory sizes (.text, .data, .bss) and flag alerts if allocation limits are exceeded.
   * Retrieve symbol address tables and check for potential stack-to-heap collisions.
2. Build a multi-threaded telemetry streaming data-logger. Use `threading.Thread` and a thread-safe `queue.Queue` to stream binary packet inputs to disk, avoiding data losses.
3. Design a CLI interface using `click` that compiles these metrics dynamically and exports a beautifully formatted PDF report containing performance graphs (using Matplotlib).

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Binary Analysis** | Successfully extracts symbol offsets and calculates size segments of ELF binaries. | Crashing on malformed ELF structures, incorrect pointer math offsets calculations. |
| **Thread Safety** | Telemetry queue reads are thread-safe and non-blocking, avoiding race conditions or lockouts. | Data losses on high-speed queues, unhandled thread exceptions, or locked threads. |
| **CLI & Reports** | Click parser handles invalid arguments gracefully; PDF generates correct Matplotlib graphs. | CLI crash on bad inputs; raw stdout prints without structured PDF outputs. |

---

## 🏆 Milestone 4 Gatekeeper: Enterprise CI/CD HIL Framework
* **Checkpoint:** End of Week 12 (Milestone 4 / Graduation)
* **Goal:** Verify complete type safety, OOP design patterns, CI/CD automated configurations, and graduation capstone execution.

### 📝 Core Specifications
1. Design a comprehensive, modular **Hardware-in-the-Loop Test Automation Framework** from scratch.
2. Structure the codebase using clean OOP patterns: Factory pattern for target boards selection, Device Object abstractions, Singleton connection managers.
3. Integrate 100% strict static typing, validated using `mypy --strict`.
4. Build a continuous integration workflow configuration (Jenkinsfile or GitHub Actions YAML) that:
   * Automatically executes the test suite inside your virtual environment.
   * Generates a JUnit XML metrics report.
   * Rejects merges if test coverage falls below 90% or if static audits fail.

### 📊 Evaluation Scoring Rubric
| Evaluation Metric | Passing Criteria (Must Met) | Triggers Automatic Failure (FAIL) |
| :--- | :--- | :--- |
| **Framework Design** | Code utilizes clean DOM and Factory designs; 0 typing omissions or Any casts under Mypy. | Spaghetti structures, raw VISA commands inside test cases, or Mypy type-check errors. |
| **Pipeline Integration** | CI/CD pipeline triggers test runs on commits, generates HTML reports, and parses JUnit output. | Pipeline script failure, missing reports, or failing to block merges on test failures. |
| **Graduation Portfolio** | Complete portfolio review presenting test architectures, 100% type-checked framework, and CI/CD results. | Incomplete code documentation, missing test cases, or failing type checks. |
