import { XYChart, Tooltip, LineSeries, Axis, Grid } from "@visx/xychart";
import {
  FluxTableMetaData,
  InfluxDB,
} from "@influxdata/influxdb-client-browser";
import { useEffect, useMemo, useState } from "react";
import { SimpleKalmanFilter } from "./filters/simple-kalman.filter";
import { MovingAverageFilter } from "./filters/moving-average.filter";
import { useVis } from "./contexts/vis.context";
import { VisChart } from "./contexts/vis.reducer";

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
  const { state: vis, setData } = useVis();
  const [query, setQuery] = useState(defaultQuery);
  const [chartYScale, setChartYScale] = useState<any>({
    type: "linear",
    domain: [
      minOf(vis.charts["Temperature"].data) - 0.5,
      maxOf(vis.charts["Temperature"].data) + 0.5,
    ],
    zero: false,
    clamp: true,
    nice: true,
  });

  useEffect(() => {
    executeQuery(query).then((data) => setData(data));
  }, [setData]);

  useEffect(() => {
    setChartYScale({
      ...chartYScale,
      domain: [
        minOf(vis.charts["Temperature"].data) - 0.5,
        maxOf(vis.charts["Temperature"].data) + 0.5,
      ],
    });
  }, [vis]);

  return (
    <div className="App">
      <XYChart height={600} xScale={{ type: "time" }} yScale={chartYScale}>
        <Axis orientation="bottom" />
        <Axis orientation="left" />
        <Grid columns={false} numTicks={4} />
        {Object.keys(vis.charts).map((key: string) => (
          <LineSeries
            key={key}
            dataKey={key}
            data={vis.charts[key].data}
            {...accessors}
          />
        ))}
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
          onClick={() => executeQuery(query).then((data) => setData(data))}
        >
          Execute
        </button>
      </div>
    </div>
  );
}

export default App;
