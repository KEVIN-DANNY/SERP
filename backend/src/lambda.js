const serverless = require('serverless-http');
const { app } = require('./server');

// AWS Lambda entrypoint for API Gateway HTTP/REST proxy events
module.exports.handler = serverless(app, {
  binary: ['image/png', 'image/jpeg', 'image/x-icon', 'application/pdf']
});
