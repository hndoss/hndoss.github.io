## License

*Jekflix Template* is available under the MIT license. See the LICENSE file for more info.

# How to Run Jekyll Locally
```
export PATH=${PATH}:${HOME}/.gem/ruby/2.7.0/bin
sudo docker run --rm -ti -v $(pwd):/srv -w /srv --net host --entrypoint /bin/sh ruby:2.7
bundle install
bundle exec jekyll serve
```