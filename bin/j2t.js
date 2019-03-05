#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const minimist = require('minimist');

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

const command = `${hookpath} --require ${indexpath} ${args._}`;
const res = execSync(command).toString();

if (!out) {
  console.log(res);
}
if (out) {
  fs.writeFileSync(out, res);
}
