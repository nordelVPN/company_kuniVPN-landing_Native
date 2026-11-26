# Независимая повторная QA-проверка после завершения работ Fullstack

Дата проверки: 2026-11-23.  
Проверяемое состояние репозитория: `HEAD` = `e6dc66b8c2a5efbead4154466ee464c079fe9cb5` (`feat: display euro currency symbol (€) on plan prices and update i18n/tests`), `git status --short` — пусто (незафиксированных локальных изменений нет; признаков активной продолжающейся работы Fullstack в рабочей директории не обнаружено).

Настоящая проверка выполнена независимо: пройдены свежие автопрогоны, попиксельная форензика ассетов (`sharp`) и живые DOM/CSS-замеры `build/prod` в Playwright Chromium (`2560/1920/1672/1440/768/600/390/320 px`, EN и RU). Push, merge, публикация и принятие gates не выполнялись.

---

## 1. Результаты независимых автоматических проверок

| Проверка | Команда | Фактический результат |
|---|---|---|
| ESLint | `node node_modules/eslint/bin/eslint.js .` | **PASS** (0 ошибок) |
| Production build | `node node_modules/webpack/bin/webpack.js --config webpack/webpack.prod.js` | **PASS** (5 HTML, `index/login/account/create-account/forgot-password`, локальные WOFF2 и ассеты) |
| Build contract & i18n | `node scripts/check-build.js` | **PASS** (5 страниц, порядок секций, уникальные ID, якоря/ассеты, 4 тарифа, EN/RU parity, 6 negative fixtures) |
| HTTP smoke | `node scripts/smoke.js` | **PASS** (10/10 запросов: корень и `/preview`) |
| Playwright Chromium | `playwright test --project=chromium` | **PASS — 19/19** (`38.6 s`) |
| Playwright Firefox | `playwright test --project=firefox` | **PASS — 19/19** (`46.3 s`) |
| Playwright WebKit | `playwright test --project=webkit` | **PASS — 19/19** (18/19 за 60 s + допрогон `responsive matrix` 1/1 за `18.5 s`; суммарно >60 s на 3 воркерах) |
| Независимый DOM/CSS аудит (`2560`–`320 px`, EN/RU) | Playwright + `sharp` | **0** page/console errors, **0** внешних сетевых запросов, **0** horizontal overflow, **0** перекрытий текста с `section-art`; выявлено **6 дефектов/нестыковок** (раздел 3) |

---

## 2. Полный реестр QA-задач (`ODC-01`–`ODC-21`) и фактический статус

