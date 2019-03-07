import { Ast } from 'prettier-hook';

import { Type, PropMap, getTypeAnnotation, setTypeToPropMap } from './types';

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
  const optionalMap: Map<string, boolean> = new Map();
  if (leadingComments.length !== 0) {
    const [{ value }] = leadingComments;
    value
      .split(/\n/g)
      .map(str => str.match(/@params?\s{(.+)}\s(.+)/))
      .filter(arr => !!arr)
      .forEach(([, typeStr, key]) => {
        const arr = key.match(/^\[(.+)\]/);
        const optional = !!arr;
        if (optional) {
          [, key] = arr;
        }
        optionalMap.set(key, optional);
        for (const type of typeStr.split('|')) {
          if (typeMap.has(type)) {
            setTypeToPropMap(key, paramMap, typeMap.get(type));
          }
        }
      });
  }
  for (let tree of params) {
    switch (tree.type) {
      case 'AssignmentPattern':
        const { left } = tree;
        setTypeToPropMap(left.name, paramMap, tree.right.type);
        tree = left;
      case 'Identifier':
        const { name } = tree;
        const typeSet = paramMap.get(name);
        const typeAnnotation = getTypeAnnotation(typeSet);
        tree.optional = optionalMap.get(name);
        tree.typeAnnotation = {
          type: 'TypeAnnotation',
          typeAnnotation
        };
        break;
    }
  }
  return true;
}
