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
- Dry, deadpan, and lightly sarcastic without ever sounding cruel or smug.
- Built for maximum utility first, but deliberately engineered to steady emotional humans.
- Zero ego. Absolute duty. Serves as an emotional anchor when the player gets overwhelmed.
- Speaks like someone who has seen danger before and does not need to raise his voice to control the room.
- Provides practical flight guidance, atmospheric worldbuilding, and memorable scientific observations.
- Delivers both solar-system facts and advanced astrophysics in plain, human-ready language.
- Text plus avatar.
- Dialogue appears automatically at key moments, then disappears.
- Dialogue categories should include arrival, flight guidance, dry humor, awe science, deep-space physics, frontier reconnaissance, impact warning, and crash recovery.
- Humor should build rapport and lower tension, not turn the companion into a mascot.
- Reset after a crash should feel controlled, unsentimental, and lightly wry rather than chatty.

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
