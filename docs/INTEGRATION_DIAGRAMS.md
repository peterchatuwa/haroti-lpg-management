# PayChangu & PAYC Integration - Visual Diagrams

## System Integration Architecture

```mermaid
graph TB
    subgraph "External Systems"
        PCG[PayChangu Gateway API]
        PAYC[PAYC Hardware Manufacturer]
        AM[Airtel Money]
        TNM[TNM Mpamba]
    end

    subgraph "Haroti LPG ERP System"
        subgraph "API Layer"
            PC_CTRL[PayChangu Controller]
            PAYC_CTRL[PAYC Controller]
            WEBHOOK[Webhook Endpoint]
        end

        subgraph "Service Layer"
            PC_SVC[PayChangu Service]
            PAYC_SVC[PAYC Service]
            SALES_SVC[Sales Service]
            FIN_SVC[Finance Service]
            HW_ADAPTER[Hardware Adapter]
        end

        subgraph "Data Layer"
            PC_TXN[(PayChangu Transactions)]
            PC_WEBHOOK[(Webhooks)]
            SALES[(Sales)]
            METERS[(PAYC Meters)]
            TELEMETRY[(Telemetry)]
            GL[(GL Entries)]
        end
    end

    subgraph "User Interfaces"
        POS[POS Terminal]
        PORTAL[Customer Portal]
        DASH[Management Dashboard]
    end

    %% External connections
    PCG --> WEBHOOK
    PAYC --> PAYC_CTRL
    AM --> PCG
    TNM --> PCG

    %% User interactions
    POS --> PC_CTRL
    PORTAL --> PC_CTRL
    PORTAL --> PAYC_CTRL
    DASH --> PAYC_CTRL

    %% API to Service
    PC_CTRL --> PC_SVC
    PAYC_CTRL --> PAYC_SVC
    WEBHOOK --> PC_SVC

    %% Service interactions
    PC_SVC --> SALES_SVC
    PC_SVC --> PAYC_SVC
    PAYC_SVC --> HW_ADAPTER
    HW_ADAPTER --> PAYC
    SALES_SVC --> FIN_SVC
    PAYC_SVC --> FIN_SVC

    %% Data access
    PC_SVC --> PC_TXN
    PC_SVC --> PC_WEBHOOK
    SALES_SVC --> SALES
    PAYC_SVC --> METERS
    PAYC_SVC --> TELEMETRY
    FIN_SVC --> GL

    style PCG fill:#FFE4B5
    style PAYC fill:#FFE4B5
    style PC_SVC fill:#98FB98
    style PAYC_SVC fill:#98FB98
    style FIN_SVC fill:#98FB98
```

## Payment Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant Customer
    participant POS
    participant ERP_API
    participant PayChangu
    participant MoMo as Mobile Money Provider
    participant Webhook

    Customer->>POS: Select Payment Method (Airtel Money)
    POS->>ERP_API: Create Sale + Initiate Payment
    ERP_API->>ERP_API: Create PaychanguTransaction (PENDING)
    ERP_API->>PayChangu: POST /payments/initiate
    PayChangu->>PayChangu: Generate Payment Request
    PayChangu-->>ERP_API: Return USSD Code & Transaction Ref
    ERP_API-->>POS: Return Payment Details
    POS->>Customer: Display USSD Code

    Customer->>Customer: Dial USSD Code
    Customer->>MoMo: Enter PIN & Confirm
    MoMo->>PayChangu: Payment Completed
    PayChangu->>Webhook: POST /webhook (payment.completed)
    Webhook->>ERP_API: Process Webhook
    ERP_API->>ERP_API: Update Transaction (COMPLETED)
    ERP_API->>ERP_API: Update Sale (PAID)
    ERP_API->>ERP_API: Post GL Entries
    ERP_API-->>POS: Real-time Status Update
    POS->>Customer: Show Success & Receipt

    Note over ERP_API,PayChangu: Webhook includes signature verification<br/>for security
