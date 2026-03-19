+++
title = 'Personal website for William E. Whitaker, Jr'
description = 'I am an information systems professional with broad background in network support, system administration and software development focused on security topics.'
+++

## Infrastructure that stays understandable

I build and support networks, systems, and service operations with a focus on reliability, security, and practical automation. This site collects project work, field notes, and the operational details behind the environments I run.

{{< home-name-origin >}}

{{< home-actions
primary_label="View Projects"
primary_url="/projects/"
secondary_label="About Me"
secondary_url="/about/"
tertiary_label="Read Posts"
tertiary_url="/posts/"
>}}

{{< home-focus-grid >}}
{{< home-focus-card
icon="fas fa-network-wired"
title="Network Operations"
description="Campus and edge networking work shaped around uptime, observability, and clear operational ownership."
>}}
{{< home-focus-card
icon="fas fa-shield-alt"
title="Security and Resilience"
description="Practical hardening, DNS and policy controls, and service design that reduce surprises in production."
>}}
{{< home-focus-card
icon="fas fa-code-branch"
title="Automation and Tooling"
description="Small software and integration work that makes infrastructure easier to operate, monitor, and explain."
>}}
{{< /home-focus-grid >}}

## Live Operations

A quick snapshot of the services I actively monitor and maintain.

{{< uptime-kuma-status title="Service Health" apiPath="/api/kuma-status" >}}
