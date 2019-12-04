class Test {
  constructor() {
    this.a = 1;
  }
}

Test.prototype.test = function() {
  return this.a;
};
