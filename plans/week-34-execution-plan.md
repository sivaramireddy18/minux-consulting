# Weekly Execution Plan: Week 34

## 🎯 Weekly Goal
Master low-level network programming in C using standard POSIX **Socket APIs**, understand TCP/UDP protocol stacks, build highly reliable Client-Server communication systems, and manage concurrent socket connections.

## 🏆 Weekly Outcome
By Friday, the student will have designed and implemented a **Multi-Client TCP Telemetry Server** in C. They will understand socket states (bind, listen, accept), read/write network buffers safely, handle client disconnections gracefully, and parse custom application protocol frames.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The TCP/IP Layer Stack & POSIX Socket Concepts
* **Conceptual Objective**: Master the TCP/IP networking model (Physical, Network - IP, Transport - TCP/UDP, Application). Understand POSIX **Sockets**—virtual file descriptors acting as endpoints for network data streams. Differentiate between:
  - **Connection-Oriented (TCP)**: High reliability, sliding windows, flow control, guarantees packet order.
  - **Connectionless (UDP)**: Unreliable, low latency, best for high-frequency streaming.
* **Practical Activity**:
  1. Sketch a flowchart showing the step-by-step Socket call sequence for a TCP Server and TCP Client.
  2. Differentiate IP address formats (IPv4 vs IPv6) and byte-ordering macros.
* **Code/Circuit Reference**:
```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

// Byte order helper: Host-to-Network-Short (converts port to big-endian network byte order)
uint16_t net_port = htons(8080);
```

### Tuesday: Low-Level TCP Server Construction (socket, bind, listen, accept)
* **Conceptual Objective**: Master the server-side socket setup sequence:
  1. `socket()`: Allocates the socket descriptor.
  2. `bind()`: Binds the socket to a local IP address and Port.
  3. `listen()`: Configures the socket to act as a passive listener, setting the connection backlog.
  4. `accept()`: Blocks until a client connects, returning a **new socket descriptor** dedicated to communicating with that client.
* **Practical Activity**:
  1. Write a C program initializing a passive TCP listener.
  2. Add robust error checks for every system call.
* **Code/Circuit Reference**:
```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <stdio.h>
#include <unistd.h>

void init_server(void) {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY; // Bind to any interface
    address.sin_port = htons(8080);

    bind(server_fd, (struct sockaddr*)&address, sizeof(address));
    listen(server_fd, 5); // Backlog of 5 connections

    printf("Server listening on port 8080...\n");
    int client_fd = accept(server_fd, NULL, NULL); // Blocks here
    printf("Client connected!\n");
    close(client_fd);
    close(server_fd);
}
```

### Wednesday: Read/Write Transactions & Client Setup
* **Conceptual Objective**: Master network buffer reads and writes. Differentiate standard file read/writes from socket I/O: network packets are fragmented, meaning a single `read()` call may return only a partial segment of a sent string. You must implement robust buffer aggregation loops to guarantee complete frame parsing.
* **Practical Activity**:
  1. Write a C TCP Client application that connects (`connect()`) to the server, sends a message, and reads the reply.
  2. Verify buffer data flows.
* **Code/Circuit Reference**:
```c
// Robust function to read exactly 'n' bytes from a socket
ssize_t readn(int fd, void *vptr, size_t n) {
    size_t nleft = n;
    ssize_t nread;
    char *ptr = vptr;

    while (nleft > 0) {
        if ((nread = read(fd, ptr, nleft)) < 0) {
            if (errno == EINTR) nread = 0; // Handle interrupts
            else return -1;
        } else if (nread == 0) {
            break; // EOF (connection closed by peer)
        }
        nleft -= nread;
        ptr += nread;
    }
    return (n - nleft); // Return bytes read
}
```

### Thursday: Concurrency and Multi-Client Support
* **Conceptual Objective**: Differentiate between Single-client blocking servers and Concurrent servers. A single-client server cannot accept new connections while communicating with an active client. Study multi-threaded designs: spawning a dedicated worker thread via `pthread_create()` for every accepted client connection.
* **Practical Activity**:
  1. Write a multi-threaded TCP server.
  2. Verify that multiple client terminals (e.g., Telnet/NC instances) can connect and communicate simultaneously.
* **Code/Circuit Reference**:
```c
// Inside multi-threaded server loop
while (1) {
    int *client_fd = malloc(sizeof(int));
    *client_fd = accept(server_fd, NULL, NULL);
    
    pthread_t thread;
    // Spawn worker thread to handle communication concurrently
    pthread_create(&thread, NULL, client_handler, (void*)client_fd);
    pthread_detach(thread); // Detach to release thread resources automatically
}
```

### Friday: Protocol Framing and Network Debugging
* **Conceptual Objective**: Understand that data sent over TCP has no boundaries (stream-based). To parse messages cleanly, you must define **Application Protocol Frames** (e.g., prefixing packets with a header containing a start byte and payload length). Learn to debug sockets using `netstat` and `telnet`.
* **Practical Activity**:
  1. Connect a client and monitor transactions.
  2. Use `netstat` to trace socket states (LISTEN, ESTABLISHED, TIME_WAIT).