```

## PAYC Top-Up & Credit Sync Flow

```mermaid
sequenceDiagram
    participant Customer
    participant Portal
    participant ERP_API
    participant PayChangu
    participant Hardware as PAYC Hardware
    participant Meter as Smart Meter

    Customer->>Portal: Request Credit Top-Up (500 MWK)
    Portal->>ERP_API: POST /payc/meters/:id/topup
    ERP_API->>ERP_API: Validate Meter & Customer
    ERP_API->>PayChangu: Initiate Payment
    PayChangu-->>ERP_API: Payment Request Created
    ERP_API-->>Portal: Show Payment Instructions

    Customer->>Customer: Complete Payment via Mobile Money
    PayChangu->>ERP_API: Webhook: payment.completed
    
    ERP_API->>ERP_API: Update PaychanguTransaction
    ERP_API->>ERP_API: Calculate Credit (500 MWK ÷ 1850 = 0.27 kg)
    ERP_API->>ERP_API: Update Meter Credit Balance
    ERP_API->>ERP_API: Post GL Entry (Cash → Deferred Revenue)
    
    ERP_API->>Hardware: Sync Credit Command
    Hardware->>Meter: Update Credit Balance (0.27 kg)
    Meter-->>Hardware: ACK
    Hardware-->>ERP_API: Confirmation
    
    ERP_API->>Portal: Send SMS Notification
    Portal->>Customer: "Top-up Successful! Credit: 0.27 kg"

    Note over Meter: Meter now has<br/>updated credit balance<br/>and valve remains open
```

## PAYC Telemetry Processing Flow

```mermaid
flowchart TD
    START([Meter Sends Telemetry]) --> RECEIVE[Hardware Gateway Receives Data]
    RECEIVE --> PROTOCOL{Protocol Type?}
    
    PROTOCOL -->|MQTT| MQTT_PARSE[MQTT Message Handler]
    PROTOCOL -->|HTTP| HTTP_PARSE[HTTP Webhook Handler]
    PROTOCOL -->|CoAP| COAP_PARSE[CoAP Handler]
    
    MQTT_PARSE --> ADAPTER[Hardware Adapter]
    HTTP_PARSE --> ADAPTER
    COAP_PARSE --> ADAPTER
    
    ADAPTER --> VALIDATE{Validate Data}
    VALIDATE -->|Invalid| LOG_ERROR[Log Error]
    VALIDATE -->|Valid| PARSE[Parse Telemetry Packet]
    
    PARSE --> EXTRACT[Extract Data:<br/>- Daily Burn<br/>- Credit Remaining<br/>- Valve Status<br/>- Battery Level]
    
    EXTRACT --> SAVE_TEL[Save to payc_telemetry]
    SAVE_TEL --> UPDATE_METER[Update payc_meters]
    
    UPDATE_METER --> CHECK_BURN{Burn > 0?}
    CHECK_BURN -->|Yes| CALC_REV[Calculate Revenue]
    CHECK_BURN -->|No| CHECK_ALERTS
    
    CALC_REV --> POST_GL[Post GL Entry:<br/>Deferred Revenue → Revenue]
    POST_GL --> RECORD_TXN[Record PaycCreditTransaction<br/>type: BURN]
    RECORD_TXN --> CHECK_ALERTS
    
    CHECK_ALERTS{Check Status} --> LOW_CREDIT{Credit < 0.5 kg?}
    LOW_CREDIT -->|Yes| ALERT_LOW[Send LOW_CREDIT Alert]
    LOW_CREDIT -->|No| CHECK_OFFLINE
    
    CHECK_OFFLINE{Last Telemetry > 24h?} -->|Yes| ALERT_OFFLINE[Send OFFLINE Alert]
    CHECK_OFFLINE -->|No| CHECK_TAMPER
    
    CHECK_TAMPER{Tamper Detected?} -->|Yes| ALERT_TAMPER[Send TAMPER Alert]
    CHECK_TAMPER -->|No| END
    
    ALERT_LOW --> END([Process Complete])
    ALERT_OFFLINE --> END
    ALERT_TAMPER --> END
    LOG_ERROR --> END
    
    style START fill:#90EE90
    style END fill:#90EE90
    style ALERT_LOW fill:#FFB6C1
    style ALERT_OFFLINE fill:#FFB6C1
    style ALERT_TAMPER fill:#FF6B6B
    style POST_GL fill:#87CEEB
