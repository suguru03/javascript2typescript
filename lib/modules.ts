import { Ast } from 'prettier-hook';

export function resolve(node) {
  console.log(JSON.stringify(node, null, 2));
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
          source: declarator.init.arguments[0]
        });
        return true;
      }
      /*
       * const join = require('path').join;
       * const join2 = require('path').join;
       * ↓
       * import { join } from 'fs';
       * import { join as join2 } from 'fs';
       */
      if (declarator.init.property) {
        console.log(JSON.stringify(declarator.init, null, 2));
        node.splice(key, 1, {
          type: 'ImportDeclaration',
          specifiers: [
            {
              type: 'ImportSpecifier',
              imported: declarator.init.property,
              local: declarator.id
            }
          ],
          source: declarator.init.object.arguments[0]
        });
        return true;
      }

      /*
       * cosnt test = require('path');
       * ↓
       * import * as test from 'path';
       */
      node.splice(key, 1, {
        type: 'ImportDeclaration',
        specifiers: [
          {
            type: 'ImportNamespaceSpecifier',
            local: declarator.id
          }
        ],
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
