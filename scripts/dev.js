const execa = require('execa');
const { fuzzyMatchTarget } = require('./utils');
const args = require('minimist')(process.argv.slice(2));

const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'promise-all';
const formats = args.formats || args.f;
const sourceMap = args.sourceMap || args.f;
const commit = execa.sync('git', [ 'rev-parse', 'HEAD' ]).stdout.slice(0, 7);
console.log(target, formats, sourceMap, commit);

const msg = [
  `COMMIT:${commit}`,
  `TARGET:${target}`,
  `FORMATS:${formats || 'global'}`,
  sourceMap ? `SOURCE_MAP:true` : ''
]
  .filter(Boolean)
  .join(',');
execa('rollup', [ '-wc', '--environment', msg ], { stdio: 'inherit' });
