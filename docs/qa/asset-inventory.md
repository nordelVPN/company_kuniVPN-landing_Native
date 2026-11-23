# Реестр композиций и mobile

Точные прямоугольники source/crop, alpha и output находятся в [JSON](asset-registry.json). Воспроизводимый экспорт: npm run assets:prepare. Art используется отдельно от HTML; готовые страницы/кнопки/формы не вставляются скриншотами.

| Источник desktop | Предметный состав | Текущий экспорт / недостающие слои |
|---|---|---|
| 01-home | персонаж/ноутбук, щит, корона, globe, молния, лучи, бумага/checker | home-art.webp и small; соседний UI удалён маской; независимые персонаж/фон/globe отсутствуют |
| 02-features | shield, back/front browser, cursor, orbit/spark, crown/globe/lightning/checker | features-art.webp и small; видимая группа сохранена, перекрытые части окон не восстановлены |
| 02-features paper | независимые верх/низ | torn-top.png/torn-bottom.png с alpha; граница взята из разных зон, цвет нормализован к --paper |
| 03-apps hero | desktop/laptop/phone, glow, paper/decor | apps-art.webp и small; группа связная, отдельные устройства с перекрытыми частями недоступны |
| 03-apps cards | Windows laptop, Mac laptop, iPhone, Android, Linux laptop | пять device.webp и small; отдельные os-*.png с alpha; версия/URL не берётся из изображения |
| 04-security | объёмный shield, стекло, платформа, орбита/glow, crown/globe/lightning/paper | security-art.webp и small; группа исходная, раздельный glow/glass/orbit отсутствуют |
| 05-support | книга Help Center, щит, чаты, globe/crown/lightning/checker | support-art.webp и small; отдельные перекрытые объекты отсутствуют, текст книги часть изображения |
| logo-refined-03 | горизонтальный, вертикальный, компактный щит, светлая горизонтальная версия | четыре logo PNG с alpha, исходные пропорции сохранены |
| 06-login / 08-checkout | refined vertical + декор / order summary | logo vertical, HTML-формы и CSS checker; исходная бумага/крона не выделены в точные независимые слои |
| 07-plans / 09-account | тарифные и профильные компоненты | HTML, актуальные 1/7/15/55 и 5 устройств; образцы личности/59.99/10 устройств не копируются |

Ни одна строка с недоступными слоями не означает, что они восстановлены. Для финальной послойной графики нужны оригинальные прозрачные экспорты или слоистый файл. Чёрная фактура вырезок остаётся частью тёмной композиции; такие art не размещаются на светлой features-полосе.

## Mobile 01–09

| Mobile источник | Реализованный компонент/состояние |
|---|---|
| 01-home | компактный connection preview, маскот выделен из оригинала в mascot.webp; ring/статус/CTA — HTML/CSS |
| 02-connected | отдельные connected/disconnected состояния с цветом ring и CTA; только локальная демонстрация |
| 03-locations | поиск, all/favorites/recent, локальный выбор; вместо неподтверждённых стран — явно обозначенные примеры A/B/C |
| 04-settings | строки/checkbox auto-connect, kill switch, notifications и unspecified protocol; не сетевые настройки; EN/RU реальные настройки интерфейса |
| 05-account | мобильные tabs/строки, профиль и выход из прототипа |
| 06-subscription | карточки/статусы empty/active/expired и View Plans; сведения о продлении не выдумываются |
| 07-plans | четыре актуальных предложения вертикально |
| 08-payment | dialog одной колонкой, выбор метода, summary, email, доступность при уменьшенном viewport |
| 09-help | компактный поиск, темы/FAQ и переход из кабинета к support |

OS-frame, статус-бар и внешнее оранжевое полотно не перенесены на весь сайт. Нативное VPN-подключение, география серверов и настройки защиты остаются вне статического прототипа. Маскот используется только внутри необязательного preview.

## Проверка

Сохранены исходные PNG, исходная mobile-сводка и [реальные снимки](screenshots/). См. [итоговый отчёт](rework-result.md) для точных границ визуальной проверки и ручной приёмки.
