# Weekly Execution Plan: Week 13

## 🎯 Weekly Goal
Establish absolute proficiency within the Linux command line environment, master file operations, system permissions, the Filesystem Hierarchy Standard (FHS), process listing, and shell configurations.

## 🏆 Weekly Outcome
By Friday, the student will be comfortable operating entirely without a GUI inside a remote Linux terminal. They will be able to perform structural file surgery, manipulate directories, alter group and owner permissions using octal structures, manage host environment variables, and build core terminal processing operations using pipelined commands.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Terminal Interface & Directory Navigation
* **Conceptual Objective**: Understand virtual terminal interfaces, terminal emulators (Tty), the default shell, absolute vs relative paths, and basic commands. Study directory listing filters and the physical directory mapping layouts.
* **Practical Activity**:
  1. Practice advanced terminal navigations (`cd`, `ls`, `pwd`, `mkdir`, `rmdir`, `cp`, `mv`, `rm`).
  2. Master recursive operations (`rm -rf`) and custom file details configurations.
* **Code/Circuit Reference**:
```bash
# Detailed recursive file list sorting by modification time
ls -laRt --color=auto

# Safe copying verifying paths
cp -ivp src_file.c dest_dir/
```

### Tuesday: The Filesystem Hierarchy Standard (FHS) & Path Management
* **Conceptual Objective**: Master the Filesystem Hierarchy Standard (FHS) of Linux systems. Comprehend the physical role of every directory: `/bin`, `/sbin`, `/usr/bin`, `/etc` (configurations), `/var` (variable data/logs), `/dev` (device files), `/sys` & `/proc` (virtual kernel filesystems), and `/opt` (optional third-party software).
* **Practical Activity**:
  1. Explore virtual file listings inside `/sys/class` and `/proc`.
  2. Locate where system log files reside (`/var/log/syslog`) and monitor kernel outputs.
* **Code/Circuit Reference**:
```bash
# Monitor kernel messages in real-time
tail -f /var/log/syslog | grep -i usb

# Check system cpu info virtual file representation
cat /proc/cpuinfo
```

### Wednesday: Permissions, Ownership, and Security Controls
* **Conceptual Objective**: Master the Linux file security model: User (u), Group (g), and Others (o). Understand read (r=4), write (w=2), execute (x=1) permissions, directory execute permission (allows entering directory), `chmod` octal structures, and ownership transitions using `chown` and `chgrp`.
* **Practical Activity**:
  1. Create a script and attempt to execute it. Note permission denied error.
  2. Apply precise octal permissions (`chmod 755` and `chmod 600`) and verify access boundaries.
* **Code/Circuit Reference**:
```bash
# Set owner read/write, group read, other none (0640)
chmod 640 secure_config.conf

# Check permissions outputs
ls -l secure_config.conf
# Output matches: -rw-r----- 1 user group ...
```

### Thursday: Pipelining, Redirection, and Text Processing Filters
* **Conceptual Objective**: Master the core philosophy of UNIX: combine small, modular utilities using pipes (`|`) and redirection symbols (`>` overwrite, `>>` append, `<` input). Study text processing filters (`grep`, `head`, `tail`, `wc`, `sort`, `uniq`).
* **Practical Activity**:
  1. Build pipeline scripts to parse large system logs.
  2. Extract, sort, and isolate specific network log statistics using text processing filters.
* **Code/Circuit Reference**:
```bash
# Isolate top 10 most frequent warning messages in syslog
cat /var/log/syslog | grep -i warning | awk '{print $5, $6}' | sort | uniq -c | sort -nr | head -n 10
```

### Friday: Environment Variables, Processes, and System Controls
* **Conceptual Objective**: Understand that shells track configurations via Environment Variables (`env`, `printenv`). Study process control signals: how to list active processes (`ps aux`, `htop`), check memory states (`free -h`), and terminate processes safely using signals (`kill`, `killall`, `pkill`).
* **Practical Activity**:
  1. Configure custom environment paths dynamically.
  2. Start background sleep tasks, locate their Process IDs (PID), and terminate them using different signals (`SIGTERM` 15 vs `SIGKILL` 9).
* **Code/Circuit Reference**:
```bash
# Start background process
sleep 300 &
[1] 12345 # returns PID

# Check state and terminate
ps -ef | grep "sleep"
kill -9 12345
```

---

## 🛠️ Hands-On Assignment: Automated System Analytics Dashboard

