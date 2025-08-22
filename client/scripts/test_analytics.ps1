# Test Analytics Integration
Write-Host "Testing analytics integration..." -ForegroundColor Green

$body = @{
    userContext = @{
        industry = "Technology"
        companySize = "1-10"
        maturityLevel = "Early Stage"
        sophisticationLevel = "Beginner"
        keyPriorities = @("Growth", "Efficiency")
        selectedTools = @{
            "project_management" = @("asana", "trello")
            "communication" = @("slack", "zoom")
        }
    }
    limit = 5
} | ConvertTo-Json -Depth 3

Write-Host "Request body: $body" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/analytics/similar-organizations" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "Similar organizations found: $($response.data.organizations.Count)" -ForegroundColor Green
        Write-Host "Total organizations analyzed: $($response.data.summary.totalOrganizations)" -ForegroundColor Green
        Write-Host "Average insights: $($response.data.summary.averageInsights)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED!" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
