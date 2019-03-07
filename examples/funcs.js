/**
 * @param {string|number} key
 * @returns {Object}
 */
function func(key, num) {
  return { key };
}

class Test {
  /**
   * @param {boolean[]} bool
   */
  static get(bool, a, b, c) {
    return bool;
  }

  /**
   * @param {boolean[]} bool
   */
  get(bool, a, b, c) {
    return bool;
  }
}
