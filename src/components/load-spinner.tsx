import * as React from "react";
import { useObservableState, useStore } from "../store/store";
import "./load-spinner.css";
interface ILoadSpinnerProps {}

const LoadSpinner: React.FunctionComponent<ILoadSpinnerProps> = React.memo(
  (props) => {
    const store = useStore();
    const loading = useObservableState(store.loading$);
    const LoadingNode = React.useMemo(() => {
      if (loading) {
        return (
          <>
            <div className="lds-default">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div className="modal"></div>
          </>
        );
      } else {
        return null;
      }
    }, [loading]);
    return <React.Fragment>{LoadingNode}</React.Fragment>;
  }
);

export default LoadSpinner;
