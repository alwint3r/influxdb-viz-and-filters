export interface IFilter {
  get(): number;
  update(measurement: number): number;
};
