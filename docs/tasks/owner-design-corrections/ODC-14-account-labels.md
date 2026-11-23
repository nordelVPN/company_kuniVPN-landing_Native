# ODC-14 — Убрать служебные надписи

Статус: реализовано; проверено автоматическими сценариями и сравнительными снимками.
Источник: прямое указание владельца, [отчёт ресерча](../../qa/reference-html-research.md).

## Подтверждённая проблема

В `src/templates/partials/footer.hbs` и `src/data/locales.json` (строки 103–104 и 452–453) на всех 5 страницах выводятся:
- ссылка `<a href="./account.html" data-i18n="Кабинет · прототип">{{t "Кабинет · прототип"}}</a>` → в EN `Account · prototype`, в RU `Кабинет · прототип`;
- подпись `<small data-i18n="© kuniVPN · Проект в разработке">{{t "© kuniVPN · Проект в разработке"}}</small>` → в EN `© kuniVPN · Project in development`, в RU `© kuniVPN · Проект в разработке`.

## Правки для разработчика

1. **`src/templates/partials/footer.hbs`**:
   - Заменить ключ ссылки на `Account` / `Кабинет`: `<a href="./account.html" data-i18n="Кабинет">{{t "Кабинет"}}</a>` (или существующий ключ `"Account"`).
   - Убрать `· Проект в разработке` / `· Project in development`: оставить чистый `<small>© kuniVPN</small>` (либо удалить лишний `<small>`, если подпись не нужна, не оставляя пустого места в flex-сетке футера).
2. **`src/data/locales.json`**:
   - Проверить переводы `"Кабинет": "Account"` (EN) / `"Кабинет": "Кабинет"` (RU).
   - Удалить неиспользуемые ключи `"Кабинет · прототип"` и `"© kuniVPN · Проект в разработке"` (проверив `scripts/check-i18n.js`).
3. **Проверка всех 5 шаблонов (`pages/*.hbs`, `src/templates/partials/*.hbs`)**:
   - Убедиться поиском по `build/prod/*.html`, что строки `Account · prototype`, `Кабинет · прототип`, `Project in development` и `Проект в разработке` нигде не выводятся в видимом тексте.
4. **Тесты (`tests/odc-auth-footer.spec.js`, `tests/site.spec.js`)**:
   - Проверить, не завязаны ли селекторы/утверждения тестов на старый текст `Account · prototype` или `Project in development`, и обновить при необходимости.

## Критерии приёмки

- На всех 5 страницах (`index`, `login`, `create-account`, `forgot-password`, `account`) в обеих локалях (EN/RU) отображается `Account` / `Кабинет`.
- `Account · prototype`, `Кабинет · прототип`, `Project in development`, `Проект в разработке` отсутствуют в видимом интерфейсе.
- Логика честных заглушек API/форм не нарушена.

## Проверка

`npm run lint`, `npm run build:prod`, `npm run check:build`, `npm run test:browser`, проверка текста футера на `320/390/1440/1672 px` (EN/RU).

## Результат внедрения

См. [отчёт четырёх волн](../../qa/odc-waves.md) и [финальную галерею](../../qa/odc-waves/index.html). Ограничения сведённых PNG и принятые адаптации явно описаны в отчёте; pixel-perfect совпадение не заявляется.
