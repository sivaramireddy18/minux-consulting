# Week 09: Dynamic CLI Tools & Metrics Reporting

## 🎯 Weekly Goal
Master the creation of professional command-line interface (CLI) utilities using the `click` library, parse automation test outputs dynamically, and auto-generate beautifully styled PDF/HTML reports complete with performance data plots.

## 🎓 Weekly Outcome
By the end of this week, you will be able to write complex nested CLI commands, validate arguments dynamically, process test execution results databases, generate Matplotlib analysis charts, and compile them into automated PDF metrics reports.

---

## 📅 Session Breakdown

### Monday: Advanced CLIs with `click`
* **Conceptual Focus:** Declaring structured command trees in Python.
  * Why standard `argparse` scales poorly for complex CLI utilities that require nested subcommands (like `git add` vs `git commit`).
  * Introduction to **Click (Command Line Interface Creation Kit)**.
  * Using decorators to declare commands (`@click.command`), subcommands (`@click.group`), parameters (`@click.option`), and argument validators.
* **Hands-on Experiment:**
  Build a basic Click subcommand tool:
  ```python
  import click
  
  @click.group()
  def cli() -> None:
      pass
      
  @cli.command()
  @click.option("--port", default="/dev/ttyUSB0", help="Serial port address")
  def connect(port: str) -> None:
      click.echo(f"Establishing serial connection to {port}")
      
  if __name__ == "__main__":
      cli()
  ```

---

### Tuesday: Click Types & Validation
* **Conceptual Focus:** Defensive CLI arguments.
  * Click parameter types: `click.Path` (validates path existence), `click.Choice` (restricts arguments to specific options), `click.IntRange`.
* **Hands-on Exercise:**
  Build a secure file parsing interface:
  ```python
  import click
  from pathlib import Path
  
  @click.command()
  @click.option(
      "--config", 
      type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
      required=True,
      help="Path to YAML test configuration file"
  )
  def run_test(config: Path) -> None:
      click.echo(f"Verified config path exists: {config}")
  ```

---

### Wednesday: Plotting Performance Metrics (Matplotlib)
* **Conceptual Focus:** Visualizing test results data.
  * Converting log arrays into statistical plots.
  * Generating voltage regulation sweeps, temperature rise logs, and test execution duration distributions.
  * Exporting charts dynamically to temporary files.
* **Hands-on Exercise:** Write a Python function that consumes a CSV log, generates a voltage-versus-time line graph, and saves it as a PNG image.

---

### Thursday: Automated PDF Reports Generation
* **Conceptual Focus:** Generating executive summary documents.
  * Creating styled reports using HTML structures and compiling them directly to PDF using **Weasyprint** within Python.
  * Injecting dynamic inline CSS, building tables of results, and embedding generated Matplotlib charts.
* **Hands-on Exercise:** Write a Python script that reads an HTML template, replaces placeholders with test statistics and chart images, and compiles it directly to a PDF.

---

### Friday: Interactive CLI Progress Animations
* **Conceptual Focus:** Enhancing user experiences.
  * Using Click UI helpers to display dynamic loaders (`click.progressbar`, spinners, status logs) while long-running tests are executing.

---

## 🛠️ Hands-On Assignment: Automated Test Report Compiler
Design and build a professional command-line utility named `report_compiler.py` using Click that processes CSV test log outputs and auto-generates a PDF report.

### 1. Requirements
* Create a Click CLI subcommand tree:
  * `report_compiler.py parse --log <path>`: Scans CSV log data and prints a summary to the console.
  * `report_compiler.py compile --log <path> --output <path>`: Generates Matplotlib voltage plots, builds a styled HTML file containing test pass/fail metrics tables, and compiles it via Weasyprint to a PDF report.
* Incorporate Click progress bars to show compilation status.
* All code must be strictly type-annotated, checked with Mypy, and Black formatted.

### 2. File Deliverables
* `report_compiler.py`: The main Click CLI and compiler script.
* `mock_test_results.csv`: A mockup test logs file.

---

## 📋 Deliverables Checklist
- [ ] `report_compiler.py` (Mypy type-hinted, Click groups)
- [ ] `mock_test_results.csv` (CSV log file)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is the Click library superior to `argparse` when constructing nested subcommands pipelines?
2. How does `click.Path(exists=True)` harden your command-line tools against runtime path errors?
3. Explain the mechanism used to embed dynamically generated Matplotlib plots into an HTML report before PDF compilation.
4. Why is the combination of HTML templates and Weasyprint preferred over raw PDF writing libraries (like ReportLab)?
5. What role do CLI progress indicators play in professional developer experience?

---

## 🚀 Stretch Task
Implement an **automated database summary hook**. Expand your tool so that it automatically parses a JUnit XML test results file, extracts failure details, and includes a dynamically styled "Failures Callout Box" in the generated PDF report highlighting failing files, line numbers, and tracebacks.

---

## 💡 Motivation Checkpoint
In automated manufacturing and silicon validation teams, test arrays run thousands of validation sweeps overnight. Directors and engineers cannot read millions of raw CSV log rows to check hardware health. Building automated CLI tools that compile logs, plot sweeps, and generate executive PDF reports enables rapid, clean engineering sign-offs.

---

## 🎓 Trainer Review Rules
* Verify CLI parameter security: Attempting to call the CLI with missing files or out-of-range limits must be intercepted by Click's default validators and exit cleanly without raising Python code exceptions.
* The compiled PDF must contain the embedded Matplotlib PNG charts cleanly aligned within page margins, without clipping or formatting overlaps.
