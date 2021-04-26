const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const execa = require('execa');

const { gzipSync } = require('zlib');
const { compress } = require('brotli');
const { targets: allTargets, fuzzyMatchTarget } = require('./utils');
const { execArgv } = require('process');

const args = require('minimist')(process.argv.slice(2));

const targets = args._;

const formats = args.formats || args.f;

const devOnly = args.devOnly || args.d;

const prodOnly = !devOnly && (args.prodOnly || args.p);

const sourceMap = args.sourceMap || args.s;

const isRelease = args.release;

const buildTypes = args.t || args.types || isRelease;

const buildAllMatching = args.all || args.a;

const commit = execa.sync('git', [ 'rev-parse', 'HEAD' ]).stdout.slice(0, 7);

run();

async function run() {
  if (isRelease) {
    await fs.remove(path.resolve(__dirname, '../node_modules/.rts2_cache/'));
  }

  if (!targets.length) {
    await buildAll(allTargets);
    checkAllSizes(allTargets);
  } else {
    await buildAll(fuzzyMatchTarget(targets, buildAllMatching));
    checkAllSIzes(fuzzyMatchTarget(targets, buildAllMatching));
  }
}

async function buildAll(targets) {
  await runParalle(require('os').cpus().length, targets, build);
}

async function runParalle(maxConcurrency, source, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source));
    ret.push(p);
    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing).indexOf(e), i);
      executing.push(i);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(ret);
}

async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`);
  const pkg = require(`${pkgDir}/package.json`);

  if (isRelease && pkg.private) {
    return;
  }

  if (formats) {
    await fs.remove(`${pkgDir}/dist`);
  }

  const env = (pkg.buildOptions && pkg.buildOptions.env) || devOnly ? 'development' : 'production';
  await execa(
    'rollup',
    [
      '-c',
      '--environment',
      [
        `COMMIT:${commit}`,
        `NODE_ENV:${env}`,
        `TARGET:${target}`,
        formats ? `FORMATS:${formats}` : ``,
        buildTypes ? `TYPES:true` : ``,
        prodOnly ? `PROD_ONLY:true` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``
      ]
        .filter(Boolean)
        .join(',')
    ],
    { stdio: 'inherit' }
  );
}

function checkAllSizes(targets) {
  if (devOnly) return;
  for (const target of targets) {
    checkSize(target);
  }
}

function checkSize(target) {
  const pkgDir = path.resolve(`packages/${target}`);
  checkFileSize(`${pkgDir}/dist/${target}.global.prod.js`);
}

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const file = fs.readFileSync(filePath);
  const minSize = (file.length / 1024).toFixed(2) + 'kb';
  const gzipped = gzipSync(file);
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb';
  const compressed = compressed(file);
  const compressedSize = (compressed.length / 1024).toFixed + 'kb';

  console.log(
    `${chalk.gray(
      chalk.bold(path.basename(filePath))
    )} min: ${minSize} / gzip: ${gzippedSize} / brotli: ${compressedSize}`
  );
}
