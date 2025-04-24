---
title: "Kalman Filtering in the Age of PyTorch: State Estimation, Differentiability, and the Philosophy of Uncertainty"
subtitle: "From Classical Control to Modern Machine Learning: A Technical and Reflective Exploration"
date: "2024-05-08T00:00:00Z"


# Summary for listings and search engines
summary: "This blog offers a comprehensive technical and philosophical exploration of Kalman filtering, focusing on its implementation and reinterpretation within the PyTorch ecosystem. I will explore the mathematical foundations, practical coding strategies, differentiable filtering, and the deeper questions about knowledge, uncertainty, and learning that arise when classical estimation theory meets modern neural computation."

# Link this post with a project
projects: []

# Featured image
# Place an image named `featured.jpg/png` in this page's folder and customize its options here.
image:
  focal_point: ""
  placement: 2
  preview_only: false
  image_size: "contain"  # Options: "cover", "contain", or "actual"

# Show the page's date?
show_date: true

# Custom date display
custom_date: "Published on May 08, 2024"

authors:
  - admin

tags:
  - Kalman Filter
  - PyTorch
  - State Estimation
  - Machine Learning
  - Computational Philosophy

categories:
  - Research
  - Technical
---

## Introduction
The Kalman filter, a paragon of recursive estimation, has long stood at the intersection of mathematics, engineering, and epistemology. 
Conceived in the 1960s to address the challenges of navigation and control in aerospace, its recursive structure and optimality 
under Gaussian assumptions have made it indispensable across robotics, signal processing, finance, and beyond. 
Yet, as machine learning frameworks like PyTorch have redefined the computational landscape, the Kalman filter
finds itself in a new context—one where differentiability, GPU acceleration, and integration with deep neural architectures
are not just desirable, but essential.

In this blog post I want to embark on a dual journey. On one hand, I want to delve into the technicalities of 
implementing Kalman filters in PyTorch, leveraging its tensor operations and automatic differentiation to enable 
new research and applications.
On the other, I want to reflect on the philosophical questions about the nature of uncertainty, the meaning of optimality, 
and the evolving relationship between model-based and data-driven approaches. By weaving together rigorous mathematics, 
practical coding insights, and reflective inquiry, we aim to illuminate both the power and the limitations of state estimation
in the age of neural computation.

## The Mathematical Foundations of Kalman Filtering
### The State-Space Model: Dynamics and Observations
At the heart of the Kalman filter lies the state-space model, a mathematical abstraction that describes the evolution of a
system's hidden state over time and its relationship to noisy observations. Formally, the discrete-time linear state-space model is given by:

$$
\begin{aligned}
x_{k} &= F_{k} x_{k-1} + B_{k} u_{k} + w_{k} \\
z_{k} &= H_{k} x_{k} + v_{k}
\end{aligned}
$$

Where:
- $x_{k}$: State vector at time $k$
- $F_{k}$: State transition matrix
- $B_{k}$: Control input matrix  
- $u_{k}$: Control vector
- $w_{k}$: Process noise $\sim \mathcal{N}(0,Q_{k})$
- $z_{k}$: Observation vector
- $H_{k}$: Observation matrix
- $v_{k}$: Observation noise $\sim \mathcal{N}(0,R_{k})$

This model encodes two key assumptions: linearity and Gaussianity. The linearity allows for closed-form recursive updates, 
while the Gaussianity ensures that all conditional distributions remain Gaussian, making the mean and covariance sufficient statistics 
for the state estimate.

### Recursive Estimation: Prediction and Update
The Kalman filter operates in two alternating steps: prediction (time update) and correction (measurement update).
In the prediction step, the filter projects the current state estimate forward in time, using the system dynamics:

$$
\begin{aligned}
\hat{x}_{k|k-1} = F_{k} \hat{x}_{k-1|k-1} + B_{k} u_{k} \\
P_{k|k-1} = F_{k} P_{k-1|k-1} F_{k}^{T} + Q_{k} 
\end{aligned}
$$

Here $\hat{x}_{k|k-1}$ 
is the predicted state mean, 
and $P_{k|k-1}$
is the predicted state covariance.

In the update step, the filter incorporates the new measurement $z_{k}$ to refine the state estimate:

$$
\begin{aligned}
K_{k} &= P_{k|k-1} H_{k}^{T} \left( H_{k} P_{k|k-1} H_{k}^{T} + R_{k} \right)^{-1} \\
\hat{x}_{k|k} &= \hat{x}_{k|k-1} + K_{k} \left( z_{k} - H_{k} \hat{x}_{k|k-1} \right) \\
P_{k|k} &= \left( I - K_{k} H_{k} \right) P_{k|k-1}
\end{aligned}
$$

