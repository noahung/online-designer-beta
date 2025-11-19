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
  // Return empty array for now - we'll implement real API later
  return [];
};

module.exports = {
  key: 'new_form_response',
  noun: 'Form Response',
  display: {
    label: 'New Form Response',
    description: 'Triggers when a new form response is submitted.',
  },
  operation: {
    type: 'hook',
    perform: getList,
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    performList: getList,
    inputFields: [
      {
        key: 'form_id',
        label: 'Form',
        required: true,
        type: 'string',
        helpText: 'Select the form to monitor for new responses',
        search: 'formListSearch.id',
      },
    ],
    outputFields: [
      // Response metadata
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
      
      // Contact Information
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
        key: 'contact__postcode',
        label: 'Contact Postcode',
        type: 'string',
      },
      
      // All form answers as structured data
      {
        key: 'answers',
        label: 'All Form Answers (JSON)',
        type: 'text',
        helpText: 'Complete structured data of all form responses including files, dimensions, ratings, etc.'
      },
      
      // Individual answer fields for easy access
      {
        key: 'answers__text_responses',
        label: 'Text Responses',
        type: 'text',
        list: true,
        helpText: 'All text input responses from the form'
      },
      {
        key: 'answers__multiple_choice',
        label: 'Multiple Choice Selections',
        type: 'text',
        list: true,
        helpText: 'All multiple choice selections with question and answer'
      },
      {
        key: 'answers__image_selections',
        label: 'Image Selections',
        type: 'text',
        list: true,
        helpText: 'All image selection responses with image URLs'
      },
      {
        key: 'answers__file_uploads',
        label: 'File Uploads',
        type: 'text',
        list: true,
        helpText: 'All uploaded files with URLs, names, and sizes'
      },
      {
        key: 'answers__dimensions',
        label: 'Dimension Measurements',
        type: 'text',
        list: true,
        helpText: 'All dimension measurements (2D/3D) with units'
      },
      {
        key: 'answers__opinion_ratings',
        label: 'Opinion Scale Ratings',
        type: 'text',
        list: true,
        helpText: 'All opinion scale ratings and feedback'
      },
      
      // File attachments - direct access
      {
        key: 'file_attachments',
        label: 'File Attachment URLs',
        type: 'text',
        list: true,
        helpText: 'Direct URLs to all uploaded files'
      },
      {
        key: 'file_names',
        label: 'File Names',
        type: 'text',
        list: true,
        helpText: 'Names of all uploaded files'
      },
      
      // Summary fields
      {
        key: 'total_questions_answered',
        label: 'Total Questions Answered',
        type: 'integer',
      },
      {
        key: 'completion_percentage',
        label: 'Form Completion Percentage',
        type: 'number',
      },
    ],
    sample: {
      response_id: '12345678-1234-1234-1234-123456789abc',
      form_id: '87654321-4321-4321-4321-cba987654321',
      form_name: 'Contact Form',
      submitted_at: '2025-08-26T10:30:00Z',
      
      // Contact information
      contact__name: 'John Doe',
      contact__email: 'john@example.com', 
      contact__phone: '+1234567890',
      contact__postcode: 'SW1A 1AA',
      
      // Complete structured answers
      answers: JSON.stringify([
        {
          question: 'What type of windows are you interested in?',
          question_type: 'multiple_choice',
          answer_text: 'Double Glazed Windows',
          selected_option: 'option_123',
          step_order: 1
        },
        {
          question: 'Upload a photo of your current windows',
          question_type: 'file_upload',
          file_url: 'https://example.com/uploads/window-photo.jpg',
          file_name: 'window-photo.jpg',
          file_size: 2048576,
          step_order: 2
        },
        {
          question: 'What are the dimensions of your windows?',
          question_type: 'dimensions',
          dimensions: {
            width: 120,
            height: 150,
            depth: 25,
            units: 'cm'
          },
          step_order: 3
        },
        {
          question: 'Rate our service quality',
          question_type: 'opinion_scale',
          rating: 5,
          scale_type: 'stars',
          step_order: 4
        },
        {
          question: 'Any additional comments?',
          question_type: 'text_input',
          answer_text: 'Great service, very professional team!',
          step_order: 5
        }
      ]),
      
      // Categorized responses for easy access
      answers__text_responses: [
        'Great service, very professional team!'
      ],
      answers__multiple_choice: [
        'What type of windows are you interested in? → Double Glazed Windows'
      ],
      answers__image_selections: [],
      answers__file_uploads: [
        'window-photo.jpg (2.0 MB) - https://example.com/uploads/window-photo.jpg'
      ],
      answers__dimensions: [
        'Window dimensions: 120cm × 150cm × 25cm'
      ],
      answers__opinion_ratings: [
        'Service quality rating: 5/5 stars'
      ],
      
      // Direct file access
      file_attachments: [
        'https://example.com/uploads/window-photo.jpg'
      ],
      file_names: [
        'window-photo.jpg'
      ],
      
      // Summary data
      total_questions_answered: 5,
      completion_percentage: 100,
    },
  },
};
