# Аудит технического образца Nordel

## Что изучено

Источник: соседний локальный каталог `company_nordel-landing_Native`, указанный владельцем. Прочитаны package.json, конфигурации webpack, ESLint, PostCSS, .gitignore, workflow Pages, данные главной, общие и страничные стили, документы frontend. Секретный .env не читался. Nordel не изменялся, его сборка не запускалась.

## Фактическое устройство

| Область | Обнаружено |
|---|---|
| Стек | Webpack 5, Handlebars, SCSS, vanilla JS, Babel loader, PostCSS/Autoprefixer |
| Страницы | index и about; единый манифест webpack/pages.js |
| Разметка | pages/*.hbs, общий layout, partials верхнего уровня |
| Контент | src/data/*.js, отдельный locales.json |
| Поведение | src/modules: навигация, темы, i18n, демо приложения, wishlist |
| Стили | base.scss и styles/pages/*.scss |
| Команды | start, build:dev, build:prod, build, lint |
| Dev | порт 3000, HMR, source maps; dev server отдаёт сборку из памяти |
| Prod | build/prod, очистка output, CSS/JS с contenthash, минификация |
| CI | push/PR в main и ручной запуск; Node 22, npm ci, production build |
| Pages | проверка index.html/about.html, артефакт build/prod, отдельный deploy job |
| Дополнительно | scripts, docker, compose, tg-bot; их наличие не означает необходимость переноса |

## Что перенести

Разделение данных, шаблонов, стилей и поведения; конфигурацию страниц; dev/prod; воспроизводимую установку по lock-файлу; схему build → artifact → Pages. Новые имена пакета, бренда и ключей хранилища относятся к kuniVPN.

## Что адаптировать

- В Nordel workflow не запускает lint: для kuniVPN добавить lint перед сборкой.
- Проверки двух HTML заменить проверками всего манифеста kuniVPN.
- В Nordel есть WatchPageSourcesPlugin для шаблонов и данных, хотя инструкция местами требует перезапуска при их изменении. В новом проекте проверить обновление hbs, данных, новых partials и манифеста отдельно.
- В common-конфигурации не обнаружено правил вывода изображений и шрифтов. Для kuniVPN явно настроить asset modules/копирование и проверить итоговые URL.
- Зависимости с неиспользуемыми возможностями не копировать автоматически. Babel без нужных преобразований не считать гарантией поддержки старых браузеров.
- Версии checkout@v6, setup-node@v6, upload-pages-artifact@v4, configure-pages@v5 и deploy-pages@v4 — наблюдение из Nordel. Перед реализацией проверить актуальную совместимость по официальной документации.
- Тарифы, тексты, темы, языки, wishlist и горный пейзаж Nordel не переносить как продуктовые требования.
- Не копировать node_modules, build, .git, .idea, .env и секреты. Docker/PHP/Telegram подключать только при появлении требований к backend.

## Проверяемость

Аудит описывает файлы, а не подтверждённую работоспособность Nordel. Его CI, опубликованный сайт и backend не проверялись. Документация kuniVPN не означает, что сборка или деплой уже созданы.
