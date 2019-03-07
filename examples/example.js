'use strict';

require('fs');
const path = require('path');
const p = require('./path');
const { resolve } = require('path');
const join = require('.path').join;

const func = () => {};

class Test {
  constructor() {
    this.a = 1;
    const a = this.a;
  }
  get() {
    return this.a;
  }
}

exports.func = func;
exports.func1 = () => 1;
module.exports = new Test();
