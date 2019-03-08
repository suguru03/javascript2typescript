import { Ast } from 'prettier-hook';
import { get } from './util';

export function resolve(node) {
  resolveInitVariables(node);
}

function resolveInitVariables(node) {
  new Ast()
    .set('VariableDeclarator', (node, key, ast) => {
      const tree = node[key];
      switch (get(tree, ['init', 'type'])) {
        case 'ArrayExpression':
          tree.id.typeAnnotation = {
            type: 'TypeAnnotation',
            typeAnnotation: {
              type: 'ArrayTypeAnnotation',
              elementType: {
                type: 'AnyTypeAnnotation'
              }
            }
          };
          return true;
      }
      return false;
    })
    .resolveAst(node);
}
