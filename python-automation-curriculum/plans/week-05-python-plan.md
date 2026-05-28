# Week 05: Test Framework Architecture (pytest & Fixtures)

## 🎯 Weekly Goal
Master the pytest testing framework, leverage the power of dependency-injection fixtures to isolate hardware states, build parameterized test matrixes, and implement defensive hardware timeout and retry mechanisms.

## 🎓 Weekly Outcome
By the end of this week, you will be able to construct stateless test suites, write scoped setup/teardown fixtures that manage physical instrument lifetimes, write parameterized test cases to verify systems across varying bounds, and generate structured XML test results.

---

## 📅 Session Breakdown

### Monday: The Pytest Architecture
* **Conceptual Focus:** Professional testing paradigms.
  * Why standard `unittest` is archaic (too boilerplate, relies on heavy class inheritance).
  * Pytest's functional testing approach.
  * Test discovery rules (looks for files matching `test_*.py` and functions matching `test_*`).
  * Basic assertions and pytest command-line switches (`-v` verbose, `-s` show stdout, `-x` exit on first failure).
* **Hands-on Experiment:** Write a simple test file and run it using pytest.

---

### Tuesday: The Power of Fixtures
* **Conceptual Focus:** Stateless test isolation.
  * What is a **Fixture**? A helper function that executes setups (pre-test configuration) and teardowns (post-test cleanup).
  * **Fixture Scoping:** Controlling fixture lifetimes:
    * `function` (default): Runs once for every test case.
    * `module`: Runs once per test file.
    * `session`: Runs once per test suite execution.
  * **The Yield Keyword:** Splitting setup and teardown phases.
* **Hands-on Exercise:**
  Build a fixture managing a mock connection:
  ```python
  import pytest
  
  @pytest.fixture(scope="function")
  def database_connection():
      # Setup phase
      conn = "ESTABLISHED"
      print("\n[SETUP] DB Connection opened.")
      yield conn
      # Teardown phase
      print("\n[TEARDOWN] DB Connection closed.")
  
  def test_query(database_connection):
      assert database_connection == "ESTABLISHED"
      print(" -> Running test query.")
  ```
  Run with: `pytest -s -v test_file.py` and inspect the setup/teardown sequence.

---

### Wednesday: Hardware Fixtures & Resource Protection
* **Conceptual Focus:** Injecting hardware drivers cleanly.
  * Managing lab equipment connections safely.
  * Session-scoped fixtures establish hardware handles once, while function-scoped fixtures reset instrument outputs to safe baselines before every test.
* **Hands-on Exercise:** Write a session-scoped fixture that opens a VISA instrument and a function-scoped fixture that resets it to factory defaults.

---

### Thursday: Parameterized Test Matrixes
* **Conceptual Focus:** High-scale verification matrices.
  * Avoid duplicate test code. Using `@pytest.mark.parametrize` to run a single test block across a list of varying inputs.
* **Hands-on Exercise:**
  Parameterize a voltage check:
  ```python
  import pytest
  
  @pytest.mark.parametrize("voltage, current", [
      (1.2, 0.1),
      (3.3, 0.5),
      (5.0, 1.0)
  ])
  def test_voltage_limits(voltage, current):
      print(f"Testing target power state: {voltage}V @ {current}A")
      assert voltage <= 5.0
  ```

---

### Friday: Hardware Retries & Timeouts
* **Conceptual Focus:** Dealing with intermittent hardware noise.
  * Hardware tests occasionally fail due to minor signal noise.
  * Implementing retry decorators and managing execution timeouts defensively.

---

## 🛠️ Hands-On Assignment: Hardware Characterization Test Suite
Design and implement a modular pytest test suite (`test_hardware.py`) that audits a target device's electrical power states.

### 1. Requirements
* Wrap the `ProgrammablePowerSupply` driver (from Week 4) inside a pytest fixture.
* Structuring the fixtures:
  * `instrument_session` (session-scoped): Establishes the VISA connection and yields the driver object. Teardown must disable output and close VISA resource.
  * `power_rail` (function-scoped): Accepts `instrument_session`, resets it, sets standard voltage safety limits, and yields the driver.
* Write a parameterized test case `test_voltage_regulation`:
  * Tests voltage settings from `1.0V` to `5.0V` in `0.5V` steps.
  * In each test: sets power supply voltage, sleeps for 100ms, measures active voltage, and asserts that the measured voltage is within a 2% margin of the commanded voltage.
* Code must be fully type-hinted and pass `mypy --strict`.

### 2. File Deliverables
* `test_hardware.py`: The pytest file.
* `conftest.py`: Shared fixtures file (pytest standard).
* `pytest.ini`: Framework configuration file.

---

## 📋 Deliverables Checklist
- [ ] `conftest.py` (Session and function fixtures)
- [ ] `test_hardware.py` (Parameterized test cases)
- [ ] `pytest.ini` (Config files)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is global state sharing considered highly dangerous when writing automated hardware testing suites?
2. Explain how the `yield` statement partitions setup and teardown stages inside a pytest fixture.
3. What are the mechanical differences between a `session`-scoped fixture and a `function`-scoped fixture?
4. How does the decorator `@pytest.mark.parametrize` optimize code reuse when testing boundaries?
5. Why should a hardware test case incorporate explicit test timeouts, and how do you achieve this in pytest?

---

## 🚀 Stretch Task
Write a custom **pytest plugin hook** (inside `conftest.py`) that captures test execution statistics. If a test case fails, intercept the hook, query the simulated instrument's error queue automatically, and append the device error log directly into the pytest failure report.

---

## 💡 Motivation Checkpoint
Automated test coverage is the line between quality hardware and catastrophic failure. Hardware teams at companies like Tesla and SpaceX run thousands of parameterized test scenarios dynamically against ECUs and batteries. Structuring tests stateless and isolating hardware resources via fixtures prevents cascading test failures and guarantees clean test execution data.

---

## 🎓 Trainer Review Rules
* Verify type-safety: Executing `mypy --strict test_hardware.py conftest.py` must complete with 0 alerts.
* Verify clean teardowns: Force a test to fail (e.g. inject an assert failure). The teardown code inside fixtures must still execute, cut the output power rails of the simulated supply, and close the sockets cleanly.
