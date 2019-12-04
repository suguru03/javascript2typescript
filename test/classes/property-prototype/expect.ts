class Test {
  test: any;
  a: number;
  constructor() {
    this.a = 1;
  }
}

Test.prototype.test = function() {
  return this.a;
};
