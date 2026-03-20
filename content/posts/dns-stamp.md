+++
title = 'DNS Stamps?'
description = 'Understanding DNS Stamps for DoH and other DNS protocols'
date = '2024-10-12'
draft = false
tags = ['dns', 'unifi']
categories = ['Homelab']
image = '/images/posts/stamp.jpg'
featuredImage = '/images/posts/stamp.jpg'
featuredImagePreview = '/images/posts/stamp.jpg'
+++

My home network has been protected by NextDNS for a number of years so I was excited to see recent Unifi code updates added a DNS Shield feature. It was a new feature to support DNS-over-HTTPS (DoH) tunneling of Internet DNS queries. Previously this was accomplished by installing a special package for your Internet router, but a native solution might have other benefits. The "Auto" option locks in to a specific backend provider but there is an option to manually pick a configuration. It did have one limitation out the box by [only offering 3 NextDNS options](https://help.nextdns.io/t/h7y3adj/2024-ubiquiti-dns-shield-configuration-issue) in the GUI.

Later releases added a "Custom" option with an unusual "DNS Stamp" text input. The inline help adds "Enter the DNS Stamp URL obtained from your DoH provider or use a stamp calculator." Hmm, okay, what does that mean? Should I find a specific URL for my custom NextDNS profile or figure out stamp encoding?

## Calculator

DNS Stamps are not a new thing but are encoded text strings not easy on the human eye. The [online DNS Stamp calculator](https://dnscrypt.info/stamps/) explains it succinctly, "DNS Stamps encode all the parameters required to connect to a secure DNS server as a single string." Alright that helps, it's a thing to make application configurations easier. Despite Unifi calling out DoH in their feature other protocols such as DNSCrypt, DNS-over-TLS, DNS-over-QUIC, and others. Do those work too?

With that information and looking through the NextDNS portal, they made it easy. Under the Setup Guide for Linux, a configuration snippet for DNSCrypt including a stamp.

```
server_names = ['NextDNS-abc123']

[static]
  [static.'NextDNS-abc123']
  stamp = 'sdns://AgEAAAAAAAAAAAAOZG5zLm5leHRkbnMuaW8HL2FiYzEyMw'
```

Feeding this into the stamp calculator shows it should work.

* Protocol DNS-over-HTTPS (DoH)
* Hostname dns.nextdns.io
* Path /abc123
* DNSSEC enabled

## Other Providers

What are the stamps for other providers? If you have the setup information for a public resolver already, you can use the calculator to generate the DNS Stamp directly. But after a little more digging I found [Lists of public DNSCrypt and DoH Servers](https://github.com/dnscrypt/dnscrypt-resolvers) pre-generated and published. I still feed the stamp into the calculator to verify the stamp before using it.
