# SecondStriker ⚽

> Full-stack e-sports tournament platform with integrated M-Pesa payments for entry fees and automated prize distribution.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://secondstriker.vercel.app)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live Demo**: [secondstriker.vercel.app](https://secondstriker.vercel.app)  
**Test Login**: Username: `Khamzat` | Password: `mypassword`

---

## 🎯 What This Project Demonstrates

SecondStriker showcases production-grade backend engineering skills:

- ✅ **Payment Integration**: M-Pesa Daraja API with webhook-based reconciliation
- ✅ **Financial Transactions**: Idempotent operations, race condition handling, async flows
- ✅ **Microservices Architecture**: Separation of concerns (payments, notifications, business logic)
- ✅ **REST API Design**: JWT authentication, WebSockets, database optimization
- ✅ **Full-Stack Development**: Node.js backend + Vue.js/Quasar frontend

This is a **portfolio project** built to demonstrate backend engineering capabilities for tournament management and fintech applications.

---

## 📸 Screenshots

> **Note**: Add 3-4 screenshots here showing:
> 1. Tournament dashboard
> 2. Wallet interface (deposit/withdraw)
> 3. Match results/standings
> 4. Admin panel (if exists)

*[Screenshots to be added]*

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue.js Frontend (Quasar)                 │
│          (Tournament UI, Wallet, Match Management)          │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSockets
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Node.js/Express Backend                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Auth       │  │  Tournament  │  │  Wallet         │   │
│  │  Service    │  │  Service     │  │  Service        │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                          │                                  │
│                          ▼                                  │
│              ┌────────────────────────┐                     │
│              │   MongoDB Database     │                     │
│              │  (Users, Tournaments,  │                     │
│              │   Transactions, Teams) │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Webhooks (Callbacks)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              M-Pesa Daraja API (Safaricom)                  │
│         STK Push (Deposits) + B2C (Withdrawals)             │
└─────────────────────────────────────────────────────────────┘
```

**Key Technical Decisions:**
- **MongoDB transactions** for financial consistency (ACID guarantees)
- **Webhook-based async flows** for M-Pesa callbacks
- **JWT authentication** with secure token management
- **WebSockets** for real-time tournament updates

📄 **Detailed Architecture**: See [docs/architecture.md](docs/architecture.md)

---

## 🚀 Features

### Tournament Management
- ✅ Create and manage leagues (round-robin fixtures)
- ✅ Single-elimination tournament brackets
- ✅ Real-time match updates and standings
- ✅ Player and team statistics tracking

### Wallet System (M-Pesa Integration)
- ✅ **Deposits**: STK Push for instant mobile money deposits
- ✅ **Withdrawals**: B2C automated payouts to mobile numbers
- ✅ **Entry Fees**: Automatic deduction for tournament registration
- ✅ **Prize Distribution**: Automated winner payouts
- ✅ **Transaction History**: Complete audit trail

### User Features
- ✅ Secure authentication (JWT-based)
- ✅ User profiles and statistics
- ✅ Real-time notifications
- ✅ Responsive UI (desktop + mobile)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js + JWT
- **Payments**: M-Pesa Daraja API (STK Push + B2C)
- **Real-time**: WebSockets (Socket.io)
- **Logging**: Winston
- **Email**: Nodemailer

### Frontend
- **Framework**: Vue.js 3
- **UI Framework**: Quasar Framework
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Build Tool**: Vite

### DevOps
- **Version Control**: Git/GitHub
- **Deployment**: Vercel (frontend), separate backend hosting
- **CI/CD**: GitHub Actions (optional)

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- M-Pesa Developer Account (for payment testing)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/ddhadho/secondstriker.git
cd secondstriker/server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and M-Pesa credentials

# Start development server
npm run dev
```

**Environment Variables** (`.env`):
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/secondstriker
JWT_SECRET=your_jwt_secret_here

# M-Pesa (Daraja API)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_security_credential

