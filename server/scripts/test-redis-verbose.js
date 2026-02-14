const { createClient } = require('redis');

// Explicit config instead of URL string to avoid parsing ambiguity
const config = {
    socket: {
        host: '172.18.0.13',
        port: 6379,
        connectTimeout: 5000
    },
    password: 'kVq23PDa9He8Z6WRBrY6MuFazJLNmivrfcvNPPCX9b2GD1q6hemhPQYGcKLJNjqT'
};

async function test() {
    console.log('Creating client with config:', JSON.stringify(config, null, 2));
    const client = createClient(config);

    client.on('error', err => console.error('Redis Client Error', err));
    client.on('connect', () => console.log('Redis Client Connected'));
    client.on('ready', () => console.log('Redis Client Ready'));

    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected! PINGing...');
        const pong = await client.ping();
        console.log('PING response:', pong);
        await client.quit();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

test();
