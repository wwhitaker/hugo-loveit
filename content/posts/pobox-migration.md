+++
title = 'Pobox Lifelong Email'
description = 'Migration from Pobox to Fastmail and the end of an era'
date = '2024-10-28'
draft = false
tags = ['email', 'pobox', 'fastmail']
categories = ['Personal']
image = 'https://defingo.net/images/blogs/mailbox.jpg'
+++

Going off to college is a hallmark time of new discoveries. In the 90s technology was booming and email was one of those discoveries. Through my undergrad time my campus email address was used for everything. Talking to classmates and professors, using online services, or just keeping in touch with high school friends off at different schools was a daily routine. Eventually, approaching graduation, I came to realize my campus email was not going to last forever. Oh no, everyone and everything was going to need updating.

Around November 1998 friends let me know about this very interesting email service called [Pobox.com](https://pobox.com/). They offered a "Pobox Lifetime Email account" so you'd never have to change addresses again. This sounded great so I gave them $100 and onboarded. They offered a flexible system of email forwarding, robust SPAM filtering, and SMTP gateway options. The SPAM filtering was robust at the time with advanced options to hold messages at their servers before releasing it to my email destination. It was great and I was hooked, years passed by.

Eventually I managed to make it overcomplicated and documented it. I had Gmail as my longtime "primary" email location, adding ProtonMail as "secondary" when it came on scene. Services I didn't monitor such as Yahoo could use native forwarding to Pobox but could easily become my new "primary" location with a couple quick changes. Any local application that needed outbound SMTP could connect directly through Pobox.

![pobox forwarding diagram](/images/blogs/email.png)

Fast forward to November 2015 and [Fastmail acquires Pobox](https://www.fastmail.com/blog/fastmail-acquires-pobox-and-listbox/). The promise was to continue operating Pobox with no significant changes. Things are still great. I come to accept my @pobox.com email address has been leaked on numerous lists, making me a bigger spam target. Even with that the spam filters and advanced options to hold or bounce bad messages were effective in preventing overload.

![email stats](/images/blogs/pobox_stats_2019-01.jpg)

SPAM prevention continue to evolve while SPF, DKIM, and DMARC came on the scene. These methods added complexities to email forwarding services but things continue to work with Pobox.

Another shift was slowly appearing around this time. Services were offering "hidden" email address that forward instead of a single "lifetime" address. A person can keep a more permanent address "secret" while handing out randomly generated addresses. I signed up for a few different platforms and had varying degrees of success.

It also became obvious a person was better off owning their own DNS domain. That way a permanent address wouldn't be tied to a specific service and could be separated and moved. I owned a few domains but settled on using @defingo.net for my main email. Fortunately Pobox had long supported custom email domains so it was easy to onboard and start using it as my "permanent" address. DNS settings were trivial with their documentation.

That leads us to October 2024 when the official word arrived. All Pobox customers were being migrated to Fastmail and needed to review the [Guide to Fastmail for Pobox users](https://www.fastmail.help/hc/en-us/articles/9822848635919-Guide-to-Fastmail-for-Pobox-users). A "lifetime" forwarding service like Pobox has technical challenges and has fallen out of fashion with modern users. The old-timers like myself were anxious about SPAM and change in general. Is that not why we signed up for Pobox?

I have since migrated to [Fastmail](https://fastmail.com/) fully, paying more than before, but it has gone well so far. The SPAM filtering is different and needed tuning again but still seems effective. Native support for masked email addresses is a nice touch. Time will tell if Fastmail can live up to "lifelong" email claim of its predecessor. Luckily swinging my personal domain to a different email provider should be trivial.

Fastmail added to their 2024 blog more technical details about [Sunsetting Pobox](https://www.fastmail.com/blog/sunsetting-pobox/). It is worth a read to anyone familiar with their service or just like technical product histories.
