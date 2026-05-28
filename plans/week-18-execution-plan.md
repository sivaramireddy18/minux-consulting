# Weekly Execution Plan: Week 18

## 🎯 Weekly Goal
Master advanced Linux Bash shell scripting, harness stream editors (`sed`) and pattern processing languages (`awk`) for complex text manipulation, and build robust, automated system analysis tools to monitor target statistics.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented an **Automated Build, Test, and Analysis Suite** in Bash. They will be able to parse large raw text files, write complex regular expression find-and-replace rules, compile and run C binaries programmatically, and parse outputs to generate clean execution reports.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Bash Scripting Foundations & Advanced Logic
* **Conceptual Objective**: Master professional Bash scripting design patterns. Study exit status variables (`$?`), arguments parser parameters (`$1`, `$@`, `$#`), conditional checks (`if`, `case`), loops (`for`, `while`), environment scopes, and error safety declarations (`set -e`, `set -u`, `set -o pipefail`).
* **Practical Activity**:
  1. Write a script that checks directory paths and parses arguments safely.
  2. Implement function libraries with local variable definitions.
* **Code/Circuit Reference**:
```bash
#!/usr/bin/env bash
set -euo pipefail # Strict Mode

# Safe argument check
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_dir> <output_file>"
    exit 1
fi

SOURCE_DIR="$1"
OUTPUT_FILE="$2"
```

### Tuesday: Non-Interactive Stream Editing via `sed`
* **Conceptual Objective**: Study `sed` (Stream Editor)—the classic tool for parsing and transforming text streams. Master fundamental commands: substitution (`s/pattern/replacement/g`), line printing (`/pattern/p`), deletion (`d`), and inline modifications (`sed -i`).
* **Practical Activity**:
  1. Write a `sed` command to scan a source code file and automatically replace deprecated function symbols with new names.
  2. Strip comment lines (`//` and `/* */`) from source code programmatically.
* **Code/Circuit Reference**:
```bash
# Inline replace all occurrences of "old_func" with "new_func" in C files
sed -i 's/old_func/new_func/g' src/*.c

# Strip blank lines and trailing spaces
sed -i '/^$/d; s/[[:space:]]*$//' src/*.c
```

### Wednesday: Pattern Scanning & Processing via `awk`
* **Conceptual Objective**: Master `awk`—the powerful column-oriented pattern processing language. Understand `awk` record scanning structures (`BEGIN { ... }`, `/pattern/ { ... }`, `END { ... }`), built-in variables (`$0` raw line, `$1` first field, `NF` number of fields, `NR` record number, `FS` field separator).
* **Practical Activity**:
  1. Parse a CSV file containing telemetry statistics.
  2. Write an `awk` script to compute column means, locate maximum boundaries, and filter lines based on threshold values.
* **Code/Circuit Reference**:
```bash
# Calculate average CPU load from dynamic CSV logs
# Assuming CSV structure: timestamp,cpu_load,mem_used
awk -F',' 'NR > 1 { sum += $2; count++ } END { print "Average CPU Load: " sum/count "%" }' telemetry.csv
```

### Thursday: Automated Code Auditing & Performance Profiling
* **Conceptual Objective**: Learn how to automate unit testing pipelines. Understand how to run dynamic static checks (`cppcheck`), compile applications programmatically via Makefile calls, parse execution outcomes, and measure execution speeds.
* **Practical Activity**:
  1. Write a script to compile and run a target test harness.
  2. Read and parse console statistics dynamically.
* **Code/Circuit Reference**:
```bash
# Automated Make compilation check
if make; then
    echo "Compilation: PASSED"
else
    echo "Compilation: FAILED"
    exit 1
fi
```

### Friday: Systems Analysis Report Generation
* **Conceptual Objective**: Comprehend the design structure of a complete build automation report. Combine pipelines, `sed`, `awk`, and directory parsers to create standardized test summaries.
* **Practical Activity**:
  1. Assemble all features into a unified analysis script.
  2. Run the pipeline and output a clean execution dashboard.

---

## 🛠️ Hands-On Assignment: Automated CI/CD Build & Test Suite

### Functional Requirements
Create a professional Bash automated build and test pipeline named `ci_pipeline.sh`.
1. The script must parse a project workspace directory path as a parameter.
2. Enable strict error handling: `set -euo pipefail`.
3. Programmatically perform the following steps:
   - **Audit Stage**: Scan all `.c` and `.h` files. Use `grep` and `sed` to flag trailing spaces and count comments. Fail the pipeline if any forbidden functions (`malloc()`) are found.
   - **Build Stage**: Run `make clean` followed by `make`. Parse compilation logs. If compilation warnings are detected, output `WARNING: Warning-free builds required` and fail.
   - **Test Stage**: Run the executable. Redirect standard outputs to a temporary log.
   - **Analysis Stage**: Use `awk` to parse the output logs. The program outputs lines like `SENSOR_DATA,ID=101,VAL=23.5`. `awk` must extract values, calculate the minimum, maximum, and average values, and fail if any values exceed warning thresholds (e.g., value > 50).
