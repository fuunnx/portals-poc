const path = require('path')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

const appPath = (...names) => path.join(process.cwd(), ...names)

//This will be merged with the config from the flavor
module.exports = {
  entry: {
    main: [appPath('src', 'index.ts'), appPath('src', 'styles.scss')],
  },
  output: {
    filename: 'bundle.[hash].js',
    path: appPath('build'),
    publicPath: '/',
  },
  stats: 'verbose',
  devServer: {
    clientLogLevel: 'warning',
    stats: 'normal',
  },
  plugins: [new MonacoWebpackPlugin()],
}
