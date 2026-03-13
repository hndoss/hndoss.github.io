---
layout: post
title: "Firefox Crashes When Your Monitor Wakes on KDE Wayland"
description: "If Firefox dies every time you step away and come back, the problem is probably not Firefox. It's libddcutil treating your sleeping monitor as a disconnected display."
date: 2026-03-12 00:00:00
category: linux
tags:
  - wayland
  - kde
  - firefox
  - debugging
author: hector
paginate: true
---

## The fix

If you're running Firefox on KDE Plasma Wayland and it crashes every time your monitor wakes from sleep, add this to `~/.config/environment.d/ddcutil.conf`:

```
DDCUTIL_WATCH_MODE=none
```

Log out and back in. That's it.

This stops libddcutil from monitoring display connections, which is what triggers the crash. You keep DDC brightness control, and there's zero impact on power management or DPMS.

## The symptom

I'd step away from my desk for a few minutes. Monitor goes to sleep. I come back, move the mouse, monitor wakes up, and Firefox is gone. No error dialog, no crash reporter, just gone.

It happened every single time. Not a random crash, not a memory issue. Predictable. Step away, come back, Firefox is dead.

The exit code was 11, which is SIGSEGV. A segfault. The crash reporter itself was also crashing, which made it look worse than it was.

## Finding the trigger

The journal told the whole story. I filtered out the noise and found a three second cascade starting right when the monitor woke up:

```
15:58:57  powerdevil    DDCA_EVENT_DISPLAY_DISCONNECTED, card1-DP-1
15:58:58  kded6         The Wayland connection experienced a fatal error: Invalid argument
15:58:58  powerdevil    DDCA_EVENT_DISPLAY_CONNECTED, card1-DP-1
15:59:00  firefox       ExceptionHandler::GenerateDump
15:59:01  firefox       Exiting due to channel error.
```

The monitor didn't actually disconnect. It went to DPMS sleep mode. But libddcutil, which KDE's PowerDevil uses for DDC/CI brightness control over the display cable, interpreted the sleeping monitor as a physical disconnection. When the monitor woke up a second later, it fired a reconnection event.

That disconnect/reconnect in quick succession is what killed Firefox.

## Why a fake disconnect crashes Firefox

On X11, the display server owns all rendering surfaces. If a monitor disappears, the X server remaps windows to remaining outputs. Clients never know anything happened.

Wayland works differently. Clients directly own their buffers and are bound to specific `wl_output` objects. When a display connects or disconnects, clients get told about it and are expected to handle the change gracefully.

When libddcutil reported the display as disconnected, KWin destroyed the `wl_output` for DP-1. One second later, it created a new one for the "reconnected" display. During that window, Firefox was holding references to the destroyed output object. When it tried to use that stale reference, it dereferenced invalid memory and segfaulted.

Firefox wasn't the only casualty. `kded6` crashed at the same moment with "The Wayland connection experienced a fatal error: Invalid argument." Same root cause, different symptom. kded6 got an error code back, Firefox got a segfault.

## What the fix does

`DDCUTIL_WATCH_MODE=none` disables libddcutil's display watching thread. This is the thread that monitors the DDC/CI bus for connection changes via udev events. When it's off, libddcutil stops interpreting DPMS sleep as a disconnect.

Everything else keeps working. KWin still handles DPMS directly. Your monitor still sleeps and wakes. PowerDevil still manages power profiles. If you use the KDE brightness slider for external monitors over DDC, that still works too. The only thing that stops is the continuous polling for display connect/disconnect events, which is the thing that was triggering the crash in the first place.

## The real bugs

Two things should be fixed upstream. libddcutil should not treat a monitor entering DPMS off as a physical disconnection. The display is sleeping, not unplugged. And Firefox should handle output removal without segfaulting. Other Wayland clients survive this scenario. A destroyed `wl_output` should produce a graceful error, not a crash.

Until those get fixed, `DDCUTIL_WATCH_MODE=none` keeps everything working.
