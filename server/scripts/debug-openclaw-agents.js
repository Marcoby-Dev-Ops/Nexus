const { OpenClawRuntimeAdapter } = require('./src/services/agentRuntime/openclawRuntimeAdapter');

async function main() {
    process.env.OPENCLAW_API_KEY = 'sk-openclaw-local'; // Ensure key is set
    const adapter = new OpenClawRuntimeAdapter({
        baseUrl: 'http://openclaw:18790/v1'
    });

    try {
        console.log('Fetching agents...');
        const response = await adapter.listAgents();
        if (!response.ok) {
            console.error('Failed to list agents:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text.substring(0, 500)); // First 500 chars
            return;
        }

        const data = await response.json();
        console.log('Agents:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
