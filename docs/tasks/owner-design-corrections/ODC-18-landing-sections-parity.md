# ODC-18 — Привести CTA, заголовки, иконки ОС, .everyday и поиск в секциях #home–#support к 01–05

Статус: реализовано; проверено автоматическими сценариями и сравнительными снимками.
Источник: глубокий ресерч фото-референсов vs готового HTML (`docs/qa/reference-html-research.md`), визуальный аудит (`docs/qa/deep-reference-review.md`), референсы `01-home.png`–`05-support.png`.

## Требование

Устранить структурные и контентные расхождения секций главной страницы с референсами (с сохранением локализации EN/RU и честных формулировок без выдуманных характеристик; крупная кнопка `#home .button.large` оформляется в рамках [ODC-17-home-cta.md](ODC-17-home-cta.md)):

1. **`#home` (`01-home.png`)**:
   - В `pages/index.hbs` убрать отсутствующий в макете eyebrow `kuniVPN / digital freedom`.
   - Заменить плоский текст `Windows · macOS · Linux · iOS · Android` под CTA на строку `Available for` с 5 аккуратными SVG/PNG-иконками ОС (`aria-label`/`sr-only` названия платформ сохранить для доступности).
2. **`#features` (`02-features.png`)**:
   - Привести eyebrow к `/// FEATURES` (декоративные слэши `aria-hidden="true"`).
   - Восстановить пару кнопок: добавить основную оранжевую кнопку `Download KUNI VPN >` (ссылка `#apps`, иконка download + chevron) и перевести `View Apps` во вторичный стиль `.button.secondary`.
   - Увеличить `.everyday h3` до крупного 2-строчного заголовка (совместно с `ODC-06`).
   - Заменить однословные подписи (`Browse`, `Watch`, `Work`, `Play`) на 2-строчные из референса (`Browse your favorite sites`, `Watch and stream content`, `Work, study and stay productive`, `Use everyday apps and services` + RU-переводы в `locales.json`) и заменить иконку геймпада на релевантную иконку приложений/сервисов.
3. **`#security` (`04-security.png`)**:
   - Привести eyebrow к `/// SECURITY`, заголовок — к 3-строчному `Your privacy / and protection, / made easy.` (RU-аналог), заголовки пунктов — к `More Privacy Online` / `Everyday Protection` / `Easy to Use Everywhere` (без неподтверждённых обещаний в описаниях).
   - Восстановить нижний ряд CTA: оранжевая `Download KUNI VPN >` + вторичная `All Apps` + `Available for` с иконками ОС (иконки самих пунктов — в `ODC-07`).
4. **`#support` (`05-support.png`)**:
   - Убрать лишний eyebrow `Support` и скрыть визуально `<label for="help-search">` через `.sr-only` (сохранив доступное имя поля).
   - Добавить подзаголовок `.lead` (`Find answers, get set up, and solve issues with KUNI VPN.` + RU).
   - Добавить иконку лупы внутрь `.search-row` слева от `<input>`.
   - Оформить популярные запросы в стиле `Popular searches: Setup guide ...` (компактная строка со ссылками/чипами без 5 громоздких кнопок `.chips`).

## Затрагиваемые файлы

`pages/index.hbs`, `src/templates/partials/icon.hbs`, `src/styles/base.scss`, `src/data/locales.json`, `tests/site.spec.js`.

## Критерии приёмки

- Все 4 секции совпадают с `01–05` по составу CTA, наличию/отсутствию eyebrow и lead, иконкам ОС и структуре `.everyday` / поиска.
- Все новые и обновлённые строки переведены в `src/data/locales.json` (EN/RU), клавиатурная доступность, `aria-label` и `min-height: 44px` сохранены.

## Проверка

`npm run lint`, `npm run build:prod`, `npm run check:build`, Playwright (EN/RU) и сравнительные снимки на `320/390/768/1440/1672/1920 px`.

## Результат внедрения

См. [отчёт четырёх волн](../../qa/odc-waves.md) и [финальную галерею](../../qa/odc-waves/index.html). Ограничения сведённых PNG, нейтральные тексты вместо неподтверждённых обещаний и адаптации данных описаны в отчёте.
