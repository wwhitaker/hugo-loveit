+++
title = 'One Smart Home, Three Assistants'
description = 'Apple Home, Google and Alexa reaching the same devices by different paths, and why Homebridge ended up on the critical path'
date = '2026-11-08'
draft = true
tags = ['homelab', 'homekit', 'homebridge', 'smart-home']
categories = ['Homelab']
+++

Our house is mostly Apple devices, so Apple Home runs the automations. But we mostly *talk* to Google speakers, the Fire TVs have Alexa built in, and each device brand has its own app too. When I tried to draw which of these controls what, I realized I didn't fully know.

## Who Talks to What

| Devices | Apple Home | Google | Alexa | Own app |
| --- | --- | --- | --- | --- |
| Ring alarm, cameras, doorbell | via Homebridge | | native | Ring |
| Kasa lamps and plugs | via Homebridge | yes | yes | Kasa |
| ecobee thermostats | native | | | ecobee |
| Samsung TV | via Homebridge | | | SmartThings |
| Roku | native | | | Roku |
| MyQ garage door | no | no | no | Ring app only |

A few things stood out.

**Most of Apple Home goes through Homebridge.** I'd thought of Homebridge as the thing that bridged "a few odd devices". In fact Ring, Kasa and the Samsung TV all come through it, and so do nearly all of the lights and plugs our automations touch, plus the alarm that our nightly "lockup" automation arms. Homebridge isn't on the side. It's on the critical path.

**Voice control doesn't go through the lab at all.** Google and Alexa reach Kasa and Ring through each company's cloud. If my Proxmox host is down, "turn on the lamp" still works. What stops is the Apple Home automations.

**MyQ only talks to Ring.** Chamberlain locked down its API, so Homebridge, Google and Apple Home can't control the garage door. Ring's app can. Our "when the garage door opens" automation actually triggers on Ring's door sensor.

## The Failure Modes

* **One hub, on Wi-Fi.** A HomePod mini is our only home hub, and it has no Ethernet port. If it drops off Wi-Fi, automations stop. A second hub on Ethernet, like an Apple TV, would let Home fail over.
* **Missed automations are silent.** Apple Home doesn't report an automation that didn't run. If the hub or Homebridge is down overnight, the alarm doesn't arm, and nothing tells you.
* **"Up" isn't "working".** My monitor for Homebridge checks that its web page answers. The Ring plugin depends on a cloud login token; if that lapses, Homebridge looks healthy while the alarm is unreachable.
* **Safety alerts don't depend on any of this.** The smoke, CO and alarm sensors alert through Ring's own base station and app. HomeKit only mirrors them.

## Housekeeping

Drawing it out turned up clutter, too. Six accessories in Apple Home had shown "No Response" for months. Three came from a SmartThings hub that's been in storage for a year, still exposed by a Homebridge plugin. Another was a TV that broke and was replaced. Uninstalling the dead plugin and removing the old TV from the config cleaned most of it up.

> **Automations live in one place; voice assistants are for voice.**

That's the rule that keeps this manageable. A schedule set up in two assistants fights itself, and nothing shows you that both exist.

## Wrapping Up

If your smart home grew one device at a time like ours, draw it. A simple grid of devices against the apps that can reach them shows quickly what depends on your homelab and what doesn't.
