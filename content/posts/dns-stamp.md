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

DNS Stamps are not a new thing but are encoded text strings not easy on the human eye. The [online DNS Stamp calculator](https://dnscrypt.info/stamps/) explains it succinctly, "DNS Stamps encode all the parameters required to connect to a secure DNS server as a single string." Alright that helps, it's a thing to make application configurations easier. Despite Unifi calling out DoH in their feature, there are other protocols such as DNSCrypt, DNS-over-TLS, DNS-over-QUIC. Do those work too?

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

## Common Stamps

An [extensive list of public resolvers](https://github.com/DNSCrypt/dnscrypt-resolvers/blob/master/v3/public-resolvers.md) is published through GitHub.

For quick reference a few are below.

### Google 8.8.8.8

```
  stamp = 'sdns://AgUAAAAAAAAABzguOC44LjggsKKKE4EwvtIbNjGjagI2607EdKSVHowYZtyvD9iPrkkHOC44LjguOAovZG5zLXF1ZXJ5'
```

Feeding this into the stamp calculator shows it should work.

* Protocol DNS-over-HTTPS (DoH)
* Hostname 8.8.8.8
* Path /dns-query
* DNSSEC enabled
* No filter

### Cloudflare 1.1.1.1

```
  stamp = 'sdns://AgcAAAAAAAAABzEuMS4xLjEABzEuMS4xLjEKL2Rucy1xdWVyeQ'
```

Feeding this into the stamp calculator shows it should work.

* Protocol DNS-over-HTTPS (DoH)
* Hostname 1.1.1.1
* Path /dns-query
* DNSSEC enabled
* No filter
* No logs

## Other Providers

You can Check the list for other providers but don't forget you can make your stamp of interest.  Regardless, feed the stamp into the calculator to verify the stamp before using it.
