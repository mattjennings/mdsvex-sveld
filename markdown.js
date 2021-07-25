const MD_TYPE_UNDEFINED = "";
const ANY_TYPE = "any";
const EMPTY_STR = "";

export function sveldToMarkdown(output, section) {
  function createHeading(value) {
    return {
      type: "heading",
      depth: 2,
      children: [{ type: "text", value }],
    };
  }

  let sections = {
    types: output.typedefs.length
      ? {
          type: "code",
          lang: "typescript",
          value: getTypeDefs({
            typedefs: output.typedefs,
          }),
        }
      : null,
    props: output.props.length
      ? createTable({
          columns: ["Prop", "Type", "Default", "Description"],
          rows: output.props
            .sort((a) => {
              if (typeof a.value === "undefined") return -1;
              if (a.reactive) return -1;
              if (a.constant) return 1;
              return 0;
            })
            .map((prop) => [
              {
                value:
                  prop.name + (typeof prop.value === "undefined" ? "*" : ""),
              },
              { value: formatPropType(prop.type), type: "inlineCode" },
              { value: formatPropValue(prop.value), type: "inlineCode" },
              { value: formatPropDescription(prop.description), type: "html" },
            ]),
        })
      : null,
    slots: output.slots.length
      ? createTable({
          columns: ["Name", "Default", "Props", "Fallback"],
          rows: output.slots.map((slot) => [
            { value: slot.default ? MD_TYPE_UNDEFINED : slot.name },
            { value: slot.default ? "Yes" : "No" },
            { value: formatSlotProps(slot.props) },
            { value: formatSlotFallback(slot.fallback), type: "html" },
          ]),
        })
      : null,
    events: output.events.length
      ? createTable({
          columns: ["Name", "Type", "Detail"],
          rows: output.events.map((event) => [
            { value: event.name },
            { value: event.type, type: "inlineCode" },
            {
              value:
                event.type === "dispatched"
                  ? formatEventDetail(event.detail)
                  : MD_TYPE_UNDEFINED,
              type: "inlineCode",
            },
          ]),
        })
      : null,
  };

  if (section) {
    return [sections[section]];
  } else {
    return [
      sections.types && createHeading("Types"),
      sections.types,
      sections.props && createHeading("Props"),
      sections.props,
      sections.slots && createHeading("Slots"),
      sections.slots,
      sections.events && createHeading("Events"),
      sections.events,
    ].filter(Boolean);
  }
}

function createTable({ columns, rows }) {
  return {
    type: "table",
    align: Array.from({ length: columns.length }).map(() => "left"),
    children: [
      {
        type: "tableRow",
        children: columns.map((value) => ({
          type: "tableCell",
          children: [{ type: "text", value }],
        })),
      },
      ...rows.map((row) => ({
        type: "tableRow",
        children: row.map(({ value, type = "text", ...rest }) => {
          return {
            type: "tableCell",
            children: [{ type: value ? type : "text", value, ...rest }],
          };
        }),
      })),
    ],
  };
}

function formatPropType(type) {
  if (type === undefined) return MD_TYPE_UNDEFINED;
  return type
    .replace(/[{}]/g, (c) => ({ "{": "&#123;", "}": "&#125;" }[c]))
    .replace(/\|/g, "&#124;");
}

function formatPropValue(value) {
  if (!value) {
    return MD_TYPE_UNDEFINED;
  }
  return value
    .replace(/[{}]/g, (c) => ({ "{": "&#123;", "}": "&#125;" }[c]))
    .replace(/`/g, "\\`")
    .replace(/\|/g, "&#124;");
}

function formatPropDescription(description) {
  if (description === undefined || description.trim().length === 0)
    return MD_TYPE_UNDEFINED;
  return escapeHtml(description).replace(/\n/g, "<br />");
}

function escapeHtml(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatSlotProps(props) {
  if (props === undefined || props === "{}") return MD_TYPE_UNDEFINED;
  return formatPropType(formatTsProps(props).replace(/\n/g, " "));
}

function formatSlotFallback(fallback) {
  if (fallback === undefined) return MD_TYPE_UNDEFINED;
  return formatPropType(escapeHtml(fallback).replace(/\n/g, "<br />"));
}

function formatEventDetail(detail) {
  if (detail === undefined) return MD_TYPE_UNDEFINED;
  return formatPropType(
    detail
      .replace(/[{}]/g, (c) => ({ "{": "&#123;", "}": "&#125;" }[c]))
      .replace(/\n/g, " ")
  );
}

function getTypeDefs(def) {
  if (def.typedefs.length === 0) return EMPTY_STR;
  return def.typedefs.map((typedef) => `export ${typedef.ts}`).join("\n\n");
}

function formatTsProps(props) {
  if (props === undefined) return ANY_TYPE;
  return props + "\n";
}