Where $K_{k}$ is the Kalman gain, which determines how much the measurement should be trusted relative to the prediction.
Its derivation is rooted in the minimization of the mean squared error of the state estimate, balancing the uncertainty in the prediction and the measurement

### The Geometry of Uncertainty: Covariance Propagation
A subtle yet profound aspect of the Kalman filter is its treatment of uncertainty. The covariance matrices $P_{k|k-1}$ and $P_{k|k}$
encode not just the spread of possible states, but also the correlations between different state variables.
The propagation of covariance through the system dynamics involves the transformation:

$$
P_{k|k-1} = F_{k} P_{k-1|k-1} F_{k}^{T} + Q_{k}
$$

This operation reflects how uncertainty "flows" through the linear transformation $F_{k}$, and how process noise $Q_{k}$
injects additional uncertainty. The measurement update, in turn, reduces uncertainty by incorporating 
information from the observation, as modulated by the Kalman gain.

Understanding the covariance as a bilinear form, rather than just a matrix, reveals the deep connection between
the algebra of estimation and the geometry of probability distributions. This perspective is crucial for appreciating
the filter's optimality and for extending it to more complex, nonlinear, or high-dimensional settings.

## Kalman Filtering Meets PyTorch: Implementation and Differentiability
### Why PyTorch? Beyond Deep Learning
PyTorch, originally designed for deep learning, offers a flexible tensor computation library with automatic
differentiation and seamless GPU acceleration. While its primary use case has been neural networks, 
its capabilities make it an attractive platform for implementing classical algorithms like the Kalman filter. 
The motivations are manifold:

First, PyTorch's tensor operations enable efficient batch processing, which is invaluable when filtering multiple signals 
or running ensembles of filters in parallel. Second, the autograd engine allows for differentiable programming, making
it possible to optimize filter parameters or integrate the filter as a module within a larger neural architecture. 
Third, PyTorch's ecosystem encourages modularity, extensibility, and integration with probabilistic programming frameworks such as Pyro.

### Coding the Classical Kalman Filter in PyTorch
Implementing the Kalman filter in PyTorch involves translating the recursive equations into tensor operations.
Consider the following minimal implementation for a batch of signals:

```python
import torch
from torch import nn
from torch.linalg import inv

class KalmanFilter(nn.Module):
    """Kalman Filter implementation for state estimation in linear dynamic systems.

    Attributes:
        F (Tensor): State transition matrix.
        B (Tensor): Control input matrix.
        H (Tensor): Observation matrix.
        Q (Tensor): Process noise covariance.
        R (Tensor): Observation noise covariance.
        state_dim (int): Dimensionality of the state.
    """

    def __init__(self, F, B, H, Q, R, state_dim):
        super().__init__()
        self.F = F.clone()
        self.B = B.clone()
        self.H = H.clone()
        self.Q = Q
        self.R = R
        self.state_dim = state_dim

        # placeholders for the current state, covariance, observation and control
        self.x = None    # [state_dim, 1]
        self.P = None    # [state_dim, state_dim]
        self.zs = None   # [obs_dim, 1]
        self.us = None   # [control_dim, 1]

    def project(self):
        """Projects the state and covariance forward."""
        x_pred = torch.matmul(self.F, self.x) + torch.matmul(self.B, self.us)
        P_pred = torch.matmul(self.F, torch.matmul(self.P, self.F.T)) + self.Q
        return x_pred, P_pred

    def correct(self, x_pred, P_pred):
        """Corrects the state estimate with the current observation."""
        S = torch.matmul(self.H, torch.matmul(P_pred, self.H.T)) + self.R
        K = torch.matmul(P_pred, self.H.T) @ inv(S)

        # state update
        self.x = x_pred + torch.matmul(K, (self.zs - torch.matmul(self.H, x_pred)))
        # covariance update
        I = torch.eye(self.state_dim, device=P_pred.device)
        self.P = torch.matmul((I - torch.matmul(K, self.H)), P_pred)

    def forward(self, zs, us):
        """
        Processes a batch of observation/control sequences.

        Args:
            zs: [timesteps, batch, obs_dim] sequence of observations
            us: [timesteps, batch, control_dim] sequence of control inputs
        Returns:
            xs: [batch, state_dim, timesteps] filtered state estimates
            pred_obs: [batch, obs_dim, timesteps] one-step predictions of observations
            residuals: [batch, obs_dim, timesteps] observation residuals
        """
        xs = []
        pred_obs = []
        residuals = []

        # initial state & covariance
        self.x = torch.zeros((self.state_dim, 1), device=zs.device)
        self.P = torch.eye(self.state_dim, device=zs.device)

        # iterate over time
        for z_t, u_t in zip(zs.transpose(0, 1), us.transpose(0, 1)):
            self.zs = z_t.unsqueeze(1)
            self.us = u_t.unsqueeze(1)

            x_pred, P_pred = self.project()
            self.correct(x_pred, P_pred)

            xs.append(self.x.detach().clone())
            y_pred = torch.matmul(self.H, x_pred)
            pred_obs.append(y_pred)
            residuals.append(self.zs - y_pred)

        xs = torch.cat(xs, dim=1)
        pred_obs = torch.cat(pred_obs, dim=1)
        residuals = torch.cat(residuals, dim=1)

        return xs, pred_obs, residuals
```

