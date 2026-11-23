# Правки дизайна по замечаниям владельца

Статус: все 18 открытых задач реализованы; ODC-13/15/16 сохранены и повторно проверены. [Отчёт внедрения](../../qa/odc-waves.md) · [154 свежих снимка](../../qa/odc-waves/index.html). Автотесты: 19/19 в каждом из трёх движков; после финальных правок повторена матрица EN/RU 320–2560. Ограничения точности плоских PNG описаны в отчёте.

Этот набор дополняет прежний DQA backlog и не наследует его статусы «исправлено». При конфликте требований новые прямые уточнения владельца имеют приоритет: вход переносится на отдельную страницу, FAQ и product-preview удаляются.

| Файл | Задача | Статус |
|---|---|---|
| [ODC-01-home-background.md](ODC-01-home-background.md) | Фон #home и #home::after на всю ширину (включая >1920 px) | Реализовано, проверено |
| [ODC-02-apps-art.md](ODC-02-apps-art.md) | Устранить обрезку apps-art.webp (crop + позиционирование) | Реализовано, проверено |
| [ODC-03-home-art.md](ODC-03-home-art.md) | Устранить обрезку home-art.webp (ступенчатая маска + перекрытие) | Реализовано, проверено |
| [ODC-04-product-preview.md](ODC-04-product-preview.md) | Удалить отсутствующий в дизайне product-preview, JS и тест | Реализовано, проверено |
| [ODC-05-benefits.md](ODC-05-benefits.md) | Восстановить 4 преимущества под Home (тёмная полоса 01-home) | Реализовано, проверено |
| [ODC-06-typography.md](ODC-06-typography.md) | Увеличить размеры текста по замерам референсов | Реализовано, проверено |
| [ODC-07-security-icons.md](ODC-07-security-icons.md) | Уточнить иконки security-points (контейнер 93×83, ноутбук+смартфон) | Реализовано, проверено |
| [ODC-08-security-art.md](ODC-08-security-art.md) | Устранить обрезку security-art.webp (слева 110 px, снизу 55 px) | Реализовано, проверено |
| [ODC-09-support-art.md](ODC-09-support-art.md) | Устранить обрезку support-art.webp и вернуть alpha-канал | Реализовано, проверено |
| [ODC-10-topic-cards.md](ODC-10-topic-cards.md) | Привести .topic-card к 05-support (иконки, 4 текста, стрелки `>`) | Реализовано, проверено |
| [ODC-11-remove-faq.md](ODC-11-remove-faq.md) | Удалить FAQ, перевести support.js и якоря без битых ссылок | Реализовано, проверено |
| [ODC-12-plans.md](ODC-12-plans.md) | Переработать #plans по 07-plans.png (4 коммерческих тарифа) | Реализовано, проверено |
| [ODC-13-login-page.md](ODC-13-login-page.md) | Вынести #login на отдельную страницу | Выполнено |
| [ODC-14-account-labels.md](ODC-14-account-labels.md) | Заменить Account · prototype на Account, убрать Project in development | Реализовано, проверено |
| [ODC-15-auth-art.md](ODC-15-auth-art.md) | Устранить обрезку изображения в auth-art | Выполнено |
| [ODC-16-footer-links.md](ODC-16-footer-links.md) | Продублировать все навигационные ссылки в footer | Выполнено |
| [ODC-17-home-cta.md](ODC-17-home-cta.md) | Реализовать крупную кнопку Home (.button.large с download + chevron) | Реализовано, проверено |
| [ODC-18-landing-sections-parity.md](ODC-18-landing-sections-parity.md) | Привести CTA, заголовки, иконки ОС, .everyday и поиск в #home–#support | Реализовано, проверено |
| [ODC-19-auth-checkout-account-parity.md](ODC-19-auth-checkout-account-parity.md) | Довести login.html, #checkout и account.html до 06, 08, 09 и mobile | Реализовано, проверено |
| [ODC-20-palette-font-layout-overlaps.md](ODC-20-palette-font-layout-overlaps.md) | Уточнить палитру, подключить WOFF2-шрифт, убрать обрезку .header и перекрытия | Реализовано, проверено |
| [ODC-21-apps-assets-and-badges.md](ODC-21-apps-assets-and-badges.md) | Исправить os-ios.png, прозрачность *-device.webp и стор-кнопки iOS/Android | Реализовано, проверено |

В каждой задаче указаны подтверждённые замеры, конкретные файлы для правки, требования и критерии приёмки. Исходные референсы: `../../images/consept/desktop/` и `../../images/consept/mobile/`. Коммерческие данные тарифов сохраняются согласно `../../04-pages-and-components.md`.

## Выполненный порядок внедрения

1. **Волна 1 — Ассеты, палитра, шрифт, базовая сетка:** `ODC-20` → `ODC-03`, `ODC-02`, `ODC-08`, `ODC-09`, `ODC-21` (`scripts/prepare-assets.js` + `npm run assets:prepare`) → `ODC-01`, `ODC-06`.
2. **Волна 2 — Главная страница (`#home`–`#support`):** `ODC-17`, `ODC-05`, `ODC-04`, `ODC-07`, `ODC-10`, `ODC-11`, `ODC-18`.
3. **Волна 3 — Тарифы, вход, checkout, кабинет, футер:** `ODC-12`, `ODC-19`, `ODC-14`.
4. **Волна 4 — Автотесты и финальная приёмка:** `npm run lint`, `npm run build:prod`, `npm run check:build`, `npm run test:smoke`, `npm run test:browser` (Chromium/Firefox/WebKit), свежие сравнительные снимки на `320/390/768/1440/1672/1920/2560 px` (EN/RU).

## Правило ведения требований

По прямому указанию владельца все новые требования необходимо сразу записывать в файлы docs, обновляя соответствующие задачи и этот список. В ответе владельцу указывать конкретные изменённые файлы. Статус выполнения меняется только после проверки реализации.

## Ширина desktop-контейнера

По уточнению владельца максимальная ширина `.wrap` увеличена до 1920 px. Адаптивные внутренние отступы сохраняются. Реализация: `src/styles/base.scss`.
