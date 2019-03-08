import { hooks } from 'prettier-hook';

import * as libs from './lib';

function parse(ast) {
  for (const lib of Object.values(libs)) {
    lib.resolve(ast);
  }
  return ast;
}

hooks.babylon.addHook(parse);
hooks.typescript.addHook(parse);
