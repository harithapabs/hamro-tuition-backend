$body = @{
    email = "admin@hamrotuition.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "=== Test 1: Direct API login ==="
$response = Invoke-WebRequest -Uri "https://hamro-tuition-api.onrender.com/api/auth/login" -Method Post -ContentType "application/json" -Body $body -UseBasicParsing
Write-Host "Status: $($response.StatusCode)"
Write-Host "Body: $($response.Content)"
