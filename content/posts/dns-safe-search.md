+++
title = 'DNS Safe Search Enforcement'
description = 'How to enforce safe search across your network using DNS'
date = '2025-07-19'
draft = false
tags = ['dns', 'security', 'network']
categories = ['Technical']
image = '/images/posts/post.jpg'
featuredImage = '/images/posts/post.jpg'
featuredImagePreview = '/images/posts/post.jpg'
+++

Multiple options exist to enable and enforce safe searching at both application and account levels. If you want to enforce it over an entire network you will need to look at DNS records.

Each of these are interesting as you are overriding actual Internet DNS records. As such, none of these work if the parent domain is utilizing DNSSEC signed zones.

## Google

Enforce Google safe search by defining the CNAME below on your local network.

```
www.google.com CNAME forcesafesearch.google.com
```

## Bing

Enforce Bing safe search by defining the CNAME below on your local network.

```
www.bing.com CNAME strict.bing.com
```

## Youtube

Youtube uses a number of different domains but you would create the same CNAME over them all. [Two modes](https://support.google.com/a/answer/6212415) are possible. "Strict" is the most restrictive while "Moderate" allows a larger number of content.

For Moderate Restricted YouTube access, CNAME each domain to `restrictmoderate.youtube.com`:

```
www.youtube.com CNAME restrictmoderate.youtube.com
m.youtube.com CNAME restrictmoderate.youtube.com
youtubei.googleapis.com CNAME restrictmoderate.youtube.com
youtube.googleapis.com CNAME restrictmoderate.youtube.com
www.youtube-nocookie.com CNAME restrictmoderate.youtube.com
```

For Strict Restricted YouTube, use `restrict.youtube.com` in the CNAME instead.

A test page can provide validation: [Check Content Restrictions](https://www.youtube.com/check_content_restrictions)

## DuckDuckGo

DuckDuckGo also needs a CNAME to enforce safe searching.

```
duckduckgo.com CNAME safe.duckduckgo.com
```