```

## Database Schema Relationships

```mermaid
erDiagram
    PAYCHANGU_TRANSACTIONS ||--o| SALES : "references"
    PAYCHANGU_TRANSACTIONS ||--o| PAYC_METERS : "references"
    PAYCHANGU_WEBHOOKS ||--|| PAYCHANGU_TRANSACTIONS : "processes"
    
    PAYC_METERS ||--o{ PAYC_TELEMETRY : "sends"
    PAYC_METERS ||--o{ PAYC_CREDIT_TRANSACTIONS : "has"
    PAYC_METERS }o--|| CUSTOMERS : "belongs_to"
    PAYC_METERS }o--|| STATIONS : "located_at"
    
    SALES ||--|{ SALE_PAYMENTS : "has"
    SALES }o--|| CUSTOMERS : "sold_to"
    SALES }o--|| STATIONS : "sold_at"
    
    PAYCHANGU_TRANSACTIONS {
        uuid id PK
        string transaction_ref UK
        string internal_ref
        enum payment_method
        decimal amount
        enum status
        string customer_phone
        timestamp completed_at
        uuid sale_id FK
        uuid payc_meter_id FK
    }
    
    PAYCHANGU_WEBHOOKS {
        uuid id PK
        string event_type
        string transaction_ref
        jsonb payload
        boolean processed
        timestamp processed_at
    }
    
    PAYC_METERS {
        uuid id PK
        string meter_serial UK
        decimal credit_balance_kg
        decimal deferred_revenue
        enum status
        timestamp last_telemetry_at
        uuid customer_id FK
        uuid station_id FK
    }
    
    PAYC_TELEMETRY {
        uuid id PK
        uuid meter_id FK
        decimal burn_kg
        decimal credit_remaining_kg
        boolean valve_open
        timestamp recorded_at
    }
    
    PAYC_CREDIT_TRANSACTIONS {
        uuid id PK
        uuid meter_id FK
        enum type
        decimal amount_mwk
        decimal credit_kg
        enum payment_method
        string reference
    }
```

## Implementation Phase Timeline

```mermaid
gantt
    title PayChangu & PAYC Integration Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: PayChangu
    Setup & Research           :p1_1, 2026-08-19, 5d
    Backend Implementation     :p1_2, after p1_1, 5d
    Frontend Integration       :p1_3, after p1_2, 5d
    Testing & QA              :p1_4, after p1_3, 5d
    
    section Phase 2: PAYC Hardware
    Hardware Discovery         :p2_1, after p1_4, 5d
    Backend Implementation     :p2_2, after p2_1, 5d
    Integration Testing        :p2_3, after p2_2, 5d
    UI & Monitoring           :p2_4, after p2_3, 5d
    
    section Milestones
    PayChangu Go-Live         :milestone, m1, after p1_4, 0d
    PAYC Hardware Go-Live     :milestone, m2, after p2_4, 0d
    
    section Post-Launch
    Monitoring & Optimization  :p3_1, after p2_4, 20d
```

## Component Interaction Matrix

```mermaid
graph LR
    subgraph "Integration Components"
        A[PayChangu Service]
        B[PAYC Service]
        C[Sales Service]
        D[Finance Service]
        E[Hardware Adapter]
        F[Notification Service]
    end

    A -->|Payment Completed| C
    A -->|Payment Completed| B
    A -->|Post Entry| D
    
    B -->|Sale Credit| D
    B -->|Sync Command| E
    B -->|Low Credit Alert| F
    
    C -->|Record Sale| D
    C -->|Loyalty Points| F
    
    E -->|Telemetry| B
    
    style A fill:#FFE4B5
    style B fill:#FFE4B5
    style C fill:#98FB98
    style D fill:#87CEEB
    style E fill:#DDA0DD
    style F fill:#F0E68C
