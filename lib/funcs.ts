import { Ast } from 'prettier-hook';

import { Type, PropMap, getTypeAnnotation } from './types';

export function resolve(node) {
  resolveJsDoc(node);
}

const typeMap: Map<string, Type> = new Map();
for (const type of Object.values(Type)) {
  typeMap.set(type, type);
  typeMap.set(type.slice(0, 1).toUpperCase() + type.slice(1), type);
}

// TODO: find a better parser
function resolveJsDoc(node) {
  new Ast()
    .set('FunctionDeclaration', resolveArguments)
    .set('ClassMethod', resolveArguments)
    .resolveAst(node);
}

function resolveArguments(node, key) {
  const { leadingComments = [], params } = node[key];
  if (!params || params.length === 0) {
    return false;
  }
  const paramMap: PropMap = new Map();
  if (leadingComments.length !== 0) {
    const [{ value }] = leadingComments;
    value
      .split(/\n/g)
      .map(str => str.match(/@params?\s{(.+)}\s(.+)/))
      .filter(arr => !!arr)
      .forEach(([, typeStr, key]) => {
        const set = paramMap.get(key) || new Set();
        paramMap.set(key, set);
        for (const type of typeStr.split('|')) {
          if (typeMap.has(type)) {
            set.add(typeMap.get(type));
          }
        }
      });
  }
  for (const tree of params) {
    if (tree.type !== 'Identifier') {
      continue;
    }
    const typeSet = paramMap.get(tree.name);
    const typeAnnotation = getTypeAnnotation(typeSet);
    tree.typeAnnotation = {
      type: 'TypeAnnotation',
      typeAnnotation
    };
  }
  return true;
}
