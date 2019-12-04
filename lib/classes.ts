import { Ast } from 'prettier-hook';

import { PropSymbolMap, getTypeAnnotation, setTypeToPropMap } from './types';
import { get } from './util';

export function resolve(node) {
  const staticMap: Map<string, PropSymbolMap> = new Map();
  const instanceMap: Map<string, PropSymbolMap> = new Map();
  new Ast()
    .set('ClassDeclaration', (node, key, ast) => {
      const { name } = node[key].id;
      staticMap.set(name, new Map());
      instanceMap.set(name, new Map());
      return ast.super(node, key);
    })
    .set('AssignmentExpression', (node, key) => checkAssignmentVariables(node, key, staticMap, instanceMap))
    .resolveAst(node);

  // define class properties
  new Ast()
    .set('ClassDeclaration', (node, key) => {
      const { name } = node[key].id;
      return resolveClassProperties(node, key, staticMap.get(name), instanceMap.get(name));
    })
    .resolveAst(node);
}

const classMethod = Symbol('classMethod');

function resolveClassProperties(node, key, staticPropMap: PropSymbolMap, instancePropMap: PropSymbolMap) {
  let propMap: PropSymbolMap;
  const tree = node[key];
  checkMethods(tree, staticPropMap, instancePropMap);
  new Ast()
    .set('ClassMethod', (node, key, ast) => {
      propMap = node[key].static ? staticPropMap : instancePropMap;
      return ast.super(node, key);
    })
    .set('AssignmentExpression', (node, key) => {
      const { left, right } = node[key];
      if (!new Ast().set('ThisExpression', () => true).resolveAst(left)) {
        return false;
      }
      setTypeToPropMap(getAssignmentName(left), propMap, right.type);
      return true;
    })
    .resolveAst(tree);

  tree.body = tree.body || { type: 'ClassBody', body: [] };
  assignPropMap(tree, instancePropMap, false);
  assignPropMap(tree, staticPropMap, true);
  return true;
}

function checkMethods(tree, staticPropMap: PropSymbolMap, instancePropMap: PropSymbolMap) {
  let propMap: PropSymbolMap;
  new Ast()
    .set('ClassMethod', (node, key) => {
      const tree = node[key];
      propMap = tree.static ? staticPropMap : instancePropMap;
      propMap.set(tree.key.name, classMethod);
      return true;
    })
    .resolveAst(tree);
}

function checkAssignmentVariables(
  node,
  key,
  staticPropMap: Map<string, PropSymbolMap>,
  instancePropMap: Map<string, PropSymbolMap>
) {
  return new Ast()
    .set('AssignmentExpression', (tree, key) => {
      let { left, right } = tree[key];
      const prototype = get(left, ['object', 'property', 'name']) === 'prototype';
      const className = get(left, prototype ? ['object', 'object', 'name'] : ['object', 'name']);
      const propMap = prototype ? instancePropMap.get(className) : staticPropMap.get(className);
      if (!propMap) {
        return false;
      }
      setTypeToPropMap(getAssignmentName(left), propMap, right.type);
      return true;
    })
    .resolveAst(node, key);
}

function getAssignmentName(left) {
  const name = get(left, ['property', 'name']) || get(left, ['object', 'property', 'name']);
  if (!name) {
    console.error(JSON.stringify(left, null, 4));
    throw new Error('name not found');
  }
  return name;
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
