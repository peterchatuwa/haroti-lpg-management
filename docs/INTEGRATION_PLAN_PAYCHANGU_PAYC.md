# PayChangu Payment Gateway & PAYC Hardware Integration Plan

**Project**: Haroti Holdings LPG Management System  
**Date**: August 17, 2026  
**Document Version**: 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Integration Objectives](#integration-objectives)
3. [Current System Analysis](#current-system-analysis)
4. [Integration Architecture](#integration-architecture)
5. [Phase 1: PayChangu Payment Gateway Integration](#phase-1-paychangu-payment-gateway-integration)
6. [Phase 2: PAYC Hardware Integration](#phase-2-payc-hardware-integration)
7. [Technical Implementation Plan](#technical-implementation-plan)
8. [Security & Compliance](#security--compliance)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Strategy](#deployment-strategy)
11. [Risk Assessment](#risk-assessment)
12. [Timeline & Milestones](#timeline--milestones)
13. [Success Metrics](#success-metrics)

---

## Executive Summary

This document outlines the comprehensive integration plan for:

1. **PayChangu Payment Gateway**: A unified payment processing gateway for Malawi market
2. **PAYC Hardware**: IoT-enabled smart meters from hardware manufacturers for Pay-As-You-Cook LPG consumption

The integration will enhance the Haroti Holdings LPG Management System by:
- Providing unified digital payment processing across all stations
- Enabling real-time hardware telemetry from PAYC smart meters
- Automating credit top-ups and consumption tracking
- Improving customer experience with seamless payment options

---

## Integration Objectives

### Primary Goals

1. **Payment Gateway Integration (PayChangu)**
   - Support mobile money (Airtel Money, TNM Mpamba) via PayChangu API
   - Enable card payments and bank transfers through PayChangu
   - Provide webhook-based payment confirmation
   - Support payment reconciliation and settlement tracking
   - Enable USSD and API-based payment flows

2. **PAYC Hardware Integration**
   - Receive real-time telemetry from PAYC smart meters
   - Process consumption data and credit depletion
   - Support remote credit top-up via PayChangu
   - Monitor meter health and connectivity status
   - Generate usage analytics and alerts

### Secondary Goals

- Reduce manual reconciliation effort by 80%
- Achieve <3 second payment confirmation latency
- Support offline payment queuing with sync-on-reconnect
- Provide customer self-service portal for PAYC management

---

## Current System Analysis

### Existing Infrastructure

#### Payment Processing
```
Current Payment Methods (backend/src/common/enums.ts):
├── CASH
├── AIRTEL_MONEY
├── TNM_MPAMBA
├── BANK_TRANSFER
├── CARD
├── CUSTOMER_ACCOUNT (Credit)
└── MIXED
```

**Current Flow:**
- Manual payment recording at POS
- Mobile money reconciliation via CSV import
- No real-time payment validation
- Manual settlement matching

#### PAYC Infrastructure
```
Existing PAYC Module (backend/src/payc/):
├── PaycService
├── PaycController
├── PaycMeter entity (meters fleet)
├── PaycTelemetry entity (usage data)
├── PaycCreditTransaction entity (top-ups & burns)
└── Finance integration (deferred revenue, burn recognition)
```

**Current Capabilities:**
- Manual credit top-up recording
- Telemetry ingestion via API
- Credit balance tracking
- Revenue recognition (deferred → recognized)
- Meter status monitoring (ACTIVE, LOW_CREDIT, OFFLINE, VALVE_CLOSED)

### Integration Points

| Component | Current State | Integration Required |
|-----------|---------------|---------------------|
| Sale Payments | Manual payment method selection | Auto-confirmation via PayChangu |
| PAYC Top-ups | Manual amount entry | PayChangu-initiated top-ups |
| Mobile Money Settlement | CSV import + manual matching | Real-time webhook reconciliation |
| PAYC Telemetry | Generic API endpoint | Manufacturer-specific protocol |
| Payment Reconciliation | Manual GL matching | Automated 3-way match |

---

## Integration Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Haroti LPG ERP (NestJS)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌──────────────────┐            │
│  │  PayChangu      │         │  PAYC Hardware   │            │
│  │  Integration    │◄────────┤  Integration     │            │
│  │  Module         │         │  Module          │            │
│  └────────┬────────┘         └────────┬─────────┘            │
│           │                           │                       │
│           │                           │                       │
│  ┌────────▼────────┐         ┌────────▼─────────┐           │
│  │  Sales Module   │         │  PAYC Module     │           │
│  │  - POS Sales    │         │  - Meters        │           │
│  │  - Top-ups      │         │  - Telemetry     │           │
│  │  - Payments     │         │  - Credits       │           │
│  └────────┬────────┘         └────────┬─────────┘           │
│           │                           │                       │
│           └───────────┬───────────────┘                       │
│                       │                                       │
│              ┌────────▼─────────┐                            │
│              │  Finance Module  │                            │
│              │  - GL Posting    │                            │
│              │  - Reconciliation│                            │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
           ▲                           ▲
           │                           │
    ┌──────┴─────────┐        ┌────────┴────────┐
    │  PayChangu     │        │  PAYC Hardware  │
    │  Gateway API   │        │  Manufacturer   │
    │  - Payments    │        │  - Telemetry    │
    │  - Webhooks    │        │  - Commands     │
    │  - Settlement  │        │  - Firmware     │
    └────────────────┘        └─────────────────┘
```

### Data Flow Diagrams

#### 1. PayChangu Payment Flow
```
Customer → POS/Portal → PayChangu API → Webhook → ERP
    ↓                         ↓             ↓        ↓
  Order              Payment Init    Confirmation  Update
```

#### 2. PAYC Telemetry Flow
```
Meter → Manufacturer Gateway → ERP API → Database
  ↓            ↓                   ↓          ↓
Usage     Aggregation         Processing  Storage
```

---

## Phase 1: PayChangu Payment Gateway Integration

### 1.1 PayChangu API Overview

#### API Capabilities (Assumed - to be confirmed with PayChangu)
- **Payment Initiation**: Create payment requests
- **Payment Methods**: Mobile Money, Cards, Bank Transfers
- **Webhooks**: Real-time payment status updates
- **Query API**: Check payment status
- **Settlement Reports**: Download daily/weekly reports
- **Refunds**: Initiate refund transactions

#### Required Credentials
- API Key / Secret
- Merchant ID
- Webhook Secret (for signature verification)
- Environment: Sandbox / Production

### 1.2 Backend Implementation

#### New Module Structure
```
backend/src/paychangu/
├── paychangu.module.ts
├── paychangu.service.ts
├── paychangu.controller.ts
├── paychangu-transaction.entity.ts
├── paychangu-webhook.entity.ts
├── dto/
│   ├── initiate-payment.dto.ts
│   ├── webhook-payload.dto.ts
│   └── query-payment.dto.ts
└── interfaces/
    ├── paychangu-config.interface.ts
    └── paychangu-response.interface.ts
```

#### Key Entities

**PaychanguTransaction**
```typescript
@Entity('paychangu_transactions')
export class PaychanguTransaction extends BaseEntity {
  @Column({ name: 'transaction_ref', unique: true })
  transactionRef: string; // PayChangu transaction ID
  
  @Column({ name: 'internal_ref' })
  internalRef: string; // Our internal reference (sale ID, top-up ID)
  
  @Column({ type: 'enum', enum: PaychanguPaymentMethod })
  paymentMethod: PaychanguPaymentMethod;
  
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;
  
  @Column({ type: 'enum', enum: PaychanguTransactionStatus })
  status: PaychanguTransactionStatus; // PENDING, COMPLETED, FAILED, CANCELLED
  
  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone?: string;
  
  @Column({ name: 'customer_email', length: 100, nullable: true })
  customerEmail?: string;
  
  @Column({ name: 'paychangu_reference', nullable: true })
  paychanguReference?: string; // External provider reference
  
  @Column({ name: 'callback_url', nullable: true })
  callbackUrl?: string;
  
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
  
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
  
  // Relations
  @Column({ name: 'sale_id', type: 'uuid', nullable: true })
  saleId?: string;
  
  @Column({ name: 'payc_meter_id', type: 'uuid', nullable: true })
  paycMeterId?: string;
}
```

**PaychanguWebhook**
```typescript
@Entity('paychangu_webhooks')
export class PaychanguWebhook extends BaseEntity {
  @Column({ name: 'event_type', length: 60 })
  eventType: string; // payment.completed, payment.failed, etc.
  
  @Column({ name: 'transaction_ref' })
  transactionRef: string;
  
  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, any>;
  
  @Column({ name: 'processed', default: false })
  processed: boolean;
  
  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;
  
  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;
}
```

#### Service Methods

**PaychanguService**
```typescript
// 1. Initiate Payment
async initiatePayment(params: {
  amount: number;
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  customerEmail?: string;
  internalRef: string; // saleId or topup ref
  metadata?: Record<string, any>;
}): Promise<PaychanguTransaction>

// 2. Query Payment Status
async queryPayment(transactionRef: string): Promise<PaychanguTransaction>

// 3. Process Webhook
async processWebhook(payload: any, signature: string): Promise<void>

// 4. Reconcile Transactions
async reconcilePendingTransactions(): Promise<void>

// 5. Get Settlement Report
async getSettlementReport(date: string): Promise<SettlementReport>

// 6. Initiate Refund
async initiateRefund(transactionRef: string, reason: string): Promise<void>
```

### 1.3 Payment Flow Integration

#### POS Sale with PayChangu
```typescript
// Updated Sales Flow
1. Attendant creates sale with payment method (AIRTEL_MONEY, TNM_MPAMBA, CARD)
2. System calls paychangu.initiatePayment()
   - Creates PaychanguTransaction (status: PENDING)
   - Returns payment URL or USSD code to customer
3. Customer completes payment on their device
4. PayChangu sends webhook to /api/paychangu/webhook
5. System processes webhook:
   - Verifies signature
   - Updates PaychanguTransaction (status: COMPLETED)
   - Marks sale as PAID
   - Records SalePayment
   - Posts GL entries via FinanceService
6. Attendant sees real-time confirmation
```

#### PAYC Credit Top-Up with PayChangu
```typescript
// Enhanced Top-Up Flow
1. Customer initiates top-up (via Portal or USSD)
2. System calls paychangu.initiatePayment()
   - Creates PaychanguTransaction with paycMeterId
3. Customer completes payment
4. Webhook received → PaychanguTransaction updated
5. System calls paycService.topUpCredit()
   - Updates meter credit balance
   - Records PaycCreditTransaction
   - Posts GL entries (Cash → Deferred Revenue)
6. Meter receives credit notification (if online)
```

### 1.4 Frontend Integration

#### Payment Components
```
frontend/src/components/payments/
├── PaychanguPayment.tsx      # Unified payment widget
├── MobileMoneyPrompt.tsx      # USSD code display
├── CardPaymentForm.tsx        # Card details form
└── PaymentStatus.tsx          # Real-time status polling
```

#### User Experience Flow
1. **Initiation**: Display payment method selection
2. **Processing**: Show USSD code or redirect to payment page
3. **Polling**: Poll backend every 3s for status update
4. **Confirmation**: Show success/failure message with receipt

### 1.5 Configuration

#### Environment Variables
```bash
# PayChangu Configuration
PAYCHANGU_API_KEY=pk_live_xxxxxxxx
PAYCHANGU_SECRET_KEY=sk_live_xxxxxxxx
PAYCHANGU_MERCHANT_ID=HAROTI_GAS_001
PAYCHANGU_WEBHOOK_SECRET=whsec_xxxxxxxx
PAYCHANGU_BASE_URL=https://api.paychangu.com/v1
PAYCHANGU_ENVIRONMENT=production # or sandbox
PAYCHANGU_CALLBACK_URL=https://erp.harotiholdingslimited.com/api/paychangu/webhook
```

---

## Phase 2: PAYC Hardware Integration

### 2.1 Hardware Manufacturer Requirements

#### Common PAYC Meter Specifications
- **Communication Protocol**: MQTT, HTTP, CoAP, or proprietary
- **Data Format**: JSON, Binary, or Protocol Buffers
- **Authentication**: API Key, Certificate-based, or Token
- **Telemetry Frequency**: Real-time (every 5-15 minutes) or batch (daily)
- **Command Support**: Remote valve control, credit update, firmware OTA

#### Required Information (To be obtained)
- Manufacturer name and contact
- API documentation URL
- Communication protocol details
- Data schema/payload structure
- Authentication mechanism
- Webhook/callback support
- Command API for remote operations

### 2.2 Backend Implementation

#### Enhanced PAYC Module
```
backend/src/payc/
├── (existing files)
├── hardware/
│   ├── payc-hardware.service.ts       # Generic hardware adapter
│   ├── adapters/
│   │   ├── manufacturer-a.adapter.ts  # Specific manufacturer
│   │   ├── manufacturer-b.adapter.ts
│   │   └── generic-mqtt.adapter.ts
│   └── interfaces/
│       ├── hardware-adapter.interface.ts
│       └── telemetry-packet.interface.ts
└── commands/
    ├── valve-control.dto.ts
    ├── credit-sync.dto.ts
    └── firmware-update.dto.ts
```

#### Hardware Adapter Interface
```typescript
export interface IPaycHardwareAdapter {
  // Initialize connection
  connect(): Promise<void>;
  
  // Parse incoming telemetry
  parseTelemetry(raw: any): TelemetryPacket;
  
  // Send command to meter
  sendCommand(meterSerial: string, command: MeterCommand): Promise<void>;
  
  // Sync credit balance
  syncCredit(meterSerial: string, creditKg: number): Promise<void>;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

export interface TelemetryPacket {
  meterSerial: string;
  timestamp: Date;
  creditRemainingKg: number;
  dailyBurnKg: number;
  cumulativeBurnKg: number;
  valveOpen: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  tamperDetected?: boolean;
  errorCodes?: string[];
}
```

#### Enhanced PaycService Methods
```typescript
// Hardware Integration Methods
async registerMeter(params: {
  meterSerial: string;
  manufacturerId: string;
  hardwareVersion: string;
  customerId: string;
  cylinderSerial: string;
  stationId: string;
}): Promise<PaycMeter>

async sendValveCommand(
  meterId: string, 
  action: 'OPEN' | 'CLOSE'
): Promise<void>

async syncMeterCredit(meterId: string): Promise<void>

async updateFirmware(
  meterId: string, 
  firmwareUrl: string
): Promise<void>

async handleTamperAlert(meterId: string): Promise<void>
```

### 2.3 Telemetry Processing Pipeline

```
Hardware → Adapter → Validation → Processing → Storage → Analytics
                ↓          ↓           ↓          ↓         ↓
            Transform   Rules    Business     DB      Alerts
                                  Logic
```

#### Processing Steps
1. **Receive**: Webhook or MQTT message
2. **Parse**: Use manufacturer-specific adapter
3. **Validate**: Check meter exists, data ranges valid
4. **Process**: Calculate burn, update credit balance
5. **Store**: Save to `payc_telemetry` table
6. **Update Meter**: Update `payc_meters` status
7. **Revenue Recognition**: Post GL entry if burn occurred
8. **Alerts**: Send notifications for LOW_CREDIT, OFFLINE, TAMPER

### 2.4 Integration with PayChangu

#### Combined Flow: Top-Up → Credit Sync → Hardware
```typescript
// Unified Top-Up Flow
async processPaychanguTopUp(webhookPayload: WebhookPayload) {
  // 1. Verify payment completed
  const txn = await paychangu.queryPayment(webhookPayload.transactionRef);
  
  // 2. Update PAYC credit in database
  const meter = await payc.topUpCredit({
    meterId: txn.paycMeterId,
    amountMwk: txn.amount,
    paymentMethod: PaymentMethod.PAYCHANGU,
    reference: txn.transactionRef,
  });
  
  // 3. Sync credit to hardware meter
  await paycHardware.syncCredit(
    meter.meterSerial, 
    toNumber(meter.creditBalanceKg)
  );
  
  // 4. Notify customer
  await notifications.dispatch({
    eventType: 'PAYC_TOPUP_SUCCESS',
    title: 'Top-up Successful',
    body: `Your PAYC meter has been credited with ${txn.amount} MWK`,
    phone: txn.customerPhone,
    channels: [NotificationChannel.SMS],
  });
}
```

### 2.5 Hardware Command Center

#### New Frontend Components
```
frontend/src/pages/PaycHardwarePage.tsx
- Meter fleet status dashboard
- Real-time telemetry visualization
- Remote valve control (emergency shutoff)
- Credit sync management
- Firmware update scheduler
- Tamper alert monitoring
```

---

## Technical Implementation Plan

### Phase 1: PayChangu Gateway (Weeks 1-4)

#### Week 1: Setup & Research
- [ ] Obtain PayChangu API credentials (sandbox)
- [ ] Review API documentation
- [ ] Set up test account with PayChangu
- [ ] Design database schema for transactions
- [ ] Create development environment variables

#### Week 2: Backend Implementation
- [ ] Create `paychangu` module
- [ ] Implement `PaychanguService` core methods
- [ ] Create entities and migrations
- [ ] Implement webhook endpoint with signature verification
- [ ] Add payment initiation to `SalesService`
- [ ] Add payment initiation to `PaycService` (top-ups)

#### Week 3: Frontend Integration
- [ ] Create payment UI components
- [ ] Implement USSD prompt display
- [ ] Add payment status polling
- [ ] Update POS flow to support PayChangu
- [ ] Update PAYC top-up portal

#### Week 4: Testing & Refinement
- [ ] Test all payment methods in sandbox
- [ ] Test webhook processing
- [ ] Test reconciliation logic
- [ ] Test error scenarios (failed payments, timeouts)
- [ ] Load testing (100 concurrent payments)
- [ ] Security audit of webhook handling

### Phase 2: PAYC Hardware (Weeks 5-8)

#### Week 5: Hardware Discovery
- [ ] Obtain manufacturer documentation
- [ ] Identify communication protocol
- [ ] Set up test meter or simulator
- [ ] Document data schema
- [ ] Design adapter interface

#### Week 6: Backend Implementation
- [ ] Create hardware adapter framework
- [ ] Implement manufacturer-specific adapter
- [ ] Enhance `PaycService` with hardware methods
- [ ] Create command API endpoints
- [ ] Implement telemetry webhook/MQTT handler

#### Week 7: Integration & Testing
- [ ] Test telemetry ingestion
- [ ] Test credit sync to hardware
- [ ] Test valve control commands
- [ ] Test PayChangu → PAYC integration (end-to-end)
- [ ] Test offline scenarios (delayed telemetry)

#### Week 8: UI & Monitoring
- [ ] Create hardware dashboard
- [ ] Implement real-time telemetry charts
- [ ] Add alert configuration UI
- [ ] Create tamper detection workflow
- [ ] Build firmware update scheduler

---

## Security & Compliance

### Security Measures

#### 1. API Security
- **Authentication**: API keys stored in environment variables
- **Webhook Verification**: HMAC signature validation
- **Rate Limiting**: Throttle payment requests (10/min per user)
- **Input Validation**: DTO validation for all inputs
- **Audit Trail**: Log all payment transactions

#### 2. Data Security
- **Encryption**: TLS 1.3 for all external communications
- **PCI DSS Compliance**: No card data stored locally
- **PII Protection**: Customer phone/email encrypted at rest
- **Database**: PostgreSQL with row-level security

#### 3. Hardware Security
- **Device Authentication**: Certificate-based or secure tokens
- **Command Authorization**: Role-based access for valve control
- **Tamper Detection**: Alert on physical tampering
- **Firmware Integrity**: Signed firmware updates only

### Compliance Checklist
- [ ] Reserve Bank of Malawi (RBM) payment regulations
- [ ] Data Protection Act compliance (customer data)
- [ ] PCI DSS Level 2 for payment processing
- [ ] ISO 27001 information security standards
- [ ] LPG safety regulations for remote valve control

---

## Testing Strategy

### Unit Tests
```typescript
// PayChangu Service Tests
- initiatePayment() - valid parameters
- initiatePayment() - invalid amount
- processWebhook() - valid signature
- processWebhook() - invalid signature
- reconcilePendingTransactions() - timeout handling

// Hardware Adapter Tests
- parseTelemetry() - valid packet
- parseTelemetry() - malformed data
- sendCommand() - valve control
- syncCredit() - network failure retry
```

### Integration Tests
```typescript
// End-to-End Flows
- POS sale → PayChangu → webhook → GL posting
- PAYC top-up → PayChangu → hardware sync
- Failed payment → retry logic
- Refund processing
- Settlement reconciliation
```

### Manual Testing Scenarios
1. **Payment Methods**
   - Airtel Money USSD
   - TNM Mpamba USSD
   - Card payment (Visa/Mastercard)
   - Bank transfer

2. **Edge Cases**
   - Network timeout during payment
   - Duplicate webhook delivery
   - Customer abandons payment
   - Meter offline during credit sync

3. **Load Testing**
   - 100 concurrent payment initiations
   - 1000 telemetry packets per minute
   - Webhook processing under load

---

## Deployment Strategy

### Pre-Deployment Checklist
- [ ] All tests passing (unit + integration + e2e)
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] PayChangu production credentials obtained
- [ ] Webhook endpoint exposed and secured
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Team training completed

### Deployment Steps

#### 1. Database Migration
```bash
npm run migration:run
# Creates:
# - paychangu_transactions table
# - paychangu_webhooks table
# - payc_hardware_commands table (if needed)
```

#### 2. Backend Deployment
```bash
# Build
cd backend && npm run build

# Deploy to production
docker compose -f docker-compose.prod.yml up -d --build

# Verify
curl https://erp.harotiholdingslimited.com/api/health
```

#### 3. Webhook Registration
```bash
# Register webhook URL with PayChangu
curl -X POST https://api.paychangu.com/v1/webhooks \
  -H "Authorization: Bearer $PAYCHANGU_API_KEY" \
  -d '{
    "url": "https://erp.harotiholdingslimited.com/api/paychangu/webhook",
    "events": ["payment.completed", "payment.failed"]
  }'
```

#### 4. Frontend Deployment
```bash
cd frontend && npm run build
# Deploy to CDN or serve via Nginx
```

#### 5. Post-Deployment Verification
- [ ] Test payment in production (small amount)
- [ ] Verify webhook delivery
- [ ] Check GL entries posted correctly
- [ ] Monitor logs for errors
- [ ] Test PAYC credit sync

### Rollback Procedure
1. Revert Docker containers to previous version
2. Database migration rollback if schema changes
3. Notify PayChangu to disable webhooks
4. Switch frontend to previous version

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PayChangu API downtime | Medium | High | Queue payments, retry logic, fallback to manual |
| Webhook delivery failure | Medium | Medium | Poll API for status, idempotent processing |
| Hardware communication loss | High | Medium | Store-and-forward telemetry, local meter memory |
| Duplicate payment processing | Low | High | Idempotency keys, transaction locking |
| Security breach | Low | Critical | Encryption, signature verification, audit logs |
| Incorrect credit calculation | Medium | High | Extensive testing, manual reconciliation tool |
| Customer disputes | Medium | Medium | Audit trail, support portal, refund workflow |

---

## Timeline & Milestones

### Phase 1: PayChangu Integration

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| 1 | Research & Setup | API credentials, schema design |
| 2 | Backend Core | PaychanguService, entities, webhook |
| 3 | Frontend Integration | Payment UI, POS updates |
| 4 | Testing & QA | Test report, security audit |

**Phase 1 Go-Live**: End of Week 4

### Phase 2: PAYC Hardware Integration

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| 5 | Hardware Discovery | Adapter design, protocol doc |
| 6 | Backend Implementation | Hardware service, commands |
| 7 | Integration Testing | End-to-end test results |
| 8 | UI & Monitoring | Hardware dashboard |

**Phase 2 Go-Live**: End of Week 8

### Post-Launch (Weeks 9-12)
- Monitor production performance
- Gather user feedback
- Iterative improvements
- Documentation updates
- Team training workshops

---

## Success Metrics

### Payment Gateway (PayChangu)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Payment Success Rate | >95% | Completed / Initiated |
| Average Confirmation Time | <30s | Webhook received - initiated |
| Reconciliation Accuracy | 100% | Matched / Total transactions |
| Manual Intervention Rate | <5% | Manual reviews / Total |
| Customer Satisfaction | >4.5/5 | NPS survey |

### PAYC Hardware Integration

| Metric | Target | Measurement |
|--------|--------|-------------|
| Telemetry Delivery Rate | >98% | Received / Expected |
| Credit Sync Success Rate | >99% | Confirmed / Attempted |
| Meter Uptime | >95% | Online time / Total time |
| Command Response Time | <10s | ACK received - sent |
| Tamper Alert Response | <5min | Staff notified - detected |

### Business Impact

| Metric | Target | Measurement |
|--------|--------|-------------|
| Digital Payment Adoption | 60% of sales | Digital / Total sales |
| PAYC Customer Growth | +50% in 6 months | New PAYC customers |
| Revenue Growth (PAYC) | +30% in 6 months | PAYC revenue trend |
| Operational Cost Savings | -20% reconciliation time | Time saved / week |

---

## Appendices

### A. PayChangu API Endpoints (Example)

```
POST /v1/payments/initiate
GET  /v1/payments/{transactionId}/status
POST /v1/refunds
GET  /v1/settlements/{date}
POST /v1/webhooks/register
```

### B. PAYC Hardware Data Schema (Example)

```json
{
  "meterSerial": "PAYC-SAL01-00123",
  "timestamp": "2026-08-17T18:30:00Z",
  "creditRemainingKg": 4.5,
  "dailyBurnKg": 0.8,
  "cumulativeBurnKg": 145.6,
  "valveOpen": true,
  "batteryLevel": 87,
  "signalStrength": -65,
  "tamperDetected": false,
  "errorCodes": []
}
```

### C. Environment Variables Reference

```bash
# PayChangu
PAYCHANGU_API_KEY=
PAYCHANGU_SECRET_KEY=
PAYCHANGU_MERCHANT_ID=
PAYCHANGU_WEBHOOK_SECRET=
PAYCHANGU_BASE_URL=
PAYCHANGU_ENVIRONMENT=

# PAYC Hardware
PAYC_HARDWARE_API_KEY=
PAYC_HARDWARE_BASE_URL=
PAYC_MQTT_BROKER=
PAYC_MQTT_USERNAME=
PAYC_MQTT_PASSWORD=
PAYC_TELEMETRY_INTERVAL=300
```

### D. Database Schema Changes

```sql
-- PayChangu Transactions
CREATE TABLE paychangu_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref VARCHAR(100) UNIQUE NOT NULL,
  internal_ref VARCHAR(100) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  status VARCHAR(30) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  paychangu_reference VARCHAR(100),
  callback_url VARCHAR(255),
  completed_at TIMESTAMP,
  metadata JSONB,
  sale_id UUID REFERENCES sales(id),
  payc_meter_id UUID REFERENCES payc_meters(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PayChangu Webhooks
CREATE TABLE paychangu_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(60) NOT NULL,
  transaction_ref VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PAYC Hardware Commands (Optional)
CREATE TABLE payc_hardware_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID REFERENCES payc_meters(id),
  command_type VARCHAR(30) NOT NULL,
  payload JSONB,
  status VARCHAR(30) NOT NULL,
  sent_at TIMESTAMP,
  ack_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_paychangu_txn_ref ON paychangu_transactions(transaction_ref);
CREATE INDEX idx_paychangu_txn_status ON paychangu_transactions(status);
CREATE INDEX idx_paychangu_webhook_processed ON paychangu_webhooks(processed);
CREATE INDEX idx_payc_cmd_status ON payc_hardware_commands(status);
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-17 | Integration Team | Initial plan |

**Review Cycle**: This document should be reviewed weekly during implementation and updated as new information becomes available.

**Sign-off Required**:
- [ ] Technical Lead
- [ ] Operations Manager
- [ ] Finance Manager
- [ ] Director

---

**End of Integration Plan**
