# Daily Study & Reflection Tracker

Students should copy this template at the beginning of each day to maintain an active log of their learning journey, debug logs, and architectural realizations.

---

## 🗓️ Date: [YYYY-MM-DD] | Week: [01-36] | Day: [Mon/Tue/Wed/Thu/Fri]

### ⏰ Time Allocation & Focus Blocks
* **Block 1 (AM - Core Study)**: [Start Time] to [End Time] (Focus topic: __________)
* **Block 2 (PM - Hands-on Lab)**: [Start Time] to [End Time] (Focus topic: __________)
* **Total Focus Hours**: ____ Hours

---

## 🧠 Daily Deep-Dive & Realizations
*Summarize today's core technical takeaways in your own words. Do not copy paste. Describe the underlying hardware mechanics, system call interactions, or register logic you unlocked.*
* **Key Takeaway 1**:
* **Key Takeaway 2**:
* **Key Takeaway 3**:

---

## 🚧 Debugging Log & Technical Blockages
*Embedded systems engineers spend 80% of their time debugging. Document any bugs, compiler errors, linker failures, or hardware lock-ups you faced today, how you diagnosed them, and how you resolved them.*

### Bug 1: [Short Title, e.g., UART Baud Rate Off-by-Half]
* **Symptom**: (e.g., Serial terminal outputs garbage characters at 115200 baud).
* **Diagnosis Steps Taken**: (e.g., Connected logic analyzer, measured Tx bit width. Found bit width was 17.3µs instead of expected 8.68µs. Baud rate was running at ~57600).
* **Root Cause**: (e.g., MCU core clock configuration register was left at default, meaning APB1 clock was 8MHz instead of 16MHz. Baud rate calculation divisor was wrong).
* **Resolution**: (e.g., Modified `system_stm32f4xx.c` to enable PLL and configure APB1 prescaler correctly, matching UART divisor parameters).

### Bug 2: [Short Title]
* **Symptom**:
* **Diagnosis Steps**:
* **Root Cause**:
* **Resolution**:

---

## 💾 Git Checkpoint & Commit Summary
*Ensure you are pushing atomic, clean commits every day. Check your local Git log.*
* **Latest Commit Hash**: `[Insert Commit SHA-1]`
* **Commit Message**: `[e.g., feat(uart): add interrupt-driven Tx support with ring buffer]`
* **Changed Files**:
  * [ ] File 1
  * [ ] File 2

---

## 📝 Tomorrow's Game Plan
*State the specific goals, register targets, or software layers you will write tomorrow to stay on pace.*
1.
2.
3.
