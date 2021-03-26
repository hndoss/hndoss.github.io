---
layout: post
title: Schedule Smoke Tests Run With GitLab API
description: Run smoke tests after 15 minutes without sleep.
image: https://cdn.pixabay.com/photo/2012/12/09/00/16/abstract-69124_960_720.jpg
twitter_text: Schedule a Smoke Tests pipeline with GitLab API and Personal Access Tokens.
category: devops
tags:
  - devops
author: hector
paginate: true
---

A [Smoke test](https://softwaretestingfundamentals.com/smoke-testing) is a type of software testing that comprises of a non-exhaustive set of tests that aim at ensuring that the most important functions work. Ideally, smoke tests should be triggered after a deployment is complete and the cache not interfere with the process.

The main idea is to run smoke tests after a pipeline deployment has been carried out in order to make sure it came out as expected. Waiting a certain amount of time after the event can be complex if you want to do it with a responsible use of resources. The easiest approach is to simply add a sleep that lasts 15 minutes to the pipeline, however it would be precious time for the pipeline to be up, hence we could be wasting resources that will be missed in the future ([CI minutes](https://about.gitlab.com/pricing/faq-consumption-cicd)). 

So we will create a scheduled pipeline using the GitLab API so that it is scheduled to run every 15 minutes. This pipeline will be in charge of executing the 
smoke tests. Then when the smoke tests have finished we will use the GitLab API again to deactivate the scheduled pipeline making the smoke tests to run only once, 15 minutes after every deployment has finished.

## GitLab Token
In first place we will need to authenticate ourselves at the moment to make the call to the API GITLAB. Therefore the first step is to create a token with the sufficient permissions. Go to [your personal profile and then to access tokens](https://gitlab.com/-/profile/personal_access_tokens).

[![Access Tokens](https://hndoss-blog-bucket.s3.amazonaws.com/2021-01-25-schedule-smoke-test-on-gitlab/acces-tokens.png)](https://gitlab.com/-/profile/personal_access_tokens)

After clicking on the `Create personal access token` button, you will get a token. Needless to say, this token is very sensitive. Make sure you don't ever share them publicly, commit it to a public repository or let anybody have access. Now, we will save the token as an environment variable in our CI / CD variables.

[![GitLab Variable](https://hndoss-blog-bucket.s3.amazonaws.com/2021-01-25-schedule-smoke-test-on-gitlab/gitlab-variable.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2021-01-25-schedule-smoke-test-on-gitlab/gitlab-variable.png)

### Scheduled Pipelines
Something important to mention about the scheduled pipelines is that, in general, environment variables in the pipeline are commonly needed. The action to add variables to a scheduled pipeline environment is managed separately of the scheduled pipeline creation. In our example we are not going to do it, but in case is needed, here it is an example:

```bash
curl --location --request POST "https://gitlab.com/api/v4/projects/<project_id>/pipeline_schedules/<scheduled_pipeline_id>/variables" \
  --header 'PRIVATE-TOKEN: <your_access_token>' \
  --form 'key="NEW_VARIABLE"' \
  --form 'value="new value"'
```
You can find more information reading the [official documentation](https://docs.gitlab.com/ee/api/pipeline_schedules.html#pipeline-schedule-variables).

### Calculating Time After 15 Minutes
Date is a command available in virtually all linux distributions since is part of [GNU coreutils](https://www.gnu.org/software/coreutils). With it, adding 15 minutes to the current time is very simple:

```bash
AFTER_15_MINUTES=$(date -d '15 mins')
echo "${AFTER_15_MINUTES}"
```

Now we need a script to simplify and abstract the scheduling, activation and deactivation of the pipeline:

```bash
#!/bin/bash
# ci/activate_smoke_test_scheduled_pipeline.sh

function calculate_time_after_15_minutes() {
    echo $(date -d '15 mins' +"%M %H")
}

function main(){
    ACTIVATE_MODE="${1}"  # true or false

    TIME=$(calculate_time_after_15_minutes)
    
    curl --location --request PUT 'https://gitlab.com/api/v4/projects/<project_id>/pipeline_schedules/<scheduled_pipeline>' \
        --header "PRIVATE-TOKEN: ${GITLAB_USER_TOKEN}" \
        --form "cron=\"${TIME} * * *\"" \
        --form "active=\"${ACTIVATE_MODE}\""
}

main "${@}"
```

Joining all the dots in one place, the workflow in the `.gitlab-ci.yml` file looks like this:

```yaml
stages:
  - ... other stages
  - deploy
  - smoke-test

default:
  before_script:
    - apk add curl coreutils

deploy: 
  stage: deploy
  image: alpine:latest
  script:
    - ... deploy logic
    - sh ci/activate_smoke_test_scheduled_pipeline.sh true
  except:
    - schedules

smoke-test:
  image: alpine:latest
  stage: smoke-test
  script:
    - apk add curl coreutils
    - run smoke tests # npm run smoke-tests for example
    - sh ci/activate_smoke_test_scheduled_pipeline.sh false
  only: 
    - schedules
```