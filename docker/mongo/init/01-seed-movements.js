/**
 * Seeds the `movements` collection with a year of example bank movements.
 *
 * The MongoDB entrypoint runs this file with mongosh, once, the first time the container
 * starts on an empty data directory. To load it again, throw the volume away
 * (`docker compose down -v`) and bring the container back up.
 *
 * Two things this script is careful about, because they are the two things the
 * application is careful about:
 *
 *   - `amount` is written as `Decimal128`, never as a `Double`. Every figure is built
 *     from integer cents and turned into text before it reaches `NumberDecimal`, so no
 *     JavaScript float ever touches the money.
 *   - `dateTime` is written as a real `Date` built in UTC. The listing shows it in the
 *     time zone of the machine running Next.js, so the times below are what you see
 *     shifted by your own offset.
 *
 * The dates are laid out relative to the day the container is first started: twelve
 * months back from the current one, nothing in the future. The amounts, on the other
 * hand, come out of a seeded generator, so two people who run this get the same figures.
 */

const DATABASE_NAME = 'personal_finance';
const COLLECTION_NAME = 'movements';

/** Months of history to lay down, the current one included. */
const MONTHS = 12;

const ledger = db.getSiblingDB(DATABASE_NAME);
const movements = ledger.getCollection(COLLECTION_NAME);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

/**
 * The same indexes `MongoConfiguration.ensureIndexes` creates, with the same names, so
 * neither side finds a conflicting definition when the application connects. Keep both
 * lists in step: MongoDB rejects an index whose key and name do not match an existing one.
 */
function createIndexes() {
  // Default listing order; `_id` breaks ties so pagination stays stable.
  movements.createIndex({ dateTime: -1, _id: -1 }, { name: 'dateTime_-1__id_-1' });
  movements.createIndex({ description: 1 }, { name: 'description_1' });
  movements.createIndex({ receiptId: 1 }, { name: 'receiptId_1' });
  movements.createIndex({ bankEntityId: 1 }, { name: 'bankEntityId_1' });
}

// ---------------------------------------------------------------------------
// Exact money
// ---------------------------------------------------------------------------

/**
 * Lehmer generator. The point is not the quality of the randomness but that it repeats:
 * the same seed always produces the same ledger, which is what makes the sample data
 * usable as a fixture. Its arithmetic stays inside the range JavaScript integers hold
 * exactly, so it never drifts.
 */
let seed = 20260817;

function nextRandom() {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
}

/** Cents, as an integer: the only representation of money this script does maths with. */
function variedCents(baseCents, spreadCents) {
  if (spreadCents === 0) {
    return baseCents;
  }
  const sign = baseCents < 0 ? -1 : 1;
  return baseCents + sign * Math.round(nextRandom() * spreadCents);
}

