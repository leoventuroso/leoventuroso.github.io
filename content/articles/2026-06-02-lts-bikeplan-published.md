Title: LTS-BikePlan is out
Date: 2026-06-02 09:00
Slug: lts-bikeplan-published

Our paper "[LTS-BikePlan: A Data-Driven Tool for Enhancing Cycling Infrastructure and Safety](/publications/)" is now published in the *Journal of Urban Technology*. It's a data-driven tool for evaluating and improving cycling infrastructure, grown out of open data and my master's thesis work.

The code is [on GitHub](https://github.com/dclfbk/LTSBikePlan), for anyone who wants to poke around. In short: it's a Python CLI pipeline that pulls a city's street network straight from OpenStreetMap, layers a DEM[^dem] on top to get slope, and classifies every edge and node by Level of Traffic Stress (LTS),[^lts] basically a proxy for "would a normal person actually feel safe cycling here".

| Level | Who would comfortably ride there |
|---|---|
| LTS 1 | Almost anyone, children included |
| LTS 2 | Most adults |
| LTS 3 | Enthused and confident cyclists |
| LTS 4 | Only strong and fearless cyclists |

Run something like

```sh
ltsbikeplan run-full --city "Bolzano, Italy" --with-report
```

and it spits out stress maps, a choropleth, gap/cluster/network analysis, and even an accident overlay if you feed it the data, all wrapped up in a Markdown/HTML report.

Under the hood it leans on `geopandas`, `osmnx`, `networkx` and `rasterio` for the geospatial heavy lifting and `scikit-learn` for the analysis bits, and it's released under the WTFPL,[^m-wtfpl] about as permissive as licenses get.

![Two maps of Trento: the eight cycling network gaps found by the tool, and their classification as street or bridge gaps]({static}/images/lts_bikeplan_1.jpg)

Let me know what you think about it!

[^lts]: The LTS classification was introduced by Mekuria, Furth and Nixon in *Low-Stress Bicycling and Network Connectivity* (Mineta Transportation Institute, 2012).
[^dem]: Digital Elevation Model: a raster of terrain heights, used here to compute the slope of every street segment.
[^m-wtfpl]: "Do What The F\*ck You Want To Public License". The license text is barely longer than its name.
