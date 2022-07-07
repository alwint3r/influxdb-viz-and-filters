import { XYChart, Tooltip, LineSeries, Axis, Grid } from "@visx/xychart";
import {
  FluxTableMetaData,
  InfluxDB,
} from "@influxdata/influxdb-client-browser";
import { useEffect, useMemo, useState } from "react";
import { SimpleKalmanFilter } from "./filters/simple-kalman.filter";
import { MovingAverageFilter } from "./filters/moving-average.filter";

const influxToken = import.meta.env.VITE_INFLUXDB_TOKEN;
const url = import.meta.env.VITE_INFLUXDB_URL;
const org = import.meta.env.VITE_INFLUXDB_ORG;

const defaultQuery = `
from(bucket: "ucc")
  |> range(start: -2h, stop: -1h)
  |> filter(fn: (r) => r["_measurement"] == "temperature")
  |> filter(fn: (r) => r["_field"] == "temperature_1")
  |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)
  |> yield(name: "mean")
`;

const accessors = {
  xAccessor: (d: any) => d.x,
  yAccessor: (d: any) => d.y,
};

type ChartData = {
  x: any;
  y: any;
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

function maxOf(data: ChartData[]) {
  const numbers = data.map((d) => d.y);
  return Math.max(...numbers);
}

function minOf(data: ChartData[]) {
  const numbers = data.map((d) => d.y);
  return Math.min(...numbers);
}

function App() {
  const [remoteData, setRemoteData] = useState<ChartData[]>([]);
  const [query, setQuery] = useState(defaultQuery);
  const [kalmanFilterData, setKalmanFilterData] = useState<ChartData[]>([]);
  const [movingAverageData, setMovingAverageData] = useState<ChartData[]>([]);
  const [chartYScale, setChartYScale] = useState<any>({
    type: "linear",
    domain: [minOf(remoteData) - 0.5, maxOf(remoteData) + 0.5],
    zero: false,
    clamp: true,
    nice: true,
  });
  const kf = useMemo(
    () => new SimpleKalmanFilter(0, 1000, 0.5, 1.2),
    [remoteData]
  );
  const ma = useMemo(() => new MovingAverageFilter(10), [remoteData]);

  useEffect(() => {
    executeQuery(query).then((data) => setRemoteData(data));
  }, [setRemoteData]);

  useEffect(() => {
    const data = [];
    for (const row of remoteData) {
      data.push({ x: row.x, y: kf.update(row.y) });
    }
    data.sort(sortByDate);
    setKalmanFilterData(data);
  }, [remoteData]);

  useEffect(() => {
    const data = [];
    for (const row of remoteData) {
      data.push({ x: row.x, y: ma.update(row.y) });
    }
    data.sort(sortByDate);
    setMovingAverageData(data);
  }, [remoteData]);

  useEffect(() => {
    setChartYScale({
      ...chartYScale,
      domain: [minOf(remoteData) - 1.5, maxOf(remoteData) + 1.5],
    });
  }, [remoteData]);

  return (
    <div className="App">
      <XYChart height={400} xScale={{ type: "time" }} yScale={chartYScale}>
        <Axis orientation="bottom" />
        <Axis orientation="left" />
        <Grid columns={false} numTicks={4} />
        <LineSeries dataKey="Temperature" data={remoteData} {...accessors} />
        <LineSeries
          dataKey="Temperature (Kalman)"
          data={kalmanFilterData}
          {...accessors}
        />
        <LineSeries
          dataKey="Temperature (MA)"
          data={movingAverageData}
          {...accessors}
        />
        <Tooltip
          snapTooltipToDatumX
          snapTooltipToDatumY
          showVerticalCrosshair
          showSeriesGlyphs
          renderTooltip={({ tooltipData, colorScale }) => (
            <div>
              <div
                style={{
                  color: colorScale
                    ? colorScale(tooltipData?.nearestDatum?.key || "")
                    : "",
                  marginBottom: 10,
                }}
              >
                {tooltipData?.nearestDatum?.key}
              </div>
              {accessors
                .xAccessor(tooltipData?.nearestDatum?.datum)
                .toLocaleString()}
              {", "}
              {accessors.yAccessor(tooltipData?.nearestDatum?.datum)}
            </div>
          )}
        />
      </XYChart>

      <div style={{ margin: "16px" }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={12}
          style={{ minWidth: 600, display: "block" }}
        />
        <button
          onClick={() =>
            executeQuery(query).then((data) => setRemoteData(data))
          }
        >
          Execute
        </button>
      </div>
    </div>
  );
}

export default App;
