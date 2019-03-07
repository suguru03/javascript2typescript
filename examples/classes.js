class Test {
  constructor() {
    this.a = {};
    this.setup();
  }

  /**
   *
   * @private
   */
  setup() {
    //setup aws and upload queues per index
    _.each([{ id: 1 }], obj => {
      this.queue[obj.id] = [];
    });
  }
}

module.exports = CloudSearchService;
