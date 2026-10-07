# barber-saas-finance-inventory-app

> finance-inventory bounded context: mobile UI (remote)

Part of the **Barber Saas** distributed system — team `barber-saas`, Grupo 2.
Governance and documentation live in [`barber-saas-docs`](https://github.com/code-corhuila/barber-saas-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `barber-saas-docs`.

---

## BarberSaaS — what this repository is

The owner's money and stock screens of BarberSaaS: an **Ionic Angular** domain app (ADR-013), copied
from the reference app `barber-saas-platform-admin-app`, loaded by the Angular shell
(`barber-saas-front`) at `/finance` for `ADMIN_BARBERSHOP` (every operation of
`finance-inventory-service.yaml` is the owner's).

| Screen | Calls (`finance-inventory-service.yaml` 1.1.0) |
|---|---|
| Tablero: the month's summary, today's income and expenses, products in low stock | `GET /api/v1/finance/summary` (month and today), `GET /api/v1/inventory/products?lowStock=true` |
| Finanzas: the month's summary and records, by type (HU-FIN-001) | `GET /api/v1/finance/summary`, `GET /api/v1/finance/records?from&to&type` |
| Registrar: an income or an expense | `POST /api/v1/finance/records` with `Idempotency-Key` |
| Inventario: products, low-stock alert (HU-INV-001) | `GET /api/v1/inventory/products?lowStock` |
| Producto: stock, entries and exits, history | `GET …/products/{id}`, `GET`/`POST …/products/{id}/movements` (`Idempotency-Key`) |
| Nuevo / Editar producto (the stock only moves, DEC-INV-01) | `POST /api/v1/inventory/products`, `PUT …/products/{id}` |

```
federation.config.js       exposes './routes' only; Angular and Ionic shared as singletons
src/app/finance.routes.ts  the routes the shell mounts under /finance (every screen lazy)
src/app/shell-context.ts   the contract with the shell (copied, never imported)
src/app/finance/           calls, rules, types and the screens
src/app/ui/                the four states of every view and the shared styles
```

Money travels as integer cents and people type whole pesos; zero and negative amounts are refused
before sending (FR-017). Quantities have at most two decimals in the product's unit. Requests go
through the shell's `HttpClient` to relative `/api/...` URLs: the shell adds the gateway, the token
and `X-Correlation-Id`; this app never provides an `HttpClient` and never stores a token (norm 5.4.1).

### How to start it

```bash
npm ci
npm start      # ng serve: builds the remote and serves it at http://localhost:4307
```

Then start the shell and the platform, sign in as `ADMIN_BARBERSHOP` and open `/finance`.
**Pending in the shell (Daniel):** the `/finance` entry in `app.routes.ts` and `finance-inventory`
in `public/federation.manifest.json`.

### How it is tested

`npm test` (Vitest): the calls against the contract and the form rules. CI also builds the remote.
