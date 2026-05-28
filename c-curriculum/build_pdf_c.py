import os
import re
import sys

# Define the sequence of files to merge
CORE_FILES = [
    "README.md",
    "c-trainer-operating-rules.md",
    "12-week-c-roadmap.md",
    "c-milestone-scorecard.md"
]

# Path configurations
CURRICULUM_DIR = "/home/siva/sivaramireddy/Project1/c-curriculum"
PLANS_DIR = os.path.join(CURRICULUM_DIR, "plans")
HTML_OUT = os.path.join(CURRICULUM_DIR, "professional-c-programming-curriculum.html")
PDF_OUT = os.path.join(CURRICULUM_DIR, "professional-c-programming-curriculum.pdf")

# Custom print CSS stylesheet for professional paged media layout
# Sleek rust-copper (#C2410C) and deep slate systems design palette
CSS_STYLE = """
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Fira+Code:wght@400;500&display=swap');

@page {
    size: A4;
    margin: 20mm;
    @bottom-right {
        content: counter(page);
        font-family: 'Outfit', sans-serif;
        font-size: 8pt;
        color: #64748b;
        font-weight: 500;
    }
    @bottom-left {
        content: "Professional C Systems Programming Master Plan | Senior Systems Coach";
        font-family: 'Outfit', sans-serif;
        font-size: 8pt;
        color: #64748b;
        font-weight: 500;
    }
}

body {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 10.5pt;
}

h1, h2, h3, h4 {
    color: #0f172a;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    page-break-after: avoid;
    break-after: avoid;
}

h1 {
    font-size: 24pt;
    border-bottom: 2px solid #c2410c;
    padding-bottom: 8px;
    margin-top: 0;
    margin-bottom: 20px;
    page-break-before: always;
    break-before: page;
}

/* Prevent cover page break on very first heading */
.first-page h1 {
    page-break-before: avoid !important;
    break-before: avoid !important;
}

h2 {
    font-size: 16pt;
    color: #c2410c;
    margin-top: 30px;
    margin-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
}

h3 {
    font-size: 12pt;
    color: #1e293b;
    margin-top: 20px;
    margin-bottom: 8px;
}

p {
    margin-top: 0;
    margin-bottom: 12px;
    text-align: justify;
}

ul, ol {
    margin-top: 0;
    margin-bottom: 16px;
    padding-left: 20px;
}

li {
    margin-bottom: 6px;
}

code {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 9pt;
    background-color: #f8fafc;
    color: #c2410c;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}

pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 12px 16px;
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
    margin-top: 10px;
    margin-bottom: 18px;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px solid #1e293b;
}

pre code {
    background-color: transparent;
    color: #e2e8f0;
    padding: 0;
    font-size: 8.5pt;
    border: none;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    margin-bottom: 20px;
    page-break-inside: avoid;
    break-inside: avoid;
    font-size: 9.5pt;
}

th, td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
}

th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 600;
}

tr:nth-child(even) {
    background-color: #f8fafc;
}

.cover-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    page-break-after: always;
    break-after: page;
    text-align: center;
    padding-top: 50mm;
}

.cover-title {
    font-size: 32pt;
    color: #0f172a;
    font-weight: 700;
    margin-bottom: 10px;
    line-height: 1.2;
}

.cover-subtitle {
    font-size: 16pt;
    color: #c2410c;
    font-weight: 400;
    margin-bottom: 40px;
}

.cover-meta {
    font-size: 11pt;
    color: #64748b;
    margin-top: auto;
    border-top: 1px solid #cbd5e1;
    padding-top: 20px;
}
"""

def main():
    # Install markdown parser library dynamically if missing
    try:
        import markdown
    except ImportError:
        print("Installing python-markdown library inside user context...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown", "--user", "--break-system-packages"])
        except Exception:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown", "--user"])
        import site
        sys.path.append(site.getusersitepackages())
        import markdown

    print("Merging C curriculum files in sequence...")
    
    html_content = []
    
    # 1. Add Cover Page
    html_content.append("""
    <div class="cover-page">
        <div class="cover-title">PROFESSIONAL C SYSTEMS<br>PROGRAMMING MASTER PLAN</div>
        <div class="cover-subtitle">A Rigorous, First-Principles Code-Security & Concurrency Curriculum</div>
        <div class="cover-meta">
            <strong>Duration:</strong> 12 Weeks | <strong>Level:</strong> Advanced Systems C<br>
            <strong>Mentor:</strong> Senior Systems Coach & Technical Architect<br>
            <strong>Workspace Root:</strong> /home/siva/sivaramireddy/Project1/c-curriculum/
        </div>
    </div>
    """)
    
    # 2. Append Core Trackers
    for core_file in CORE_FILES:
        file_path = os.path.join(CURRICULUM_DIR, core_file)
        if os.path.exists(file_path):
            print(f"Adding core file: {core_file}")
            with open(file_path, "r", encoding="utf-8") as f:
                md_text = f.read()
                # Convert MD to HTML
                html_text = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
                html_content.append(f'<div class="section">{html_text}</div>')
        else:
            print(f"Warning: Core file {core_file} not found!")

    # 3. Append 12 Weekly Plans
    print("Appending 12 weekly plans...")
    for w in range(1, 13):
        week_file = f"week-{w:02d}-c-plan.md"
        file_path = os.path.join(PLANS_DIR, week_file)
        if os.path.exists(file_path):
            print(f"Adding weekly plan: {week_file}")
            with open(file_path, "r", encoding="utf-8") as f:
                md_text = f.read()
                html_text = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
                html_content.append(f'<div class="section week-plan">{html_text}</div>')
        else:
            print(f"Warning: Weekly plan file {week_file} not found!")

    # 4. Wrap inside a clean HTML shell
    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Professional C Systems Programming Curriculum</title>
    <style>
    {CSS_STYLE}
    </style>
</head>
<body>
    {''.join(html_content)}
</body>
</html>
"""

    with open(HTML_OUT, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"Successfully generated HTML skeleton: {HTML_OUT}")

    # 5. Run weasyprint to generate the PDF
    print("Compiling PDF via weasyprint...")
    import subprocess
    try:
        subprocess.check_call(["weasyprint", HTML_OUT, PDF_OUT])
        print(f"SUCCESS: Professional C PDF generated at: {PDF_OUT}")
    except Exception as e:
        print(f"Error during Weasyprint compilation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
