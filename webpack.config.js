import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

const isProduction = process.env.NODE_ENV === "production";

export default {
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? false : "source-map",

    // Entry points
    entry: {
        "scripts/background/backgroundWorker":
            "./src/background/backgroundWorker.ts",
        "scripts/content/linguisticsFunctionsManager":
            "./src/content/linguisticsFunctionsManager.ts",
        "scripts/ui/popup": "./src/ui/popup.ts",
        "scripts/ui/app": "./src/ui/app.ts",
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
            patterns: [
                { from: "static", to: "." },
                { from: "manifest.json", to: "manifest.json" },
            ],
        }),
    ],
};
