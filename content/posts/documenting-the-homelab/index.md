+++
title = 'What Documenting My Homelab Found'
description = 'Writing it all down against the live systems turned up real problems'
date = '2026-10-15'
draft = true
tags = ['homelab', 'documentation', 'proxmox', 'unifi']
categories = ['Homelab']
+++

My homelab notes used to live in a few places: a spreadsheet of schedules, a draw.io diagram, some scripts in different repos, and my memory. Recently I pulled it all into one Git repo with an `inventory.yaml` as the source of truth and a handful of Markdown docs for power, storage, backups, networking and monitoring.

The rule I followed was simple: **don't write down what I think is true; check it against the live system first.** That meant screenshots of settings pages, read-only API tokens for Proxmox, UniFi and InfluxDB, and running a few commands on each box. I worked through it with an AI assistant, which was good at reading API output and spotting where my notes and reality disagreed.

It paid for itself almost immediately.

## What Turned Up

**My "full" drive test wasn't.** The NAS had three scheduled tests: rapid weekly, a monthly IHM check, and a plan named "Full, monthly". The full plan's test type was set to *Rapid*. No full surface test had ever run on schedule. It's now a real full test every three months, and the IHM check runs the day before so the two never overlap.

**A UPS battery was dying quietly.** My network UPS had been flapping in Uptime Kuma for weeks: down for a minute, up again, many times a day. Once I made the push script include NUT's alarm text, the reason was obvious: `No battery installed!` at 100% charge. That's an old battery failing under load. The UPS's beeper had been disabled, so it had been complaining silently. The other UPS had already measured 14 minutes of runtime against an estimate of 32. Both are being replaced.

**The drive letters had moved.** My notes said the 16 TB pair was `sda`/`sdc`. After a power outage, it was `sda`/`sdb`. Linux doesn't promise device names across reboots. Every reference to "the failing drive, `/dev/sdd`" now uses its serial number instead.

**Three years of speedtest history was about to start expiring.** The InfluxDB bucket had a three-year retention, and the oldest data was exactly three years old. I set it to keep forever with days to spare.

**Two jobs were fighting at 04:00.** A Docker volume backup that stops containers ran at the same minute as Dockhand's automatic container updates on the same host. Neither ever logged an error.

**There was no RAID scrub.** The NAS doesn't offer one for RAID 1 pools, and nothing else was reading both copies to compare them.

**Nothing would tell me if the lab died.** Every alert path ran inside the lab. That one became its own post: [Who Tells You the Homelab Is Down?](/posts/homelab-dead-mans-switch/)

**The SMART script couldn't read NVMe drives.** It reported them as unreadable because `smartctl` exits with a non-zero bitmask even when it succeeds, and the script ran with `pipefail`. Once fixed, I learned the Proxmox host's cheap OEM SSD is at 27% wear, with spare blocks and media errors steady. It's on the watch list, not the panic list.

> **Writing it down isn't the value. Checking it is.**

## What Made It Work

* **One source of truth.** `inventory.yaml` gets updated first, and docs point to it.
* **Read-only access everywhere I could get it.** View-only accounts for Proxmox, UniFi and InfluxDB meant facts came straight from the API, not my memory. Where a product only offered full admin (Dockhand), I skipped it and used screenshots instead.
* **Dates on everything.** "Checked 2026-10-11" next to a number tells me how stale it is.
* **Secrets stay out.** Tokens, push URLs and passwords appear as placeholders. The repo is safe to read over someone's shoulder.
* **A visual schedule.** A swimlane chart of every scheduled job per device made the overlaps obvious in a way a table never did.

## Wrapping Up

I expected documenting the lab to be tedious bookkeeping. Instead it found a misconfigured drive test, a dead battery, a silent alerting gap and data about to be deleted, all in a couple of days. If your homelab lives in your head, try writing it down, and check every line against the real thing as you do.
