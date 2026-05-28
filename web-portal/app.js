// Premium JavaScript Engine - Minux Consulting Systems Portal

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. Mobile Navigation Menu Toggle
    // ==========================================
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            navLinks.classList.toggle("open");
            
            // Animate toggle bars into a premium 'X' close indicator
            const bars = navToggle.querySelectorAll("span");
            if (navLinks.classList.contains("open")) {
                bars[0].style.transform = "rotate(45deg) translate(6px, 6px)";
                bars[1].style.opacity = "0";
                bars[2].style.transform = "rotate(-45deg) translate(6px, -6px)";
            } else {
                bars[0].style.transform = "none";
                bars[1].style.opacity = "1";
                bars[2].style.transform = "none";
            }
        });
    }

    // ==========================================
    // 2. Active Link Navigation Highlighter
    // ==========================================
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf("/") + 1);
    
    const links = document.querySelectorAll(".nav-links a");
    links.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (linkPath === pageName || (pageName === "" && linkPath === "index.html")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // ==========================================
    // 3. Futuristic dynamic counter statistics
    // ==========================================
    const stats = document.querySelectorAll(".stat-item h4");
    
    stats.forEach(stat => {
        const valText = stat.innerText;
        const numericMatch = valText.match(/\d+/);
        if (numericMatch) {
            const targetVal = parseInt(numericMatch[0]);
            let currentVal = 0;
            const step = Math.ceil(targetVal / 60);
            
            const suffix = valText.replace(numericMatch[0], "");
            
            const updateCounter = () => {
                if (currentVal < targetVal) {
                    currentVal = Math.min(currentVal + step, targetVal);
                    stat.innerText = currentVal + suffix;
                    setTimeout(updateCounter, 18);
                } else {
                    stat.innerText = targetVal + suffix;
                }
            };
            
            stat.innerText = "0" + suffix;
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(stat);
        }
    });

    // ==========================================
    // 4. Interactive Recruiter Terminal Simulator
    // ==========================================
    const terminalInput = document.getElementById("terminal-cli-input");
    const terminalBody = document.getElementById("terminal-body-content");
    
    if (terminalInput && terminalBody) {
        
        const appendLine = (content, color = "#F8FAFC") => {
            const line = document.createElement("div");
            line.className = "terminal-line";
            line.style.color = color;
            line.innerHTML = content;
            // Insert line before the input row
            const inputRow = terminalBody.querySelector(".terminal-input-row");
            terminalBody.insertBefore(line, inputRow);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        };

        terminalInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const commandText = terminalInput.value.trim();
                const cmdLower = commandText.toLowerCase();
                terminalInput.value = "";

                if (commandText === "") return;

                // Echo Command
                appendLine(`<span class="terminal-prompt">partner@minux-consulting:~$</span> <span style="color: #F8FAFC;">${commandText}</span>`);

                // Recruiter commands routers
                switch (cmdLower) {
                    case "help":
                        appendLine("Available MNC Recruiting Portal diagnostic commands:", "#64748b");
                        appendLine("  <span style='color: #14B8A6;'>help</span>       - Display this command manual.");
                        appendLine("  <span style='color: #14B8A6;'>vettalent</span>  - Query the live vetted candidate pipeline availability.");
                        appendLine("  <span style='color: #14B8A6;'>clients</span>    - List safety-critical industries we actively supply.");
                        appendLine("  <span style='color: #14B8A6;'>sysinfo</span>    - Read Minux Consulting's strict vetting standards.");
                        appendLine("  <span style='color: #14B8A6;'>clear</span>      - Clean terminal line states.");
                        break;
                        
                    case "vettalent":
                        appendLine("[PIPELINE] Vetted Candidates Currently Available for MNC Deployment:", "#10B981");
                        appendLine("  - Track 1 (Embedded & Linux Kernel): 8 Active Consultants (36-Week Rigorous Drill Passed)");
                        appendLine("  - Track 2 (C Systems & Memory Arena): 5 Active Consultants (12-Week Multi-threading & MISRA Passed)");
                        appendLine("  - Track 3 (Python HIL & SCPI Benches): 6 Active Consultants (12-Week Test Engineering & CI/CD Passed)");
                        break;

                    case "clients":
                        appendLine("[ALIGNED MNC CLIENT SECTORS]:", "#F97316");
                        appendLine("  - Automotive Tier-1 ADAS & Body Control (STM32, Vector Boot)");
                        appendLine("  - Aerospace Safety-Critical Controller R&D (Bare-metal Cortex-M)");
                        appendLine("  - Semiconductor Linux BSP & Loadable Drivers Teams (LKM, Yocto, DTS)");
                        appendLine("  - High-Frequency Trading & Concurrent Database Engines (pthreads, Arenas)");
                        break;
                        
                    case "sysinfo":
                        appendLine("[VETTING CONFIGURATION] Standard verification parameters for Minux Consultants:");
                        appendLine("  - Code Conformance: Strict ISO/IEC 9899:2011 C11 Dialect");
                        appendLine("  - Quality Enforcement: -Wall -Wextra -Werror -pedantic compiles ONLY");
                        appendLine("  - Memory Bounds: 100% leak-free, checked dynamically under Valgrind Memcheck");
                        appendLine("  - Code Analysis: Complete static scans (Mypy --strict, Cppcheck --enable=all)");
                        appendLine("  - Hands-on Evaluation: Weekly Whiteboard Vivas & bare-metal register wiring");
                        break;
                        
                    case "clear":
                        const lines = terminalBody.querySelectorAll(".terminal-line");
                        lines.forEach(line => line.remove());
                        break;
                        
                    default:
                        appendLine(`minux-terminal: command not found: ${commandText}. Type 'help' for diagnostics.`, "#EF4444");
                }
            }
        });

        // Trigger auto-focus on terminal click
        terminalBody.addEventListener("click", () => {
            terminalInput.focus();
        });
    }

    // ==========================================
    // 5. Dynamic Syllabus/Competencies Filter
    // ==========================================
    const searchInput = document.querySelector(".filter-search-box");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const timelineItems = document.querySelectorAll(".timeline-item");
            
            timelineItems.forEach(item => {
                const titleText = item.querySelector("h3").innerText.toLowerCase();
                const bodyText = item.querySelector("p").innerText.toLowerCase();
                
                const sessionBox = item.querySelector(".session-box");
                const sessionText = sessionBox ? sessionBox.innerText.toLowerCase() : "";
                
                if (titleText.includes(query) || bodyText.includes(query) || sessionText.includes(query)) {
                    item.style.display = "block";
                    item.style.opacity = "1";
                    item.style.transform = "translateY(0)";
                } else {
                    item.style.opacity = "0";
                    item.style.transform = "translateY(10px)";
                    setTimeout(() => {
                        if (item.style.opacity === "0") {
                            item.style.display = "none";
                        }
                    }, 200);
                }
            });
        });
    }

    // ==========================================
    // 6. Interactive Coaching Score Calculator
    // ==========================================
    const calcBtn = document.getElementById("coaching-calc-btn");
    if (calcBtn) {
        calcBtn.addEventListener("click", () => {
            const compileScore = parseFloat(document.getElementById("score-compile").value) || 0;
            const memoryScore = parseFloat(document.getElementById("score-memory").value) || 0;
            const whiteboardScore = parseFloat(document.getElementById("score-whiteboard").value) || 0;
            
            const totalScore = ((compileScore + memoryScore + whiteboardScore) / 3).toFixed(1);
            const resultBox = document.getElementById("calc-result-display");
            
            if (resultBox) {
                resultBox.style.display = "block";
                
                if (compileScore < 7 || memoryScore < 7 || whiteboardScore < 7) {
                    resultBox.innerHTML = `<span style="color: #EF4444;">ALERT: CRITICAL WARNING (Score: ${totalScore})</span><br><span style="font-size: 0.85rem; font-weight: normal; color: #94A3B8;">Automatic Remediation Sprint Triggered! Score in individual components falls below standard limit. Gate Locked.</span>`;
                    resultBox.style.borderColor = "#EF4444";
                } else if (totalScore >= 9.0) {
                    resultBox.innerHTML = `<span style="color: #10B981;">STATUS: EXCELLENCE DISTINCTION (Score: ${totalScore})</span><br><span style="font-size: 0.85rem; font-weight: normal; color: #94A3B8;">Outstanding architecture. Candidate cleared to advance and explore industrial Stretch Tasks. Gate Open.</span>`;
                    resultBox.style.borderColor = "#10B981";
                } else {
                    resultBox.innerHTML = `<span style="color: #3B82F6;">STATUS: CLEAR TO PASS (Score: ${totalScore})</span><br><span style="font-size: 0.85rem; font-weight: normal; color: #94A3B8;">All technical quality checks met cleanly. Candidate cleared to advance to next week. Gate Open.</span>`;
                    resultBox.style.borderColor = "#3B82F6";
                }
            }
        });
    }

    // ==========================================
    // 7. MNC Partner Engagement Calculator
    // ==========================================
    const partnerBtn = document.getElementById("partner-engagement-btn");
    if (partnerBtn) {
        partnerBtn.addEventListener("click", () => {
            const track = document.getElementById("partner-track").value;
            const count = parseInt(document.getElementById("partner-count").value) || 1;
            const standard = document.getElementById("partner-standard").value;
            
            let trackName = "";
            let baseAvailable = 0;
            let verifiedSkills = [];
            
            if (track === "emb") {
                trackName = "Embedded & Linux Kernel Specialists";
                baseAvailable = 8;
                verifiedSkills = ["STM32 Register drivers", "NVIC priorities", "Linker startup tables", "LKM / Character Device operations", "Yocto Poky layers"];
            } else if (track === "c") {
                trackName = "C Core Systems Specialists";
                baseAvailable = 5;
                verifiedSkills = ["Stack Frames Alignment", "Custom heap dynamic Arena allocators", "pthreads deadlocks protection", "MISRA C safety rules"];
            } else {
                trackName = "HIL Test Automation Architects";
                baseAvailable = 6;
                verifiedSkills = ["Stateless Pytest systems", "SCPI instrument wrappers", "Pyelftools binary audits", "Emergency HIL power de-energize guards"];
            }
            
            const matchPercent = standard === "ultra" ? 98 : 94;
            const finalAvailable = Math.max(1, Math.min(count, baseAvailable - Math.floor(Math.random() * 3)));
            const leadTime = finalAvailable >= count ? "48 Hours" : "7 to 10 Days";
            const resultBox = document.getElementById("partner-result-display");
            
            if (resultBox) {
                resultBox.style.display = "block";
                resultBox.style.borderColor = "var(--color-embedded)";
                
                resultBox.innerHTML = `
                    <div style="font-weight: 800; color: var(--color-embedded); margin-bottom: 0.5rem;">
                        ⚡ PIPELINE MATCH: SUCCESSFUL (${matchPercent}% Vetting Score)
                    </div>
                    <div style="font-size: 0.95rem; color: white; margin-bottom: 0.75rem; line-height: 1.5;">
                        Found <strong>${finalAvailable} Active Consultants</strong> aligning with your count demand. <br>
                        Ready for deployment within <strong>${leadTime}</strong>.
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); text-align: left; background-color: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem;">
                        <strong>Verified competencies:</strong>
                        <ul style="margin-left: 1rem; margin-top: 0.25rem;">
                            ${verifiedSkills.map(s => `<li>${s}</li>`).join("")}
                        </ul>
                    </div>
                `;
            }
        });
    }
});
