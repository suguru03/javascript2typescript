import { addHook } from 'prettier-hook/hooks/parser-typescript';

import { Ast } from './lib';

addHook(parse);

function parse(ast) {
  console.log(require('util').inspect(ast, false, null));
  new Ast().set('MethodDefinition', resolveJavaScript).resolveAst(ast);
  return ast;
}

function resolveJavaScript(parent, key) {
  const tree = parent[key];
  if (!tree.decorators) {
    return;
  }
}
