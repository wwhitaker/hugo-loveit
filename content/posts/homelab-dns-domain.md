+++
title = 'Homelab DNS Domain'
description = 'Choosing and configuring DNS domains for your homelab'
date = '2025-02-01'
draft = false
tags = ['dns', 'homelab', 'networking']
categories = ['Technical']
image = '/images/blogs/your_name_here.jpg'
featuredImage = '/images/blogs/your_name_here.jpg'
featuredImagePreview = '/images/blogs/your_name_here.jpg'
+++

A coworker asked me recently what DNS domain I use at home. It was a simple question but may deserve a long answer. I have tried several iterations over the years.

Often with large corporate or data center networks use split horizon DNS. It is a simple way to segment DNS data controlling what clients see based on their source IP address. This opens the door to reuse a public domain on a private network with different records. For example www.example.com might be a public corporation's website but employees on an internal network may see an altered version. The same architecture can be applied to homelabs.

Given their smaller size other options are possible such as using an obscure (or invalid) top level domain like .lan or .home. In addition, some devices will be using the .local domain out of the box.

## Domain Selection

What domain is best? It is your network and choice but there are better ways. Domain overlaps with split horizon DNS can get complicated fast. Picking an obscure top level domain puts you at risk if it is eventually activated and used by something. mDNS has to be supported on clients and is dependent on network topology.

> **Use a subdomain of a public domain you already own.**

In general you are better off using something you already own. Select a subdomain that is significant to you without any public DNS overlaps. You retain full control and have more flexibility configuring DNS resolution.

## Domain Combinations

For my homelab, all my devices utilize a `lan.defingo.net` domain while my public records live under `defingo.net`. The presence of mDNS makes `.local` a possible but in general I don't rely on every device supporting mDNS. Tailscale offers its own domain name. I also use a combination of port forwarding or Cloudflare tunnels behind public names. Here are a few combinations.

| Service | LAN Subdomain | mDNS | Tailscale | Public |
|---------|-------------|------|-----------|--------|
| Website | - | - | - | www.defingo.net |
| Synology | nas.lan.defingo.net | nas.local | nas.tail0a7ba.ts.net | nas.defingo.net |
| Proxmox | pve.lan.defingo.net | - | - | - |
| Homepage | home.lan.defingo.net | - | - | home.defingo.net |
| Homepod Mini | - | office.local | - | - |

## Domain Resolution

How do clients handle DNS resolution? Even if it is the router, a homelab will have some sort of local DNS server. It is usually paired with a service handling DHCP reservations. If configured to answer locally it can service the private domain while going to the Internet for the rest. Not requiring a dedicated server, the mDNS protocol will work by default when a client supports it.

Often though software manipulates DNS resolution for its own purposes. VPN clients can override local DNS servers and usually do not coexist. Other products like Tailscale add a "Magic DNS" feature to keep things interesting.

Here are some basic ways a client device might be connected and if DNS lookups will be successful.

| Connection Type | DNS Server | LAN Subdomain | mDNS | Tailscale | Public |
|----------------|-----------|-----------|------|-----------|--------|
| on LAN | LAN | ✅ | ✅ | ❌ | ☑️ |
| on LAN with Tailscale client | LAN / MagicDNS | ✅ | ✅ | ✅ | ☑️ |
| on LAN with corporate VPN | Corporate | ❌ | ✅ | 🚫 | ☑️ |
| offsite | Other | ❌ | ❌ | ❌ | ✅ |
| offsite with Tailscale client | Other / MagicDNS | ❌ | ❌ | ✅ | ✅ |
| offsite with corporate VPN | Corporate | ❌ | ❌ | 🚫 | ✅ |

The only case that should always work is the public domain name but it may not be optimal for LAN clients because of firewall hairpinning or remote tunnels forcing traffic out to the Internet.

## Wrapping Up

Names are nice, but when things get too complicated remember why you're doing this. It may be easier to just use an IP address and accept an untrusted web browser certificate.
