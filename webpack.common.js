const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const {DuplicatesPlugin} = require("inspectpack/plugin");
const env = process.env.NODE_ENV;
const dotenv = require('dotenv').config({ path: `./config/env/.env.${env.trim()}` });
const webpack = require('webpack');


module.exports = {
    devtool: "source-map",
        entry: "./src/index.tsx",
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "index_bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.js$/, // Apply this rule to files ending in .js
                exclude: /node_modules/, // Don't apply to files residing in node_modules

                use: {
                    // Use the following loader and options
                    loader: "babel-loader",
                    // We can pass options to both babel-loader and Babel. This option object
                    // will replace babel.config.js
                    options: {
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    debug: true, // Output the targets/plugins used when compiling

                                    // Configure how @babel/preset-env handles polyfills from core-js.
                                    // https://babeljs.io/docs/en/babel-preset-env
                                    //useBuiltIns: 'usage',

                                    // Specify the core-js version. Must match the version in package.json
                                    corejs: 3

                                    // Specify which environments we support/target for our project.
                                    // (We have chosen to specify targets in .browserslistrc, so there
                                    // is no need to do it here.)
                                    // targets: "",
                                }
                            ],

                            // The react preset includes several plugins that are required to write
                            // a React app. For example, it transforms JSX:
                            // <div> -> React.createElement('div')
                            "@babel/preset-react"
                        ],
                        plugins: [
                            [
                                "@babel/plugin-proposal-class-properties",
                                {
                                    "loose": true
                                }
                            ]
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use:  ["style-loader", "css-loader"]
            },
            {
                test: /\.(gif|jpg|png|svg)$/,
                loader: 'file-loader'
            }
            ,{
                test: /\.scss$/,
                loaders: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.ttf$/,
                use:{
                    loader: 'file-loader',
                    options: {
                        name:"fonts/[hash].[ext]"
                    }
                }
            },
            {
                test: /\.(ogg|mp3|wav)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            esModule: false,
                        },
                    },
                ],
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            hash: true,
            filename: "index.html", //target html
            template: "./src/index.html" //source html
        }),
        new DuplicatesPlugin({
            // Emit compilation warning or error? (Default: `false`)
            emitErrors: false,
            // Display full duplicates information? (Default: `false`)
            verbose: false
        }),
        new webpack.DefinePlugin({
            'mode': JSON.stringify('development'),
            "process.env": JSON.stringify(dotenv.parsed)
        })
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "styled-components": path.resolve("./", "node_modules", "styled-components"),
            react: path.resolve('./node_modules/react'),
            React: path.resolve('./node_modules/react'),
        }
    },
    devServer: {
        proxy: {
        }
    }
};
