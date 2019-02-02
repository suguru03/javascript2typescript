#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const minimist = require('minimist');

const args = minimist(process.argv.slice(2));
const { debug, out } = args;

const indexpath = path.resolve(__dirname, '../dist/index.js');
const hookpath = path.resolve(__dirname, debug ? '../node_modules' : '../..', './prettier-hook/bin/prettier-hook.js');

const command = `${hookpath} --require ${indexpath} ${args._}`;
const res = execSync(command).toString();

if (debug || !out) {
  console.log(res);
}
if (out) {
  fs.writeFileSync(out, res);
}
