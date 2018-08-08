var webpack = require("webpack");
var path = require("path");

module.exports = {
  entry: {
    main: "./src/index.js",
    Bootstrap: "./src/components/styled/Bootstrap.js",
    Separate: "./src/components/separate/index.js",
    AutocompleteField: "./src/components/AutocompleteField.jsx",
    FormController: "./src/components/FormController.js"
  },
  output: {
    path: path.join(__dirname, ""),
    filename: "[name].js",
    libraryTarget: "umd"
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader:
          "style-loader!css-loader?modules=true&localIdentName=[name]__[local]___[hash:base64:5]"
      },
      {
        test: /.jsx?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        query: {
          presets: ["es2015", "stage-0", "es2017", "react"]
        }
      }
    ]
  },
  devServer: {
    historyApiFallback: true
  }
};
