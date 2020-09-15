---
layout: post
title: 'Learn How To Make Automated Dependency Updates Easily With Dependabot'
description: 'Dummy description.' 
image: 'https://cdn.pixabay.com/photo/2017/05/10/19/29/robot-2301646_960_720.jpg'
twitter_text: 'Dummy Twitter Text.'
category: 'devops'
tags:

  + monitoring

author: hector
paginate: true
---

Every time we start a new project is almost the same story. We might have the big picture and we start to install and to stack libraries and other dependencies to finish a task. After a couple development cycles we have just lost control of our libraries. That `package.json` is kilometric and no one knows what is really needed and to make it worse, even what we actually need is outdated. Nobody will touch that pile of dependencies fearing to break something and to be honest, we all ignore it as long everything works. Vulnerabilities, bug fixes and new features are important factors of all projects, and that is because staying up to date is the most secure strategy.

## About Dependabot

Is a dependable robot who'll keep your dependencies up-to-date for you. It's free of charge because it has been [acquired by GitHub](https://dependabot.com/blog/hello-github) and it's ready to be integrated with your projects. There are many supported languages like JavaScript, Python and even [Terraform](https://dependabot.com/blog/announcing-terraform-support) and Docker are in the list. 

![dependabot logo](https://github.blog/wp-content/uploads/2020/05/bringing-dependabot-natively-into-github.png)

## How It Works

On a daily basis, Dependabot looks for any outdated dependencies and if anything is outdated, Dependabot opens a Pull Request for each finding. Then the update can be included by accepting the Pull Request saving the day bringing automation. Each Pull Requests includes release notes, changelogs, commit links and detailed information.

![dependabot example](https://dependabot.com/static/eb991d2434b1b73d4e71145f50359ada/23495/screenshot.png)

## Get Started

To start using Dependabot [connect a GitHub account](https://app.dependabot.com/auth/sign-up) to it, but since Dependabot is moving natively into GitHub we can setup the configuration in `.github/dependabot.yml` file in a repository. What I like about this is the simplicity and how easy to read this file is.

``` 
version: 2
updates:

* package-ecosystem: npm

  directory: "/"
  schedule:
    interval: weekly
  open-pull-requests-limit: 10
  target-branch: development
  reviewers:

  + hndoss

```

### Automation Itself Isn't The Answer

In the other hand, automation can be dangerous if we are not careful. Often automation problems are not related to the mechanism and functionality of the tools but in the process to manage it. Automatic opening Pull Requests will only bring you spam if a healthy review/merge process has not been implemented. We can easily get overwhelmed by the count results, and like we do with our clothes, it's easier to do it on a weekly basis, rather than letting it all pile up for a month.
