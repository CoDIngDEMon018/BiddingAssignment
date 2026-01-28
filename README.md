# 🔨 Live Auction Platform

A real-time auction platform where users compete to buy items in the final seconds. Built with Node.js, Socket.IO, and React.

![Live Auction Platform](https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80)

## ✨ Features

- **Real-Time Bidding** - Instant bid updates via WebSocket
- **Race Condition Safe** - Atomic bid processing prevents double-bidding
- **Synchronized Timers** - Server-synced countdown prevents cheating
- **Premium UI** - Adrenaline Luxury dark theme with animations
- **Anti-Snipe** - Auctions extend by 30 seconds on last-minute bids
- **Docker Ready** - One-command deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/live-auction-platform.git
   cd live-auction-platform
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend runs on http://localhost:3000

3. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:5173

4. **Open the app** at http://localhost:5173

### Docker Deployment

```bash
docker-compose up --build
```

Access the app at http://localhost

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  - ItemGrid with live countdown timers                  │
│  - Socket.IO client for real-time updates               │
│  - Framer Motion animations                              │
└──────────────────┬──────────────────────────────────────┘
                   │ WebSocket + REST
┌──────────────────▼──────────────────────────────────────┐
│              Node.js + Express Backend                   │
│  - REST API: GET /items, POST /auth/login               │
│  - Socket.IO: BID_PLACED, UPDATE_BID, AUCTION_END       │
│  - Atomic bid processing with locks                     │
│  - Server-synced timers                                  │
└─────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all auction items |
| GET | `/api/time` | Get server time for sync |
| POST | `/auth/login` | Login with username |

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `BID_PLACED` | Client → Server | Place a new bid |
| `UPDATE_BID` | Server → All | Broadcast new bid to everyone |
| `BID_SUCCESS` | Server → Client | Confirm bid was accepted |
| `BID_ERROR` | Server → Client | Bid was rejected |
| `AUCTION_END` | Server → All | Auction has ended |
| `TIME_SYNC` | Server → Client | Server timestamp for clock sync |

## 🔒 Race Condition Handling

The platform uses an atomic lock mechanism to prevent race conditions:

```javascript
// When two users bid at the same millisecond:
User A: BID_PLACED $150 ──→ ✓ Lock acquired → Bid accepted
User B: BID_PLACED $150 ──→ ✗ Lock held → BID_IN_PROGRESS error
```

Only the first bid is accepted; the second user receives immediate feedback.

## ⏱️ Timer Synchronization

1. Client requests `TIME_SYNC` on connection
2. Server responds with current timestamp
3. Client calculates offset: `serverTime - clientTime`
4. All countdowns use: `endTime - (Date.now() + offset)`

This prevents client-side timer manipulation.

## 🎨 Design System

**Theme: Adrenaline Luxury**
- Primary: Deep Navy (#0A0E27)
- Accent: Gold (#FFC933)
- Winning: Electric Green (#00FF94)
- Outbid: Electric Pink (#FF3366)

**Animations:**
- Bid Flash - Cards pulse when new bids arrive
- Countdown Pulse - Timer accelerates as time runs out
- Winning Glow - Cards breathe when you're winning
- Staggered Entry - Cards animate in sequence

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── app.js              # Express setup
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # Business logic
│   │   ├── socket/             # Socket.IO handlers
│   │   ├── store/              # In-memory data store
│   │   └── data/               # Seed data
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main component
│   │   ├── components/         # React components
│   │   ├── utils/              # Socket & API
│   │   └── index.css           # Global styles
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🧪 Testing

### Manual Testing

1. Open http://localhost:5173 in Browser 1, login as "alice"
2. Open same URL in incognito, login as "bob"
3. Click "Bid +$10" in Browser 1
4. Verify Browser 2 sees instant price update with green flash
5. Click "Bid +$10" in Browser 2
6. Verify badges update: Browser 2 shows "Winning", Browser 1 shows "Outbid"

### Testing Race Conditions

Open 3+ browser tabs and click bid buttons simultaneously. Only one bid should succeed per click attempt.

## 🚢 Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node src/server.js`
4. Add environment variables:
   - `JWT_SECRET`: Strong secret key
   - `CORS_ORIGIN`: Your frontend URL
5. Deploy

### Frontend (Vercel)

1. Import repository on Vercel
2. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
3. Add environment variable:
   - `VITE_API_URL`: Your backend URL
4. Deploy

## 📝 Environment Variables

### Backend
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend
```env
VITE_API_URL=https://your-backend.onrender.com
```

## 🛡️ Security Features

- JWT authentication for all socket connections
- Input validation on all endpoints
- Helmet.js security headers
- CORS protection
- Rate limiting (configurable)

## 📄 License

MIT License - Feel free to use for your projects!

---

Built with ❤️ for the Live Bidding Platform assessment
