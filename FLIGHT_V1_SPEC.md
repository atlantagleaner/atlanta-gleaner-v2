# Flight V1 Spec

This document locks the intended V1 behavior for the Saturn flight module.

## Core Fantasy

- Start at Saturn on every run.
- Face inward toward the inner solar system.
- Let the player drift, accelerate, reverse, warp, and explore.
- Keep the experience open-ended, visual, and atmospheric.
- Treat collisions as the only hard fail state.

## Controls

- Mobile-first layout.
- Left thumb joystick controls yaw and pitch.
- Right-side action stack:
  - `THRUST`
  - `REVERSE`
  - `WARP`
- `THRUST` is warm gold/orange.
- `REVERSE` uses a cool blue glow.
- `WARP` uses a brighter cyan pulse.
- Desktop fallback:
  - arrows or `WASD` to steer
  - `SPACE` for thrust
  - `SHIFT` for reverse
  - `E` for warp

## Flight Model

- Translation follows Newtonian-style inertia.
- Releasing thrust does not stop the ship.
- Reverse thrust slows the ship and can pull it into slower backward drift.
- Warp can engage anywhere as long as the ship is already moving.
- Rotational control stays simplified enough to feel accessible on mobile.

## Camera

- Default camera is third-person chase view.
- Cockpit view is a later enhancement, not a V1 blocker.

## HUD

- Keep the HUD minimal and persistent.
- Show:
  - current speed
  - nearest body
  - distance from Earth
- No maps.
- Destination or guidance logic should come from the companion dialogue, not navigation UI.

## Companion

- Former U.S. Marine Corps machine with a grizzled veteran presence.
- Dry and restrained, but no jokes and no mechanics coaching.
- Built for maximum utility first, but deliberately engineered to steady emotional humans.
- Zero ego. Absolute duty. Serves as an emotional anchor when the player gets overwhelmed.
- Speaks rarely and sparingly, more like the vacuum than a conventional game companion.
- Provides regional solar-system factoids near major bodies and advanced astrophysics during deep-space transit.
- Text plus avatar.
- Dialogue should trigger on entering major regions, not as constant ambient chatter.
- Planets and their associated moons should be grouped into shared regions for dialogue purposes.
- Fact pools should exhaust before repeating.
- The companion should not warn the player about danger, explain controls, or comment on crashes.

## World Rules

- Solar system spacing is compressed and tuned for fun, not realism.
- The player can return to the solar system after entering procedural space.
- Approaching bodies should visibly intensify lighting, scale, and atmosphere.
- Procedural deep space should emerge gradually after the handcrafted solar system.

## Failure State

- Colliding with planets, rings, or the sun triggers a short cinematic crash.
- After the crash moment, reset back to Saturn.

## Priority

1. Stable and lightweight on mobile.
2. Controls feel intuitive immediately.
3. Motion still preserves real momentum.
4. Visuals reward exploration.
