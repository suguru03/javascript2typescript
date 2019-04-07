import { Ast } from 'prettier-hook';

import { PropSymbolMap, getTypeAnnotation, setTypeToPropMap } from './types';
import { get } from './util';

export function resolve(node) {
  new Ast().set('ClassDeclaration', resolveInstanceVariables).resolveAst(node);
}

const classMethod = Symbol('classMethod');

function resolveInstanceVariables(node, key) {
  const staticPropSymbolMap: PropSymbolMap = new Map();
  const instancePropSymbolMap: PropSymbolMap = new Map();
  let propMap: PropSymbolMap;
  const tree = node[key];
  checkMethods(tree, staticPropSymbolMap, instancePropSymbolMap);
  new Ast()
    .set('ClassMethod', (node, key, ast) => {
      propMap = node[key].static ? staticPropSymbolMap : instancePropSymbolMap;
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

  tree.body = tree.body || { type: 'ClassBody', body: [] };
  assignPropMap(tree, instancePropSymbolMap, false);
  assignPropMap(tree, staticPropSymbolMap, true);
  return true;
}

function checkMethods(tree, staticPropSymbolMap: PropSymbolMap, instancePropSymbolMap: PropSymbolMap) {
  let propMap: PropSymbolMap;
  new Ast()
    .set('ClassMethod', (node, key) => {
      const tree = node[key];
      propMap = tree.static ? staticPropSymbolMap : instancePropSymbolMap;
      propMap.set(tree.key.name, classMethod);
      return true;
    })
    .resolveAst(tree);
}

function assignPropMap(node, propMap: PropSymbolMap, staticProperty: boolean) {
  const props: any[] = [];
  for (const [name, set] of propMap.entries()) {
    if (!(set instanceof Set)) {
      continue;
    }
    const typeAnnotation = getTypeAnnotation(set);
    props.push({
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
    });
  }
  node.body.body.unshift(...props);
}
