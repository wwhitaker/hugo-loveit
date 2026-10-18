+++
title = 'Two Tiers of Homelab Notifications'
description = 'ntfy for things to review, Signal for things to act on, and the plumbing in between'
date = '2026-11-01'
draft = true
tags = ['homelab', 'monitoring', 'ntfy', 'signal', 'apprise']
categories = ['Homelab']
+++

For a while, everything in my homelab sent alerts to Signal: Uptime Kuma, the media apps, backups, Proxmox. It didn't take long to train myself to ignore Signal notifications. That's the worst outcome for an alert channel. One that cries wolf is worse than none at all.

## The Test

Now every notification has to pass one question:

> **Would I get out of a chair for this?**

If not, it goes to **ntfy**, which I review when I feel like it. If so, it goes to **Signal**, which interrupts me wherever I am.

## The Pieces

| Piece | Role |
| --- | --- |
| ntfy | Self-hosted push server, with topics for `media`, `monitor` and `homelab` |
| signal-cli REST API | Sends Signal messages from a dedicated number |
| Apprise API | One place to send a notification, with tags deciding where it goes |

Most apps send straight to ntfy where they can, because every hop is something else that can fail silently. Apprise earns its place in two spots: the `urgent` tag, which fans out to Signal, and Proxmox's webhook, which posts its own JSON format.

## What Goes Where

| Source | Destination |
| --- | --- |
| Sonarr, Radarr, Lidarr, Bazarr, Tautulli | ntfy `media` |
| Uptime Kuma | ntfy `monitor` |
| Proxmox, Dockhand, backup successes | ntfy `homelab` |
| Backup failures | Signal |
| UPS on battery | Signal |

## Lessons That Cost an Afternoon Each

* **Apprise's tag parameter changes name.** Apps embedding the Apprise library use `apprise://host/key?tags=x`, plural. Posting to the API's `/notify/<key>` uses `?tag=x` or a JSON `"tag"`, singular.
* **A plain-HTTP ntfy port trips up clients.** Many default to HTTPS and fail with "server gave HTTP response to HTTPS client". Putting ntfy behind my reverse proxy with a real certificate made the whole class of problem go away.
* **Don't put templates inside a JSON body.** Backup tools love `{{ .Summary }}`, but its expansion contains newlines and quotes that break the payload. A static message is enough, since the backup log says which plan failed.
* **The ntfy iOS app needs a relay for background delivery.** Without one it only receives while open, pulling from the server's cache. For a review tier that's exactly right. Signal carries anything that must interrupt.

## The Gap

Everything above runs inside the lab, so none of it can tell me the lab itself is down. That needed something outside the house: [Who Tells You the Homelab Is Down?](/posts/homelab-dead-mans-switch/)

## Wrapping Up

Two tiers sounds like over-engineering for a home setup, but it's the difference between alerts I read and alerts I swipe away. Start with the chair test and route everything else somewhere quieter.
