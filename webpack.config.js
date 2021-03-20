// 引入 path 模块，用于处理文件和目录的路径
const path = require('path');
// 引入 html 插件
const HTMLWebpackPlugin = require('html-webpack-plugin');
// 引入 clean 插件
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// webpack 中的所有的配置信息都应该写在 module.exports 中
module.exports = {
  // 指定入口文件
  entry: "./src/main.ts",
  // 指定打包文件的目录
  output: {
    // 指定打包文件的目录：当前路径/dist
    path: path.resolve(__dirname, 'dist'),
    // 打包后文件的文件名
    filename: "bundle.js",
    environment:{
        arrowFunction: false // 是否使用箭头函数，可选
    }
  },
  mode: 'development',
  // 指定 webpack 打包时要使用模块
  module: {
    // 指定要加载的规则
    rules: [
      // 设置ts文件处理
      {
        // test 指定的是规则生效的文件
        test: /\.ts$/,
        // use 指定需要使用的 loader
        use: [
          // 配置 babel
          {
            // 指定加载器
            loader:"babel-loader",
            // 设置 babel
            options: {
              // 设置预定义的环境
              presets:[
                [
                  // 指定环境的插件
                  "@babel/preset-env",
                  // 配置信息
                  {
                    // 要兼容的目标浏览器
                    targets:{
                        "chrome":"58",
                        "ie":"11"
                    },
                    // 指定core-js的版本
                    "corejs":"3",
                    // 使用 core-js 的方式 "usage" 表示按需加载
                    "useBuiltIns":"usage"
                  }
                ]
              ]
            }
          },
          'ts-loader'
        ],
        // 要排除的文件
        exclude: /node_modules/
      },
      // 设置less文件处理
      {
        test: /\.less$/,
        use: [
          "style-loader", 
          "css-loader", 
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      browsers: "last 3 versions"
                    }
                  ]
                ]
              }
            }
          }, 
          "less-loader"
        ]
      },
      // 配置图片url
      {
        test:/\.(jpg|png|gif|bmp|jpeg|ttf|eot|svg|woff|woff2)$/,
        use:'url-loader?limit=8192&name=img/[hash:8].[name].[ext]'
      },
      // 配置css文件
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      }
    ]
  },
  // 配置 Webpack 插件
  plugins: [
    new CleanWebpackPlugin(),
    new HTMLWebpackPlugin({
      filename: 'index.html',
      template: "src/index.html",
      favicon: "src/favicon.ico",
    })
  ],
  // 配置开发环境的服务器
  devServer: {
    host: '127.0.0.1',
    port: '8888'
  },
  // 用来设置引用模块：ts 文件和 js 文件都可以当作模块来使用
  resolve: {
    extensions: ['.ts', '.js']
  }
}