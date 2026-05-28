# Weekly Execution Plan: Week 17

## 🎯 Weekly Goal
Master multi-threaded concurrent programming using POSIX Threads (`pthread`), configure synchronization primitives (Mutexes, Semaphores, Condition Variables), analyze race conditions, and write highly efficient thread-safe data structures.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Thread-Safe Concurrent FIFO Queue** (Producer-Consumer Queue) in C. They will understand the core differences between processes and threads, thread scheduling, resource sharing, how to prevent deadlocks, and how to coordinate thread tasks using condition variables.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: Processes vs Threads & POSIX Thread Creation
* **Conceptual Objective**: Master the fundamental differences between a process and a thread. A process owns resources (has its own private virtual address space, file descriptor tables, environment). A thread is a lightweight unit of execution running inside a process; all threads of a process share the same text, data, heap, and file descriptors, but possess their own private **stack and register context**.
* **Practical Activity**:
  1. Learn how to create threads using `pthread_create()` and synchronize termination using `pthread_join()`.
  2. Compile multithreaded binaries by linking the POSIX library (`-lpthread`).
* **Code/Circuit Reference**:
```c
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>

void* thread_worker(void *arg) {
    int id = *(int*)arg;
    printf("Thread %d running...\n", id);
    return NULL;
}

void spawn_thread(void) {
    pthread_t thread;
    int id = 1;
    pthread_create(&thread, NULL, thread_worker, &id);
    pthread_join(thread, NULL); // Sync wait for completion
}
```

### Tuesday: Shared Memory Race Conditions & Mutex Protection
* **Conceptual Objective**: Understand that because threads share the same address space, concurrent updates to global or heap variables will create devastating race conditions. Study the Mutual Exclusion (`pthread_mutex_t`) primitive. Learn the lock-and-unlock pattern to enforce atomic access inside critical sections.
* **Practical Activity**:
  1. Write a program where multiple threads increment a global variable simultaneously without protection. Observe the final value is incorrect (data corruption due to interleaving).
  2. Implement a `pthread_mutex_t` lock wrapper and verify that final values match calculations.
* **Code/Circuit Reference**:
```c
#include <pthread.h>

volatile int g_counter = 0;
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void* safe_increment(void *arg) {
    (void)arg;
    for (int i = 0; i < 100000; i++) {
        pthread_mutex_lock(&lock);
        g_counter++; // Critical Section protected!
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}
```

### Wednesday: POSIX Semaphores (Synchronization & Resource Limits)
* **Conceptual Objective**: Study POSIX Semaphores (`sem_t` from `<semaphore.h>`). Understand that a semaphore is a counting variable that tracks available resources:
  - `sem_wait()`: Decrements the counter. If counter is 0, the thread blocks until it is incremented.
  - `sem_post()`: Increments the counter and wakes up waiting threads.
  Comprehend how counting semaphores coordinate queues.
* **Practical Activity**:
  1. Write a thread-sync program using unnamed semaphores (`sem_init`).
  2. Coordinate execution ordering between two worker threads.
* **Code/Circuit Reference**:
```c
#include <semaphore.h>

sem_t sem;

void* first_task(void *arg) {
    // Perform task...
    sem_post(&sem); // Signal next task
    return NULL;
}

void* second_task(void *arg) {
    sem_wait(&sem); // Block until first_task completes
    // Perform task...
    return NULL;
}
```

### Thursday: Thread Signaling via Condition Variables
* **Conceptual Objective**: Understand that a thread should not spin in a loop checking a variable (busy-waiting) as this wastes CPU cycles. Study **Condition Variables** (`pthread_cond_t`). A condition variable allows a thread to sleep (relinquishing CPU and unlocking a mutex atomic-style) until another thread signals a state change (`pthread_cond_signal` or `pthread_cond_broadcast`).
* **Practical Activity**:
  1. Implement a signaling loop where a worker thread waits for a processing flag.
  2. Signal the condition from the main thread.
* **Code/Circuit Reference**:
```c
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
bool g_ready = false;

void* wait_for_event(void *arg) {
    pthread_mutex_lock(&mutex);
    while (!g_ready) {
        // Automatically unlocks mutex and blocks thread
        pthread_cond_wait(&cond, &mutex); 
    }
    // Wakes up with mutex LOCKED again!
    printf("Event processed!\n");
    pthread_mutex_unlock(&mutex);
    return NULL;
}
```

### Friday: Deadlocks & Thread-Safe Design Guidelines
* **Conceptual Objective**: Master Thread Safety design principles. Understand **Deadlocks**—situations where two or more threads are permanently blocked, each waiting for a resource held by the other (e.g., Thread 1 holds Mutex A, waits for Mutex B; Thread 2 holds Mutex B, waits for Mutex A). Learn the core rule: always acquire locks in a strict, predefined order.
* **Practical Activity**:
  1. Design a deadlock scenario intentionally. Run it and note the application freeze.
  2. Apply the strict lock ordering design pattern to resolve the deadlock.
* **Code/Circuit Reference**:
```text
Deadlock Scenario:
Thread 1: lock(A) -> lock(B) -> unlock(B) -> unlock(A)
Thread 2: lock(B) -> lock(A) -> unlock(A) -> unlock(B)
If Thread 1 locks A, and Thread 2 locks B simultaneously -> Deadlock!

Resolution (Strict Lock Order):
Thread 1: lock(A) -> lock(B)
Thread 2: lock(A) -> lock(B) // Thread 2 blocks on A, allowing Thread 1 to finish.
```

---

## 🛠️ Hands-On Assignment: Thread-Safe Concurrent FIFO Queue

