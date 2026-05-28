# Professional C Systems Programming Master Plan: Onboarding & Setup Guide

Welcome to the **Professional C Systems Programming Master Plan**. This curriculum is designed by a Senior Systems Coach to transition aspiring engineers from basic syntax writing into production-grade systems C programming.

C is not just a language; it is an interface to the hardware and the operating system. To write secure, highly performant, and safety-critical C code (such as for space exploration, automotive control, or kernel development), you must understand compiler operations, memory segment layout, and CPU instruction pipelines.

---

## 📂 Curriculum Workspace Layout

Your training environment is structured cleanly inside the `c-curriculum/` folder. Ensure your workspace maps exactly to this layout:

```text
c-curriculum/
├── README.md                      # This Onboarding & Setup Portal
├── c-trainer-operating-rules.md   # Strict coding laws, MISRA standards, and grading criteria
├── 12-week-c-roadmap.md           # Master chronological milestones timeline and summary
├── c-milestone-scorecard.md       # Gatekeeper assignments and grading scorecards
├── plans/                         # Deep-dive weekly execution plans
│   ├── week-01-c-plan.md          # Week 01: Compiler Mechanics & Build Systems
│   ├── week-02-c-plan.md          # Week 02: Types, Representations, & CPU Realities
│   │   ...
│   └── week-12-c-plan.md          # Week 12: Production-Grade Capstone Systems Project
└── build_pdf_c.py                 # Automated compilation tool for PDF generation
```

---

## 🛠️ High-Intensity Professional Toolchain Setup

In this program, **integrated development environments (IDEs) with automatic build buttons are banned**. You must understand every compiler flag, linker phase, and debugging diagnostic directly from first-principles using terminal tools.

### 1. Ubuntu Linux Environment Checklist
Ensure your host machine has the proper toolchain tools installed:

```bash
sudo apt update && sudo apt install -y \
    build-essential \
    gcc \
    clang \
    make \
    gdb \
    valgrind \
    cppcheck \
    clang-tidy \
    lcov \
    weasyprint
```

### 2. The Professional Compiler Configuration
All code generated during this curriculum **must compile without warnings under the following strict flags**:

* `-Wall`: Enable all standard warnings.
* `-Wextra`: Enable extra warnings not covered by `-Wall`.
* `-Werror`: **Treat all warnings as errors**. Any warning triggers a compilation failure.
* `-pedantic`: Issue all warnings demanded by strict ISO C.
* `-std=c11`: Use the strict standard C11 dialect.

Example Compilation:
```bash
gcc -std=c11 -Wall -Wextra -Werror -pedantic -O2 main.c -o system_prog
```

### 3. Core Developer Tools Index
* **Compiler (GCC / Clang):** For converting human-readable C source files into ELF-formatted binaries.
* **Build System (GNU Make):** For incremental, dependency-tracked compiles. You will write robust Makefiles from scratch.
* **Memory Analyzer (Valgrind):** For checking heap memory leaks, uninitialized memory reads, buffer overflows, and invalid frees.
* **Static Analyzers (Cppcheck & Clang-Tidy):** For identifying structural design flaws and checking coding standard violations.
* **Debugger (GDB):** For register audits, stack backtraces, memory watches, and segmentation fault debugging.
* **Coverage Tracker (Gcov / Lcov):** For ensuring unit tests hit 100% of branch and statement pathways.

---

## 🎓 The Elite Pedagogical Model

This is not a traditional academic course. Your coach treats you as a **Junior Firmware Engineer** in a high-stakes engineering environment:

1. **Daily Cadence:** Focus on the concepts allocated for each day. Follow the day's session breakdown and execute the minor code checks.
2. **Weekly Assignments:** Delivered as production-ready specifications. You must build, compile, and document your projects.
3. **No Safety Nets:** You write your own tests, write your own Makefiles, and debug your own segmentation faults.
4. **Pedagogical Gates:** You *cannot* proceed to a new milestone without passing the corresponding gatekeeper milestone assignment listed in the `c-milestone-scorecard.md`.

---

## 🏁 Let's Begin
Proceed next to read the [c-trainer-operating-rules.md](file:///home/siva/sivaramireddy/Project1/c-curriculum/c-trainer-operating-rules.md) to understand the strict quality laws governing your submissions, and then trace your journey in [12-week-c-roadmap.md](file:///home/siva/sivaramireddy/Project1/c-curriculum/12-week-c-roadmap.md)!
