const perform = (z, bundle) => {
  const options = {
    url: `${process.env.BASE_URL}/api/forms`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    params: {
      api_key: bundle.authData.api_key,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    const results = response.json;
    
    // Map the response to the format Zapier expects
    if (results && Array.isArray(results.forms)) {
      return results.forms.map(form => ({
        id: form.id,
        name: form.name,
        created_at: form.created_at,
        total_responses: form.total_responses || 0,
        last_response_at: form.last_response_at
      }));
    }
    
    return [];
  });
};

module.exports = {
  key: 'form_list',
  noun: 'Form',
  display: {
    label: 'Find Forms',
    description: 'List all your forms',
    hidden: true, // This is used internally by Zapier to populate dropdowns
  },
  operation: {
    perform: perform,
  },
};
