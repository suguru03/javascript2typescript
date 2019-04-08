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

function resolveJsDoc(node) {
  new Ast()
    .set('FunctionDeclaration', resolveArguments)
    .set('ClassMethod', resolveArguments)
    .resolveAst(node);
}
type OptionalMap = Map<string, boolean>;

function resolveArguments(node, key) {
  const { leadingComments = [], params } = node[key];
  if (!params || params.length === 0) {
    return false;
  }
  const paramMap: PropMap = new Map();
  const optionalMap: OptionalMap = new Map();
  if (leadingComments.length !== 0) {
    // TODO: find a better js doc parser
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
  new Ast()
    .set('AssignmentExpression', (tree, key) => {
      const { left, right } = tree[key];
      return resolveAssignmentExpression(left, right, paramMap, optionalMap);
    })
    .resolveAst(node, key);
  for (let tree of params) {
    switch (tree.type) {
      case 'AssignmentPattern':
        const { left, right } = tree;
        resolveAssignmentExpression(left, right, paramMap, optionalMap);
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

function resolveAssignmentExpression(left, right, paramMap: PropMap, optionalMap: OptionalMap) {
  if (right.type === 'LogicalExpression') {
    return resolveAssignmentExpression(left, right.right, paramMap, optionalMap);
  }
  setTypeToPropMap(left.name, paramMap, right.type);
  optionalMap.delete(left.name);
  return true;
}
