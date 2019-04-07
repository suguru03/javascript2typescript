import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

import { Agent } from 'vm-agent';
import * as parallel from 'mocha.parallel';

const bindir = path.resolve(__dirname, '..', 'dist/bin');
const binfile = fs
  .readFileSync(path.resolve(bindir, 'j2t.js'), 'utf8')
  .split(/\n/g)
  .slice(1)
  .join('\n');

for (const dirname of fs.readdirSync(__dirname)) {
  const dirpath = path.join(__dirname, dirname);
  if (!fs.statSync(dirpath).isDirectory()) {
    continue;
  }
  parallel(dirname, () => {
    for (const testdir of fs.readdirSync(dirpath)) {
      const testpath = path.join(dirpath, testdir);
      it(testdir, async () => validate(testpath));
    }
  });
}

async function validate(dirpath: string) {
  const sourcefilepath = path.resolve(dirpath, 'source.js');
  const expectfile = fs.readFileSync(path.resolve(dirpath, 'expect.ts'), 'utf8');
  const actual = await new Promise((resolve, reject) => {
    const logs: string[] = [];
    new Agent(binfile, {
      process: {
        argv: [, , sourcefilepath]
      },
      __dirname: bindir,
      console: {
        ...console,
        log(code) {
          if (/^Converting/.test(code)) {
            return;
          }
          if (/^Finished/.test(code)) {
            const result = logs.pop();
            logs.forEach(log => console.log(log));
            return resolve(result);
          }
          logs.push(code);
        },
        error: reject
      }
    }).run();
  });
  assert.strictEqual(actual, expectfile);
}
