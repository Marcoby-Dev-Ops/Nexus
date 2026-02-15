const { buildModelWayInstructionBlock } = require('../src/services/aiChatOrchestration');
// We need to mock the environment and the function if it's imported from ai.js but lives in orchestration
// Wait, looking at ai.js, buildModelWayInstructionBlock is defined IN ai.js, not exported from aiChatOrchestration.
// Actually, I modified ai.js. Let me check where it is defined.

const fs = require('fs');
const path = require('path');

// Since ai.js defines it internally and it's not exported (it's a route file), 
// I'll extract it or just check the file content directly.
// Alternatively, I can temporarily export it or create a test that requires the logic.

async function verify() {
    const aiJsPath = path.join(__dirname, '../src/routes/ai.js');
    const content = fs.readFileSync(aiJsPath, 'utf8');

    const hasEvidence = content.includes('Evidence & Citations');
    const hasNexusCommits = content.includes('Nexus Commits');
    const hasLinkFormat = content.includes('https://github.com/Marcoby-Dev-Ops/Nexus/commit/[hash]');

    console.log('Verification Results:');
    console.log('Has Evidence & Citations:', hasEvidence);
    console.log('Has Nexus Commits instruction:', hasNexusCommits);
    console.log('Has GitHub link format:', hasLinkFormat);

    const soulPath = path.join(__dirname, '../../SOUL.md');
    const soulContent = fs.readFileSync(soulPath, 'utf8');
    const hasSoulEvidence = soulContent.includes('Evidence & Citations');
    console.log('SOUL.md Has Evidence & Citations:', hasSoulEvidence);

    if (hasEvidence && hasNexusCommits && hasLinkFormat && hasSoulEvidence) {
        console.log('\nSUCCESS: All instructions are present.');
        process.exit(0);
    } else {
        console.log('\nFAILURE: Some instructions are missing.');
        process.exit(1);
    }
}

verify();
