function readFormatterPart(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function parseTimeValue(value: string) {
  const [hour = "09", minute = "00", second = "00"] = value.split(":");
  return {
    hour: Number.parseInt(hour, 10),
    minute: Number.parseInt(minute, 10),
    second: Number.parseInt(second, 10)
  };
}

export function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset"
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number.parseInt(readFormatterPart(parts, "year"), 10),
    month: Number.parseInt(readFormatterPart(parts, "month"), 10),
    day: Number.parseInt(readFormatterPart(parts, "day"), 10),
    hour: Number.parseInt(readFormatterPart(parts, "hour"), 10),
    minute: Number.parseInt(readFormatterPart(parts, "minute"), 10),
    second: Number.parseInt(readFormatterPart(parts, "second"), 10),
    offsetLabel: readFormatterPart(parts, "timeZoneName")
  };
}

export function getOffsetMinutes(date: Date, timeZone: string) {
  const { offsetLabel } = getTimeZoneParts(date, timeZone);
  const matched = offsetLabel.match(/GMT([+-])(\d{2}):?(\d{2})/u);

  if (!matched) {
    return 0;
  }

  const [, sign, hours, minutes] = matched;
  const absoluteMinutes =
    Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);

  return sign === "-" ? -absoluteMinutes : absoluteMinutes;
}

export function toUtcFromTimeZone(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timeZone: string;
}) {
  const utcGuess = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second
  );
  const offsetMinutes = getOffsetMinutes(new Date(utcGuess), input.timeZone);

  return new Date(utcGuess - offsetMinutes * 60_000);
}

export function addDaysToDateParts(
  input: { year: number; month: number; day: number },
  dayOffset: number
) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day));
  date.setUTCDate(date.getUTCDate() + dayOffset);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

export function parseDateTimeLocalInTimeZone(
  rawValue: string,
  timeZone: string
) {
  const raw = rawValue.trim();

  if (!raw) {
    return null;
  }

  const matched = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/u
  );

  if (!matched) {
    return new Date(raw).toISOString();
  }

  const [, year, month, day, hour, minute, second = "00"] = matched;

  return toUtcFromTimeZone({
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
    day: Number.parseInt(day, 10),
    hour: Number.parseInt(hour, 10),
    minute: Number.parseInt(minute, 10),
    second: Number.parseInt(second, 10),
    timeZone
  }).toISOString();
}

export function formatDateTimeLocalInTimeZone(
  isoValue: string | null | undefined,
  timeZone: string
) {
  if (!isoValue) {
    return "";
  }

  const parts = getTimeZoneParts(new Date(isoValue), timeZone);

  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function buildRescheduledIsoForDateKey(input: {
  dateKey: string;
  timeZone: string;
  existingIso?: string | null;
  fallbackTime?: string;
}) {
  const [year, month, day] = input.dateKey.split("-").map(Number);
  const timeParts = input.existingIso
    ? getTimeZoneParts(new Date(input.existingIso), input.timeZone)
    : parseTimeValue(input.fallbackTime ?? "09:00:00");

  return toUtcFromTimeZone({
    year: year ?? 0,
    month: month ?? 1,
    day: day ?? 1,
    hour: timeParts.hour,
    minute: timeParts.minute,
    second: timeParts.second ?? 0,
    timeZone: input.timeZone
  }).toISOString();
}
