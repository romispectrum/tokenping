// UTC, so the server and every reader see the same calendar day as the YYYY-MM-DD in the post meta.
const POST_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-14" -> "14 October 2026". */
export const formatPostDate = (date: string) => POST_DATE_FORMAT.format(new Date(`${date}T00:00:00Z`));
