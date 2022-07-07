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