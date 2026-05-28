# Week 11: CI/CD Pipelines & Execution Orchestration

## 🎯 Weekly Goal
Harness Continuous Integration (CI/CD) engines to orchestrate hardware automation suites automatically on code changes, generate and parse standard JUnit XML test reports, and automate status alerts.

## 🎓 Weekly Outcome
By the end of this week, you will be able to write robust CI/CD pipeline scripts (GitHub Actions YAML / Jenkinsfile), configure automated execution environments, parse pytest JUnit XML results databases, check coverage thresholds dynamically, and automate Slack alerts.

---

## 📅 Session Breakdown

### Monday: The CI/CD Hardware Pipeline
* **Conceptual Focus:** The automated hardware release flow.
  * In professional engineering, every commit triggers automated builds.
  * **The HIL Pipeline:** When a developer pushes C code to a repository, the CI/CD server triggers a pipeline that:
    1. Compiles the firmware.
    2. Runs static code audits.
    3. Deploys the firmware to a physical HIL test bench.
    4. Invokes Python pytest automation suites.
    5. Records and parses results.
* **Hands-on Experiment:**
  Trace block maps of a CI/CD server connecting to a local physical HIL host runner.

---

### Tuesday: JUnit XML Reporting
* **Conceptual Focus:** Standardizing test data.
  * JUnit XML is the global standard format for representing test results.
  * Configuring pytest to output JUnit XML databases:
    ```bash
    pytest --junitxml=build/report.xml
    ```
  * Parsing XML structures in Python using the `xml.etree.ElementTree` library to count passes, failures, and execution times.
* **Hands-on Exercise:**
  Parse a test report dynamically and output metrics to the console:
  ```python
  import xml.etree.ElementTree as ET
  
  tree = ET.parse("report.xml")
  root = tree.getroot()
  
  # Extract summary attributes
  tests = int(root.attrib.get("tests", 0))
  failures = int(root.attrib.get("failures", 0))
  print(f"Total Tests Executed: {tests} | Failures: {failures}")
  ```

---

### Wednesday: GitHub Actions for Automation
* **Conceptual Focus:** Writing workflow scripts.
  * Understanding GitHub Actions runner structures.
  * Structuring steps: checking out code, caching dependencies, setting up Python environments, running pytest, and archiving artifact reports.
* **Hands-on Exercise:**
  Build a basic `.github/workflows/test.yml` runner configuration:
  ```yaml
  name: Automated Automation Tests
  on: [push]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Set up Python
          uses: actions/setup-python@v4
          with:
            python-version: '3.10'
        - name: Install dependencies
          run: |
            pip install -r requirements.txt
        - name: Run test suite
          run: |
            pytest --junitxml=build/report.xml
  ```

---

### Thursday: Pipeline Quality Gates
* **Conceptual Focus:** Enforcing baseline metrics.
  * Blocking merges if code coverage falls below 90%, if there are static analysis warnings, or if any core hardware test case fails.

---

### Friday: Slack & Email Notification Webhooks
* **Conceptual Focus:** Keeping teams informed.
  * Sending automated HTTP POST requests containing styled Markdown results summaries directly to team Slack channels after build completes.

---

## 🛠️ Hands-On Assignment: Automated HIL Pipeline Orchestrator
Design and implement a complete **Automated Test Orchestrator script** (`pipeline_orchestrator.py`) and a GitHub Actions workflow that executes tests and alerts on failures.

### 1. Requirements
* Write a Python script `pipeline_orchestrator.py` that:
  1. Spawns pytest as a subprocess to execute the test suite and output `report.xml`.
  2. Parses `report.xml` using `xml.etree.ElementTree`.
  3. Formats an executive Markdown build summary (e.g. *Tests Run: 15, Passed: 14, Failures: 1*).
  4. Simulates dispatching this report via an HTTP POST request to a Slack webhook.
* Write a `.github/workflows/hil.yml` file that orchestrates the execution dynamically.
* All code must be strictly type-annotated, checked with Mypy, and Black formatted.

### 2. File Deliverables
* `pipeline_orchestrator.py`: Main parsing and dispatch script.
* `hil.yml`: GitHub Actions pipeline YAML configuration.

---

## 📋 Deliverables Checklist
- [ ] `pipeline_orchestrator.py` (Mypy type-hinted, XML parsing)
- [ ] `hil.yml` (Complete GitHub Action script)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why is JUnit XML the preferred standard format for continuous integration test outputs?
2. How do you construct a pipeline step in GitHub Actions that only executes if previous steps failed (capturing crash logs)?
3. What is a "Pipeline Quality Gate," and how does it protect main repository branches?
4. Explain how webhooks utilize HTTP POST payloads to transmit test data directly to Slack.
5. In enterprise environments, how do local self-hosted runners differ from cloud runners when accessing physical lab hardware?

---

## 🚀 Stretch Task
Modify your orchestrator script to **auto-parse tracebacks**. Expand the XML parser so that if a test case fails, it automatically extracts the failure's stack traceback details and appends a "Developer Debugging Callout" directly into the Slack notification payload.

---

## 💡 Motivation Checkpoint
Continuous integration is the heart of professional Agile engineering. Software giants and automotive manufacturers trigger millions of automated pipeline jobs daily. Setting up self-executing pipelines with rigorous quality gates ensures that buggy or unsafe code is blocked from ever reaching production hardware systems.

---

## 🎓 Trainer Review Rules
* Verify type safety: Executing `mypy --strict pipeline_orchestrator.py` must complete with 0 alerts.
* The XML parser must handle empty or malformed XML files cleanly, raising custom structured error alerts instead of crashing with raw parsing tracebacks.
