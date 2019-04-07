class Test {
  a: number;
  constructor() {
    this.a = 1;
    const a = this.a;
  }
  get() {
    return this.a;
  }
}