### Functional Requirements
Create a fully functional shell analysis pipeline that generates a system diagnostics status dashboard inside a remote workspace directory.
1. The analysis tool must be a single file `sys_dashboard.sh`.
2. Ensure the script has proper execution permissions and handles system errors safely.
3. The dashboard must programmatically calculate and output:
   - **Host Name & OS Version**.
   - **Total & Free RAM** in human-readable megabytes.
   - **CPU Usage Statistics** (extract active load percentage).
   - **Active USB Serial Devices** (scan for plugged-in FTDI, STLINK, or serial adapters).
   - **Top 5 Memory-Consuming Processes** active on the host.
4. Output the results cleanly to a temporary log file `/home/$USER/workspace/sys_status.log` and display the dashboard on the terminal.

### Structural Requirements & Code Skeleton
**`sys_dashboard.sh` (Shell Skeleton)**:
```bash
#!/usr/bin/env bash
# Professional System Dashboard Utility

set -euo pipefail # Fail immediately on error or unset variables

LOG_FILE="/home/$USER/sys_status.log"

echo "===========================================" | tee "$LOG_FILE"
echo "        SYSTEM DIAGNOSTICS DASHBOARD       " | tee -a "$LOG_FILE"
echo "===========================================" | tee -a "$LOG_FILE"

# 1. OS & Host Info
echo "Host: $(hostname)" | tee -a "$LOG_FILE"
echo "OS: $(grep 'PRETTY_NAME' /etc/os-release | cut -d'=' -f2 | tr -d '\"')" | tee -a "$LOG_FILE"

# 2. RAM calculations
echo "---------------- Memory Info --------------" | tee -a "$LOG_FILE"
free -h | awk '/Mem:/ {print "Total RAM: " $2 "\nFree RAM:  " $4}' | tee -a "$LOG_FILE"

# 3. CPU Load
echo "----------------- CPU Load ----------------" | tee -a "$LOG_FILE"
cpu_load=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
echo "Active CPU Load: ${cpu_load}%" | tee -a "$LOG_FILE"

# 4. USB Serial Adapter Scan
echo "------------- USB Serial Devices ----------" | tee -a "$LOG_FILE"
usb_adapters=$(lsusb | grep -iE 'ftdi|stlink|prolific|ch340|cp210' || echo "No devices found")
echo "$usb_adapters" | tee -a "$LOG_FILE"

# 5. Top Processes
echo "---------- Top 5 Memory Processes ---------" | tee -a "$LOG_FILE"
ps aux --sort=-%mem | awk 'NR<=6 {print $1, $2, $4, $11}' | tee -a "$LOG_FILE"

echo "===========================================" | tee -a "$LOG_FILE"
echo "Dashboard written to $LOG_FILE"
```

---

## 📦 Deliverables
* [ ] Executable shell script `sys_dashboard.sh`.
* [ ] Generated log output file `sys_status.log` detailing system parameters.
* [ ] Complete documentation outlining your custom environment variable mappings configured inside your host profile shell.

---

## ❓ Self-Check Questions
1. What is the fundamental difference between the `/bin` and `/sbin` directories inside Linux? Why are specific commands restricted to `/sbin`?
2. What are virtual filesystems? Explain how `/proc` and `/sys` allow users to communicate directly with the Linux kernel using standard text utilities.
3. If a file has permissions `rwxr-xr-x` (octal 755), what does that mean? How do you modify it so that only the owner can read/write it, and all others are blocked?
4. What is the difference between sending a `SIGTERM` (15) and a `SIGKILL` (9) signal to an active process? Why is `SIGKILL` dangerous to use as a first resort?
5. How does command-line piping (`|`) work inside the kernel? What is the role of standard input (stdin), standard output (stdout), and standard error (stderr)?

---

## 🚀 Stretch Task (Optional)
Extend your system dashboard script to scan network configurations: detect active network adapters, print the local IP address, check internet connectivity via ping packets, and record statistics of active network sockets using `netstat` or `ss`.

## 💡 Motivation Checkpoint
A high-performance embedded systems developer does not operate inside graphic panels or file windows. When debugging a headless Raspberry Pi gateway, configuring automated toolchain pipelines, or compiling custom kernels on remote cloud servers, the terminal command line is your primary weapon. Master the terminal to master the OS.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Script compiles and executes cleanly with `set -euo pipefail` enabled.
  - Commands use clean Unix pipelines.
  - Output files are formatted and contain correct system values.
* **Fail Criteria**:
  - Direct execution errors or unhandled empty commands.
  - Hardcoded user directories (must use `$USER` or `$HOME` variables).
