/**
 * E2E Test Script for Live Bidding Platform
 * 
 * Run with: node tests/e2e.test.js
 * 
 * Prerequisites:
 * - Backend running on port 3000
 * - This is a simple test script, not using a testing framework
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';
let testResults = [];
let token = null;
let userId = null;

// Helper: Make HTTP request
function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Test runner
async function runTest(name, testFn) {
    try {
        await testFn();
        testResults.push({ name, passed: true });
        console.log(`✅ ${name}`);
    } catch (error) {
        testResults.push({ name, passed: false, error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

// Assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// ============ TESTS ============

async function testHealthCheck() {
    const { status, data } = await request('GET', '/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', 'Health check should return ok');
}

async function testLogin() {
    const { status, data } = await request('POST', '/auth/login', {
        username: 'test_user_' + Date.now()
    });

    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Login should succeed');
    assert(data.data.token, 'Should return token');
    assert(data.data.user.id, 'Should return user id');

    token = data.data.token;
    userId = data.data.user.id;
}

async function testLoginValidation() {
    const { status, data } = await request('POST', '/auth/login', {
        username: 'a'  // Too short
    });

    assert(status === 400, `Expected 400 for invalid username, got ${status}`);
    assert(data.success === false, 'Should fail for short username');
}

async function testGetItems() {
    const { status, data } = await request('GET', '/api/items');

    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(Array.isArray(data.data), 'Should return array of items');
    assert(data.data.length > 0, 'Should have at least one item');

    // Verify item structure
    const item = data.data[0];
    assert(item.id, 'Item should have id');
    assert(item.title, 'Item should have title');
    assert(typeof item.currentBid === 'number', 'Item should have currentBid');
    assert(typeof item.endTime === 'number', 'Item should have endTime');
}

async function testGetTime() {
    const before = Date.now();
    const { status, data } = await request('GET', '/api/time');
    const after = Date.now();

    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(typeof data.data.serverTime === 'number', 'Should return serverTime');

    // Server time should be within 1 second of client time
    const serverTime = data.data.serverTime;
    assert(serverTime >= before - 1000 && serverTime <= after + 1000,
        'Server time should be roughly in sync with client');
}

async function testTokenVerification() {
    const { status, data } = await request('GET', '/auth/verify', null, {
        'Authorization': `Bearer ${token}`
    });

    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Should verify token');
    assert(data.data.userId === userId, 'Should return correct userId');
}

async function testInvalidToken() {
    const { status, data } = await request('GET', '/auth/verify', null, {
        'Authorization': 'Bearer invalid_token'
    });

    assert(status === 401, `Expected 401 for invalid token, got ${status}`);
    assert(data.success === false, 'Should fail for invalid token');
}

async function testMetrics() {
    const { status, data } = await request('GET', '/api/metrics');

    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(data.data.uptime, 'Should have uptime');
    assert(data.data.bids, 'Should have bids metrics');
    assert(data.data.connections, 'Should have connection metrics');
}

// ============ MAIN ============

async function runAllTests() {
    console.log('\n🧪 Running E2E Tests...\n');
    console.log('='.repeat(50));

    await runTest('Health Check', testHealthCheck);
    await runTest('Login with valid username', testLogin);
    await runTest('Login validation (short username)', testLoginValidation);
    await runTest('Get auction items', testGetItems);
    await runTest('Get server time', testGetTime);
    await runTest('Token verification', testTokenVerification);
    await runTest('Invalid token rejection', testInvalidToken);
    await runTest('Metrics endpoint', testMetrics);

    console.log('='.repeat(50));

    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
        console.log('Failed tests:');
        testResults.filter(t => !t.passed).forEach(t => {
            console.log(`  - ${t.name}: ${t.error}`);
        });
        process.exit(1);
    }

    console.log('✨ All tests passed!\n');
    process.exit(0);
}

// Run tests
runAllTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
