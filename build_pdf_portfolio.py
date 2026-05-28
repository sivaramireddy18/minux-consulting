import os
import re
import sys

# Path configurations
WORKSPACE = "/home/siva/sivaramireddy/Project1"
MD_IN = "/home/siva/.gemini/antigravity-cli/brain/e9894df3-8589-4519-a585-3139faf09174/systems_projects_portfolio.md"
HTML_OUT = os.path.join(WORKSPACE, "systems_projects_portfolio.html")
PDF_OUT = os.path.join(WORKSPACE, "systems_projects_portfolio.pdf")

# Custom print CSS stylesheet for professional paged media layout
# Elegant systems-indigo (#4F46E5) and deep slate (#0F172A) design palette
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
        content: "Systems Engineering Capstone Projects Portfolio | Senior Systems Architect";
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
    border-bottom: 2px solid #4f46e5;
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
    color: #4f46e5;
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
    color: #4f46e5;
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
    color: #4f46e5;
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

    print("Compiling Systems Projects Portfolio in sequence...")
    
    html_content = []
    
    # 1. Add Cover Page
    html_content.append("""
    <div class="cover-page">
        <div class="cover-title">SYSTEMS ENGINEERING<br>CAPSTONE PROJECTS PORTFOLIO</div>
        <div class="cover-subtitle">MNC-Style Architectural Frameworks & Granular Task Breakdowns</div>
        <div class="cover-meta">
            <strong>Scope:</strong> Advanced C Systems, FreeRTOS Embedded & Python HIL Frameworks<br>
            <strong>Author:</strong> Senior Systems Architect & Technical Director<br>
            <strong>Workspace Root:</strong> /home/siva/sivaramireddy/Project1/
        </div>
    </div>
    """)
    
    # 2. Append Capstone markdown
    if os.path.exists(MD_IN):
        print(f"Reading portfolio: {MD_IN}")
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
    <title>Systems Engineering Capstone Projects Portfolio</title>
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
        print(f"SUCCESS: Systems Projects Portfolio PDF generated at: {PDF_OUT}")
    except Exception as e:
        print(f"Error during Weasyprint compilation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
