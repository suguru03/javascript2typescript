import { Ast } from 'prettier-hook';

export function resolve(node) {
  resolveImport(node);
}

function resolveImport(node) {
  new Ast()
    .set('ExpressionStatement', (node, key, ast) => {
      if (!ast.super(node, key)) {
        return false;
      }
      /*
       * require('fs');
       * ↓
       * import 'fs';
       */
      node.splice(key, 1, {
        type: 'ImportDeclaration',
        specifiers: [],
        source: node[key].expression.arguments[0]
      });
      return true;
    })
    .set('VariableDeclaration', (node, key, ast) => {
      const declarator = ast.super(node, key);
      if (!declarator) {
        return false;
      }
      /*
       * cosnt { resolve } = require('path');
       * ↓
       * import { resolve } from 'path';
       */
      if (declarator.id.type === 'ObjectPattern') {
        node.splice(key, 1, {
          type: 'ImportDeclaration',
          specifiers: declarator.id.properties.map(prop => ({
            type: 'ImportSpecifier',
            imported: prop
          })),
          importKind: null,
          source: declarator.init.arguments[0]
        });
        return true;
      }
      /*
       * cosnt test = require('fs');
       * ↓
       * import * as test from 'fs';
       */
      node.splice(key, 1, {
        type: 'ImportDeclaration',
        specifiers: [
          {
            type: 'ImportNamespaceSpecifier',
            local: declarator.id
          }
        ],
        importKind: 'value',
        source: declarator.init.arguments[0]
      });
      return true;
    })
    .set('VariableDeclarator', (node, key, ast) => {
      if (!ast.resolveAst(node[key], 'init')) {
        return false;
      }
      return node[key];
    })
    .set('Identifier', (node, key, ast) => node[key].name === 'require')
    .resolveAst(node);
}
