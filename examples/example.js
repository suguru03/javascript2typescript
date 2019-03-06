class Test {
  constructor() {
    this.a = null;
    this.a = 1;
  }
  static get() {
    this.a = 'a';
    return this.a;
  }
}
