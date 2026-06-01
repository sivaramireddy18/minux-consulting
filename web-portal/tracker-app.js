// tracker-app.js - Standalone Candidate Vetting Hub Controller (Jira + Confluence UI)
// Fully client-side state machine with LocalStorage persistence and dynamic grading calculations

(function() {
    'use strict';

    // -------------------------------------------------------------
    // 45-Day Systems Curriculum Database (Confluence Seed Data)
    // -------------------------------------------------------------
    const SYLLABUS_DB = {
        1: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "The Preprocessor Pipeline and Macro Expansion Hazards",
            theory: "Deep-dive into the C Preprocessor (cpp). Understand header file inclusion (#include), conditional compilation (#ifdef, #if defined), and macro expansions. Study macro hazards such as side-effects, double evaluations, and operator precedence issues. Learn how compiler flags like '-E' produce intermediate '.i' files containing expanded text before tokenization.",
            lab: "Write a complex nested macro system that calculates the square of a number and absolute values. Create a source file main.c, run it through the preprocessor using 'gcc -E' and inspect the generated '.i' file. Identify where the macro expansions occur and explain why double evaluation of side-effect expressions (e.g., ++x) leads to logical corruption.",
            code: `// Unsafe vs Safe Macro Evaluation Demo
#define SQUARE_UNSAFE(x) ((x) * (x))

static inline int square_safe(int x) {
    return x * x;
}

// SQUARE_UNSAFE(++val) expands to ((++val) * (++val)) -> UNDEFINED!`,
            validation: "Compile with 'gcc -std=c11 -Wall -Wextra -Werror -O0'. Run 'gcc -E main.c' and verify that the preprocessor expands SQUARE_UNSAFE(++val) directly in the source text, while square_safe remains a standard function call boundary."
        },
        2: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "Compilation to Assembly and GDB Register Analysis",
            theory: "Analyze how the compiler translates preprocessed intermediate C code into assembly instructions specific to the target CPU architecture. Study ARMv7-M / x86-64 register structures, instruction sizing, and the translation of loops and branching statements into conditional branches. Master GDB commands for register inspection.",
            lab: "Write a C function containing a nested loop and conditional branch. Compile the code to raw assembly using the '-S' flag. Inspect the assembly output to trace label naming conventions. Load the executable under GDB, set breakpoints, step instruction-by-instruction ('si'), and print register contents to see loops incrementing registers directly.",
            code: `// Factorial sum to analyze registers usage in GDB
uint32_t compute_factorial_sum(uint32_t limit) {
    uint32_t total = 0;
    for (uint32_t i = 1; i <= limit; ++i) {
        uint32_t fact = 1;
        for (uint32_t j = 1; j <= i; ++j) {
            fact *= j;
        }
        total += fact;
    }
    return total;
}`,
            validation: "Compile with 'gcc -S -g -O0 factorial.c'. Load factorial.o into GDB. Run 'layout asm' and 'info registers' to physically observe register status updates (e.g. EAX/RAX changes) during execution steps."
        },
        3: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "Relocatable Object Files Dissection and Symbol Resolution",
            theory: "Explore relocatable object files (.o) and ELF segment architecture. Map the physical layout of standard sections: .text (machine code), .data (initialized global/static variables), .bss (uninitialized variables zeroed out at startup), and .rodata (read-only constants). Understand symbol tables and states (Text 'T', Data 'D', BSS 'B', Undefined 'U').",
            lab: "Write a C file defining variables in each of these sections. Compile to an object file using the '-c' flag. Use 'nm', 'objdump', and 'readelf' to dissect the symbols and sections. Confirm that global variables mapped to appropriate segments and trace dynamic relocations.",
            code: `// Variables mapping directly to distinct ELF segments
uint32_t active_state_flag = 0xDEADC0DEU;   // Allocated in .data
uint32_t sensor_telemetry_buffer[100];       // Allocated in .bss
const char device_serial_number[] = "SN-01"; // Allocated in .rodata`,
            validation: "Run 'nm -S -S symbol_test.o' and 'objdump -h symbol_test.o'. Verify that active_state_flag is in the 'D' (data) section, sensor_telemetry_buffer is in the 'B' (bss) section, and device_serial_number is in the 'R' (rodata) section."
        },
        4: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "Linking Mechanics, Static/Dynamic Libraries, and Symbol Collisions",
            theory: "Explore the linking phase (ld). Learn how multiple object files are combined into a single executable, how references to external symbols are resolved, and how static (.a) and shared/dynamic (.so) libraries differ. Study symbol resolution rules (strong vs weak symbols) and the danger of silent symbol collisions.",
            lab: "Create two separate C files that define the same global variable name (one initialized, one uninitialized). Attempt to link them and observe the linker warning/error. Create a static library and a dynamic library, compile a main driver, and inspect the runtime load paths (LD_LIBRARY_PATH and rpath).",
            code: `// Compile dynamic library:
// gcc -fPIC -shared math_ops.c -o libmathops.so
// Link application against shared library:
// gcc main.o -L. -lmathops -o linked_app -Wl,-rpath,.`,
            validation: "Compile dynamic library using '-fPIC -shared'. Link application with '-Wl,-rpath,.'. Run 'ldd linked_app' to verify the runtime link dependency is successfully resolved to libmathops.so."
        },
        5: {
            phase: "Phase 1: Compiler & Toolchains",
            topic: "GNU Make, Implicit Dependencies, and Incremental Builds",
            theory: "Understand the architecture of GNU Make. Learn rule structures (targets, prerequisites, recipes). Study Makefile variables, automatic variables ($@, $<, $^), pattern matching, and implicit rules. Master header dependency tracking using gcc options (-MMD, -MP) to ensure incremental builds compile safely when headers change.",
            lab: "Write a professional, production-grade Makefile for a multi-file C project. Configure compiler flags, directory clean targets, and automatic header file dependency generation. Touch a header file and verify that only the affected files recompile, leaving unmodified objects intact.",
            code: `# Makefile with automatic MMD dependency tracking
CC = gcc
CFLAGS = -std=c11 -Wall -Wextra -Werror -pedantic -g3 -O2 -MMD -MP
SRCS = $(wildcard *.c)
OBJS = $(SRCS:.c=.o)
DEPS = $(OBJS:.o=.d)

-include $(DEPS)`,
            validation: "Create a test project with main.c and utils.h. Compile using 'make'. Change a comment inside 'utils.h', run 'make' again, and verify that only objects depending on 'utils.h' are recompiled."
        },
        // Remaining Day mapping summaries generated for rendering dynamically...
        21: {
            phase: "Phase 5: Structures & Alignments",
            topic: "Structure Memory Layouts, Compiler Padding, and Offset Tracing",
            theory: "Study structure layouts in memory. To optimize memory bus transfers, compilers insert silent padding bytes into structures so that individual members are aligned with their native byte sizes (e.g. 4-byte boundaries for int, 2-byte for short). Learn how struct member ordering affects total structural footprint.",
            lab: "Define structures containing members of mixed sizes in different declarations. Calculate the size of each structure using 'sizeof' and identify the offsets of each member using the 'offsetof' macro. Optimize the structure footprint by reordering elements from largest to smallest.",
            code: `struct Unoptimized {
    uint8_t a;  // Offset 0 (3 bytes padding)
    uint32_t b; // Offset 4
    uint8_t c;  // Offset 8 (3 bytes padding)
}; // sizeof = 12 bytes

struct Optimized {
    uint32_t b; // Offset 0
    uint8_t a;  // Offset 4
    uint8_t c;  // Offset 5 (2 bytes padding)
}; // sizeof = 8 bytes`,
            validation: "Compile and execute. Verify the unoptimized size is 12 bytes and optimized size is 8 bytes, demonstrating effective padding reduction through ordering."
        },
        27: {
            phase: "Phase 6: Custom Allocators",
            topic: "Custom Memory Arenas and Alignment Boundaries",
            theory: "Understand the concept of a Memory Arena (or linear/bump allocator). Arena allocators speed up performance by allocating a single large buffer upfront and serving dynamic requests by bumping an offset index. Memory release is executed en-masse by clearing the entire arena. Learn how to enforce alignment on all sub-allocations.",
            lab: "Design and implement a complete, robust, type-aligned Memory Arena in C. The arena must take a statically allocated buffer and support variable-sized allocation requests. Ensure that the returned addresses are always aligned to 8-byte boundaries.",
            code: `typedef struct {
    uint8_t *buffer;
    size_t capacity;
    size_t offset;
} arena_t;

void *arena_alloc(arena_t *arena, size_t size, size_t alignment) {
    size_t current_addr = (size_t)(arena->buffer + arena->offset);
    size_t aligned_addr = (current_addr + (alignment - 1)) & ~(alignment - 1);
    size_t new_offset = aligned_addr - (size_t)arena->buffer;
    if (new_offset + size > arena->capacity) return NULL;
    arena->offset = new_offset + size;
    return (void *)aligned_addr;
}`,
            validation: "Write a test suite allocating various objects (e.g. chars, ints, structs) in sequence. Assert that every returned address is perfectly aligned to the requested size (e.g. multiple of 4 or 8) and fits within bounds."
        },
        28: {
            phase: "Phase 6: Custom Allocators",
            topic: "Fixed-Size Memory Block Pools",
            theory: "Learn why fixed-size block pool allocators (also called slab allocators) are mandatory in real-time operating systems (RTOS). A block pool partitions a raw buffer into equal-sized blocks linked together in a list. Allocation and deallocation are deterministic O(1) operations, introducing zero fragmentation.",
            lab: "Write a deterministic Fixed-Size Memory Pool allocator. Implement an initialization function, an allocation function (taking a block from the free list), and a free function (returning the block). Run tests to verify consistent execution latency.",
            code: `typedef struct block_node {
    struct block_node *next;
} block_node_t;

typedef struct {
    uint8_t *pool_buffer;
    size_t block_size;
    block_node_t *free_list;
} mem_pool_t;

void *mem_pool_alloc(mem_pool_t *pool) {
    if (pool->free_list == NULL) return NULL;
    block_node_t *node = pool->free_list;
    pool->free_list = node->next;
    return (void *)node;
}`,
            validation: "Write a test harness allocating and freeing blocks. Confirm that the memory pool handles exhaustions, deallocations restore pool capacity, and allocation execution takes constant time."
        },
        44: {
            phase: "Phase 9: Concurrency & MISRA C",
            topic: "MISRA C:2012 Guidelines and Critical Safety Constraints",
            theory: "Study the industrial Motor Industry Software Reliability Association (MISRA C:2012) standard guidelines for safety-critical systems. Explore critical rules: avoiding dynamic allocations after startup, eliminating undefined behaviors (e.g. pointer conversions), prohibiting multiple function exits, and restricting preprocessor usages.",
            lab: "Create a C library containing common violations of MISRA standards (like raw type casts, multi-return functions, pointer address arithmetic). Use static analyzers like 'cppcheck' or 'clang-tidy' to audit and rewrite the code to conform to 100% compliance.",
            code: `// VIOLATION: raw pointer arithmetic & multiple exit points
int32_t unsafe_search(const int32_t *arr, size_t size, int32_t val) {
    for (size_t i = 0; i < size; ++i) {
        if (*(arr + i) == val) return (int32_t)i;
    }
    return -1;
}

// COMPLIANT: Array indexing and single return exit
int32_t compliant_search(const int32_t arr[], size_t size, int32_t val) {
    int32_t found_idx = -1;
    if (arr != NULL) {
        for (size_t i = 0; i < size; ++i) {
            if (arr[i] == val) { found_idx = (int32_t)i; break; }
        }
    }
    return found_idx;
}`,
            validation: "Run 'cppcheck --addon=misra.py compliant_code.c' or use static diagnostic checks. Confirm that compliant code successfully satisfies coding constraints."
        },
        45: {
            phase: "Phase 9: Concurrency & MISRA C",
            topic: "Systems Profiling, Leak Audits, and Graduate Code Review",
            theory: "Explore advanced systems performance optimization pipelines. Understand how CPU cache misses and memory leakages degrade real-time embedded environments. Study validation tools: Valgrind (memory tracking), Gprof (execution cycle timing), and Perf (hardware counter monitoring).",
            lab: "Write an application that contains intentional memory leaks and high CPU utilization. Run the application through Valgrind to identify leaks and run under Gprof to pinpoint exactly which functions consume the most execution cycles. Optimize the hot-paths.",
            code: `// Compile with profiling enabled: gcc -pg final_profile.c -o final_profile
// Execute binary to generate stats: ./final_profile
// Audit CPU timings: gprof ./final_profile gmon.out
// Audit memory leakages: valgrind --leak-check=full ./final_profile`,
            validation: "Compile using 'gcc -pg final_profile.c -o final_profile'. Run code, then execute 'gprof ./final_profile gmon.out' to view the cycle profile. Run under 'valgrind --leak-check=full ./final_profile' to verify the leaked_buffer trap."
        }
    };

    // Generic metadata mapping helper for the remaining days
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

    function getSyllabusPlan(day) {
        if (SYLLABUS_DB[day]) {
            return SYLLABUS_DB[day];
        }
        
        // Dynamic generation for missing days to save space while providing rich specs
        const phaseInfo = PHASE_MAPPING.find(pm => day >= pm.days[0] && day <= pm.days[1]);
        const phaseName = phaseInfo ? phaseInfo.name : "Systems Milestone Core";
        
        let topic = "C Systems Programming Deep-Dive";
        let theory = "Deep-dive systems analysis focusing on memory management, pointer scaling arithmetic, or raw hardware architectures.";
        let lab = "Configure your local compiler and static analysis tools. Audit and verify compilation boundaries under strict compiler flags.";
        let code = `// C Systems Core Vetting Challenge\n#include <stdint.h>\n\nvoid init_register(void) {\n    volatile uint32_t *reg = (volatile uint32_t *)0x20001000U;\n    *reg = 0xAA;\n}`;
        let validation = "Compile, execute, step through with GDB, and inspect raw output registers.";

        if (day === 6) {
            topic = "Two's Complement bit representations and conversions";
            theory = "Study the physical logic of signed numbers. Master sign extension and arithmetic shifts.";
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
            theory = "Audit registers R0-R3 parameter passing conventions and callee-saved scratch mappings.";
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
            code = `#define ERROR_MAP \\ \n   X(ERR_OK, "Success") \\ \n   X(ERR_TIMEOUT, "Timeout")\n\ntypedef enum { #define X(a,b) a, ERROR_MAP #undef X } err_t;`;
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

    // Seed state if localStorage is empty
    function seedInitialState() {
        log_info("Seeding clean standalone C Vetting Hub candidate database...");
        
        const candidate1 = {
            id: "cand-siva",
            name: "Siva Prasad",
            tasks: {}
        };
        
        const candidate2 = {
            id: "cand-ram",
            name: "Ram Kumar",
            tasks: {}
        };

        // Initialize 45 daily tasks for each candidate
        [candidate1, candidate2].forEach(cand => {
            for (let d = 1; d <= 45; d++) {
                const plan = getSyllabusPlan(d);
                cand.tasks[`day-${d}`] = {
                    id: `day-${d}`,
                    day: d,
                    title: `Day ${d:02d}: ${plan.topic}`,
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

        // Seed Confluence wiki retrospectives
        wikiPages = [
            {
                id: "wiki-intro",
                title: "Vetting Methodology & Operating Laws",
                phase: "Phase 1: Compiler & Toolchains",
                content: "All candidates must be audited daily under strict compiler flags. A single warning (e.g. uninitialized variable) aborts the grading gate and results in a dynamic 'F' grade until resolved under GDB. Memory tracking checks are executed under Valgrind.",
                author: "Principal Architect",
                date: "2026-05-30"
            }
        ];
        saveWiki();
    }

    function saveState() {
        localStorage.setItem("minux_candidate_state", JSON.stringify(state));
    }

    function loadState() {
        const data = localStorage.getItem("minux_candidate_state");
        if (data) {
            state = JSON.parse(data);
        } else {
            seedInitialState();
        }
    }

    function saveWiki() {
        localStorage.setItem("minux_wiki_pages", JSON.stringify(wikiPages));
    }

    function loadWiki() {
        const data = localStorage.getItem("minux_wiki_pages");
        if (data) {
            wikiPages = JSON.parse(data);
        }
    }

    // -------------------------------------------------------------
    // Vetting GPA and metrics calculations
    // -------------------------------------------------------------
    function getActiveCandidate() {
        return state.candidates.find(c => c.id === state.activeCandidateId) || state.candidates[0];
    }

    function calculateMetrics() {
        const cand = getActiveCandidate();
        if (!cand) return;

        const tasks = Object.values(cand.tasks);
        const total = tasks.length;
        
        const completed = tasks.filter(t => t.status === "Completed").length;
        const progressPercent = Math.round((completed / total) * 100);
        
        let blockerCount = tasks.filter(t => t.isBlocker).length;

        // Calculate GPA based on graded items (excluding Pending items)
        const gradeScale = {
            "A+ [100%]": 100,
            "A [90%]": 90,
            "B [80%]": 80,
            "C [70%]": 70,
            "F [Fail]": 0
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

        // Update DOM elements
        document.getElementById("kpi-candidate-name").textContent = cand.name;
        document.getElementById("kpi-progress-ratio").textContent = `${completed} / ${total} Days`;
        document.getElementById("kpi-progress-bar").style.width = `${progressPercent}%`;
        document.getElementById("kpi-gpa").textContent = gpa;
        document.getElementById("kpi-blockers").textContent = blockerCount;
        
        // Trigger blinking warning shadow if blockers present
        const blockersCard = document.getElementById("kpi-blockers").closest('.kpi-card');
        if (blockerCount > 0) {
            blockersCard.style.boxShadow = "0 0 15px rgba(236, 72, 153, 0.4)";
        } else {
            blockersCard.style.boxShadow = "none";
        }
    }

    // -------------------------------------------------------------
    // Kanban Board Render Engine
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

        // Clear previous card elements
        Object.values(columns).forEach(col => col.innerHTML = "");

        const taskCounts = { "To Do": 0, "In Progress": 0, "Under Review": 0, "Completed": 0 };

        const tasks = Object.values(cand.tasks).sort((a, b) => a.day - b.day);

        tasks.forEach(task => {
            const card = document.createElement("div");
            card.className = `task-card ${task.isBlocker ? "blocker" : ""}`;
            card.draggable = true;
            card.id = `card-${task.id}`;
            card.dataset.taskId = task.id;
            
            // Inner Card HTML Template
            card.innerHTML = `
                <div class="card-key">C-FAST-${task.day:02d}</div>
                <div class="card-title">${task.title}</div>
                <div class="card-footer">
                    <span style="color: var(--text-muted);">Assignee: ${cand.name.split(" ")[0]}</span>
                    <span class="card-grade ${task.grade === 'Pending' ? 'grade-pending' : (task.grade === 'F [Fail]' ? 'grade-fail' : '')}">${task.grade.split(" ")[0]}</span>
                </div>
            `;

            // HTML5 Drag and Drop events
            card.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", task.id);
                card.style.opacity = "0.5";
            });

            card.addEventListener("dragend", () => {
                card.style.opacity = "1";
            });

            // Double click opens editing details modal
            card.addEventListener("dblclick", () => {
                openTaskModal(task);
            });

            if (columns[task.status]) {
                columns[task.status].appendChild(card);
                taskCounts[task.status]++;
            }
        });

        // Update column tallies
        document.getElementById("count-todo").textContent = taskCounts["To Do"];
        document.getElementById("count-progress").textContent = taskCounts["In Progress"];
        document.getElementById("count-review").textContent = taskCounts["Under Review"];
        document.getElementById("count-completed").textContent = taskCounts["Completed"];
    }

    // Drag-over column listeners
    function setupDragAndDrop() {
        const columns = document.querySelectorAll(".kanban-column");
        columns.forEach(col => {
            col.addEventListener("dragover", (e) => {
                e.preventDefault();
                col.classList.add("drag-over");
            });

            col.addEventListener("dragleave", () => {
                col.classList.remove("drag-over");
            });

            col.addEventListener("drop", (e) => {
                e.preventDefault();
                col.classList.remove("drag-over");
                
                const taskId = e.dataTransfer.getData("text/plain");
                const newStatus = col.dataset.status;
                
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
            
            // Automatically reset or preset grades on status transition
            if (newStatus === "Completed" && cand.tasks[taskId].grade === "Pending") {
                cand.tasks[taskId].grade = "A+ [100%]";
            } else if (newStatus === "To Do") {
                cand.tasks[taskId].grade = "Pending";
            }
            
            saveState();
            renderBoard();
            calculateMetrics();
        }
    }

    // -------------------------------------------------------------
    // Confluence Wiki Render Engine
    // -------------------------------------------------------------
    let activeWikiPageId = "day-1";

    function renderWikiTree(filterQuery = "") {
        const treeContainer = document.getElementById("wiki-index-tree");
        treeContainer.innerHTML = "";

        const query = filterQuery.toLowerCase();

        // 1. Render core curriculum syllabus phases
        PHASE_MAPPING.forEach(phase => {
            const phaseDiv = document.createElement("div");
            phaseDiv.className = "wiki-phase-group";
            
            const title = document.createElement("div");
            title.className = "wiki-phase-title";
            title.textContent = phase.name.split(":")[0]; // E.g. "Phase 1"
            phaseDiv.appendChild(title);

            let addedDays = 0;
            for (let d = phase.days[0]; d <= phase.days[1]; d++) {
                const plan = getSyllabusPlan(d);
                if (query && !plan.topic.toLowerCase().includes(query) && !plan.theory.toLowerCase().includes(query)) {
                    continue; // Filter results
                }

                const link = document.createElement("a");
                link.href = "#";
                link.className = `wiki-day-link ${activeWikiPageId === `day-${d}` ? 'active' : ''}`;
                link.textContent = `Day ${d:02d}: ${plan.topic.split(" ")[0]}`;
                link.title = `Day ${d:02d}: ${plan.topic}`;
                link.dataset.pageId = `day-${d}`;
                
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    activeWikiPageId = `day-${d}`;
                    renderActiveWikiPage();
                    // Update active highlight classes
                    document.querySelectorAll(".wiki-day-link").forEach(l => l.classList.remove("active"));
                    link.classList.add("active");
                });

                phaseDiv.appendChild(link);
                addedDays++;
            }

            if (addedDays > 0) {
                treeContainer.appendChild(phaseDiv);
            }
        });

        // 2. Render custom Candidate Retrospective Notes
        const customDiv = document.createElement("div");
        customDiv.className = "wiki-phase-group";
        const customTitle = document.createElement("div");
        customTitle.className = "wiki-phase-title";
        customTitle.textContent = "Candidate Logs";
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

        if (addedCustom > 0) {
            treeContainer.appendChild(customDiv);
        }
    }

    function renderActiveWikiPage() {
        const titleEl = document.getElementById("wiki-doc-title");
        const metaEl = document.getElementById("wiki-doc-meta");
        const bodyEl = document.getElementById("wiki-doc-body");

        if (activeWikiPageId.startsWith("day-")) {
            const dayNum = parseInt(activeWikiPageId.split("-")[1]);
            const plan = getSyllabusPlan(dayNum);

            titleEl.textContent = `Day ${dayNum:02d}: ${plan.topic}`;
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
            // Render custom published page
            const page = wikiPages.find(p => p.id === activeWikiPageId);
            if (page) {
                titleEl.textContent = page.title;
                metaEl.innerHTML = `
                    <span>Author: ${page.author}</span>
                    <span>Date: ${page.date} | Space: <strong>${page.phase}</strong></span>
                `;
                bodyEl.innerHTML = `
                    <p style="white-space: pre-wrap;">${page.content}</p>
                `;
            }
        }
    }

    // -------------------------------------------------------------
    // Modal Controller Dialogs
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
        document.getElementById("modal-task-key").textContent = `C-FAST-${task.day:02d} Task Vetting`;

        document.getElementById("task-modal").style.display = "flex";
    }

    function closeTaskModal() {
        document.getElementById("task-modal").style.display = "none";
    }

    function saveTaskModalChanges() {
        const cand = getActiveCandidate();
        const taskId = document.getElementById("modal-task-id").value;

        if (cand && cand.tasks[taskId]) {
            const task = cand.tasks[taskId];
            task.title = document.getElementById("modal-task-title").value;
            task.description = document.getElementById("modal-task-desc").value;
            task.challenge = document.getElementById("modal-task-challenge").value;
            task.status = document.getElementById("modal-task-status").value;
            task.grade = document.getElementById("modal-task-grade").value;
            task.notes = document.getElementById("modal-task-notes").value;
            task.isBlocker = document.getElementById("modal-task-blocker").checked;

            saveState();
            renderBoard();
            calculateMetrics();
            closeTaskModal();
            log_success(`Task C-FAST-${task.day:02d} successfully updated!`);
        }
    }

    function deleteActiveTask() {
        const cand = getActiveCandidate();
        const taskId = document.getElementById("modal-task-id").value;
        
        if (confirm("Are you sure you want to delete this custom task item?")) {
            delete cand.tasks[taskId];
            saveState();
            renderBoard();
            calculateMetrics();
            closeTaskModal();
        }
    }

    // -------------------------------------------------------------
    // Initializers and event triggers
    // -------------------------------------------------------------
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

    function log_info(msg) { console.log(`%c[INFO] ${msg}`, "color: #3b82f6; font-weight: bold;"); }
    function log_success(msg) { console.log(`%c[PASS] ${msg}`, "color: #10b981; font-weight: bold;"); }

    function setupEventListeners() {
        // Active candidate selector changed
        document.getElementById("active-candidate-select").addEventListener("change", (e) => {
            state.activeCandidateId = e.target.value;
            saveState();
            calculateMetrics();
            renderBoard();
        });

        // Add candidate triggers
        document.getElementById("add-candidate-trigger").addEventListener("click", () => {
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
            if (name) {
                const id = `cand-${name.toLowerCase().replace(/\s+/g, "-")}`;
                
                const newCand = {
                    id: id,
                    name: name,
                    tasks: {}
                };

                // Seed with standard 45 days
                for (let d = 1; d <= 45; d++) {
                    const plan = getSyllabusPlan(d);
                    newCand.tasks[`day-${d}`] = {
                        id: `day-${d}`,
                        day: d,
                        title: `Day ${d:02d}: ${plan.topic}`,
                        phase: plan.phase,
                        description: plan.theory,
                        challenge: plan.lab,
                        status: "To Do",
                        grade: "Pending",
                        notes: "",
                        isBlocker: false
                    };
                }

                state.candidates.push(newCand);
                state.activeCandidateId = id;
                saveState();
                
                populateCandidateDropdown();
                calculateMetrics();
                renderBoard();
                
                document.getElementById("new-candidate-name").value = "";
                document.getElementById("candidate-modal").style.display = "none";
                log_success(`Successfully registered new candidate profile: ${name}`);
            }
        });

        // Add Task trigger (Allows custom milestone creation)
        document.getElementById("add-task-trigger").addEventListener("click", () => {
            const cand = getActiveCandidate();
            if (!cand) return;

            const nextDay = Object.values(cand.tasks).length + 1;
            const newTaskId = `day-${nextDay}`;
            
            cand.tasks[newTaskId] = {
                id: newTaskId,
                day: nextDay,
                title: `Task ${nextDay:02d}: Custom Milestone Track`,
                phase: "Candidate Custom Task",
                description: "Describe custom candidate assignment or vetting checklist parameters.",
                challenge: "Describe testing expectations.",
                status: "To Do",
                grade: "Pending",
                notes: "",
                isBlocker: false
            };

            saveState();
            renderBoard();
            calculateMetrics();
            openTaskModal(cand.tasks[newTaskId]);
        });

        // Task modal controls
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
                    id: id,
                    title: title,
                    phase: phase,
                    content: content,
                    author: getActiveCandidate().name.split(" ")[0],
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
                log_success(`Successfully published new Confluence wiki page: ${title}`);
            }
        });

        // Sidebar search logic (Confluence filtering)
        const sidebarSearch = document.createElement("input");
        sidebarSearch.type = "text";
        sidebarSearch.className = "form-input";
        sidebarSearch.placeholder = "🔍 Search specs...";
        sidebarSearch.style.marginBottom = "0.75rem";
        sidebarSearch.style.width = "100%";
        sidebarSearch.style.fontSize = "0.8rem";
        sidebarSearch.style.padding = "0.4rem 0.75rem";

        const wikiTree = document.getElementById("wiki-index-tree");
        wikiTree.parentNode.insertBefore(sidebarSearch, wikiTree);

        sidebarSearch.addEventListener("input", (e) => {
            renderWikiTree(e.target.value);
        });
    }

    // -------------------------------------------------------------
    // Application Bootstrap Launch
    // -------------------------------------------------------------
    function init() {
        log_info("Initializing Standalone Candidate Tracker Engine...");
        loadState();
        loadWiki();
        
        populateCandidateDropdown();
        calculateMetrics();
        renderBoard();
        setupDragAndDrop();
        
        renderWikiTree();
        renderActiveWikiPage();
        
        setupEventListeners();
        log_success("Standalone Candidate Tracker Bootstrapped Successfully!");
    }

    window.addEventListener("DOMContentLoaded", init);

})();
