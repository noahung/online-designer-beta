// Simple API endpoint for Zapier authentication
// This creates a mock API response since we're on GitHub Pages (static hosting)

export default function handler(req, res) {
  // This is for when you move to Vercel or similar platform
  const { api_key } = req.query;
  
  if (!api_key || !api_key.startsWith('dk_live_')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Mock response for testing
  return res.status(200).json({
    success: true,
    forms: [
      {
        id: 'demo-form-123',
        name: 'Demo Contact Form',
        created_at: new Date().toISOString(),
        total_responses: 5
      }
    ]
  });
}
