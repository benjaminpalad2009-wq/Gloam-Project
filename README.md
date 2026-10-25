# Gloam

A silhouette puzzle-platformer in the spirit of Limbo. No text, no tutorials, no hints: the world teaches you by killing you.

This build ships **10 levels**. The level generator (`game-src/04-levels.js`) already supports 100; raise `TOTAL` in `game-src/01-core.js` and extend the tables at the top of that file to open more.

| Levels | Setting | Introduces |
|---|---|---|
| 1 | Forest | pits, spikes |
| 2 | Forest | bear traps |
| 3 | Forest | crate and pressure-plate puzzle (push or pull crates with Grab) |
| 4 | Cave | crawlers |
| 5 | Cave | lever and timed bridge |
| 6 | Cave | spiders |
| 7 | Machine works | saws, moving platforms |
| 8 | Machine works | bats, falling stalactites |
| 9 | Machine works | worms, collapsing floors |
| 10 | Abyss | the giant spider chase |

Controls: arrows / A D (or a gamepad) to move, Space or W to jump, E or Shift to grab (levers, crates), Esc to pause.
On a phone there are no buttons, like Limbo: touch the left half and drag left or right to walk, drag down to grab or interact (levers, crates), and touch the right half to jump. Walk into a tall box (or reach one mid-jump) and he hauls himself up.

Feel: the boy takes a few steps to get going, slides a little when he stops, barely steers in the air, staggers after a hard landing, and dies from a long fall. Death is a physical ragdoll. Grass is made of springs: it bends around anything that walks through it and ripples with gusts of wind that roll across the level, while trees sway and leaves blow past. The jump is a fixed-height, heavy arc like Limbo's. Levels include hills and mountains you walk over and low cave tunnels.

## Get an APK with GitHub (no Android Studio needed)

1. Create an empty repository on GitHub.
2. In this folder:
   ```
   git init
   git add .
   git commit -m "Gloam"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
   git push -u origin main
   ```
3. Open the **Actions** tab. **Build Android APK** starts by itself (about 10 to 15 minutes the first time).
4. Open the finished run and download the **gloam-apk** artifact. Unzip it to get `gloam.apk`.
5. Copy it to your phone and open it. Android will ask you to allow installs from that source.

To publish a downloadable release, push a tag: `git tag v1.0.0 && git push --tags`. The APK is attached to the release.

The APK is signed with the standard Expo debug key, which is fine for sideloading but not accepted by the Play Store. For Play, add your own keystore.

## How it fits together

- `game-src/` holds the game (HTML canvas, plain JavaScript). `scripts/build-game.js` bundles it into `game/gameHtml.js`.
- `App.js` is the React Native (Expo) shell. It hosts the game in a WebView, locks landscape, hides the system bars, keeps the screen awake, maps the Android back button to the pause menu, pauses when the app goes to the background and stores progress with AsyncStorage.
- `.github/workflows/build-apk.yml` runs `expo prebuild` and Gradle on GitHub's servers.

## Run it locally

```
npm install
npx expo install --fix
npm run android      # needs Android Studio / an emulator or a USB phone
```

To play in a browser instead, open `dist/gloam.html` after `npm run build:game`.

## Story
A boy follows his little sister Wren, who walked into the gloam carrying the family lamp, to the great lamp that she means to relight. The ten levels are hand-authored chapters rather than random pieces: `LEVEL_SCRIPT` in `game-src/07-story.js` lists, in order, what each chapter contains (its set piece, the one new danger it teaches, and the whispers that tell the story as you pass them). Each level opens with a line of text, lamps mark the checkpoints, her belongings lie along the way, her lantern glows far ahead and she runs from you, and the last level ends at the great lamp with a short epilogue. Edit the text and the order freely; the beats themselves live in `game-src/04-levels.js`.

Walls: some paths are blocked by a stone wall. Stand at the winch post beside it and hold grab (swipe down on the left half and keep your finger there) to haul the wall up on its rope; it slips back slowly if you let go.

First launch: a short story intro (`INTRO_PAGES`), then a How to play page, then level 1, where small prompts (`TIPS`) show walk, jump, grab, the rope and the lever the first time they matter and never again. The title screen has a How to play button. All of it lives in `game-src/08-tutorial.js`.

First launch opens on the story intro, then the controls page, then level 1. After that the game opens on the title. The controls page can be opened again from the pause menu (the controller button).

## One set piece per level
1 The Great Hill (four ledges up, long walk down) · 2 Crate + pressure plate + gate · 3 Rope-hauled stone wall · 4 The sleeping centipede: haul the rope, the boulder rolls down and crushes it · 5 The raised bridge (lever) and spider · 6 A rotten rope bridge that falls apart under you · 7 Saw gauntlet, a conveyor belt dragging you back, and bricks hung on a frayed rope · 8 Hanging teeth (stalactites, worms, bats) · 9 The boulder run · 10 The stalker chase.

Spikes have pale outlined points so they read against the dark ground. The bear trap is a heavy iron object: push it by walking into it or grab and drag it; landing on it snaps it shut. It also weighs down pressure plates.