### Functional Requirements
Create a highly robust, Thread-Safe Concurrent FIFO Queue (Producer-Consumer Queue) in C, and coordinate active data transfers using POSIX thread synchronization.
1. The queue must manage a structural singly linked list or circular buffer containing integers.
2. Provide thread-safe API endpoints:
   - `void queue_push(queue_t *q, int val)`: Adds a value to the queue.
   - `int queue_pop(queue_t *q)`: Removes and returns a value. If the queue is empty, the calling thread must block (sleep) using a **Condition Variable** until a producer pushes data.
3. In `main.c`:
   - Initialize the queue structure.
   - Spawn a pool of 2 Producer Threads. Each producer generates 100 integers and pushes them to the queue with random small delays.
   - Spawn a pool of 3 Consumer Threads. Each consumer pops values from the queue, processes them (prints to stdout), and calculates sums.
4. Ensure the queue handles termination flags safely: when producers complete, signal consumers to exit cleanly without locking up permanently on empty queues.

### Structural Requirements & Code Skeleton
**`concurrent_queue.h`**:
```ifndef CONCURRENT_QUEUE_H
#define CONCURRENT_QUEUE_H

#include <pthread.h>
#include <stdbool.h>

#define CAPACITY 32

typedef struct {
    int data[CAPACITY];
    int head;
    int tail;
    int size;
    pthread_mutex_t mutex;
    pthread_cond_t cond_space; // Wait when queue full
    pthread_cond_t cond_data;  // Wait when queue empty
    bool is_finished;
} queue_t;

void queue_init(queue_t *q);
void queue_push(queue_t *q, int val);
int queue_pop(queue_t *q, bool *success);
void queue_shutdown(queue_t *q);

#endif // CONCURRENT_QUEUE_H
```

**`concurrent_queue.c` (C-Skeleton)**:
```c
#include "concurrent_queue.h"

void queue_init(queue_t *q) {
    q->head = 0;
    q->tail = 0;
    q->size = 0;
    q->is_finished = false;
    pthread_mutex_init(&q->mutex, NULL);
    pthread_cond_init(&q->cond_space, NULL);
    pthread_cond_init(&q->cond_data, NULL);
}

void queue_push(queue_t *q, int val) {
    pthread_mutex_lock(&q->mutex);

    // Wait if full
    while (q->size == CAPACITY && !q->is_finished) {
        pthread_cond_wait(&q->cond_space, &q->mutex);
    }

    if (q->is_finished) {
        pthread_mutex_unlock(&q->mutex);
        return;
    }

    q->data[q->head] = val;
    q->head = (q->head + 1) % CAPACITY;
    q->size++;

    // Signal waiting consumers that data is ready
    pthread_cond_signal(&q->cond_data);
    pthread_mutex_unlock(&q->mutex);
}

int queue_pop(queue_t *q, bool *success) {
    pthread_mutex_lock(&q->mutex);

    // Wait if empty
    while (q->size == 0 && !q->is_finished) {
        pthread_cond_wait(&q->cond_data, &q->mutex);
    }

    if (q->size == 0 && q->is_finished) {
        *success = false;
        pthread_mutex_unlock(&q->mutex);
        return -1;
    }

    int val = q->data[q->tail];
    q->tail = (q->tail + 1) % CAPACITY;
    q->size--;
    *success = true;

    // Signal waiting producers that space is available
    pthread_cond_signal(&q->cond_space);
    pthread_mutex_unlock(&q->mutex);

    return val;
}

void queue_shutdown(queue_t *q) {
    pthread_mutex_lock(&q->mutex);
    q->is_finished = true;
    pthread_cond_broadcast(&q->cond_data); // Wake up all waiting
    pthread_cond_broadcast(&q->cond_space);
    pthread_mutex_unlock(&q->mutex);
}
```

---

## 📦 Deliverables
* [ ] Queue files `concurrent_queue.c` and `concurrent_queue.h`.
* [ ] Application entry point `main.c` spawning producer/consumer pools.
* [ ] Compilation Makefile linking dynamic libraries (`-lpthread`).

---

## ❓ Self-Check Questions
1. Why does a thread possess its own private Stack and Register Context? What memory segments are shared between multiple threads of the same process?
2. What is a **Race Condition**? Explain the mechanical steps of execution (Read, Modify, Write) that lead to memory corruption when two threads update a variable concurrently.
3. How does a **Mutex** differ from a **Binary Semaphore**? Differentiate ownership rules and how they prevent Priority Inversion inside operating systems.
4. Why is checking conditions inside a `while` loop (`while (size == 0)`) preferred over an `if` statement (`if (size == 0)`) when combined with `pthread_cond_wait()`? Explain the concept of **Spurious Wakeups**.
5. What is a **Deadlock**? State the four necessary conditions (Coffman Conditions) for a deadlock to occur.

---

## 🚀 Stretch Task (Optional)
Extend the concurrent queue to be **Lock-Free**. Utilize atomic CPU instructions (such as Compare-And-Swap: `__sync_bool_compare_and_swap` or `<stdatomic.h>`) to implement the push/pop operations without using any mutexes.

## 💡 Motivation Checkpoint
Whether you are writing a web server handling millions of parallel requests, or designing a high-speed automotive gateway routing sensor streams, concurrent task processing is mandatory. But writing multithreaded systems is highly complex; memory synchronization errors can easily lock up programs. Mastering POSIX threads, mutexes, and cond vars is standard expectation of senior systems developers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Thread pool executes cleanly with zero memory leaks or deadlocks.
  - Consumers exit cleanly after queue shutdown signals.
  - Data counts and sums match producer outputs.
* **Fail Criteria**:
  - Busy-waiting loops inside pop operations.
  - Thread racing errors captured during dynamic testing.
