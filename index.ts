import { Ast, hooks } from 'prettier-hook';

import { strings, modules } from './lib';

function parse(ast) {
  strings.resolve(ast);
  modules.resolve(ast);
  return ast;
}

hooks.babylon.addHook(parse);
