import { Ast } from 'prettier-hook';

import { get } from './util';

export function resolve(node) {
  resolveImport(node);
  resolveExportDefault(node);
}
const defaultList = (process.env.J2T_DEFAULT_EXPORT || '').split(',').map(str => new RegExp(str));

// it only supports top level imports, not support dynamic imports
function resolveImport(node) {
  const body = get(node, ['program', 'body']);
  if (!body) {
    return;
  }
  for (const [idx, tree] of body.entries()) {
    switch (tree.type) {
      case 'ExpressionStatement':
      case 'VariableDeclaration':
        break;
      default:
        continue;
    }
    let depth = 0;
    new Ast()
      .set('ExpressionStatement', (node, key, ast) => {
        if (depth !== 0) {
          return false;
        }
        depth++;
        const res = ast.super(node, key);
        depth--;
        if (!res) {
          return false;
        }
        const [source] = node[key].expression.arguments;
        if (isJson(source)) {
          return false;
        }
        /*
         * require('fs');
         * ↓
         * import 'fs';
         */
        body.splice(idx, 1, {
          type: 'ImportDeclaration',
          specifiers: [],
          source: node[key].expression.arguments[0]
        });
        return true;
      })
      .set('VariableDeclaration', (node, key, ast) => {
        if (depth !== 0) {
          return false;
        }
        depth++;
        const declarator = ast.super(node, key);
        depth--;
        if (!declarator) {
          return false;
        }
        /*
         * cosnt { resolve } = require('path');
         * ↓
         * import { resolve } from 'path';
         */
        if (declarator.id.type === 'ObjectPattern') {
          const [source] = declarator.init.arguments;
          if (isJson(source)) {
            return false;
          }
          body.splice(idx, 1, {
            type: 'ImportDeclaration',
            specifiers: declarator.id.properties.map(prop => ({
              type: 'ImportSpecifier',
              imported: prop
            })),
            source
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
          const [source] = declarator.init.object.arguments;
          if (isJson(source)) {
            return false;
          }
          body.splice(idx, 1, {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportSpecifier',
                imported: declarator.init.property,
                local: declarator.id
              }
            ],
            source
          });
          return true;
        }

        const [source] = declarator.init.arguments;
        if (isJson(source)) {
          return false;
        }
        const type = defaultList.find(re => re.test(source.value))
          ? 'ImportDefaultSpecifier'
          : 'ImportNamespaceSpecifier';
        /*
         * cosnt test = require('path');
         * cosnt test = require('./path');
         * ↓
         * import * as test from 'path';
         * import * as test from './path';
         *
         * with `-d` config,
         * ex) ./bin/j2t.js example -d 'path';
         * import test from 'path';
         */
        body.splice(idx, 1, {
          type: 'ImportDeclaration',
          specifiers: [
            {
              type,
              local: declarator.id
            }
          ],
          source
        });
        return true;
      })
      .set('VariableDeclarator', (node, key, ast) => {
        if (!ast.resolveAst(node[key], 'init')) {
          return false;
        }
        return node[key];
      })
      .set('CallExpression', (node, key, ast) => get(node[key], ['callee', 'name']) === 'require')
      .resolveAst(body, idx);
  }
}

function isJson(tree) {
  return /.json$/.test(tree.value);
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
         * export = {};
         */
        case map.default:
          node.splice(key, 1, {
            type: 'TSExportAssignment',
            expression: tree.expression.right
          });
          // node.splice(key, 1, {
          //   type: 'ExportDefaultDeclaration',
          //   declaration: tree.expression.right
          // });
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
        return false;
      }
    )
    .resolveAst(node);
}
