# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-08

User stories: code-corhuila/barber-saas-docs#10, code-corhuila/barber-saas-docs#11, code-corhuila/barber-saas-docs#59

### Added

- shell: copy the shell contract, the four view states and the shared styles
- deploy: serve the built remote for the shell
- finance: type the records, the summary, the products and the movements of the contract
- finance: call finance-inventory-api through the shell's http client
- finance: validate the record and product forms and format pesos and quantities
- ui: switch between the dashboard, finance and inventory
- ui: show the month's summary and its income and expenses
- ui: record an income or an expense
- ui: list the products and point out the ones in low stock
- ui: create a product with its stock and edit it without the stock
- ui: show a product's stock and history and register entries and exits
- ui: show the owner's dashboard with the month and what matters today

### Documentation

- readme: point the header to Barber Saas and barber-saas-docs
- readme: explain the screens, their calls and how to start the remote

### Tests

- ci: install, test and build the remote on every pull request

### Maintenance

- build: ignore dependencies, build output, env files and keys
- github: track the story environment on the board
- build: add the angular 21 and ionic 8 remote with native federation on port 4307

[2.0.0]: https://github.com/code-corhuila/barber-saas-finance-inventory-app/releases/tag/v2.0.0
