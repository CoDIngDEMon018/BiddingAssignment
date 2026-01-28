const express = require('express');
const router = express.Router();

// In-memory metrics storage
const metrics = {
    bids: {
        total: 0,
        successful: 0,
        failed: 0,
        rateLimited: 0,
        processingTimes: []
    },
    connections: {
        current: 0,
        peak: 0,
        total: 0
    },
    startTime: Date.now()
};

// Helper to calculate percentile
function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

// GET /api/metrics - Performance metrics dashboard
router.get('/metrics', (req, res) => {
    const uptime = Date.now() - metrics.startTime;
    const processingTimes = metrics.bids.processingTimes;

    res.json({
        success: true,
        data: {
            uptime: {
                ms: uptime,
                formatted: formatUptime(uptime)
            },
            bids: {
                total: metrics.bids.total,
                successful: metrics.bids.successful,
                failed: metrics.bids.failed,
                rateLimited: metrics.bids.rateLimited,
                successRate: metrics.bids.total > 0
                    ? ((metrics.bids.successful / metrics.bids.total) * 100).toFixed(2) + '%'
                    : 'N/A'
            },
            performance: {
                avgProcessingTime: processingTimes.length > 0
                    ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(2) + 'ms'
                    : 'N/A',
                p95ProcessingTime: percentile(processingTimes, 95).toFixed(2) + 'ms',
                p99ProcessingTime: percentile(processingTimes, 99).toFixed(2) + 'ms'
            },
            connections: {
                current: metrics.connections.current,
                peak: metrics.connections.peak,
                total: metrics.connections.total
            },
            serverTime: Date.now()
        }
    });
});

// Helper to format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

// Export metrics object for use in other modules
router.recordBid = (success, processingTime, wasRateLimited = false) => {
    metrics.bids.total++;
    if (success) {
        metrics.bids.successful++;
    } else {
        metrics.bids.failed++;
    }
    if (wasRateLimited) {
        metrics.bids.rateLimited++;
    }

    // Keep last 1000 processing times
    metrics.bids.processingTimes.push(processingTime);
    if (metrics.bids.processingTimes.length > 1000) {
        metrics.bids.processingTimes.shift();
    }
};

router.recordConnection = (isConnect) => {
    if (isConnect) {
        metrics.connections.current++;
        metrics.connections.total++;
        if (metrics.connections.current > metrics.connections.peak) {
            metrics.connections.peak = metrics.connections.current;
        }
    } else {
        metrics.connections.current = Math.max(0, metrics.connections.current - 1);
    }
};

module.exports = router;
