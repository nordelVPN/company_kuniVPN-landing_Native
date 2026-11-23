# DQA-02 — Заменить повторяющиеся и неверные смысловые иконки

Статус: Исправлено: browser/video/laptop/gamepad, lock/shield/devices, person/layers/card/settings; уникальность проверяется в браузере. Приоритет: P2.

[Исправления и доказательства](../../qa/dqa-fixes.md). Ниже сохранены исходные факты QA и критерии приёмки.

Основание: docs/03, docs/06, REV-05/07/12. Файлы: pages/index.hbs, pages/account.hbs, icon.hbs.
Факт: Browse/Watch/Play используют одну и ту же книгу, все три пункта Security — один щит. В Account/Subscription/Billing/Preferences и аватаре повторяется значок устройств вместо соответствующих сущностей. Три одинаковых security SVG и три книги подтверждены DOM-замерами в recheck-deep.json и свежими EN/mobile снимками.
Сделать browser/video/laptop/gamepad для everyday, lock/shield/devices для Security; person/subscription/card/settings для кабинета. Сохранить единые viewBox/stroke и aria-hidden для декоративных иконок. Не вводить emoji.
Приёмка: каждому пункту соответствует собственная смысловая иконка из согласованного SVG-набора; desktop/mobile и активный tab сохраняют контраст. Значки ОС уже разные и исправны — эту старую претензию не повторять.

Доказательства и границы: [повторный аудит](../../qa/design-recheck.md).
