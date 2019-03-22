#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as os from 'os';

import Aigle from 'aigle';
import * as glob from 'glob';
import * as minimist from 'minimist';

const exec = Aigle.promisify(cp.exec);
const args = minimist(process.argv.slice(2));
const { write, rm, limit = os.cpus().length } = args;
const defaults = args.d || args.defaults;
const defaultStr = Array.isArray(defaults) ? defaults.join(',') : defaults;

const indexpath = path.resolve(__dirname, '../index.js');
const hookpath = [
  path.resolve(__dirname, '../../prettier-hook/bin/prettier-hook.js'),
  // debug
  path.resolve(__dirname, '../../node_modules/prettier-hook/bin/prettier-hook.js')
].find(fs.existsSync);
if (!hookpath) {
  throw new Error('Hook path not found');
}

const arg = `${args._}`;
const files: string[] = glob.sync(/.js$/.test(arg) ? arg : `${arg}/**`).filter(file => /.js$/.test(file));

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