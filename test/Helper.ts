import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

import { Agent } from 'vm-agent';

const bindir = path.resolve(__dirname, '..', 'dist/bin');
const binfile = fs
  .readFileSync(path.resolve(bindir, 'j2t.js'), 'utf8')
  .split(/\n/g)
  .slice(1)
  .join('\n');

const filepath = path.resolve(__dirname, 'files', 'class1.js');

export class Helper {
  static async validate(dirname: string) {
    const dirpath = this.resolveFilePath(dirname);
    const sourcefilepath = path.resolve(dirpath, 'source.js');
    const expectfile = fs.readFileSync(path.resolve(dirpath, 'expect.ts'), 'utf8');
    const actual = await new Promise((resolve, reject) => {
      new Agent(binfile, {
        process: { argv: [, , sourcefilepath] },
        __dirname: bindir,
        console: {
          ...console,
          log(code) {
            if (/^Converting.../.test(code)) {
              return;
            }
            resolve(code);
          },
          error: reject
        }
      }).run();
    });
    assert.strictEqual(actual, expectfile);
  }

  private static resolveFilePath(dirname: string) {
    const { stack } = new Error();
    const [, testdir] = stack.match(new RegExp(`${__dirname}/(.+)/test\..+`));
    return path.resolve(__dirname, testdir, dirname);
  }
}
