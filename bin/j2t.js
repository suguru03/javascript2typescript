#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');

const Aigle = require('aigle');
const glob = require('glob');
const minimist = require('minimist');

const exec = Aigle.promisify(cp.exec);
const args = minimist(process.argv.slice(2));
const { write, rm, limit = os.cpus().length } = args;
const defaults = args.d || args.defaults;
const defaultStr = Array.isArray(defaults) ? defaults.join(',') : defaults;

const indexpath = [
  path.resolve(__dirname, '../index.js'),
  // debug
  path.resolve(__dirname, '../dist/index.js')
].find(fs.existsSync);
const hookpath = [
  path.resolve(__dirname, '../../prettier-hook/bin/prettier-hook.js'),
  // debug
  path.resolve(__dirname, '../node_modules/prettier-hook/bin/prettier-hook.js')
].find(fs.existsSync);

const arg = `${args._}`;
const files = glob.sync(/.js$/.test(arg) ? arg : `${arg}/**`).filter(file => /.js$/.test(file));

Aigle.eachLimit(files, limit, async file => {
  console.log(`Converting... ${file}`);
  const command = `J2T_DEFAULT_EXPORT=${defaultStr} ${hookpath} --require ${indexpath} ${file}`;
  const { stdout, stderr } = await exec(command, { maxBuffer: Math.pow(1024, 3) });
  if (!write) {
    console.log(stdout);
  }
  if (stderr) {
    throw stderr;
  }
  if (!write) {
    return;
  }
  const filepath = file.replace(/.js$/, '.ts');
  if (write) {
    fs.writeFileSync(filepath, stdout);
  }
  if (rm) {
    fs.unlinkSync(file);
  }
  console.log(`Converted... ${filepath}`);
});
