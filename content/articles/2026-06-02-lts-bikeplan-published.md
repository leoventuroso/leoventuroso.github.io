Title: LTS-BikePlan is out
Date: 2026-06-02 09:00
Slug: lts-bikeplan-published

Our paper "[LTS-BikePlan: A Data-Driven Tool for Enhancing Cycling Infrastructure and Safety](/publications/)" is now published in the *Journal of Urban Technology*. It's a data-driven tool for evaluating and improving cycling infrastructure, grown out of open data and my master's thesis work.

The code is [on GitHub](https://github.com/dclfbk/LTSBikePlan), for anyone who wants to poke around. In short: it's a Python CLI pipeline that pulls a city's street network straight from OpenStreetMap, layers a DEM on top to get slope, and classifies every edge and node by Level of Traffic Stress (LTS), basically a proxy for "would a normal person actually feel safe cycling here". Run something like `ltsbikeplan run-full --city "Bolzano, Italy" --with-report` and it spits out stress maps, a choropleth, gap/cluster/network analysis, and even an accident overlay if you feed it the data, all wrapped up in a Markdown/HTML report.

Under the hood it leans on `geopandas`, `osmnx`, `networkx` and `rasterio` for the geospatial heavy lifting and `scikit-learn` for the analysis bits, and it's released under the WTFPL, about as permissive as licenses get.

![descrizione immagine]({static}/images/lts_bikeplan_1.jpg)

Let me know what you think about it!