+++
title = 'My UPS Said 32 Minutes. It Lasted 14.'
description = 'Testing UPS runtime, NUT gotchas, and consolidating two small UPSes into one'
date = '2026-10-15'
draft = true
tags = ['homelab', 'ups', 'nut', 'proxmox']
categories = ['Homelab']
+++

<!-- TODO after the swap: fill in the CyberPower runtime test and NUT changes below. -->

For years my homelab ran on two small APC Back-UPS units, simply because I didn't have enough battery-backed outlets on one. A 600 VA unit carried the NAS and the Proxmox host. A 550 VA unit carried the modem, gateway and switch. Both were "fine" according to their status lights.

Then I actually tested one.

## The Test

I pulled the plug on the 600 VA UPS on a quiet evening and watched. The load was about 21%. NUT, the Network UPS Tools daemon, estimated 32 minutes of runtime.

It reached low battery at **14 minutes**.

> **A UPS runtime estimate is a guess based on a healthy battery. Only a test tells you what you actually have.**

The test also exposed a shutdown problem. My Proxmox host was supposed to shut itself down after 15 minutes on battery. The battery never lasted that long, so the host only shut down when the NAS sent its forced-shutdown signal, and it lost power while two VMs were still stopping.

## Things NUT Taught Me

* **The server doesn't wait for clients.** The NAS acts as the NUT server for that UPS. When battery runs low, it tells clients to shut down, then powers itself off and cuts the UPS output about 90 seconds later. Whether the clients are finished or not.
* **Shut down on a timer, not on low battery.** I moved the Proxmox host to a 5-minute-on-battery timer so it's done long before the NAS pulls the plug.
* **Scope `upssched` rules by UPS name.** A wildcard `AT ONBATT *` fires for every UPS the host knows about, including one it only monitors for status.
* **Read `ups.alarm`.** The second UPS flapped in my monitoring for weeks. Adding the alarm text to my push script showed `No battery installed!` at 100% charge: a battery failing under load. Its beeper had been disabled, so it had been complaining silently.
* **The quick self-test is not a runtime test.** It passed the day after the 14-minute run. It only checks that the battery can carry the load for a few seconds.

## Two Batteries or One UPS?

Two replacement batteries would have cost about $80. A single CyberPower CP1500PFCLCD (1500 VA / 1000 W, pure sine wave, 6 battery-backed outlets) cost a bit over $200. With the combined load around 130 W, roughly 13% of its capacity, it should run for close to an hour.

The trade-off is real. With two UPSes, the network outlasted the servers. With one, everything goes down together, and a UPS failure takes out everything at once. With several times the runtime, most outages end long before that matters, so I consolidated.

The six battery outlets go to the NAS, the Proxmox host, the USB backup drive, the modem, the gateway and the switch. The HomePod and the cordless phone base get surge-only outlets.

## After the Swap

<!-- TODO: measured runtime on the CyberPower, NUT name (still ups0?), timer change on pve1, and retiring the second NUT server. -->

## Wrapping Up

Test your UPS. Pull the plug on a calm evening, time it to low battery, and compare that to what it claims. Then check that your shutdown sequence actually finishes inside the time you really have.
