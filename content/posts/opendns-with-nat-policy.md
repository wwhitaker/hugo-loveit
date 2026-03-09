+++
title = 'OpenDNS Enforcement'
description = 'Using firewall and NAT policy to force DNS traffic through OpenDNS'
date = '2017-07-30'
draft = false
tags = ['dns', 'opendns', 'edgerouter', 'network', 'security']
categories = ['Technical']

[params]
    featuredimage = '/images/posts/opendns-with-nat-policy-featured.png'
+++

[OpenDNS](https://www.opendns.com/) is a powerful tool to control Internet access on both enterprise and home networks. The ability to manipulate DNS responses based on categories and analytics, along with policy customizations, can protect users from known threats and provide a layer of content filtering.

However, the network needs to route all outbound DNS queries through OpenDNS to be effective. With well known public DNS offerings such as Google's `8.8.8.8`, users and applications can easily specify alternate DNS servers. OpenDNS itself does not prevent this bypass directly, but network controls such as firewall and NAT policy can lock it down.

Enabling the service is straightforward: point your recursive DNS servers or clients to OpenDNS (`208.67.222.222` and `208.67.220.220`). In this setup, the router is an EdgeRouter Lite (Vyatta-based), with DHCP handing out the router as the client resolver.

```shell
ubnt@ubnt: ~$ show configuration commands | match name-server
set system name-server 208.67.222.222
set system name-server 208.67.220.220
```

To ensure all DNS queries route through OpenDNS, there are two common enforcement approaches.

## Option 1 - Firewall Policy

A firewall policy can block outbound DNS queries that do not go where you want. If a client tries to query a different internet resolver, it will timeout and retry according to client behavior.

For this EdgeRouter, a LAN inbound rule blocks outbound port 53 on `eth1` and `eth2`.

```shell
ubnt@ubnt:~$ show configuration commands | match LAN_IN
set firewall name LAN_IN default-action accept
set firewall name LAN_IN description 'Traffic from LAN'
set firewall name LAN_IN rule 22 action drop
set firewall name LAN_IN rule 22 description 'Internet DNS'
set firewall name LAN_IN rule 22 destination port 53
set firewall name LAN_IN rule 22 log disable
set firewall name LAN_IN rule 22 protocol tcp_udp
set interfaces ethernet eth1 firewall in name LAN_IN
set interfaces ethernet eth2 firewall in name LAN_IN
```

After applying the rule, lookups through the default local resolver still succeed:

```text
C:\>nslookup www.aol.com
Server:  Unknown
Address:  192.168.10.1

Non-authoritative answer:
Name:    ipv4.portal.aol.com.aol.akadns.net
Addresses:  34.202.119.59
          52.7.156.60
Aliases:  www.aol.com
          portal.aol.akadns.net
```

The same query directed to `8.8.8.8` times out because traffic is blocked:

```text
C:\>nslookup www.aol.com 8.8.8.8
DNS request timed out.
    timeout was 2 seconds.
Server:  Unknown
Address:  8.8.8.8

DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
*** Request to Unknown timed-out
```

You can also verify counter increments on the firewall rule:

```shell
ubnt@ubnt:~$ show firewall statistics
----------------------------------------------------------------------------------

IPv4 Firewall "LAN_IN" [Traffic from LAN]

 Active on (eth2,IN) (eth1,IN)

rule  packets    bytes        action  description
----  -------    -----        ------  -----------
22    133        9307         DROP    Internet DNS
10000 1778       980898       ACCEPT  DEFAULT ACTION

----------------------------------------------------------------------------------
```

## Option 2 - NAT Policy

A NAT policy can silently reroute all outbound DNS queries back to your desired resolver. This is often preferred because clients do not experience timeout failures, and DNS traffic can still be logged and processed.

Example destination NAT rules on two LAN interfaces/subnets:

```shell
ubnt@ubnt:~$ show configuration commands | match "nat rule"
set service nat rule 1 description 'LAN1 DNS Redirect'
set service nat rule 1 destination port 53
set service nat rule 1 inbound-interface eth1
set service nat rule 1 inside-address address 192.168.10.1
set service nat rule 1 inside-address port 53
set service nat rule 1 log disable
set service nat rule 1 protocol tcp_udp
set service nat rule 1 type destination

set service nat rule 2 description 'LAN2 DNS Redirect'
set service nat rule 2 destination port 53
set service nat rule 2 inbound-interface eth2
set service nat rule 2 inside-address address 192.168.20.1
set service nat rule 2 inside-address port 53
set service nat rule 2 log disable
set service nat rule 2 protocol tcp_udp
set service nat rule 2 type destination

set service nat rule 5010 description 'masquerade for WAN'
set service nat rule 5010 outbound-interface eth0
set service nat rule 5010 type masquerade
```

You can verify this behavior by checking active destination NAT translations:

```shell
ubnt@ubnt:~$ show nat translations destination
Pre-NAT               Post-NAT             Type  Port  Timeout
8.8.8.8               192.168.10.1         dnat  udp   20
8.8.8.8               192.168.10.1         dnat  udp   20
8.8.8.8               192.168.10.1         dnat  udp   20
```

## Nothing is Perfect

These methods are effective for standard DNS traffic on port 53, but they are not absolute. If an application uses non-standard DNS ports, these rules may not apply. Still, they cover the most common DNS configurations and materially reduce bypass opportunities.

## Implications with IPv6

OpenDNS has historically lagged on IPv6 filtering capabilities. Even where IPv6 DNS servers are available, filtering features may not match IPv4 behavior. To avoid policy gaps, ensure clients are not using unmanaged IPv6 resolvers and consider adding IPv6 firewall controls that force fallback to your intended IPv4 DNS path.
