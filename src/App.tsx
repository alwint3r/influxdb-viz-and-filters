import {
  FluxTableMetaData,
  InfluxDB,
} from "@influxdata/influxdb-client-browser";
import { useState } from "react";
import { VisProvider } from "./contexts/vis.context";
import { ChartData } from "./contexts/vis.reducer";
import DatePickers from "./components/date-pickers";
import Charts from "./components/charts";

const influxToken = import.meta.env.VITE_INFLUXDB_TOKEN;
const url = import.meta.env.VITE_INFLUXDB_URL;
const org = import.meta.env.VITE_INFLUXDB_ORG;

const createQuery = (start: Date, end: Date) => `
from(bucket: "ucc")
  |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "temperature")
  |> filter(fn: (r) => r["_field"] == "temperature_1")
  |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)
  |> yield(name: "mean")
`;

type TimeFilter = {
  start: Date;
  end: Date;
};

function sortByDate(a: ChartData, b: ChartData) {
  return new Date(a.x).getTime() - new Date(b.x).getTime();
}

function executeQuery(query: string): Promise<Array<ChartData>> {
  const queryApi = new InfluxDB({ url, token: influxToken }).getQueryApi(org);

  return new Promise((resolve, reject) => {
    const rows: ChartData[] = [];
    queryApi.queryRows(query, {
      next: (row: string[], tableMeta: FluxTableMetaData) => {
        const o = tableMeta.toObject(row);
        rows.push({ x: new Date(o._time), y: o._value });
      },
      error: (error: Error) => {
        reject(error);
      },
      complete: () => {
        rows.sort(sortByDate);
        resolve(rows);
      },
    });
  });
}

function App() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: new Date(Date.now() - 3600000),
    end: new Date(),
  });

  return (
    <div className="App">
      <VisProvider>
        <Charts
          loader={(timeFilter) => {
            const query = createQuery(timeFilter.start, timeFilter.end);
            return executeQuery(query);
          }}
          timeFilter={timeFilter}
        />
      </VisProvider>
      <div style={{ margin: "16px" }}>
        <DatePickers
          style={{ marginBottom: "16px" }}
          onChange={(start: Date, end: Date) => {
            setTimeFilter({ start, end });
          }}
        />
      </div>
    </div>
  );
}

export default App;