## Differentiable Kalman Filters: Learning and Optimization
One of the most transformative aspects of implementing the Kalman filter in PyTorch is the ability to make the entire 
filtering process differentiable. By treating the system matrices ($F$, $H$, $Q$, $R$) as learnable parameters, 
one can optimize them using gradient-based methods, either to fit data or to tune the filter for specific tasks. 
This approach blurs the line between classical estimation and machine learning, enabling hybrid models that combine 
the structure of state-space models with the flexibility of data-driven learning.

Recent research has focused on improving the efficiency of backpropagation through the Kalman filter. 
While PyTorch's automatic differentiation can compute gradients, it may incur significant computational overhead, 
especially for large-scale problems. Novel closed-form expressions for the derivatives of the filter's outputs with
respect to its parameters have been developed, offering substantial speed-ups (up to 38 times faster than PyTorch's 
autograd in some cases). These advances make it feasible to embed Kalman filters within deep learning pipelines,
trainable end-to-end, and responsive to the demands of modern applications.

## PyTorch Libraries for Kalman Filtering
Several open-source libraries have emerged to facilitate Kalman filtering in PyTorch:

- torch-kf: A fast implementation supporting batch filtering and smoothing, capable of running on both CPU and GPU. It is particularly efficient when filtering large batches of signals, leveraging PyTorch's parallelism. 
- DeepKalmanFilter: Implements deep variants of the Kalman filter, where neural networks parameterize parts of the state-space model. This enables modeling of nonlinear dynamics and observations, bridging the gap between classical filtering and deep generative models. 
- Pyro: A probabilistic programming framework that supports differentiable Kalman filters and extended Kalman filters, with learnable parameters and integration with variational inference. 
- torchfilter: Provides advanced filters such as the square-root unscented Kalman filter, supporting both state and parameter estimation in nonlinear systems.

## Extensions and Hybrid Models: Beyond the Classical Filter
### Nonlinear and Non-Gaussian Filtering
While the classical Kalman filter assumes linear dynamics and Gaussian noise, many real-world systems violate 
these assumptions. Extensions such as the Extended Kalman Filter (EKF) and Unscented Kalman Filter (UKF) address
nonlinearities by linearizing the dynamics or propagating sigma points, respectively. Particle filters, in turn, 
approximate arbitrary distributions via Monte Carlo sampling.

Implementing these advanced filters in PyTorch follows the same principles: tensorized operations, 
differentiability, and integration with neural modules. For example, the EKF can be implemented by computing 
Jacobians using PyTorch's autograd, while the UKF can leverage batched sigma point propagation for efficient parallelism.


### Deep Kalman Filters and Latent Dynamics
The fusion of Kalman filtering with deep learning has given rise to deep Kalman filters, where neural networks 
parameterize the transition and observation functions. This approach enables modeling of complex, nonlinear,
and high-dimensional systems, such as video sequences or sensor fusion in robotics. The deep Kalman filter retains 
the probabilistic structure of the classical filter but augments it with the representational power of neural networks.

In PyTorch, this is achieved by defining neural modules for the transition and observation models,
and using the filtering equations to propagate means and covariances through time. The entire model 
can be trained end-to-end using stochastic gradient descent, with the Kalman filter acting as a differentiable 
layer within the network.

### Hybrid Estimators: Neural Networks and Kalman Filters
Hybrid models that combine neural networks and Kalman filters have demonstrated superior performance in 
state estimation tasks, particularly in scenarios with complex dynamics or partial observability. 
These models can be categorized into two main types:

- NN-KF: Neural networks learn the parameters or functions of the state-space model, which are then used by the Kalman filter for estimation. 
- KF-NN: The Kalman filter provides state estimates or uncertainty measures that are used as inputs or features for a neural network.

Such hybridization leverages the strengths of both approaches: the interpretability and optimality of the Kalman filter,
and the flexibility and expressiveness of neural networks. In PyTorch, these models can be implemented as composite
modules, trained jointly or sequentially, and deployed in a wide range of applications from battery state-of-charge
estimation to autonomous navigation.

