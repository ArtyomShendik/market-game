# Night Market

Клиентский слот 5×3. SDK: `src/sdk`. Тема: `src/game`. Node.js ≥ 22.

| Команда             | Результат                                   |
| ------------------- | ------------------------------------------- |
| `npm install`       | зависимости                                 |
| `npm run dev`       | Vite, `http://localhost:5173`, `strictPort` |
| `npm run build`     | `tsc --noEmit` + `dist`                     |
| `npm run preview`   | `http://localhost:4173`, `strictPort`       |
| `npm run lint`      | ESLint                                      |
| `npm run format`    | Prettier                                    |
| Husky + lint-staged | ESLint/Prettier только по изменённым файлам |

Тексты UI: `src/game/config/text.ts`. SDK тему не знает.

## Правила Night Market

Ставки: 10, 20, 50, 100, 200. Старт: баланс 1000. Скорость: `>` ≈ 3 с, `>|` ≈ 2 с, `>||` ≈ 1 с. Автоигра: пока `balance >= bet` или пока не выключить. Фон вкладки: `app.pause()` + `audio.setMuted(true)`.

Пять линий LTR: середина, верх, низ, галка вниз, галка вверх. Выигрыш — один символ с барабана 0, минимум 3 подряд. Манго — wild; линия целиком из манго тоже платит.

Множители ставки за 3 / 4 / 5: слива 1/2/5, лимон 1/3/8, апельсин 2/4/10, вишня 2/5/15, виноград 3/8/20, арбуз 5/12/30, ананас 8/20/50, манго 10/25/60.

Экраны: preload (`emblem.jpg`) → loadPhase `game` + аудио + `session()` → «НАЧАТЬ ИГРАТЬ» (`audio.unlock()` синхронно в том же клике) → слот.

---

## Дерево

```
src/main.ts                 NightMarketGame.launch()
src/sdk                     ядро; не импортирует src/game
  app     GameApp, VisibilityWatcher
  assets  AssetCache, AssetManager
  audio   AudioManager
  reels   Reel, SlotMachine, WinHighlight
  ui      SpinButton, IconButton, BetStepper, StatReadout, LoadingScreen
  utils   wait, ease, positiveMod, travelToIndex
  index.ts
src/game                    тема Night Market
  NightMarketGame.ts        composition root
  config                    theme, text, assetManifest, speedModes
  api                       mock + парсеры
  rules                     paytable, линии, evaluateGrid
  symbols                   catalog, SymbolCell, SymbolFactory
  view                      ReelField, SlotHud, decor, safeArea
  screens                   StartScreen, SlotScreen
  play                      SlotController
  assets                    jpg/svg/wav + symbols.png/json
```

Классы: состояние и жизненный цикл. Функции: `evaluateGrid`, `parseSession`, `parseSpinResult`, `placeRow`, `rowWidth`, `formatCoins`, `toHighlightLine`, `fallbackGrid`, `reelStripFor`.

---

## SDK

### GameApp

Pixi `Application`, `resizeTo: window`. Letterbox нет.

| Метод                    | Поведение                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `create({ background })` | init, canvas в `document.body`                                   |
| `size`                   | `{ width, height }` из `app.screen`                              |
| `onResize(handler)`      | сразу + resize/поворот; `visualViewport.resize` → `app.resize()` |
| `add` / `remove`         | `remove` уничтожает детей                                        |
| `pause` / `resume`       | стоп/старт тикера                                                |
| `ticker`, `renderer`     | `update(dt)`, `generateTexture`                                  |

### VisibilityWatcher

`document.visibilitychange`. `watch(handler)` → `true`, когда вкладка видима.

### AssetCache

Порядок: `Map` сессии → Cache Storage (`caches.open(name)`) → `fetch`. Один URL — один промис. Имя `…-vN`: при смене версии удаляются кеши с тем же префиксом.

В `Assets.load` уходит `blob:` URL. Парсер явный: `loadTextures` или `loadSVG`.

### AssetManager

`AssetPhase`: `'preload' | 'game'`. Конструктор: `(manifest, cache)`.

