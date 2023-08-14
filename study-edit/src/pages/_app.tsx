import { type AppType } from "next/app";

import { api } from "~/utils/api";
import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";

import "~/styles/globals.css";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Notifications } from "@mantine/notifications";
import { useColorScheme, useSessionStorage } from "@mantine/hooks";
import { useState } from "react";

const MyApp: AppType = ({ Component, pageProps }) => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useSessionStorage<ColorScheme>({
    key: "displayMode",
    defaultValue: preferredColorScheme,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme,
        }}
      >
        <Notifications position="top-left" zIndex={2077} />
        <Component {...pageProps} />
      </MantineProvider>
    </ColorSchemeProvider>
  );
};

export default api.withTRPC(MyApp);
