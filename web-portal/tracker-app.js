// tracker-app.js - Standalone Candidate Vetting Hub Controller
// Offline-first client-side state machine with secure Role-based Login and Executive Reporting

(function() {
    'use strict';

    // -------------------------------------------------------------
    // 45-Day Systems Curriculum Database (Confluence Seed Data)
    // -------------------------------------------------------------
    const SYLLABUS_DB = {
        1: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "The Preprocessor Pipeline and Macro Expansion Hazards",
            theory: "Deep-dive into the C Preprocessor (cpp). Understand header file inclusion (#include), conditional compilation (#ifdef, #if defined), and macro expansions. Study macro hazards such as side-effects, double evaluations, and operator precedence issues. Learn how compiler flags like '-E' produce intermediate '.i' files containing expanded text before tokenization.<br><br><a href='logic-gate-simulator/index.html' class='btn btn-accent' style='display:inline-block; font-size:0.75rem; text-decoration:none; padding:4px 8px; color:white;' target='_blank'>⚡ Open in Gate Simulator</a>",
            lab: "Write a complex nested macro system that calculates the square of a number and absolute values. Create a source file main.c, run it through the preprocessor using 'gcc -E' and inspect the generated '.i' file. Identify where the macro expansions occur and explain why double evaluation of side-effect expressions (e.g., ++x) leads to logical corruption.",
            code: `// Unsafe vs Safe Macro Evaluation Demo\n#define SQUARE_UNSAFE(x) ((x) * (x))\n\nstatic inline int square_safe(int x) {\n    return x * x;\n}\n\n// SQUARE_UNSAFE(++val) expands to ((++val) * (++val)) -> UNDEFINED!`,
            validation: "Compile with 'gcc -std=c11 -Wall -Wextra -Werror -O0'. Run 'gcc -E main.c' and verify that the preprocessor expands SQUARE_UNSAFE(++val) directly in the source text, while square_safe remains a standard function call boundary."
        },
        2: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "Compilation to Assembly and GDB Register Analysis",
            theory: "Analyze how the compiler translates preprocessed intermediate C code into assembly instructions specific to the target CPU architecture. Study ARMv7-M / x86-64 register structures, instruction sizing, and the translation of loops and branching statements into conditional branches. Master GDB commands for register inspection.",
            lab: "Write a C function containing a nested loop and conditional branch. Compile the code to raw assembly using the '-S' flag. Inspect the assembly output to trace label naming conventions. Load the executable under GDB, set breakpoints, step instruction-by-step ('si'), and print register contents to see loops incrementing registers directly.",
            code: `// Factorial sum to analyze registers usage in GDB\nuint32_t compute_factorial_sum(uint32_t limit) {\n    uint32_t total = 0;\n    for (uint32_t i = 1; i <= limit; ++i) {\n        uint32_t fact = 1;\n        for (uint32_t j = 1; j <= i; ++j) {\n            fact *= j;\n        }\n        total += fact;\n    }\n    return total;\n}`,
            validation: "Compile with 'gcc -S -g -O0 factorial.c'. Load factorial.o into GDB. Run 'layout asm' and 'info registers' to physically observe register status updates (e.g. EAX/RAX changes) during execution steps."
        },
        3: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "Relocatable Object Files Dissection and Symbol Resolution",
            theory: "Explore relocatable object files (.o) and ELF segment architecture. Map the physical layout of standard sections: .text (machine code), .data (initialized global/static variables), .bss (uninitialized variables zeroed out at startup), and .rodata (read-only constants). Understand symbol tables and states (Text 'T', Data 'D', BSS 'B', Undefined 'U').<br><br><a href='memory-simulator/index.html' class='btn btn-accent' style='display:inline-block; font-size:0.75rem; text-decoration:none; padding:4px 8px; color:white;' target='_blank'>⚡ Open in Memory Simulator</a>",
            lab: "Write a C file defining variables in each of these sections. Compile to an object file using the '-c' flag. Use 'nm', 'objdump', and 'readelf' to dissect the symbols and sections. Confirm that global variables mapped to appropriate segments and trace dynamic relocations.",
            code: `// Variables mapping directly to distinct ELF segments\nuint32_t active_state_flag = 0xDEADC0DEU;   // Allocated in .data\nuint32_t sensor_telemetry_buffer[100];       // Allocated in .bss\nconst char device_serial_number[] = "SN-01"; // Allocated in .rodata`,
            validation: "Run 'nm -S -S symbol_test.o' and 'objdump -h symbol_test.o'. Verify that active_state_flag is in the 'D' (data) section, sensor_telemetry_buffer is in the 'B' (bss) section, and device_serial_number is in the 'R' (rodata) section."
        },
        4: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "Linking Mechanics, Static/Dynamic Libraries, and Symbol Collisions",
            theory: "Explore the linking phase (ld). Learn how multiple object files are combined into a single executable, how references to external symbols are resolved, and how static (.a) and shared/dynamic (.so) libraries differ. Study symbol resolution rules (strong vs weak symbols) and the danger of silent symbol collisions.",
            lab: "Create two separate C files that define the same global variable name (one initialized, one uninitialized). Attempt to link them and observe the linker warning/error. Create a static library and a dynamic library, compile a main driver, and inspect the runtime load paths (LD_LIBRARY_PATH and rpath).",
            code: `// Compile dynamic library:\n// gcc -fPIC -shared math_ops.c -o libmathops.so\n// Link application against shared library:\n// gcc main.o -L. -lmathops -o linked_app -Wl,-rpath,.`,
            validation: "Compile dynamic library using '-fPIC -shared'. Link application with '-Wl,-rpath,.'. Run 'ldd linked_app' to verify the runtime link dependency is successfully resolved to libmathops.so."
        },
        5: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "GNU Make, Implicit Dependencies, and Incremental Builds",
            theory: "Understand the architecture of GNU Make. Learn rule structures (targets, prerequisites, recipes). Study Makefile variables, automatic variables ($@, $<, $^), pattern matching, and implicit rules. Master header dependency tracking using gcc options (-MMD, -MP) to ensure incremental builds compile safely when headers change.",
            lab: "Write a professional, production-grade Makefile for a multi-file C project. Configure compiler flags, directory clean targets, and automatic header file dependency generation. Touch a header file and verify that only the affected files recompile, leaving unmodified objects intact.",
            code: `# Makefile with automatic MMD dependency tracking\nCC = gcc\nCFLAGS = -std=c11 -Wall -Wextra -Werror -pedantic -g3 -O2 -MMD -MP\nSRCS = $(wildcard *.c)\nOBJS = $(SRCS:.c=.o)\nDEPS = $(OBJS:.o=.d)\n\n-include $(DEPS)`,
            validation: "Create a test project with main.c and utils.h. Compile using 'make'. Change a comment inside 'utils.h', run 'make' again, and verify that only objects depending on 'utils.h' are recompiled."
        },
        21: {
            phase: "Phase 5: Structures & Alignments",
            topic: "Structure Memory Layouts, Compiler Padding, and Offset Tracing",
            theory: "Study structure layouts in memory. To optimize memory bus transfers, compilers insert silent padding bytes into structures so that individual members are aligned with their native byte sizes (e.g. 4-byte boundaries for int, 2-byte for short). Learn how struct member ordering affects total structural footprint.<br><br><a href='memory-simulator/index.html' class='btn btn-accent' style='display:inline-block; font-size:0.75rem; text-decoration:none; padding:4px 8px; color:white;' target='_blank'>⚡ Open in Memory Simulator</a>",
            lab: "Define structures containing members of mixed sizes in different declarations. Calculate the size of each structure using 'sizeof' and identify the offsets of each member using the 'offsetof' macro. Optimize the structure footprint by reordering elements from largest to smallest.",
            code: `struct Unoptimized {\n    uint8_t a;  // Offset 0 (3 bytes padding)\n    uint32_t b; // Offset 4\n    uint8_t c;  // Offset 8 (3 bytes padding)\n}; // sizeof = 12 bytes\n\nstruct Optimized {\n    uint32_t b; // Offset 0\n    uint8_t a;  // Offset 4\n    uint8_t c;  // Offset 5 (2 bytes padding)\n}; // sizeof = 8 bytes`,
            validation: "Compile and execute. Verify the unoptimized size is 12 bytes and optimized size is 8 bytes, demonstrating effective padding reduction through ordering."
        },
        27: {
            phase: "Phase 6: Custom Allocators",
            topic: "Custom Memory Arenas and Alignment Boundaries",
            theory: "Understand the concept of a Memory Arena (or linear/bump allocator). Arena allocators speed up performance by allocating a single large buffer upfront and serving dynamic requests by bumping an offset index. Memory release is executed en-masse by clearing the entire arena. Learn how to enforce alignment on all sub-allocations.<br><br><a href='memory-simulator/index.html' class='btn btn-accent' style='display:inline-block; font-size:0.75rem; text-decoration:none; padding:4px 8px; color:white;' target='_blank'>⚡ Open in Memory Simulator</a>",
            lab: "Design and implement a complete, robust, type-aligned Memory Arena in C. The arena must take a statically allocated buffer and support variable-sized allocation requests. Ensure that the returned addresses are always aligned to 8-byte boundaries.",
            code: `typedef struct {\n    uint8_t *buffer;\n    size_t capacity;\n    size_t offset;\n} arena_t;\n\nvoid *arena_alloc(arena_t *arena, size_t size, size_t alignment) {\n    size_t current_addr = (size_t)(arena->buffer + arena->offset);\n    size_t aligned_addr = (current_addr + (alignment - 1)) & ~(alignment - 1);\n    size_t new_offset = aligned_addr - (size_t)arena->buffer;\n    if (new_offset + size > arena->capacity) return NULL;\n    arena->offset = new_offset + size;\n    return (void *)aligned_addr;\n}`,
            validation: "Write a test suite allocating various objects (e.g. chars, ints, structs) in sequence. Assert that every returned address is perfectly aligned to the requested size (e.g. multiple of 4 or 8) and fits within bounds."
        },
        28: {
            phase: "Phase 6: Custom Allocators",
            topic: "Fixed-Size Memory Block Pools",
            theory: "Learn why fixed-size block pool allocators (also called slab allocators) are mandatory in real-time operating systems (RTOS). A block pool partitions a raw buffer into equal-sized blocks linked together in a list. Allocation and deallocation are deterministic O(1) operations, introducing zero fragmentation.",
            lab: "Write a deterministic Fixed-Size Memory Pool allocator. Implement an initialization function, an allocation function (taking a block from the free list), and a free function (returning the block). Run tests to verify consistent execution latency.",
            code: `typedef struct block_node {\n    struct block_node *next;\n} block_node_t;\n\ntypedef struct {\n    uint8_t *pool_buffer;\n    size_t block_size;\n    block_node_t *free_list;\n} mem_pool_t;\n\nvoid *mem_pool_alloc(mem_pool_t *pool) {\n    if (pool->free_list == NULL) return NULL;\n    block_node_t *node = pool->free_list;\n    pool->free_list = node->next;\n    return (void *)node;\n}`,
            validation: "Write a test harness allocating and freeing blocks. Confirm that the memory pool handles exhaustions, deallocations restore pool capacity, and allocation execution takes constant time."
        },
        44: {
            phase: "Phase 9: Concurrency & MISRA C",
            topic: "MISRA C:2012 Guidelines and Critical Safety Constraints",
            theory: "Study the industrial Motor Industry Software Reliability Association (MISRA C:2012) standard guidelines for safety-critical systems. Explore critical rules: avoiding dynamic allocations after startup, eliminating undefined behaviors (e.g. pointer conversions), prohibiting multiple function exits, and restricting preprocessor usages.",
            lab: "Create a C library containing common violations of MISRA standards (like raw type casts, multi-return functions, pointer address arithmetic). Use static analyzers like 'cppcheck' or 'clang-tidy' to audit and rewrite the code to conform to 100% compliance.",
            code: `// VIOLATION: raw pointer arithmetic & multiple exit points\nint32_t unsafe_search(const int32_t *arr, size_t size, int32_t val) {\n    for (size_t i = 0; i < size; ++i) {\n        if (*(arr + i) == val) return (int32_t)i;\n    }\n    return -1;\n}\n\n// COMPLIANT: Array indexing and single return exit\nint32_t compliant_search(const int32_t arr[], size_t size, int32_t val) {\n    int32_t found_idx = -1;\n    if (arr != NULL) {\n        for (size_t i = 0; i < size; ++i) {\n            if (arr[i] == val) { found_idx = (int32_t)i; break; }\n        }\n    }\n    return found_idx;\n}`,
            validation: "Run 'cppcheck --addon=misra.py compliant_code.c' or use static diagnostic checks. Confirm that compliant code successfully satisfies coding constraints."
        },
        45: {
            phase: "Phase 9: Concurrency & MISRA C",
            topic: "Systems Profiling, Leak Audits, and Graduate Code Review",
            theory: "Explore advanced systems performance optimization pipelines. Understand how CPU cache misses and memory leakages degrade real-time embedded environments. Study validation tools: Valgrind (memory tracking), Gprof (execution cycle timing), and Perf (hardware counter monitoring).",
            lab: "Write an application that contains intentional memory leaks and high CPU utilization. Run the application through Valgrind to identify leaks and run under Gprof to pinpoint exactly which functions consume the most execution cycles. Optimize the hot-paths.",
            code: `// Compile with profiling enabled: gcc -pg final_profile.c -o final_profile\n// Execute binary to generate stats: ./final_profile\n// Audit CPU timings: gprof ./final_profile gmon.out\n// Audit memory leakages: valgrind --leak-check=full ./final_profile`,
            validation: "Compile using 'gcc -pg final_profile.c -o final_profile'. Run code, then execute 'gprof ./final_profile gmon.out' to view the cycle profile. Run under 'valgrind --leak-check=full ./final_profile' to verify the leaked_buffer trap."
        }
    };

    const PHASE_MAPPING = [
        { name: "Phase 1: Compiler & Toolchains", days: [1, 5] },
        { name: "Phase 2: Data & Radix Hazards", days: [6, 10] },
        { name: "Phase 3: Stack & Execution Frame", days: [11, 15] },
        { name: "Phase 4: Pointers & Arithmetic", days: [16, 20] },
        { name: "Phase 5: Structures & Alignments", days: [21, 25] },
        { name: "Phase 6: Custom Allocators", days: [26, 30] },
        { name: "Phase 7: POSIX System Boundaries", days: [31, 35] },
        { name: "Phase 8: Preprocessor Metaprogramming", days: [36, 40] },
        { name: "Phase 9: Concurrency & MISRA C", days: [41, 45] }
    ];

    function pad2(num) {
        return String(num).padStart(2, '0');
    }

    function getSyllabusPlan(day) {
        if (SYLLABUS_DB[day]) {
            return SYLLABUS_DB[day];
        }
        const phaseInfo = PHASE_MAPPING.find(pm => day >= pm.days[0] && day <= pm.days[1]);
        const phaseName = phaseInfo ? phaseInfo.name : "Systems Milestone Core";
        
        let topic = "C Systems Programming Deep-Dive";
        let theory = "Deep-dive systems analysis focusing on memory management, pointer scaling arithmetic, or raw hardware architectures.";
        let lab = "Configure your local compiler and static analysis tools. Audit and verify compilation boundaries under strict compiler flags.";
        let code = `// C Systems Core Vetting Challenge\n#include <stdint.h>\n\nvoid init_register(void) {\n    volatile uint32_t *reg = (volatile uint32_t *)0x20001000U;\n    *reg = 0xAA;\n}`;
        let validation = "Compile, execute, step through with GDB, and inspect raw output registers.";

        if (day === 6) {
            topic = "Two's Complement bit representations and conversions";
            theory = "Study the physical logic of signed numbers. Master sign extension and arithmetic shifts.<br><br><a href='number-simulator/index.html' class='btn btn-accent' style='display:inline-block; font-size:0.75rem; text-decoration:none; padding:4px 8px; color:white;' target='_blank'>⚡ Open in Register Simulator</a>";
            code = `int8_t sign_ext = -5; // 0xFB\nint32_t extended = (int32_t)sign_ext; // 0xFFFFFFFB`;
        } else if (day === 7) {
            topic = "Safe Integer Addition and Promotions";
            theory = "Understand implicit integer promotions and write pre-condition safe math.";
            code = `bool safe_add(int32_t a, int32_t b, int32_t *res) {\n    if (b > 0 && a > (INT32_MAX - b)) return false;\n    *res = a + b;\n    return true;\n}`;
        } else if (day === 8) {
            topic = "IEEE 754 Floating-Point Comparison precision gaps";
            theory = "Analyze floating-point round-off error behaviors and establish epsilon boundary comparisons.";
            code = `#define EPSILON 1e-6f\nbool float_equal(float a, float b) {\n    return fabsf(a - b) < EPSILON;\n}`;
        } else if (day === 11) {
            topic = "ARM Cortex Procedure Call Standards (AAPCS) and registers file";
            theory = "Audit registers R0-R3 parameter passing conventions and callee-saved scratch mappings.<br><br><a href='nvic-simulator/index.html' class='btn btn-accent' style='display:inline-block; font-size:0.75rem; text-decoration:none; padding:4px 8px; color:white;' target='_blank'>⚡ Open in NVIC Simulator</a>";
            code = `// Param 1 in r0, Param 2 in r1, Param 3 in r2\nuint32_t verify_aapcs(uint32_t a, uint32_t b, uint32_t c) {\n    return a + b + c;\n}`;
        } else if (day === 18) {
            topic = "Volatile Registers Polling Loops";
            theory = "Explore register caching and why volatile bypasses CPU registers to load direct memory addresses.";
            code = `volatile uint32_t * const status_reg = (volatile uint32_t *)0x40020000U;\nvoid wait_status(void) {\n    while ((*status_reg & 0x01) == 0);\n}`;
        } else if (day === 30) {
            topic = "Memory Leak Auditing & Custom Ledgers";
            theory = "Implement tracked malloc wrappers to intercept lost pointers and audit leakage lists.";
            code = `void *tracked_malloc(size_t size, const char *file, int line) {\n    void *p = malloc(size);\n    // Register to active allocation ledger...\n    return p;\n}`;
        } else if (day === 33) {
            topic = "POSIX Memory-Mapped Files (mmap)";
            theory = "Learn mmap zero-copy file sharing mechanics, mapping descriptor fields into virtual page memory arrays.";
            code = `int fd = open("db.bin", O_RDWR);\nstruct record *map = mmap(NULL, size, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);`;
        } else if (day === 38) {
            topic = "X-Macros code generators for string lists";
            theory = "Centralize tabular data definitions inside macro maps and generate enums and string switches.";
            code = `#define ERROR_MAP \\ \n   X(ERR_OK, \"Success\") \\ \n   X(ERR_TIMEOUT, \"Timeout\")\n\ntypedef enum { #define X(a,b) a, ERROR_MAP #undef X } err_t;`;
        } else if (day === 41) {
            topic = "POSIX Threads (pthreads) configurations";
            theory = "Learn thread space parameters, spawning worker callbacks, joining processes, and configuring attributes stack.";
            code = `pthread_t tid;\npthread_create(&tid, NULL, worker_callback, (void *)arg);\npthread_join(tid, &status);`;
        }

        return { phase: phaseName, topic, theory, lab, code, validation };
    }

    // -------------------------------------------------------------
    // Core Application State & LocalStorage Persistence
    // -------------------------------------------------------------
    let state = {
        candidates: [],
        activeCandidateId: ""
    };

    let wikiPages = [];

    // Role-based auth persistence
    let loggedUser = {
        role: "student", // "mentor" or "student"
        studentId: ""    // active student ID if role is student
    };

    function seedInitialState() {
        const candidate1 = { id: "cand-siva", name: "Siva Prasad", password: "siva123", tasks: {} };
        const candidate2 = { id: "cand-ram", name: "Ram Kumar", password: "ram123", tasks: {} };

        [candidate1, candidate2].forEach(cand => {
            for (let d = 1; d <= 45; d++) {
                const plan = getSyllabusPlan(d);
                cand.tasks[`day-${d}`] = {
                    id: `day-${d}`,
                    day: d,
                    title: `Day ${pad2(d)}: ${plan.topic}`,
                    phase: plan.phase,
                    description: plan.theory,
                    challenge: plan.lab,
                    status: d <= 3 ? "Completed" : (d === 4 ? "In Progress" : "To Do"),
                    grade: d <= 3 ? "A+ [100%]" : "Pending",
                    notes: d <= 3 ? "Completed unassisted. Zero compiler warnings. Verified under GCC." : "",
                    isBlocker: false
                };
            }
        });

        state.candidates = [candidate1, candidate2];
        state.activeCandidateId = "cand-siva";
        saveState();

        wikiPages = [
            {
                id: "wiki-intro",
                title: "Vetting Rules & Operating Laws",
                phase: "Phase 1: Compiler & Toolchains",
                content: "All candidates must be audited daily under strict compiler flags. A single warning (e.g. uninitialized variable) aborts the grading gate and results in a dynamic 'F' grade until resolved under GDB. Memory tracking checks are executed under Valgrind.",
                author: "Principal Architect",
                date: "2026-05-30"
            }
        ];
        saveWiki();
    }

    function saveState() { localStorage.setItem("minux_candidate_state", JSON.stringify(state)); }
    async function loadState() {
        // Try fetching progress_data.json first!
        try {
            const response = await fetch('progress_data.json');
            if (response.ok) {
                const fetchedState = await response.json();
                if (fetchedState && fetchedState.candidates && Array.isArray(fetchedState.candidates)) {
                    state = fetchedState;
                    saveState(); // Sync back to localStorage!
                    console.log("SUCCESS: Loaded progress_data.json and synchronized states.");
                    return;
                }
            }
        } catch (e) {
            console.log("No progress_data.json found or fetch failed, falling back to localStorage: ", e);
        }

        // Always sync simulator achievements on state load!
        syncSimulatorMilestones();

        const data = localStorage.getItem("minux_candidate_state");
        if (data) { 
            try {
                state = JSON.parse(data); 
                if (!state || !state.candidates || !Array.isArray(state.candidates) || state.candidates.length === 0) {
                    seedInitialState();
                } else {
                    // Inject fallback passwords into loaded candidates to prevent authentication blocks
                    state.candidates.forEach(cand => {
                        if (!cand.password) {
                            if (cand.id === "cand-siva") cand.password = "siva123";
                            else if (cand.id === "cand-ram") cand.password = "ram123";
                            else cand.password = cand.name.toLowerCase().split(/\s+/)[0] + "123";
                        }
                    });
                    saveState();
                }
            } catch (e) {
                console.error("Failed to parse cached state, seeding defaults.", e);
                seedInitialState();
            }
        } else { 
            seedInitialState(); 
        }
    }

    function saveWiki() { localStorage.setItem("minux_wiki_pages", JSON.stringify(wikiPages)); }
    function loadWiki() {
        const data = localStorage.getItem("minux_wiki_pages");
        if (data) { wikiPages = JSON.parse(data); }
    }

    function getActiveCandidate() {
        return state.candidates.find(c => c.id === state.activeCandidateId) || state.candidates[0];
    }

    // -------------------------------------------------------------
    // Vetting GPA and metrics calculations
    // -------------------------------------------------------------
    function calculateMetrics() {
        const cand = getActiveCandidate();
        if (!cand) return;

        const tasks = Object.values(cand.tasks);
        const total = tasks.length;
        
        const completed = tasks.filter(t => t.status === "Completed").length;
        const progressPercent = Math.round((completed / total) * 100);
        let blockerCount = tasks.filter(t => t.isBlocker).length;

        const gradeScale = {
            "A+ [100%]": 100, "A [90%]": 90, "B [80%]": 80, "C [70%]": 70, "F [Fail]": 0
        };

        let gradedTasks = 0;
        let totalScore = 0;

        tasks.forEach(t => {
            if (t.grade && t.grade !== "Pending" && gradeScale[t.grade] !== undefined) {
                totalScore += gradeScale[t.grade];
                gradedTasks++;
            }
        });

        const gpa = gradedTasks > 0 ? (totalScore / gradedTasks).toFixed(1) + "%" : "0.0%";

        document.getElementById("kpi-candidate-name").textContent = cand.name;
        document.getElementById("kpi-progress-ratio").textContent = `${completed} / ${total} Days`;
        document.getElementById("kpi-progress-bar").style.width = `${progressPercent}%`;
        document.getElementById("kpi-gpa").textContent = gpa;
        document.getElementById("kpi-blockers").textContent = blockerCount;
        
        const blockersCard = document.getElementById("kpi-blockers").closest('.kpi-card');
        if (blockerCount > 0) {
            blockersCard.style.boxShadow = "0 0 15px rgba(236, 72, 153, 0.4)";
        } else {
            blockersCard.style.boxShadow = "none";
        }
    }

    // -------------------------------------------------------------
    // Kanban Board Render Engine (with Gated Role Restrictions)
    // -------------------------------------------------------------
    function renderBoard() {
        const cand = getActiveCandidate();
        if (!cand) return;

        const columns = {
            "To Do": document.getElementById("cards-todo"),
            "In Progress": document.getElementById("cards-progress"),
            "Under Review": document.getElementById("cards-review"),
            "Completed": document.getElementById("cards-completed")
        };

        Object.values(columns).forEach(col => col.innerHTML = "");
        const taskCounts = { "To Do": 0, "In Progress": 0, "Under Review": 0, "Completed": 0 };
        const tasks = Object.values(cand.tasks).sort((a, b) => a.day - b.day);

        tasks.forEach(task => {
            const card = document.createElement("div");
            card.className = `task-card ${task.isBlocker ? "blocker" : ""}`;
            card.id = `card-${task.id}`;
            card.dataset.taskId = task.id;
            
            // Student role is read-only or restricted dragging
            const isStudent = loggedUser.role === "student";
            card.draggable = !isStudent || (task.status === "To Do" || task.status === "In Progress");
            
            let verifiedBadge = "";
            if (task.verifiedViaSimulator) {
                verifiedBadge = `<div class="task-verified-badge">⚡ Verified via Simulator</div>`;
            }

            card.innerHTML = `
                <div class="card-key">C-FAST-${pad2(task.day)}</div>
                <div class="card-title">${task.title}</div>
                ${verifiedBadge}
                <div class="card-footer">
                    <span style="color: var(--text-muted);">Assignee: ${cand.name.split(" ")[0]}</span>
                    <span class="card-grade ${task.grade === 'Pending' ? 'grade-pending' : (task.grade === 'F [Fail]' ? 'grade-fail' : '')}">${task.grade.split(" ")[0]}</span>
                </div>
            `;

            // HTML5 Drag events
            card.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", task.id);
                card.style.opacity = "0.5";
            });

            card.addEventListener("dragend", () => { card.style.opacity = "1"; });

            card.addEventListener("dblclick", () => { openTaskModal(task); });

            if (columns[task.status]) {
                columns[task.status].appendChild(card);
                taskCounts[task.status]++;
            }
        });

        document.getElementById("count-todo").textContent = taskCounts["To Do"];
        document.getElementById("count-progress").textContent = taskCounts["In Progress"];
        document.getElementById("count-review").textContent = taskCounts["Under Review"];
        document.getElementById("count-completed").textContent = taskCounts["Completed"];
    }

    function setupDragAndDrop() {
        const columns = document.querySelectorAll(".kanban-column");
        columns.forEach(col => {
            col.addEventListener("dragover", (e) => {
                e.preventDefault();
                col.classList.add("drag-over");
            });

            col.addEventListener("dragleave", () => { col.classList.remove("drag-over"); });

            col.addEventListener("drop", (e) => {
                e.preventDefault();
                col.classList.remove("drag-over");
                
                const taskId = e.dataTransfer.getData("text/plain");
                const newStatus = col.dataset.status;
                
                // Gating Check: Student cannot drag issues to Under Review or Completed!
                if (loggedUser.role === "student" && (newStatus === "Under Review" || newStatus === "Completed")) {
                    alert("Gated Permissions: Candidates cannot submit audits or complete tasks. Only Mentors/Auditors can audit grades.");
                    return;
                }
                
                if (taskId && newStatus) {
                    updateTaskStatus(taskId, newStatus);
                }
            });
        });
    }

    function updateTaskStatus(taskId, newStatus) {
        const cand = getActiveCandidate();
        if (cand && cand.tasks[taskId]) {
            cand.tasks[taskId].status = newStatus;
            
            if (newStatus === "Completed" && cand.tasks[taskId].grade === "Pending") {
                cand.tasks[taskId].grade = "A+ [100%]";
            } else if (newStatus === "To Do") {
                cand.tasks[taskId].grade = "Pending";
            }
            
            saveState();
            renderBoard();
            calculateMetrics();
            renderReportsTable();
        }
    }

    // -------------------------------------------------------------
    // Executive Performance Reporting Dashboard Generator
    // -------------------------------------------------------------
    function renderReportsTable() {
        const tableBody = document.getElementById("report-table-body");
        tableBody.innerHTML = "";
        
        const gradeScale = {
            "A+ [100%]": 100, "A [90%]": 90, "B [80%]": 80, "C [70%]": 70, "F [Fail]": 0
        };

        state.candidates.forEach(cand => {
            const tasks = Object.values(cand.tasks);
            const completed = tasks.filter(t => t.status === "Completed").length;
            const total = tasks.length;
            const progressPercent = Math.round((completed / total) * 100);
            
            // Calculate GPA
            let gradedTasks = 0;
            let totalScore = 0;
            tasks.forEach(t => {
                if (t.grade && t.grade !== "Pending" && gradeScale[t.grade] !== undefined) {
                    totalScore += gradeScale[t.grade];
                    gradedTasks++;
                }
            });
            const gpaValue = gradedTasks > 0 ? Math.round(totalScore / gradedTasks) : 0;

            // Identify current coding phase (active item in Progress)
            const activeTask = tasks.find(t => t.status === "In Progress");
            const currentPhase = activeTask ? activeTask.phase.split(":")[0] + ` - Day ${activeTask.day}` : (completed === total ? "Graduate" : "Syllabus Queue");

            // Unresolved Blockers
            const blockers = tasks.filter(t => t.isBlocker).length;
            const blockerBadge = blockers > 0 ? `<span style="background: rgba(236,72,153,0.1); color: var(--color-coach); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem;">${blockers} Blocker(s)</span>` : `<span style="color: var(--text-muted); font-size: 0.85rem;">None</span>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="font-weight: 700;">${cand.name}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 0.85rem; font-weight: 600; width: 60px;">${progressPercent}%</span>
                        <div class="progress-container" style="flex: 1; max-width: 150px; margin-top: 0;">
                            <div class="progress-bar" style="width: ${progressPercent}%;"></div>
                        </div>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${completed}/${total} Days</span>
                    </div>
                </td>
                <td style="font-weight: 700; color: ${gpaValue >= 80 ? 'var(--color-embedded)' : (gpaValue > 0 ? 'var(--color-c-systems)' : 'var(--text-muted)')}">${gpaValue > 0 ? gpaValue + '%' : 'Pending'}</td>
                <td>${blockerBadge}</td>
                <td style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">${currentPhase}</td>
                <td style="text-align: center;">
                    <button class="btn-secondary view-board-btn" data-cand-id="${cand.id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">View Active Board</button>
                </td>
            `;

            tr.querySelector(".view-board-btn").addEventListener("click", () => {
                state.activeCandidateId = cand.id;
                saveState();
                populateCandidateDropdown();
                calculateMetrics();
                renderBoard();
                
                // Switch Tabs back to Board view
                switchTab("board-wiki");
            });

            tableBody.appendChild(tr);
        });

        document.getElementById("total-candidates-badge").textContent = `Total Tracked: ${state.candidates.length} Candidate(s)`;
    }

    // -------------------------------------------------------------
    // Confluence Wiki Render Space
    // -------------------------------------------------------------
    let activeWikiPageId = "day-1";

    function renderWikiTree(filterQuery = "") {
        const treeContainer = document.getElementById("wiki-index-tree");
        treeContainer.innerHTML = "";
        const query = filterQuery.toLowerCase();

        PHASE_MAPPING.forEach(phase => {
            const phaseDiv = document.createElement("div");
            phaseDiv.className = "wiki-phase-group";
            
            const title = document.createElement("div");
            title.className = "wiki-phase-title";
            title.textContent = phase.name.split(":")[0];
            phaseDiv.appendChild(title);

            let addedDays = 0;
            for (let d = phase.days[0]; d <= phase.days[1]; d++) {
                const plan = getSyllabusPlan(d);
                if (query && !plan.topic.toLowerCase().includes(query) && !plan.theory.toLowerCase().includes(query)) {
                    continue;
                }

                const link = document.createElement("a");
                link.href = "#";
                link.className = `wiki-day-link ${activeWikiPageId === `day-${d}` ? 'active' : ''}`;
                link.textContent = `Day ${pad2(d)}: ${plan.topic.split(" ")[0]}`;
                link.title = `Day ${pad2(d)}: ${plan.topic}`;
                link.dataset.pageId = `day-${d}`;
                
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    activeWikiPageId = `day-${d}`;
                    renderActiveWikiPage();
                    document.querySelectorAll(".wiki-day-link").forEach(l => l.classList.remove("active"));
                    link.classList.add("active");
                });

                phaseDiv.appendChild(link);
                addedDays++;
            }

            if (addedDays > 0) treeContainer.appendChild(phaseDiv);
        });

        const customDiv = document.createElement("div");
        customDiv.className = "wiki-phase-group";
        const customTitle = document.createElement("div");
        customTitle.className = "wiki-phase-title";
        customTitle.textContent = "Shared Retros";
        customDiv.appendChild(customTitle);

        let addedCustom = 0;
        wikiPages.forEach(page => {
            if (query && !page.title.toLowerCase().includes(query) && !page.content.toLowerCase().includes(query)) {
                return;
            }

            const link = document.createElement("a");
            link.href = "#";
            link.className = `wiki-day-link ${activeWikiPageId === page.id ? 'active' : ''}`;
            link.textContent = page.title;
            link.dataset.pageId = page.id;

            link.addEventListener("click", (e) => {
                e.preventDefault();
                activeWikiPageId = page.id;
                renderActiveWikiPage();
                document.querySelectorAll(".wiki-day-link").forEach(l => l.classList.remove("active"));
                link.classList.add("active");
            });

            customDiv.appendChild(link);
            addedCustom++;
        });

        if (addedCustom > 0) treeContainer.appendChild(customDiv);
    }

    function renderActiveWikiPage() {
        const titleEl = document.getElementById("wiki-doc-title");
        const metaEl = document.getElementById("wiki-doc-meta");
        const bodyEl = document.getElementById("wiki-doc-body");

        if (activeWikiPageId.startsWith("day-")) {
            const dayNum = parseInt(activeWikiPageId.split("-")[1]);
            const plan = getSyllabusPlan(dayNum);

            titleEl.textContent = `Day ${pad2(dayNum)}: ${plan.topic}`;
            metaEl.innerHTML = `
                <span>Author: Minux Principal Architect</span>
                <span>Reference: <strong>${plan.phase}</strong></span>
            `;

            bodyEl.innerHTML = `
                <p><strong>Microscopic Vetting Specification</strong></p>
                <h4>📘 Theory Deep-Dive (4 Hours)</h4>
                <p>${plan.theory}</p>
                
                <h4>🛠️ Unassisted Lab Track (4 Hours)</h4>
                <p>${plan.lab}</p>
                
                <h4>💻 Target Systems Implementation Code Block</h4>
                <pre><code>${plan.code}</code></pre>
                
                <h4>🔬 Validation and Post-Silicon Verification</h4>
                <p><strong>Tooling:</strong> ${plan.validation}</p>
            `;
        } else {
            const page = wikiPages.find(p => p.id === activeWikiPageId);
            if (page) {
                titleEl.textContent = page.title;
                metaEl.innerHTML = `
                    <span>Author: ${page.author}</span>
                    <span>Date: ${page.date} | Space: <strong>${page.phase}</strong></span>
                `;
                bodyEl.innerHTML = `<p style="white-space: pre-wrap;">${page.content}</p>`;
            }
        }
    }

    // -------------------------------------------------------------
    // Gated Modals & Role Operations
    // -------------------------------------------------------------
    function openTaskModal(task) {
        document.getElementById("modal-task-id").value = task.id;
        document.getElementById("modal-task-title").value = task.title;
        document.getElementById("modal-task-desc").value = task.description;
        document.getElementById("modal-task-challenge").value = task.challenge;
        document.getElementById("modal-task-status").value = task.status;
        document.getElementById("modal-task-grade").value = task.grade;
        document.getElementById("modal-task-notes").value = task.notes || "";
        document.getElementById("modal-task-blocker").checked = task.isBlocker;
        document.getElementById("modal-task-key").textContent = `C-FAST-${pad2(task.day)} Task Vetting`;

        // Gating Check: Student cannot edit critical grade metrics!
        const isStudent = loggedUser.role === "student";
        document.getElementById("modal-task-grade").disabled = isStudent;
        document.getElementById("modal-task-notes").disabled = isStudent;
        document.getElementById("modal-task-blocker").disabled = isStudent;
        document.getElementById("modal-task-delete").style.display = isStudent ? "none" : "inline-block";

        document.getElementById("task-modal").style.display = "flex";
    }

    function closeTaskModal() { document.getElementById("task-modal").style.display = "none"; }

    function saveTaskModalChanges() {
        const cand = getActiveCandidate();
        const taskId = document.getElementById("modal-task-id").value;

        if (cand && cand.tasks[taskId]) {
            const task = cand.tasks[taskId];
            task.title = document.getElementById("modal-task-title").value;
            task.description = document.getElementById("modal-task-desc").value;
            task.challenge = document.getElementById("modal-task-challenge").value;
            
            // Only update fields if not a student
            if (loggedUser.role !== "student") {
                task.status = document.getElementById("modal-task-status").value;
                task.grade = document.getElementById("modal-task-grade").value;
                task.notes = document.getElementById("modal-task-notes").value;
                task.isBlocker = document.getElementById("modal-task-blocker").checked;
            } else {
                // Students can only change status between To Do and In Progress
                const chosenStatus = document.getElementById("modal-task-status").value;
                if (chosenStatus === "Under Review" || chosenStatus === "Completed") {
                    alert("Gated Permissions: Students cannot transition tasks into Review or Completed statuses.");
                } else {
                    task.status = chosenStatus;
                }
            }

            saveState();
            renderBoard();
            calculateMetrics();
            renderReportsTable();
            closeTaskModal();
        }
    }

    function deleteActiveTask() {
        const cand = getActiveCandidate();
        const taskId = document.getElementById("modal-task-id").value;
        if (loggedUser.role === "student") return;
        
        if (confirm("Are you sure you want to delete this custom task item?")) {
            delete cand.tasks[taskId];
            saveState();
            renderBoard();
            calculateMetrics();
            renderReportsTable();
            closeTaskModal();
        }
    }

    // Tab swapper engine
    function switchTab(tabName) {
        document.querySelectorAll(".workspace-panel").forEach(p => p.classList.remove("active"));
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

        if (tabName === "board-wiki") {
            document.getElementById("panel-board-wiki").classList.add("active");
            document.getElementById("tab-trigger-board").classList.add("active");
        } else if (tabName === "reports") {
            document.getElementById("panel-reports").classList.add("active");
            document.getElementById("tab-trigger-reports").classList.add("active");
            renderReportsTable();
        }
    }

    // -------------------------------------------------------------
    // Secure Login Gateway & Role Gating Logic
    // -------------------------------------------------------------
    function verifyLogin() {
        const role = document.getElementById("login-role").value;
        if (role === "mentor") {
            const code = document.getElementById("login-passcode").value;
            if (code === "mentor123") {
                loggedUser.role = "mentor";
                loggedUser.studentId = "";
                sessionStorage.setItem("minux_logged_role", "mentor");
                sessionStorage.setItem("minux_logged_studentid", "");
                
                document.getElementById("login-gateway").style.display = "none";
                document.getElementById("login-error-msg").style.display = "none";
                applyGatedPermissions();
            } else {
                document.getElementById("login-error-msg").style.display = "block";
            }
        } else {
            // Student login
            const studentId = document.getElementById("login-student-select").value;
            const code = document.getElementById("login-passcode").value;
            
            const student = state.candidates.find(c => c.id === studentId);
            const expectedPassword = student ? (student.password || "siva123") : "siva123";

            if (code === expectedPassword) {
                loggedUser.role = "student";
                loggedUser.studentId = studentId;
                sessionStorage.setItem("minux_logged_role", "student");
                sessionStorage.setItem("minux_logged_studentid", studentId);
                
                // Switch current active candidate context to the logged student!
                state.activeCandidateId = studentId;
                saveState();

                document.getElementById("login-gateway").style.display = "none";
                document.getElementById("login-error-msg").style.display = "none";
                applyGatedPermissions();
            } else {
                const errMsg = document.getElementById("login-error-msg");
                errMsg.textContent = "Invalid Candidate Password!";
                errMsg.style.display = "block";
            }
        }
    }

    function applyGatedPermissions() {
        const isStudent = loggedUser.role === "student";
        
        // 1. Update Header Badges
        const badge = document.getElementById("user-role-badge");
        if (isStudent) {
            const cand = state.candidates.find(c => c.id === loggedUser.studentId);
            badge.textContent = `Logged in as: Student (${cand ? cand.name : 'Unknown'})`;
            badge.style.color = "var(--color-python)";
            badge.style.borderColor = "rgba(59,130,246,0.3)";
        } else {
            badge.textContent = "Logged in as: Auditor (Mentor/Admin)";
            badge.style.color = "var(--color-embedded)";
            badge.style.borderColor = "rgba(20,184,166,0.3)";
        }

        // 2. Hide / Disable Management Buttons for Students
        document.getElementById("add-candidate-trigger").style.display = isStudent ? "none" : "inline-flex";
        document.getElementById("add-task-btn-group").style.display = isStudent ? "none" : "block";
        document.getElementById("active-candidate-select").disabled = isStudent;

        // Re-calculate and render with new permission limits
        populateCandidateDropdown();
        calculateMetrics();
        renderBoard();
        renderWikiTree();
    }

    function handleLogout() {
        sessionStorage.removeItem("minux_logged_role");
        sessionStorage.removeItem("minux_logged_studentid");
        
        // Reset inputs and show fullscreen login gateway
        document.getElementById("login-passcode").value = "";
        document.getElementById("login-gateway").style.display = "flex";
        document.getElementById("login-error-msg").style.display = "none";
        
        populateLoginCandidateDropdown();
    }

    function populateLoginCandidateDropdown() {
        const loginSelect = document.getElementById("login-student-select");
        loginSelect.innerHTML = "";
        state.candidates.forEach(cand => {
            const opt = document.createElement("option");
            opt.value = cand.id;
            opt.textContent = cand.name;
            loginSelect.appendChild(opt);
        });
    }

    function populateCandidateDropdown() {
        const selector = document.getElementById("active-candidate-select");
        selector.innerHTML = "";
        state.candidates.forEach(cand => {
            const opt = document.createElement("option");
            opt.value = cand.id;
            opt.textContent = cand.name;
            if (cand.id === state.activeCandidateId) {
                opt.selected = true;
            }
            selector.appendChild(opt);
        });
    }

    // -------------------------------------------------------------
    // Simulator State Bridge & Config Exporter Functions
    // -------------------------------------------------------------
    function syncSimulatorMilestones() {
        const milestonesRaw = localStorage.getItem("minux_simulator_milestones");
        if (!milestonesRaw) return;

        let milestones = {};
        try {
            milestones = JSON.parse(milestonesRaw);
        } catch (e) {
            console.error("Error parsing milestones", e);
            return;
        }

        // Map milestones to syllabus days
        const mappings = {
            "logic_gate_adder": "day-1",
            "sram_segmentation": "day-3",
            "number_representations": "day-6",
            "nvic_exception_nesting": "day-11"
        };

        let updated = false;
        state.candidates.forEach(cand => {
            Object.keys(mappings).forEach(milestoneKey => {
                if (milestones[milestoneKey]) {
                    const taskId = mappings[milestoneKey];
                    if (cand.tasks[taskId]) {
                        const task = cand.tasks[taskId];
                        if (task.status !== "Completed" || !task.verifiedViaSimulator) {
                            task.status = "Completed";
                            task.grade = "A+ [100%]";
                            task.verifiedViaSimulator = true;
                            task.notes = (task.notes || "") + " [Pass verified via Simulator Integration Bridge]";
                            updated = true;
                        }
                    }
                }
            });
        });

        if (updated) {
            saveState();
            console.log("SUCCESS: Synchronized simulator milestones to Candidate Hub.");
        }
    }

    function exportProgressState() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "progress_data.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    // -------------------------------------------------------------
    // Application Bootstrap Launch
    // -------------------------------------------------------------
    function setupEventListeners() {
        // Tab swapper buttons
        document.getElementById("tab-trigger-board").addEventListener("click", () => switchTab("board-wiki"));
        document.getElementById("tab-trigger-reports").addEventListener("click", () => switchTab("reports"));

        // Export Config button
        const exportBtn = document.getElementById("btn-export-progress-json");
        if (exportBtn) {
            exportBtn.addEventListener("click", exportProgressState);
        }

        // Candidate select dropdown changed
        document.getElementById("active-candidate-select").addEventListener("change", (e) => {
            state.activeCandidateId = e.target.value;
            saveState();
            calculateMetrics();
            renderBoard();
        });

        // Add candidate profile modal triggers
        document.getElementById("add-candidate-trigger").addEventListener("click", () => {
            if (loggedUser.role === "student") return;
            document.getElementById("candidate-modal").style.display = "flex";
        });
        
        document.getElementById("modal-candidate-close").addEventListener("click", () => {
            document.getElementById("candidate-modal").style.display = "none";
        });
        
        document.getElementById("modal-candidate-cancel").addEventListener("click", () => {
            document.getElementById("candidate-modal").style.display = "none";
        });

        document.getElementById("modal-candidate-save").addEventListener("click", () => {
            const name = document.getElementById("new-candidate-name").value.trim();
            const password = document.getElementById("new-candidate-password").value.trim();
            
            if (name && password && loggedUser.role !== "student") {
                const id = `cand-${name.toLowerCase().replace(/\s+/g, "-")}`;
                
                const newCand = { id: id, name: name, password: password, tasks: {} };
                for (let d = 1; d <= 45; d++) {
                    const plan = getSyllabusPlan(d);
                    newCand.tasks[`day-${d}`] = {
                        id: `day-${d}`, day: d, title: `Day ${pad2(d)}: ${plan.topic}`,
                        phase: plan.phase, description: plan.theory, challenge: plan.lab,
                        status: "To Do", grade: "Pending", notes: "", isBlocker: false
                    };
                }

                state.candidates.push(newCand);
                state.activeCandidateId = id;
                saveState();
                
                populateCandidateDropdown();
                calculateMetrics();
                renderBoard();
                renderReportsTable();
                
                document.getElementById("new-candidate-name").value = "";
                document.getElementById("new-candidate-password").value = "";
                document.getElementById("candidate-modal").style.display = "none";
            }
        });

        // Add custom task triggers
        document.getElementById("add-task-trigger").addEventListener("click", () => {
            if (loggedUser.role === "student") return;
            const cand = getActiveCandidate();
            if (!cand) return;

            const nextDay = Object.values(cand.tasks).length + 1;
            const newTaskId = `day-${nextDay}`;
            
            cand.tasks[newTaskId] = {
                id: newTaskId, day: nextDay, title: `Task ${pad2(nextDay)}: Custom Track`,
                phase: "Custom Task", description: "Describe custom assignment details.",
                challenge: "Describe testing expectations.", status: "To Do",
                grade: "Pending", notes: "", isBlocker: false
            };

            saveState();
            renderBoard();
            calculateMetrics();
            openTaskModal(cand.tasks[newTaskId]);
        });

        // Modal triggers
        document.getElementById("modal-task-close").addEventListener("click", closeTaskModal);
        document.getElementById("modal-task-cancel").addEventListener("click", closeTaskModal);
        document.getElementById("modal-task-save").addEventListener("click", saveTaskModalChanges);
        document.getElementById("modal-task-delete").addEventListener("click", deleteActiveTask);

        // Wiki triggers
        document.getElementById("add-wiki-trigger").addEventListener("click", () => {
            document.getElementById("wiki-modal").style.display = "flex";
        });
        document.getElementById("modal-wiki-close").addEventListener("click", () => {
            document.getElementById("wiki-modal").style.display = "none";
        });
        document.getElementById("modal-wiki-cancel").addEventListener("click", () => {
            document.getElementById("wiki-modal").style.display = "none";
        });

        document.getElementById("modal-wiki-save").addEventListener("click", () => {
            const title = document.getElementById("new-wiki-title").value.trim();
            const phase = document.getElementById("new-wiki-phase").value;
            const content = document.getElementById("new-wiki-content").value.trim();

            if (title && content) {
                const id = `wiki-${Date.now()}`;
                const newPage = {
                    id: id, title: title, phase: phase, content: content,
                    author: loggedUser.role === "mentor" ? "Mentor" : getActiveCandidate().name.split(" ")[0],
                    date: new Date().toISOString().split("T")[0]
                };

                wikiPages.push(newPage);
                saveWiki();
                activeWikiPageId = id;
                
                renderWikiTree();
                renderActiveWikiPage();
                
                document.getElementById("new-wiki-title").value = "";
                document.getElementById("new-wiki-content").value = "";
                document.getElementById("wiki-modal").style.display = "none";
            }
        });

        // Login UI events
        document.getElementById("login-role").addEventListener("change", (e) => {
            const isMentor = e.target.value === "mentor";
            document.getElementById("login-student-group").style.display = isMentor ? "none" : "block";
            
            const label = document.getElementById("login-passcode-label");
            const input = document.getElementById("login-passcode");
            if (label && input) {
                if (isMentor) {
                    label.textContent = "Enter Mentor Passcode";
                    input.placeholder = "Enter 'mentor123' to audit...";
                } else {
                    label.textContent = "Enter Candidate Password";
                    input.placeholder = "Enter password (e.g. siva123)...";
                }
            }
            if (input) input.value = "";
            document.getElementById("login-error-msg").style.display = "none";
        });

        document.getElementById("login-submit-btn").addEventListener("click", verifyLogin);
        document.getElementById("user-logout-btn").addEventListener("click", handleLogout);
        
        // Enter key submits passcode
        document.getElementById("login-passcode").addEventListener("keypress", (e) => {
            if (e.key === "Enter") verifyLogin();
        });
    }

    async function init() {
        await loadState();
        loadWiki();
        
        setupEventListeners();
        
        // Check session storage for existing role
        const cachedRole = sessionStorage.getItem("minux_logged_role");
        const cachedStudent = sessionStorage.getItem("minux_logged_studentid");
        
        if (cachedRole) {
            loggedUser.role = cachedRole;
            loggedUser.studentId = cachedStudent;
            
            if (cachedRole === "student" && cachedStudent) {
                state.activeCandidateId = cachedStudent;
                saveState();
            }
            
            document.getElementById("login-gateway").style.display = "none";
            applyGatedPermissions();
        } else {
            // Display Login Gateway Fullscreen
            document.getElementById("login-gateway").style.display = "flex";
            populateLoginCandidateDropdown();

            // Enforce student role default states for password input group
            document.getElementById("login-passcode-group").style.display = "block";
            const label = document.getElementById("login-passcode-label");
            const input = document.getElementById("login-passcode");
            if (label && input) {
                label.textContent = "Enter Candidate Password";
                input.placeholder = "Enter password (e.g. siva123)...";
            }
        }
    }

    window.addEventListener("DOMContentLoaded", init);

})();
