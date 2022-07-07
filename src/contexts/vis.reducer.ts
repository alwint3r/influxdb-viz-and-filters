import { Reducer } from "react";
import { IFilter } from "../filters/base";
import { ChainableFilter } from "../filters/chainable.filter";
import { MovingAverageFilter } from "../filters/moving-average.filter";
import { SimpleKalmanFilter } from "../filters/simple-kalman.filter";

export type ChartData = {
  x: any;
  y: number;
};

export type VisChart = {
  data: ChartData[];
  filter?: IFilter;
};

type Charts = {
  [key: string]: VisChart;
};

export type VisState = {
  charts: Charts;
};

interface VisAction {
  type: string;
  [k: string]: any;
}

interface VisDataLoadedAction extends VisAction {
  rows: ChartData[];
}

export const VisActions = {
  DATA_LOADED: "DATA_LOADED",
};

export type VisReducer = Reducer<VisState, VisAction>;

export function visReducer(state: VisState, action: VisAction) {
  switch (action.type) {
    case VisActions.DATA_LOADED:
      const act = action as VisDataLoadedAction;
      const copied = { ...state };
      copied.charts["Temperature"] = {
        data: act.rows,
      };

      const kf = new SimpleKalmanFilter(0, 1000, 0.5, 1.2);
      copied.charts["Temperature (KF)"] = {
        data: act.rows.map((row) => ({ ...row, y: kf.update(row.y) })),
        filter: kf,
      };

      const ma = new MovingAverageFilter(10);
      copied.charts["Temperature (MA)"] = {
        data: act.rows.map((row) => ({ ...row, y: ma.update(row.y) })),
        filter: ma,
      };

      const chainable = new ChainableFilter(new SimpleKalmanFilter(0, 1000, 0.5, 1.2), new MovingAverageFilter(10));
      copied.charts["Temperature (KFMA)"] = {
        data: act.rows.map((row) => ({ ...row, y: chainable.update(row.y)})),
        filter: chainable,
      };

      return {
        ...copied,
      };
  }
  return state;
}
