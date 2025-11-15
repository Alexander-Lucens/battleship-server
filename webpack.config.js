import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);

export default {
  entry: './src/index.ts',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: resolve(__dirname, 'dist'),
  },
};
