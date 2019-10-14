# Jekflix Template
![Cover Image](http://res.cloudinary.com/dm7h7e8xj/image/upload/v1505354182/jekflix-logo_mfngps.png)

See the [demo here](https://jekflix.rossener.com/).

## What is it?

A template for Jekyll inspired by Netflix panel for who loves movies and series and would like to have a blog with this cool appearance ;)

![Screenshot](http://res.cloudinary.com/dm7h7e8xj/image/upload/v1505357238/jekflix-screenshot_qikqkl.jpg)

## Features

- Gulp
- Stylus
- Live Search
- Minutes to Read
- Reading Progress Bar
 
 ![Progress Bar](http://res.cloudinary.com/dm7h7e8xj/image/upload/v1505357769/jekflix-progress-bar_he7gqf.jpg)
- "New Post" tag
- Load images on demand
- Emojis 😎
- Push Menu
- SVG icons
- Shell Script to create drafts and posts
- Tags page
- About page
- Contact page
- Feed RSS
- Sitemap.xml
- Info Customization
- Disqus
- Pagination
- Google Analytics

## Setup

1. Install Jekyll (use the command `gem install jekyll`)
1. export PATH=$PATH:$HOME/.gem/ruby/2.6.0/bin
1. Clone the repo you just forked
1. Edit `_config.yml` to personalize your site. 
1. Check out the sample posts in `_posts` to see examples for assigning category, tags, image and other YAML data
1. Read the documentation below for further customization pointers and documentation
1. Remember to compile your assets files with Gulp

## Running local

In order to compile the assets and run Jekyll on local you need to follow those steps:

- Install [NodeJS](https://nodejs.org/) (remember to use the latest version)
- Run `npm install`
- Run `npm install -g gulp gulp-cli`
- Open `_config.yml` and change to:
```
baseurl: ""
url: ""
```
- Run `gulp`

## Settings

You have to fill some informations on `_config.yml` to customize your site.

```
# Site Settings
title: Thiago Rossener | Front-end Developer
email: youremail@xyz.com
description: Some text about your blog.
baseurl: "" # the subpath of your site, e.g. /blog/ or empty.
url: "https://www.rossener.com" # the base hostname & protocol for your site
google_analytics: "UA-XXXXXXXX-X"

# User settings
username: Thiago Rossener # it will appear on each page title after '|'
user_description: Some text about you.
disqus_username: disqus_username

# Social Media settings
# Remove the item if you don't need it
github_username: github_username
facebook_username: facebook_username
twitter_username: twitter_username
instagram_username: instagram_username
linkedin_username: linkedin_username
medium_username: medium_username
```

## Color customization

All color variables are in [src/styl/_variables.styl](src/styl/_variables.styl).

Default colors:

![#ff0a16](https://placehold.it/15/ff0a16/000000?text=+) `#FF0A16` Theme Color

![#141414](https://placehold.it/15/141414/000000?text=+) `#141414` Primary Dark

![#ffffff](https://placehold.it/15/ffffff/000000?text=+) `#FFFFFF` Accent Dark

![#f2f2f2](https://placehold.it/15/f2f2f2/000000?text=+) `#F2F2F2` Light Gray

![#333333](https://placehold.it/15/333333/000000?text=+) `#333333` Texts

## Creating drafts

You can use the `initdraft.sh` to create your new drafts. Just follow the command:

```
./initdraft.sh -c Post Title
```

The new file will be created at `_drafts` with this format `date-title.md`.

## Creating posts

You can use the `initpost.sh` to create your new posts. Just follow the command:

```
./initpost.sh -c Post Title
```

The new file will be created at `_posts` with this format `date-title.md`.

## Front-matter 

When you create a new post, you need to fill the post information in the front-matter, follow this example:

```
---
layout: post
title: "Welcome"
description: Lorem ipsum dolor sit amet, consectetur adipisicing elit.
image: 'http://res.cloudinary.com/dm7h7e8xj/image/upload/c_scale,w_760/v1504807239/morpheus_xdzgg1.jpg'
category: 'blog'
tags:
- blog
- jekyll
twitter_text: Lorem ipsum dolor sit amet, consectetur adipisicing elit.
introduction: Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
---
```

**Your image size should have the proportion of a 600x315 image to look good on home page.**

## License

*Jekflix Template* is available under the MIT license. See the LICENSE file for more info.

# How to Run Jekyll Locally
```
export PATH=${PATH}:${HOME}/.gem/ruby/2.6.0/bin
bundle exec jekyll serve
```