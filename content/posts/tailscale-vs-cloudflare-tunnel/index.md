+++
title = 'Tailscale or Cloudflare Tunnel for Family Apps'
description = 'Reaching a home server from mobile apps without asking everyone to run a VPN'
date = '2026-10-15'
draft = false
tags = ['homelab', 'networking', 'cloudflare', 'tailscale']
categories = ['Homelab']
+++

I was talking recently with someone who had built an app for their household, with the backend on a server at home. To reach it from everyone's phones, they put the whole family on Tailscale. It works, and it's secure, but it wasn't a hit with everyone. The app only worked while the VPN was on, the VPN was easy to switch off by accident, and nobody wants to troubleshoot "is the VPN connected?" before checking the grocery list.

I suggested a Cloudflare Tunnel with service credentials instead. I use both at home, and they solve different problems.

## Two Different Approaches

**Tailscale** puts each device on a private network with your server. Nothing at home is exposed to the Internet. Every phone, tablet and laptop that needs access runs the Tailscale client and signs in, and the app talks to the server's private address.

**Cloudflare Tunnel** gives the server a public name, like `app.example.com`, without opening any ports. A small `cloudflared` connector at home makes an outbound connection to Cloudflare, and Cloudflare forwards requests for that name through it. On its own that would make the app public, so you put **Cloudflare Access** in front of it. Access checks every request before it ever reaches your house.

For an app you wrote yourself, Access can use a **service token**: a client ID and secret the app sends as two HTTP headers. Requests without them are turned away at Cloudflare. The family just opens the app.

| | Tailscale | Cloudflare Tunnel + service token |
| --- | --- | --- |
| What each device needs | Tailscale app, signed in, VPN on | Nothing extra |
| Exposed to the Internet | Nothing | A hostname, guarded by Access |
| Who can connect | Devices on your tailnet | Requests carrying a valid token (or a person passing an Access login) |
| Works alongside a work VPN | Often not; phones run one VPN at a time | Yes, it's ordinary HTTPS |
| Protocols | Anything: SSH, SMB, databases, web | HTTP(S) and WebSockets for apps like this |
| Who sees the traffic | Only your devices; it's end-to-end encrypted | Cloudflare terminates TLS, so it can see requests |
| Cost for a family | Free tier | Free tier (Zero Trust is free for up to 50 users) |
| Needs a domain | No | Yes, using Cloudflare for its DNS |

> **Use Tailscale for yourself and Cloudflare Tunnel for everyone else.**

I still use Tailscale for my own remote access: SSH, admin pages, the whole home network through a subnet router. But for an app other people use on their phones, asking them to manage a VPN is the wrong trade. A tunnel with a service token turns it back into "open the app and it works."

## Setting Up the Cloudflare Side

You need a domain whose DNS is hosted on Cloudflare (moving the nameservers is free), and a free Cloudflare Zero Trust account, which the dashboard sets up the first time you open it. Cloudflare renames dashboard menus fairly often, so the labels below may differ slightly.

### 1. Create the service token first

Do this before the app has a public name, so there's never a moment where it is open.

1. In Zero Trust, go to **Access → Service credentials → Service Tokens** and choose **Create Service Token**.
2. Name it after who or what uses it, for example `family-app-ios`.
3. Pick a duration. A year is reasonable; put the expiry date on your calendar.
4. Copy the **Client ID** and **Client Secret**. The secret is shown only once.

One token per device type (or per person) is worth the little extra effort. If a phone is lost, you revoke that one token and nobody else is affected.

### 2. Create the Access application

1. Go to **Access → Applications → Add an application → Self-hosted**.
2. Name it and add the public hostname it will protect, for example `app.example.com`.
3. Add a policy with the action **Service Auth**, and under **Include** choose **Service Token** and select the token from step 1.
4. Optionally add a second policy with the action **Allow** for your own login (email one-time PIN, or Google), so you can still open the app in a browser.

**Service Auth** is the important part. An ordinary **Allow** policy sends anyone without a session to a login page, which a mobile app can't follow. **Service Auth** checks the headers and answers anything without them with an error, so a missing or wrong token fails fast.

### 3. Create the tunnel

1. Go to **Networks → Tunnels** and choose **Create a tunnel**, type **Cloudflared**.
2. Name it after the machine it runs on, for example `home-server`.
3. Cloudflare shows install commands with a tunnel token. On a Docker host the simplest is a small compose file:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    restart: always
```

Put the token in an `.env` file next to it rather than in the compose file. Anyone with that token can run your tunnel. Within a minute the tunnel should show as **Healthy** in the dashboard.

### 4. Publish the app through the tunnel

In the tunnel's settings, add a **published application route** (older screens call it a public hostname):

* **Subdomain and domain:** `app` and `example.com`
* **Service:** where the app listens, from the connector's point of view, for example `http://192.168.1.20:8080`

Cloudflare creates the DNS record itself. Because the Access application from step 2 already covers that hostname, it is protected from the first request.

Use an IP address for the service if your home DNS has wildcards or might change. A hostname that stops resolving is a quiet way to end up sending traffic somewhere you didn't intend.

### 5. Test it before touching the app

```sh
# Without the token: Access should refuse it
curl -i https://app.example.com/

# With the token: the request reaches your server
curl -i https://app.example.com/ \
  -H "CF-Access-Client-Id: <client id>" \
  -H "CF-Access-Client-Secret: <client secret>"
```

The first should come back from Cloudflare as a `403`, or as a redirect to the Cloudflare login page if you added the browser policy, and never appear in your server's logs. The second should look exactly like a request made at home.

### 6. Send the headers from the app

Every request the app makes needs the two headers. In Swift, for example:

```swift
var request = URLRequest(url: URL(string: "https://app.example.com/api/items")!)
request.setValue(clientID, forHTTPHeaderField: "CF-Access-Client-Id")
request.setValue(clientSecret, forHTTPHeaderField: "CF-Access-Client-Secret")
```

Setting them once on a shared `URLSession` configuration (`httpAdditionalHeaders`) saves adding them to every call.

## Things to Know

* **The token is a shared secret inside the app.** Anyone who pulls it out of the app can get past Access, though they still hit your app's own login. Keep a real login in the app, use one token per device type so you can revoke them separately, and rotate them before they expire.
* **Tokens expire.** When one does, the app stops working with a Cloudflare error, not your app's. Calendar the expiry date.
* **Cloudflare sits in the middle.** It terminates TLS, so it can see the traffic. For a grocery list or a family calendar that's a fine trade. For something sensitive, Tailscale keeps it between your own devices.
* **Mind what you send.** Cloudflare's free plans are meant for web and API traffic. Streaming large video files through a tunnel is outside what they're intended for.
* **Your server can double-check.** Requests that pass Access arrive with a signed `Cf-Access-Jwt-Assertion` header. Verifying it on the server means nothing that skips Cloudflare, even from inside your network, gets in.

## Wrapping Up

Tailscale and Cloudflare Tunnel aren't really competitors. Tailscale is the better way to put *you* on your home network. A tunnel with a service token is the better way to put an *app* on the Internet for people who shouldn't have to know what a VPN is. A family app is the second kind, and the people using it shouldn't have to think about how it gets home.
