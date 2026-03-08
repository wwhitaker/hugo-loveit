+++
title = 'UCG Fiber - LAN to Internet Speed'
date = 2025-10-25T14:07:04-05:00
draft = false
categories = ['technical']
tags = ['unifi']

[params]
  description = 'UCG Fiber slow LAN to Internet Speed'
  author = 'William E. Whitaker, Jr'
  featuredimage = '/images/posts/ucg-fiber-lan-to-internet-speed.png'
+++

---

 Recently I swapped out my UCG Ultra for a UCG Fiber on Spectrum's 1gig service tier. The swap was straight forward by restoring the ultra's last backup to preserve data and settings. While I've been happy with the Fiber, I couldn't help but notice all my LAN devices can no longer approach the full 1 Gbps down. The Ultra was maintaining this performance level so it is a surprising something is holding the better hardware of the Fiber back.

Periodic Internet speed tests highlight the hardware change in the attached graph. The Fiber's own native speed tests still show up to 1.1 Gbps which is in line with the Spectrum modem's own speed tests. Clients hanging directly off the UCG Fiber or the downstream Switch Lite 16 PoE show the same ~600 Mbps performance.

I have experimented with tweaking different configuration options on and off (i.e. flow control , IPS, QoS) without much affect on observed speeds. Cloning the old Ultra's WAN MAC address on the Fiber WAN did not make a difference. Eventually I did a factory reset on the ultra and tested with the most "default" and basic configuration possible and still only saw ~600 Mbps down performance while the Fiber's self speed tests still reported over 1 Gbps.

Has anyone else bumped into this kind of issue with the UCG Fiber? Both the Ultra and Fiber are running OS version 4.3.9. 