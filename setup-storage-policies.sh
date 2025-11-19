#!/bin/bash

# Setup Storage Policies for Supabase
# This script uses curl to create storage policies via Supabase Management API

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check required environment variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing environment variables:"
    echo "   VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    echo "   Please check your .env file"
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Could not extract project reference from VITE_SUPABASE_URL"
    exit 1
fi

echo "🚀 Setting up storage policies for project: $PROJECT_REF"

# Base API URL
API_URL="https://api.supabase.com/v1/projects/$PROJECT_REF/storage/policies"

# Function to create a policy
create_policy() {
    local bucket=$1
    local name=$2
    local operation=$3
    local definition=$4

    echo "📝 Creating policy '$name' for bucket '$bucket' ($operation)..."

    local data=$(cat <<EOF
{
  "name": "$name",
  "bucket_id": "$bucket",
  "definition": "$definition",
  "allowed_operations": ["$operation"]
}
EOF
)

    local response=$(curl -s -w "\n%{http_code}" \
        -X POST "$API_URL" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "$data")

    local status_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)

    if [ "$status_code" = "201" ]; then
        echo "✅ Policy '$name' created successfully"
        return 0
    else
        echo "⚠️  Policy '$name' may already exist or failed (Status: $status_code)"
        echo "Response: $response_body"
        return 1
    fi
}

# Setup policies for form-assets bucket
echo "🔧 Setting up policies for form-assets bucket..."
create_policy "form-assets" "Public read access" "SELECT" "true"
create_policy "form-assets" "Authenticated users can upload" "INSERT" "auth.role() = 'authenticated'"
create_policy "form-assets" "Authenticated users can update" "UPDATE" "auth.role() = 'authenticated'"
create_policy "form-assets" "Authenticated users can delete" "DELETE" "auth.role() = 'authenticated'"

echo ""

# Setup policies for client-logos bucket
echo "🔧 Setting up policies for client-logos bucket..."
create_policy "client-logos" "Public read access" "SELECT" "true"
create_policy "client-logos" "Authenticated users can upload" "INSERT" "auth.role() = 'authenticated'"
create_policy "client-logos" "Authenticated users can update" "UPDATE" "auth.role() = 'authenticated'"
create_policy "client-logos" "Authenticated users can delete" "DELETE" "auth.role() = 'authenticated'"

echo ""

# Setup policies for form-uploads bucket (if it exists)
echo "🔧 Setting up policies for form-uploads bucket..."
create_policy "form-uploads" "Public read access" "SELECT" "true"
create_policy "form-uploads" "Anyone can upload" "INSERT" "true"
create_policy "form-uploads" "Anyone can update" "UPDATE" "true"
create_policy "form-uploads" "Anyone can delete" "DELETE" "true"

echo ""
echo "🎉 Storage policies setup complete!"
echo "📋 Note: Some policies may have failed if they already exist or if buckets don't exist yet."
echo "💡 Tip: Make sure your buckets exist before running this script."
echo "   You can create buckets using: supabase/create_buckets.sql"
