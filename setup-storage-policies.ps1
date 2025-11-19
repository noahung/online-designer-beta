# Setup Storage Policies for Supabase
# This script uses Invoke-RestMethod to create storage policies via Supabase Management API

# Load environment variables from .env file
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Where-Object { $_ -notmatch '^#' -and $_.Trim() -ne '' }
    foreach ($line in $envContent) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $1.Trim()
            $value = $2.Trim()
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

# Check required environment variables
$supabaseUrl = $env:VITE_SUPABASE_URL
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $serviceRoleKey) {
    Write-Host "❌ Missing environment variables:" -ForegroundColor Red
    Write-Host "   VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    Write-Host "   Please check your .env file"
    Write-Host ""
    Write-Host "💡 To get your service role key:"
    Write-Host "   1. Go to Supabase Dashboard → Settings → API"
    Write-Host "   2. Copy the 'service_role' key (not the anon key)"
    Write-Host "   3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
}

# Extract project reference from URL
$projectRef = $supabaseUrl -replace 'https://([^.]+)\.supabase\.co', '$1'

if (-not $projectRef) {
    Write-Host "❌ Could not extract project reference from VITE_SUPABASE_URL" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Setting up storage policies for project: $projectRef" -ForegroundColor Green

# Base API URL
$apiUrl = "https://api.supabase.com/v1/projects/$projectRef/storage/policies"

# Function to create a policy
function Create-Policy {
    param(
        [string]$Bucket,
        [string]$Name,
        [string]$Operation,
        [string]$Definition
    )

    Write-Host "📝 Creating policy '$Name' for bucket '$Bucket' ($Operation)..." -ForegroundColor Yellow

    $body = @{
        name = $Name
        bucket_id = $Bucket
        definition = $Definition
        allowed_operations = @($Operation)
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers @{
            "Authorization" = "Bearer $serviceRoleKey"
            "Content-Type" = "application/json"
        } -Body $body

        Write-Host "✅ Policy '$Name' created successfully" -ForegroundColor Green
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "⚠️  Policy '$Name' may already exist or failed (Status: $statusCode)" -ForegroundColor Yellow
        Write-Host "Response: $($_.Exception.Message)" -ForegroundColor Gray
        return $false
    }
}

# Setup policies for form-assets bucket
Write-Host "🔧 Setting up policies for form-assets bucket..." -ForegroundColor Cyan
Create-Policy -Bucket "form-assets" -Name "Public read access" -Operation "SELECT" -Definition "true"
Create-Policy -Bucket "form-assets" -Name "Authenticated users can upload" -Operation "INSERT" -Definition "auth.role() = 'authenticated'"
Create-Policy -Bucket "form-assets" -Name "Authenticated users can update" -Operation "UPDATE" -Definition "auth.role() = 'authenticated'"
Create-Policy -Bucket "form-assets" -Name "Authenticated users can delete" -Operation "DELETE" -Definition "auth.role() = 'authenticated'"

Write-Host ""

# Setup policies for client-logos bucket
Write-Host "🔧 Setting up policies for client-logos bucket..." -ForegroundColor Cyan
Create-Policy -Bucket "client-logos" -Name "Public read access" -Operation "SELECT" -Definition "true"
Create-Policy -Bucket "client-logos" -Name "Authenticated users can upload" -Operation "INSERT" -Definition "auth.role() = 'authenticated'"
Create-Policy -Bucket "client-logos" -Name "Authenticated users can update" -Operation "UPDATE" -Definition "auth.role() = 'authenticated'"
Create-Policy -Bucket "client-logos" -Name "Authenticated users can delete" -Operation "DELETE" -Definition "auth.role() = 'authenticated'"

Write-Host ""

# Setup policies for form-uploads bucket (if it exists)
Write-Host "🔧 Setting up policies for form-uploads bucket..." -ForegroundColor Cyan
Create-Policy -Bucket "form-uploads" -Name "Public read access" -Operation "SELECT" -Definition "true"
Create-Policy -Bucket "form-uploads" -Name "Anyone can upload" -Operation "INSERT" -Definition "true"
Create-Policy -Bucket "form-uploads" -Name "Anyone can update" -Operation "UPDATE" -Definition "true"
Create-Policy -Bucket "form-uploads" -Name "Anyone can delete" -Operation "DELETE" -Definition "true"

Write-Host ""
Write-Host "🎉 Storage policies setup complete!" -ForegroundColor Green
Write-Host "📋 Note: Some policies may have failed if they already exist or if buckets don't exist yet." -ForegroundColor Yellow
Write-Host "💡 Tip: Make sure your buckets exist before running this script." -ForegroundColor Cyan
Write-Host "   You can create buckets using: supabase/create_buckets.sql" -ForegroundColor Cyan
