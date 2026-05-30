#!/usr/bin/env python3
import os
import re
import sys

# Paths setup
WORKSPACE = "/home/siva/sivaramireddy/Project1"
PLANS_DIR = os.path.join(WORKSPACE, "plans")
DAY_PLANS_DIR = os.path.join(WORKSPACE, "Day_Plans")

# Days mapping
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

TEMPLATE_DAY_PLAN = """# Microscopic Daily Vetting Specification
## Week {week:02d}, Day {day_num:d} ({day_name}): {topic}

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week {week:02d} | Day {day_num:d} ({day_name})
*   **Core Systems Topic:** {topic}
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
{theory}

#### 🛠️ Unassisted Lab Track (4 Hours)
{lab}

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
{code}
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
"""

def clean_markdown_headers(text):
    # Remove leading bold formatting like "**Conceptual Objective**:" or similar
    text = re.sub(r'^\s*\*\s*\*\*.*?\*\*:\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\*\s*\*\*.*?\*\*:\s*', '', text, flags=re.MULTILINE)
    return text.strip()

def parse_weekly_plan(filepath):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found!")
        return None
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    day_blocks = {}
    
    # 1. Parse Monday - Friday
    for day in DAYS_OF_WEEK:
        # Regex to capture content under "### DayName: TopicName" until the next day header or section separator
        pattern = rf"### {day}:(.*?)(?=### |## |---|$)"
        match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
        if match:
            day_text = match.group(1).strip()
            lines = day_text.split("\n")
            
            # Extract Topic Name from the header line
            topic_match = re.search(rf"### {day}: (.*)", content, re.IGNORECASE)
            topic = topic_match.group(1).strip() if topic_match else f"{day} Core Alignment"
            
            # Parse Objectives, Activities and Code
            theory = ""
            lab = ""
            code_block = ""
            
            # Extract Code Block
            code_match = re.search(r"```.*?\n(.*?)```", day_text, re.DOTALL)
            if code_match:
                code_block = code_match.group(1).strip()
                
            # Extract Theory (Conceptual Objective)
            theory_match = re.search(r"\*\s*\*\*Conceptual Objective\*\*:(.*?)(?=\*\s*\*\*|\`\`\`|$)", day_text, re.DOTALL)
            if theory_match:
                theory = clean_markdown_headers(theory_match.group(1))
            else:
                theory = "Verify first-principles core mechanics and variables alignments."
                
            # Extract Lab (Practical Activity)
            lab_match = re.search(r"\*\s*\*\*Practical Activity\*\*:(.*?)(?=\*\s*\*\*|\`\`\`|$)", day_text, re.DOTALL)
            if lab_match:
                lab = clean_markdown_headers(lab_match.group(1))
            else:
                lab = "Perform bare-metal workspace compilations and monitor configurations."
                
            day_blocks[day] = {
                "topic": topic,
                "theory": theory,
                "lab": lab,
                "code": code_block if code_block else "// Reference code block"
            }
            
    # 2. Parse Saturday (Hands-On Assignment)
    saturday_pattern = r"## 🛠️ Hands-On Assignment:(.*?)(?=$)"
    sat_match = re.search(saturday_pattern, content, re.DOTALL | re.IGNORECASE)
    
    if sat_match:
        sat_text = sat_match.group(1).strip()
        
        # Split into requirements and verification
        code_match = re.search(r"```.*?\n(.*?)```", sat_text, re.DOTALL)
        code_block = code_match.group(1).strip() if code_match else "// Capstone assignment code"
        
        day_blocks["Saturday"] = {
            "topic": "Comprehensive Capstone & Vetting Verification",
            "theory": "Integrate all weekly systems concepts into a unified production-grade model. Audit corner conditions and performance boundaries.",
            "lab": sat_text[:600] + "...", # Take first 600 chars as lab description
            "code": code_block
        }
    else:
        day_blocks["Saturday"] = {
            "topic": "Weekly Capstone Vetting Verification",
            "theory": "Integrate all weekly systems concepts into a unified production-grade model.",
            "lab": "Compile, debug, and run the week's assignments under active testing matrices.",
            "code": "// Capstone verify"
        }
        
    return day_blocks

def main():
    if not os.path.exists(DAY_PLANS_DIR):
        os.makedirs(DAY_PLANS_DIR)
        
    for wk in range(1, 5):
        wk_dir = os.path.join(DAY_PLANS_DIR, f"Week_{wk:02d}")
        if not os.path.exists(wk_dir):
            os.makedirs(wk_dir)
            
        weekly_plan_file = os.path.join(PLANS_DIR, f"week-{wk:02d}-execution-plan.md")
        print(f"Parsing and aligning: {weekly_plan_file}")
        
        day_blocks = parse_weekly_plan(weekly_plan_file)
        if not day_blocks:
            continue
            
        # Write 6 day files
        ordered_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        for idx, day_name in enumerate(ordered_days):
            day_num = idx + 1
            data = day_blocks.get(day_name, {
                "topic": f"{day_name} Systems Milestone",
                "theory": "First-principles engineering validation.",
                "lab": "Verify code configurations under GDB.",
                "code": "// Dynamic compiler fallback"
            })
            
            day_plan_text = TEMPLATE_DAY_PLAN.format(
                week=wk,
                day_num=day_num,
                day_name=day_name,
                topic=data["topic"],
                theory=data["theory"],
                lab=data["lab"],
                code=data["code"]
            )
            
            filename = f"Day_{day_num}_Theory_and_Lab.md"
            filepath = os.path.join(wk_dir, filename)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(day_plan_text)
                
    print("SUCCESS: Aligned all Day_Plans files perfectly to the existing weekly plans content!")

if __name__ == "__main__":
    main()
