import { Ast, hooks } from 'prettier-hook';

import { string, module } from './lib';

function parse(ast) {
  new Ast().set('VariableDeclaration', resolve).resolveAst(ast);
  // modify AST
  return ast;
}

hooks.babylon.addHook(parse);

export function resolve(node, key) {
  string.resolve(node, key);
  module.resolve(node, key);
  return true;
}
