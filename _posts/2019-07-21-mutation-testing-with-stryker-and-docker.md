---
layout: post
title: "Mutation Testing with Stryker and Docker"
description: Get started right away with mutation testing. Tests for your tests.
image: 'https://cdn.pixabay.com/photo/2018/10/21/14/57/parrot-3762988_960_720.jpg'
twitter_text: Because 80% tests coverage could be 20%.
category: 'blog'
introduction: How do we know that we are writing quality code? How do we know that we are writing good tests?
---

How do we know that we are writing quality code? Mostly we rely on unit tests or integration tests to answer that question. But then, the question repeats itself. How do we know that we are writing good tests? Let me introduce you Stryker, it allows you to test your tests with mutation testing. Stryker guys have a complete explanation and got mostly everything covered on [their official site](https://stryker-mutator.io/) which you should visit.

This time we are going to follow an approach with [Docker](https://www.docker.com/). I found it easier to implement in old projects since you don't need to upgrade libraries neither care about the version of your testing framework, theoretically. So, let's get started.

```
git clone git@github.com:angular/angular-cli.git
cd angular-cli
yarn install
```

The dockerfile is [here](https://github.com/hndoss/stryker-js-11-alpine). If you have an idea about how to improve it, you are just about a Pull Request to cooperate.