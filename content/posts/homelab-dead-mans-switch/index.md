+++
title = 'Who Tells You the Homelab Is Down?'
description = "A free dead man's switch for when every alert path goes down with the lab"
date = '2026-10-11'
draft = false
tags = ['homelab', 'monitoring', 'uptime-kuma', 'healthchecks']
categories = ['Homelab']
+++

My homelab has a decent alerting setup. Uptime Kuma watches about eighty monitors, ntfy collects the things I should review, and Signal gets the things I need to act on. While writing it all down, I noticed something uncomfortable: every one of those pieces runs inside the lab.

Kuma runs on the Proxmox host. ntfy, Apprise and the Signal gateway run on the NAS. Both sit on the same UPS, behind the same internet connection. If the power goes out long enough, or the internet drops, or the NAS hangs, the thing that's supposed to tell me about the problem is part of the problem.

> **An alerting system can't report its own death.**

## The Dead Man's Switch

The fix is old and simple. Instead of the lab sending an alert when something breaks, it sends a regular "still here" ping to a service outside the house. When the pings stop, *that* service raises the alarm.

The important part is where the alert comes from. A cloud service sends it, by email or Signal, and my phone gets it over cellular. Nothing at home has to be working. The lab never has to send anything for an outage to be reported: silence is the alert.

I used [healthchecks.io](https://healthchecks.io). The free tier allows 20 checks, which is more than enough.

## Two Checks, Not One

My alerting depends on two machines, so I set up two checks:

| Check | Pinged by | Every | Alerts after |
| --- | --- | --- | --- |
| `pve1-kuma` | an Uptime Kuma monitor | 1 minute | 5 minutes of silence |
| `nas-alerting` | a cron job on the NAS | 5 minutes | 5 minutes of silence |

The first catches power, internet, the Proxmox host or Kuma itself going away. The second catches the case I'd never considered: Kuma notices the NAS is down, and then has no way to tell me, because the notification services live on the NAS.

## Setting It Up

**On healthchecks.io,** create a check for each, set the period and grace time, and copy its ping URL (`https://hc-ping.com/<uuid>`). Email alerts are on by default. I added Signal too, so an outage reaches me the same way my other urgent alerts do.

**In Uptime Kuma,** add an ordinary HTTP monitor that requests the ping URL every 60 seconds. Every successful check is a ping. I gave it no notifications of its own, because if it fails, my internet monitors already say so. Its only job is to keep pinging.

**On the NAS,** one line in root's crontab:

```sh
*/5 * * * * curl -fsS -m 10 --retry 3 -o /dev/null https://hc-ping.com/<uuid>
```

Then test it the honest way: pause the Kuma monitor and wait. About six minutes later my phone buzzed with a Signal message and an email. Resume the monitor and a "back up" message follows.

## Things to Know

* **Treat ping URLs like passwords.** Anyone who has one can ping the check and hide a real outage. Mine live in Kuma and the crontab, not in my notes repo.
* **NAS updates can wipe root's crontab.** I added "check the healthchecks ping is still there" to my after-update checklist. If it's ever wiped, the check emails me within ten minutes anyway, which is the point.
* **It doesn't replace monitoring.** It answers one question, "is the lab alive enough to tell me things?", and that's exactly the question nothing else could answer.

## Wrapping Up

It took about fifteen minutes and costs nothing. The next power cut while I'm at work, I'll know about it from my phone instead of finding out when I get home.
