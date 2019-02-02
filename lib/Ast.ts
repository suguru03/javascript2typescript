// TODO: move to prettier-hooktype AstResolver = (node: any, key: any, ast?: Ast) => any;

interface ResolverMap {
  [targetType: string]: AstResolver;
}

const rootKey = Symbol('root');

export class Ast {
  private readonly resolverMap: ResolverMap = {};
  private readonly resolver: AstResolver;

  set(type: string, resolver: AstResolver) {
    this.resolverMap[type] = resolver;
    return this;
  }

  resolveAst(parent: any, key: any = rootKey): boolean {
    parent = key === rootKey ? { [key]: parent } : parent;
    const tree = parent[key];
    if (!tree) {
      return false;
    }
    if (Array.isArray(tree)) {
      let resolved = false;
      for (let i = 0; i < tree.length; i++) {
        resolved = this.resolveAst(tree, i) || resolved;
      }
      return resolved;
    }
    const { type } = tree;
    const resolver = this.resolverMap[type];
    if (resolver) {
      return resolver(parent, key, this);
    }
    switch (type) {
      case 'Program':
        return this.resolveAst(tree, 'body');
      case 'ImportDeclaration':
        return false;
      case 'ExportDefaultDeclaration':
      case 'ExportNamedDeclaration':
        return this.resolveAst(tree, 'declaration');
      // class
      case 'ClassBody':
        return this.resolveAst(tree, 'body');
      case 'ClassProperty':
        return this.resolveAst(tree, 'typeAnnotation');
      case 'ClassDeclaration':
        return this.resolveAst(tree, 'body');
      case 'MethodDefinition':
        return false;
      case 'TemplateLiteral':
        return this.resolveAst(tree, 'expressions');
      case 'ObjectExpression':
        return this.resolveAst(tree, 'properties');
      case 'Property':
        return this.resolveAst(tree, 'value');
      case 'FunctionExpression':
        return this.resolveAll(tree, ['body', 'returnType']);
      case 'ArrowFunctionExpression':
        return this.resolveAst(tree, 'body');
      case 'ReturnStatement':
      case 'UpdateExpression':
      case 'UnaryExpression':
        return this.resolveAst(tree, 'argument');
      case 'BlockStatement':
        return this.resolveAst(tree, 'body');
      case 'IfStatement':
        return this.resolveAll(tree, ['test', 'consequent']);
      case 'SwitchStatement':
        return this.resolveAll(tree, ['discriminant', 'cases']);
      case 'SwitchCase':
        return this.resolveAll(tree, ['test', 'consequent']);
      case 'ExpressionStatement':
        return this.resolveAst(tree, 'expression');
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'AssignmentExpression':
        return this.resolveAll(tree, ['left', 'right']);
      case 'MemberExpression':
        return this.resolveAst(tree, 'object');
      case 'CallExpression':
        return this.resolveAll(tree, ['callee', 'arguments']);
      case 'TryStatement':
        return this.resolveAll(tree, ['block', 'handler', 'finalizer']);
      case 'CatchClause':
        return this.resolveAst(tree, 'body');
      case 'Super':
      case 'ThisExpression':
        return false;
      case 'ForStatement':
        return this.resolveAll(tree, ['init', 'test', 'update', 'body']);
      case 'ForOfStatement':
        return this.resolveAll(tree, ['left', 'right', 'body']);
      case 'Identifier':
        return this.resolveAst(tree, 'typeAnnotation');
      // variables
      case 'VariableDeclaration':
        return this.resolveAst(tree, 'declarations');
      case 'VariableDeclarator':
        return this.resolveAst(tree, 'init');
      case 'AwaitExpression':
        return false;
      // TS
      case 'TSModuleBlock':
      case 'TSModuleDeclaration':
      case 'TSAbstractClassDeclaration':
        return this.resolveAst(tree, 'body');
      case 'TSTypeAnnotation':
        return this.resolveAst(tree, 'typeAnnotation');
      case 'TSAsExpression':
        return this.resolveAst(tree, 'expression');
      case 'TSNamespaceExportDeclaration':
      case 'TSTypeQuery':
      case 'TSAnyKeyword':
      case 'TSStringKeyword':
      case 'TSNumberKeyword':
        return false;
      case 'TSUnionType':
        return this.resolveAst(tree, 'types');
      case 'TSTypeReference':
        return this.resolveAll(tree, ['typeName', 'typeParameters']);
      case 'TSFunctionType':
        return this.resolveAll(tree, ['typeParameters', 'parameters', 'typeAnnotation']);
      case 'TSTypeParameterInstantiation':
        return this.resolveAst(tree, 'params');
      case 'TSTupleType':
        return this.resolveAst(tree, 'elementTypes');
    }
    return false;
  }

  private resolveAll(parent, keys = []): boolean {
    let resolved = false;
    for (const key of keys) {
      resolved = this.resolveAst(parent, key) || resolved;
    }
    return resolved;
  }
}
