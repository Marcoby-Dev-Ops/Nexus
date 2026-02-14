const http = require('http');

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = 'localhost';

const postData = JSON.stringify({
    messages: [{ role: 'user', content: 'Hello, are you working?' }],
    stream: true,
    userId: 'test-user',
    conversationId: 'test-conv-id',
    agentId: 'nexus-assistant'
});

const options = {
    hostname: HOST,
    port: PORT,
    path: '/api/ai/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer test-token' // Mock token, middleware might reject if not mocked or valid
    }
};

console.log(`Connecting to http://${HOST}:${PORT}/api/ai/chat...`);
const startTime = Date.now();
let firstByteTime = null;

const req = http.request(options, (res) => {
    firstByteTime = Date.now();
    const ttfb = firstByteTime - startTime;
    console.log(`Response headers received in ${ttfb}ms`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        const elapsed = Date.now() - startTime;
        console.log(`[${elapsed}ms] Received chunk: ${chunk.length} bytes`);
        console.log(chunk.toString().split('\n').filter(l => l.trim()).join('\n'));
    });

    res.on('end', () => {
        console.log('Stream ended');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
