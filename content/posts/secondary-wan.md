+++
title = 'Home Backup ISP'
description = 'Setting up secondary WAN failover with Verizon 5G'
date = '2024-10-24'
draft = false
tags = ['backup-wan', 'netgear', 'verizon', 'unifi']
categories = ['Homelab']
image = '/images/blogs/no-content-available.jpg'
featuredImage = '/images/blogs/no-content-available.jpg'
featuredImagePreview = '/images/blogs/no-content-available.jpg'
+++

A recent power outage at home led me to look into secondary ISP options. All the battery backup work didn't quell family complaints about spotify not working. Luckily my Unifi gateway natively supports a secondary WAN port, so the question is what modem and ISP will work without breaking the bank. As an existing Verizon customer, I focused on those options in hope of discounts.

## Option 1 - On the Cheap

Unifi has native LTE secondary hardware options but they are locked in to mobile providers not compatible in my area. So while preferred, it was a no go.

A few early google searches led to the [Netgear 4G LTE modem (LM1200)](https://www.netgear.com/home/mobile-wifi/lte-modems/lm1200/). It was easy to find on Amazon with upgraded antenna options for $45. People generally like the hardware and a few online videos exist to preview the user interface and options.

The modem needs a data plan, so I paired it with a new SIM card from Verizon. A $20 option existed to add a line with 10GB per month of data. Going over 10GB will get expensive fast, but maybe this will work out for a true "secondary" option.

After all the deliveries, I was ready for the initial setup. Connect the modem to the external antennas, slip in the SIM card, and connect a test device to the modem's LAN port. Of course there were problems with SIM activation but after a fairly "long" call with Verizon technical support they realized the activation had been done wrong. Honestly I got lost on which "team" I was talking with over all the call transfers but ultimately someone was able to step up and sort it out.

Awesome, it started working with my test device directly connected. Speedtests were good. Let's switch to Unifi's secondary WAN port.

Oh no, now it's not working at all. The modem seems to keep cycling without making a connection. After much consternation I stumbled on others with the exact same issue: [LM1200 repeatedly dropping link](https://community.netgear.com/t5/Cell-Service-Mobile-Hotspot/LM1200-repeatedly-dropping-link/td-p/2132598/page/10). Apparently this setup is not supported with the modem in bridge mode. After playing with settings, ultimately I decided this was a deal breaker and I returned everything.

Time for another way…

## Option 2 - Verizon 5G

As an existing Verizon customer (i.e. discounts) and being in a [5G Home Internet](https://www.verizon.com/home/internet/5g/) service area, this was a valid consideration. Adding 5G Home Internet to my account was only $35 monthly with no real data cap. This was already looking better to my wallet.

After another round of orders and deliveries, it was time to connect everything. Out the box and connected to my test device things were working great. Speedtests were good to my device so it was time to connect the Unifi gateway.

I was a little concerned about the modem working in routed mode with all the extra unneeded features. Another round of Google searching located a guide to [Configure IP Passthrough / Bridge Mode](https://www.verizon.com/support/knowledge-base-301824/). Settings were straightforward and the link was recognized by the gateway.

Unifi needed a few settings to direct the secondary WAN to only be used in a failover but there were options to do policy routing also. As a test, I created a WAN rule to always use the secondary WAN with destination IP 8.8.4.4. This allowed easy testing from my monitoring tools to compare latency and link uptime.

A failover test lost 2 ping packets.

```
% ping 8.8.8.8
PING 8.8.8.8 (8.8.8.8): 56 data bytes
...
64 bytes from 8.8.8.8: icmp_seq=57 ttl=57 time=23.742 ms
64 bytes from 8.8.8.8: icmp_seq=58 ttl=57 time=23.209 ms
64 bytes from 8.8.8.8: icmp_seq=59 ttl=57 time=20.169 ms
64 bytes from 8.8.8.8: icmp_seq=60 ttl=57 time=28.076 ms
Request timeout for icmp_seq 61
Request timeout for icmp_seq 62
64 bytes from 8.8.8.8: icmp_seq=63 ttl=249 time=39.954 ms
64 bytes from 8.8.8.8: icmp_seq=64 ttl=249 time=50.574 ms
64 bytes from 8.8.8.8: icmp_seq=65 ttl=249 time=41.280 ms
64 bytes from 8.8.8.8: icmp_seq=66 ttl=249 time=45.634 ms
...
--- 8.8.8.8 ping statistics ---
117 packets transmitted, 115 packets received, 1.7% packet loss
round-trip min/avg/max/stddev = 18.682/33.587/54.178/11.381 ms
```

In general, speedtests from the gateway see around 100 Mbps down and 10 Mbps up on the secondary WAN. The primary WAN sees 1.16 Gbps down and 40 Mbps. Latency is 30 to 40 ms slower than the primary.

![wan2](/images/blogs/unifi_wan2_verizon.png)

The oddest problem related to IPv6. While I could enable it on the secondary WAN, clients didn't handle failing over well. They end up with two IPv6 prefixes leaving it up to the clients to figure out which public addressing to use. It made more sense to just disable IPv6 on the secondary WAN.

This seems to be a workable solution.

## In the End… Does it even matter?

Time will tell how often the secondary WAN is really used and I'll eventually run the numbers to see how cost effective it is. For now, the Verizon Home Internet will stick around.
