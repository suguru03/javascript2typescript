export function resolve(node, key) {
  removeUseStrict(node, key);
  return node;
}

function removeUseStrict(node, key) {
  console.log(require('util').inspect(node, false, null));
}
