Title: Automatic weld seam segmentation for industrial quality control
Date: 2026-08-27 09:00
Slug: automatic-weld-seam-segmentation-industrial-quality-control

Visual inspection of welded components is still mostly done manually in many industrial production processes. This is especially true for custom operator cabins for special-purpose machinery, where weld seams have to be checked across different components and under different conditions.

In South Tyrol, computer vision is still not widely used by SMEs to tackle this kind of problem. There are not that many people with the right expertise, and from a company's point of view it can be difficult to justify investing in a technology when the return is not immediately obvious.
This is where the [EDIH](https://noi.bz.it/it/chi-siamo/gli-attori-del-noi/dih-edih)[^edih] funding helped. It gave us the chance to work directly with an SME, take a real production problem, and see how far we could get with a computer vision solution outside a controlled lab environment.

Together with Simone Garbin and Marco Todescato, we worked on automatic weld seam segmentation using both RGB and polarimetric imaging. 

<figure markdown="1">
![Six polarimetric maps of a weld, with the ground-truth outlines]({static}/images/polar.jpg)
<figcaption>The same weld seen through six per-pixel polarimetric maps (intensity, AoLP, DoLP, I<sub>max</sub>, I<sub>min</sub>, specular), with the ground-truth outline in green.</figcaption>
</figure>


The work was carried out in our labs at [Fraunhofer Italia - IEC](https://www.fraunhofer.it/), comparing CNN-based models such as YOLOv8 and YOLOv11 with transformer-based architectures including RF-DETR and Mask2Former.

<figure markdown="1">
![Comparison between YOLOv11 and RF-DETR on a close-range weld]({static}/images/comparison_yolo_transformers.jpg)
<figcaption>Close-range test, both models trained on controlled RGB images only: YOLOv11-n misses the seam entirely (mask IoU 0.00), while RF-DETR-Seg-S finds it (mask IoU 0.81). Green: ground truth; dashed red: prediction.</figcaption>
</figure>

One of the first things we realised was that the same weld can look very different depending on how and where the image is taken. With controlled RGB images, the CNN models reached a mean mask mAP50[^map] of up to 0.87. Once we moved to images taken under less controlled conditions, performance dropped quite a lot, to between 0.22 and 0.48.

So the acquisition setup turned out to matter almost as much as the model itself. We also tested polarimetric imaging,[^polar] which was much less affected by the uncontrolled conditions and reached a mean mask mAP50 of up to 0.93.

Then came another problem: what happens when the camera moves? We tested the models on a close-range dataset acquired at around 10 cm from the weld, corresponding to the geometry expected for a robot-mounted camera. This was probably the clearest difference we found between the architectures: transformer-based models, especially RF-DETR, retained high accuracy, while the CNN models struggled to generalize to the new viewpoint.

<figure markdown="1">

| Model | Architecture | Mask mAP50 |
|---|---|---|
| RF-DETR-Seg-S | Transformer | 0.842 ± 0.015 |
| Mask2Former (Swin-S) | Transformer | 0.406 ± 0.050 |
| YOLOv11-s | CNN | 0.168 ± 0.037 |
| YOLOv11-n | CNN | 0.116 ± 0.005 |
| YOLOv11-m | CNN | 0.102 ± 0.011 |
| YOLOv8-s | CNN | 0.081 ± 0.005 |

<figcaption>Zero-shot results on the close-range test set (62 images, about 10 cm from the weld). All models were trained on controlled RGB images only, with no fine-tuning; mean ± standard deviation over three training seeds (Table 4 of the preprint).</figcaption>
</figure>

The preprint is now available [here](https://arxiv.org/abs/2608.25465).

[^edih]: European Digital Innovation Hub: EU-funded hubs that help SMEs and public bodies adopt digital technologies such as AI.
[^polar]: A polarization camera (here a Baumer PolarSens) records how light reflected by a surface is polarized, which depends on the surface's geometry, roughness and material. On shiny metal this suppresses glare and reveals cues that a regular RGB image misses.
[^map]: Mean Average Precision at an IoU threshold of 0.5: a predicted mask counts as correct when it overlaps the ground truth by at least 50%. 1.0 is a perfect score.