1. `initialize()` → `Assets.init({ manifest })`.
2. `loadPhase(phase, onProgress)`: байты → blob → `Assets.load` → `Map` по alias.
3. `get<T>(alias)` бросает, если фаза не грузилась.

Повторный `loadPhase` той же фазы: `onProgress(1)` и выход.

### AudioManager

Web Audio (`AudioContext` / `webkitAudioContext`). WAV через `AssetCache`. `decodeAudioData` на копии `ArrayBuffer`.

| Метод       | Правило                                                           |
| ----------- | ----------------------------------------------------------------- |
| `unlock()`  | синхронно из жеста; `resume()` без `await`; короткий пустой буфер |
| `playOnce`  | один шот                                                          |
| `playLoop`  | петля (барабаны)                                                  |
| `playMusic` | музыка                                                            |
| `setMuted`  | `suspend()`; часы контекста стоят                                 |

### Reel

`strip: string[]`, `textures: Map<id, Texture>`. Спрайтов: `rows + 2`. Текстура и `y` переиспользуются.

Позиция: `spin` (символов вниз). Фазы: `idle` → `accelerating` → `spinning` → `stopping` → `braking` → `idle`.

`stopWith(visible)` пишет 3 id в ленту впереди окна. `stopAt(index)` сажает окно на индекс.

### SlotMachine

| Метод                                          | Контракт                                                  |
| ---------------------------------------------- | --------------------------------------------------------- |
| `start(): Promise<void>`                       | разгон всех; промис после полной остановки                |
| `land(grid)`                                   | один раз в фазе `spinning`; `grid[reel][row сверху вниз]` |
| `update(dt)`                                   | каждый кадр; `dt` режется до 50 мс                        |
| `setTiming({ spinDuration, stopDelay, reel })` | первый стоп в `spinDuration`, дальше шаг `stopDelay`      |

### WinHighlight

`show([{ positions: [{ reel, row }], label }])`. Цикл линий по 1.6 с. Подпись рисует `ReelField.caption`.

### UI

`pointertap`. `view.position` — центр. `onPress` передаётся снаружи.

| Класс         | API                                                  |
| ------------- | ---------------------------------------------------- |
| SpinButton    | текст, `onPress`                                     |
| IconButton    | иконка, `setIcon`, `setActive`, опциональная подпись |
| BetStepper    | − / +                                                |
| StatReadout   | подпись + число                                      |
| LoadingScreen | эмблема, заголовок, бар, %, `layout`                 |

---

## Night Market

### NightMarketGame.run()

1. `assets.initialize()`, `loadPhase('preload')`.
2. Лоадер. Параллельно: `loadPhase('game')`, `audio.load(GAME_AUDIO)`, `api.session()`, минимум 0.65 с. Прогресс: 80% картинки, 20% звук.
3. Старт. В `onStart`: `unlock` + клик + музыка, затем снять экран.
4. `SymbolFactory.create` → `SlotScreen` + `SlotController`. Тикер: `screen.update(dt)`.

`onResize` → текущий экран `.layout`. Ссылку обнулить до `app.remove`.

DI: `new AssetCache()` — сборка. `new AssetManager(manifest, cache)`, `new AudioManager(cache)`, `new SlotController({ screen, api, audio, session })` — внедрение.

### SPIN

```
SpinButton.pointertap
  → SlotHud.callbacks.onSpin
    → SlotController.spin()
        unlock + клик + playLoop(reel)
        busy = true, win = 0, hud.render
        settled = field.spin()          SlotMachine.start()
        result = await api.spin(bet)
        field.land(result.grid)
        await settled
        field.showWins(lines)
        finally: stop loop, busy = false, hud.render
```

Пока крутится: баланс `result.balance - result.win`. После: `result.balance` и линии из ответа. Клиент выплату не считает.

`insufficient_funds` / throw: `land(fallbackGrid())` (сливы), дождаться `settled`.

### SlotHud

Панель: баланс, ставка, скорость, SPIN, авто, выигрыш. `hud.render(SlotHudState)`. Колбэки: `onSpin`, `onBet`, `onSpeed`, `onAuto`. Ряды HUD: 1 / 2 / 3 по ширине.

### ReelField

