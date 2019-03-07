import { Ast } from 'prettier-hook';

import { PropMap, getTypeAnnotation, setTypeToPropMap } from './types';
import { get } from './util';

export function resolve(node) {
  new Ast().set('ClassDeclaration', resolveInstanceVariables).resolveAst(node);
}

function resolveInstanceVariables(node, key) {
  const staticPropMap: PropMap = new Map();
  const instancePropMap: PropMap = new Map();
  let propMap: PropMap;
  const tree = node[key];
  new Ast()
    .set('ClassMethod', (node, key, ast) => {
      propMap = node[key].static ? staticPropMap : instancePropMap;
      return ast.super(node, key);
    })
    .set('AssignmentExpression', (node, key, ast) => {
      const { left, right } = node[key];
      if (!new Ast().set('ThisExpression', () => true).resolveAst(left)) {
        return false;
      }
      const name = get(left, ['object', 'property', 'name']) || get(left, ['property', 'name']);
      if (!name) {
        console.error(JSON.stringify(left, null, 4));
        throw new Error('name not found');
      }
      setTypeToPropMap(name, propMap, right.type);
      return true;
    })
    .resolveAst(tree);

  // remove getter/setter
  new Ast()
    .set('ClassMethod', (node, key) => {
      const tree = node[key];
      if (tree.kind !== 'get' && tree.kind !== 'set') {
        return false;
      }
      propMap = tree.static ? staticPropMap : instancePropMap;
      propMap.delete(tree.key.name);
      return true;
    })
    .resolveAst(tree);

  tree.body = tree.body || { type: 'ClassBody', body: [] };
  assignPropMap(tree, instancePropMap, false);
  assignPropMap(tree, staticPropMap, true);
  return true;
}

function assignPropMap(node, propMap: PropMap, staticProperty: boolean) {
  const props: any[] = Array.from(propMap).map(([name, set]) => {
    const typeAnnotation = getTypeAnnotation(set);
    return {
      type: 'ClassProperty',
      key: {
        type: 'Identifier',
        name
      },
      value: null,
      computed: false,
      variance: null,
      static: staticProperty,
      typeAnnotation: {
        type: 'TypeAnnotation',
        typeAnnotation
      }
    };
  });
  node.body.body.unshift(...props);
}
