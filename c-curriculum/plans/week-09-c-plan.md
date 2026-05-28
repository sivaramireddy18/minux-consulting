# Week 09: Preprocessor Metaprogramming

## 🎯 Weekly Goal
Master the mechanics of the C preprocessor, learn how to write robust, side-effect-free macros, utilize stringification and token pasting, and deploy the powerful **X-Macro** design pattern to automate generic code generation.

## 🎓 Weekly Outcome
By the end of this week, you will be able to write safe compile-time macros, stringify variables, paste tokens dynamically, generate custom data structures automatically from lists, and eliminate redundant boilerplate code in C.

---

## 📅 Session Breakdown

### Monday: Preprocessor Mechanics & Macro Safety
* **Conceptual Focus:** The preprocessor as a pure text replacer.
  * Why macros do not understand type checks or block scope rules.
  * **Macro Side-Effects Hazard:** Double evaluation of parameters.
  * **Rule of Parentheses:** Always wrap macro parameters and the entire macro expression in parentheses to prevent operator precedence bugs.
  * Wrapping multi-statement macros in `do { ... } while(0)` blocks.
* **Hands-on Experiment:**
  Identify and fix the double-evaluation macro bug:
  ```c
  #include <stdio.h>
  
  // UNSAFE: If passed expression contains increments, they execute twice!
  #define SQUARE_UNSAFE(x) ((x) * (x))
  
  // SAFE: Type-checked or side-effect free evaluations are preferred
  inline int square_safe(int x) {
      return x * x;
  }
  
  int main(void) {
      int a = 3;
      int result = SQUARE_UNSAFE(a++); // a incremented twice!
      printf("Unsafe result: %d, a: %d (Expected a to be 4, but got 5!)\n", result, a);
      return 0;
  }
  ```

---

### Tuesday: Stringification (`#`) & Token Pasting (`##`)
* **Conceptual Focus:** Code generation at compile-time.
  * **Stringification Operator (`#`):** Converts a macro parameter into a literal string.
  * **Token Pasting Operator (`##`):** Glues two separate tokens together to create a new C symbol name dynamically.
* **Hands-on Exercise:**
  Build a dynamic variable factory generator using token pasting:
  ```c
  #include <stdio.h>
  
  // Generate declarations like: int val_1 = 10;
  #define MAKE_VAR(name, id) int name##_##id = id * 10
  
  // Stringify variables to print their names
  #define PRINT_VAR(var) printf("Variable " #var " value: %d\n", var)
  
  int main(void) {
      MAKE_VAR(val, 5); // Decays to: int val_5 = 50;
      PRINT_VAR(val_5);
      return 0;
  }
  ```

---

### Wednesday: Introduction to X-Macros
* **Conceptual Focus:** The master pattern for lists alignment.
  * **The Problem:** In C, adding a new configuration element (e.g. a new error code or state) requires updating multiple files: an `enum`, a string list, a switch case, etc. If you forget one, your code breaks.
  * **The Solution (X-Macros):** Define your list *once* in a macro table, and use it repeatedly to generate enumerations, structure layouts, and string tables automatically.
* **Hands-on Experiment:**
  Map error codes to names automatically using X-Macros:
  ```c
  #include <stdio.h>
  
  // 1. Define the master list containing (Error ID, Error String)
  #define ERROR_TABLE \
      X(ERR_SUCCESS, "Operation completed successfully") \
      X(ERR_NOT_FOUND, "Resource not located") \
      X(ERR_TIMEOUT, "Resource request expired") \
      X(ERR_IO, "Disk hardware error occurred")
  
  // 2. Generate the enumeration automatically
  typedef enum {
  #define X(id, desc) id,
      ERROR_TABLE
  #undef X
  } ErrorCode;
  
  // 3. Generate the string description table automatically
  const char *get_error_string(ErrorCode code) {
      switch (code) {
  #define X(id, desc) case id: return desc;
          ERROR_TABLE
  #undef X
          default: return "Unknown error code";
      }
  }
  
  int main(void) {
      ErrorCode err = ERR_TIMEOUT;
      printf("Status: %s\n", get_error_string(err));
      return 0;
  }
  ```

---

### Thursday: Metaprogramming Data Structures
* **Conceptual Focus:** Generic list structures generation.
  * Using X-Macros to define and populate structures and initialize arrays cleanly.

---

### Friday: Metaprogramming Debugging Tools
* **Conceptual Focus:** Using compiler preprocessor dumps (`gcc -E`) to trace macro expansions and debug syntax errors.

---

## 🛠️ Hands-On Assignment: Generic Key-Value Map Generator
Design and implement a generic Key-Value Map data structure generator using **X-Macros** that automatically declares custom type-safe map structures.

### 1. Requirements
* Define a master map list mapping variable types (e.g. `IntMap`, `FloatMap`).
* Use X-Macros to generate:
  * The structure definitions containing key and value arrays.
  * Type-safe access functions: `int_map_put()`, `int_map_get()`, `float_map_put()`, etc.
* The generated access functions must enforce bounds checks defensively.

### 2. File Deliverables
* `map_gen.h`: Master X-Macro list and generator expansions.
* `main.c`: Unit tests registering and accessing maps dynamically.

---

## 📋 Deliverables Checklist
- [ ] `map_gen.h` (Strict macro formatting, zero warnings expansions)
- [ ] `main.c` (Complete test runner asserting key retrieval)
- [ ] `Makefile` (Strict C11 compiler setup)

---

## ❓ Self-Check Questions
1. Why are preprocessor macros considered "untyped," and how does this create subtle bugs in calculations?
2. What is the syntax difference and functional difference between `#` and `##` operators in C?
3. How do X-Macros resolve the "Synchronization Problem" when aligning lists (like enums and string lookups)?
4. Why is it standard practice to wrap multi-line macro instructions inside `do { ... } while(0)` blocks?
5. How can you inspect the preprocessor output of your compiler using a terminal command?

---

## 🚀 Stretch Task
Modify your X-Macro map generator to support **JSON serialization**. Expand your macro definitions so that calling `serialize_map_to_json()` automatically outputs a fully formatted JSON string containing all active key-value pairs in the structure, mapped to their correct type structures.

---

## 💡 Motivation Checkpoint
Compilers, database systems, and game engines use X-Macros to map massive registers lists, SQL tokens, or physics properties automatically. For example, game engines use X-Macros to automatically parse and link physical assets properties tables, keeping code updates safe and synchronized across complex structures.

---

## 🎓 Trainer Review Rules
* Verify expansion: The C code must compile cleanly. Run your preprocessor `gcc -E` and inspect the generated files to ensure zero redundant whitespace or empty statements are generated.
* Access functions must be completely type-safe: compiling code that passes incorrect argument types must fail immediately at compile-time.
