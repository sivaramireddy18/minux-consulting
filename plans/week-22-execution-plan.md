# Weekly Execution Plan: Week 22

## 🎯 Weekly Goal
Master Inter-Task Communication (ITC) within Real-Time Operating Systems, configure **Message Queues** for structured data routing, utilize **Event Groups** for multi-event synchronization, and harness light-weight **Task Notifications** for high-speed, minimal-overhead signaling.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Multi-Sensor Telemetry Concentrator** using FreeRTOS. They will understand how tasks pass structures safely without global memory corruption, how to synchronize multiple asynchronous tasks concurrently, and how to optimize communication latency using Task Notifications.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: FreeRTOS Message Queues (Structured FIFO Data Routing)
* **Conceptual Objective**: Master Message Queues—thread-safe FIFO buffers managed by the kernel. Understand that queues copy data by value (meaning the data structure is copied directly into queue memory, allowing the sender to overwrite its local copy safely). Learn about blocking on queues (tasks sleep when queue is full/empty).
* **Practical Activity**:
  1. Learn how to initialize message queues using `xQueueCreate()`.
  2. Implement a producer-consumer system where Task A packs sensor data into a C struct and sends it via `xQueueSend()`, and Task B unpacks it using `xQueueReceive()`.
* **Code/Circuit Reference**:
```c
#include "queue.h"

typedef struct {
    uint32_t id;
    uint32_t val;
} packet_t;

QueueHandle_t xPacketQueue = NULL;

void vProducer(void *pvParameters) {
    packet_t pkt = {1, 100};
    while (1) {
        // Send by value (copies structure into queue memory)
        xQueueSend(xPacketQueue, &pkt, portMAX_DELAY);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}
```

### Tuesday: Queue Sets (Multiplexing Multiple Queues)
* **Conceptual Objective**: Understand that in complex systems, a single receiver task may need to monitor multiple independent queues (e.g., a CAN queue, a UART queue, and an ADC queue) without locking. Study **Queue Sets**—a mechanism allowing a task to block on multiple queues simultaneously.
* **Practical Activity**:
  1. Initialize a queue set using `xQueueCreateSet()`.
  2. Map multiple queue handles to the set and build a multiplexed polling loop.
* **Code/Circuit Reference**:
```c
QueueSetHandle_t xQueueSet = xQueueCreateSet(20);
xQueueAddToSet(xQueueA, xQueueSet);
xQueueAddToSet(xQueueB, xQueueSet);

void vReceiverTask(void *pvParameters) {
    while (1) {
        // Blocks on any queue in the set having data!
        QueueSetMemberHandle_t active = xQueueSelectFromSet(xQueueSet, portMAX_DELAY);
        if (active == xQueueA) {
            // Process queue A
        }
    }
}
```

### Wednesday: Event Groups (Bitmask Multi-Event Coordination)
* **Conceptual Objective**: Study Event Groups—kernel synchronization blocks containing a bitmask of flags. Unlike semaphores (which trigger one task at a time), Event Groups allow tasks to block waiting for multiple asynchronous events to occur simultaneously (AND condition) or any single event to occur (OR condition).
* **Practical Activity**:
  1. Initialize an event group using `xEventGroupCreate()`.
  2. Write a system where a controller task blocks until three independent initialization tasks (Timer initialized, UART initialized, Flash initialized) set their respective bits.
* **Code/Circuit Reference**:
```c
#include "event_groups.h"

#define BIT_TIMER_INIT (1 << 0)
#define BIT_UART_INIT  (1 << 1)

EventGroupHandle_t xInitEvents = NULL;

void wait_for_init(void) {
    // Wait for BOTH bits to be set
    xEventGroupWaitBits(
        xInitEvents, 
        BIT_TIMER_INIT | BIT_UART_INIT, 
        pdTRUE, // Clear on exit
        pdTRUE, // Wait for ALL bits (AND)
        portMAX_DELAY
    );
}
```

### Thursday: Lightweight Task Notifications (High-Speed Signaling)
* **Conceptual Objective**: Master Task Notifications. Understand that every task has a 32-bit notification value built directly into its TCB. Because there is no separate queue or semaphore structure in memory, using Task Notifications to unblock a task has up to **45% lower latency** and uses **0 bytes of extra SRAM** compared to semaphores.
* **Practical Activity**:
  1. Study task notifications APIs: `xTaskNotifyGive()`, `ulTaskNotifyTake()`, `xTaskNotify()`.
  2. Rewrite a binary semaphore signaling system using Task Notifications and document footprint improvements.
* **Code/Circuit Reference**:
```c
TaskHandle_t xReceiverTaskHandle = NULL;

void vSender(void *pvParameters) {
    while (1) {
        // Send notification directly to target task
        xTaskNotifyGive(xReceiverTaskHandle);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void vReceiver(void *pvParameters) {
    while (1) {
        // Wait for notification atomically
        uint32_t count = ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
        if (count > 0) {
            // Process event...
        }
    }
}
```

### Friday: Designing Communication Topologies
* **Conceptual Objective**: Master architectural design configurations. Differentiate:
  - **Message Queues**: Best for data transfer of structured frames.
  - **Event Groups**: Best for state coordination and task barriers.
  - **Notifications**: Best for ultra-low latency, one-to-one task signaling.
* **Practical Activity**:
  1. Map out an industrial IoT gateway communication topology.
  2. Present it in a block diagram.

---

## 🛠️ Hands-On Assignment: Multi-Sensor Telemetry Concentrator

