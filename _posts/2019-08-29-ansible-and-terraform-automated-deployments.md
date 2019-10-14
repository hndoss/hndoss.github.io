---
layout: post
title: "Immutable Infrastructure with Terraform and Ansible Deployments, Part I"
description: Immutable infrastructure deployments
image: 'https://cdn.pixabay.com/photo/2015/04/05/16/12/lego-708088_960_720.jpg'
twitter_text:
category: 'devops'
introduction:
---

- Part I: Creating an environment
- Part II: Provisioning the environment.
- Part III: CI/CD Deploy to GCP.


# Code Structure
- Ansible includes terraform project
- Benefits

# Stack
Github is bringing a barely new service called Github Actions and I am going to be using it this time, if you want to try it yourself you must subscribe for the beta [here](https://github.com/features/actions/signup), a Github account is required. If you want to know more about it's features visit [Github's official site](https://github.com/features/actions).

In this project I choose Django as backend and Angular as frontend.

# Terraform
In my own words, [Terraform](https://www.terraform.io/index.html) is just magic. It is a fantastic tool created by [Hashicorp](https://www.hashicorp.com), a tool for building, changing, and versioning infrastructure safely and efficiently.

I have learn the power of Terraform module's to create reusable infrastructure. Reusability is key if you want to increase software productivity and with Terraform modules you can reuse one module in different places of your code.

For simplicity, I am putting everything in the same Github repository.

# TL; DR
Terraform creates everything and Ansible provision the new instances.

# Recommended links and courses.
