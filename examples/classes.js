class Test {
  constructor() {
    this.a = 1;
    const a = this.a;
  }
  get() {
    return this.a;
  }
}

class GetterSetter {
  constructor() {
    this.val = 0;
  }

  get num() {
    return this.val;
  }

  set num(val) {
    this.val = val;
  }
}
