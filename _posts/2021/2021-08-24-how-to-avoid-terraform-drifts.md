---
layout: post
title: What Is Terraform Drift And How To Avoid It?
description: h
image: https://cdn.pixabay.com/photo/2017/04/06/17/23/buggy-2208873_960_720.jpg
twitter_text: What Is Terraform Drift And How To Avoid It?
category: devops
tags:
  - iac
author: hector
paginate: true
---

> Drift is the term for when the real-world state of your infrastructure differs from the state defined in your configuration

Have you ever been about to finish washing the dishes and suddenly someone puts a dirty glass and some pots of the last meal in front of you? Then you have to clean the glass and the pots, and then the scene repeats itself over and over again. Solving Terraform drifts is like washing a huge pile of dishes that never ends. In a real environment at any scale mitigate drifts is not an easy task.

Let's take a look at how we can avoid or reduce the drifts in our Terraform configurations.

## Manage All Changes With Terraform

On Hashicorp's blog post [Change Management At Scale: How Terraform Helps End Out-of-Band Anti-Patterns](https://www.hashicorp.com/blog/change-management-at-scale-how-terraform-helps-end-out-of-band-anti-patterns) recommends to **Work Toward Having All Changes Go Through Terraform**. By locking the cloud accounts, you ensure that the changes are applied only through Terraform and not through other means. This also goes alined with some security principles like the **Principle of Least Privilege** where a user is given the minimum level of access or permissions required to perform an action or job function.

This is not always possible, mostly if there is no agreement or policy to lock the cloud accounts where Terraform is managing the infrastructure. In such cases, it is important to establish a drift detection system to fire alarms when the infrastructure is not in sync with the Terraform state. I really liked this youtube video where Michael Simo talked about **Terraform Drift Detection and Reporting** [![Terraform Drift Detection and Reporting?](https://img.youtube.com/vi/zlwhw3YGlUc/0.jpg)](https://www.youtube.com/watch?v=zlwhw3YGlUc)


## Bring Automation

AWS said it on it's [Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/implement-change.html):
> Although conventional wisdom suggests that you keep humans in the loop for the most difficult operational procedures, we suggest that you automate the most difficult procedures for that very reason. 

   
> Changes to your infrastructure should be made using automation. The changes that need to be managed include changes to the automation, which then can be tracked and reviewed.
 
Hashicorp put available a guide for [Running Terraform in Automation](https://learn.hashicorp.com/tutorials/terraform/automate-terraform) and is worth to read it if you want to automate your infrastructure.

Visit the following links to learn more about the process:
- [Deploy Terraform infrastructure with CircleCI](https://learn.hashicorp.com/tutorials/terraform/circle-ci?in=terraform/automation)
- [Automate Terraform with GitHub Actions](https://learn.hashicorp.com/tutorials/terraform/github-actions?in=terraform/automation)
- [Atlantis](https://www.runatlantis.io)

## Better Terraform Modules

With Terraform modules it is possible to create reusable pieces of infrastructure that can be used in multiple Terraform runs without having to repeat the same code and the end result is a more maintainable and reusable infrastructure. Infrastructure as Code (IaC) is a great way to manage your infrastructure and since all the workloads are defined in code, the same rules for managing any kind of code can be applied in order to improve its quality. By reducing the amount of code and making it more maintainable, you can also reduce the amount of time it takes to deploy the infrastructure reducing toil and error, and therefore reducing the number of drifts in the infrastructure. 

Keep in mind the following general principles:
- [KISS. Keep It Simple, Stupid](https://en.wikipedia.org/wiki/KISS_principle)
- [Low coupling and high cohesion](https://medium.com/clarityhub/low-coupling-high-cohesion-3610e35ac4a6)
- [Write DRY Code](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Single Responsability Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)
- [Documentation](https://en.wikipedia.org/wiki/Software_documentation)
- [Refactor](https://en.wikipedia.org/wiki/Code_refactoring)

## Track Origin and Adjust the Configuration

Knowing where the changes are coming from can determine the best course of action. They are three types of changes origin: 
- Caused by changes in the code
- Caused by the context
- Caused by manual changes directly in the infrastructure

### Caused By Changes in the Code

This is the most common type of change and it is the one that you should be able to track. Often this affects teams that are not leveraging automation and applying changes without a centralized pipeline or haven't a clear deployment flow. 

- Draw a diagram of the process to help you to understand and spot bottlenecks and pitfalls
- Optionally follow [Hashicorp's recommended workflow Part 3.3](https://www.terraform.io/docs/cloud/guides/recommended-practices/part3.3.html) to use Terraform Cloud

### Caused By the Context

The cloud itself change sometimes for good and sometimes for bad reasons. These kind of changes are not always easy to track since it is commonly out of the scope of the code and the Cloud provider is the responsable. 

- Keep up-to-date with the latest communication and updates from the Cloud provider
- Use the meta-argument [lifecycle](https://www.terraform.io/docs/language/meta-arguments/lifecycle.html) to `ignore_changes` when a resource is created with references to data that may change in the future, but should not affect said resource after its creation

### Caused Manual Changes Directly in the Infrastructure

This is a real burden. It is not always possible to track the changes made by the infrastructure directly or at least it is time consuming. Applying changes directoly might seem like the easiest option for one-off tasks, but for recurring operations it is a big consumer of valuable engineering time making it difficult to track and manage changes. 

- Use a tool like [Terraformer](https://github.com/GoogleCloudPlatform/terraformer) to generate a Terraform configuration from the Cloud provider like a reverse Terraform
- Study the Hashicorp's tutorial in how to [Manage Resource Drift](https://learn.hashicorp.com/tutorials/terraform/resource-drift#run-a-refresh-only-plan). It shows how to import a Terraform configuration from a Cloud provider and how to use the `terraform refresh` command to apply the changes.

## Immutable infrastructure

By definition an immutable infrastructure is one that cannot be changed. Even though it is hard to achieve the reward is worth the effort:
- End result is more predictable
- Infrastructure is reliable and consistent
- Drifts are mitigated or eliminated entirely

HashiCorp co-founder and CTO Armon Dadgar explains the differences and tradeoffs of immutable and mutable infrastructure really good in this video: 
[![What is mutable vs. immutable infrastructure?](https://img.youtube.com/vi/II4PFe9BbmE/0.jpg)](https://www.youtube.com/watch?v=II4PFe9BbmE)


## TL;DR
At an organizational level, aim to determine the roles and permissions for individuals leveraging Terraform by managing all changes with it in an automated way with a review process. Easy the toil and reduce the code base by using Terraform modules, keep an eye open looking for ways to improve it like any other code base in the organization. It is important to understand from where are the drifts are coming from and adjust the configuration to avoid them or to ignore tolerable changes. And finally, aim for immutable infrastructure whenever possible.