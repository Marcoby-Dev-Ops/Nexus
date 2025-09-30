const http = require('http');

function testChat() {
  console.log('🧪 Testing Chat System...\n');

  const postData = JSON.stringify({
    message: 'Hello, can you help me with my business?',
    context: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        role: 'owner',
        department: 'Executive',
        experience_level: 'intermediate',
        communication_style: 'balanced'
      },
      company: {
        id: 'test-company-id',
        name: 'Test Company',
        industry: 'Technology',
        size: '10-50',
        description: 'A test company'
      },
      agent: {
        id: 'executive-assistant',
        type: 'assistant',
        capabilities: ['business_strategy', 'planning']
      },
      conversation: {
        id: null,
        history: []
      },
      attachments: []
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ai/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n📝 Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.success) {
          console.log('\n✅ Chat System is WORKING!');
          console.log(`Response: ${response.data.content.substring(0, 100)}...`);
        } else {
          console.log('\n❌ Chat System has issues:');
          console.log(`Error: ${response.error}`);
        }
      } catch (error) {
        console.log('\n❌ Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('\n❌ Request failed:', error.message);
  });

  req.write(postData);
  req.end();
}

testChat();
