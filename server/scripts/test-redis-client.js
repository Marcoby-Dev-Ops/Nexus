const { createClient } = require('redis');

const REDIS_URL = 'redis://:kVq23PDa9He8Z6WRBrY6MuFazJLNmivrfcvNPPCX9b2GD1q6hemhPQYGcKLJNjqT@172.18.0.13:6379/0';

async function test() {
    console.log('Creating client...');
    const client = createClient({
        url: REDIS_URL,
        socket: {
            connectTimeout: 5000
        }
    });

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
