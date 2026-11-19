# MaxFit design system (round 5, 2026-11-18)

Boss R's rule (2026-11-18): all MaxFit design work uses **taste-skill** and **impeccable**. Those skills
are not installed in cloud sessions yet, so this round followed their published guidance read from source
(pbakaus/impeccable v4.10.0: Operate mode + craft floor; Leonxlnx/taste-skill 2.5.1: system and checklist
rules that apply to an app). This file is the result: follow it on every screen.

## Mode and use scene
- **Operate mode** (impeccable): the user is in a task, one-handed, mid-set, sweaty, in a gym or at home.
  The app must read as a calm, trustworthy workout tool first. Familiar controls, no costume.
- **Dark**, chosen from the use scene (often a dim gym or evening at home; the screen sits on the floor
  during a plank). Orange accent kept.
- **Signature move:** the bronze reward card (laurel, Cinzel) when something unlocks. It is the one
  authored moment. Everything else is restraint.

## Tokens (src/styles.css `:root`)
| Token | Use |
|---|---|
| `--bg` #0d0f13 | app ground |
| `--surface` #15181e | panels, grouped lists, sheets |
| `--raised` #1e222a, `--raised-2` | controls, pressed rows, inputs |
| `--line`, `--line-strong` | hairlines between rows; control borders |
| `--text`, `--text-2`, `--text-3` | primary, secondary (≥7:1), tertiary (≥4.5:1) |
| `--accent` #ff7a1a | primary action, current selection, "Beat this". Never decoration |
| `--gold` | records / PR only |
| `--good`, `--bad`, `--rest` | success, danger / over limit, rest state |
| `--fs-xs … --fs-2xl` | 12, 14, 16, 19, 23, 28 px (fixed rem scale, ~1.2 steps) |
| `--s1 … --s6` | 4, 8, 12, 16, 24, 32 px |
| `--r-sm/--r/--r-lg` | 10 / 14 / 18 px |
| `--t-fast/--t` | 150 / 220 ms; `--ease-out` |

## Patterns
- **Screen:** `<div className="stack screen">` → `.screen-head` (h1 + at most one action) → `.group`s.
  Groups are 24 px apart; a group = `.group-head` (h2 + optional quiet action) + content.
- **Grouped list, not cards:** rows live in one `.list` panel separated by hairlines (`.row-item`,
  min 60 px, icon tile + `.meta` (b + `.sub`) + trailing value/chevron). Never a card inside a card
  (the CSS flattens nested `.card`s anyway).
- **No eyebrows:** never a small all-caps label above a heading. `.tiny` is a field label only.
- **Icons:** Lucide only, through `src/components/Icon.tsx` (`Ico`, `ExIcon`, `PlaceIcon`). No emoji
  as icons. Emoji may stay inside user-facing *celebration copy* only when they carry tone, never as UI.
- **Buttons:** one family. `.btn.primary` = the one main action of a group (orange). `.btn.secondary`
  (= `.ghost`) for the rest. `.btn.quiet` for text actions in a group head. `.btn.danger` for delete.
  `.btn.big` (56 px) for the main action of a screen. Touch targets ≥ 44 px, primary ≥ 48 px.
- **Choices:** `.chips` (horizontal, scrollable) for filters; `.seg` for 2–3 equal options.
- **Numbers:** tabular (`.num`). The number to beat is the biggest thing on an exercise card.
- **States:** every list has an empty state that teaches the next step; disabled = 42% opacity;
  pressed = scale .98 or a raised background.
- **Motion:** state only, 150–250 ms, ease-out. No staggered entrance on every section, no scroll
  reveals. Reduced motion: everything rests and stays visible.
- **Overlays:** bottom `.sheet` for short tasks (confirm, configure one exercise); full `.page`
  (`.page-head` / `.page-body` / `.page-foot`) for long tasks (the plan editor).
- **Copy:** "exercises", never "moves" (Boss R). Buttons say verb + object ("Start", "Add to plan").