## Philosophical Reflections: Uncertainty, Knowledge, and Learning

### The Epistemology of State Estimation
At a deeper level, the Kalman filter embodies a philosophy of knowledge under uncertainty. It formalizes the process of 
updating beliefs in the face of incomplete and noisy information, balancing prior expectations (the model) with new
evidence (the measurements). The recursive structure mirrors the Bayesian paradigm, where beliefs are continuously 
revised as new data arrives.

Yet, the filter's optimality is contingent on its assumptions: linearity, Gaussianity, and known noise covariances.
When these assumptions are violated, as is often the case in complex systems, the filter's estimates may become biased
or inconsistent. This raises fundamental questions: What does it mean to "know" the state of a system? How do we quantify
and manage uncertainty? Can we trust our models, or must we adapt them in light of new evidence?

### The Fusion of Model-Based and Data-Driven Approaches
The integration of Kalman filtering with PyTorch and neural networks reflects a broader trend in computational science:
the synthesis of model-based and data-driven approaches. Classical estimation theory offers structure, interpretability,
and guarantees of optimality. Machine learning provides flexibility, scalability, and the ability to discover patterns 
from data.

Hybrid models, differentiable filters, and end-to-end learning challenge the traditional dichotomy between "hard-coded"
models and "black-box" learning. They invite us to reconsider the boundaries between theory and data, deduction and 
induction, certainty and doubt. In this sense, the Kalman filter is not just an algorithm, but a lens through which to 
explore the nature of inference, prediction, and adaptation.

### The Philosophy of Differentiable Programming
The advent of differentiable programming—where algorithms are designed to be composed, differentiated, 
and optimized—raises new philosophical questions. When we make the Kalman filter differentiable, we enable it to
learn from data, to adapt its parameters, and to participate in the broader ecosystem of neural computation. 
But we also introduce new forms of uncertainty: about the correctness of gradients, the stability of optimization,
and the interpretability of learned models.

Is the differentiable Kalman filter still a Kalman filter, or has it become something new? What are the implications of 
treating classical algorithms as modules within a deep learning pipeline? How do we balance the desire for optimality
with the need for flexibility? These questions invite ongoing reflection and experimentation.

## Conclusion
The Kalman filter, once a symbol of control theory and aerospace engineering, has found new life in the era of PyTorch
and machine learning. Its recursive structure, principled handling of uncertainty, and optimality under Gaussian
assumptions remain as compelling as ever. Yet, its implementation and interpretation are evolving, shaped by the
demands of differentiability, scalability, and integration with neural computation.

By exploring the mathematical foundations, practical coding strategies, extensions to nonlinear and hybrid models, 
and the deeper philosophical questions that arise, we have sought to illuminate both the enduring relevance and 
the transformative potential of Kalman filtering in the age of PyTorch. As we continue to blur the boundaries between 
model-based and data-driven approaches, the filter serves as a bridge—not just between past and future, but between 
certainty and doubt, theory and practice, knowledge and learning.

The journey of the Kalman filter is far from over. Its recursive dance of prediction and correction, its geometry 
of uncertainty, and its adaptability to new computational paradigms ensure that it will remain a central figure in the
ongoing dialogue between mathematics, engineering, and philosophy. Whether as a standalone estimator, a differentiable
module, or a component of a deep generative model, the Kalman filter challenges us to rethink what it means to know,
to predict, and to learn.

## Further Reading and Resources
For those interested in diving deeper, consider exploring the following resources:

- [torch-kf](https://github.com/raphaelreme/torch-kf): Fast PyTorch implementation of Kalman filters, supporting batch processing and GPU acceleration. 
- [DeepKalmanFilter](https://github.com/morim3/DeepKalmanFilter): PyTorch implementation of deep Kalman filters, integrating neural networks with probabilistic state-space models. 
- [Pyro Tutorials](https://pyro.ai/examples/ekf.html: Differentiable Kalman and extended Kalman filters with learnable parameters. 
- [torchfilter](https://stanford-iprl-lab.github.io/torchfilter/_modules/torchfilter/filters/_square_root_unscented_kalman_filter/): Advanced filters including square-root unscented Kalman filter for nonlinear systems. 
- Recent Research: [Closed-form gradients for efficient differentiable filtering](https://stanford-iprl-lab.github.io/torchfilter/_modules/torchfilter/filters/_square_root_unscented_kalman_filter/), 
[hybrid models for state estimation](https://www.semanticscholar.org/paper/A-review%3A-state-estimation-based-on-hybrid-models-Feng-Li/1f9d96407167c1bb894c4dec60a64bd31c00d1e8), 
and [practical applications in robotics and sensor fusion](https://arxiv.org/abs/2010.08196).
