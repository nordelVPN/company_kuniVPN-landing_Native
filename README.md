# kuniVPN

Статический сайт на Webpack 5, Handlebars, SCSS и vanilla JS + PHP 8.4 Telegram-вишлист (`tg-bot/`, `docker/`, `compose.yaml`).

## Запуск

Node.js 22+. `npm ci` → `npm start` → http://localhost:3000.
При занятом порте: `npm start -- --port 3100`.
Для запуска вместе с Telegram-вишлистом: `docker compose up --build`.

## Проверки

- `npm run lint` — JavaScript (ESLint).
- `npm run build:dev` — `build/dev` и source maps.
- `npm run build:prod` — `build/prod`, 7 HTML-страниц (`index`, `login`, `create-account`, `forgot-password`, `account`, `privacy`, `terms`), минификация.
- `npm run check:build` — структура, порядок секций, H1, уникальные id, якоря, ресурсы, тарифы, 13 языков i18n и негативные fixtures.
- `npm run test:smoke` — HTTP страниц и ресурсов в корне и `/preview/`.
- `npm run test:browser` — Playwright браузерные сценарии.

## Структура

- `webpack/pages.js` — 7 страниц: `index`, `login`, `forgot-password`, `create-account`, `account`, `privacy`, `terms`.
- `pages/index.hbs` — `home` → `features` → `apps` → `security` → `support` → `plans`.
- `pages/account.hbs` — Личный кабинет с блоками профиля, подписки, VPN-ключа и списка серверов, управления 5 устройствами, биллинга, безопасности и настроек (подключён `VpnPortalSDK` с режимом `demo|live`).
- `src/data/locales.json` — 13 языков (`en` по умолчанию + `ru`, `pl`, `uk`, `lt`, `tr`, `ro`, `de`, `sk`, `hr`, `sr`, `bg`, `hu`). Выбор сохраняется в `kunivpn-language`.
- `tg-bot/`, `docker/`, `compose.yaml` — PHP 8.4 контур Telegram-вишлиста.

## Тарифная сетка (Сетка B, EUR)

- `trial` — Trial (1 мес): `€1` (однократно новому пользователю), 5 устройств.
- `monthly` — 1 месяц: `€7`, 5 устройств.
- `quarterly` — 3 месяца: `€15` (`€5/мес` справочно), 5 устройств.
- `yearly` — 12 месяцев: `€55` (`€4.58/мес` справочно), 5 устройств.
