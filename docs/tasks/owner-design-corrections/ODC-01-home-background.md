# ODC-01 — Фон #home на всю ширину

Статус: реализовано; проверено автоматическими сценариями и сравнительными снимками.
Источник: замечания владельца, `docs/images/consept/desktop/01-home.png`, [отчёт ресерча](../../qa/reference-html-research.md), [визуальный аудит](../../qa/deep-reference-review.md).

## Подтверждённая проблема

В `pages/index.hbs` секция имеет класс `.wrap` (`<section id="home" class="hero wrap">`), а `.wrap` ограничен `max-width: 1920px`. На viewport `2560 px` `#home` и его псевдоэлемент `#home::after` (рваная бумажная полоса `torn-top.png`) имеют ширину `1920 px` (`x=320`), оставляя по `320 px` пустого фона слева и справа, тогда как `.benefit-strip` занимает все `2560 px`.

## Правки для разработчика

1. **`pages/index.hbs`**: убрать класс `.wrap` с внешнего `<section id="home">`, перенести контейнер во внутреннюю обёртку (по аналогии с `#features > .hero.wrap` и `.benefit-strip`):
   ```hbs
   <section id="home" class="home-stage">
     <div class="hero wrap">
       <div class="hero-copy">...</div>
       <picture class="section-art">...</picture>
     </div>
   </section>
   ```
2. **`src/styles/base.scss`**:
   - Внешнему `#home` задать полноширинный фон, `position: relative; isolation: isolate;` и `width: 100%` (без `max-width`).
   - `#home::after` оставить на внешнем `#home` (`position: absolute; left: 0; right: 0; bottom: -1px;`), чтобы рваный край всегда шёл от левого до правого края viewport.
   - Проверить `#home .hero` (`min-height`, `padding-block`, `.section-art` привязка к контейнеру или правой границе в рамках ODC-03 и ODC-20), сохранив `id="home"` на внешнем `<section>` для якорей и `IntersectionObserver` в `src/modules/main.js`.

## Критерии приёмки

- На `2560 px`, `1920 px`, `1672 px`, `1440 px`, `768 px`, `390 px`, `320 px` фон `#home` и `#home::after` доходят до обоих краёв viewport (`x=0`, `width === window.innerWidth`).
- Текстовый контент `.hero-copy` сохраняет контейнер `.wrap` и отступы.
- Горизонтальный скролл отсутствует (`scrollWidth === innerWidth`) в EN и RU; якорь `#home` и подсветка навигации работают.

## Проверка

`npm run build:prod`, `npm run check:build`, Playwright (включая замер `#home::after` при `2560 px` и `320 px`), снимки до/после.

## Результат внедрения

См. [отчёт четырёх волн](../../qa/odc-waves.md) и [финальную галерею](../../qa/odc-waves/index.html). Ограничения сведённых PNG и принятые адаптации явно описаны в отчёте; pixel-perfect совпадение не заявляется.
