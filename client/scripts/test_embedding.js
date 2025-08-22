async function testEmbedding() {
  try {
    console.log('Testing embedding endpoint...');
    
    const response = await fetch('http://localhost:3001/api/ai/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'test embedding',
        model: 'text-embedding-3-small',
        tenantId: 'test-tenant'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Embedding test PASSED');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Embedding test FAILED');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Embedding test FAILED with exception');
    console.log('Error:', error.message);
  }
}

testEmbedding();
