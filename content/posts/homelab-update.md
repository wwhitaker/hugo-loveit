+++
title = 'Homelab Update 2026'
description = ''
date = '2026-03-18T11:52:57-04:00'
draft = false
tags = ['homelab']
categories = ['Technical']
+++

Having a few extra servers sitting around has been the normal for a long time.

## Hardware Stack

### Network

| Device | |
| --- | --- |
| Unifi Cloud Gateway Fiber | router |
| Unifi Switch Lite 16 | PoE switch |
| Unifi U6 Mesh | primary AP |

### Servers

| Device | CPU | Memory | Storage |
| --- | --- | --- | --- |
| Beelink S12 Pro Mini | Intel N100 (4C/4T) up to 3.4 GHz | 16GB | 500GB |
| Synology DS220+ | Intel Celeron J4025 (2C/2T) 2GHz | 6GB | 16TB (raid 0) |
| Synology DS214 | Marvell Armada XP (2C/2T) 1GHz | 512MB | 8TB (raid 0) |
| Dell Inspiron | | | |

### Power

| Device | |
| --- | --- |
| Back-UPS ES 550G | 550VA / 330W |
| Back-UPS ES 600M1 | 600VA / 330W |

## Software

### Virtualization Hierarchy

* Synology
  * Docker
* Proxmox
  * LXC - Debian
  * VM - Debian
    * Docker

### Backup

Onsite

Offsite

* cloudflared
* homepage
* speedtest
* speedtests
* dockhand

* grafana
* uptime-kuma
* prometheus
* influxdb
* nginx proxy manager
* gitea
* it-tools
* unpoller

* graylogo
* bichon
* signal-cli-rest-api
* nut