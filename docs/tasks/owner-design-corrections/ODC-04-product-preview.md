# ODC-04 — Удалить отсутствующий в дизайне product-preview

Статус: реализовано; проверено автоматическими сценариями и сравнительными снимками.
Источник: прямое указание владельца, `docs/images/consept/desktop/03-apps.png`, [отчёт ресерча](../../qa/reference-html-research.md).

## Подтверждённая проблема

В `pages/index.hbs` внутри `#apps` после `.platform-grid` подключён partial `{{> product-preview}}` (`Explore the app prototype` — демонстрация экранов мобильного приложения `mobile/01–04`). Этого блока нет в `03-apps.png`.

## Правки для разработчика

1. **`pages/index.hbs`**: удалить `{{> product-preview}}` из `#apps`.
2. **`src/templates/partials/product-preview.hbs`**: удалить неиспользуемый partial.
3. **`src/modules/main.js` и `src/modules/preview.js`**: удалить вызов `require('./preview').initPreview();` из `src/modules/main.js` и удалить `src/modules/preview.js`.
4. **`src/styles/base.scss`**: удалить все стили `.product-preview`, `.preview-tabs`, `.demo-connection`, `.connection-ring`, `.location-list` (строки в районе байтов 13500–16300).
5. **`scripts/prepare-assets.js` и `src/assets/images/`**: проверить использование `mascot.webp` / `mascot-small.webp`; если они использовались только в `product-preview.hbs`, удалить их из `prepare-assets.js` и пересобрать ассеты.
6. **`src/data/locales.json` и `tests/site.spec.js`**:
   - В `tests/site.spec.js` (строка 80) удалить/заменить проверку `.product-preview>summary` и `[data-demo-connect]`, чтобы Playwright-сьют не падал на удалённом элементе.
   - Проверить `npm run check:build` (`scripts/check-i18n.js`), при необходимости очистить неиспользуемые ключи `product-preview` из `locales.json`.

## Критерии приёмки

- В `build/prod/index.html` и CSS отсутствуют `.product-preview`, `data-preview-tab`, `data-demo-connect` и лишние отступы внизу `#apps`.
- В консоли браузера нет ошибок JS; `npm run lint`, `npm run build:prod`, `npm run check:build` и Playwright проходят.

## Проверка

`npm run lint`, `npm run build:prod`, `npm run check:build`, `npm run test:browser`, снимки `#apps` на `320/390/1440/1672 px` (EN/RU).

## Результат внедрения

См. [отчёт четырёх волн](../../qa/odc-waves.md) и [финальную галерею](../../qa/odc-waves/index.html). Ограничения сведённых PNG и принятые адаптации явно описаны в отчёте; pixel-perfect совпадение не заявляется.
