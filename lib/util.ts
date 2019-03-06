export const get = (obj: object, paths: string[], defaults?: any): any => {
  let i = -1;
  let l = paths.length;
  while (++i < l && obj) {
    obj = obj[paths[i]];
  }
  return obj || defaults;
};
