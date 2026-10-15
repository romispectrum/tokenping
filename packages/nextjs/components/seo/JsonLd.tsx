type JsonLdProps = {
  data: object;
};

// "<", ">" and "&" become JSON unicode escapes, so a string value containing "</script>" or "<!--" cannot end or
// alter the script element. The escapes parse back to the same characters.
const JSON_LD_ESCAPES: Record<string, string> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" };

export const serializeJsonLd = (data: object) => JSON.stringify(data).replace(/[<>&]/g, char => JSON_LD_ESCAPES[char]);

/** Server-rendered JSON-LD. Never pass the JSON as a JSX child: React would entity-escape it. */
export const JsonLd = ({ data }: JsonLdProps) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
);
