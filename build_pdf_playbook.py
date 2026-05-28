import os
import re
import sys

# Path configurations
WORKSPACE = "/home/siva/sivaramireddy/Project1"
MD_IN = "/home/siva/.gemini/antigravity-cli/brain/e9894df3-8589-4519-a585-3139faf09174/coaching_master_playbook.md"
HTML_OUT = os.path.join(WORKSPACE, "coaching_master_playbook.html")
PDF_OUT = os.path.join(WORKSPACE, "coaching_master_playbook.pdf")

# Custom print CSS stylesheet for professional paged media layout
# Authoritative executive slate-crimson (#E11D48) and deep slate (#0F172A) design palette
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
        content: "Lead Systems Coach Operating Manual | Vice President of Systems Engineering";
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
    border-bottom: 2px solid #e11d48;
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
    color: #e11d48;
    margin-top: 30px;
    margin-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
}

h3 {
    font-size: 12pt;
    color: #0f172a;
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
    color: #e11d48;
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
    color: #e11d48;
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

    print("Compiling Coaching Master Playbook in sequence...")
    
    html_content = []
    
    # 1. Add Cover Page
    html_content.append("""
    <div class="cover-page">
        <div class="cover-title">COACHING MASTER PLAYBOOK<br>FOR SYSTEMS ENGINEERING</div>
        <div class="cover-subtitle">Absolute Operational Cadence, Pedagogical Rigor & MNC Mentorship Laws</div>
        <div class="cover-meta">
            <strong>Target:</strong> Lead Systems Coach & Program Director Reference Manual<br>
            <strong>Author:</strong> Vice President of Systems Engineering & Curriculum Architect<br>
            <strong>Workspace Root:</strong> /home/siva/sivaramireddy/Project1/
        </div>
    </div>
    """)
    
    # 2. Append Capstone markdown
    if os.path.exists(MD_IN):
        print(f"Reading playbook: {MD_IN}")
        with open(MD_IN, "r", encoding="utf-8") as f:
            md_text = f.read()
            # Convert MD to HTML
            html_text = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
            html_content.append(f'<div class="section">{html_text}</div>')
    else:
        print(f"Error: Source file {MD_IN} not found!")
        sys.exit(1)

    # 3. Wrap inside a clean HTML shell
    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Coaching Master Playbook for Systems Engineering</title>
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

    # 4. Run weasyprint to generate the PDF
    print("Compiling PDF via weasyprint...")
    import subprocess
    try:
        subprocess.check_call(["weasyprint", HTML_OUT, PDF_OUT])
        print(f"SUCCESS: Coaching Master Playbook PDF generated at: {PDF_OUT}")
    except Exception as e:
        print(f"Error during Weasyprint compilation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
