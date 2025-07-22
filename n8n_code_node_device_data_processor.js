// Process each integration and generate mock device data
// This Code node transforms integration data into device records for database insertion

const integrations = $input.all();
const allRecords = [];
let totalProcessed = 0;
const totalErrors = [];

console.log(`Processing ${integrations.length} integrations...`);

for (const integration of integrations) {
  const data = integration.json;
  
  try {
    // Validate integration data
    if (!data || !data.id) {
      throw new Error('Invalid integration data: missing id');
    }

    // Mock API response for device health data
    // In a real scenario, this would be an actual API call to the integration
    const mockApiResponse = {
      devices: [
        {
          device_id: `device-${data.id}-1`,
          status: 'online',
          cpu_usage: Math.round((Math.random() * 100) * 100) / 100, // Round to 2 decimal places
          memory_usage: Math.round((Math.random() * 100) * 100) / 100,
          disk_usage_gb: Math.round((Math.random() * 500) * 100) / 100,
          last_seen: new Date().toISOString()
        },
        {
          device_id: `device-${data.id}-2`,
          status: 'offline',
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage_gb: Math.round((Math.random() * 500) * 100) / 100,
          last_seen: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
        },
        {
          device_id: `device-${data.id}-3`,
          status: 'warning',
          cpu_usage: Math.round((Math.random() * 80 + 20) * 100) / 100, // 20-100% CPU
          memory_usage: Math.round((Math.random() * 60 + 40) * 100) / 100, // 40-100% memory
          disk_usage_gb: Math.round((Math.random() * 300 + 200) * 100) / 100, // 200-500GB
          last_seen: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
      ]
    };

    // Transform data for database insertion
    const recordsToInsert = mockApiResponse.devices.map(device => ({
      user_integration_id: data.id,
      device_id: device.device_id,
      status: device.status,
      cpu_usage: device.cpu_usage,
      memory_usage: device.memory_usage,
      disk_usage_gb: device.disk_usage_gb,
      last_seen: device.last_seen,
      raw_payload: device, // Store the original device object as JSON
      created_at: new Date().toISOString()
    }));

    allRecords.push(...recordsToInsert);
    totalProcessed += recordsToInsert.length;
    
    console.log(`Processed integration ${data.id}: ${recordsToInsert.length} devices`);
    
  } catch (error) {
    const errorMsg = `Error processing integration ${data?.id || 'unknown'}: ${error.message}`;
    totalErrors.push(errorMsg);
    console.error(errorMsg);
  }
}

// Log summary
console.log(`Total records processed: ${totalProcessed}`);
console.log(`Total errors: ${totalErrors.length}`);

if (totalErrors.length > 0) {
  console.error('Errors encountered:', totalErrors);
}

// Return all records for insertion
// Each record is wrapped in a json property for n8n compatibility
return allRecords.map(record => ({ 
  json: record 
})); 