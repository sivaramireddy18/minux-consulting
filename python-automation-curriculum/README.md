# Python for Embedded Systems & Automation Framework Design: Onboarding Guide

Welcome to the **Python for Embedded Systems & Automation Framework Design Master Plan**. This curriculum is designed by a Senior Systems Coach to transition engineering students into elite automation architects capable of constructing multi-threaded, hardware-in-the-loop (HIL) test suites and CI/CD pipelines.

In modern hardware teams, Python is the glue. It does not replace microcontroller microcode, but instead wraps around it, orchestrating compiler pipelines, running physical testing instruments (oscilloscopes, load units), logging high-speed sensor streams, and auditing binary compilation maps.

---

## 📂 Curriculum Workspace Layout

Your training environment is structured cleanly inside the `python-automation-curriculum/` folder:

```text
python-automation-curriculum/
├── README.md                      # This Onboarding & Setup Portal
├── python-trainer-rules.md        # Strict Python style laws, design patterns, and type policies
├── 12-week-python-roadmap.md      # Master chronological milestones timeline and summary
├── python-milestone-scorecard.md  # Gatekeeper assignments and grading scorecards
├── plans/                         # Deep-dive weekly execution plans
│   ├── week-01-python-plan.md     # Week 01: Host Automation & CLI wrapping
│   ├── week-02-python-plan.md     # Week 02: Hardware Scripting & Serial Communications
│   │   ...
│   └── week-12-python-plan.md     # Week 12: Production-Grade Capstone HIL Framework Project
└── build_pdf_python.py            # Automated compilation tool for PDF generation
```

---

## 🛠️ Environment Setup & Toolchain Index

To ensure reproducibility, you will manage dependencies using isolated virtual environments. Standard global pip installs are banned.

### 1. Ubuntu Linux Prereqs Installation
Ensure your host machine has Python 3.10+ and the required system packages installed:

```bash
sudo apt update && sudo apt install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    libusb-1.0-0-dev \
    weasyprint
```

### 2. Environment Isolation Setup
We will use Python's built-in `venv` module for environment isolation. Inside the curriculum root, run:

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade packaging tools
pip install --upgrade pip setuptools wheel
```

### 3. Core Automation Packages Checklist
Install the mandatory systems-level Python libraries within your virtual environment:

```bash
pip install \
    pytest \
    mypy \
    pyserial \
    pyelftools \
    pyvisa \
    pandas \
    matplotlib \
    click \
    black \
    ruff
```

---

## 🏛️ Static Analysis & Formatting Standards

All automation code developed in this curriculum must be audited defensively using static checkers:

1. **Strict Type Hinting (`mypy`):**
   All function parameters and returns must carry explicit type annotations. No untyped signatures allowed.
   ```bash
   mypy --strict src/
   ```
2. **Deterministic Formatting (`black`):**
   Automate visual consistency by running the black code formatter.
   ```bash
   black src/
   ```
3. **Advanced Linting (`ruff`):**
   Scan for style issues, dead code, and performance traps.
   ```bash
   ruff check src/
   ```

---

## 🏁 Let's Begin
Proceed next to read the [python-trainer-rules.md](file:///home/siva/sivaramireddy/Project1/python-automation-curriculum/python-trainer-rules.md) to understand the strict quality laws governing your submissions, and then trace your journey in [12-week-python-roadmap.md](file:///home/siva/sivaramireddy/Project1/python-automation-curriculum/12-week-python-roadmap.md)!