| Задача | Суть требования | Независимый статус | Доказательства / замечания |
|---|---|---|---|
| **ODC-01** | Фон `#home` и `#home::after` на всю ширину (включая `>1920 px`) | **PASS** | На `2560 px` (EN/RU): `#home` `x=0, w=2560`, `#home::after` `2560px`; `.wrap` перенесён внутрь; overflow `false`. |
| **ODC-02** | Устранить обрезку `apps-art.webp` | **PASS** | Расширен до `1121×440`, `hasAlpha=true` (`36.5%` прозр.), нижняя кромка `B=2.1%` (было `57.9%`), `right: -20px` убран, перекрытий на `1440–2560 px` нет. |
| **ODC-03** | Устранить обрезку `home-art.webp` | **PARTIAL** | Старая ступенчатая маска и перекрытие с текстом (`398×458 px`) устранены, `1192×730`, `hasAlpha=true`. **Дефект D-05**: в `prepare-assets.js` `textBoxes['home-art']` содержит `[0,0,1192,24]`, обнуляющий верхние 24 px (`y=70..94`) в пустую прозрачную полосу. |
| **ODC-04** | Удалить `product-preview`, JS и тест | **PARTIAL** | `.product-preview` (`0` в DOM), `product-preview.hbs`, `preview.js` и тест удалены. **Дефект D-03**: `mascot.webp` / `mascot-small.webp` всё ещё генерируются в `prepare-assets.js` (строка 10) и копируются в `build/prod/assets/images/` без использования. |
| **ODC-05** | Восстановить 4 преимущества под `#home` (`01-home.png`) | **PASS** | Сразу после `#home` добавлен `.benefit-dark` (`benefits-dark.hbs`): `Stronger Privacy`, `Reliable Access`, `Secure Browsing`, `Multi-Platform` с иконками и EN/RU; светлая полоса в `#features` сохранена отдельно. |
| **ODC-06** | Увеличить размеры текста по референсам | **PASS** | На `1672 px` (EN): `#home h1` `110.4px`, `#features h2` `90.3px`, `.everyday h3` `60px`, `#apps h2` `83.6px`, `#security h2` `90.3px`, `#support h2` `158.8px`, `#plans h2` `76px`, `login h1` `66.9px`/`88.6px`; overflow на `320 px` (EN/RU) отсутствует. |
| **ODC-07** | Уточнить иконки `security-points` (`04-security.png`) | **PASS** | Контейнер `86×82 px`, 3-я иконка `device` в `icon.hbs` переработана в ноутбук + смартфон (`rect` + наклонная база + смартфон справа), заголовки приведены к `More Privacy Online` / `Everyday Protection` / `Easy to Use Everywhere`. |
| **ODC-08** | Устранить обрезку `security-art.webp` | **PASS** | Расширен до `1021×835`, `hasAlpha=true`, левая кромка `L=10.5%` (было `52.2%`), перекрытий на `1440–2560 px` нет. |
| **ODC-09** | Устранить обрезку `support-art.webp` и вернуть alpha | **PASS** | Расширен до `851×530`, **`hasAlpha=true`** (`35.8%` прозр., было `alpha=false`), левая кромка `L=8.1%` (было `25.7%`), перекрытий нет. |
| **ODC-10** | Привести `.topic-card` к `05-support.png` | **PASS** | Карточки `364×286 px`, SVG `64×64 px`, 4 уникальных описания, стрелка `.topic-arrow` (chevron) у всех 4 карточек, клавиатурная доступность `<button type="button">`. |
| **ODC-11** | Удалить FAQ, перевести `support.js` и якоря | **PASS** | `.faq` и `[data-faq]` удалены (`0` в DOM), битых якорей `#help-*` нет (`0`), `support.js` фильтрует `[data-topic-card]` и выводит локальную справку в `[data-topic-help]` без JS-ошибок. |
| **ODC-12** | Переработать `#plans` по `07-plans.png` (4 тарифа) | **PARTIAL** | Убраны eyebrow и календари, заголовок `Choose Your KUNI VPN Plan.`, левый арт `logo-shield.png` + checker, 4 тарифа (`1/7/15/55`, 5 устройств), светлые кнопки до выбора и оранжевое выделение после. **Дефекты D-01, D-04**: противоречие `€` и текста *«валюта пока не задана»* на одном экране + 4 одинаковые подписи `Your plan, your devices.` в `.plan-trust`. |
| **ODC-13** | Вынести `#login` на отдельную страницу `login.html` | **PASS** | `login.html` присутствует, формы входа на `index.html` нет, `odc-auth-footer.spec.js` проходит в 3 браузерах. |
| **ODC-14** | Заменить `Account · prototype` на `Account`, убрать `Project in development` | **PASS** | На всех 5 страницах в EN и RU запрещённые строки отсутствуют (`footerForbidden: false`), в футере `Account` / `Кабинет` и `© kuniVPN`. |
| **ODC-15** | Устранить обрезку изображения в `auth-art` | **PASS** | Сохранено и повторно подтверждено тестами `odc-auth-footer.spec.js` в 3 браузерах. |
| **ODC-16** | Продублировать все навигационные ссылки в footer | **PASS** | В футере присутствуют все ссылки header (`Features`, `Apps`, `Security`, `Support`, `Log in`, `Download`, `Plans`, `Help`, `Account`). |
| **ODC-17** | Реализовать крупную кнопку Home (`.button.large`) | **PASS** | `#home a.button.large`: `463×78 px`, `font-size: 30px`, 2 SVG-иконки (`download` + `chevron`), текст `Download KUNI VPN`, ссылка на `#apps`. |
| **ODC-18** | Привести CTA, заголовки, иконки ОС, `.everyday` и поиск (`01–05`) | **PASS (с мелким замечанием)** | Убраны лишние eyebrow в `#home`/`#support`, добавлены `///` и парные CTA в `#features`/`#security`, 5 иконок ОС в `platform-line`, `.everyday` с 2-строчными подписями и без геймпада, `.sr-only` label и лупа в `#support`. Мелкое замечание (**D-06**): в `#features .benefit-strip` сохранены заголовки `A more private web` / `Your devices` вместо `More Privacy` / `Use It on Your Devices`. |
| **ODC-19** | Довести `login.html`, `#checkout` и `account.html` (`06`, `08`, `09`, mobile) | **PARTIAL** | `login.html`: 2-ступенчатый H1 (`66.9/88.6px`), `lead`, 3 иконки в полях (mail/lock/eye), `.benefit-dark` снизу. `#checkout`: собственный блок со щитом (без `.auth-art`), чек-пункты, стрелка `→`, 3-элементный `.checkout-trust`. `account.html`: `My <em>Account</em>`, `Sign Out`, мета-блок подписки, видимые иконки вкладок на `320/390 px` и `.help-card` на `650 px`. **Дефекты D-01, D-06**: в `checkout-dialog.hbs` текст `Currency ... not specified` противоречит `€55` и дважды выводится `Payment integration pending.`; в `login-form.hbs` статический no-JS текст `{{t "New here?"}}` расходится с `data-i18n="Don't have an account?"`. |
| **ODC-20** | Палитра, WOFF2-шрифт, `.header >1920 px`, перекрытия артов | **PARTIAL** | Локальный `Montserrat` WOFF2 normal/italic загружен (`document.fonts`), внешних запросов `0`; `--bg: #050404`, `--surface: #0d0c0b`, `--accent: #fd8b16`; `.header` на `2560 px` во всю ширину (`0/2560`); перекрытий текста с артами `0`. **Дефект D-02**: `torn-top.png` и `torn-bottom.png` генерируются с устаревшим цветом `#f7f0e1` (`247,240,225`), не совпадающим с новым `--paper: #f5e8d4` (`245,232,212`). |
| **ODC-21** | Исправить `os-ios.png`, прозрачность `*-device.webp`, стор-бейджи | **PASS** | `os-ios.png` (`55×67`, `0.0%` обрезки по краям) — чистый знак Apple без фрагмента буквы `i`; все 5 `*-device.webp` имеют `hasAlpha=true` (`32.9–44.8%` прозр., `0–2.7%` кромки); у iOS/Android отдельные disabled `.store-badge`. |

