# Visualizing Data from InfluxDB and Use Filters

This repo query time-series data from InfluxDB 2 and apply filters (moving average, kalman filter) to the time-series data and display the result on a chart.

![Visualization](/assets/influx-visx.png)

## Stacks

* React 18
* Vite
* visx by Airbnb
* InfluxDB browser client


## How To

* Clone this repository
* Create an `.env` file with the following values

```sh
VITE_INFLUXDB_ORG=
VITE_INFLUXDB_URL=
VITE_INFLUXDB_TOKEN=
```
* Run `npm run dev`.
* Open `src/App.tsx` and edit the Flux query under the `createQuery` lambda function.

```tsx
const createQuery = (start: Date, end: Date) => `
from(bucket: "ucc")
  |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "temperature")
  |> filter(fn: (r) => r["_field"] == "temperature_1")
  |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)
  |> yield(name: "mean")
`;

```