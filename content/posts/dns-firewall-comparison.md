+++
title = 'DNS Firewall Comparison'
description = 'A detailed analysis comparing DNS firewall products'
date = '2025-04-07'
draft = false
tags = ['dns', 'firewall', 'security']
categories = ['Technical']
image = '/images/blogs/michael-geiger-JJPqavJBy_k-unsplash.jpg'
featuredImage = '/images/blogs/michael-geiger-JJPqavJBy_k-unsplash.jpg'
featuredImagePreview = '/images/blogs/michael-geiger-JJPqavJBy_k-unsplash.jpg'
+++

Recently I discovered this article about testing the effectiveness of public DNS malware filters. The details are appreciated as this type of comparison is not given due attention.

* [Public DNS malware filters tested in September 2024](https://techblog.nexxwave.eu/public-dns-malware-filters-tested-in-september-2024/)

It reminded me to write up something I had been putting off sharing.

## Background

I executed a DNS Firewall analysis back in 2017 with a similar methodology. Instead of focusing on free products, it evaluated three different commercial offerings. The results were only shared with the venders but anonymously they are still worth discussion.

This type of analysis is interesting because large environments will have a budget to afford something better than a 'free' tier but not enough to run multiple products in parallel. Leveraging overlapping trial periods facilitates a real apples-to-apples comparison. Security providers are fond of their products and will parade their features but how can you really know what they would do differently given the exact same inputs?

## Contenders

The anonymous products can be summarized as below. Tuning configuration options were kept at defaults for the most part.

* Product A - brand new cloud product backed by an established company
* Product B - existing cloud product with a well established company and a "top tier" reputation
* Product C - existing mixed cloud and local based solution with a well established company

Product C had a very clear delineation between two tiers of service but ultimately testing showed one was a subset of the other with lesser technical implementation requirements.

## Test Methodology

The 2017 test plan was simple and was repeated over five consecutive days during business hours.

1. Sample production traffic, collect 1 million Internet DNS queries
2. Replay DNS queries simultaneously to each vendor product
3. Record responses and identify block actions
4. Compare and analyze block data

The first choice to use real traffic deviated from what I had seen in other testing. Starting with a "known bad" list of domains made it easy to compare results but that doesn't cover the "advanced" vendor features relying on proprietary analysis routines or customized threat feeds.

The second step to reply traffic needed to be as close to the real production traffic as possible. As such, a script was used to breakdown the inputs as soon as the collection process reached a target volume. An additional check to a non-blocking DNS service was used to help weed out any non-responsive DNS servers.

The third step was straight forward since the products had predictable behavior for a block action (i.e. an A record of 0.0.0.0 or block page IP address).

The fourth step required cross referencing each of the result sets looking for patterns or trends and proved to be the most time consuming.

## Block Agreement

After five days, 5 million DNS queries were tested against three vendor products. The deduplicated block counts are below and show a surprising low level of consensus.

![DNS Firewall Unique Blocks](/images/blogs/dns-firewall-blocks.png)

The first observation was the very low total block counts for each product. The most blocks seen in an individual run of 1 million input queries was 545 without deduplication. However the daily numbers were fairly consistent over the five day span within each product.

The second observation was the very low agreement between products. This was unexpected and required taking the results to each of the product vendors to get their feedback. Over the entire five day period, the three products only agreed on 21 unique domains to block. Each had more unique domain blocks than agreement with others. Products B and C had a closer agreement leaving A with a much smaller total block count.

## Considerations

Making a decision between products ultimately has to look at more than just a "who blocked more" total figure. When evaluating solutions several other factors had to be considered. But those block numbers are interesting to think about.

As mentioned, full results were shared with each product team and some provided a detailed review of the data. The most interesting was the response for Product A. In their view customers were more sensitive to impacting their production environments through false positives so the product was intentionally tuned very conservatively. Going forward they were going to add more customer tuning options.

Overall, I was still amazed at the low levels of agreement. I had expected some level of data sharing through various security feeds in the cybersecurity industry to result in some level of agreement. But that wasn't the case. My assumption was in bypassing the "known bad" approach of testing we were relying more heavily on those "extra" features in each product to detect bad actors.

## Conclusion

When it was all said and done, cost became the major factor as each solution was "better" than what was currently in place. I would however like to do a deep dive on this comparison again, assuming I could line up multiple vendor trials at the same time.
