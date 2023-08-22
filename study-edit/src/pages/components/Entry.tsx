import {
  Autocomplete,
  Badge,
  Button,
  Checkbox,
  Select,
  Spoiler,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { type HotkeyItem, useHotkeys } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { api, type RouterOutputs } from "~/utils/api";
import FlexInputGroup from "./ui/FlexInputGroup";
import { PublicationStatus } from "@prisma/client";

type EntryType = RouterOutputs["generated"]["entry"]["findManyEntry"][0];

export default function Entry(props: {
  entry: EntryType;
  allEntries: EntryType[];
  jumpCallback: (point: string) => unknown;
}) {
  const updateMutation = api.generated.entry.updateOneEntry.useMutation();
  const apiUntil = api.useContext();

  const e = props.entry;

  const form = useForm({
    initialValues: {
      ...e,
      drug_name: e.drug_name || "",
      drug_role: e.drug_role || "",
      usecase: e.usecase || "",
      notes: e.notes || "",
      publicationUrl: e.publicationUrl || "",
      publicationStatus: e.publicationStatus || "",
    },
  });

  const getUnique = (key: keyof EntryType) =>
    [...new Set(props.allEntries.map((e) => e[key]?.toString() || ""))].sort(
      (a, b) => a.length - b.length
    );

  const submitDirty = () => {
    if (updateMutation.isLoading)
      return notifications.show({
        message: "Update in progress. Please try again later.",
        color: "yellow",
      });

    const dirtyValues: Partial<EntryType> = {};

    const keys = Object.keys(form.values) as unknown as [
      keyof typeof form.values
    ];
    for (const key of keys) {
      if (form.isDirty(key)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        dirtyValues[key] = form.values[key];
      }
    }

    if (Object.keys(dirtyValues).length > 0) {
      updateMutation.mutate(
        {
          data: dirtyValues,
          where: {
            id: e.id,
          },
        },
        {
          onSettled(data, error) {
            if (error) notifications.show({ message: error.message });
            else {
              notifications.show({
                title: "Saved sucessfully",
                message: `keys updated: ${Object.keys(dirtyValues).join(", ")}`,
                color: "green",
              });
              form.resetDirty();
              form.resetTouched();
              void apiUntil.generated.entry.findManyEntry.invalidate();
            }
          },
        }
      );
    } else {
      notifications.show({
        message: "Nothing to update, there were no changes",
        color: "yellow",
      });
    }
  };

  const hotkeys: HotkeyItem[] = [
    [
      "mod+S",
      () => {
        submitDirty();
      },
    ],
  ];

  useHotkeys(hotkeys);

  const InvestigatorLastName = (e.ResponsiblePartyInvestigatorFullName || "")
    .split(" ")
    .at(-1);

  return (
    <div>
      <h2 className="m-0 align-middle">
        {e.BriefTitle} <Badge>{e.NCTId}</Badge>
      </h2>

      <div className="my-2 flex gap-2">
        <Badge>{e.OverallStatus}</Badge>
        {e.ResponsiblePartyInvestigatorFullName && (
          <Badge color="grape">{InvestigatorLastName}</Badge>
        )}
        <Badge color="dark" variant="dot" className="normal-case">
          Updated {dayjs().to(e.updatedAt)}
        </Badge>
        <Badge variant="outline" className="normal-case">
          Start: {e.StartDate}
        </Badge>
        {e.CompletionDate && (
          <Badge variant="outline" color="green" className="normal-case">
            Completion: {e.CompletionDate}
          </Badge>
        )}
        {form.isDirty() && (
          <Badge
            color="red"
            variant="filled"
            onClick={submitDirty}
            className="cursor-pointer normal-case"
          >
            Click to save changes
          </Badge>
        )}
      </div>

      <div className="mb-2 flex gap-2"></div>

      <Spoiler maxHeight={50} showLabel="Show more" hideLabel="Hide">
        <div>{e.BriefSummary}</div>
      </Spoiler>

      <FlexInputGroup>
        <TextInput
          {...form.getInputProps("legacy_search_term")}
          label="Legacy search term"
          disabled
        ></TextInput>

        <Autocomplete
          {...form.getInputProps("drug_name")}
          limit={10}
          label="Drug name"
          data={getUnique("drug_name")}
        ></Autocomplete>
      </FlexInputGroup>

      <FlexInputGroup>
        <Autocomplete
          {...form.getInputProps("usecase")}
          label="Usecase"
          data={getUnique("usecase")}
        ></Autocomplete>

        <Autocomplete
          label="Drug role"
          {...form.getInputProps("drug_role")}
          data={getUnique("drug_role")}
        />
      </FlexInputGroup>

      <FlexInputGroup>
        <Select
          {...form.getInputProps("publicationStatus")}
          label="PublicationStatus"
          data={Object.values(PublicationStatus)}
        ></Select>

        <TextInput
          label="Publication Url"
          {...form.getInputProps("publicationUrl")}
        />
      </FlexInputGroup>

      <FlexInputGroup>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(
            `${e.NCTId} OR (${e.BriefTitle} ${
              InvestigatorLastName || ""
            }) pubmed`
          )}`}
          target="_blank"
        >
          Google for publication
        </a>
        {e.publicationUrl && (
          <a href={e.publicationUrl} target="_blank">
            Open Publication Url
          </a>
        )}
      </FlexInputGroup>

      {e.ReferenceCitation.length > 0 && (
        <div>
          <p>There are reference citations available.</p>
          <ul>
            {e.ReferenceCitation.map((c, i) => (
              <li key={i}>
                <a
                  target="_blank"
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    c
                  )}`}
                >
                  {c}
                </a>
              </li>
            ))}
          </ul>
          <Button
            variant="light"
            onClick={() => {
              props.jumpCallback("#moreinfo");
            }}
          >
            Jump to citations
          </Button>
        </div>
      )}

      <Checkbox
        checked={form.values.repurpose}
        {...form.getInputProps("repurpose")}
        label="repurpose?"
        my="md"
      ></Checkbox>

      <Textarea
        label="Notes"
        {...form.getInputProps("notes")}
        className="resize-y"
      ></Textarea>
    </div>
  );
}
