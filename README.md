Converts typescript to javascript and minify's the code on the fly.

## Installation

To install the package run the following

```
npm install ts-middleware
```

## Usage

This is the most basic way to run the middleware

```js
const tsm = require('ts-middleware')

app.use(tsm(path.join(__dirname, 'path/to/tsconfig.json')))
app.use('/js', express.static(path.join(__dirname, 'public/js')))
```

**Note:** In your `tsconfig.json` file you must have either `outDir` or `outFile` set in your `compilerOptions`.

There are three ways to call the middleware:

The first way uses all the default settings, which will compress and mangle the javascript.

```js
app.use(tsm(path.join(__dirname, '../ts/tsconfig.json')))
```

The second way is to customize the middleware by adding custom uglification settings, or disabling it alltogether.

```js
app.use(tsm({
  projects: {
    config: path.join(__dirname, '../ts/tsconfig.json'),
    shouldUglify: true, // enable/disable uglification
    uglify: { /* uglifyjs options here */ }
  }
}))
```

The final, and third way is if you have mutliple projects that you want to build. Pass in an array of settings similar to the above.

```js
app.use(tsm({
  projects: [
    {
      config: path.join(__dirname, '../ts/project1/tsconfig.json')
    },
    {
      config: path.join(__dirname, '../ts/project2/tsconfig.json')
    }
  ]
}))
```

To see all the uglify settings visit [uglify-es](https://www.npmjs.com/package/uglify-es#minify-options)