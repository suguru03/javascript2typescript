import { Ast } from 'prettier-hook';

import { get } from './util';

export function resolve(node) {
  new Ast().set('ClassDeclaration', resolveInstanceVariables).resolveAst(node);
}

enum Type {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
  Null = 'null',
  Any = 'any'
}
const TypeAnnotationMap: Record<Type, string> = {
  [Type.Number]: 'NumberTypeAnnotation',
  [Type.String]: 'StringTypeAnnotation',
  [Type.Boolean]: 'BooleanTypeAnnotation',
  [Type.Null]: 'NullLiteralTypeAnnotation',
  [Type.Any]: 'AnyTypeAnnotation'
};

type PropMap = Map<string, Set<Type>>;

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
      if (!ast.super(node, key)) {
        return false;
      }
      const { left, right } = node[key];
      const { name } = left.property;
      if (!propMap.has(name)) {
        propMap.set(name, new Set());
      }
      const set = propMap.get(name);
      switch (right.type) {
        case 'NumericLiteral':
          set.add(Type.Number);
          break;
        case 'StringLiteral':
          set.add(Type.String);
          break;
        case 'BooleanLiteral':
          set.add(Type.Boolean);
          break;
        case 'NullLiteral':
          set.add(Type.Null);
          break;
        default:
          set.add(Type.Any);
          break;
      }
      return true;
    })
    .set('ThisExpression', () => true)
    .resolveAst(tree);
  tree.body = tree.body || { type: 'ClassBody', body: [] };
  assignPropMap(tree, instancePropMap, false);
  assignPropMap(tree, staticPropMap, true);
  return true;
}

function assignPropMap(node, propMap: PropMap, staticProperty: boolean) {
  const props: any[] = Array.from(propMap).map(([name, set]) => {
    const types = Array.from(set).map(type => TypeAnnotationMap[type]);
    const typeAnnotation =
      types.length === 1
        ? {
            type: types[0]
          }
        : {
            type: 'UnionTypeAnnotation',
            types: types.map(type => ({ type }))
          };
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