# Server
BASE_URL=http://localhost:3000
PORT=3000
```

### Frontend Setup

```bash
cd ../ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:9000`

### Testing M-Pesa Integration

**Sandbox Credentials** (for development):
- Use Safaricom test phone numbers
- Shortcode: `174379` (paybill)
- See [M-Pesa Sandbox Guide](https://developer.safaricom.co.ke/sandbox)

---

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run with coverage
npm run test:coverage
```

**Test Coverage** (current):
- Controllers: ~70%
- Services: ~65%
- Models: ~80%

---

## 📖 API Documentation

### Authentication
```
POST /api/auth/register   - Register new user
POST /api/auth/login      - Login user
GET  /api/auth/profile    - Get user profile (protected)
```

### Wallet Operations
```
POST /api/wallet/deposit      - Initiate M-Pesa deposit
POST /api/wallet/withdraw     - Request withdrawal
GET  /api/wallet/balance      - Get wallet balance
GET  /api/wallet/transactions - Get transaction history
```

### M-Pesa Webhooks (Internal)
```
POST /api/mpesa/callback     - STK Push callback
POST /api/mpesa/b2c/result   - B2C result callback
POST /api/mpesa/b2c/queue    - B2C timeout callback
```

📄 **Full API Reference**: See [docs/api.md](docs/api.md)

---

## 🎓 What I Learned

Building SecondStriker taught me critical production engineering lessons:

### 1. **Payment System Reliability**
- Idempotency is non-negotiable for financial transactions
- Always use database transactions (ACID) for money operations
- Race conditions are real - test concurrent requests
- Webhooks can arrive before API responses (design for this)

### 2. **M-Pesa Integration Challenges**
- Callbacks can fail - implement status polling as backup
- Error codes matter - map them to user-friendly messages
- Phone number formatting is trickier than it looks
- Test sandbox behavior differs from production

### 3. **Microservices Thinking**
- Separate concerns even in monolithic apps
- Payments, notifications, and business logic should be isolated
- Makes testing and debugging much easier

### 4. **Security Considerations**
- Never trust client-side validation for money amounts
- Webhook endpoints need authentication (IP whitelist + secrets)
- Store sensitive credentials securely (environment variables, never in code)

### 5. **Database Design**
- Use MongoDB transactions for multi-document operations
- Indexes matter for query performance (especially on foreign keys)
- Metadata fields help with debugging (store timestamps, IP addresses, etc.)

---

## 🔧 Known Limitations & Future Improvements

### Current Limitations
- M-Pesa sandbox testing only (production credentials required for live)
- No admin dashboard for tournament management
- Limited analytics/reporting features
- Email notifications not fully implemented

### Planned Improvements
- [ ] Add comprehensive test coverage (target: 90%)
- [ ] Implement caching layer (Redis) for frequently accessed data
- [ ] Add rate limiting to prevent API abuse
- [ ] Build admin dashboard for tournament operators
- [ ] Add fraud detection integration (see [FraudGuard project](https://github.com/ddhadho/fraudguard-ml))
- [ ] Implement real-time chat for tournament participants
- [ ] Add analytics dashboard (user retention, revenue metrics)

---

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -m 'Add improvement'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Omar Dhadho Said**

- GitHub: [@ddhadho](https://github.com/ddhadho)
- LinkedIn: [dhadho-said](https://linkedin.com/in/dhadho-said-2aa3ba386)
- Email: dhaddho24@gmail.com

---

## 🙏 Acknowledgments

- Safaricom Daraja API documentation
- M-Pesa developer community
- Quasar Framework team
- Node.js/Express ecosystem

---

## 📚 Related Projects

- **[FraudGuard-ML](https://github.com/ddhadho/fraudguard-ml)**: Real-time fraud detection system designed to integrate with payment platforms like SecondStriker
- **[CityHall](https://github.com/ddhadho/cityhall)**: Time-series database for storing transaction metrics and system performance data

---

**Built with ❤️ in Nairobi, Kenya**