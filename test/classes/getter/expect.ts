class GetterSetter {
  val: number | any;
  constructor() {
    this.val = 0;
  }

  get num() {
    return this.val;
  }

  set num(val: any) {
    this.val = val;
  }
}
