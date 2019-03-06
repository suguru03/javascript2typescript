import { hooks } from 'prettier-hook';

import { classes, funcs, strings, modules } from './lib';

function parse(ast) {
  classes.resolve(ast);
  funcs.resolve(ast);
  strings.resolve(ast);
  modules.resolve(ast);
  return ast;
}

hooks.babylon.addHook(parse);
hooks.typescript.addHook(parse);
