class Test {
  constructor() {
    this.a = 1;
    const a = this.a;
  }
  get() {
    return this.a;
  }
}

Test.a = 2;
