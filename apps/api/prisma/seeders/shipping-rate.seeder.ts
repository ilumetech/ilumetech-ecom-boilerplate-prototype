import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Prisma, PrismaClient } from '@prisma/client';

const BATCH_SIZE = 500;
const CSV_FILE_NAME = 'jne_jakarta_ongkir.csv';

interface ShippingRateRow {
  origin_code: string;
  origin_label: string;
  destination_code: string;
  destination_label: string;
  weight_kg: string;
  service: string;
  shipment_type: string;
  tariff_idr: string;
  etd: string;
}

export async function seedShippingRates(prisma: PrismaClient): Promise<void> {
  const csv = await readShippingRateCsv();
  const rows = parseCsv(csv);
  const data = rows.map(mapShippingRate);

  await prisma.shippingRate.deleteMany();

  for (let index = 0; index < data.length; index += BATCH_SIZE) {
    await prisma.shippingRate.createMany({
      data: data.slice(index, index + BATCH_SIZE),
      skipDuplicates: true,
    });
  }
}

async function readShippingRateCsv(): Promise<string> {
  const candidates = [
    resolve(process.cwd(), CSV_FILE_NAME),
    resolve(process.cwd(), '..', '..', CSV_FILE_NAME),
  ];

  for (const path of candidates) {
    try {
      return await readFile(path, 'utf8');
    } catch {
      continue;
    }
  }

  throw new Error(`${CSV_FILE_NAME} was not found`);
}

function parseCsv(csv: string): ShippingRateRow[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    ) as unknown as ShippingRateRow;
  });
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

function mapShippingRate(
  row: ShippingRateRow,
): Prisma.ShippingRateCreateManyInput {
  return {
    originCode: row.origin_code,
    originLabel: row.origin_label,
    destinationCode: row.destination_code,
    destinationLabel: row.destination_label,
    weightKg: Number(row.weight_kg),
    service: row.service,
    shipmentType: row.shipment_type,
    tariffIdr: Number(row.tariff_idr),
    etd: row.etd || null,
  };
}
