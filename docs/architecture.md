# SecondStriker - Technical Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Models](#data-models)
6. [Authentication Flow](#authentication-flow)
7. [M-Pesa Integration](#mpesa-integration)
8. [Data Flow Examples](#data-flow-examples)
9. [Security Considerations](#security-considerations)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

SecondStriker is a full-stack tournament management platform with integrated M-Pesa mobile money payments. The system follows a **microservices-inspired monolithic architecture**, separating concerns into distinct service layers while maintaining deployment simplicity.

**Key Design Principles:**
- ✅ Separation of concerns (Auth, Tournament, Wallet as distinct services)
- ✅ RESTful API design with consistent response patterns
- ✅ Async payment flows with webhook-based reconciliation
- ✅ ACID transactions for financial operations (MongoDB transactions)
- ✅ Component-based frontend architecture for reusability

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│              (Vue.js + Quasar Framework)                 │
│   • Tournament UI  • Wallet Dashboard  • User Profiles  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ HTTPS (REST API + WebSockets)
                     │
┌────────────────────▼─────────────────────────────────────┐
│                  API Gateway Layer                       │
│                 (Express.js Routes)                      │
│   • Authentication  • Request Validation  • Routing     │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬────────────┐
        │                         │            │
┌───────▼────────┐   ┌───────────▼──────┐   ┌▼─────────────┐
│ Auth Service   │   │ Tournament       │   │ Wallet       │
│                │   │ Service          │   │ Service      │
│ • JWT tokens   │   │ • League mgmt    │   │ • Deposits   │
│ • User auth    │   │ • Fixtures       │   │ • Withdrawals│
│ • Permissions  │   │ • Results        │   │ • Balances   │
└────────┬───────┘   └──────────┬───────┘   └┬─────────────┘
         │                      │              │
         └──────────────────────┴──────────────┘
                                │
                   ┌────────────▼─────────────┐
                   │   Database Layer         │
                   │     (MongoDB)            │
                   │                          │
                   │ • Users Collection       │
                   │ • Leagues Collection     │
                   │ • Tournaments Collection │
                   │ • Transactions Collection│
                   │ • Fixtures Collection    │
                   └────────────┬─────────────┘
                                │
                   ┌────────────▼─────────────┐
                   │   External Services      │
                   │                          │
                   │ • M-Pesa Daraja API      │
                   │ • Email (Nodemailer)     │
                   └──────────────────────────┘
```

---

## Backend Architecture (`/server`)

The backend is a Node.js application built with Express.js, following a feature-oriented, MVC-like pattern responsible for business logic, data persistence, and API endpoints.

### Directory Structure

```
/server
├── /bin
│   └── www                    # Server entry point
├── /config
│   ├── config.js              # Database & environment config
│   └── email.js               # Email service configuration
├── /controllers
│   ├── AuthController.js      # User authentication logic
│   ├── LeagueController.js    # League management
│   ├── TournamentController.js # Tournament operations
│   ├── WalletController.js    # Payment processing
│   └── TransactionController.js # Transaction history
├── /middleware
│   ├── auth.js                # JWT verification middleware
│   └── validation.js          # Input validation
├── /models
│   ├── User.js                # User schema
│   ├── League.js              # League schema
│   ├── Tournament.js          # Tournament schema
│   ├── Fixture.js             # Match schema
│   ├── Transaction.js         # Financial transaction schema
│   └── JoinRequest.js         # League/tournament join requests
├── /routes
│   ├── auth.js                # Authentication endpoints
│   ├── leagues.js             # League endpoints
│   ├── tournaments.js         # Tournament endpoints
│   └── wallet.js              # Wallet & M-Pesa endpoints
├── /services
│   └── mpesaService.js        # M-Pesa API integration
├── /test
│   └── *.test.js              # Mocha/Chai tests
├── /utils
│   ├── logger.js              # Winston logging
│   └── validation.js          # Validation utilities
├── app.js                     # Express app configuration
└── db.js                      # MongoDB connection
```

### Service Layer Architecture

#### 1. Auth Service (`/controllers/AuthController.js`)

**Responsibilities:**
- User registration with bcrypt password hashing
- Login with JWT token generation
- Token validation and refresh
- User profile management

**Key Functions:**
```javascript
register(req, res)    // Create new user account
login(req, res)       // Authenticate and issue JWT
getProfile(req, res)  // Get authenticated user data
updateProfile(req, res) // Update user information
```

**Security:**
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens signed with secret key (7-day expiry)
- Refresh token mechanism (planned)

#### 2. Tournament Service (`/controllers/LeagueController.js`, `TournamentController.js`)

**Responsibilities:**
- League creation and fixture generation (round-robin algorithm)
- Tournament bracket management (single-elimination)
- Match result updates with automatic standings calculation
- Player and team statistics tracking

**Key Functions:**
```javascript
// League Management
createLeague(req, res)         // Create new league
generateFixtures(req, res)     // Generate round-robin schedule
updateMatchResult(req, res)    // Record match result
getStandings(req, res)         // Calculate league table

// Tournament Management
createTournament(req, res)     // Create knockout tournament
generateBracket(req, res)      // Generate tournament bracket
advanceWinner(req, res)        // Move winner to next round
```

**Algorithmic Details:**
- **Round-robin fixture generation**: Uses circle method algorithm to ensure fair scheduling
- **Standings calculation**: Points system (3-1-0), goal difference tie-breaker
- **Bracket generation**: Binary tree structure for knockout tournaments

#### 3. Wallet Service (`/controllers/WalletController.js`)

**Responsibilities:**
- Deposit initiation via M-Pesa STK Push
- Withdrawal processing via M-Pesa B2C
- Balance management with ACID guarantees
- Transaction history and reconciliation
- Webhook callback handling

**Key Functions:**
```javascript
deposit(req, res)              // Initiate M-Pesa deposit (STK Push)
withdraw(req, res)             // Process withdrawal (B2C)
getBalance(req, res)           // Get current wallet balance
getTransactions(req, res)      // Fetch transaction history
handleStkCallback(req, res)    // Handle deposit confirmation webhook
handleB2CResult(req, res)      // Handle withdrawal result webhook
```

**Critical Design Patterns:**
- **MongoDB Transactions**: Ensures atomicity for balance updates
- **Idempotency**: Prevents duplicate processing of webhooks
- **Async Flows**: Webhooks handle payment confirmation separately from API responses

---

## Frontend Architecture (`/ui`)

The frontend is a single-page application (SPA) built with Vue.js 3 and the Quasar framework, providing a rich and responsive user experience.

### Directory Structure

```
/ui
├── /src
│   ├── /boot
│   │   ├── axios.js           # Axios configuration with interceptors
│   │   └── pinia.js           # Pinia store initialization
│   ├── /components
│   │   ├── LeagueDetails.vue  # League information display
│   │   ├── TournamentBracket.vue # Tournament bracket visualization
│   │   ├── FixtureCard.vue    # Individual match display
│   │   ├── WalletBalance.vue  # Wallet balance widget
│   │   └── TransactionList.vue # Transaction history
│   ├── /css
│   │   └── app.scss           # Global styles
│   ├── /layouts
│   │   └── MainLayout.vue     # App layout with header/sidebar
│   ├── /pages
│   │   ├── LoginPage.vue      # Authentication page
│   │   ├── DashboardPage.vue  # User dashboard
│   │   ├── LeaguesPage.vue    # League listing
│   │   ├── CompetitionPage.vue # League/tournament details
│   │   ├── WalletPage.vue     # Wallet management
│   │   └── ProfilePage.vue    # User profile
│   ├── /router
│   │   └── routes.js          # Vue Router configuration
│   ├── /stores
│   │   ├── auth.js            # Authentication state (Pinia)
│   │   ├── competition.js     # Leagues/tournaments state
│   │   └── wallet.js          # Wallet state
│   └── /utils
│       └── api.js             # API client utilities
└── quasar.config.js           # Quasar framework configuration
```

### State Management (Pinia)

#### Auth Store (`/stores/auth.js`)

**Responsibilities:**
- Manage JWT token storage (localStorage)
- User authentication state
- Login/logout actions
- User profile caching

**State:**
```javascript
{
  user: null,           // Current user object
  token: null,          // JWT token
  isAuthenticated: false
}
```

**Actions:**
```javascript
login(credentials)     // Authenticate user
logout()               // Clear session
fetchProfile()         // Get user profile
```

#### Competition Store (`/stores/competition.js`)

**Responsibilities:**
- Manage leagues and tournaments data
- Cache competition details
- Handle fixtures and results

**State:**
```javascript
{
  leagues: [],          // List of leagues
  tournaments: [],      // List of tournaments
  selectedCompetition: null,
  fixtures: [],
  standings: []
}
```

**Actions:**
```javascript
fetchLeagues()         // Get all leagues
fetchLeagueDetails(id) // Get specific league
createLeague(data)     // Create new league
updateFixture(id, result) // Update match result
```

#### Wallet Store (`/stores/wallet.js`)

**Responsibilities:**
- Manage wallet balance
- Track transactions
- Handle deposit/withdrawal UI state

**State:**
```javascript
{
  balance: 0,
  transactions: [],
  pendingTransaction: null
}
```

**Actions:**
```javascript
fetchBalance()         // Get current balance
initiateDeposit(amount) // Start deposit flow
requestWithdrawal(amount) // Start withdrawal
fetchTransactions()    // Get transaction history
```

### Component Architecture

**Component Hierarchy Example:**
```
CompetitionPage.vue
├── CompetitionHeader.vue
├── LeagueDetails.vue
│   ├── TeamList.vue
│   └── StandingsTable.vue
├── LeagueFixtures.vue
│   └── FixtureCard.vue (repeated)
└── JoinCompetitionButton.vue
```

**Design Patterns:**
- **Container/Presentational**: Smart containers fetch data, presentational components receive props
- **Composition**: Small, focused components composed into larger features
- **Props Down, Events Up**: Unidirectional data flow

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  passwordHash: String (required),
  phoneNumber: String,      // For M-Pesa transactions
  balance: Number,           // Wallet balance (default: 0)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ email: 1 }` - Unique, for login lookups
- `{ username: 1 }` - Unique, for display
- `{ phoneNumber: 1 }` - For M-Pesa operations

### League Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  teams: [ObjectId],         // References to User
  entryFee: Number,
  prizePool: Number,
  status: String,            // 'upcoming' | 'active' | 'completed'
  fixtures: [ObjectId],      // References to Fixture
  standings: [               // Computed standings
    {
      team: ObjectId,
      played: Number,
      won: Number,
      drawn: Number,
      lost: Number,
      goalsFor: Number,
      goalsAgainst: Number,
      goalDifference: Number,
      points: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (required, ref: 'User'),
  type: String,              // 'deposit' | 'withdrawal'
  amount: Number (required),
  status: String,            // 'pending' | 'completed' | 'failed'
  mpesaRequestId: String,    // M-Pesa checkout/conversation ID
  originatorConversationId: String,
  description: String,
  metadata: {
    balanceBeforeTransaction: Number,
    phoneNumber: String,
    requestedAt: Date,
    completedAt: Date,
    failedAt: Date,
    failureReason: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ user: 1, createdAt: -1 }` - User transaction history
- `{ mpesaRequestId: 1 }` - Fast callback lookup
- `{ status: 1, createdAt: -1 }` - Pending transaction queries

### Fixture Model
```javascript
{
  _id: ObjectId,
  league: ObjectId (ref: 'League'),
  homeTeam: ObjectId (ref: 'User'),
  awayTeam: ObjectId (ref: 'User'),
  scheduledDate: Date,
  homeScore: Number,
  awayScore: Number,
  status: String,            // 'scheduled' | 'in_progress' | 'completed'
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────────────────┐
│   AuthController.login()        │
│   • Validate credentials        │
│   • Compare password hash       │
│   • Generate JWT token          │
└──────┬──────────────────────────┘
       │
       │ 2. Return JWT
       │    { token, user }
       ▼
┌─────────────┐
│   Client    │
│   Stores    │
│   token in  │
│   localStorage
└──────┬──────┘
       │
       │ 3. Subsequent requests
       │    Authorization: Bearer {token}
       ▼
┌─────────────────────────────────┐
│   auth.js Middleware            │
│   • Verify JWT signature        │
│   • Decode user ID              │
│   • Attach user to req.user     │
└──────┬──────────────────────────┘
       │
       │ 4. Request proceeds
       │    to protected route
       ▼
┌─────────────────────────────────┐
│   Protected Controller          │
│   • Access req.user             │
│   • Execute business logic      │
└─────────────────────────────────┘
```

**Security Features:**
- ✅ Passwords never stored in plaintext (bcrypt hashing)
- ✅ JWT tokens expire after 7 days
- ✅ Token verification on every protected route
- ✅ User ID embedded in token (no database lookup per request)

---

## M-Pesa Integration

### STK Push Flow (Deposits)

```
User → Frontend → Backend → M-Pesa → User's Phone → M-Pesa → Backend
  1. User clicks "Deposit 500 KES"
  2. Frontend: POST /api/wallet/deposit { amount: 500 }
  3. Backend: WalletController.deposit()
     - Creates Transaction (status: 'pending')
     - Calls mpesaService.stkPush()
  4. M-Pesa: Sends STK prompt to user's phone
  5. User: Enters M-Pesa PIN
  6. M-Pesa: POST /api/mpesa/callback (webhook)
  7. Backend: WalletController.handleStkCallback()
     - Updates user.balance += 500
     - Updates transaction.status = 'completed'
```

### B2C Flow (Withdrawals)

```
User → Frontend → Backend → M-Pesa (async) → Backend
  1. User requests withdrawal of 200 KES
  2. Frontend: POST /api/wallet/withdraw { amount: 200 }
  3. Backend: WalletController.withdraw()
     - Creates Transaction (status: 'pending')
     - Deducts user.balance -= 200
     - Calls mpesaService.bulkPayment()
  4. M-Pesa: Processes payment asynchronously
  5. M-Pesa: POST /api/mpesa/b2c/result (webhook)
  6. Backend: WalletController.handleB2CResult()
     - If success: transaction.status = 'completed'
     - If failed: refund user.balance += 200, transaction.status = 'failed'
```

**Key Technical Decisions:**
- **Async processing**: Webhooks handle confirmation separately from initial API response
- **ACID transactions**: MongoDB transactions ensure balance consistency
- **Idempotency**: CheckoutRequestID prevents duplicate processing
- **Error handling**: Failed withdrawals are automatically refunded

---

## Data Flow Examples

### Example: User Joins Tournament

```
1. User clicks "Join Tournament" (Entry fee: 100 KES)

2. Frontend → Backend
   POST /api/tournaments/{id}/join
   Headers: Authorization: Bearer {jwt}

3. TournamentController.joinTournament()
   - Starts MongoDB transaction session
   - Checks: user.balance >= 100
   - Deducts: user.balance -= 100
   - Creates: Transaction (type: 'tournament_entry')
   - Adds: user to tournament.participants[]
   - Commits transaction

4. Backend → Frontend
   Response: { success: true, newBalance: 400 }

5. Frontend updates UI
   - Wallet store updates balance
   - Competition store adds user to participants
   - Shows success notification
```

---

## Security Considerations

### 1. Authentication & Authorization
- ✅ JWT-based authentication with expiry
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Protected routes via middleware
- ⚠️ Role-based access control (planned)

### 2. Financial Security
- ✅ MongoDB ACID transactions for balance operations
- ✅ Balance validation before withdrawals
- ✅ Complete audit trail in Transaction collection
- ⚠️ Idempotency keys for duplicate prevention (planned)
- ⚠️ Webhook authentication (IP whitelist + secret token - planned)

### 3. API Security
- ✅ Input validation using express-validator
- ✅ CORS configuration
- ✅ HTTPS in production
- ⚠️ Rate limiting (planned)
- ⚠️ Request size limits (planned)

### 4. Data Protection
- ✅ Environment variables for secrets
- ✅ Sensitive data never logged
- ✅ Database credentials not in code
- ⚠️ Encryption at rest (MongoDB Atlas default)

---

## Deployment Architecture

### Development Environment
```
http://localhost:9000 (Frontend - Vite)
         ↓
http://localhost:3000 (Backend - Express)
         ↓
mongodb://localhost:27017 (Database)
         ↓
M-Pesa Sandbox API (Testing)
```

### Production Environment
```
https://secondstriker.vercel.app (Frontend)
         ↓ HTTPS
https://secondstriker.onrender.com (Backend)
         ↓ TLS
MongoDB Atlas (Database)
         ↓ HTTPS
M-Pesa Production API
```

**Environment Variables:**
- `NODE_ENV`: development | production
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: Token signing key
- `MPESA_*`: M-Pesa API credentials

---

## Known Technical Debt & Future Improvements

### Current Limitations
1. ❌ **Webhook security**: No authentication on M-Pesa callbacks
2. ❌ **Race conditions**: Withdrawal flow needs improvement
3. ❌ **Test coverage**: ~70%, target is 90%
4. ❌ **Caching**: No caching layer (Redis planned)
5. ❌ **Monitoring**: No APM or metrics dashboard

### Planned Enhancements
1. ✅ Fraud detection integration-fraudguard-ml
2. ✅ Implement Redis caching for frequently accessed data
3. ✅ Add comprehensive error tracking (Sentry)
4. ✅ Build admin dashboard for tournament management
5. ✅ Add real-time chat for participants (Socket.io)
6. ✅ Implement background job queue (Bull/Redis)

---

**Last Updated**: December 2024  
**Author**: Omar Dhadho Said  
**GitHub**: [github.com/ddhadho/secondstriker](https://github.com/ddhadho/secondstriker)