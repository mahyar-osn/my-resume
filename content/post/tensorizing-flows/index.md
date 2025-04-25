---
title: "Why Normalizing Flows (and Tensorizing Flows) deserve more attention"
subtitle: "Supercharging Normalizing Flows by Tensor Networks as a Game-Changer for Scientific Machine Learning"
date: "2023-08-04T00:00:00Z"

# Summary for listings and search engines
summary: "Normalizing Flows might not be the flashiest generative models, but their ability to provide exact, normalized densities makes them invaluable for tasks like variational inference. The new 'Tensorizing Flows' approach upgrades NFs with a powerful tensor-train base, making them far better at handling complex, high-dimensional, and multimodal distributions—especially in scientific and physics applications."

# Link this post with a project
projects: []

# Featured image
# Place an image named `featured.jpg/png` in this page's folder and customize its options here.
image:
#  caption: 'Image credit: Corcoran, A. W., & Hohwy, J. (2018). Allostasis, interoception, and the free energy principle: Feeling our way forward.'
  focal_point: ""
  placement: 2
  preview_only: false
  image_size: "contain"  # Options: "cover", "contain", or "actual"

# Show the page's date?
show_date: true

# Custom date display
custom_date: "Published on August 04, 2023"

authors:
  - admin

tags:
  - Machine Learning
  - Variational Inference
  - Generative Models
  - Normalizing Flows
  - Tensorizing Flows
  - Scientific Computing
  - Tensor Networks

categories:
  - Research
---

Other generative models like diffusion models and autoregressive LLMs tend to steal the spotlight, since they're great
at producing stunning images or generating text. Normalizing Flows, on the other hand, aren't the first choice for 
those headline-grabbing tasks. But if you focus only on sample quality, you might overlook what makes Normalizing Flows 
truly valuable.

## Why Normalizing Flows Deserve More Attention

Most generative models are black boxes. GANs, for example, can create high-quality samples, but you can't compute the 
likelihood of a given data point. Energy-based models often only give you unnormalized densities, so you can compare
samples but not get an actual probability.

Normalizing Flows are different. They let you map a simple base distribution (like a Gaussian) through a sequence of 
invertible transformations to model complex data. The kicker? You always have access to the exact, normalized probability
density for any sample. This is a huge deal for applications where you need to know the likelihood, not just generate 
data.

## The Real-World Use Case: Variational Inference

One area where this property is crucial is Variational Inference (VI). Here, you want to approximate a complex target
distribution with a flexible, normalized family so you can do things like Bayesian inference efficiently. 
NFs are a natural fit because you can both sample from them and compute exact densities—something most other models
can't offer.

## But There's a Catch...

Traditional NFs use a Gaussian as their base distribution. This works fine for unimodal targets, but if your true
distribution is multimodal (think: multiple peaks), NFs tend to "collapse" to just one mode. This limits their 
expressiveness in VI, especially for challenging scientific or physics problems where multimodality is the norm.

## Enter Tensorizing Flows

The paper "Tensorizing Flows: A Tool for Variational Inference" introduces a clever fix: replace the Gaussian base 
with a tensor-train (TT) distribution, built using tools from tensor networks. This TT base can already capture much 
of the structure (including multimodality) of the target distribution, so the flow only needs to handle the
"fine details." The result is a model that's both more expressive and easier to train for high-dimensional, 
multimodal problems.

## Resources
- [Article](https://arxiv.org/pdf/2305.02460)
- [NormFlow](https://github.com/VincentStimper/normalizing-flows)
