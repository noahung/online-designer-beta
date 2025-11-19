#!/bin/bash

# Step Templates Migration Script
# This script helps you set up the step templates feature

echo "🚀 Step Templates Migration"
echo "============================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env"
    echo "Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo "📋 Migration Overview:"
echo "  - Create step_templates table"
echo "  - Create step_template_options table"
echo "  - Set up Row Level Security policies"
echo "  - Add indexes for performance"
echo ""

read -p "Do you want to proceed with the migration? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "🔧 Running migration..."
echo ""

# Read the SQL file
SQL_FILE="supabase/add_step_templates.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: Migration file not found: $SQL_FILE"
    exit 1
fi

echo "📝 SQL migration file found"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of: $SQL_FILE"
echo "4. Click 'Run' to execute the migration"
echo ""
echo "Alternatively, you can use the Supabase CLI:"
echo "  supabase db push --include $SQL_FILE"
echo ""
echo "📄 Migration file location: $SQL_FILE"
echo ""
echo "✅ After running the migration, the following features will be available:"
echo "  - Save configured steps as reusable templates"
echo "  - Load templates into existing steps"
echo "  - Create new steps from templates"
echo "  - Search and manage your template library"
echo ""
echo "📖 For detailed usage instructions, see: STEP_TEMPLATES_GUIDE.md"
echo ""
