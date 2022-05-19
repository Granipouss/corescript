const path = require('path');

module.exports = {
  mode: 'development',
  entry: './js/main.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'out'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.ts', '.js'],
  },
  externals: [
    { "pixi.js": "PIXI" }
  ],
  devtool: 'eval-source-map',
};
