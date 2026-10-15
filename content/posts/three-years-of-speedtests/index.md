+++
title = 'Three Years of Speedtests in InfluxDB'
description = 'What three years of results show, and the retention setting that nearly deleted them'
date = '2026-10-15'
draft = true
tags = ['homelab', 'speedtest', 'influxdb', 'grafana']
categories = ['Homelab']
+++

In 2024 I wrote about [forking a speedtest project to write to InfluxDB 2](/posts/speedtest-to-influxdb/). It has been running ever since in a container on my NAS, and the data goes back to October 2023. This month I nearly lost the start of it.

## The Retention Trap

When I created the `speedtests` bucket I gave it a three-year retention, which felt generous at the time. While auditing my InfluxDB buckets, I noticed the oldest data was from 2023-10-09. Three years later is this month. InfluxDB was about to start deleting my history a week at a time.

> **Check your bucket retention against your oldest data, not against what felt reasonable when you created it.**

The fix took one click: Load Data, Buckets, `speedtests`, Settings, retention **Never**. The bucket is small, so keeping it forever costs almost nothing.

## What the Data Shows

Over the last 90 days:

| Metric | Average | Best |
| --- | --- | --- |
| Download | 560 Mb/s | 592 Mb/s |
| Upload | 22.1 Mb/s | 23.9 Mb/s |
| Ping | 32.6 ms | |
| Uptime (high-frequency ping) | 99.8% | |

That's better than the 500/20 plan I pay for. There was one visible event: latency jumped to around 100 ms for about a week at the end of August, then returned to normal on its own.

The tests also use real bandwidth. In 90 days they downloaded 471 GB and uploaded 11 GB, working out to a test about every three hours. Each test briefly fills my 20 Mb/s upload, so it competes with offsite backup uploads if they coincide.

## A Schema Mistake I Made

The audit showed the `speedtests` bucket had over 39,000 series, for about 7,900 tests. That's a cardinality problem, and it's my own doing.

In InfluxDB, **tags** are indexed and every unique combination of tag values creates a new series. **Fields** are just values. My writer stores `speedtest_id` and `speedtest_url` as tags, and both are unique for every test. So every test creates new series that will never be written to again.

At seven tests a day it isn't hurting anything yet, but it grows forever now that the retention is "never". Those two belong in fields. The fix is in the writer, and existing data could be rewritten into a new bucket with a Flux query if it ever matters.

## Other Buckets Worth Checking

The same audit found my `unifi` bucket writing about 650,000 points an hour, roughly two-thirds of the disk, with no dashboard reading it: my UniFi dashboard uses Prometheus instead. I cut it to 90 days. A `telegraf` bucket was keeping a full year of the InfluxDB container's own CPU stats.

A read-only InfluxDB token (Read on Buckets only) was all it took to list every bucket's retention and write rate.

## Wrapping Up

Long-running homelab data is easy to take for granted until it's gone. Check your retention settings once a year, especially for the data you'd most hate to lose, and keep unique IDs out of your tags.
