const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function() {
  return {

    mode: "development",

    entry: {},

    output: {
      /**
       * OUTPUT_DIRECTORY = /dist
       */
      path: path.resolve(__dirname, "dist"),
    },

    module: {
      rules: [
        {
          test: /\.ejs$/,
          use: [
            /**
             * HtmlLoader -> TemplateEjsLoader
             */ 
            "html-loader",
            "template-ejs-loader",
          ],
        },
      ]
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "views/pages", "index.ejs"),
        filename: "index.html",
        minify: {
          collapseWhitespace: true,
          preserveLineBreaks: true,
        },
      }),
    ],

  }
}
