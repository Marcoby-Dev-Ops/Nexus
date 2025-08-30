$body = @{
    context = @{
        user = @{
            firstName = "Test"
            lastName = "User"
            company = "Test Company"
            industry = "Technology"
            companySize = "1-10"
            keyPriorities = @("Growth")
        }
        selectedIntegrations = @()
        selectedTools = @{}
        maturityScore = 45
    }
} | ConvertTo-Json -Depth 3

Write-Host "Testing onboarding insights generation..."
Write-Host "Request body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/ai-insights/onboarding" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ SUCCESS!"
    Write-Host "Insights count: $($response.data.insights.Count)"
    Write-Host "Maturity score: $($response.data.maturityScore)"
} catch {
    Write-Host "❌ FAILED!"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
