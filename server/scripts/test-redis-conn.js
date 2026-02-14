const net = require('net');
const client = new net.Socket();
const IP = '172.18.0.13';
const PORT = 6379;

console.log(`Attempting to connect to ${IP}:${PORT}...`);

client.connect(PORT, IP, () => {
    console.log('Connected to Dragonfly/Redis successfully via TCP!');
    client.destroy();
});

client.on('error', (err) => {
    console.error('Connection failed:', err.message);
    client.destroy();
});

client.on('timeout', () => {
    console.error('Connection timed out');
    client.destroy();
});
