# Week 08: High-Performance Telemetry Data Logging

## 🎯 Weekly Goal
Master Python's threading execution model, implement thread-safe data queues to handle high-speed inputs, and build a high-performance telemetry data logger that streams metrics cleanly to disk without data losses.

## 🎓 Weekly Outcome
By the end of this week, you will be able to spawn concurrent consumer/producer threads, protect shared queues using `queue.Queue`, process incoming telemetry inputs asynchronously, write data portably to CSV or binary Parquet formats, and benchmark execution performance.

---

## 📅 Session Breakdown

### Monday: The Python Concurrency Model (GIL)
* **Conceptual Focus:** The Global Interpreter Lock (GIL).
  * Why CPython restricts execution to a single thread at a time for CPU-bound tasks.
  * Why threading is **highly effective for I/O-bound tasks** (such as serial reading, network listening, disk writing), where threads spend most of their time waiting for data.
  * Spawning threads using the `threading` module.
* **Hands-on Experiment:**
  Spawn a parallel logging thread:
  ```python
  import threading
  import time
  
  def log_worker() -> None:
      print("Logging thread started.")
      time.sleep(2)
      print("Logging thread complete.")
      
  t = threading.Thread(target=log_worker)
  t.start()
  t.join() # Wait for thread to finish
  ```

---

### Tuesday: Thread-Safe Queues (`queue.Queue`)
* **Conceptual Focus:** The Producer-Consumer pattern.
  * In high-speed systems, reading data and writing data in the same thread blocks execution. While Python is writing to a slow disk, serial buffers overflow, leading to data loss.
  * **The Solution:** A dedicated **Producer Thread** that reads incoming serial bytes and pushes them onto a queue, and a separate **Consumer Thread** that pops bytes off the queue and writes them to the disk.
  * Using Python's built-in `queue.Queue` which handles internal lock synchronization automatically.
* **Hands-on Exercise:**
  Build a basic producer-consumer queue loop:
  ```python
  import threading
  import queue
  import time
  
  data_queue: queue.Queue[int] = queue.Queue()
  
  def producer() -> None:
      for i in range(5):
          data_queue.put(i)
          time.sleep(0.5)
          
  def consumer() -> None:
      while True:
          item = data_queue.get()
          if item is None: # Exit signal
              break
          print(f"Consumed: {item}")
          data_queue.task_done()
  ```

---

### Wednesday: Async Telemetry Streaming
* **Conceptual Focus:** Structuring logging loops.
  * Protecting loops from blocking on I/O delays.
  * Creating clean exit signals (using `threading.Event` objects) to stop threads gracefully without locking.

---

### Thursday: High-Performance Data Formats (CSV vs Parquet)
* **Conceptual Focus:** Structural storage.
  * **CSV:** Human-readable but massive, parsing is CPU-heavy.
  * **Parquet:** Columnar binary storage, compressed, lightning-fast reads/writes (utilizes Pandas).
* **Hands-on Exercise:** Benchmarking the write speed and disk consumption of CSV logging vs binary Parquet mapping.

---

### Friday: Queue Overflow & CPU Throttling
* **Conceptual Focus:** Defensive concurrency.
  * Managing queue limits (`maxsize`). 
  * Preventing memory leaks when the consumer lags behind high-speed producers.

---

## 🛠️ Hands-On Assignment: Concurrent Telemetry Logger
Design and implement a multi-threaded high-frequency **Telemetry Data Logger** (`concurrent_logger.py`) that handles high-speed inputs safely.

### 1. Requirements
* Implement a **Producer Thread** that reads simulated raw telemetry data from a socket or serial port and pushes it immediately onto a `queue.Queue`.
* Implement a **Consumer Thread** that pops data off the queue, processes validation parameters, and writes data portably to a CSV log.
* Ensure thread synchronization:
  * Use a `threading.Event` to stop threads gracefully on terminal exits (Ctrl+C).
  * Use timeouts inside `queue.get(timeout=1.0)` to check for exit signals periodically.
* All code must be strictly type-annotated, checked with Mypy, and Black formatted.

### 2. File Deliverables
* `concurrent_logger.py`: Main thread executor and queue manager.
* `mock_sensor.py`: Utility generating continuous, high-speed data feeds.

---

## 📋 Deliverables Checklist
- [ ] `concurrent_logger.py` (Mypy type-hinted, safe threads)
- [ ] `mock_sensor.py` (High-speed socket data source)
- [ ] `requirements.txt` (Environment libraries dependencies)

---

## ❓ Self-Check Questions
1. Why does the Python Global Interpreter Lock (GIL) not hinder performance in I/O-bound telemetry readers?
2. Explain how the Producer-Consumer pattern prevents serial port buffer overflow data losses.
3. How does `threading.Event` optimize thread coordination compared to standard integer flag polling?
4. What are the performance and storage size differences between CSV and Parquet file formats?
5. How do you prevent thread locks (deadlocks) when multiple concurrent consumer threads share queues?

---

## 🚀 Stretch Task
Modify your telemetry logger to support **automatic data compression**. Integrate logic so that when a CSV file size exceeds 5MB, the consumer thread automatically spins up a background compression task (`zipfile` or `gzip`) to compress the old log file asynchronously while active logging continues uninterrupted.

---

## 💡 Motivation Checkpoint
Automated test benches in flight simulation, battery evaluation, or turbine auditing generate millions of telemetry points per second. If a logging tool locks the execution thread for a fraction of a second during a disk flush, telemetry data is lost, rendering validation logs useless. Writing robust, thread-safe asynchronous loggers is a core systems requirement.

---

## 🎓 Trainer Review Rules
* Verify thread execution: The application must terminate cleanly on keyboard exits, joining and killing all threads. No zombie processes or locked sockets must remain.
* The logger must complete under high-frequency benchmarks with **zero data frame losses**, validated by matching sent sequence numbers against written log indexes.
