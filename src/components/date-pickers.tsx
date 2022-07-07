import { CSSProperties, useEffect, useState } from "react";
import moment from "moment-timezone";

type DatePickersProps = {
  onChange: (start: Date, end: Date) => void;
  style?: CSSProperties;
  start?: Date;
  end?: Date;
};

function toDateObject(localeDate: string) {
  return new Date(
    moment(new Date(localeDate))
      .tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .format()
  );
}

export default function DatePickers(props: DatePickersProps) {
  const {
    style,
    onChange,
    start = new Date(Date.now() - 3600000),
    end = new Date(),
  } = props;
  const [controlledStart, setStart] = useState(
    start.toISOString().slice(0, 16)
  );
  const [controlledEnd, setEnd] = useState(end.toISOString().slice(0, 16));

  useEffect(() => {
    onChange(toDateObject(controlledStart), toDateObject(controlledEnd));
  }, [controlledEnd, controlledStart]);

  return (
    <div style={style}>
      <label style={{ marginRight: "16px" }}>
        Start:{" "}
        <input
          type="datetime-local"
          name="start"
          value={controlledStart}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <label>
        End:{" "}
        <input
          type="datetime-local"
          name="end"
          value={controlledEnd}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>
    </div>
  );
}