5× `Reel` + `SlotMachine` + рамка + `WinHighlight`. API: `spin`, `land`, `showWins`, `clearWins`, `setTiming`, `update`, `setCaptionSize(screenPx, fieldScale)`. Подпись: 22 px, если ширина < 700 — 28 px.

### Символы

| Файл                          | Роль                                          |
| ----------------------------- | --------------------------------------------- |
| `symbols/catalog.ts`          | id, имя из `TEXT`, цвет рамки, `frame`        |
| `assets/symbols/symbols.png`  | атлас                                         |
| `assets/symbols/symbols.json` | кадры (`cherry.png`, …)                       |
| `SymbolCell`                  | cover + маска + рамка                         |
| `SymbolFactory`               | `Spritesheet.parseSync()` + `generateTexture` |

Барабан получает `Map<id, Texture>`.

### Ассеты

| Путь           | Файлы                                              |
| -------------- | -------------------------------------------------- |
| `preload/`     | emblem.jpg                                         |
| `backgrounds/` | night-market.jpg                                   |
| `icons/`       | auto.svg, speed.svg, speed-bar.svg, speed-bars.svg |
| `symbols/`     | symbols.png, symbols.json                          |
| `audio/`       | music.wav, reel-spin.wav, spin-click.wav           |

Pixi-манифест: бандлы `preload`, `game`. Звук: `GAME_AUDIO`, не в манифесте. Кеш: `ASSET_CACHE_NAME` = `night-market-assets-v3`. Смена файлов → поднять `-vN`.

Vite: `base: './'`, `assetsInlineLimit: 0`, Pixi-чанк `pixi`, имена `assets/[name]-[hash]…`, `target: es2022`, `sourcemap: false`, `modulePreload.polyfill: false`.

Layout: сцена = экран; масштабируется поле; HUD целиком может уменьшиться; `env(safe-area-inset-*)`; заголовок: уменьшить tracking, затем scale.

---

## Контракт любой игры на SDK

### Барабаны

```ts
new Reel({ strip, rows, symbolWidth, symbolHeight, textures });
new SlotMachine({ reels, rows, timing });
```

- каждый id из `strip` есть в `textures`;
- `reels.length` = число барабанов;
- `start()` → крутить; промис — полная остановка;
- `land(grid)` ровно один раз в `spinning`; `grid.length === reels.length`, `grid[i].length === rows`;
- каждый кадр `update(dt)`;
- результат пишет игра через `land`, SDK его не выбирает.

### Подсветка

```ts
highlight.show([
  {
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
    ],
    label: TEXT.winLine(/* … */),
  },
]);
```

`reel` / `row` с нуля. `label` готовит игра.

### Ассеты и звук

Фазы только `'preload'` и `'game'`. Алиасы любые. `AudioManager.load({ alias, src }[])`.

`audio.unlock()` в обработчике клика «начать», без `await` до первого `playOnce` / `playMusic`.

### API

```ts
session(): Promise<{ balance: number; bets: number[]; bet: number }>;

spin(bet: number): Promise<
  | { ok: true; balance: number; bet: number; win: number; grid: string[][]; lines: SpinWin[] }
  | { ok: false; error: 'insufficient_funds'; balance: number }
>;
```

`SpinWin`: `{ symbol, count, amount, rows }`. `rows.length === число барабанов`. Парсер отвергает чужой размер сетки и неизвестный id.

### Тикер

Пока слот на сцене: `app.ticker.add((t) => screen.update(t.deltaMS / 1000))`. Иначе `start()` не завершится.

---

## Новая игра на SDK

`src/sdk` не менять. Тема — отдельный каталог. Точка входа — `src/main.ts`.

Пример: **Star Fruit**, каталог `src/games/star-fruit/`.

### 1. Файлы

