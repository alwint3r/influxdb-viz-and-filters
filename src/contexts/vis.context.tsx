import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  ChartData,
  VisActions,
  visReducer,
  VisReducer,
  VisState,
} from "./vis.reducer";

type VisContextValue = {
  state: VisState;
  setData: (rows: ChartData[]) => void;
}

export const VisContext = createContext<VisContextValue | null>(null);

export function VisProvider(props: any) {
  const [state, dispatch] = useReducer<VisReducer>(visReducer, {
    charts: {
      Temperature: {
        data: [],
      },
    },
  });

  const setData = useCallback(
    (rows: ChartData[]) => {
      dispatch({ type: VisActions.DATA_LOADED, rows });
    },
    [dispatch]
  );

  const value = useMemo(
    () => ({
      state,
      setData,
    }),
    [state]
  );

  return <VisContext.Provider value={value} {...props} />;
}

export function useVis() {
  const ctx = useContext<VisContextValue | null>(VisContext);
  if (!ctx) {
    throw new Error("useVis must be used within VisContext");
  }

  return ctx;
}
