+++
title = 'What is my IP?'
description = 'simple project and google search rankings'
date = '2026-02-19'
draft = false
tags = ['dns', 'web']
categories = ['Technical']
featuredImage = '/images/posts/what-is-my-ip.png'
featuredImagePreview = '/images/posts/what-is-my-ip.png'
+++

For a while, I've wanted to spin up a "What is my ip address?" kind of site at work.  Hitting a quick website to get your address is usually easier than trying to explain commands and GUI elements, especially over all the different operating system variants.  So it doesn't need to be complicated but it could tap into the wealth of network knowledge abstracted from users.

## First Approach

At the start, the concept was loosely flushed out already.  I needed a website that could detect the IP address a client used to connect.  There were a few examples floating around on the Internet, especially in PHP parsing data out of the HTTP headers.

```php
<?php
echo "Your IP Address is: " . $_SERVER['REMOTE_ADDR'];
?>
```

### Web Proxy Detection

An added goal was dealing with various web proxies in the environment.  A standard web proxy service was available but there were also a number of smaller cases where the client address could be obscured.  This lead to logic to parse the forwarding headers in the HTTP request.

```php
<?php
// Example of checking multiple headers
function get_client_ip() {
    $keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
    foreach ($keys as $key) {
        if (!empty($_SERVER[$key])) {
            // Take the first IP if multiple are present in X-Forwarded-For
            return trim(explode(',', $_SERVER[$key])[0]);
        }
    }
    return '0.0.0.0';
}
?>
```

Pulling this logic together with a simple web template rendered a workable tool.

## Second Approach

The next iteration was a complete rewrite.  I had focused to do all new development in Python and saw no reason to stick with PHP.  Using a Flask framework would keep the overhead of the site down but provide some structure.

### Security and Privacy

While adding additional data to the site would be useful to the intended users, it could also be useful to opportunistic abusers.  An approach to separate the two cases was required.  The simplest approach would be the best place to start, which was locking down all data displayed to be only about the actual client IPs talking to the site.  It was tempting to provide an API to lookup other IP addresses, as several early users actually requested, but that had to be a strict policy of "no".

Care was also needed to apply this logic to the HTTP Forwarding data.  The proxy logic used in the first approach would become a threat to this 'client ip only' restriction.  Therefore, it was simplified and mostly removed from the tool.

To mitigate accidental disclosures, a simple "isCampusAddress" check was added before interacting with additional systems of backend data.  This should also speed up the site since it is public accessible and those campus details wouldn't even be applicable to Internet users.

### IPAM Information

The IPAM database is a central tool that tracks what IP networks and vlans are provisioned on campus.  A search of a client IP there would provide all details about the specific network containing the client but also any associated DNS or DHCP data.  While I played with showing "network owner" or "gateway" type of information it seemed better to simplify the website and leave those details out.

### IP Location

A common useful piece of information on these types of sites is pinpointing a physical location of the source IP address.  An external service was needed and multiple were considered but cost narrowed options to three below.

The [ipapi](https://ipapi.co) was a decent first option for location data.  It provides an API with 30,000 free IP lookups per month.  No API key is required and SSL is available.  Given the uncertainty of how many queries the site would actually make, this was back-burnered as an option.

The [IP Geolocation API](https://ip-api.com) was a good option.  It is free for non-commercial use and no API key is required. It provides location information down to city level, but in practice seemed to be a bit "off" with pinning the actual location.  You can report bad location information for individual IP addresses or network CIDR blocks but they didn't seem to have an affect on the data.  Their site limits to 45 requests per minute and SSL is not available on the free tier.

The [iplocation.net](https://iplocation.net) site provides a number of tools with API options.  It is available for free but provides location information only at the Country level.  Lacking City data was a bummer, but it really wasn't necessary due to a focus just on campus addresses.

#### Map Display

A visual map on the page would be a nice addition, fed with the geolocation information.  Finding a "free" option was not too hard.

The quick and free option was [Leaflet](https://leafletjs.com/) since we already had it up on a different tool.  It worked fine but lacked the "plot by street address" we really needed.

That led to the second option, Google Maps API.

### Dual Stack Detection

A big part of this iteration was setting the site up for better dual stack detection.  It was a simple thing, but required some manipulation of DNS records.

| DNS Name | Records Provided |
| --- | --- |
| whatismyip.unc.edu | A and AAAA |
| ipv4.whatismyip.unc.edu | A |
| ipv6.whatismyip.unc.edu | AAAA |

When the client first connects to the site, it has the option to use either the IPv4 A record or the IPv6 AAAA record.  This is the information needed to tell the site what the client "preferred" to use.  Reality could be a little complicated but in general clients check IPv6 first then fall back to IPv4 if necessary.

### DNS Detection

Something a few public sites offer is a "DNS Leak Test".  This usually a privacy centric test but it also provides useful information.

### Network Access Control

Tapping into the lower level network details was a bit of a challenge but ultimately not difficult.  A few additional routines allowed querying the Network Access Control to identify the physical connectivity of the device, which could be a wired switch or wireless access point.  That in turn provided deeper geolocation information and ultimately a street address that could be plotted on a map.

### Speedtest Integration

Since we already operate a Ookala Speedtest server, it was easy to add a custom widget to the site.  By default the free tier of their service does not allow you to pin the custom widget to a specific server but it does attempt to use the closest by default.

### Google Search

I have underestimated a domain’s impact on search engine optimization. My small project for a “what’s my ip” type of site has shot to 6 or 7 on Google. Most of the data is only displayed for on-campus devices but it can still check Internet addresses.

<https://whatismyip.unc.edu>

![search results](/images/posts/what-is-my-ip-search.png)
