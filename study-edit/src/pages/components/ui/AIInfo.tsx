import { Tooltip } from "@mantine/core";
import React from "react";

const AIInfo: React.FunctionComponent<{ text?: string; tooltip?: string }> = (
  props
) => {
  return (
    <div className="mb-3">
      <Tooltip label={props.tooltip}>
        <div className="text-sm opacity-75">🤖 {props.text}</div>
      </Tooltip>
    </div>
  );
};

AIInfo.defaultProps = {
  text: "Loading...",
  tooltip: "This information is AI generated.",
};

export default AIInfo;
