# ODC-10 — Привести card.topic-card к дизайну

Статус: реализовано; проверено автоматическими сценариями и сравнительными снимками.
Источник: замечания владельца, `docs/images/consept/desktop/05-support.png`, `docs/images/consept/mobile/09-help.png`, [отчёт ресерча](../../qa/reference-html-research.md), [визуальный аудит](../../qa/deep-reference-review.md).

## Подтверждённая проблема

По замерам `05-support.png` vs `build/prod/index.html`:
- **Размер карточек**: в референсе `360×286 px`, в HTML `364×220 px`.
- **Иконки**: в референсе крупные оранжевые **`58–63 px`** (ракета до `105×102 px`), в HTML мелкие `36×36 px`.
- **Заголовки и описания**: в референсе заголовки `32–33 px` (CSS `~34–40 px`), описания `18–20 px` (CSS `~20–22 px`); в HTML `23 px` и `15 px`.
- **Тексты карточек**: в HTML на всех 4 карточках повторяется заглушка `Read the local guide`, тогда как в `05-support.png` у каждой карточки своё описание:
  1. `Getting started` — `Set up KUNI VPN and learn the basics.`
  2. `Troubleshooting` — `Fix common issues and get back online.`
  3. `Account and billing` — `Manage your account, subscription, and payments.`
  4. `Contact support` — `Get help from the KUNI VPN team.`
- **Стрелки `>` отсутствуют**: в референсе справа у каждой карточки есть круглая кнопка/иконка со стрелкой `>` (`12×22 px`).
- **Декор фона**: в HTML одинаковый грубый `linear-gradient(160deg, #151515 85%, #ff7a00 86%)`; в `05-support.png` тёмная карточка (`#0a0908`) с тонкой рамкой и рваным оранжевым акцентом в правом нижнем углу.

## Правки для разработчика

1. **`pages/index.hbs` и `src/data/locales.json`** (согласовать назначения ссылок с `ODC-11` при удалении FAQ!):
   - Заменить `Read the local guide` на 4 конкретных описания (с переводами EN/RU в `locales.json`).
   - Добавить внутрь каждой `.topic-card` декоративный элемент стрелки `<span class="topic-arrow" aria-hidden="true">...</span>` (SVG chevron-right).
2. **`src/styles/base.scss`**:
   - Увеличить `.topic-card` (`min-height: 270–286px` на desktop), увеличить `.topic-card .ui-icon` до `56–68 px`, `.topic-card h3` до `clamp(24px, 2vw, 34px)`, описание до `17–19 px`.
   - Заменить грубый диагональный градиент на тёмную поверхность `#0b0a09`, деликатную рамку `1px solid #35312c`, нижний правый рваный/оранжевый акцент и аккуратную стрелку справа по центру/низу.
   - На мобильном (`<=500 px`, ориентир `mobile/09-help.png`): компактные горизонтальные строки с иконкой слева, заголовком+описанием в центре и стрелкой `>` справа.

## Критерии приёмки

- Все 4 карточки имеют крупные иконки, увеличенную типографику, 4 разных описания (EN/RU), видимые стрелки `>` и корректный нижний правый акцент.
- Карточки остаются доступными с клавиатуры (видимый `:focus-visible`, `min-height >= 44px`), без мёртвых ссылок после `ODC-11`.

## Проверка

`npm run build:prod`, `npm run check:build`, Playwright (`320/390/768/1440/1672 px`, EN/RU), сравнительные снимки с `05-support.png` и `mobile/09-help.png`.

## Результат внедрения

См. [отчёт четырёх волн](../../qa/odc-waves.md) и [финальную галерею](../../qa/odc-waves/index.html). Ограничения сведённых PNG и принятые адаптации явно описаны в отчёте; pixel-perfect совпадение не заявляется.
