+++
title = 'Projects'
description = 'Ongoing projects'
date = '2026-03-08'
draft = false
comment = false
url = '/projects/'
+++

## Projects That Ship Useful Outcomes

I build practical tools for network operations, observability, and data quality. Most projects start with a real production pain point and end as reusable automation.

{{< project-stats
stat1_value="3"
stat1_text="active public projects"
stat2_value="4"
stat2_text="core platforms: Django, Python, AKiPS, InfluxDB"
stat3_value="100%"
stat3_text="focused on operational visibility and automation"
>}}

{{< project-grid >}}
{{< project-card
title="OCNES Dashboard"
featured="true"
eyebrow="Featured"
image="/images/projects/dashboard.png"
alt="OCNES Dashboard"
description="Adding a dashboard layer to the AKiPS monitoring tool."
tech="Django, AKiPS"
link1_url="<https://github.com/unc-network/dashboard>"
link1_icon="fab fa-github"
link1_label="View OCNES Dashboard on GitHub"
link1_text="GitHub"
>}}

{{< project-card
title="AKiPS Python Module"
image="/images/projects/akips-logo.jpg"
alt="AKiPS Logo"
description="PyPI module providing a Python wrapper for the native AKiPS API."
tech="Python, AKiPS"
link1_url="<https://github.com/unc-network/akips>"
link1_icon="fab fa-github"
link1_label="View AKiPS Python Module on GitHub"
link1_text="GitHub"
link2_url="<https://pypi.org/project/akips/>"
link2_icon="fas fa-box-open"
link2_label="View AKiPS package on PyPI"
link2_text="PyPI"
>}}

{{< project-card
title="Speedtest to InfluxDB v2"
image="/images/projects/speedtest.png"
alt="Speedtest to InfluxDB"
description="Run and save Speedtest CLI data to InfluxDB2."
tech="Python, InfluxDB"
link1_url="<https://github.com/wwhitaker/speedtests>"
link1_icon="fab fa-github"
link1_label="View Speedtest to InfluxDB on GitHub"
link1_text="GitHub"
>}}
{{< /project-grid >}}