```
src/games/star-fruit/
  StarFruitGame.ts
  config/
    assetManifest.ts      ASSET_ALIAS, ASSET_MANIFEST, GAME_AUDIO, ASSET_CACHE_NAME
    theme.ts              REEL_WINDOW, LAYOUT, THEME
    text.ts
    palette.ts
    speedModes.ts         SlotTiming[]
  assets/
    preload/
    backgrounds/
    icons/
    symbols/              atlas.png + atlas.json
    audio/
  api/
    types.ts
    parseResponse.ts
    StarFruitApi.ts
  rules/
    paytable.ts
    evaluateGrid.ts
  symbols/
    catalog.ts
    SymbolCell.ts
    SymbolFactory.ts
  view/
    ReelField.ts
    SlotHud.ts
    decor.ts
    safeArea.ts
    layout.ts
  screens/
    StartScreen.ts
    SlotScreen.ts
  play/
    SlotController.ts
  utils/
    formatCoins.ts
    toHighlightLine.ts
    fallbackGrid.ts
    reelStripFor.ts
    placeRows.ts
    rowWidth.ts
```

Night Market копировать как шаблон файлов, SDK не копировать.

### 2. `src/main.ts`

```ts
import { StarFruitGame } from './games/star-fruit/StarFruitGame';
import { TEXT } from './games/star-fruit/config/text';
import './style.css';

void StarFruitGame.launch().catch((error: unknown) => {
  console.error(error);
  document.body.textContent = TEXT.launchError;
});
```

Одна игра на билд. Выбор темы — отдельный экран до `launch()`.

### 3. Манифест

```ts
export const ASSET_CACHE_NAME = 'star-fruit-assets-v1';

export const ASSET_ALIAS = {
  loaderEmblem: 'sf-emblem',
  background: 'sf-background',
  symbols: 'sf-symbols',
  icon: {
    speed: 'sf-speed',
    speedBar: 'sf-speed-bar',
    speedBars: 'sf-speed-bars',
    auto: 'sf-auto',
  },
  audio: { music: 'sf-music', reelSpin: 'sf-reel', spinClick: 'sf-click' },
} as const;

export const ASSET_MANIFEST: AssetsManifest = {
  bundles: [
    { name: 'preload', assets: [{ alias: ASSET_ALIAS.loaderEmblem, src: emblem }] },
    {
      name: 'game',
      assets: [
        { alias: ASSET_ALIAS.background, src: background },
        { alias: ASSET_ALIAS.symbols, src: atlasPng },
        { alias: ASSET_ALIAS.icon.speed, src: speed },
        { alias: ASSET_ALIAS.icon.speedBar, src: speedBar },
        { alias: ASSET_ALIAS.icon.speedBars, src: speedBars },
        { alias: ASSET_ALIAS.icon.auto, src: auto },
      ],
    },
  ],
};
```

`ASSET_CACHE_NAME` уникален. SVG: парсер `loadSVG` по расширению исходного URL. JSON атласа — import Vite. PNG атласа — `AssetManager`.

### 4. Символы и поле

Id в `strip`, `grid` и ключах `Map` — одна строка.

```ts
export const SYMBOL = { STAR: 'star', LEAF: 'leaf' } as const;

export const symbols = [
  { id: SYMBOL.STAR, name: TEXT.symbol.star, color: 0xffd36a, frame: 'star.png' },
];
```

`SymbolFactory.create(width, height)`:

1. `assets.get<Texture>(ASSET_ALIAS.symbols)`
2. `new Spritesheet(atlas, atlasJson).parseSync()`
3. для каждого id: `SymbolCell` → `renderer.generateTexture`
4. `Map<id, Texture>`

Без атласа: отдельные png в манифесте, `assets.get(symbol.asset)`.

`REEL_WINDOW`: `count`, `rows`, `symbolWidth`, `symbolHeight`, `gap`.

| Поле | `count` | `rows` | `Reel[]` | `grid` |
| ---- | ------- | ------ | -------- | ------ |
| 5×3  | 5       | 3      | 5        | 5×3    |
| 3×3  | 3       | 3      | 3        | 3×3    |
| 6×4  | 6       | 4      | 6        | 6×4    |

`reelStripFor(i).length > rows`. Иначе `stopWith` некуда писать.

### 5. Правила

`paylines`, `paytable`, `evaluateGrid(grid, bet): SpinWin[]`. SDK не вызывает. Mock может вызывать. Живой бэкенд считает у себя.

Wild / scatter / фриспины — только в теме. `Reel` знает только id → текстура.

### 6. API

Методы: `session()`, `spin(bet)`. Реализация: `fetch` или mock (`stringify` → `parse` → `parseSpinResult`).

Парсер отклоняет:

