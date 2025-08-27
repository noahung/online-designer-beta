const performAuth = (z, bundle) => {
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

    // You can do any parsing you need for results here before returning
    if (results && Array.isArray(results.forms)) {
      return results;
    }
    
    throw new Error('Invalid API key or unable to access forms');
  });
};

const authentication = {
  type: 'custom',
  test: performAuth,
  fields: [
    {
      computed: false,
      key: 'api_key',
      required: true,
      label: 'API Key',
      type: 'string',
      helpText: 'Get your API key from the Settings page in your Online Designer account. Make sure to copy the entire key including any prefixes.',
    },
  ],
  // The test method allows Zapier to verify that the credentials are valid
  connectionLabel: 'Online Designer Forms ({{username}})',
};

module.exports = {
  authentication,
};
