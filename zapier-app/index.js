const authentication = require('./authentication');
const newFormResponseTrigger = require('./triggers/new_form_response');
const formListSearch = require('./searches/form_list');

const addApiKeyToHeader = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.api_key) {
    request.params = request.params || {};
    request.params.api_key = bundle.authData.api_key;
  }
  return request;
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('./package.json').zapier.platformVersion,

  authentication: authentication.authentication,

  beforeRequest: [addApiKeyToHeader],

  afterResponse: [],

  resources: {},

  triggers: {
    [newFormResponseTrigger.key]: newFormResponseTrigger,
  },

  searches: {
    [formListSearch.key]: formListSearch,
  },

  creates: {},

  hydrators: {},
};

// Set the base URL for all requests - use custom domain
process.env.BASE_URL = process.env.BASE_URL || 'https://designer.advertomedia.co.uk';

module.exports = App;
