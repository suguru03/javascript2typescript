export enum Type {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
  Null = 'null',
  Any = 'any'
}
export const TypeAnnotationMap: Record<Type, string> = {
  [Type.Number]: 'NumberTypeAnnotation',
  [Type.String]: 'StringTypeAnnotation',
  [Type.Boolean]: 'BooleanTypeAnnotation',
  [Type.Null]: 'NullLiteralTypeAnnotation',
  [Type.Any]: 'AnyTypeAnnotation'
};

export type PropMap = Map<string, Set<Type>>;

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
