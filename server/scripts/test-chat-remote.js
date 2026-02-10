const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://192.168.50.53:3001/api/ai/chat';
const JWT_SECRET = 'jwt_kK0kI7rQ3wG3y2XqD3WZ8vQe1H4mP0tJxkq3bS5mV8rC2nQ7yG6fT1pL9sU4aE0';

// Mock User Data matching Authentik structure
const user = {
    id: 'test-user-' + Date.now(),
    email: 'test@marcoby.com',
    role: 'user'
};

// Generate Token
const token = jwt.sign(
    {
        sub: user.id,
        email: user.email,
        role: user.role,
        iss: 'https://identity.marcoby.com/application/o/nexus/' // Matching expected issuer logic
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log('generated token:', token);

async function testChat() {
    console.log(`\nTesting Chat API: ${API_URL}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'What time is it?' }
                ],
                stream: false
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Raw text:', text);
        }

    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

testChat();
