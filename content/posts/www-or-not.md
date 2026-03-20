+++
title = 'To WWW or not to WWW'
description = 'Understanding and enforcing www domain conventions'
date = '2025-01-21'
draft = false
tags = ['dns', 'cloudflare', 'web']
categories = ['Homelab']
image = '/images/posts/spiderweb.jpg'
featuredImage = '/images/posts/spiderweb.jpg'
featuredImagePreview = '/images/posts/spiderweb.jpg'
+++

Have you surfed the web lately? That would be the world wide web and origin of the "www" you often see in the URL of your web browser. A few decades ago it was the norm but slowly new conventions arise and people's expectations change.

Today websites with and without the "www" are common considering they almost always respond with the same content. One is synonymous with the other but there is usually an obscured name preference. The difference comes down to the convention adopted by content providers. Web browsers have gotten in on the act too and enforce their own standard such as Chrome's 2018 decision to [strip www from the browser's address bar](https://www.bleepingcomputer.com/news/google/chrome-69-removing-www-and-m-subdomains-from-the-browsers-address-bar/).

## Technically not the Same

At the lowest levels slightly different configurations are needed and as you would expect DNS is at fault. Standards limit how a zone apex can be defined in zone files. It can point to an IP address but not another DNS name. A typical "www" has no such limitation. Using an IP address or name affects backend tooling who's job it is to distribute content from the source. For example a DNS name could utilize a DNS load balancer and content nodes spread around the world. Clients could resolve the website to an IP address for the content closest content node. But if an IP address is used, all clients will be sent to the same place. Even if not optimal either should work and be transparent to the end user.

## Preference of Major Sites

Fortunately today those design patterns are well known. Let's take a quick look to see what name preferences some prominent websites use today. We can poke a few major sites to get an idea what they prefer. Using `curl` to compare the https redirect location field is a simple way.

This first group provide redirects to a "www" subdomain for the website.

```
% curl -Is http://microsoft.com | grep Location
Location: https://www.microsoft.com/
```

```
% curl -Is http://google.com | grep Location
Location: http://www.google.com/
```

This second group omits "www" in their redirect.

```
% curl -Is http://ibm.com | grep Location
Location: https://ibm.com/
```

```
% curl -Is http://unc.edu | grep Location 
Location: https://unc.edu/
```

## Enforcing a Standard

For my personal site, I want to keep it old school and rely on "www" as my main web presence. But the next two sections will look at doing it both ways with Cloudflare DNS and Cloudflare Pages. Other products no doubt will be similar.

### Setup 1 - Prefer "www"

In this first case we will use "www". We can define a few behaviors and build a matrix to test with `curl`.

* Redirect port 80 (HTTP) to port 443 (HTTPS)
* Redirect any domain HTTP call to the "www" subdomain

| URL | Result | Destination |
|-----|--------|-------------|
| http://defingo.net | HTTP 301 | https://www.defingo.net/ |
| http://www.defingo.net | HTTP 301 | https://www.defingo.net/ |
| https://defingo.net | HTTP 301 | https://www.defingo.net/ |
| https://www.defingo.net | HTTP 200 | - |

Additionally let's add something to preserve any legacy content links that may exist. This occurs often with old printed material and is often a reason the www/non-www convention cannot be changed easily.

* Preserve the full path of the URL in the redirect

| URL | Result | Destination |
|-----|--------|-------------|
| http://defingo.net/blogs | HTTP 301 | https://www.defingo.net/blogs |
| http://www.defingo.net/blogs | HTTP 301 | https://www.defingo.net/blogs |
| https://defingo.net/blogs | HTTP 301 | https://www.defingo.net/blogs |
| https://www.defingo.net/blogs | HTTP 200 | - |

This is easily accomplished via two sections of the Cloudflare Dashboard.

### Setup 2 - Prefer non-WWW

This second case will prefer not using "www" for content. The simplest method just skips the step of adding a "www" subdomain in DNS, but you can keep a redirect with a few more rules. This may create a redirect chain.

| URL | Result | Destination |
|-----|--------|-------------|
| http://defingo.net | HTTP 301 | https://defingo.net/ |
| http://www.defingo.net | HTTP 301 | https://www.defingo.net/ |
| https://defingo.net | HTTP 200 | - |
| https://www.defingo.net | HTTP 301 | https://defingo.net |

## In the End

It just comes down to picking a name convention and being consistent. Either should work and usually probably won't even notice if the web browser is going to hide the "www" anyway.
