# Week 10: Code Standards, Static Analysis, & Testing

## 🎯 Weekly Goal
Adopt high-reliability, safety-critical programming standards (MISRA C), harness automated static analysis tools to identify structural defects, and build a comprehensive unit testing framework with 100% code coverage.

## 🎓 Weekly Outcome
By the end of this week, you will be able to refactor legacy C code into a 100% MISRA-compliant library, configure static analysis rules (`cppcheck`, `clang-tidy`), write robust unit tests using the Unity test framework, and generate HTML test coverage reports using `lcov`.

---

## 📅 Session Breakdown

### Monday: Safety-Critical C (MISRA Guidelines)
* **Conceptual Focus:** Why raw C is hazardous for critical systems (unpredictable behaviors, undefined behaviors).
  * Introduction to **MISRA C (Motor Industry Software Reliability Association)** guidelines.
  * Critical rules:
    * **Rule 1.3:** There shall be no occurrence of undefined or critical behavior.
    * **Rule 4.1:** Run-time checks shall be used to verify validity of values passed to APIs.
    * **Rule 11.3:** Casts shall not be performed between pointers to different object types.
    * **Rule 17.2:** Functions shall not call themselves either directly or indirectly (Recurse forbidden in critical embedded environments).

---

### Tuesday: Static Analysis Tools (`cppcheck` & `clang-tidy`)
* **Conceptual Focus:** The power of automated semantic auditing.
  * Difference between compiler syntax validation and static semantic validation.
  * Installing and running `cppcheck` to find memory leaks, portability problems, and safety hazards.
  * Running `clang-tidy` to check formatting and coding standards.
* **Hands-on Exercise:**
  Analyze a file containing latent errors using static analysis:
  ```bash
  # Run cppcheck on the codebase
  cppcheck --enable=all --inconclusive --addon=misra src/
  ```

---

### Wednesday: Unit Testing Framework (Unity)
* **Conceptual Focus:** The TDD (Test-Driven Development) mindset.
  * Decoupling systems so they can be tested in isolation (modular design).
  * Introduction to **Unity**, a lightweight C unit testing framework.
  * Structure of a unit test file: `setUp()`, `tearDown()`, `TEST_ASSERT_EQUAL()`, `TEST_ASSERT_NULL()`.
* **Hands-on Experiment:**
  Write a basic unit test scenario:
  ```c
  /* test_calculator.c */
  #include "unity.h"
  #include "calculator.h"
  
  void setUp(void) {}
  void tearDown(void) {}
  
  void test_addition_should_succeed(void) {
      TEST_ASSERT_EQUAL_INT(5, add(2, 3));
  }
  
  int main(void) {
      UNITY_BEGIN();
      RUN_TEST(test_addition_should_succeed);
      return UNITY_END();
  }
  ```

---

### Thursday: Test Coverage Profiling (`gcov` & `lcov`)
* **Conceptual Focus:** Ensuring all execution paths are hit.
  * **Code Coverage:** The percentage of statements, branches, and functions executed during testing.
  * Using GCC compiler flags `-fprofile-arcs -ftest-coverage` to generate profiling instructions.
  * Translating raw profile logs using `gcov` and rendering premium HTML dashboards using `lcov`.
* **Hands-on Exercise:** Compile your code with coverage profiling flags, run your unit tests, and generate HTML reports.

---

### Friday: Code Refactoring & Security Hardening
* **Conceptual Focus:** Re-architecting bad legacy codebases to follow professional standards, eliminating magic numbers, and wrapping data structures in secure API structures.

---

## 🛠️ Hands-On Assignment: HARDENED Ring Buffer Library
Take an unsafe, legacy, poorly written circular ring buffer C library and completely rewrite it into a 100% MISRA-compliant, statically checked, and 100% unit-tested library.

### 1. Requirements
* Implement `typedef struct { uint8_t *buffer; size_t capacity; size_t head; size_t tail; } RingBuffer;`
* Rewrite all operations (`init`, `push`, `pop`, `is_full`) to enforce defensive pointer and length checking (MISRA compliance).
* Run `cppcheck --enable=all` and fix all warnings.
* Write a minimum of 10 comprehensive unit tests using **Unity**.
* Achieve 100% statement and branch coverage, verified via `lcov`.

### 2. File Deliverables
* `ringbuffer.h`: Clean, safe declarations.
* `ringbuffer.c`: High-reliability circular buffer functions.
* `test_ringbuffer.c`: Unity unit testing scenarios.
* `Makefile`: Builds library, runs tests, and outputs coverage HTML report to `build/coverage/`.

---

## 📋 Deliverables Checklist
- [ ] `ringbuffer.h` (Strict header layout, MISRA checks)
- [ ] `ringbuffer.c` (Zero static warnings, fully hardened)
- [ ] `test_ringbuffer.c` (Unity test suite)
- [ ] `Makefile` (Automated target `make test` and `make coverage`)

---

## ❓ Self-Check Questions
1. Why does MISRA C forbid the use of recursive function calls in safety-critical systems?
2. What is the fundamental difference between dynamic testing (unit tests) and static analysis (`cppcheck`)?
3. How does branch coverage differ from statement coverage, and why is branch coverage significantly harder to satisfy?
4. In test frameworks, what exact roles do the functions `setUp()` and `tearDown()` perform before and after each test case?
5. Why are raw pointer type casts (such as casting `char *` directly to `float *`) prohibited under MISRA C?

---

## 🚀 Stretch Task
Configure your Makefile to run your unit tests through **Valgrind** automatically inside `make test`. If Valgrind detects any memory errors or leaks during test runs, force the test build target to fail and abort execution.

---

## 💡 Motivation Checkpoint
In automotive braking systems (ABS), flight control computers, and medical pacemakers, a single software crash can result in the loss of human lives. Strict adherence to standards like MISRA C and achieving 100% test coverage are not administrative chores—they are the ethical and professional baseline of systems engineering.

---

## 🎓 Trainer Review Rules
* Verify compliance: Run `cppcheck --enable=all` on the submitted files. Any style, performance, or portability warning triggers a failure.
* The test execution report must indicate 100% statement and branch coverage. If any logical branch in `ringbuffer.c` is not reached during test execution, the grade is capped at 6.