* **Code/Circuit Reference**:
```bash
# List active TCP connections and ports
netstat -tlnp

# Connect to target server using Netcat
nc localhost 8080
```

---

## 🛠️ Hands-On Assignment: Concurrent Industrial Telemetry Server

### Functional Requirements
Create a robust, multi-threaded C Telemetry Server that parses custom protocol data frames concurrently from multiple remote clients.
1. Define a packed Telemetry Frame packet containing:
   - Start Flag (`0x55`) - 1 byte.
   - Device ID - 4 bytes.
   - Temperature Float value - 4 bytes.
   - CRC-8 Checksum - 1 byte.
2. Build a multi-threaded TCP Server `telemetry_server` listening on port `9090`.
3. For every accepted connection, spawn a thread to parse incoming frames.
4. The worker thread must:
   - Implement a buffer reading loop to collect exactly 10 bytes (frame size).
   - Verify the Start Flag and calculate the CRC-8 checksum.
   - If valid, print the parsed values cleanly to standard output and log them to `network_telemetry.log`.
   - If invalid or connection closed, exit the thread cleanly and close the socket descriptor.
5. Write a python or C client simulator `sensor_client` that connects to the server, transmits 5 valid frames, 1 corrupted frame (invalid CRC), and disconnects.
6. Provide a Makefile that builds the server cleanly.

### Structural Requirements & Code Skeleton
**`telemetry_server.c` (C-Skeleton)**:
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <pthread.h>
#include <errno.h>

#define PORT 9090
#define START_FLAG 0x55

typedef struct __attribute__((packed)) {
    uint8_t start_flag;
    uint32_t device_id;
    float temperature;
    uint8_t checksum;
} frame_t;

uint8_t calculate_crc8(const uint8_t *data, size_t len) {
    uint8_t crc = 0x00;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 0x80) crc = (crc << 1) ^ 0x07;
            else crc <<= 1;
        }
    }
    return crc;
}

void* handle_client(void *arg) {
    int client_fd = *(int*)arg;
    free(arg);
    frame_t frame;
    
    printf("[SERVER THREAD] Handling client socket %d\n", client_fd);

    while (1) {
        // Read complete 10-byte frame
        ssize_t bytes = recv(client_fd, &frame, sizeof(frame_t), MSG_WAITALL);
        if (bytes <= 0) {
            printf("[SERVER THREAD] Client disconnected or read error.\n");
            break;
        }

        // Verify frame
        if (frame.start_flag != START_FLAG) {
            printf("[SERVER THREAD] ERROR: Invalid Start Flag 0x%02X\n", frame.start_flag);
            break;
        }

        uint8_t calc_crc = calculate_crc8((uint8_t*)&frame, sizeof(frame_t) - 1);
        if (calc_crc != frame.checksum) {
            printf("[SERVER THREAD] ERROR: Checksum mismatch. Calc: 0x%02X, Recv: 0x%02X\n", 
                   calc_crc, frame.checksum);
            continue; // Skip corrupted frame
        }

        printf("[DATA RECEIVED] Dev: %u | Temp: %.2f C | Checksum: OK\n", 
               frame.device_id, frame.temperature);
    }

    close(client_fd);
    return NULL;
}
```

---

## 📦 Deliverables
* [ ] Server source file `telemetry_server.c`.
* [ ] Client simulator file `sensor_client.py` (or C).
* [ ] Compilation Makefile.
* [ ] Execution log `network_telemetry.log` showing concurrent connections and frame parsing.

---

## ❓ Self-Check Questions
1. Why does TCP require a **Three-Way Handshake** to establish a connection? How do the SYN and ACK packets coordinate states?
2. Why is raw TCP called a "byte stream" protocol? How do application headers prevent data fragmentation issues during parsing?
3. What is the role of `htons()` and `ntohl()` macros? Why is network byte ordering strictly Big-Endian?
4. What is the purpose of detaching a POSIX thread using `pthread_detach()`?
5. How does the `select()` system call enable single-threaded servers to monitor multiple client sockets concurrently?

---

## 🚀 Stretch Task (Optional)
Extend the TCP Server to support **Non-Blocking I/O** and multiplexing using the modern Linux **`epoll`** system call suite (`epoll_create1`, `epoll_ctl`, `epoll_wait`) to handle up to 1000 concurrent client simulations in a single execution thread.

## 💡 Motivation Checkpoint
Industrial edge gateways, smart home hubs, and internet servers do not execute standalone calculations; they are networked. They process sensor streams from client nodes, manage REST APIs, and upload data to central servers. Mastering POSIX sockets, multi-threading, and protocol framing is a core skill for any systems engineer.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - TCP server compiles cleanly and handles multiple concurrent netcat connections.
  - Sockets close cleanly on exits, leaving no orphan ports locked in TIME_WAIT states.
  - Custom protocol frames are verified correctly (corruptions are dropped).
* **Fail Criteria**:
  - Server halts execution completely if a single client disconnects.
  - Absence of dynamic multi-threaded worker spawns.