/** Integer cents to the exact decimal text `Decimal128` expects: 189045 -> "1890.45". */
function toDecimalText(totalCents) {
  const sign = totalCents < 0 ? '-' : '';
  const absolute = Math.abs(totalCents);
  const units = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${units}.${fraction}`;
}

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

/**
 * What a household ledger actually looks like, kept in Argentine pesos with the handful
 * of dollar movements a real one carries alongside them.
 *
 * A payroll, the direct debits, and the everyday card spending. `days` are the days of
 * the month the movement falls on, `cents` is the base amount (negative is money out) and
 * `spread` how much it moves from one month to the next. `receipt: false` marks the
 * movements that carry no receipt number, so the `null` branch of the model is exercised
 * too.
 *
 * The entities are real ones, with the number the BCRA gives each of them in its register
 * of financial institutions (https://www.bcra.gob.ar/entidades-financieras).
 *
 * The hours sit between 12:00 and 21:00 UTC on purpose. The listing renders them in the
 * time zone of whoever runs the application, and that band still reads as a plausible
 * hour of the day across the Americas and Europe, with no movement sliding into the day
 * before or after.
 */
const RECURRING = [
  { days: [1], hour: 12, minute: 5, description: 'ALQUILER DEPARTAMENTO', cents: -85000000, spread: 0, currency: 'ARS', bankEntityId: 'GALICIA-00007', receipt: true },
  { days: [2], hour: 12, minute: 40, description: 'EXPENSAS CONSORCIO', cents: -14500000, spread: 1500000, currency: 'ARS', bankEntityId: 'GALICIA-00007', receipt: true },
  { days: [3], hour: 13, minute: 12, description: 'ABONO INTERNET Y CELULAR', cents: -4200000, spread: 0, currency: 'ARS', bankEntityId: 'BBVA-00017', receipt: true },
  { days: [5], hour: 13, minute: 30, description: 'SUSCRIPCION STREAMING', cents: -1250000, spread: 0, currency: 'ARS', bankEntityId: 'BBVA-00017', receipt: false },
  { days: [6, 20], hour: 13, minute: 25, description: 'EXTRACCION CAJERO AUTOMATICO', cents: -10000000, spread: 0, currency: 'ARS', bankEntityId: 'NACION-00011', receipt: false },
  { days: [7], hour: 14, minute: 0, description: 'TRANSFERENCIA ENVIADA AHORRO MENSUAL', cents: -30000000, spread: 0, currency: 'ARS', bankEntityId: 'BRUBANK-00143', receipt: true },
  { days: [8], hour: 12, minute: 55, description: 'FACTURA EDESUR', cents: -4800000, spread: 2500000, currency: 'ARS', bankEntityId: 'GALICIA-00007', receipt: true },
  { days: [9, 23], hour: 18, minute: 47, description: 'ESTACION DE SERVICIO YPF', cents: -6500000, spread: 2000000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { days: [10], hour: 14, minute: 15, description: 'CUOTA PRESTAMO PERSONAL', cents: -19500000, spread: 0, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { days: [4, 11, 18, 25], hour: 19, minute: 12, description: 'SUPERMERCADO COTO', cents: -8500000, spread: 4000000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { days: [12], hour: 12, minute: 50, description: 'FACTURA METROGAS', cents: -3200000, spread: 1800000, currency: 'ARS', bankEntityId: 'GALICIA-00007', receipt: true },
  { days: [14, 28], hour: 20, minute: 38, description: 'RESTAURANTE CENA', cents: -5500000, spread: 3000000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { days: [15], hour: 13, minute: 20, description: 'SEGURO DEL HOGAR', cents: -2800000, spread: 0, currency: 'ARS', bankEntityId: 'GALICIA-00007', receipt: true },
  { days: [16], hour: 12, minute: 30, description: 'MONOTRIBUTO AFIP', cents: -3800000, spread: 0, currency: 'ARS', bankEntityId: 'NACION-00011', receipt: true },
  { days: [17], hour: 17, minute: 5, description: 'FARMACIA', cents: -1800000, spread: 900000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { days: [18], hour: 15, minute: 30, description: 'TRANSFERENCIA RECIBIDA ALQUILER COCHERA', cents: 12000000, spread: 0, currency: 'ARS', bankEntityId: 'BBVA-00017', receipt: true },
  // The dollar side of the ledger: what is bought abroad stays in the currency it was paid in.
  { days: [21], hour: 21, minute: 9, description: 'COMPRA ONLINE MARKETPLACE', cents: -3800, spread: 2000, currency: 'USD', bankEntityId: 'BRUBANK-00143', receipt: true },
  { days: [25], hour: 12, minute: 0, description: 'ACREDITACION DE HABERES SUELDO MENSUAL', cents: 245000000, spread: 0, currency: 'ARS', bankEntityId: 'BBVA-00017', receipt: true },
  { days: [27], hour: 20, minute: 59, description: 'INTERESES CUENTA REMUNERADA', cents: 350000, spread: 400000, currency: 'ARS', bankEntityId: 'BRUBANK-00143', receipt: false },
];

/**
 * The movements that happen once and are worth searching for: they are what makes the
 * description filter and the date range interesting to try out. `monthsAgo` counts back
 * from the current month, `0` being this one.
 */
const ONE_OFF = [
  { monthsAgo: 11, day: 19, hour: 12, minute: 4, description: 'REPARACION VEHICULO TALLER', cents: -68000000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { monthsAgo: 9, day: 8, hour: 16, minute: 45, description: 'PASAJES AEREOS', cents: -41290, currency: 'USD', bankEntityId: 'BRUBANK-00143', receipt: true },
  { monthsAgo: 7, day: 22, hour: 15, minute: 18, description: 'MATRICULA CURSO ONLINE', cents: -29900, currency: 'USD', bankEntityId: 'BBVA-00017', receipt: true },
  { monthsAgo: 6, day: 2, hour: 14, minute: 33, description: 'REINTEGRO AFIP', cents: 81244000, currency: 'ARS', bankEntityId: 'BBVA-00017', receipt: true },
  { monthsAgo: 5, day: 16, hour: 20, minute: 27, description: 'TRANSFERENCIA RECIBIDA REGALO CUMPLEANOS', cents: 15000000, currency: 'ARS', bankEntityId: 'GALICIA-00007', receipt: false },
  { monthsAgo: 4, day: 13, hour: 17, minute: 2, description: 'MUEBLES Y REFORMA COCINA', cents: -125480000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
  { monthsAgo: 3, day: 26, hour: 14, minute: 51, description: 'MEDIO AGUINALDO', cents: 118000000, currency: 'ARS', bankEntityId: 'BBVA-00017', receipt: true },
  { monthsAgo: 2, day: 5, hour: 19, minute: 44, description: 'HOTEL FIN DE SEMANA', cents: -24560000, currency: 'ARS', bankEntityId: 'BRUBANK-00143', receipt: true },
  { monthsAgo: 1, day: 11, hour: 13, minute: 15, description: 'CONSULTA ODONTOLOGICA', cents: -9500000, currency: 'ARS', bankEntityId: 'SANTANDER-00072', receipt: true },
];

// ---------------------------------------------------------------------------
// Building the documents
// ---------------------------------------------------------------------------

const now = new Date();
let receiptSequence = 2400000;

/** Sequential receipt number, in the same shape the form suggests: `0012345678`. */
function nextReceiptId() {
  receiptSequence += 137;
  return String(receiptSequence).padStart(10, '0');
}

/**
 * A document exactly as `MovementDboMapper.toDbo` writes it: no `_id`, MongoDB generates
 * it, and the same six fields in the same types.
 */
function buildMovement(when, template, totalCents) {
  return {
    dateTime: when,
    description: template.description,
    currency: template.currency,
    amount: NumberDecimal(toDecimalText(totalCents)),
    receiptId: template.receipt ? nextReceiptId() : null,
    bankEntityId: template.bankEntityId,
  };
}

function buildDocuments() {
  const documents = [];

  // Oldest month first, so the receipt numbers grow along with the dates.
  for (let monthsAgo = MONTHS - 1; monthsAgo >= 0; monthsAgo--) {
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    for (const template of RECURRING) {
      for (const day of template.days) {
        const when = new Date(Date.UTC(year, month, day, template.hour, template.minute));
        // The current month is only half over: nothing is dated in the future.
        if (when > now) {
          continue;
        }
        documents.push(buildMovement(when, template, variedCents(template.cents, template.spread)));
      }
    }

    for (const template of ONE_OFF) {
      if (template.monthsAgo !== monthsAgo) {
        continue;
      }
      const when = new Date(Date.UTC(year, month, template.day, template.hour, template.minute));
      if (when > now) {
        continue;
      }
      documents.push(buildMovement(when, template, template.cents));
    }
  }

  return documents;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

createIndexes();

if (movements.countDocuments({}) > 0) {
  print(`[seed] ${DATABASE_NAME}.${COLLECTION_NAME} already holds data: nothing was inserted.`);
} else {
  const documents = buildDocuments();
  const result = movements.insertMany(documents);
  print(`[seed] ${Object.keys(result.insertedIds).length} movements inserted into ${DATABASE_NAME}.${COLLECTION_NAME}.`);

  const summary = movements
    .aggregate([
      { $group: { _id: '$currency', movements: { $sum: 1 }, balance: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  for (const line of summary) {
    print(`[seed]   ${line._id}: ${line.movements} movements, balance ${line.balance.toString()}`);
  }

  const oldest = movements.find({}).sort({ dateTime: 1 }).limit(1).toArray()[0];
  const newest = movements.find({}).sort({ dateTime: -1 }).limit(1).toArray()[0];
  print(`[seed]   range ${oldest.dateTime.toISOString()} .. ${newest.dateTime.toISOString()} (UTC)`);
}
