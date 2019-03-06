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
const limit = os.cpus().length;
const args = minimist(process.argv.slice(2));
const { out, rm } = args;

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
  const command = `${hookpath} --require ${indexpath} ${file}`;
  const { stdout } = await exec(command, { maxBuffer: Math.pow(1024, 3) });
  if (!out) {
    console.log(stdout);
    return;
  }
  const filepath = file.replace(/.js$/, '.ts');
  if (out) {
    fs.writeFileSync(filepath, stdout);
  }
  if (rm) {
    fs.unlinkSync(file);
  }
  console.log(`Converted... ${filepath}`);
});
