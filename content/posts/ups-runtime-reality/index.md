+++
title = 'My UPS Said 32 Minutes. It Lasted 14.'
description = 'Two pull-the-plug tests, a worn battery, a shutdown that could never have worked, and consolidating onto one UPS'
date = '2026-10-25'
draft = false
tags = ['homelab', 'ups', 'nut', 'proxmox']
categories = ['Homelab']
+++

For years my homelab ran on two small APC Back-UPS units, simply because I didn't have enough battery-backed outlets on one. A 600 VA unit carried the NAS and the Proxmox host. A 550 VA unit carried the modem, gateway and switch. Both were "fine" according to their status lights.

Then I actually tested one.

## The Test

I pulled the plug on the 600 VA UPS on a quiet evening and watched. The load was about 21%. NUT, the Network UPS Tools daemon, estimated 32 minutes of runtime.

It reached low battery at **14 minutes**.

> **A UPS runtime estimate is a guess based on a healthy battery. Only a test tells you what you actually have.**

The test also exposed a shutdown problem. My Proxmox host was supposed to shut itself down after 15 minutes on battery. The battery never lasted that long, so the host only shut down when the NAS sent its forced-shutdown signal, and it lost power while two VMs were still stopping.

## Things NUT Taught Me

* **The server doesn't wait for clients.** The NAS acts as the NUT server for that UPS. When battery runs low, it tells clients to shut down, then powers itself off and cuts the UPS output about 90 seconds later. Whether the clients are finished or not.
* **Shut down on a timer, not on low battery.** I moved the Proxmox host to a 5-minute-on-battery timer so it would be done long before the NAS pulls the plug. (The second test showed that timer had a bigger problem. More below.)
* **Scope `upssched` rules by UPS name.** A wildcard `AT ONBATT *` fires for every UPS the host knows about, including one it only monitors for status.
* **Read `ups.alarm`.** The second UPS flapped in my monitoring for weeks. Adding the alarm text to my push script showed `No battery installed!` at 100% charge: a battery failing under load. Its beeper had been disabled, so it had been complaining silently.
* **The quick self-test is not a runtime test.** It passed the day after the 14-minute run. It only checks that the battery can carry the load for a few seconds.

## Two Batteries or One UPS?

Two replacement batteries would have cost about $80. A single CyberPower CP1500PFCLCD (1500 VA / 1000 W, pure sine wave, 6 battery-backed outlets) cost a bit over $200. With the combined load around 130 W, roughly 13% of its capacity, it should run for close to an hour.

The trade-off is real. With two UPSes, the network outlasted the servers. With one, everything goes down together, and a UPS failure takes out everything at once. With several times the runtime, most outages end long before that matters, so I consolidated.

The six battery outlets go to the NAS, the Proxmox host, the USB backup drive, the modem, the gateway and the switch. The HomePod and the cordless phone base get surge-only outlets.

## After the Swap

The swap itself was simple. The CyberPower plugs into the NAS by USB, and the NAS served it under the same NUT name the old UPS had, so nothing on the Proxmox host needed to change. The host stopped serving the second UPS and became a NUT client only, and its monitoring entries for the old unit went away.

Then, with a full charge, I pulled the plug again and logged NUT every 15 seconds.

| | Old 600 VA APC | New 1500 VA CyberPower |
| --- | --- | --- |
| Load | ~21% | 12–16% |
| Estimated runtime | 32 min | ~50 min |
| **Measured, to low battery** | **14 min** | **42½ min** |
| Until the UPS cut its output | ~16 min | ~48½ min |

Three times the runtime, and this time the estimate was close. Because the modem, gateway and switch were on the same battery, the internet stayed up for the whole test, and the Signal alerts kept getting out.

### The shutdown that could never have worked

Five minutes in, my phone got the Proxmox host's "shutting down now" alert. But the host kept running. Every VM and container was still up ten minutes later.

The journal had one line: `upssched-cmd onbatt-shutdown ... returned 1`.

`upssched` runs its command script as the unprivileged `nut` user. That user could send the alert, which is just a `curl`, but not run `shutdown`, which needs root. It failed silently, and almost certainly did in the first test too. That "15-minute timer that never fired" had probably fired fine and then failed the same way.

> **Don't call `shutdown` from `upssched-cmd`. Call `upsmon -c fsd`.**

`upsmon -c fsd` asks the `upsmon` process, which runs as root, to start a forced shutdown and run its configured shutdown command. It's NUT's own pattern for timer-based shutdowns. I shut the host down by hand for this test, deployed the fix afterwards, and raised the timer to 10 minutes now that I know the real runtime. I haven't re-tested it with a real unplug yet. A clean shutdown of the host takes about three and a half minutes, mostly waiting on one container that ignores a polite stop.

### Other things the second test showed

* **A dead man's switch earns its keep.** About six minutes after the Proxmox host went down, an outside service noticed that my monitoring had stopped checking in, and alerted me by Signal. More in [Who Tells You the Homelab Is Down?](/posts/homelab-dead-mans-switch/).
* **One reverse proxy, one point of failure.** My reverse proxy runs on the Proxmox host. With the host off, every internal name it serves stopped working, including the one my phone uses for push notifications. The notification server on the NAS was fine; nothing could reach it by name.
* **Surge-only means off.** The HomePod on a surge-only outlet died the instant the power did, taking every Apple Home automation with it. Apple's own "home hub not responding" notice arrived about 25 minutes later.
* **"Standby" isn't "off".** My NAS's UPS setting is Standby mode. At low battery it unmounted its hard-drive pools but kept running. NUT's power-fail shutdown powered it off about six minutes later, and the UPS cut its output.
* **Some containers still don't come back.** The same few Docker containers stayed stopped after power returned, as in the first test. Restarting them is now a step in my recovery checklist.

## Wrapping Up

Test your UPS. Pull the plug on a calm evening, time it to low battery, and compare that to what it claims. Then check that your shutdown sequence actually finishes inside the time you really have, and that it shuts something down at all. An alert saying "shutting down now" isn't proof that anything did.
