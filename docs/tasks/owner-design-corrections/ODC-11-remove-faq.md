# ODC-11 — Удалить FAQ

Статус: реализовано; проверено автоматическими сценариями и сравнительными снимками.
Источник: прямое указание владельца, `docs/images/consept/desktop/05-support.png`, [отчёт ресерча](../../qa/reference-html-research.md), [визуальный аудит](../../qa/deep-reference-review.md).

## Подтверждённая проблема

В `pages/index.hbs` под `.topic-grid` рендерится `<div class="faq">` из 4 `<details data-faq id="help-...">`, которого нет в `05-support.png`. Просто удалить `.faq` нельзя без сопутствующих правок:
- Ссылки `.topic-card` ведут на `#help-start`, `#help-trouble`, `#help-billing`, `#help-contact` — при удалении `.faq` контракт `scripts/site-contract.js` упадёт с `Missing anchor #help-...`.
- `src/modules/support.js` напрямую фильтрует `[data-faq]` и по клику на `[data-topic-link]` вызывает `document.getElementById('help-' + category).open = true` и `.querySelector('summary').focus()` (выбросит `TypeError` на `null`).
- `tests/site.spec.js` (строки 45–46) проверяет `[data-faq]:visible`.

## Правки для разработчика

1. **`pages/index.hbs` и `src/data/pages.js`**:
   - Удалить `<div class="faq">...</div>` из `#support` в `pages/index.hbs` и массив `faqs` из `src/data/pages.js` (если больше нигде не используется).
   - Убрать битые якоря `#help-start` / `#help-trouble` / `#help-billing` / `#help-contact` на `.topic-card`: сделать карточки интерактивными темами (либо `<button type="button" class="card topic-card" data-topic-card="...">` с фильтрацией/показом краткой локальной справки в одном аккуратном статус-панели/диалоге без громоздкого FAQ, либо рабочие переходы на релевантные разделы сайта: `Getting started` -> `#apps`, `Account and billing` -> `./account.html`, `Troubleshooting` / `Contact support` -> выбор темы в поиске `#support` без мёртвых якорей).
2. **`src/modules/support.js`**:
   - Перевести поиск `[data-search]` и чипы популярных запросов на фильтрацию `.topic-card` (и/или локальный индекс тем помощи) вместо `[data-faq]`.
   - Удалить обращение к `document.getElementById('help-' + category)` и `details.open`; обновить текст `[data-results]` (EN/RU) под темы помощи.
3. **`src/styles/base.scss`**: удалить неиспользуемые стили `.faq`.
4. **`tests/site.spec.js` и `scripts/check-build.js`**:
   - Обновить строки 45–46 в `tests/site.spec.js`: проверять отсутствие `.faq`, работу поиска/чипов по `.topic-card` и отсутствие JS-ошибок при клике на каждую карточку.
   - Убедиться, что `npm run check:build` (`scripts/site-contract.js`) проходит без ошибок якорей.

## Критерии приёмки

- В `build/prod/index.html` полностью отсутствует `.faq` и элементы `[data-faq]`.
- На странице нет битых якорей `#help-*` и нет ошибок JavaScript при поиске и кликах по темам помощи.
- Поиск и популярные запросы работают в EN и RU; `npm run lint`, `check:build` и Playwright проходят.

## Проверка

`npm run lint`, `npm run build:prod`, `npm run check:build`, `npm run test:browser`, снимки `#support` на `320/390/1440/1672 px` (EN/RU).

## Результат внедрения

См. [отчёт четырёх волн](../../qa/odc-waves.md) и [финальную галерею](../../qa/odc-waves/index.html). Ограничения сведённых PNG и принятые адаптации явно описаны в отчёте; pixel-perfect совпадение не заявляется.
