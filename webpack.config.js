import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

export default {
    mode: "development",
    devtool: "source-map",

    // Entry points
    entry: {
        "scripts/background/backgroundWorker":
            "./src/scripts/background/backgroundWorker.ts",
        "scripts/content/JapaneseReadingContent":
            "./src/scripts/content/JapaneseReadingContent.ts",
        "scripts/ui/popup": "./src/scripts/ui/popup.ts",
    },

    output: {
        filename: "[name].js",
        path: path.resolve(process.cwd(), "dist"),
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
                    configFile: path.resolve(process.cwd(), "tsconfig.json"),
                },
            },
        ],
    },

    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: "static", to: "." }],
        }),
    ],
};
