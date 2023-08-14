import React from "react";

export default function FlexInputGroup(props: { children: React.ReactNode }) {
  return (
    <div className="gap-2 grid grid-cols-1 md:grid-cols-2">{props.children}</div>
  );
}