4. Output a final, formatted status dashboard to `build_report.txt` indicating pass/fail status for every stage.

### Structural Requirements & Code Skeleton
**`ci_pipeline.sh` (Shell Skeleton)**:
```bash
#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <project_path>"
    exit 1
fi

PROJECT_PATH="$1"
REPORT="build_report.txt"

echo "=== Automated CI/CD Build Report ===" > "$REPORT"
echo "Project: $PROJECT_PATH" >> "$REPORT"
echo "Timestamp: $(date)" >> "$REPORT"
echo "------------------------------------" >> "$REPORT"

cd "$PROJECT_PATH"

# 1. Audit
echo "Running code audit..."
if grep -rnE "malloc\(|free\(" src/ include/ > /dev/null 2>&1; then
    echo "Audit: FAILED (Forbidden heap calls found)" >> "$REPORT"
    exit 1
else
    echo "Audit: PASSED" >> "$REPORT"
fi

# 2. Build
echo "Compiling project..."
if make > build.log 2>&1; then
    if grep -iq "warning" build.log; then
        echo "Build: FAILED (Compilation warning detected)" >> "$REPORT"
        exit 1
    fi
    echo "Build: PASSED" >> "$REPORT"
else
    echo "Build: FAILED (Compilation error)" >> "$REPORT"
    exit 1
fi

# 3. Test & Analysis
echo "Running functional tests..."
./build/app > test.log 2>&1 || true

# Extract sensor values using awk
awk '
BEGIN {
    count = 0; sum = 0; max = -999; min = 999; threshold = 50.0; exceeded = 0;
}
/SENSOR_DATA/ {
    split($2, id_part, "=");
    split($3, val_part, "=");
    val = val_part[2];

    count++;
    sum += val;
    if (val > max) max = val;
    if (val < min) min = val;
    if (val > threshold) exceeded++;
}
END {
    print "Processed " count " telemetry samples.";
    if (count > 0) {
        avg = sum / count;
        print "Telemetry Min: " min;
        print "Telemetry Max: " max;
        print "Telemetry Avg: " avg;
        if (exceeded > 0) {
            print "WARNING: " exceeded " samples exceeded threshold!";
            exit 2;
        }
    } else {
        print "ERROR: No telemetry samples found.";
        exit 3;
    }
}
' test.log >> "$REPORT" 2>&1

status=$?
if [ $status -eq 0 ]; then
    echo "Analysis: PASSED" >> "$REPORT"
elif [ $status -eq 2 ]; then
    echo "Analysis: FAILED (Threshold Exceeded)" >> "$REPORT"
else
    echo "Analysis: FAILED (No Data)" >> "$REPORT"
fi

cat "$REPORT"
```

---

## 📦 Deliverables
* [ ] Automated script `ci_pipeline.sh`.
* [ ] Target application workspace to compile and test.
* [ ] Executable build report `build_report.txt` indicating completed pipeline runs.

---

## ❓ Self-Check Questions
1. Why is the statement `set -euo pipefail` critical when writing professional, production-grade automation scripts? Explain what each flag does.
2. How does `sed` substitution logic work? Write a `sed` command to replace all occurrences of `uint8` with `uint8_t` recursively in C files.
3. What is the execution flow of `awk` scripts? Differentiate the roles of `BEGIN`, pattern scanning, and `END` blocks.
4. How do you parse command line flags (e.g., `-b`, `-t`) dynamically inside a Bash script? Explain `getopts`.
5. Why are automation validation checks crucial inside large-scale firmware organizations?

---

## 🚀 Stretch Task (Optional)
Extend the automation pipeline to run under a **cron schedule**: configure your host cron daemon to trigger the `ci_pipeline.sh` automatically every hour, email reports on failures, and log historic trends.

## 💡 Motivation Checkpoint
Continuous Integration and Deployment (CI/CD) is the backbone of modern tech companies. When firmware developers commit changes, automated build servers pull the branch, run audits, compile toolchains, flash hardware nodes, and parse execution results instantly. Mastery of Bash, `sed`, and `awk` is the foundational key to unlocking automated pipelines.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Script handles exit states safely.
  - Pattern rules inside `awk` correctly extract and compute telemetry ranges.
  - Zero compilation warnings are tolerated in target compiles.
* **Fail Criteria**:
  - Hardcoded paths or environment setups that fail on foreign host environments.
  - Missing bounds checks.
