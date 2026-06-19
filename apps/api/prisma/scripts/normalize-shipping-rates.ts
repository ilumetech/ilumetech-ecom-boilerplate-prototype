import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INPUT_HEADERS = [
  'origin',
  'origin_label',
  'destination',
  'destination_label',
  'weight',
  'service',
  'shipment_type',
  'tariff_text',
  'tariff_idr',
  'etd',
  'source_url',
] as const;

const OUTPUT_HEADERS = [
  'origin_code',
  'origin_label',
  'destination_code',
  'destination_label',
  'weight_kg',
  'service',
  'shipment_type',
  'tariff_idr',
  'etd',
] as const;

type InputHeader = (typeof INPUT_HEADERS)[number];
type CsvRecord = Record<InputHeader, string>;

async function main(): Promise<void> {
  const csvPath = resolve(process.cwd(), '..', '..', 'jne_jakarta_ongkir.csv');
  const input = await readFile(csvPath, 'utf8');
  const records = parseCsv(input);
  const normalized = normalizeRecords(records);
  const output = serializeCsv(normalized);

  await writeFile(csvPath, output, 'utf8');
  process.stdout.write(`Normalized ${normalized.length} shipping rates.\n`);
}

function parseCsv(csv: string): CsvRecord[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  validateHeaders(headers);

  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    ) as CsvRecord;
  });
}

function validateHeaders(headers: string[]): asserts headers is InputHeader[] {
  const matches = INPUT_HEADERS.every((header, index) => {
    return headers[index] === header;
  });

  if (!matches) throw new Error('Unexpected shipping rate CSV headers');
}

function normalizeRecords(records: CsvRecord[]): string[][] {
  const unique = new Map<string, string[]>();

  records.forEach((record) => {
    const row = normalizeRecord(record);
    const key = [
      record.origin,
      record.destination,
      record.weight,
      record.service,
      record.shipment_type,
    ].join('|');
    unique.set(key, row);
  });

  return [...unique.values()].sort(compareRows);
}

function normalizeRecord(record: CsvRecord): string[] {
  return [
    record.origin.trim().toUpperCase(),
    record.origin_label.trim(),
    record.destination.trim().toUpperCase(),
    record.destination_label.trim().replace(/\s+/g, ' '),
    record.weight.trim(),
    record.service.trim().toUpperCase(),
    record.shipment_type.trim(),
    record.tariff_idr.trim(),
    record.etd.trim(),
  ];
}

function compareRows(left: string[], right: string[]): number {
  return (
    left[3].localeCompare(right[3]) ||
    left[2].localeCompare(right[2]) ||
    left[5].localeCompare(right[5]) ||
    left[6].localeCompare(right[6])
  );
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  values.push(current);
  return values;
}

function serializeCsv(rows: string[][]): string {
  const header = OUTPUT_HEADERS.join(',');
  const body = rows.map((row) => row.map(escapeValue).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

function escapeValue(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

void main();
