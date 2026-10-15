+++
title = 'Unifi Overview'
description = 'How Unifi is the backbone of my homelab: the hardware, the network design, and what I learned running it'
date = '2026-03-19'
lastmod = '2026-10-15'
draft = false
tags = ['homelab', 'networking', 'unifi', 'dns']
categories = ['Homelab']
+++

Unifi has slowly become my go-to for personal networking. I still experiment with other vendors, but the reliable core of the homelab needs to be cost effective, easy to manage from one place, and boring in the best way. That's what Unifi gives me.

| Role | Hardware | Notes |
| --- | --- | --- |
| Gateway | Cloud Gateway Fiber | Routing, firewall, IPS, DNS, and the Network and Protect apps |
| Switch | Switch Lite 16 PoE | 16 × 1 Gb/s, 8 PoE+ |
| Wireless | 2 × U6 Mesh | One wired, one meshed |
| Backup internet | second WAN port | Set up for failover, currently unplugged |

## Routing

[*Unifi Cloud Gateway Fiber*](https://techspecs.ui.com/unifi/cloud-gateways/ucg-fiber?s=us)

This shouldn't be a surprise, as it bubbles to the top of almost every recommendation video and product review. The UCG Fiber offers a wealth of features at a decent price point:

* **A mix of port speeds.** Several 2.5 Gb/s ports plus 10 Gb/s SFP+ give flexibility. My NAS sits on a 10 Gb/s port directly on the gateway.
* **Onboard storage.** Adding an NVMe drive opens the door to other Unifi applications, and for the Network app it extends flow-log history. Mine runs an older 256 GB drive I had on hand, which is plenty.
* **Security features.** The basic firewall is there, and the IPS adds real capability (more below). The built-in encrypted DNS settings make it easy to send lookups to a privacy-focused resolver.

In the past, a Cloud Gateway Ultra and an older Security Gateway handled routing. Moving from the Ultra to the Fiber was a backup and restore, though it came with [one performance puzzle](/posts/ucg-fiber-lan-to-internet-speed/).

## Switching

[*Unifi Switch Lite 16 PoE*](https://techspecs.ui.com/unifi/switching/usw-lite-16-poe?subcategory=switching-utility)

A compact 16-port switch with a good number of 1 Gb/s ports. The 8 PoE+ ports provide enough power for a variety of devices, from ordinary APs to USB power injectors for a Raspberry Pi.

In the future, I want to replace it with something at least 2.5 Gb/s capable.

## Wireless

[*Unifi U6 Mesh*](https://techspecs.ui.com/unifi/wifi/u6-mesh?s=us)

My house needs an alternative to hard-wired APs to get full coverage, so one U6 Mesh is wired and the second reaches it wirelessly. The 4×4 5 GHz radio helps squeeze the most out of that wireless backhaul. They are Wi-Fi 6 only, with no 6 GHz radio, which doesn't matter for our mix of everyday devices.

The only downside I've found is the failure rate. They run hot and seem to fail slightly outside the warranty period.

Older models like the UAP-AC-Pro previously handled wireless.

## Network Design

Three networks, each with its own SSID:

| Network | For |
| --- | --- |
| Default | Computers, phones, servers, the HomePod hub |
| IoT | Smart plugs, cameras, thermostats, speakers, TVs, Homebridge |
| Guest | Visitors, and a work-owned access point kept away from everything else |

With the newer zone-based firewall, IoT lives in its own zone. It can't start connections into the main network except where a rule allows it: the smart home devices reach the HomeKit hub, IoT clients reach Plex, and a few servers reach the NAS. The main network can reach IoT, which is what you want for controlling devices.

**mDNS** is enabled on the networks that need it. HomeKit, AirPlay and Chromecast all find devices with multicast DNS, and without it a phone on the main network can't see anything on IoT.

## DNS

The gateway is everyone's DNS server, and it answers for my internal domain, `lan.defingo.net`, locally. I wrote about why I use a subdomain of a public domain in [Homelab DNS Domain](/posts/homelab-dns-domain/).

Internet lookups go out over **DNS over HTTPS** to Cloudflare Gateway, which adds threat filtering and logging (see [Cloudflare Overview](/posts/cloudflare-overview/)). Unifi's own **content filtering** applies first, with ad blocking, Safe Search for Google, Bing and YouTube, and basic adult filtering, covered in [DNS Safe Search Enforcement](/posts/dns-safe-search/).

One gotcha: I have a wildcard record so every `*.lan.defingo.net` name I haven't defined goes to my reverse proxy. That's convenient for web apps, but a name that stops existing silently resolves to the proxy instead of failing. My monitoring now checks devices by IP address for exactly that reason.

## Security

* **Intrusion prevention** is set to notify *and* block, on every network, with nearly all signature categories enabled. Peer-to-peer is the one category I leave partly open, so my torrent client keeps working.
* **Region blocking** drops traffic to and from a handful of countries in both directions.
* **App blocking** blocks one or two apps by name on the main network.
* **Honeypots** answer on an unused address in each network. Nothing legitimate should ever touch them, so anything that does is worth a look.

## Updates and Backups

Unifi updates itself, staggered so nothing happens at once:

| What | When |
| --- | --- |
| UniFi OS | Sundays 01:00 |
| Network and Protect apps | Sundays 02:00 |
| Switch and AP firmware | Daily 03:00, when there's an update |
| IPS signatures | Daily, early morning |

The gateway also takes an automatic weekly backup of its own configuration. That's what made swapping from the Ultra to the Fiber a restore instead of a rebuild.

## Monitoring It

The Unifi dashboard is good, but I also want history alongside the rest of the homelab. **UnPoller** reads the controller's API and feeds Prometheus, and a Grafana dashboard shows gateway CPU, memory, uplink latency and per-device stats.

For anything that reads the API, I created a **local, view-only** Unifi user. UnPoller, my homepage dashboard and my own scripts all use it, so none of them could change a setting even if a password leaked.

Two things the monitoring has taught me:

* **Give infrastructure fixed addresses.** My APs and switch were still on DHCP, and one AP's address moved without my noticing. Fixed IPs (or at least reservations) for anything you monitor or link to save confusion later.
* **The gateway uses most of its memory.** Mine sits around 85% RAM with the Network and Protect apps running. That appears to be normal, but it's on my watch list.

## Wrapping Up

What I like about Unifi is that it's one system rather than a pile of boxes. Networks, firewall, DNS, Wi-Fi, updates and monitoring all live in one place, and almost everything I've wanted to do has had a setting for it. For a homelab that also has to keep the family online, that matters more than having every last feature.
