# Week 10: Python Code Quality, Typing, & Design Patterns

## 🎯 Weekly Goal
Harness the full power of Python's static typing engine (`mypy`), deploy essential enterprise-grade object-oriented design patterns (Singleton, Factory, DOM) for hardware abstraction, and automate style consistency using black and ruff.

## 🎓 Weekly Outcome
By the end of this week, you will be able to write 100% type-safe Python code under strict Mypy checks, apply structural design patterns to isolate hardware configurations, eliminate open-connection lockups using Singleton managers, and automate style checks.

---

## 📅 Session Breakdown

### Monday: Strict Static Typing with Mypy
* **Conceptual Focus:** Bridge-building between dynamic Python and static type safety.
  * Why standard Python dynamic execution leads to subtle bugs in large automation frameworks (e.g. passing a string value to a function expecting a float).
  * Using Mypy for static type validation.
  * Core typing signatures: `Union`, `Optional`, `Callable`, `Any` (and why `Any` is considered a code smell under strict rules).
  * Advanced typing: generics (`TypeVar`), protocols (`Protocol` for static interfaces mapping).
* **Hands-on Experiment:**
  Auditing type mismatches at compile time:
  ```bash
  # Run strict static type check on src
  mypy --strict src/
  ```

---

### Tuesday: The Singleton & Connection Manager
* **Conceptual Focus:** Managing hardware connection safety.
  * **The Problem:** In large test suites, multiple tests might attempt to open connection sessions to the same physical instrument simultaneously, locking ports and triggering communication errors.
  * **The Solution:** The **Singleton Pattern** ensures that a class has only one instance and provides a global access point to it.
* **Hands-on Exercise:**
  Implement a thread-safe Singleton Connection Manager:
  ```python
  import threading
  from typing import Optional
  
  class VISAConnectionManager:
      _instance: Optional["VISAConnectionManager"] = None
      _lock: threading.Lock = threading.Lock()
      
      def __new__(cls) -> "VISAConnectionManager":
          with cls._lock:
              if cls._instance is None:
                  cls._instance = super().__new__(cls)
                  cls._instance._init_manager()
          return cls._instance
          
      def _init_manager(self) -> None:
          self.connection_handle = "VISA_ESTABLISHED"
          print("[SINGLETON] Unique Connection Manager initialized.")
  ```

---

### Wednesday: The Factory Design Pattern
* **Conceptual Focus:** Swapping hardware targets dynamically.
  * **The Problem:** Tests need to run against the real physical microcontroller on HIL benches, but developers must also run tests locally against simulated mock objects during offline debugging.
  * **The Solution:** The **Factory Pattern** decouples object creation, allowing the framework to dynamically instantiate real or mock device drivers based on configuration inputs.
* **Hands-on Exercise:** Build a driver factory that instantiates either `PhysicalOscilloscope` or `MockOscilloscope` depending on a config file string.

---

### Thursday: The Device Object Model (DOM)
* **Conceptual Focus:** Abstraction layer separation.
  * Representing physical hardware units as discrete class objects that map low-level registers and communications commands to high-level methods, keeping test code clean and readable.

---

### Friday: Code Cleanliness Automations (Black & Ruff)
* **Conceptual Focus:** Automating style reviews.
  * Running `black` to format code uniformly.
  * Using `ruff` as a high-speed linter and style auditor to identify dead imports, performance issues, and format violations automatically.

---

## 🛠️ Hands-On Assignment: HARDENED Device Driver Framework
Take a disorganized, untyped, and unmaintained legacy hardware automation testing suite and refactor it into a 100% type-safe, object-oriented framework.

### 1. Requirements
* Implement a thread-safe `InstrumentManager` using the Singleton pattern.
* Implement a `DeviceFactory` that dynamically instantiates device wrapper classes.
* Incorporate strict Mypy types across all classes—running `mypy --strict` must return **zero** errors or warnings.
* Automate code formatting: all files must compile cleanly and match `black` and `ruff` rules.

### 2. File Deliverables
* `manager.py`: Singleton connection manager.
* `factory.py`: Decoupled device driver factory.
* `drivers.py`: Base interfaces and specific instrument wrappers (using DOM).
* `test_hardened.py`: Test cases utilizing the drivers.

---

## 📋 Deliverables Checklist
- [ ] `manager.py` (Mypy type-hinted, thread-safe Singleton)
- [ ] `factory.py` (Dynamic object creator)
- [ ] `drivers.py` (DOM layout wrappers)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is the `Any` type annotation restricted under strict Mypy checks, and what type-safe alternatives exist?
2. How does the Singleton pattern prevent port conflict errors inside concurrent testing setups?
3. Explain how the Factory pattern helps you write HIL tests that can run seamlessly offline using mocked hardware.
4. What is the distinction between a low-level register write command and a Device Object Model (DOM) method?
5. How do Black and Ruff optimize developer efficiency in software engineering teams?

---

## 🚀 Stretch Task
Implement an **asynchronous connection supervisor**. Expand your Singleton Manager to incorporate a background monitoring thread that pings the target hardware connections dynamically every 5 seconds. If a connection is dropped, trigger automated hot-swapping recovery routines.

---

## 💡 Motivation Checkpoint
Enterprise automation frameworks (at companies like Google, Apple, or Intel) contain millions of lines of code. Dynamic typing and chaotic structure architectures lead to unmaintainable codebases. Applying clean OOP patterns and type annotations keeps frameworks maintainable, safe, and easily scalable across multiple test platforms.

---

## 🎓 Trainer Review Rules
* Verify type safety: Executing `mypy --strict` must pass with 0 errors.
* The framework must demonstrate successful Singleton behavior: instantiating the connection manager multiple times in different parts of the test run must yield the exact same memory pointer address.
