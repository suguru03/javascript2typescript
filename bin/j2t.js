#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const Aigle = require('aigle');
const glob = require('glob');
const minimist = require('minimist');

const exec = Aigle.promisify(cp.exec);
const args = minimist(process.argv.slice(2));
const { out } = args;

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

const files = glob.sync(`${args._}/**`).filter(file => /.js$/.test(file));

Aigle.eachLimit(files, async file => {
  const command = `${hookpath} --require ${indexpath} ${file}`;
  const { stdout } = await exec(command);
  if (!out) {
    console.log(stdout);
    return;
  }
  const filepath = file.replace(/.js$/, '.ts');
  if (out) {
    fs.writeFileSync(filepath, stdout);
  }
});
