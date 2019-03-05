import { Ast } from 'prettier-hook';

export function resolve(node) {
  removeUseStrict(node);
  return node;
}

function removeUseStrict(node) {
  new Ast()
    .set('Directive', (node, idx, ast) => {
      if (!ast.super(node, idx)) {
        return false;
      }
      node.splice(idx, 1);
      return true;
    })
    .set('DirectiveLiteral', (node, key) => node[key].value === 'use strict')
    .resolveAst(node);
}