---

## 3. Выявленные дефекты и нестыковки

| ID | Приоритет | Область / файлы | Факт и доказательство |
|---|---|---|---|
| **D-01** | **P2** | `pages/index.hbs`, `src/templates/partials/checkout-dialog.hbs`, `src/modules/support.js`, `docs/04-pages-and-components.md` (после коммита `e6dc66b`) | На карточках тарифов и в `#checkout` цены отображаются с евро (`€1`, `€7`, `€15`, `€55`), но прямо рядом на тех же экранах остались старые тексты: в `#plans .lead` — *«валюта пока не задана»* (*the currency has not been specified*), в `#plans aside.notice` — `стоит 7` без `€`, в `#checkout` — *«Currency and payment provider are not specified.»*, в `support.js` (`answers.billing`) — *«Валюта и часть условий пока не заданы»*, в `docs/04` — *«Валюта ... пока не заданы»*. Требуется решение владельца по `€` и синхронизация текстов/доков. |
| **D-02** | **P2** | `scripts/prepare-assets.js:66`, `src/styles/odc.scss:2` | `--paper` обновлён до `#f5e8d4` (`rgb(245,232,212)`), но `prepare-assets.js` по-прежнему заливает `torn-top.png` и `torn-bottom.png` цветом `rgb(247,240,225)` (`#f7f0e1`). Возникает цветовой шов на стыке `.benefit-strip` и рваных краёв. |
| **D-03** | **P2** | `scripts/prepare-assets.js:10`, `src/assets/images/mascot*.webp`, `build/prod/assets/images/` | После удаления `product-preview` (ODC-04) неиспользуемые `mascot.webp` и `mascot-small.webp` по-прежнему генерируются и попадают в production-сборку `build/prod/assets/images/`. |
| **D-04** | **P3** | `pages/index.hbs` (`.plan-trust`) | В 4-колоночной полосе доверия под `#plans` (`Fast & Reliable`, `Private & Secure`, `Multi-Device`, `Global Access`) во всех 4 колонках продублирован одинаковый текст `Your plan, your devices.`. |
| **D-05** | **P3** | `scripts/prepare-assets.js:40` (`home-art`) | `home-art` вырезается с `top: 70`, но сразу же `textBoxes['home-art']` содержит `[0,0,1192,24]`, очищающий строки `y=70..94` до прозрачности — верхние 24 px изображения пусты. |
| **D-06** | **P3** | `src/templates/partials/login-form.hbs`, `checkout-dialog.hbs`, `pages/index.hbs` | (1) В `login-form.hbs` статический no-JS текст `{{t "New here?"}}` не совпадает с `data-i18n="Don't have an account?"`. (2) В `checkout-dialog.hbs` строка `Payment integration pending.` выводится дважды (в `.plan-facts` и внизу диалога). (3) В `#features .benefit-strip` оставлены `A more private web` / `Your devices` вместо `More Privacy` / `Use It on Your Devices`. |

---

## 4. Блокеры и непроверенные пункты

### Блокеры (до решения владельца)
- **Статус валюты `€` (`e6dc66b`)**: требуется подтверждение владельца — оставлять ли евро `€` на тарифах (и тогда убрать противоречащие фразы *«валюта не задана»* из UI и `docs/04`) или вернуть нейтральные числа без валюты согласно прежнему `docs/04`.

### Непроверенные пункты и причины
1. **Визуальный осмотр растра человеком** (`docs/qa/odc-waves/index.html`, чистота контуров после `clearBacking` и полигональных масок `*-device.webp`, визуальное восприятие гарнитуры Montserrat и цветового стыка `torn-*.png`): в текущей инструментальной среде нет мультимодального просмотра изображений; проверка опиралась на `sharp`-форензику, OCR и live DOM/CSS-телеметрию.
2. **Физические устройства, нативный браузерный zoom и screen readers** (iOS Safari, Android Chrome, NVDA/VoiceOver): недоступны в локальной headless-среде Playwright.
3. **Удалённый CI / GitHub Pages** (коммиты `0a5ea35` и `16d89b8`): workflow проверен только по истории коммитов; запуск на GitHub Actions и публикация Pages не выполнялись по условиям задачи.
4. **Таймаут полного прогона WebKit**: весь сьют WebKit прошёл `19/19`, но потребовал разделения (`18/19` + `1/1`), так как на 3 воркерах полный прогон превышает 60-секундный лимит одной команды.
