const webpack = require('webpack');
const common = require('./webpack.common');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  ...common,
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      __VPN_BUILD_CONFIG__: JSON.stringify({
        brandSlug: process.env.BRAND_SLUG || 'kuni',
        mode: process.env.DATA_MODE || 'live',
        dashboardApiUrl: process.env.PORTAL_API_URL || 'https://businessdashboard.cods.live',
        adminServersApiUrl: process.env.SERVERS_API_URL || 'https://vpnservers.cods.live',
        serversCatalogUrl: process.env.SERVERS_CATALOG_URL || '/_api/servers'
      })
    }),
    ...common.plugins
  ],
  optimization: { minimizer: ['...', new CssMinimizerPlugin()] }
};
