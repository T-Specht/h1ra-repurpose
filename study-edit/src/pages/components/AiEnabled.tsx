export const AI_IS_ENABLED = process.env.NEXT_PUBLIC_USE_AI === "true";
//export const AI_IS_ENABLED = true;

export const AIEnabled = (props: { children: React.ReactNode }) => {
  if (AI_IS_ENABLED) {
    return <>{props.children}</>;
  } else {
    return null;
  }
};
