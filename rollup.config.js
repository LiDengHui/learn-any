import path from 'path';

import ts from 'rollup-plugin-typescript2';

import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

const masterVersion = require('./package.json').version;
const packagesDir = path.resolve(__dirname, 'packages');
const packageDir = path.resolve(packagesDir, process.env.TARGET);
const name = path.basename(packageDir);
const resolve = (p) => path.resolve(packageDir, p);
const pkg = require(resolve('package.json'));
const packageOptions = pkg.buildOptions || {};

let hasTSChecked = false;

const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: `es`
  },
  'esm-browser': {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: `es`
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: `cjs`
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: `iife`
  },

  // runtime-only builds, for main "vue" package only
  'esm-bundler-runtime': {
    file: resolve(`dist/${name}.runtime.esm-bundler.js`),
    format: `es`
  },
  'esm-browser-runtime': {
    file: resolve(`dist/${name}.runtime.esm-browser.js`),
    format: 'es'
  },
  'global-runtime': {
    file: resolve(`dist/${name}.runtime.global.js`),
    format: 'iife'
  }
};

const defaultFormats = [ 'esm-bundler', 'cjs' ];

const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',');

const packageFormats = inlineFormats || packageOptions.formats || defaultFormats;

const packageConfigs = process.env.PROD_ONLY
  ? []
  : packageFormats.map((format) => {
      return createConfig(format, outputConfigs[format]);
    });

if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach((format) => {
    if (packageConfigs.prod === false) {
      return;
    }
    if (format === 'cjs') {
      packageConfigs.push(createProductionConfig(format));
    }

    if (/^(global|esm-browser)(-runtime)?/.test(format)) {
      packageConfigs.push(createMinifiedConfig(format));
    }
  });
}

export default packageConfigs;

function createConfig(format, output, plugins = []) {
  output.sourcemap = !!process.env.SOURCE_MAP;
  output.externalLiveBindings = false;

  const isNodeBuild = format === 'cjs';
  const isGlobalBuild = /global/.test(format);
  const isBrowserESMBuild = /esm-browser/.test(format);
  if (isGlobalBuild) {
    output.name = packageOptions.name;
  }
  const shouldEmitDeclarations = process.env.TYPES != null && !hasTSChecked;
  const tsPlugin = ts({
    check: process.env.NODE_ENV === 'production' && !hasTSChecked,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: shouldEmitDeclarations,
        declarationMap: shouldEmitDeclarations
      },
      exclude: [ '**/__tests__', 'test-dts' ]
    }
  });

  const entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`;
  const external =
    isGlobalBuild || isBrowserESMBuild
      ? packageOptions.enableNonBrowserBranches
        ? // externalize postcss for @vue/compiler-sfc
          // because @rollup/plugin-commonjs cannot bundle it properly
          [ 'postcss' ]
        : // normal browser builds - non-browser only imports are tree-shaken,
          // they are only listed here to suppress warnings.
          [ 'source-map', '@babel/parser', 'estree-walker' ]
      : // Node / esm-bundler builds. Externalize everything.
        [ ...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}) ];
  output.globals = {
    postcss: 'postcss'
  };

  const nodePlugins = [];

  return {
    input: resolve(entryFile),
    // Global and Browser ESM builds inlines everything so that they can be
    // used alone.
    external,
    plugins: [
      json({
        namedExports: false
      }),
      tsPlugin,
      createReplacePlugin(),
      ...nodePlugins,
      ...plugins
    ],
    output,
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
    treeshake: {
      moduleSideEffects: false
    }
  };
}

function createReplacePlugin() {
  const replacements = {
    __COMMIT__: `"${process.env.COMMIT}"`,
    __VERSION__: `"${masterVersion}"`
  };

  replacements.preventAssignment = true;

  return replace(replacements);
}

function createProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: outputConfigs[format].format
  });
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser');

  return createConfig(
    format,
    {
      file: outputConfigs[format].file.replace(/\.js/, '.prod.js'),
      format: outputConfigs[format].format
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true
        },
        safari10: true
      })
    ]
  );
}
