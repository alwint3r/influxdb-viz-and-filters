import { Axis, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart";
import { useEffect, useState } from "react";
import { useVis } from "../contexts/vis.context";
import { ChartData } from "../contexts/vis.reducer";

function maxOf(data: ChartData[]) {
  const numbers = data.map((d) => d.y);
  return Math.max(...numbers);
}

function minOf(data: ChartData[]) {
  const numbers = data.map((d) => d.y);
  return Math.min(...numbers);
}

const accessors = {
  xAccessor: (d: any) => d.x,
  yAccessor: (d: any) => d.y,
};

type TimeFilter = {
  start: Date;
  end: Date;
};

type ChartsProps = {
  timeFilter: TimeFilter;
  loader: (timeFilter: TimeFilter) => Promise<ChartData[]>;
};

export default function Charts(props: ChartsProps) {
  const { timeFilter, loader } = props;
  const { state: vis, setData } = useVis();
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
    loader(timeFilter).then((data) => setData(data));
  }, [loader, timeFilter]);

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
  );
}
