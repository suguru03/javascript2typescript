class Test {
  constructor() {
    this.get = this.get.bind(this);
  }
  get() {
    return 1;
  }
}
