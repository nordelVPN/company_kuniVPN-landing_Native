# Целевая архитектура, сборка и CI/CD

## Стек и структура

Статический сайт с единой главной страницей и отдельными служебными страницами: Webpack 5 + Handlebars + SCSS + vanilla JS. Сохранить подход Nordel без введения SPA-фреймворка. Базовая среда — Node 22, точные зависимости фиксируются package-lock.json после проверки совместимости.

```text
.github/workflows/pages.yml
docs/
  images/consept/              существующие референсы
  qa/                         отчёты и сравнительные скриншоты
pages/                        index, forgot-password, create-account,
                              account — *.hbs
src/
  assets/images/              оптимизированные производственные изображения
  assets/icons/               SVG-иконки и фирменные знаки
  assets/fonts/               лицензированные WOFF2
  data/                       данные страниц, общая навигация, тарифы
  modules/                    навигация, FAQ, демо и будущие интеграции
  styles/base.scss            reset, токены, типографика, общие состояния
  styles/components/          стили компонентов
  styles/pages/               стили страниц
  templates/layouts/main.hbs
  templates/partials/         header, footer, logo, кнопки, карточки
webpack/
  pages.js
  webpack.common.js
  webpack.dev.js
  webpack.prod.js
scripts/                      проверка артефакта и браузерный smoke
package.json
package-lock.json
eslint.config.js
postcss.config.js
.gitignore
README.md
build/dev/                    генерируемый, вне Git
build/prod/                   генерируемый, вне Git
```

Целевой состав манифеста: index, forgot-password, create-account, account. Features, apps, security, support, plans и login становятся секциями index, checkout — partial модального окна. Старые отдельные страницы удаляются из сборки; при необходимости совместимости используются явные переходы на index с якорем.

Секции index в порядке: home → features → apps/platforms → security → support → plans → login. Header один; ссылки ведут к #features/#apps/#security/#support/#plans/#login, с внутренних страниц — ./index.html#… . Log In — последний содержательный экран, затем общий footer. Один H1 на index, заголовки секций H2. У служебных страниц свой H1.

Манифест каждой страницы задаёт template, data, modules и styles. index выводится в index.html, остальные — в одноимённые HTML. В каждый HTML попадают только его entry и общие зависимости. Общие header/footer создаются один раз через layout.

## Контракт команд

| Команда | Контракт |
|---|---|
| npm ci | установка строго по закоммиченному lock-файлу |
| npm run start | localhost:3000, HMR; dev output в памяти |
| npm run build:dev | запись build/dev, source maps |
| npm run build:prod | запись build/prod, минификация, contenthash, очистка только своего output |
| npm run build | alias production-сборки |
| npm run lint | JS исходников, конфигураций и scripts |
| npm run check:build | все страницы манифеста, локальные ресурсы и ссылки |
| npm run test:smoke | HTTP-проверка ключевых пользовательских сценариев |

При первом создании/обновлении lock-файла используется npm install; повторные установки — npm ci. Списки браузеров и преобразования JS согласовать с фактическими зависимостями.

## Требования к сборке

- SCSS → PostCSS/Autoprefixer → отдельный CSS; JS и CSS минифицируются в prod.
- Изображения и шрифты проходят через явные asset rules либо копирование; оригиналы концептов в сайт не включаются.
- URL работают и в корне домена, и в подпути GitHub Pages: страницы ссылаются через ./, ресурсы — относительно корректной базы.
- Watch обновляет шаблоны, данные и partials; изменение манифеста должно либо подхватываться, либо иметь документированное требование перезапуска.
- Без клиентских секретов и обязательных внешних CDN. У сайта сохраняется читаемый основной контент без JS.
- Локальные .env, node_modules и build исключены из Git.

## GitHub Actions: целевой контракт

События: push в main, pull_request в main, workflow_dispatch. Build job: ubuntu-latest, timeout 10 минут, permissions contents: read.

Последовательность: checkout → Node 22 с npm cache → npm ci → lint → build:prod → check:build. Браузерный smoke подключить отдельным шагом/job после появления сценариев и установки браузера.

Артефакт Pages создаётся только для main и событий вне PR, путь build/prod. Deploy job зависит от успешного build, использует environment github-pages и разрешения pages: write/id-token: write только в этом job. Concurrency github-pages, cancel-in-progress: false. PR проверяется без публикации и без секретов.

В Settings → Pages источник должен быть GitHub Actions. Настройка репозитория и первая публикация — отдельный этап после появления доступа к репозиторию. Сейчас удалённые настройки не изменены.

## Проверка результата

На чистой установке проходят lint, dev/prod и check:build. Каждая страница открывается через HTTP, включая прямой заход на account.html. Нет 404 ресурсов при размещении в подпути. Проверки не содержат жёстко заданного списка только index/about. Backend кабинета, платежей и VPN не размещается в статическом артефакте Pages.

## Изменения проверок при объединении

check:build должен проверять четыре целевых HTML, уникальность id секций, существование якорей и отсутствие старых ссылок checkout.html/login.html. Тест выбора плана проверяет открытие dialog и данные Order Summary вместо перехода на checkout URL. HTTP smoke не доказывает работу модального окна: нужен браузерный сценарий выбора каждого из четырёх планов, закрытия, повторного открытия и клавиатуры. Сохранить проверки корня и подпути Pages. GitHub Actions и сборка сохраняют подход Nordel, но не старый список девяти страниц.

## Реализованный контракт после QA

Манифест уже содержит index/forgot-password/create-account/account. Проверка якорей и отрицательные fixtures подключены к check:build. Checkout и вкладки проверяются Playwright в Chromium/Firefox/WebKit; browser job включён в зависимости deploy. Default dev port — 3000. Модуль данных загружается заново при каждом рендере, исправлен кеш повторных watch-изменений. [Результаты и границы](qa/rework-result.md).
