# QA-01 — структура и навигация

Статус: реализовано и проверено; четыре HTML, порядок секций, якоря, мобильное меню. [Результат и ограничения](../../qa/rework-result.md).

Ниже сохранены факты исходного аудита; они описывают состояние до исправления. Приоритет: P1 · несоответствие новым требованиям · REV-04.

Файлы: webpack/pages.js, pages/index.hbs, header.hbs, footer.hbs, src/data/pages.js, main.js.
В production девять HTML; у index отсутствуют все семь целевых id. Forgot-password/create-account не генерируются. Header/footer ведут на отдельные страницы.
Воспроизведение: build:prod → node docs/qa/audit-current.cjs; SECTION показывает false для home/features/apps/security/support/plans/login, SERVICE_PAGE — false.
Собрать index в порядке home → features → apps → security → support → plans → login, один H1/header/footer. В манифесте оставить index/forgot-password/create-account/account. Обновить ссылки со служебных страниц и aria-current, не отмечать все якоря текущими одновременно. Старые URL удалить либо оформить явные переходы при согласованной необходимости совместимости.
Приёмка: четыре HTML, уникальные id и существующие якоря; login последний содержательный экран; прямые URL и переходы работают в корне и /preview/. Проверить sticky offset и мобильное закрытие меню после выбора ссылки. Зависимость: QA-03 реализует содержимое auth; QA-02 — dialog.
