const jwt = require('jsonwebtoken');

// Simulation of the manual decoding logic in src/middleware/auth.js
function simulateValidateJWTToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode payload
        // This is what auth.js does:
        const payloadStr = Buffer.from(parts[1], 'base64').toString();
        console.log('Decoded Payload String:', payloadStr);

        const payload = JSON.parse(payloadStr);

        const externalUserId = payload.sub;
        if (!externalUserId) {
            throw new Error('No user ID found in token');
        }

        return { externalUserId, payload };
    } catch (error) {
        console.error('Validation failed:', error.message);
        throw error;
    }
}

// Test with a realistic payload from verify-integration.js
const testPayload = {
    sub: 'openclaw-system-user',
    email: 'openclaw@system.local',
    role: 'user',
    id: 'openclaw-system-user'
};

const secret = 'nexus_test_secret_2026';
const token = jwt.sign(testPayload, secret);

console.log('Generated Token:', token);
console.log('Token Parts[1] (Payload):', token.split('.')[1]);

try {
    const result = simulateValidateJWTToken(token);
    console.log('Success!', result);
} catch (e) {
    console.log('Reproduction Successful!');
}
