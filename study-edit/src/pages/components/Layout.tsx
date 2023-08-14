/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import {
  AppShell,
  Navbar,
  Header,
  Group,
  NavLink,
  MediaQuery,
  Burger,
  ColorScheme,
  useMantineColorScheme,
  ActionIcon,
} from "@mantine/core";
import Link from "next/link";
import {
  IconColumns,
  IconFlask,
  IconHome,
  IconMoonStars,
  IconSun,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useColorScheme, useMediaQuery } from "@mantine/hooks";

interface LayoutProps {
  children: React.ReactNode;
}

const CustomNavLink = (props: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => {
  const router = useRouter();
  return (
    <Link href={props.href} passHref className="no-underline">
      <NavLink
        label={props.label}
        icon={props.icon}
        active={router.pathname == props.href}
      />
    </Link>
  );
};

const MenuLinks = () => {
  return (
    <>
      <CustomNavLink
        href="/"
        icon={<IconColumns size={16} stroke={1.5} />}
        label="Home"
      ></CustomNavLink>
    </>
  );
};

const BREAKPOINT = 720;
const HIDE_STYLES = { display: "none" };

export const HEADER_HEIGHT = 60;

const Layout = (props: LayoutProps) => {
  const [opened, setOpened] = useState(false);
  const breakPointReached = useMediaQuery(`(min-width: ${BREAKPOINT}px)`);

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <AppShell
      // navbar={
      //   <Navbar width={{ base: 300 }} p="xs">
      //     {/* Navbar content */}
      //   </Navbar>
      // }
      m={0}
      p={0}
      header={
        <Header height={HEADER_HEIGHT} p="xs">
          <div>
            <Group p={0} position="left">
              <MediaQuery largerThan={BREAKPOINT} styles={HIDE_STYLES}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  color="gray"
                  mr={0}
                />
              </MediaQuery>
              {/* <img src={logo.src} height={40} alt="Logo" /> */}
              <div className="logo mr-3 flex h-[40px] items-center">
                <IconFlask size={30}></IconFlask>
                <div>
                  <div className="font-bold">StudyEdit</div>
                  <div className="-mt-2 text-[10px]">Tim Specht</div>
                </div>
              </div>
              <MediaQuery smallerThan={BREAKPOINT} styles={HIDE_STYLES}>
                <Group>
                  <MenuLinks></MenuLinks>
                  <ActionIcon
                    variant="outline"
                    color={dark ? "yellow" : "blue"}
                    onClick={() => toggleColorScheme()}
                    title="Toggle color scheme"
                  >
                    {dark ? (
                      <IconSun size="1.1rem" />
                    ) : (
                      <IconMoonStars size="1.1rem" />
                    )}
                  </ActionIcon>
                </Group>
              </MediaQuery>
            </Group>
          </div>
        </Header>
      }
      navbarOffsetBreakpoint={BREAKPOINT}
      navbar={
        <Navbar
          hiddenBreakpoint={10e6}
          hidden={!opened || breakPointReached}
          // width={{ sm: 200, lg: 300 }}
        >
          <Navbar.Section grow>
            <MenuLinks />
          </Navbar.Section>
        </Navbar>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          padding: 0,
          paddingTop: "var(--mantine-header-height, 0px)",
        },
      })}
    >
      <div>{props.children}</div>
    </AppShell>
  );
};

export default Layout;