- пустой `bets` или `bet` вне списка;
- сетку не `count × rows`;
- id вне `symbolIds`;
- линию: `rows.length !== count`, ряд вне `0..rows-1`, `count` не целое в `3…count`.

Касса: `{ error: 'insufficient_funds', balance }` → `{ ok: false, … }`.

### 7. SlotController.spin()

1. `if (busy || balance < bet) return`
2. `audio.unlock()`; клик; `playLoop(reel)`
3. `busy = true`; win = 0; `hud.render`
4. `const settled = screen.field.spin()`
5. `const result = await api.spin(bet)`
6. ok: баланс без выигрыша; `land(result.grid)`; `await settled`; итоговый баланс; `showWins(result.lines.map(toHighlightLine))`
7. fail / throw: `land(fallbackGrid())`; `await settled` если ещё крутится
8. `finally`: стоп петли; `busy = false`; `hud.render`

Скорость: индекс в `speedModes` → `field.setTiming(mode.timing)` → `speedIndex` + `setIcon`. Подписи секунд нет.

Авто: `while (auto && balance >= bet) { await spin(); await wait(win ? 0.9 : 0.35) }`.

### 8. Экраны

`StartScreen.onStart`: `unlock` + музыка **до** любого `await`.

`SlotScreen.layout(size)`: safe area → HUD → масштаб поля в остаток → `setCaptionSize`. Спина в экране нет.

Колбэки HUD задаёт composition root:

```ts
callbacks: {
  onSpin: () => void controller.spin(),
  onAuto: () => controller.toggleAuto(),
  onSpeed: () => controller.cycleSpeed(),
  onBet: (direction) => controller.changeBet(direction),
}
```

Порядок: создать `SlotScreen` (колбэки замыкают `controller`) → сразу `new SlotController({ screen, … })`. Вызов колбэка — после конструктора.

### 9. StarFruitGame.launch()

1. `GameApp.create({ background: THEME.background })`
2. `AssetCache(ASSET_CACHE_NAME)`, `AssetManager(ASSET_MANIFEST, cache)`, `AudioManager(cache)`, API, `VisibilityWatcher`
3. `onResize` → `loader | start | slot`.layout
4. `visibility.watch` → `pause`/`resume` + `setMuted`
5. preload → лоадер + game/audio/session → старт → слот
6. `SymbolFactory(renderer, assets).create(symbolWidth, symbolHeight)`
7. `ticker.add` → `slotScreen.update`

Минимум лоадера: 0.65 с (как в Night Market) или своё число.

### 10. Тексты и layout

Все строки — `TEXT`. Виджеты получают строки аргументами. Safe area: как `src/game/view/safeArea.ts`. Заголовок: fit по ширине. Подпись линии: экранные пиксели / `fieldScale`.

### 11. Проверка

- `src/sdk` без импортов из `src/game` и `src/games`
- `npx tsc --noEmit`, `npm run build`
- клик SPIN → барабаны сразу → `land(grid)` из ответа → эстафета стопов → `showWins`
- `insufficient_funds` и throw сети останавливают ленту
- жест «начать» включает звук на iOS
- поворот / узкий экран: HUD читаемый, заголовок не обрезан
- после замены файлов с тем же URL — новый `ASSET_CACHE_NAME`

Запрещено в SDK: имена символов, paytable, тексты темы, `Assets.load` исходного URL в обход `AssetCache`, `await unlock()` до первого звука в жесте, остановка без `land(grid)`, спин без `update(dt)`.

---

## Стек

| Слой    | Факт                                                       |
| ------- | ---------------------------------------------------------- |
| Рантайм | `pixi.js` ^8                                               |
| Сборка  | Vite 8, `vite.config.ts`                                   |
| Типы    | `tsc` 7 (`@typescript/native`); TypeScript 6 — ESLint      |
| Линт    | ESLint 10 flat, typescript-eslint type-aware, `curly: all` |
| Формат  | Prettier; `*.svg` → parser `html` в `.prettierrc.json`     |
| Хуки    | Husky + lint-staged                                        |

Mock: `MockSlotApi`, задержка спина 0.2 с. Боевой бэкенд: те же `session()` / `spin()` и парсеры.
