// app.js - NVIC & Exception Stack Frame Simulator Controller
(function() {
    'use strict';

    // Simulation Data Model
    const simState = {
        phase: "idle", // "idle", "asserted", "stacking", "isr", "returning"
        iser: [true, false, true, false, false, false, false, false],  // IRQ0-7 enable flags
        ispr: [false, false, false, false, false, false, false, false], // IRQ0-7 pending flags
        ipr: [0x00, 0x40, 0x20, 0x80, 0x90, 0xA0, 0xB0, 0xC0],         // Priority values (lower = higher priority)
        
        cpu: {
            pc: 0x08000450,
            sp: 0x20008000,
            lr: 0x08000620,
            xpsr: 0x01000000
        },
        
        activeIRQ: -1,
        
        // Memory stack slots from 0x20007FC0 to 0x20008000
        memory: {}
    };

    // Initialize stack memory layout
    function initMemory() {
        simState.memory = {};
        for (let addr = 0x20007FC0; addr <= 0x20008000; addr += 4) {
            simState.memory[addr] = {
                val: "0x00000000",
                label: ""
            };
        }
    }

    // Dynamic Helper Text based on State Phase
    const HELPER_MESSAGES = {
        idle: "<strong>Current Status: Thread Mode Running.</strong> The CPU is executing standard non-exception user threads at low privilege. The MSP Stack Pointer sits at its base 0x20008000. <em>To start, toggle an ISER enable bit and click an ISPR bit to assert a hardware pending line.</em>",
        asserted: "<strong>Current Status: Interrupt Asserted.</strong> The NVIC priority resolver evaluated active enables and pending lines. The winning vector is <strong>IRQ {irq}</strong> with priority offset <strong>0x{priority}</strong>. The hardware is preparing the stacking sequence.",
        stacking: "<strong>Current Status: Context Stacking.</strong> The Cortex-M hardware automatically pushes the standard 8-register context stack frame (xPSR, PC, LR, R12, R3-R0) to the MSP memory before branching. SP decrements by 32 bytes (8 words) from 0x20008000 to 0x20007FE0.",
        isr: "<strong>Current Status: Exception Vector Branch.</strong> The CPU enters Handler Mode. PC points to Vector Address <strong>0x{vector_addr}</strong>. The LR is written with the special EXC_RETURN value <strong>0xFFFFFFF9</strong>, which forces unstacking using MSP on return. IPSR reflects active exception index <strong>{exception_idx}</strong>.",
        returning: "<strong>Current Status: Unstacking & Return.</strong> The instruction 'BX LR' fires. Since LR contains 0xFFFFFFF9, the hardware intercept triggers: register values are restored (popped) from the stack frame back into the CPU file, and SP returns to 0x20008000."
    };

    // UI Nodes
    const ui = {
        iserGrid: document.getElementById("iser-grid"),
        isprGrid: document.getElementById("ispr-grid"),
        iprList: document.getElementById("ipr-list"),
        
        regPc: document.getElementById("reg-pc"),
        regSp: document.getElementById("reg-sp"),
        regLr: document.getElementById("reg-lr"),
        regXpsr: document.getElementById("reg-xpsr"),
        
        stackViewer: document.getElementById("stack-viewer"),
        stateBadge: document.getElementById("sim-state-badge"),
        helperText: document.getElementById("sim-helper-text"),
        
        btnIdle: document.getElementById("btn-step-idle"),
        btnTrigger: document.getElementById("btn-step-trigger"),
        btnStack: document.getElementById("btn-step-stack"),
        btnIsr: document.getElementById("btn-step-isr"),
        btnReturn: document.getElementById("btn-step-return")
    };

    // Format address/data word helper
    function toHexStr(val, pad = 8) {
        return "0x" + Number(val).toString(16).toUpperCase().padStart(pad, "0");
    }

    // Render NVIC registers grid panels
    function renderNvicGrids() {
        ui.iserGrid.innerHTML = "";
        ui.isprGrid.innerHTML = "";
        
        for (let i = 0; i < 8; i++) {
            // ISER bit cells
            const iserCell = document.createElement("div");
            iserCell.className = `bit-cell ${simState.iser[i] ? 'active' : ''}`;
            iserCell.textContent = `IRQ${i}`;
            iserCell.title = `Bit ${i}: ${simState.iser[i] ? 'Enabled' : 'Disabled'}`;
            if (simState.phase === "idle") {
                iserCell.addEventListener("click", () => {
                    simState.iser[i] = !simState.iser[i];
                    renderNvicGrids();
                    evaluateAssertionTrigger();
                });
            } else {
                iserCell.style.cursor = "not-allowed";
            }
            ui.iserGrid.appendChild(iserCell);

            // ISPR bit cells
            const isprCell = document.createElement("div");
            isprCell.className = `bit-cell ${simState.ispr[i] ? 'pending' : ''}`;
            isprCell.textContent = `IRQ${i}`;
            isprCell.title = `Bit ${i}: ${simState.ispr[i] ? 'Pending Assert' : 'Inactive'}`;
            if (simState.phase === "idle") {
                isprCell.addEventListener("click", () => {
                    simState.ispr[i] = !simState.ispr[i];
                    renderNvicGrids();
                    evaluateAssertionTrigger();
                });
            } else {
                isprCell.style.cursor = "not-allowed";
            }
            ui.isprGrid.appendChild(isprCell);
        }

        // Render Priority values
        ui.iprList.innerHTML = "";
        for (let i = 0; i < 8; i++) {
            const iprDiv = document.createElement("div");
            iprDiv.style.background = "rgba(255, 255, 255, 0.02)";
            iprDiv.style.border = "1px solid var(--border-light)";
            iprDiv.style.borderRadius = "4px";
            iprDiv.style.padding = "0.25rem 0.5rem";
            iprDiv.style.textAlign = "center";
            iprDiv.style.fontSize = "0.75rem";
            iprDiv.style.fontFamily = "var(--font-mono)";
            iprDiv.innerHTML = `<span style="color:var(--text-muted);">IRQ${i}:</span> 0x${simState.ipr[i].toString(16).toUpperCase()}`;
            ui.iprList.appendChild(iprDiv);
        }
    }

    // Render CPU internal Registers
    function renderCpuRegisters() {
        ui.regPc.textContent = toHexStr(simState.cpu.pc);
        ui.regSp.textContent = toHexStr(simState.cpu.sp);
        ui.regLr.textContent = toHexStr(simState.cpu.lr);
        ui.regXpsr.textContent = toHexStr(simState.cpu.xpsr);
    }

    // Render SRAM Memory block visualizer
    function renderStackMemory() {
        ui.stackViewer.innerHTML = "";
        const addrs = Object.keys(simState.memory).map(Number).sort((a,b) => b - a);
        
        addrs.forEach(addr => {
            const data = simState.memory[addr];
            const isSP = simState.cpu.sp === addr;
            const isFrame = addr >= 0x20007FE0 && addr < 0x20008000 && simState.phase !== "idle" && simState.phase !== "returning";

            const row = document.createElement("div");
            row.className = `stack-row ${isSP ? 'sp-pointer' : ''} ${isFrame ? 'stacked-frame' : ''}`;
            
            row.innerHTML = `
                <span class="stack-addr">${toHexStr(addr)}</span>
                <span class="stack-data">${data.val}</span>
                <span class="stack-label">${isSP ? '&larr; SP pointer' : (data.label || '')}</span>
            `;
            ui.stackViewer.appendChild(row);
        });
    }

    // Evaluate if we should permit stepping to phase 2
    function evaluateAssertionTrigger() {
        let hasActivePending = false;
        for (let i = 0; i < 8; i++) {
            if (simState.iser[i] && simState.ispr[i]) {
                hasActivePending = true;
                break;
            }
        }
        ui.btnTrigger.disabled = !hasActivePending || simState.phase !== "idle";
    }

    // Swapper states and button disable managers
    function updateConsoleControls() {
        document.querySelectorAll(".btn-sim").forEach(b => b.classList.remove("active"));
        
        ui.btnIdle.disabled = true;
        ui.btnTrigger.disabled = true;
        ui.btnStack.disabled = true;
        ui.btnIsr.disabled = true;
        ui.btnReturn.disabled = true;

        if (simState.phase === "idle") {
            ui.btnIdle.classList.add("active");
            ui.btnIdle.disabled = false;
            evaluateAssertionTrigger();
            ui.stateBadge.textContent = "State: Idle";
            ui.stateBadge.className = "state-badge idle";
            ui.helperText.innerHTML = HELPER_MESSAGES.idle;
        } else if (simState.phase === "asserted") {
            ui.btnTrigger.classList.add("active");
            ui.btnStack.disabled = false;
            ui.stateBadge.textContent = "State: Asserted";
            ui.stateBadge.className = "state-badge pending";
            
            const winningIPR = simState.ipr[simState.activeIRQ];
            ui.helperText.innerHTML = HELPER_MESSAGES.asserted
                .replace("{irq}", simState.activeIRQ)
                .replace("{priority}", winningIPR.toString(16).toUpperCase());
        } else if (simState.phase === "stacking") {
            ui.btnStack.classList.add("active");
            ui.btnIsr.disabled = false;
            ui.stateBadge.textContent = "State: Context Stacking";
            ui.stateBadge.className = "state-badge pending";
            ui.helperText.innerHTML = HELPER_MESSAGES.stacking;
        } else if (simState.phase === "isr") {
            ui.btnIsr.classList.add("active");
            ui.btnReturn.disabled = false;
            ui.stateBadge.textContent = "State: Active ISR";
            ui.stateBadge.className = "state-badge active";
            
            const vecAddr = 0x080009A0 + simState.activeIRQ * 8;
            ui.helperText.innerHTML = HELPER_MESSAGES.isr
                .replace("{vector_addr}", vecAddr.toString(16).toUpperCase())
                .replace("{exception_idx}", 16 + simState.activeIRQ);
        } else if (simState.phase === "returning") {
            ui.btnReturn.classList.add("active");
            ui.btnIdle.disabled = false;
            ui.stateBadge.textContent = "State: EXC_RETURN";
            ui.stateBadge.className = "state-badge idle";
            ui.helperText.innerHTML = HELPER_MESSAGES.returning;
        }
    }

    // -------------------------------------------------------------
    // Core State Transition steps
    // -------------------------------------------------------------
    
    // Step 1: Thread Run
    function stepIdle() {
        simState.phase = "idle";
        simState.activeIRQ = -1;
        
        simState.cpu.pc = 0x08000450;
        simState.cpu.sp = 0x20008000;
        simState.cpu.lr = 0x08000620;
        simState.cpu.xpsr = 0x01000000; // IPSR = 0 (Thread)

        initMemory();
        renderNvicGrids();
        renderCpuRegisters();
        renderStackMemory();
        updateConsoleControls();
    }

    // Step 2: Assert Interrupt
    function stepTrigger() {
        // Resolve highest priority pending interrupt
        // Cortex M4 resolved lower priority values first
        let winningIRQ = -1;
        let minPriority = 256;
        
        for (let i = 0; i < 8; i++) {
            if (simState.iser[i] && simState.ispr[i]) {
                if (simState.ipr[i] < minPriority) {
                    minPriority = simState.ipr[i];
                    winningIRQ = i;
                }
            }
        }
        
        if (winningIRQ !== -1) {
            simState.phase = "asserted";
            simState.activeIRQ = winningIRQ;
            updateConsoleControls();
        }
    }

    // Step 3: Push Stack Frame
    function stepStack() {
        simState.phase = "stacking";
        
        // Stack pushes: R0, R1, R2, R3, R12, LR, PC, xPSR
        simState.memory[0x20007FFC] = { val: toHexStr(simState.cpu.xpsr), label: "Stacked xPSR" };
        simState.memory[0x20007FF8] = { val: toHexStr(simState.cpu.pc + 8), label: "Stacked PC (Ret)" }; // Return address
        simState.memory[0x20007FF4] = { val: toHexStr(simState.cpu.lr), label: "Stacked LR" };
        simState.memory[0x20007FF0] = { val: "0x12121212", label: "Stacked R12" };
        simState.memory[0x20007FEC] = { val: "0x03030303", label: "Stacked R3" };
        simState.memory[0x20007FE8] = { val: "0x02020202", label: "Stacked R2" };
        simState.memory[0x20007FE4] = { val: "0x01010101", label: "Stacked R1" };
        simState.memory[0x20007FE0] = { val: "0x00000000", label: "Stacked R0" };
        
        // Stack Pointer shifts down by 32 bytes
        simState.cpu.sp = 0x20007FE0;
        
        renderCpuRegisters();
        renderStackMemory();
        updateConsoleControls();
    }

    // Step 4: Exec ISR
    function stepIsr() {
        simState.phase = "isr";
        
        // Branch to Vector address: 0x080009A0 + vector_index * 8
        const vecAddr = 0x080009A0 + simState.activeIRQ * 8;
        simState.cpu.pc = vecAddr;
        
        // LR is written with EXC_RETURN (0xFFFFFFF9: return to thread mode using MSP stack frame)
        simState.cpu.lr = 0xFFFFFFF9;
        
        // IPSR updates with active vector exception number (16 + IRQ)
        simState.cpu.xpsr = 0x01000000 | (16 + simState.activeIRQ);

        // De-assert pending status upon entering handler
        simState.ispr[simState.activeIRQ] = false;

        renderNvicGrids();
        renderCpuRegisters();
        updateConsoleControls();
    }

    // Step 5: Return BX LR
    function stepReturn() {
        simState.phase = "returning";
        
        // Pop memory values and clear stack frame annotations
        initMemory();
        
        // Increment Stack Pointer back
        simState.cpu.sp = 0x20008000;
        
        // PC returns to return address (stacked PC)
        simState.cpu.pc = 0x08000458;
        simState.cpu.lr = 0x08000620;
        simState.cpu.xpsr = 0x01000000; // Thread mode

        renderCpuRegisters();
        renderStackMemory();
        updateConsoleControls();

        // Register NVIC exception nesting milestone in local storage
        try {
            const milestonesRaw = localStorage.getItem("minux_simulator_milestones") || "{}";
            const milestones = JSON.parse(milestonesRaw);
            milestones["nvic_exception_nesting"] = true;
            localStorage.setItem("minux_simulator_milestones", JSON.stringify(milestones));
            
            ui.helperText.innerHTML = `<strong>Exception Return Complete!</strong> Thread Mode execution has successfully resumed. SP restored to 0x20008000. <br><span style="color:var(--color-embedded); font-weight:700;">⚡ Progress synced to Candidate Vetting Hub!</span>`;
        } catch (e) {
            console.error("Failed to write NVIC milestone:", e);
        }
    }

    // Interactive Demo Tour Logic
    let demoTimers = [];
    
    function clearDemoTimers() {
        demoTimers.forEach(clearTimeout);
        demoTimers = [];
    }

    function disableAllControls(disabledState) {
        ui.btnIdle.disabled = disabledState;
        ui.btnTrigger.disabled = disabledState;
        ui.btnStack.disabled = disabledState;
        ui.btnIsr.disabled = disabledState;
        ui.btnReturn.disabled = disabledState;
    }

    function runDemoTour() {
        const demoBtn = document.getElementById("btn-sim-demo");
        if (!demoBtn) return;
        
        clearDemoTimers();
        stepIdle();
        
        demoBtn.textContent = "⚡ Demo Running...";
        demoBtn.disabled = true;
        disableAllControls(true);

        // Step 1: Enable & Assert
        ui.helperText.innerHTML = "<span style='color:var(--color-coach); font-weight:700;'>[DEMO TOUR - STEP 1/5]</span> Enabling NVIC IRQ2 exception line (priority offset 0x20) and asserting its pending hardware request bit...";
        simState.iser[2] = true;
        simState.ispr[2] = true;
        renderNvicGrids();
        
        // Step 2: Trigger Exception after 3s
        demoTimers.push(setTimeout(() => {
            stepTrigger();
            ui.stateBadge.textContent = "State: Asserted";
            ui.stateBadge.className = "state-badge pending";
            ui.helperText.innerHTML = "<span style='color:var(--color-coach); font-weight:700;'>[DEMO TOUR - STEP 2/5]</span> NVIC Priority Resolver selects IRQ2 as the highest-priority pending exception. Triggering NVIC entry sequence...";
        }, 3000));

        // Step 3: Stacking Context after 6s
        demoTimers.push(setTimeout(() => {
            stepStack();
            ui.stateBadge.textContent = "State: Stacking";
            ui.stateBadge.className = "state-badge pending";
            ui.helperText.innerHTML = "<span style='color:var(--color-coach); font-weight:700;'>[DEMO TOUR - STEP 3/5]</span> **Hardware Context Stacking:** The CPU automatically pushes the 8-register stack frame (xPSR, PC, LR, R12, R3-R0) to physical SRAM. SP decrements by 32 bytes (to 0x20007FE0).";
        }, 6000));

        // Step 4: Execute Vector Handler after 10s
        demoTimers.push(setTimeout(() => {
            stepIsr();
            ui.stateBadge.textContent = "State: Active ISR";
            ui.stateBadge.className = "state-badge active";
            ui.helperText.innerHTML = "<span style='color:var(--color-coach); font-weight:700;'>[DEMO TOUR - STEP 4/5]</span> **Handler Vector Entry:** CPU enters Handler Mode. PC branches to Exception Vector 0x080009B0. LR is written with EXC_RETURN (0xFFFFFFF9) to lock MSP return sequence.";
        }, 10000));

        // Step 5: Unstacking Exception Return after 14s
        demoTimers.push(setTimeout(() => {
            stepReturn();
            ui.stateBadge.textContent = "State: EXC_RETURN";
            ui.stateBadge.className = "state-badge idle";
            ui.helperText.innerHTML = "<span style='color:var(--color-coach); font-weight:700;'>[DEMO TOUR - STEP 5/5]</span> **Exception Return (BX LR):** CPU pops registers back from stack RAM, increments SP back to 0x20008000, and returns to Thread Address 0x08000458. **Demo Tour Completed!**";
            
            demoBtn.textContent = "⚡ Start Demo Tour";
            demoBtn.disabled = false;
            disableAllControls(false);
            updateConsoleControls();
        }, 14000));
    }

    // Initializer
    function setup() {
        stepIdle();
        
        ui.btnIdle.addEventListener("click", () => {
            clearDemoTimers();
            stepIdle();
        });
        ui.btnTrigger.addEventListener("click", stepTrigger);
        ui.btnStack.addEventListener("click", stepStack);
        ui.btnIsr.addEventListener("click", stepIsr);
        ui.btnReturn.addEventListener("click", stepReturn);
        
        const demoBtn = document.getElementById("btn-sim-demo");
        if (demoBtn) {
            demoBtn.addEventListener("click", runDemoTour);
        }
    }

    window.addEventListener("DOMContentLoaded", setup);

})();
