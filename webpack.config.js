const path = require("path");
const CopyWepackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "source-map",
  // Entry points
  entry: {
    "scripts/background/backgroundWorker":
      "./src/scripts/background/backgroundWorker.ts",
    "scripts/content/kanjiReading": "./src/scripts/content/kanjiReading.ts",
    "scripts/ui/popup": "./src/scripts/ui/popup.ts",
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  // Just allow ts and js.
  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          configFile: path.resolve(__dirname, "tsconfig.json"),
        },
      },
    ],
  },

  plugins: [
    new CopyWepackPlugin({
      patterns: [{ from: "static", to: "." }],
    }),
  ],
};
