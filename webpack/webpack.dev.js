const path = require('node:path');
const webpack = require('webpack');
const common = require('./webpack.common');

const port = Number(process.env.PORT || 3004);
const serversApiUrl = process.env.SERVERS_API_URL || 'http://localhost:8082';
const brandSlug = process.env.BRAND_SLUG || 'kuni';
const brandToken = process.env.BRAND_API_TOKEN || '';

module.exports = {
  ...common,
  mode: 'development',
  devtool: 'source-map',
  output: { ...common.output, path: path.resolve(__dirname, '../build/dev') },
  devServer: {
    port,
    hot: true,
    client: { overlay: true },
    proxy: [
      {
        context: ['/_api/servers'],
        target: serversApiUrl,
        changeOrigin: true,
        pathRewrite: { '^/_api/servers': '/api/v1/sites/' + brandSlug + '/servers' },
        headers: brandToken ? { Authorization: 'Bearer ' + brandToken } : {}
      }
    ],
    setupMiddlewares(middlewares, server) {
      server.compiler.hooks.done.tap('TemplateReload', () => {
        const files = [...(server.compiler.modifiedFiles || [])].map((file) => file.split(path.sep).join('/'));
        if (files.some((file) => file.endsWith('.hbs') || file.endsWith('/pages') || file.includes('/src/templates') || file.includes('/src/data'))) {
          setImmediate(() => server.getHotMiddleware()?.publish({ action: 'reload' }));
        }
      });
      return middlewares;
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      __VPN_BUILD_CONFIG__: JSON.stringify({
        brandSlug,
        mode: process.env.DATA_MODE || 'live',
        dashboardApiUrl: process.env.PORTAL_API_URL || 'http://localhost:8081',
        adminServersApiUrl: serversApiUrl,
        serversCatalogUrl: process.env.SERVERS_CATALOG_URL || '/_api/servers'
      })
    }),
    ...common.plugins,
    {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('Templates', (compilation) => {
          for (const dir of ['pages', 'src/templates', 'src/data']) {
            compilation.contextDependencies.add(path.resolve(__dirname, '..', dir));
          }
        });
      }
    }
  ]
};
