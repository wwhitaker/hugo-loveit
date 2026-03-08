+++
title = 'Spectrum IPv6'
description = 'Configuring IPv6 with Spectrum and EdgeRouter'
date = '2017-07-31'
draft = false
tags = ['ipv6', 'edgerouter']
categories = ['Homelab']
image = 'https://defingo.net/images/blogs/modem.jpg'
+++

For a while now, Spectrum has made IPv6 available at my home but I have had mixed results with a few different routers and firewalls. Some commercial models lacked needed features like prefix delegation client while consumer grade models lacked other features of interest. Recently I purchased an Edgerouter Lite to find a happy middle of the road. So far, the performance is great and the configuration is not complicated if you are comfortable with the CLI.

For this setup, the eth0 interface is configured as the WAN link while eth1 and eth2 each get their own LAN network segments. I chose not to bridge eth1/eth2 for performance reasons and to provide an easy way to segment broadcast domains. The setup for IPv4 only required applying two RFC1918 subnets but IPv6 requires a little more work.

The normal consumer use case assigns a /128 address to eth0 via DHCP and provides a /64 network prefix to a single LAN segment through DHCP-PD. The Edgerouter Lite's basic setup wizard had options to enable this out of the box (along with the IPv6 firewall). The important interface configuration commands are noted below.

```
set interfaces ethernet eth0 address dhcp
set interfaces ethernet eth0 dhcpv6-pd pd 0 interface eth1 host-address ::1
set interfaces ethernet eth0 dhcpv6-pd pd 0 interface eth1 service slaac
set interfaces ethernet eth0 dhcpv6-pd pd 0 prefix-length /64
set interfaces ethernet eth0 dhcpv6-pd rapid-commit enable
```

Address assignment can be verified by looking at the interfaces.

```
ubnt@ubnt:~$ show interfaces
Codes: S - State, L - Link, u - Up, D - Down, A - Admin Down
Interface    IP Address                        S/L  Description
---------    ----------                        ---  -----------
eth0         71.XX.XXX.XX/20                   u/u  Internet
             2606:a000:XXXX:XX:XXXX:XXXX:XXXX:XXXX/128
eth1         192.168.10.1/24                   u/u  Local
             2606:a000:YYYY:YYYY::1/64
eth2         192.168.20.1/24                   u/u  Local 2
lo           127.0.0.1/8                       u/u
             ::1/128
```

Enabling a second IPv6 subnet on eth1 required a few extra commands to request a second prefix delegation on eth2.

```
set interfaces ethernet eth0 dhcpv6-pd pd 1 interface eth2 host-address ::1
set interfaces ethernet eth0 dhcpv6-pd pd 1 interface eth2 service slaac
set interfaces ethernet eth0 dhcpv6-pd pd 1 prefix-length /64
```

Again, address assignment can be verified by looking at the interfaces.

```
ubnt@ubnt:~$ show interfaces
Codes: S - State, L - Link, u - Up, D - Down, A - Admin Down
Interface    IP Address                        S/L  Description
---------    ----------                        ---  -----------
eth0         71.XX.XXX.XX/20                   u/u  Internet
             2606:a000:XXXX:XX:XXXX:XXXX:XXXX:XXXX/128
eth1         192.168.10.1/24                   u/u  Local
             2606:a000:YYYY:YYYY::1/64
eth2         192.168.20.1/24                   u/u  Local 2
             2606:a000:ZZZZ:ZZZZ::1/64
lo           127.0.0.1/8                       u/u
             ::1/128
```

A few google searches lead me to believe Spectrum may support as many as sixteen /64 delegations or a single /60 to consumer accounts. In either case, that is more than my current needs so I will be content with my two local LAN prefixes for now.
