$body = @{
    text = "test embedding"
    model = "text-embedding-3-small"
    tenantId = "test-tenant"
} | ConvertTo-Json

Write-Host "Testing embedding endpoint..."
Write-Host "Request body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/embeddings" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ SUCCESS!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "❌ FAILED!"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
