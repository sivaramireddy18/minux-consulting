# Week 11: Multi-Threading, Race Conditions, & Atomic Safety

## 🎯 Weekly Goal
Master concurrent programming in C using POSIX threads (`pthreads`), understand the hazards of race conditions, deploy synchronization primitives (mutexes, semaphores, cond variables) cleanly, and explore basic lock-free atomic structures.

## 🎓 Weekly Outcome
By the end of this week, you will be able to spawn and join concurrent POSIX threads, protect shared memory blocks using mutex locks, coordinate threads using condition variables, diagnose multi-threaded bugs using Valgrind's Helgrind and DRD tools, and explain CPU cache alignment hazards.

---

## 📅 Session Breakdown

### Monday: Introduction to POSIX Threads (`pthreads`)
* **Conceptual Focus:** The thread execution model.
  * Difference between processes (separate virtual memory spaces) and threads (shared virtual memory space within a single process).
  * Spawning and joining threads using:
    * `pthread_create`: Launches a thread executing a specific function pointer.
    * `pthread_join`: Blocks calling thread until the target thread terminates.
    * `pthread_exit`: Terminates the calling thread.
* **Hands-on Experiment:**
  Spawn 4 parallel threads that print their unique numeric identifiers:
  ```c
  #include <stdio.h>
  #include <pthread.h>
  
  void *thread_routine(void *arg) {
      int id = *(int *)arg;
      printf("Thread %d running in parallel.\n", id);
      return NULL;
  }
  
  int main(void) {
      pthread_t threads[4];
      int ids[4] = {0, 1, 2, 3};
      
      for (int i = 0; i < 4; i++) {
          pthread_create(&threads[i], NULL, thread_routine, &ids[i]);
      }
      for (int i = 0; i < 4; i++) {
          pthread_join(threads[i], NULL);
      }
      return 0;
  }
  ```

---

### Tuesday: Race Conditions & Shared State Hazards
* **Conceptual Focus:** The synchronization nightmare.
  * **Race Condition:** Occurs when multiple threads read and write to the same memory location concurrently, and the final value depends on the non-deterministic scheduling of the threads.
  * Why operation increments (`x++`) are not atomic (they require: read, modify, write CPU cycles).
* **Hands-on Experiment:**
  Demonstrate a data race by incrementing a counter in parallel without locks:
  ```c
  #include <stdio.h>
  #include <pthread.h>
  
  long long counter = 0;
  
  void *increment_routine(void *arg) {
      (void)arg;
      for (int i = 0; i < 100000; i++) {
          counter++; // Unsafe data race!
      }
      return NULL;
  }
  
  int main(void) {
      pthread_t t1, t2;
      pthread_create(&t1, NULL, increment_routine, NULL);
      pthread_create(&t2, NULL, increment_routine, NULL);
      pthread_join(t1, NULL);
      pthread_join(t2, NULL);
      printf("Counter value: %lld (Expected: 200000, Actual: Less due to data races)\n", counter);
      return 0;
  }
  ```

---

### Wednesday: Thread Synchronization Primitives
* **Conceptual Focus:** Restricting access to critical sections.
  * **Mutex (Mutual Exclusion):** A lock that ensures only one thread can access a critical block at a time.
  * **Condition Variable:** Allows threads to suspend execution and go to sleep until notified by another thread that a condition has been met (prevents CPU-burning busy-waiting loops).
* **Hands-on Exercise:**
  Harden your Tuesday increment routine using `pthread_mutex_t` locks.

---

### Thursday: Thread Analysis Tools (Helgrind & DRD)
* **Conceptual Focus:** Dynamic thread safety validation.
  * Concurrent bugs are notoriously hard to debug because they are non-deterministic (they might only crash once in a million runs).
  * Using Valgrind **Helgrind** and **DRD** to dynamically analyze compiled binaries and pinpoint precise lock ordering violations and data races.
* **Hands-on Exercise:** Run your binaries under Valgrind's Helgrind:
  ```bash
  valgrind --tool=helgrind ./concurrent_app
  ```

---

### Friday: Atomic Operations & Lock-Free Basics
* **Conceptual Focus:** Eliminating mutex overhead.
  * Understanding how mutexes force heavy kernel thread suspends.
  * CPU **Atomic Instructions** (Compare-and-Swap).
  * Introduction to C11 atomic types (`stdatomic.h`).

---

## 🛠️ Hands-On Assignment: Thread-Safe Task Pool Executor
Design and build a high-performance, thread-safe **Task Pool Executor** that schedules and processes custom work functions across multiple parallel worker threads.

### 1. Requirements
* Define a `ThreadPool` struct that contains: An array of worker threads, a task queue, a queue mutex, and queue condition variables.
* Implement:
  * `int threadpool_init(ThreadPool *tp, int num_threads)` (spawns worker loops).
  * `int threadpool_submit(ThreadPool *tp, void (*work)(void *), void *arg)` (adds tasks to queue safely).
  * `void threadpool_destroy(ThreadPool *tp)` (shuts down threads cleanly).
* Worker threads must sleep when the task queue is empty (zero active CPU busy-waiting loops).
* Running code under `valgrind --tool=helgrind` must report **zero data races**.

### 2. File Deliverables
* `threadpool.h`: Struct definitions and task signatures.
* `threadpool.c`: Spawning, queue locks, and thread signaling execution.
* `main.c`: Benchmarks executing heavy parallel tasks.

---

## 📋 Deliverables Checklist
- [ ] `threadpool.h` (Clean synchronization interfaces)
- [ ] `threadpool.c` (Zero race conditions, proper lock cleanups)
- [ ] `main.c` (Benchmark scenarios)
- [ ] `Makefile` (Linked against `-pthread` compiler flag)

---

## ❓ Self-Check Questions
1. Why do processes have isolated memory maps while threads share memory context spaces?
2. What are the three mechanical CPU operations executed during a standard C variable increment (`x++`)?
3. How does a Condition Variable prevent a thread from burning CPU cycles while waiting for task queues?
4. What does the term "Deadlock" mean, and what is the rule of Lock Ordering to prevent it?
5. How can you detect data races dynamically using Valgrind's Helgrind tool?

---

## 🚀 Stretch Task
Modify your Thread Pool to support a **Dynamic Thread Count Scaling**. Expand your executor so that it monitors active queue length. If queue size surges past a threshold, spawn new auxiliary threads dynamically; if queue loads fall, scale the thread count back down cleanly.

---

## 💡 Motivation Checkpoint
Concurrent multi-threading is the standard for high-performance servers, operating systems, and database systems. Modern web servers (like Nginx) and database frameworks schedule and execute millions of queries concurrently. Writing flawless, lock-disciplined code separates senior systems engineers from application programmers.

---

## 🎓 Trainer Review Rules
* Verify race conditions: Execution under `valgrind --tool=helgrind` must complete with zero conflict alerts.
* Worker threads must cleanly terminate and join upon calling `threadpool_destroy()`. Any lingering orphan threads or memory leaks trigger a grade of 0.
