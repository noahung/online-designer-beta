#!/usr/bin/env node

/**
 * Script to set up Supabase Storage policies using the Management API
 * Run with: node setup-storage-policies.js
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('   Please check your .env file');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

console.log(`🚀 Setting up storage policies for project: ${projectRef}`);

// Storage policies configuration
const policies = [
  // form-assets bucket policies
  {
    bucket: 'form-assets',
    name: 'Public read access',
    operation: 'SELECT',
    definition: 'true'
  },
  {
    bucket: 'form-assets',
    name: 'Authenticated users can upload',
    operation: 'INSERT',
    definition: "auth.role() = 'authenticated'"
  },
  {
    bucket: 'form-assets',
    name: 'Authenticated users can update',
    operation: 'UPDATE',
    definition: "auth.role() = 'authenticated'"
  },
  {
    bucket: 'form-assets',
    name: 'Authenticated users can delete',
    operation: 'DELETE',
    definition: "auth.role() = 'authenticated'"
  },

  // client-logos bucket policies
  {
    bucket: 'client-logos',
    name: 'Public read access',
    operation: 'SELECT',
    definition: 'true'
  },
  {
    bucket: 'client-logos',
    name: 'Authenticated users can upload',
    operation: 'INSERT',
    definition: "auth.role() = 'authenticated'"
  },
  {
    bucket: 'client-logos',
    name: 'Authenticated users can update',
    operation: 'UPDATE',
    definition: "auth.role() = 'authenticated'"
  },
  {
    bucket: 'client-logos',
    name: 'Authenticated users can delete',
    operation: 'DELETE',
    definition: "auth.role() = 'authenticated'"
  },

  // form-uploads bucket policies (if exists)
  {
    bucket: 'form-uploads',
    name: 'Public read access',
    operation: 'SELECT',
    definition: 'true'
  },
  {
    bucket: 'form-uploads',
    name: 'Anyone can upload',
    operation: 'INSERT',
    definition: 'true'
  },
  {
    bucket: 'form-uploads',
    name: 'Anyone can update',
    operation: 'UPDATE',
    definition: 'true'
  },
  {
    bucket: 'form-uploads',
    name: 'Anyone can delete',
    operation: 'DELETE',
    definition: 'true'
  }
];

// Function to make HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Function to create a storage policy
async function createStoragePolicy(bucket, name, operation, definition) {
  const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/storage/policies`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const policyData = {
    name,
    bucket_id: bucket,
    definition,
    allowed_operations: [operation]
  };

  try {
    console.log(`📝 Creating policy "${name}" for bucket "${bucket}" (${operation})...`);
    const response = await makeRequest(options, policyData);

    if (response.statusCode === 201) {
      console.log(`✅ Policy "${name}" created successfully`);
      return true;
    } else {
      console.log(`⚠️  Policy "${name}" may already exist or failed:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating policy "${name}":`, error.message);
    return false;
  }
}

// Main function
async function setupPolicies() {
  console.log('🔧 Setting up storage policies...\n');

  let successCount = 0;
  let totalCount = policies.length;

  for (const policy of policies) {
    const success = await createStoragePolicy(
      policy.bucket,
      policy.name,
      policy.operation,
      policy.definition
    );

    if (success) {
      successCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n🎉 Setup complete! ${successCount}/${totalCount} policies processed.`);
  console.log('📋 Note: Some policies may have failed if they already exist or if buckets don\'t exist yet.');

  if (successCount < totalCount) {
    console.log('\n💡 Tip: Make sure your buckets exist before running this script.');
    console.log('   You can create buckets using: supabase/create_buckets.sql');
  }
}

// Run the setup
setupPolicies().catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});
