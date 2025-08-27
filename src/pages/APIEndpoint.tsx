import { useEffect } from 'react';

const APIEndpoint = () => {
  useEffect(() => {
    const handleAPIRequest = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const apiKey = urlParams.get('api_key');
      
      if (!apiKey || !apiKey.startsWith('dk_live_')) {
        // Return error response
        const errorResponse = {
          error: 'Invalid API key',
          message: 'API key must start with dk_live_'
        };
        
        // Set response in page for Zapier to read
        document.body.innerHTML = `
          <pre style="font-family: monospace; white-space: pre-wrap;">
${JSON.stringify(errorResponse, null, 2)}
          </pre>
        `;
        return;
      }
      
      // Return success response with mock data
      const successResponse = {
        success: true,
        forms: [
          {
            id: 'demo-form-123',
            name: 'Demo Contact Form', 
            created_at: new Date().toISOString(),
            total_responses: 5,
            last_response_at: new Date().toISOString()
          },
          {
            id: 'demo-form-456',
            name: 'Demo Feedback Form',
            created_at: new Date().toISOString(), 
            total_responses: 3,
            last_response_at: new Date().toISOString()
          }
        ]
      };
      
      // Set response in page for Zapier to read
      document.body.innerHTML = `
        <pre style="font-family: monospace; white-space: pre-wrap;">
${JSON.stringify(successResponse, null, 2)}
        </pre>
      `;
    };
    
    handleAPIRequest();
  }, []);

  return (
    <div>
      <p>Loading API response...</p>
    </div>
  );
};

export default APIEndpoint;