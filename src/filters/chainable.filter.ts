import { IFilter } from "./base";

export class ChainableFilter implements IFilter {
  constructor(private filterA: IFilter, private filterB: IFilter) {}

  get(): number {
    return this.filterB.get();
  }

  update(measurement: number): number {
    this.filterB.update(this.filterA.update(measurement));
    return this.get();
  }
}
