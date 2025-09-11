const authentication = require('./authentication');
const newFormResponseTrigger = require('./triggers/new_form_response');
const formListSearch = require('./searches/form_list');
const formSearch = require('./searches/form_search');

// Remove the API key middleware as it was causing issues with RPC calls
// We handle authentication directly in each method that needs it

const App = {
  version: require('./package.json').version,
  platformVersion: require('./package.json').zapier.platformVersion,

  authentication: authentication.authentication,

  beforeRequest: [],

  afterResponse: [],

  resources: {},

  triggers: {
    [newFormResponseTrigger.key]: newFormResponseTrigger,
  },

  searches: {
    [formListSearch.key]: formListSearch,
    [formSearch.key]: formSearch,
  },

  creates: {},

  hydrators: {},
};

// Set the base URL for all requests - use custom domain or environment variable
process.env.BASE_URL = process.env.BASE_URL || 'https://designer.advertomedia.co.uk';

module.exports = App;
