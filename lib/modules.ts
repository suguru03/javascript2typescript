import { Ast } from 'prettier-hook';

import { get } from './util';

export function resolve(node) {
  resolveImport(node);
  resolveExportDefault(node);
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

function resolveExportDefault(node) {
  const map = {
    default: 'default',
    named: 'named'
  };
  new Ast()
    .set('ExpressionStatement', (node, key, ast) => {
      const tree = node[key];
      switch (ast.super(node, key)) {
        /*
         * module.exports = {};
         * ↓
         * export default {};
         */
        case map.default:
          node.splice(key, 1, {
            type: 'ExportDefaultDeclaration',
            declaration: tree.expression.right
          });
          break;
        case map.named:
          /*
           * const test = {};
           * exports.test = test;
           * ↓
           * export { test };
           */
          if (tree.expression.left.property.name === tree.expression.right.name) {
            node.splice(key, 1, {
              type: 'ExportNamedDeclaration',
              specifiers: [
                {
                  type: 'ExportSpecifier',
                  local: tree.expression.right,
                  exported: tree.expression.right
                }
              ],
              source: null,
              exportKind: 'value'
            });
            break;
          }
          /*
           * exports.test = { a: 1 };
           * ↓
           * export const test = { a: 1 };
           */
          node.splice(key, 1, {
            type: 'ExportNamedDeclaration',
            specifiers: [],
            source: null,
            declaration: {
              type: 'VariableDeclaration',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: tree.expression.left.property,
                  init: tree.expression.right
                }
              ],
              kind: 'const'
            },
            exportKind: 'value'
          });
          break;
        default:
          return false;
      }
      return true;
    })
    .set(
      'AssignmentExpression',
      (node, key, ast): any => {
        const { left } = node[key];
        if (get(left, ['object', 'name']) === 'module' && get(left, ['property', 'name']) === 'exports') {
          return map.default;
        }
        if (get(left, ['object', 'name']) === 'exports' && get(left, ['property', 'name'])) {
          return map.named;
        }
        return ast.super(node, key);
      }
    )
    .resolveAst(node);
}
