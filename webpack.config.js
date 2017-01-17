module.exports = {
    entry: {
        bundle: './src/restify.js',
    },
    output: {
        path: './dist',
        filename: 'restify.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
      ]
    }
};