```

## Security & Authentication Flow

```mermaid
flowchart TD
    START([Request Received]) --> AUTH_TYPE{Request Type?}
    
    AUTH_TYPE -->|API Call| JWT[Verify JWT Token]
    AUTH_TYPE -->|Webhook| SIG[Verify HMAC Signature]
    AUTH_TYPE -->|Hardware| CERT[Verify Certificate/Token]
    
    JWT --> JWT_VALID{Valid?}
    JWT_VALID -->|No| REJECT_JWT[Reject: 401 Unauthorized]
    JWT_VALID -->|Yes| CHECK_PERM[Check Permissions]
    
    SIG --> SIG_VALID{Valid?}
    SIG_VALID -->|No| REJECT_SIG[Reject: 403 Forbidden]
    SIG_VALID -->|Yes| PROCESS
    
    CERT --> CERT_VALID{Valid?}
    CERT_VALID -->|No| REJECT_CERT[Reject: 401 Unauthorized]
    CERT_VALID -->|Yes| PROCESS
    
    CHECK_PERM --> HAS_PERM{Has Permission?}
    HAS_PERM -->|No| REJECT_PERM[Reject: 403 Forbidden]
    HAS_PERM -->|Yes| PROCESS[Process Request]
    
    PROCESS --> AUDIT[Log Audit Trail]
    AUDIT --> SUCCESS([Return Response])
    
    REJECT_JWT --> END([End])
    REJECT_SIG --> END
    REJECT_CERT --> END
    REJECT_PERM --> END
    
    style START fill:#90EE90
    style SUCCESS fill:#90EE90
    style REJECT_JWT fill:#FF6B6B
    style REJECT_SIG fill:#FF6B6B
    style REJECT_CERT fill:#FF6B6B
    style REJECT_PERM fill:#FF6B6B
    style AUDIT fill:#87CEEB
```

## Error Handling & Retry Strategy

```mermaid
stateDiagram-v2
    [*] --> Pending: Payment Initiated
    
    Pending --> Processing: PayChangu Accepts
    Processing --> Completed: Payment Successful
    Processing --> Failed: Payment Failed
    Processing --> Expired: Timeout (15 min)
    
    Failed --> Pending: Retry (if transient)
    Expired --> Cancelled: User Action
    
    Completed --> [*]: Success
    Cancelled --> [*]: End
    
    state Processing {
        [*] --> Calling_API
        Calling_API --> Network_Error: Connection Failed
        Network_Error --> Retry_Queue: Add to Queue
        Retry_Queue --> Calling_API: Retry (exponential backoff)
        Calling_API --> Success: 200 OK
        Success --> [*]
    }
    
    note right of Processing
        Max 3 retries
        Backoff: 5s, 10s, 20s
    end note
```

---

## Legend

### Status Colors
- 🟢 **Green** - Success states, ready components
- 🟡 **Yellow** - Processing, in-progress
- 🔴 **Red** - Error states, alerts
- 🔵 **Blue** - Data operations, GL posting
- 🟣 **Purple** - Hardware operations
- 🟠 **Orange** - External systems

### Icons
- 📱 Mobile Money Providers
- 💳 Payment Gateway
- 📡 Hardware Communication
- 💾 Database Operations
- 🔐 Security & Authentication
- 📊 Monitoring & Analytics

---

**Document Version**: 1.0  
**Last Updated**: August 17, 2026  
**Diagram Tool**: Mermaid (embedded in Markdown)

For best viewing experience, render these diagrams using:
- GitHub (native support)
- VS Code with Mermaid extension
- Mermaid Live Editor: https://mermaid.live
