# Week 01: Host Automation & CLI Wrapping

## 🎯 Weekly Goal
Master Python's system scripting boundaries, control compiler and hardware flashing CLI tools via the `subprocess` module, handle path manipulations cleanly, and construct robust command-line argument parsers.

## 🎓 Weekly Outcome
By the end of this week, you will be able to launch and monitor system processes defensively from Python, capture and parse stdout/stderr streams without blocking thread execution, handle paths portably across systems using `pathlib`, and build type-safe CLI tools.

---

## 📅 Session Breakdown

### Monday: The Subprocess Execution Model
* **Conceptual Focus:** Interfacing Python with the operating system shell.
  * Why `os.system` is deprecated and dangerous (vulnerable to shell-injection security flaws).
  * The `subprocess` module as the modern standard.
  * Running blocking processes using `subprocess.run`.
  * Running asynchronous non-blocking processes using `subprocess.Popen`.
* **Hands-on Experiment:**
  Execute a system directory listing safely:
  ```python
  import subprocess
  
  # Run list directory command
  result = subprocess.run(
      ["ls", "-la"],
      capture_output=True,
      text=True,
      check=True
  )
  print("STDOUT output:")
  print(result.stdout)
  ```

---

### Tuesday: Defensive Stream Redirects & Timeouts
* **Conceptual Focus:** Preventing hung processes.
  * In automation frameworks, calling a flashing tool that hangs indefinitely can freeze entire CI/CD pipelines.
  * **The Law:** All subprocess calls *must* enforce explicit execution timeouts.
  * Capturing error outputs by mapping `stderr` to `stdout` pipes.
* **Hands-on Exercise:**
  Catch execution timeouts and parse shell errors dynamically:
  ```python
  import subprocess
  
  try:
      # Simulate a process that hangs (sleep 10) but set a 2 second timeout
      subprocess.run(["sleep", "10"], timeout=2)
  except subprocess.TimeoutExpired as e:
      print(f"Process timed out safely! Details: {e}")
  ```

---

### Wednesday: Path Operations (`pathlib`)
* **Conceptual Focus:** The portability trap.
  * Windows uses backslashes (`\`) for file paths; Linux uses forward slashes (`/`). Hardcoding strings breaks code cross-platform.
  * **The Solution:** Python's modern `pathlib` library representing paths as abstract system objects rather than strings.
* **Hands-on Experiment:**
  Manipulate directory workspaces portably:
  ```python
  from pathlib import Path
  
  # Get absolute path of current directory
  curr_dir = Path(".").resolve()
  print(f"Absolute Workspace: {curr_dir}")
  
  # Join paths and create folders
  build_dir = curr_dir / "build" / "output"
  build_dir.mkdir(parents=True, exist_ok=True)
  print(f"Build output directory successfully created: {build_dir.exists()}")
  ```

---

### Thursday: Argument Parsing (`argparse`)
* **Conceptual Focus:** Designing structured user interfaces.
  * Writing custom command-line interfaces (CLIs).
  * Validating argument data types, setting defaults, and generating help manuals.
* **Hands-on Exercise:**
  Build a basic CLI configuration script:
  ```python
  import argparse
  
  def main() -> None:
      parser = argparse.ArgumentParser(description="Compiler automation tool.")
      parser.add_argument("-t", "--target", required=True, help="MCU target string (e.g. esp32, rp2040)")
      parser.add_argument("-v", "--voltage", type=float, default=3.3, help="Input voltage check value")
      args = parser.parse_args()
      print(f"Target: {args.target}, Voltage check: {args.voltage}V")
  
  if __name__ == "__main__":
      main()
  ```

---

### Friday: Configuration Files (YAML / JSON)
* **Conceptual Focus:** Bypassing hardcoded configuration scripts.
  * Reading and validating test configuration parameters dynamically from files.

---

## 🛠️ Hands-On Assignment: Automated GCC & Flashing Wrapper
Design and build a robust Python automation command-line tool named `flash_build.py` that automates compiler and flashing pipelines.

### 1. Requirements
* Provide a CLI interface that accepts: `--src` (path to C source folder), `--bin` (path to output binary), and `--baud` (baudrate for flashing).
* Using the `subprocess` module:
  1. Compile all C files in the target folder using `gcc -Wall -Wextra -Werror` inside a 5-second execution timeout.
  2. If compilation fails, parse the stderr output and highlight compiler error lines.
  3. If compilation succeeds, simulate a hardware flashing process by calling a mockup flashing script, handling timeout exceptions cleanly.
* All code must be strictly type-annotated and pass `mypy --strict`.

### 2. File Deliverables
* `flash_build.py`: Main CLI tool code.
* `test_workspace/`: A folder containing both a clean-compiling C file and a broken C file for test scenarios.

---

## 📋 Deliverables Checklist
- [ ] `flash_build.py` (Mypy type-hinted, zero warnings)
- [ ] `test_workspace/` (C compile verification targets)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is passing arguments as a list (e.g. `["ls", "-l"]`) in `subprocess` significantly safer than passing a single string (`"ls -l"`)?
2. What happens to a subprocess that exceeds its timeout threshold, and how do you recover?
3. How does `pathlib.Path` resolve path separators differences when running on a Windows vs Linux machine?
4. Explain the difference between blocking `subprocess.run()` and non-blocking `subprocess.Popen()`.
5. Why are hardcoded configurations inside scripts considered a major design flaw in testing frameworks?

---

## 🚀 Stretch Task
Modify your flashing wrapper to support **parallel compilations**. Implement a multi-processed compile manager that calls parallel compilers dynamically to compile multiple C files concurrently, merging outputs safely.

---

## 💡 Motivation Checkpoint
In silicon development teams, automated scripts compile and flash firmware thousands of times a day across massive server farms. A single unhandled timeout or path corruption can freeze testing arrays and waste thousands of development dollars. Writing robust, defensive system scripts is the first step of automation architecture.

---

## 🎓 Trainer Review Rules
* Verify type-safety: Executing `mypy --strict flash_build.py` must complete with 0 alerts.
* Verify subprocess handling: Executing a compiler call that fails must be intercepted, and the clean terminal output must display *only* the compiler's syntax errors without throwing Python traceback crashes.
