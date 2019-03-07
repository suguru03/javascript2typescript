'use strict';

require('fs');
const path = require('path');
const p = require('./path');
const { resolve } = require('path');
const join = require('.path').join;
require('fs')();

(() => {
  require('./test');
})();
for (const num of [1, 2, 3]) {
  require(num);
}

exports.test = function test() {
  const test = require('test');
};

exports.func = func;
exports.func1 = () => 1;
module.exports = new Test();
