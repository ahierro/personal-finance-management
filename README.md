# Ledger — bank movements

A web application to keep a personal record of bank movements. A single Next.js project
holds both the frontend and the backend: the screen is built on the server (SSR) and the
writes travel through server actions, on top of a REST API that exposes the same use cases.

It is built to hold more than ten years of movements: **filtering, ordering and page
slicing are all resolved inside MongoDB**, never in the browser.

The interface ships in **Spanish and English**, picked from a combo in the header.
Spanish is what it opens with.

---

## Contents

1. [What it does](#what-it-does)
2. [Stack](#stack)
3. [Hexagonal architecture](#hexagonal-architecture)
4. [Folder structure](#folder-structure)
5. [Data model](#data-model)
6. [Requirements](#requirements)
7. [Sample database with Docker](#sample-database-with-docker)
8. [Configuration](#configuration)
9. [Running the project](#running-the-project)
10. [Available scripts](#available-scripts)
11. [Translations](#translations)
12. [How pagination and filtering work](#how-pagination-and-filtering-work)
13. [REST API](#rest-api)
14. [Indexes and performance](#indexes-and-performance)
15. [Bulk loading historical data](#bulk-loading-historical-data)
16. [Design decisions](#design-decisions)
17. [Troubleshooting](#troubleshooting)

---

## What it does

- **Listing** of movements ordered by date and time, newest first.
- **Create** a movement from a dialog.
- **Edit** every field except the MongoDB `_id`, which is shown but never touched.
- **Delete** with a confirmation that shows exactly what is about to go.
- **Search by description** with an unanchored, case-insensitive regular expression:
  typing `cajero` finds `RETIRO CAJERO AUTOMATICO RED LINK`.
- **Date range filter** (from and to, both optional, date only) with a hand-built
  calendar. The "to" date covers the whole day: a movement at 23:50 still counts.
- **Filter by bank entity and by currency**, from two combos whose values are the distinct
  ones stored in the collection, sorted alphabetically. Nothing is a fixed catalogue: a
  value is offered because some movement carries it, so no choice can return an empty
  page. The movement form offers those same two lists, and there they are only
  suggestions — type an entity or a currency the ledger has never seen and it is saved,
  and from then on both places offer it too.
- **Server-side pagination** with a picker for 5, 25, 50, 100 or 200 records per page.
  The default is 50.
- **Columns to taste**: the funnel button drops a checkbox per column to take any of them
  off the table, and every header can be dragged by its right edge to a different width.
- **Language picker**, Spanish by default, English available.
- **Dark mode** as the only theme.

The state of the screen lives in the URL (`/?q=cajero&entity=BBVA-00017&currency=ARS&page=3`), so
reloading, sharing the link or hitting the back button all behave as expected. The column
choice is the exception: it says nothing about *what* is being looked at, only about how
this particular browser likes to see it, so it stays in `localStorage` and out of the URL.

---

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Frontend and backend in one process, with SSR |
| Language | TypeScript in strict mode | Checkable contracts between layers |
| Database | MongoDB 6+ | `Decimal128` for exact money |
| Driver | Official `mongodb` | Direct control over `skip`/`limit` and regular expressions |
| Styles | CSS Modules + CSS variables | No UI library, no styling framework |
| Fonts | Archivo and IBM Plex Mono (`next/font`) | Downloaded at build time and served from the project |
| i18n | Java-style `.properties` bundles | Read on the server, no runtime dependency |

No ORM, no component library, no state manager. There are four production dependencies:
`next`, `react`, `react-dom` and `mongodb`.

---

## Hexagonal architecture

Three layers, with dependencies always pointing inwards. The domain knows nobody; the
application knows the domain; the infrastructure knows both.

```
                    ┌──────────────────────────────────────────┐
   Browser ────────▶│  Input adapters                          │
   HTTP    ────────▶│  · SSR page + React components           │
                    │  · Server actions                        │
                    │  · REST controllers                      │
                    └───────────────────┬──────────────────────┘
                                        │ uses
                    ┌───────────────────▼──────────────────────┐
                    │  Use cases (interfaces)                  │
                    │  MovementCommandUseCase                  │
                    │  MovementQueryUseCase                    │
                    │            ▲ implemented by              │
                    │  Input ports                             │
                    └───────────────────┬──────────────────────┘
                                        │ depends on
                    ┌───────────────────▼──────────────────────┐
                    │  Domain                                  │
                    │  Movement · MovementPage · Filter        │
                    │  Commands · Exceptions                   │
                    └───────────────────▲──────────────────────┘
                                        │ implements
                    ┌───────────────────┴──────────────────────┐
                    │  Output ports (interfaces)               │
                    │            ▲ implemented by              │
                    │  Output adapters   ─────────────▶ MongoDB│
                    └──────────────────────────────────────────┘
```

### CQRS split

Writes and reads travel separate paths end to end, following the convention of the
reference project:

| Write (Command) | Read (Query) |
| --- | --- |
| `MovementCommandUseCase` | `MovementQueryUseCase` |
| `MovementCommandInputPort` | `MovementQueryInputPort` |
| `MovementCommandOutputPort` | `MovementQueryOutputPort` |
| `MovementCommandOutputAdapter` | `MovementQueryOutputAdapter` |
| `MovementCommandController` | `MovementQueryController` |

`MovementCommandInputPort` does depend on the read port, because editing and deleting
have to fetch the movement's current state first.

### The domain speaks in message keys, not sentences

A domain exception carries a key such as `error.amount.invalid`, never a sentence.
`MovementControllerAdvice` composes the text at the edge, in the reader's language. That
is what lets the very same validation rule answer a Spanish form and an English REST
client without the business logic knowing either language exists.

### Where to change what

| I want to… | Touch… |
| --- | --- |
| Add a field to the movement | `domain/entity/Movement.ts`, both commands, `MovementDboMapper`, `MovementViewMapper` and the form |
| Change a validation rule | `domain/command/MovementCommandValidator.ts` |
| Move off MongoDB | Only `infrastructure/adapters/output/**` and `ApplicationConfiguration.ts` |
| Reword anything on screen | `messages/es.properties` and `messages/en.properties` |
| Change how an amount is displayed | `infrastructure/adapters/input/web/view/MovementViewMapper.ts` |
| Change colours or fonts | `src/app/globals.css` |

---

## Folder structure

```
messages                                 Translation bundles, one file per language
├── es.properties
└── en.properties

src
├── app                                  Next.js routes. A thin layer: it only plugs things in.
│   ├── layout.tsx                       Fonts, metadata, global styles, html lang
│   ├── globals.css                      Colour, typography and reset tokens
│   ├── page.tsx                         The listing screen, rendered on the server
│   └── api/movements
│       ├── route.ts                     GET listing · POST create
│       └── [id]/route.ts                GET · PATCH · PUT · DELETE by id
│
├── domain                               Business concepts and rules. No dependencies.
│   ├── command                          Input data of the write operations
│   │   ├── MovementCreateCommand.ts
│   │   ├── MovementEditCommand.ts
│   │   └── MovementCommandValidator.ts     Constraints shared by both commands
│   ├── entity                           Core models
│   │   ├── Movement.ts                     Entity + requestToCreate/applyEdit factories
│   │   ├── MovementPage.ts                 A page of results with its totals
│   │   ├── MovementFilter.ts               Search criteria; turns a date into a day range
│   │   ├── PageRequest.ts                  Page and size, with their limits
│   │   └── ErrorModel.ts                   Uniform error body
│   └── exception                        Domain-specific failures, carrying message keys
│       ├── MovementException.ts
│       ├── MovementNotFoundException.ts
│       └── MovementValidationException.ts
│
├── application                          Coordinates the use cases the system exposes.
│   ├── ports
│   │   ├── input                        Implementations called by the input adapters
│   │   │   ├── MovementCommandInputPort.ts
│   │   │   └── MovementQueryInputPort.ts
│   │   └── output                       Persistence contracts
│   │       ├── MovementCommandOutputPort.ts
│   │       └── MovementQueryOutputPort.ts
│   └── usecases                         Operations the application exposes
│       ├── MovementCommandUseCase.ts
│       └── MovementQueryUseCase.ts
│
└── infrastructure                       Connects the application to external technologies.
    ├── adapters
    │   ├── input
    │   │   ├── advice
    │   │   │   └── MovementControllerAdvice.ts   Exception → HTTP status and ErrorModel
    │   │   ├── rest/controller                   API controllers
    │   │   │   ├── MovementCommandController.ts
    │   │   │   └── MovementQueryController.ts
    │   │   └── web                               The interface adapter
    │   │       ├── action                        Server actions (create, edit, delete, locale)
    │   │       ├── view                          View models and their mapping from the domain
    │   │       └── component                     React components and their CSS Modules
    │   └── output
    │       ├── MovementCommandOutputAdapter.ts   Implements the write port
    │       ├── MovementQueryOutputAdapter.ts     Implements the read port
    │       ├── data/MovementEntity.ts            The document as it lives in MongoDB
    │       ├── mapper/MovementDboMapper.ts       Domain ⇄ document, and filter → query
    │       └── repository/MovementMongoRepository.ts   Collection access
    ├── config
    │   ├── MongoConfiguration.ts        Connection, database and index creation
    │   └── ApplicationConfiguration.ts  Composition root: builds and injects everything
    └── i18n
        ├── Locale.ts                    Supported languages and the cookie name
        ├── PropertiesParser.ts          Reader for the `.properties` format
        ├── MessageSource.ts             Loads and caches the bundles
        ├── Translator.ts                Key resolution and date/number formatting
        └── LocaleResolver.ts            Decides the language of each request
```

### Why the React components sit under `infrastructure`

In hexagonal architecture the user interface is just another input adapter, exactly like
the REST API: a concrete way for the outside world to invoke the use cases. That is why
`web/` lives next to `rest/`, and `app/` stays a thin socket holding only what Next.js
needs in order to route.

---

## Data model

Collection: **`movements`**

| Field | MongoDB type | Required | Rules |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | generated | Never edited. Shown in the dialog subtitle |
| `dateTime` | `Date` | yes | Stored as a UTC instant; displayed in the server's time zone |
| `description` | `String` | yes | 1 to 500 characters |
| `currency` | `String` | yes | 1 to 10 characters, no spaces; uppercased |
| `amount` | `Decimal128` | yes | Up to 20 integer and 6 fraction digits. Negative means money out |
| `receiptId` | `String \| null` | no | Up to 100 characters. Empty is stored as `null` |
| `bankEntityId` | `String` | yes | Up to 100 characters |

### About the amount

`Decimal128` is the only MongoDB type that represents decimals with no rounding error.
To keep that exactness, **the amount travels as text through the whole domain**
(`"-1234.56"`) and is only turned into `Decimal128` in the mapper, at the edge of the
database. It never passes through a JavaScript `number` anywhere along the way.

The form accepts a dot or a comma as the decimal mark (`1234,56` is stored as `1234.56`),
but **not** a thousands separator: `1.234,56` is ambiguous and is rejected with an explicit
message rather than guessed.

### About dates

`dateTime` stores a full date and time. The "from" and "to" filters, on the other hand,
work with dates alone: `MovementFilter` turns `2026-03-15` into the range
`[2026-03-15 00:00:00.000, 2026-03-15 23:59:59.999]` using the server's time zone. As the
application runs locally, server and browser share that zone.

Every date is formatted on the server and sent to the browser already turned into text,
so the server's HTML and the client's always agree.

---

## Requirements

- **Node.js 18.18 or newer** (tested on Node 24).
- **MongoDB 6 or newer** reachable from this machine: a local install, a container or an
  Atlas cluster. Or **Docker**, and the project brings its own.

The database that comes with the project is already loaded with example movements. From
the root:

```bash
docker compose up -d
```

That is the whole database setup. The next section explains what it puts in there.

---

## Sample database with Docker

`docker/mongo/` holds a MongoDB image that is the official server plus a seed script.
MongoDB's entrypoint runs anything under `/docker-entrypoint-initdb.d` the first time it
starts on an empty data directory, so the container comes up with the `movements`
collection, its indexes and a year of movements already in it — the listing has something
to show on the very first render, with enough rows to page through and filter.

| File | What it is |
| --- | --- |
| `docker/mongo/Dockerfile` | `mongo:7` with the seed script baked in and `MONGO_INITDB_DATABASE=personal_finance` |
| `docker/mongo/init/01-seed-movements.js` | Creates the indexes and inserts the example movements |
| `docker-compose.yml` | Builds the image, publishes 27017 and keeps the data in the `ledger-data` volume |

```bash
docker compose up -d
```

```bash
docker compose logs -f mongo
```

The log ends with what the seed inserted: the count, the balance per currency and the
date range it covers.

### What the seed contains

Close to **300 movements over the last twelve months**, laid out relative to the day the
container is first started, so the ledger always opens on recent data. The exact count
moves with the day of the month, because the current month is only as far along as today:

- The shape of a real Argentine household ledger: the payroll, rent and expenses, the
  utility bills, a loan repayment, the monthly monotributo, the weekly supermarket run,
  fuel, restaurants and cash withdrawals.
- A handful of one-off movements — the half aguinaldo, a tax refund, a kitchen reform,
  flight tickets — which are the interesting things to try the description filter on.
- **Two currencies**: pesos for everything at home, dollars for what is bought abroad,
  which is what makes the currency filter worth having.
- **Five real bank entities**, each carrying the number the BCRA gives it in its
  [register of financial institutions](https://www.bcra.gob.ar/entidades-financieras).
- Movements **with and without a receipt**, so the `receiptId: null` case shows up in the
  listing rather than only in the model.
- Every amount as `Decimal128`, built from integer cents: no JavaScript float ever touches
  the money, which is the same rule the application follows.
- Six pages at the default page size of 50.

The dates move with the calendar, but the amounts come out of a seeded generator: two
people who run this get the same figures.

### Reloading it

The seed only runs while the data directory is empty. Once the volume exists, the
container is your database and starting it again changes nothing. To go back to the
example data, drop the volume:

```bash
docker compose down -v
```

```bash
docker compose up -d
```

> `docker compose down` on its own stops the container and **keeps** your data. It is
> the `-v` that throws it away.

The indexes in the seed are the same four `MongoConfiguration` creates, with the same
names, so the application finds nothing conflicting when it connects. If you ever change
one, change it in both places: MongoDB rejects an index whose key and name disagree with
an existing one.

Port 27017 already taken by another MongoDB? Start it elsewhere and match the URI:

```bash
MONGO_PORT=27018 docker compose up -d
```

Using your own MongoDB instead — a local install or Atlas — needs none of this. Point
`MONGODB_URI` at it and the application creates the collection and the indexes on its own;
it just starts empty.

---

## Configuration

The application uses **a single environment variable**.

1. Copy the example file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and set your connection string:

```
MONGODB_URI=mongodb://127.0.0.1:27017/personal_finance
```

| Scenario | Value |
| --- | --- |
| Local MongoDB, no authentication | `mongodb://127.0.0.1:27017/personal_finance` |
| Local MongoDB with user and password | `mongodb://user:password@127.0.0.1:27017/personal_finance?authSource=admin` |
| MongoDB Atlas | `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/personal_finance?retryWrites=true&w=majority` |

The database name comes from the URI itself. When the URI carries none, `personal_finance`
is used. The database and the collection are created on the first write, and the indexes
on the first query.

> `.env.local` is listed in `.gitignore`. It is never committed.

---

## Running the project

```bash
npm install
```

```bash
npm run db:up
```

```bash
npm run dev
```

The application is then at **http://localhost:3000**, showing the example movements. Skip
`db:up` if you are pointing `MONGODB_URI` at your own MongoDB.

To run it the way production would:

```bash
npm run build
```

```bash
npm start
```

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build, type checking included |
| `npm start` | Serves the production build |
| `npm run typecheck` | Runs TypeScript without emitting files |
| `npm run db:up` | Starts the MongoDB container, seeding it on its first run |
| `npm run db:down` | Stops the container, keeping the data |
| `npm run db:reset` | Drops the data and starts again from the example movements |

---

## Translations

Every string on screen lives in `messages/`, one Java-style `.properties` file per
language, in UTF-8. Nothing user-facing is hard-coded in a component.

```properties
action.new-movement=Nuevo movimiento
pagination.range={0}–{1} de {2}
error.field.required={0} es un campo obligatorio
```

Placeholders are indexed: `{0}`, `{1}`, and so on.

**How a request picks its language.** `LocaleResolver` reads the `locale` cookie, which
the combo in the header sets. The browser's `Accept-Language` is deliberately ignored, so
a first visit always opens in Spanish whatever the browser is configured for. The choice
lasts a year.

**How it reaches the screen.** The server parses the bundle and hands the resolved map to
`TranslationProvider` inside the render payload. Server components receive a `Translator`
directly; client components read it through `useTranslation()`. Switching language is a
server re-render, not a second copy of the interface shipped to the browser.

**A missing key** falls back to the default language, and a key missing there too is
printed as-is: visible while developing, harmless in use.

**Formats are part of the bundle**, so a language brings its own conventions along:

```properties
format.date.pattern=dd/MM/yyyy      # en: MM/dd/yyyy
format.number.group=.               # en: ,
format.number.decimal=,             # en: .
```

The same movement therefore reads `13/08/2026 · −196.618,68` in Spanish and
`08/13/2026 · −196,618.68` in English.

**Error messages know which field failed.** The domain throws a key plus the field name;
the advice looks the field's label up in `field.label.*` and passes it as `{0}`. That is
why `error.field.required` alone covers every field in both languages.

### Adding a language

1. Copy `messages/es.properties` to `messages/<code>.properties` and translate it.
2. Add the code to `SUPPORTED_LOCALES` in `src/infrastructure/i18n/Locale.ts`.
3. Add a `language.<code>` key to every bundle, holding the language's own name.

The combo picks it up on its own. Bundles are cached in production and re-read on every
request in development, so editing a translation shows up on the next reload.

---

## How pagination and filtering work

Everything is resolved in MongoDB. The browser never receives more records than the page
it is looking at.

**The path of a request**

1. The user changes a filter or a page, and the component rewrites the URL.
2. `page.tsx` renders again on the server with the new `searchParams`.
3. `MovementPageViewAdapter` translates the URL into a `MovementFilter` and a `PageRequest`.
4. `MovementQueryUseCase` delegates to the output port.
5. `MovementQueryOutputAdapter` fires two queries in parallel: the page and the total.
6. The table's HTML comes back already built.

**The query that runs**

```js
db.movements
  .find({
    description: { $regex: "cajero", $options: "i" },
    dateTime: { $gte: ISODate("2026-01-01T00:00:00"), $lte: ISODate("2026-03-31T23:59:59.999") }
  })
  .sort({ dateTime: -1, _id: -1 })
  .skip(page * size)
  .limit(size)
```

Details that matter:

- **The search text is escaped** before the regular expression is built, so a `.` or a `(`
  is looked for as a literal character rather than as a metacharacter.
- **`_id` breaks ties in the ordering.** Without that second criterion, two movements
  sharing an exact date and time could come back in a different order from one page to the
  next, and one of them would show up twice or disappear.
- **The total is counted with `countDocuments`** over the same filter, in parallel with the
  page query.
- **When the requested page has run out of records** — after deleting the last movement of
  the last page, say — the adapter asks for the last page that does have content instead
  of showing an empty screen.

**URL parameters**

| Parameter | Meaning | Default |
| --- | --- | --- |
| `q` | Text to search inside the description | empty |
| `from` | Start date, `YYYY-MM-DD` | empty |
| `to` | End date, `YYYY-MM-DD` | empty |
| `page` | Page, starting at 1 | 1 |
| `size` | Records per page (5, 25, 50, 100, 200) | 50 |

The interface counts pages from 1, because that is what the user reads; the domain and the
API count from 0, as the reference project does. The conversion happens in exactly one
place: `MovementSearchParams.ts`.

---

## REST API

Base: `/api/movements`. The same use cases the interface runs, exposed over HTTP.
Error messages follow the `locale` cookie and default to Spanish.

### List movements

```
GET /api/movements?description=cajero&from=2026-01-01&to=2026-03-31&page=0&size=50
```

| Parameter | Type | Default |
| --- | --- | --- |
| `description` | text, partial match, case-insensitive | — |
| `from` | `YYYY-MM-DD`, inclusive from 00:00 | — |
| `to` | `YYYY-MM-DD`, inclusive to 23:59:59.999 | — |
| `bankEntityId` | exact match, whole value | — |
| `currency` | exact match, whole value | — |
| `page` | integer from 0 | 0 |
| `size` | integer from 1 to 200 | 50 |

All of them combine, and every one of them is resolved in MongoDB. A `bankEntityId` that
no longer exists is not an error: it simply matches nothing, because a saved link can
outlive the movements it was pointing at.

```json
{
  "content": [
    {
      "id": "6a8214ddd23203f628fde023",
      "dateTime": "2026-08-15T13:30:00.000Z",
      "description": "RETIRO CAJERO AUTOMATICO RED LINK",
      "currency": "ARS",
      "amount": "-135442.88",
      "receiptId": "46505375",
      "bankEntityId": "BBVA-00017"
    }
  ],
  "totalPages": 9,
  "totalElements": 420,
  "number": 0,
  "size": 50
}
```

### Get one movement

```
GET /api/movements/{id}
```

### Create a movement

```
POST /api/movements
Content-Type: application/json
```

```json
{
  "dateTime": "2026-08-15T10:30",
  "description": "PAGO ALQUILER DEPARTAMENTO",
  "currency": "ARS",
  "amount": "-780000.00",
  "receiptId": "0012345678",
  "bankEntityId": "GALICIA-0007"
}
```

Answers `201` with the created movement, `id` included.

### Edit a movement

```
PATCH /api/movements/{id}
```

Fields that are not sent stay as they are. `PUT` behaves identically to `PATCH`.

```json
{ "description": "PAGO ALQUILER AGOSTO", "amount": "-800000.00" }
```

### Delete a movement

```
DELETE /api/movements/{id}
```

Answers `204` with no body.

### Errors

Every error uses the same body:

```json
{
  "httpCode": 400,
  "httpMessage": "Datos inválidos",
  "moreInformation": "Monto debe ser un número decimal sin separador de miles, por ejemplo -1234.56",
  "field": "amount"
}
```

| Status | When |
| --- | --- |
| `400` | Validation failed. `field` names the field that caused it |
| `404` | The `id` does not exist or is not shaped like an `ObjectId` |
| `500` | Unexpected failure. The full detail is left in the server console |

---

## Indexes and performance

`MongoConfiguration` creates these indexes the first time the application connects. The
operation is idempotent: if they already exist, nothing happens.

| Index | What for |
| --- | --- |
| `{ dateTime: -1, _id: -1 }` | Default listing order and the date range filter |
| `{ description: 1 }` | Description searches |
| `{ receiptId: 1 }` | Direct lookup by receipt |
| `{ bankEntityId: 1 }` | Filtering by entity |

**An honest warning about text search.** An unanchored regular expression (`/cajero/i`)
cannot take advantage of the `description` index: MongoDB has to walk the values one by
one. With tens of thousands of movements the difference does not show. If it ever starts
to hurt, there are two ways out:

- Add a text index (`db.movements.createIndex({ description: "text" })`) and switch the
  filter to `$text`. Much faster, but it matches whole words and stops finding hits in the
  middle of one.
- Store a lowercase copy of the description, index it, and search with an expression
  anchored at the start (`/^cajero/`), which does use the index.

Either way the only change needed is inside `MovementDboMapper.toDboFilter`.

About `skip`: MongoDB has to walk the documents it skips, so asking for page 900 is slower
than asking for page 2. With ten years of personal movements — a few thousand records —
that is irrelevant. Were the volume to grow a lot, the alternative is cursor pagination
over `dateTime` instead of page numbers.

---

## Bulk loading historical data

To import years of movements, write straight into the `movements` collection. The one
thing that matters is the type of `amount`: it has to be `Decimal128`, not a number.

```js
// mongosh
db.movements.insertMany([
  {
    dateTime: new Date("2015-03-12T09:41:00"),
    description: "ACREDITACION DE HABERES SUELDO MENSUAL",
    currency: "ARS",
    amount: NumberDecimal("48250.00"),
    receiptId: "10024455",
    bankEntityId: "BBVA-00017"
  }
]);
```

With the Node driver:

```js
import { Decimal128 } from 'mongodb';

amount: Decimal128.fromString('-1234.56');
```

The mapper reads defensively: if an older load left the amount as a `Double` or as text,
the listing still shows it. But storing it as `Decimal128` from the start is what
guarantees no cents go missing.

`docker/mongo/init/01-seed-movements.js` is this same exercise carried out in full: a
few hundred documents built from integer cents and turned into text right before
`NumberDecimal`, so no float ever sees the money. It is a reasonable thing to copy for
your own import.

---

## Design decisions

**Dark mode, cold ink, one accent.** The base is a blue-grey (`#0c1016`) rather than pure
black, which tires the eyes less over a long session. There is a single interaction
colour, a warm brass (`#e0a44b`), reserved for whatever answers a click: the primary
button, the active page, the chosen day in the calendar, the keyboard focus ring. Beyond
that, only two colours carry meaning: green for money coming in, rose for money going out.

**Typefaces with separate jobs.** Archivo for the interface. IBM Plex Mono for anything
that is data — amounts, dates, receipts, page numbers — with tabular figures, which is
what keeps the column of amounts aligned however the digits change.

**The amount carries its meaning in the colour, not in a chart.** An earlier version ran
a bar behind each amount, proportional to the largest one of its currency on the page. It
was removed: a shading whose scale is invisible asks to be decoded, and in a column of
exact figures that reads as noise rather than as information. What is left is the sign in
red or green, on the same plain background as every other cell.

**Density over air.** 40 px rows, a pinned header, controls above and below, and only the
table scrolling. This is a tool for looking at two hundred rows in a row, not a landing page.

**Accessibility.** Visible focus on every control, dialogs with trapped focus and `Escape`
to close, a calendar navigable with the arrows, `Home`, `End`, `PageUp` and `PageDown`,
and `prefers-reduced-motion` respected.

---

## Troubleshooting

**"No se pudo leer la base" / "Could not read the database"**
The application could not reach MongoDB. Check that the server is up (`docker ps` or the
system service) and that `MONGODB_URI` points at the right port. The exact detail shows
on the screen itself and in the server console.

**"Command find requires authentication"**
Your MongoDB instance has authentication enabled and the URI carries no credentials. Add
them in the form `mongodb://user:password@host:port/database?authSource=admin`.

**"MONGODB_URI is not set"**
There is no `.env.local`, or it is empty. Copy `.env.example` and fill it in. After
creating it, restart `npm run dev`.

**The listing is empty on a fresh install**
Against your own MongoDB that is expected: the collection has no documents yet. Add the
first one with the "New movement" button, or import your historical data. Against the
container, it means the seed did not run — MongoDB only runs it while the data directory
is empty, so a volume created before the script existed keeps its own emptiness. Start
over with `npm run db:reset` (`docker compose down -v && docker compose up -d`).

**Amounts show more decimals than expected**
The amount is displayed exactly as stored, with a minimum of two decimals. Seeing
`1234,5678` means the document holds that value in the database.

**A translation edit does not show up**
Bundles are cached in production only. In development they are re-read on every request,
so a reload is enough; after `npm run build`, restart the server.

**The build fails while downloading the fonts**
`next/font` fetches Archivo and IBM Plex Mono during compilation and needs internet that
one time. Afterwards they are served from the project and no connection is required.
