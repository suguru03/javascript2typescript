export enum Type {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
  // Null = 'null',
  Any = 'any'
}
export const TypeAnnotationMap: Record<Type, string> = {
  [Type.Number]: 'NumberTypeAnnotation',
  [Type.String]: 'StringTypeAnnotation',
  [Type.Boolean]: 'BooleanTypeAnnotation',
  // [Type.Null]: 'NullLiteralTypeAnnotation',
  [Type.Any]: 'AnyTypeAnnotation'
};

export type PropMap = Map<string, Set<Type>>;
export type PropSymbolMap = Map<string, Set<Type> | Symbol>;

export function getTypeAnnotation(set: Set<Type> | null) {
  const types = set ? Array.from(set).map(type => TypeAnnotationMap[type]) : [];
  switch (types.length) {
    case 0:
      return { type: TypeAnnotationMap[Type.Any] };
    case 1:
      return { type: types[0] };
    default:
      return {
        type: 'UnionTypeAnnotation',
        types: types.map(type => ({ type }))
      };
  }
}

export function setTypeToPropMap(name: string, propMap: PropSymbolMap, type: string = '') {
  const set = propMap.get(name) || new Set();
  // instanceof Symbol doesn't work on ts-node?
  if (!(set instanceof Set)) {
    return;
  }
  propMap.set(name, set);
  switch (type) {
    case Type.Number:
    case 'NumericLiteral':
      set.add(Type.Number);
      break;
    case Type.String:
    case 'StringLiteral':
      set.add(Type.String);
      break;
    case Type.Boolean:
    case 'BooleanLiteral':
      set.add(Type.Boolean);
      break;
    // case Type.Null:
    // case 'NullLiteral':
    //   set.add(Type.Null);
    //   break;
    default:
      set.add(Type.Any);
      break;
  }
}
