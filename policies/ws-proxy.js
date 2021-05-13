const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = {
  name: 'ws-proxy',
  schema: {
    $id: 'express-gateway-plugin-ws-proxy',
    type: 'object',
    properties: {
      level: {
        tpye: 'integer'
      }
    }
  },
  policy: (actionParams) => {
    return createProxyMiddleware(actionParams.target, {secure: false})
  }
};