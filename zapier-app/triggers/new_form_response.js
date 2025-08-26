const subscribeHook = (z, bundle) => {
  const options = {
    url: `${process.env.BASE_URL}/api/webhooks/subscribe`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      form_id: bundle.inputData.form_id,
      api_key: bundle.authData.api_key,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    return response.json;
  });
};

const unsubscribeHook = (z, bundle) => {
  const options = {
    url: `${process.env.BASE_URL}/api/webhooks/unsubscribe`,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      form_id: bundle.inputData.form_id,
      api_key: bundle.authData.api_key,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    return response.json;
  });
};

const getList = (z, bundle) => {
  const options = {
    url: `${process.env.BASE_URL}/api/forms/${bundle.inputData.form_id}/responses/recent`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    params: {
      api_key: bundle.authData.api_key,
      limit: 3, // Just get the 3 most recent for testing
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    const results = response.json;
    
    if (results && Array.isArray(results.responses)) {
      return results.responses.map(response => ({
        id: response.response_id,
        response_id: response.response_id,
        form_id: response.form_id,
        form_name: response.form_name,
        submitted_at: response.submitted_at,
        contact: response.contact,
        contact__name: response.contact?.name,
        contact__email: response.contact?.email,
        contact__phone: response.contact?.phone,
        answers: response.answers,
      }));
    }
    
    return [];
  });
};

module.exports = {
  key: 'new_form_response',
  noun: 'Form Response',
  display: {
    label: 'New Form Response',
    description: 'Triggers when a new form response is submitted',
    important: true,
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    performList: getList,
    inputFields: [
      {
        key: 'form_id',
        label: 'Form',
        required: true,
        dynamic: 'form_list.id.name',
        helpText: 'Select which form to monitor for new responses',
      },
    ],
    outputFields: [
      {
        key: 'response_id',
        label: 'Response ID',
        type: 'string',
      },
      {
        key: 'form_id',
        label: 'Form ID',
        type: 'string',
      },
      {
        key: 'form_name',
        label: 'Form Name',
        type: 'string',
      },
      {
        key: 'submitted_at',
        label: 'Submitted At',
        type: 'datetime',
      },
      {
        key: 'contact__name',
        label: 'Contact Name',
        type: 'string',
      },
      {
        key: 'contact__email',
        label: 'Contact Email',
        type: 'string',
      },
      {
        key: 'contact__phone',
        label: 'Contact Phone',
        type: 'string',
      },
      {
        key: 'answers',
        label: 'Form Answers',
        type: 'object',
      },
    ],
    sample: {
      response_id: '12345678-1234-1234-1234-123456789abc',
      form_id: '87654321-4321-4321-4321-cba987654321',
      form_name: 'Contact Form',
      submitted_at: '2025-08-26T10:30:00Z',
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      contact__name: 'John Doe',
      contact__email: 'john@example.com',
      contact__phone: '+1234567890',
      answers: [
        {
          question: 'What type of windows are you interested in?',
          answer_text: 'Double Glazed Windows',
          selected_option: 'option_123'
        },
        {
          question: 'Rate our service',
          rating: 5
        }
      ],
    },
  },
};
