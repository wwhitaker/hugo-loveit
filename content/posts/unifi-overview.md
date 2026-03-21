+++
title = 'Unifi Overview'
description = 'How Unifi is the backbone of my homelab.'
date = '2026-03-19'
draft = false
tags = ['homelab', 'networking', 'unifi', 'dns']
categories = ['Homelab']
+++

Unifi has slowly become my goto for personal networking needs.  I can still experiment with different vendors but the reliable homelab core needs something cost effective.

## Routing

[*Unifi Cloud Gateway Fabric*](https://techspecs.ui.com/unifi/cloud-gateways/ucg-fiber?s=us)

This shouldn't be a surprise as it easily bubbles to the top of any recommendation video or product review.  The UCG Fabric offers a wealth of features at a decent price point, most notable below.

* Mix of port options - The mix of multiple 2.5Gbs and 10Gbs ports provides flexibility.
* Onboard storage - Adding a NVMe drive opens the door on other Unifi application, but notably for Network it extends the flow log tracking.
* Security features - Basic firewall features are there but the IPS solution adds capability.  The integrated DNS Guard is an easy and effective way to integrate privacy DNS.

In the past other Unifi products handled routing, including a Unifi Cloud Gateway Ultra and an older Unifi Security Gateway.  

## Switching

[*Unifi Switch Lite 16 PoE*](https://techspecs.ui.com/unifi/switching/usw-lite-16-poe?subcategory=switching-utility)

A compact 16 port offers a good number of 1Gbs ports.  The 8 PoE+ ports provide enough power for a variety of devices, from run of the mill APs to USB power injectors for a RaspberryPi.

In the future, I want to replace this with something at least 2.5Gbs capable.

## Wireless

[*Unifi U6 Mesh*](https://techspecs.ui.com/unifi/wifi/u6-mesh?s=us)

My specific environment requires an alternative to hard wired APs to satisfy coverage needs.  The U6 Mesh has a nice 4x4 spectrum 5GHz radios to help squeeze the most out of the wireless backhauls when necessary.  They are only Wifi-6 models with no 6GHz radios but that doesn't matter with my mix of everyday wireless clients.

The only downside I've found with the U6 Mesh is the failure rate.  They run hot and eventually seem to fail slightly outside of the warranty period.

Older wireless models like the UAP-AC-Pro previously handled wireless.
