/**
 * @param {string|number} key
 * @param {string} num
 * @returns {Object}
 */
function func(key, num = 1, bool = false, unknown) {
  return { key, num, bool, unknown };
}

/**
 * @param {number} [num]
 * @param {string} [str]
 * @returns {Object}
 */
function optional(num, str = 'str') {
  return { num };
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
