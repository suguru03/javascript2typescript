import { hooks } from 'prettier-hook';

import { classes, strings, modules } from './lib';

function parse(ast) {
  classes.resolve(ast);
  strings.resolve(ast);
  modules.resolve(ast);
  return ast;
}

hooks.babylon.addHook(parse);
hooks.typescript.addHook(parse);
