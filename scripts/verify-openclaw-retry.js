const { NexusAIGatewayService } = require('../server/services/NexusAIGatewayService.js');

// Mock successful logger
const mockLogger = {
    info: () => { },
    warn: (msg) => console.log(`[WARN] ${msg}`), // Log warnings to see retries
    error: (msg) => console.log(`[ERROR] ${msg}`),
    debug: () => { }
};

// Mock the logger module
require.cache[require.resolve('../server/src/utils/logger')] = {
    exports: { logger: mockLogger }
};

// Mock loadEnv
require.cache[require.resolve('../server/loadEnv')] = {
    exports: {}
};

// Mock global fetch
let fetchCallCount = 0;
global.fetch = async (url, options) => {
    fetchCallCount++;
    console.log(`Fetch called (${fetchCallCount}): ${url}`);

    if (fetchCallCount <= 2) {
        // Simulate error for first 2 calls
        throw new Error('fetch failed: connection refused');
    }

    // Success on 3rd call
    return {
        ok: true,
        json: async () => ({
            choices: [{ message: { content: 'Success after retry!' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
            model: 'openclaw-v1'
        }),
        text: async () => ''
    };
};

async function runTest() {
    console.log('Starting Retry Verification...');

    const service = new NexusAIGatewayService({
        enableOpenAI: false,
        enableOpenRouter: false,
        enableLocal: false,
        enableOpenClaw: true,
        maxRetries: 2,
        retryDelayMs: 100 // Fast retry for test
    });

    // Verify provider initialization
    const provider = service.providers.get('openclaw');
    if (!provider) {
        console.error('FAILED: OpenClaw provider not initialized');
        process.exit(1);
    }

    console.log('Provider config:', provider.config);

    try {
        const result = await service.chat({
            messages: [{ role: 'user', content: 'test' }],
            tenantId: 'test-tenant'
        });

        if (result.success && result.data.message === 'Success after retry!') {
            console.log('SUCCESS: Chat request succeeded after retries.');
            if (fetchCallCount === 3) {
                console.log('VERIFIED: Fetch was called exactly 3 times.');
            } else {
                console.warn(`WARNING: Fetch called ${fetchCallCount} times, expected 3.`);
            }
        } else {
            console.error('FAILED: Chat request did not return expected success.', result);
        }

    } catch (error) {
        console.error('FAILED: Exception during test:', error);
    }
}

runTest();
