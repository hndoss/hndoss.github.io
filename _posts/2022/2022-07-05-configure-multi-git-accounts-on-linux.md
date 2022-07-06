---
layout: post
title: Configuire Multi Git Accounts On Linux
description: Setup multi accounts for git
image: https://cdn.pixabay.com/photo/2019/08/30/07/38/psychology-4440675_960_720.jpg
twitter_text: Manage multiple accounts with custom configuration files
category: devops
tags:
  - devops
author: hector
paginate: true
---

Managing multiple user accounts can be a challenging task. A simple use case scenario is to have an account for a job, and a separate account for personal purposes. Jumping back and forth between these accounts can be a pain, and it is prompt to forget which account you are using and cause a lot of confusion. In general, it is recommended to use a single account for all your work, according to [GitHub]((https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-user-account/managing-user-account-settings/merging-multiple-user-accounts)). But when it is not possible, you can have separete directories to host your git repositories for each account, so that you can easily switch between them by loading specific configuration files depending of the directory you are in.

Let's assume you have a job account and a personal account, and that `~/.git_configs` is used to host configuration files. Also, your job's repositories are in `/projects/job` and your personal repositories are in `/projects/personal`.

First, let's fill the job account file.
```bash
cat > ~/.git_configs/job.config << EOF
[user]
    name = Thomas A. Anderson
    email = thomas.anderson@metacortex.com
[core]
    sshCommand = ssh -i ~/.ssh/job.pem
EOF
```

Second, the personal account.
```bash
cat > ~/.git_configs/personal.config << EOF
[user]
    name = Neo
    email = the_choosen_one@matrix.com
[core]
    sshCommand = ssh -i ~/.ssh/the_nebuchadnezzar.pem
    editor = vim
EOF
```

The last thing to do is to load the configuration files from `~/.gitconfig`. 

```bash
cat > ~/.gitconfig << EOF
[core]
    editor = nano

[includeIf "gitdir:/projects/job/"]
    path = ~/.git_configs/job.config

[includeIf "gitdir:/projects/personal"]
    path = ~/.git_configs/personal.config
EOF
```

 As a result, you will be able to use the an account for your job, and you will be able to use a separate account for personal projects. Depending on the directory you are in, you will be able to load the correct configuration file automatically.