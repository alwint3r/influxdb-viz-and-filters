import { IFilter } from "./base";

export class MovingAverageFilter implements IFilter {
  private data: number[] = [];
  private initialized: boolean = false;
  private p: number = 0;
  private sum: number = 0;
  private numOfSamples: number = 0;

  constructor(n: number, defaultValue?: number) {
    this.numOfSamples = n;
    if (typeof defaultValue === "number") {
      this.initialize(defaultValue);
    }
  }

  private initialize(value: number) {
    this.data = [];
    for (let i = 0; i < this.numOfSamples; i++) {
      this.data.push(value);
    }

    this.sum = this.data.reduce((prev, current) => prev + current, 0);
    this.initialized = true;
  }

  update(measurement: number): number {
    if (this.initialized === false) {
      this.initialize(measurement);
    }

    this.data[this.p++] = measurement;
    this.sum = this.data.reduce((prev, current) => prev + current, 0);

    if (this.p >= this.numOfSamples) {
      this.p = 0;
    }
  
    return this.get();
  }

  get() {
    return this.sum / this.numOfSamples;
  }
}