### Functional Requirements
Create a fully modular FreeRTOS application that implements a Multi-Sensor Telemetry Concentrator routing structured data through message queues and coordinating startups via event groups.
1. Define a packed structure representing a Telemetry Frame containing a Sensor ID, Type, value, and timestamp.
2. Implement three tasks:
   - **`vTempSensorTask` (Priority 2)**: Reads simulated temperature data every 150ms and writes Telemetry Frames to a shared Message Queue.
   - **`vPressureSensorTask` (Priority 2)**: Reads simulated pressure data every 250ms and writes to the same Queue.
   - **`vConcentratorTask` (Priority 3)**: Blocks on the Message Queue, extracts packets, converts types, and prints raw details to the console.
3. Coordinate startup: before any sensor task starts writing data, they must wait for an **Event Group** signal. A dedicated `vSystemInitializer` task must run, perform virtual checks (delays), set the "System Ready" bits in the Event Group, and then delete itself.
4. Integrate a hardware tick interrupt simulator. Every 1 second, the interrupt must send a **Task Notification** directly to the `vConcentratorTask` to trigger an output of total packets processed statistics.
5. Provide a Makefile that builds the program cleanly.

### Structural Requirements & Code Skeleton
**`main.c` (C-Skeleton)**:
```c
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "event_groups.h"
#include <stdio.h>

#define BIT_SYS_READY   (1 << 0)
#define BIT_CONC_READY  (1 << 1)

typedef struct {
    uint32_t sensor_id;
    float value;
    uint32_t timestamp;
} telemetry_t;

QueueHandle_t xTelemetryQueue = NULL;
EventGroupHandle_t xStartEvents = NULL;
TaskHandle_t xConcentratorHandle = NULL;

void vSystemInitializer(void *pvParameters) {
    printf("[INIT] Starting virtual system checks...\n");
    vTaskDelay(pdMS_TO_TICKS(1000)); // Simulate hardware startup
    printf("[INIT] Hardware OK. Signaling Sensor Tasks.\n");
    
    // Set bits in Event Group
    xEventGroupSetBits(xStartEvents, BIT_SYS_READY | BIT_CONC_READY);
    vTaskDelete(NULL); // Self terminate
}

void vTempSensorTask(void *pvParameters) {
    // Wait for initialization
    xEventGroupWaitBits(xStartEvents, BIT_SYS_READY | BIT_CONC_READY, pdFALSE, pdTRUE, portMAX_DELAY);
    
    telemetry_t frame = { 101, 25.0f, 0 };
    while (1) {
        frame.value = 20.0f + ((float)(rand() % 100) / 10.0f);
        frame.timestamp = xTaskGetTickCount();
        xQueueSend(xTelemetryQueue, &frame, portMAX_DELAY);
        vTaskDelay(pdMS_TO_TICKS(150));
    }
}

void vConcentratorTask(void *pvParameters) {
    xEventGroupWaitBits(xStartEvents, BIT_SYS_READY | BIT_CONC_READY, pdFALSE, pdTRUE, portMAX_DELAY);
    
    telemetry_t rx_frame;
    uint32_t packets_count = 0;

    while (1) {
        // Check for direct interrupt notifications with a 10ms timeout
        uint32_t notify_val = ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(10));
        if (notify_val > 0) {
            printf("\n--- DIAGNOSTICS: Total Packets Processed: %u ---\n\n", packets_count);
        }

        // Read queue
        if (xQueueReceive(xTelemetryQueue, &rx_frame, pdMS_TO_TICKS(100)) == pdTRUE) {
            packets_count++;
            printf("[CONCENTRATOR] Received from Sensor %u | Value: %.2f | Time: %u\n", 
                   rx_frame.sensor_id, rx_frame.value, rx_frame.timestamp);
        }
    }
}
```

---

## 📦 Deliverables
* [ ] Source file `main.c` containing tasks.
* [ ] Compilation Makefile.
* [ ] Console output report `telemetry_run.log` showing startup synchronization and continuous queue processing prints.

---

## ❓ Self-Check Questions
1. Why does a Message Queue copy data **by value**? What are the advantages and disadvantages of this compared to passing data **by reference** (pointers)?
2. How do **Queue Sets** enable a task to monitor multiple independent queues? Why is this preferred over polling queues sequentially?
3. Explain the difference between `xQueueSend()` and `xQueueSendFromISR()`. Why can you not use standard FreeRTOS APIs inside an ISR?
4. How do **Task Notifications** achieve lower execution latency and lower SRAM footprint compared to standard binary semaphores?
5. Walk through the parameter configurations of `xEventGroupWaitBits()`. What does setting `xClearOnExit` to `pdTRUE` accomplish?

---

## 🚀 Stretch Task (Optional)
Modify the Concentrator to use a **Queue of Pointers** to pass large data structures dynamically, and write a thread-safe memory manager that handles memory allocations and stack balances cleanly.

## 💡 Motivation Checkpoint
Inside real-world embedded architectures, peripherals run asynchronously: an accelerometer sends data on SPI, a button triggers an interrupt, and a GPS module streams strings. Operating systems sync these streams using Message Queues and low-overhead Task Notifications. Mastering Inter-Task Communications is the baseline key to system integration.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Telemetry concentrator starts only *after* the Event Group initialization bits are set.
  - Telemetry structs pass cleanly without data corruption.
  - Direct Task Notifications are processed correctly.
* **Fail Criteria**:
  - Hard-coded busy loops inside receiving queues.
  - Dynamic malloc allocations inside task loops without safety guards.
