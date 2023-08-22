import { type NextPage } from "next";
import Head from "next/head";

import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";

import "react-reflex/styles.css";

import { api, type RouterOutputs } from "~/utils/api";
import Entry from "./components/Entry";
import Layout, { HEADER_HEIGHT } from "./components/Layout";
import {
  Button,
  CloseButton,
  MediaQuery,
  NumberInput,
  Select,
  TextInput,
  useMantineColorScheme,
} from "@mantine/core";
import { useHotkeys, useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { IconArrowsMoveHorizontal } from "@tabler/icons-react";
import { ElementRef, useEffect, useRef } from "react";

const jumpPointOptions = [
  "",
  "#wrapper",
  "#studydesc",
  "#studydesign",
  "#armgroup",
  "#outcomemeasures",
  "#eligibility",
  "#contactlocation",
  "#moreinfo",
];

type Entry = RouterOutputs["generated"]["entry"]["findManyEntry"][0];

const InnerCompontent = ({ ...props }: { entries: Entry[] }) => {
  const [currentIndex, setCurrentIndex] = useLocalStorage({
    key: "currentIndex",
    defaultValue: 0,
  });

  const [filter, setFilter] = useLocalStorage({
    key: "filter",
    defaultValue: "",
  });
  const [filterKey, setFilterKey] = useLocalStorage({
    key: "filterKey",
    defaultValue: "BriefTitle",
  });

  const setFilterSafe = (val: string) => {
    setFilter(val);

    // Cannot be in useEffect because then it cannot be resurrected from local storage
    setCurrentIndex(0);
  };

  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const entries =
    filter.trim() != ""
      ? props.entries.filter(
          (e) =>
            e[filterKey as keyof Entry] !== null &&
            e[filterKey as keyof Entry]
              ?.toString()
              .toLowerCase()
              .includes(filter.toLowerCase())
        )
      : props.entries;

  const current = entries[currentIndex];
  const [jumpPoint, setJumpPoint] = useLocalStorage({
    key: "jumpPount",
    defaultValue: "",
  });

  const setCurrentIndexSafe = (val: number) => {
    if (val < 0) return setCurrentIndex(0);
    if (val > entries.length - 1) return setCurrentIndex(entries.length - 1);
    setCurrentIndex(val);
  };

  const next = () => setCurrentIndexSafe(currentIndex + 1);
  const prev = () => setCurrentIndexSafe(currentIndex - 1);

  useHotkeys([
    ["shift+ArrowRight", next],
    ["shift+ArrowLeft", prev],
  ]);

  const mediaMatch = useMediaQuery("(max-width: 500px)");
  const panelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (mediaMatch && panelRef) {
      panelRef.current?.collapse();
    }

    if (!mediaMatch && panelRef) {
      panelRef.current?.expand();
    }
  }, [mediaMatch]);

  return (
    <div
      className=""
      style={{
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      }}
    >
      <PanelGroup direction="horizontal">
        <Panel>
          <div className="h-full overflow-y-scroll px-4 pb-10">
            <div>
              <div className="my-3 flex flex-wrap items-end justify-between">
                <Button onClick={prev} disabled={currentIndex == 0} size="xs">
                  Previous
                </Button>
                <NumberInput
                  size="xs"
                  w={70}
                  description={`${currentIndex + 1} von ${entries.length}`}
                  value={currentIndex + 1}
                  required
                  min={1}
                  max={entries.length}
                  onChange={(val) => {
                    if (val != "") {
                      setCurrentIndexSafe(val - 1);
                    }
                  }}
                ></NumberInput>
                <Select
                  size="xs"
                  label="Jump point"
                  w={100}
                  value={jumpPoint}
                  onChange={(val) => setJumpPoint(val || "")}
                  data={jumpPointOptions}
                ></Select>

                <div className="flex gap-1">
                  <TextInput
                    label="Quick Filter"
                    placeholder="Filter"
                    size="xs"
                    value={filter}
                    w={120}
                    onChange={(e) => setFilterSafe(e.target.value)}
                    rightSection={
                      <CloseButton
                        onClick={() => setFilterSafe("")}
                        size="xs"
                      />
                    }
                  ></TextInput>
                  <Select
                    searchable
                    label="Quick Filter Key"
                    size="xs"
                    value={filterKey}
                    onChange={(val) => setFilterKey(val || "BriefTitle")}
                    data={Object.keys(props.entries[0] || {})}
                    w={120}
                  ></Select>
                </div>

                <Button
                  onClick={next}
                  size="xs"
                  disabled={currentIndex == entries.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>

            {current && (
              <Entry
                jumpCallback={(val) => {
                  setJumpPoint(val);
                }}
                entry={current}
                key={current.id}
                allEntries={props.entries}
              ></Entry>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className={`w-1 bg-slate-400`}></PanelResizeHandle>
        <Panel collapsible ref={panelRef}>
          <div className="h-full">
            {current && (
              <iframe
                is="x-frame-bypass"
                style={{
                  filter: dark ? "invert(90%) hue-rotate(180deg)" : "",
                }}
                key={`https://classic.clinicaltrials.gov/ct2/show/${current.NCTId}${jumpPoint}`}
                width="100%"
                height="100%"
                frameBorder="0"
                //src={`/api/ctg/${current.NCTId}${jumpPoint}`}
                src={`https://classic.clinicaltrials.gov/ct2/show/${current.NCTId}${jumpPoint}`}
                //src={`https://clinicaltrials.gov/study/${current.NCTId}`}
                className="h-full w-full border-0 "
              ></iframe>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

const Home: NextPage = () => {
  const _entries = api.generated.entry.findManyEntry.useQuery({
    // where: {
    //   repurpose: true,
    // },
    orderBy: {
      id: "asc",
    },
  });

  if (!_entries.data) return <div>Loading</div>;

  const entries = _entries.data;

  return (
    <Layout>
      <InnerCompontent entries={entries}></InnerCompontent>
    </Layout>
  );
};

export default Home;
