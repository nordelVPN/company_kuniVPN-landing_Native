# kuniVPN

Статический сайт на Webpack 5, Handlebars, SCSS и vanilla JS. Основные экраны объединены в index; отдельные страницы — восстановление пароля, регистрация и кабинет.

## Запуск

Node.js 22. `npm ci` → `npm start` → http://localhost:3000.
При занятом порте: `npm start -- --port 3100`. Чужие процессы завершать не нужно.

## Проверки

- `npm run lint` — JavaScript.
- `npm run build:dev` — build/dev и source maps.
- `npm run build:prod` — build/prod, четыре HTML, минификация.
- `npm run check:build` — структура, порядок секций, H1, уникальные id, якоря, ресурсы, тарифы, i18n и негативные fixtures.
- `npm run test:smoke` — HTTP страниц и ресурсов в корне и /preview/.
- `npx playwright install chromium firefox webkit`, затем `npm run test:browser` — реальные браузерные сценарии.
- `node scripts/test-browser.js chromium` (или firefox/webkit) — отдельный браузер с отдельным JSON-отчётом.
- `npm run test:watch` — временно меняет и восстанавливает шаблон, partial, данные и локали, проверяя dev-пересборку на свободном порте. Не запускать одновременно с редактированием этих файлов.
- `npm run assets:prepare` — повторный экспорт предоставленных PNG по реестру.

## Структура

`webpack/pages.js` — index/forgot-password/create-account/account.
`pages/index.hbs` — home → features → apps → security → support → plans → login.
`src/templates/partials/` — общий каркас, refined logo, формы, checkout-dialog, billing-history и product-preview.
`src/data/pages.js` — тарифы и FAQ; `src/data/locales.json` — EN/RU.
`src/modules/` — i18n, формы, checkout, support, account, локальное демо.
`src/assets/images/` — производные от предоставленных концептов; source/crop/output/alpha и ограничения в `docs/qa/asset-registry.json`.

EN — по умолчанию, RU — через переключатель. Выбор сохраняется в `kunivpn-language`. Без JS контент доступен на EN. [Контракт i18n](docs/07-i18n.md).

## Функциональные границы

Вход, восстановление, регистрация, checkout и кабинет — явно обозначенные прототипы без API. Валидация, состояния, вкладки и клавиатура работают; реальные аккаунты, письма и платежи не создаются. Демо приложения не подключает VPN. Настройки демо и избранное хранятся в памяти; реквизиты карты не собираются.

Тарифы: триал 1 месяц / 1 (однократно новому пользователю), 1 месяц / 7, 3 месяца / 15, 12 месяцев / 55; каждый на 5 устройств. Валюта, автопродление, возвраты и серверные контракты не заданы. Версии приложений и download URL отсутствуют.

[Актуальные исправления DQA и проверки](docs/qa/dqa-fixes.md), [результаты предыдущего этапа](docs/qa/rework-result.md). Полное восстановление отдельных перекрытых слоёв из плоских PNG не подтверждено; текущие композиции не объявляются pixel-perfect. Используется системный Arial; лицензированный оригинальный шрифт не предоставлен.

## CI и публикация

GitHub Actions выполняет lint, dev/prod, структурные/HTTP и браузерные проверки. Deploy Pages зависит от build и browser; PR не публикуется. Выбери Settings → Pages → GitHub Actions при подготовке публикации. Удалённый workflow и deploy в этой работе не запускались.
