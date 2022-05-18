const path = require('path');

module.exports = {
  mode: 'development',
  entry: './js/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'out'),
  },
  externals: [
    { "pixi.js": "PIXI" }
  ],
  devtool: 'eval-source-map',
};
