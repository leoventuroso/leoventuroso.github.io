Title: Automatic weld seam segmentation for industrial quality control
Date: 2026-08-27 09:00
Slug: automatic-weld-seam-segmentation-industrial-quality-control

Visual inspection of welded components is still mostly done manually in many industrial production processes. This is especially true for custom operator cabins for special-purpose machinery, where weld seams have to be checked across different components and under different conditions.

In South Tyrol, computer vision is still not widely used by SMEs to tackle this kind of problem. There are not that many people with the right expertise, and from a company's point of view it can be difficult to justify investing in a technology when the return is not immediately obvious .
This is where the [EDIH](https://noi.bz.it/it/chi-siamo/gli-attori-del-noi/dih-edih) funding helped. It gave us the chance to work directly with an SME, take a real production problem, and see how far we could get with a computer vision solution outside a controlled lab environment.

Together with Simone Garbin and Marco Todescato, we worked on automatic weld seam segmentation using both RGB and polarimetric imaging. 

[Six polarimetric maps of a weld, with the ground-truth outlines]({static}/images/polar.jpg)


The work was carried out in our labs at [Fraunhofer Italia - IEC](https://www.fraunhofer.it/), comparing CNN-based models such as YOLOv8 and YOLOv11 with transformer-based architectures including RF-DETR and Mask2Former.

[Comparison between YOLOv11 and RF-DETR on a close-range weld]({static}/images/comparison_yolo_transformers.jpg)

One of the first things we realised was that the same weld can look very different depending on how and where the image is taken. With controlled RGB images, the CNN models reached a mean mask mAP50 of up to 0.87. Once we moved to images taken under less controlled conditions, performance dropped quite a lot.

So the acquisition setup turned out to matter almost as much as the model itself. We also tested polarimetric imaging, which was much less affected by the uncontrolled conditions and reached a mean mask mAP50 of up to 0.93.

Then came another problem: what happens when the camera moves? We tested the models on a close-range dataset acquired at around 10 cm from the weld, corresponding to the geometry expected for a robot-mounted camera. This was probably the clearest difference we found between the architectures: transformer-based models, especially RF-DETR, retained high accuracy, while the CNN models struggled to generalize to the new viewpoint.

The preprint is now available [here](https://arxiv.org/abs/2608.25465)
