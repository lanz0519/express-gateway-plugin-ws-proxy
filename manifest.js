const httpProxy = require('http-proxy')
const { webSocketConfig } = require('../../config/myConfig')
const logger = require('../express-gateway/lib/logger').policy
module.exports = {
  version: '1.2.0',
  init: function (pluginContext) {
    let policy = require('express-gateway-plugin-ws-proxy/policies/ws-proxy')
    pluginContext.registerPolicy(policy)

    pluginContext.eventBus.on('http-ready', function ({ httpServer }) {
      console.log('http server is ready', httpServer.address());
    });

    pluginContext.eventBus.on('https-ready', function ({ httpServer }) {
      console.log('https server is ready', httpServer.address());
      let proxyList = {}
      // 配置初始化
      for (let p in webSocketConfig) {
        proxyList[webSocketConfig[p].url] = new httpProxy.createProxyServer({
          target: {
            host: webSocketConfig[p].host,
            port: webSocketConfig[p].port
          }
        })
      }

      httpServer.on('upgrade', (req, socket, head) => {
        let flag = false
        try {
          for (let p in proxyList) {
            let regUrl = p
            let mode = false
            // 判断代理到目标url的模式
            if (p.substr(p.length-1) == '/') {
              regUrl = p.substr(0, p.length - 1)
              mode = true
            }
            
            // 如果匹配正则
            if (req.url.match(new RegExp(regUrl)) !== null) {
              flag = true
              // 如果是需要特殊转换的模式
              if (mode) {
                req.url = req.url.substr(regUrl.length - 1)
                req.url = '/' + req.url
              }
              proxyList[p].ws(req, socket, head)
            }
          }
        } catch (e) {
          logger.error(`websocket upgrade ${e}`)
        }
        if (!flag) {
          socket.destroy()
        }
      });
      // 分别监听错误事件
      for (let p in proxyList) {
        proxyList[p].on('error', (err) => {
          logger.error(`websocket ${err}`)
        })
      }
    });
  },
  policies:['ws-proxy'], // this is for CLI to automatically add to "policies" whitelist in gateway.config
  schema: {  // This is for CLI to ask about params 'eg plugin configure customer-auth'
    "$id":"https://express-gateway.io/schemas/plugin/blacklist.json"
  }
}