require('dotenv').config();
const http = require('http');
const app = require('./app');
const setupSocket = require('./socket');
const InMemoryStore = require('./store/InMemoryStore');
const BidService = require('./services/BidService');
const TimerService = require('./services/TimerService');
const UserService = require('./services/UserService');
const seedData = require('./data/seedData');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize data store
    const store = new InMemoryStore();

    // Load existing data or seed new data
    await store.load();

    if (store.auctions.size === 0) {
      await seedData(store);
      console.log('✅ Seeded initial auction data');
    }

    // Initialize services
    const userService = new UserService(store);
    const bidService = new BidService(store);

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Setup Socket.IO
    const io = setupSocket(httpServer, {
      store,
      bidService,
      userService
    });

    // Initialize timer service (needs io for broadcasts)
    const timerService = new TimerService(store, io);
    await timerService.initializeTimers();

    // Make services available to routes
    app.locals.services = {
      store,
      bidService,
      userService,
      timerService
    };

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 ${store.auctions.size} auctions loaded`);
      console.log(`⏰ ${timerService.timers.size} timers active`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await store.save();
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT received, saving data...');
      await store.save();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
