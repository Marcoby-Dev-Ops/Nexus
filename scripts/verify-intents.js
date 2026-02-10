const { exec } = require('child_process');
const path = require('path');

// Mock messages for testing detection
const testCases = [
    { prompt: 'Summarize my progress and propose next actions', expected: 'progress' },
    { prompt: 'Continue this: /new', expected: 'progress' }, // Default for short/new
    { prompt: 'Summarize recent performance', expected: 'performance' },
    { prompt: 'Identify growth opportunities', expected: 'growth' },
    { prompt: 'Analyze our Q1 metrics', expected: 'performance' },
    { prompt: 'How can we scale our operations?', expected: 'growth' },
    { prompt: 'I need help with a spreadsheet', expected: 'assist' }
];

async function verify() {
    console.log('--- Intent Detection Verification ---\n');

    // We'll read the file and extract the detectIntent function and INTENT_TYPES
    const fs = require('fs');
    const content = fs.readFileSync('/home/vonj/dev/Nexus/integration/openclaw-integration-modelway.js', 'utf8');

    // Simple eval-based extraction for testing purposes
    const intentTypesMatch = content.match(/const INTENT_TYPES = ({[\s\S]*?});/);
    const detectIntentMatch = content.match(/function detectIntent\(messages\) {([\s\S]*?)^}/m);

    if (!intentTypesMatch || !detectIntentMatch) {
        console.error('Failed to extract logic from file');
        process.exit(1);
    }

    const INTENT_TYPES = eval(`(${intentTypesMatch[1]})`);
    const detectIntent = new Function('messages', `const INTENT_TYPES = ${JSON.stringify(INTENT_TYPES)}; ${detectIntentMatch[1]}`);

    let passed = 0;
    testCases.forEach(tc => {
        const result = detectIntent([{ role: 'user', content: tc.prompt }]);
        const success = result.id === tc.expected;
        console.log(`Prompt: "${tc.prompt}"`);
        console.log(`Expected: ${tc.expected} | Actual: ${result.id} | ${success ? '✅' : '❌'}`);
        if (success) passed++;
        console.log('');
    });

    console.log(`Passed: ${passed}/${testCases.length}`);
    if (passed === testCases.length) {
        console.log('\nAll intent detection tests passed! 🚀');
    } else {
        process.exit(1);
    }
}

verify().catch(console.error);
