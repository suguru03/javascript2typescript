import { addHook } from 'prettier-hook/hooks/parser-typescript';

import { Ast } from './lib';

addHook(parse);

function parse(ast) {
  new Ast().set('MethodDefinition', resolveJavaScript).resolveAst(ast);
  return ast;
}

function resolveJavaScript(parent, key) {
  const tree = parent[key];
  if (!tree.decorators) {
    return;
  }
}
