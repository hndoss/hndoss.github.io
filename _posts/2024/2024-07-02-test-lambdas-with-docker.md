---
layout: post
title: Testing AWS Lambdas Locally with Docker
description: Learn how to test AWS Lambda functions locally using Docker containers, speeding up your development workflow without deploying to the cloud.
image: https://cdn.pixabay.com/photo/2018/05/08/08/44/artificial-intelligence-3382507_960_720.jpg
twitter_text: Speed up your Lambda development by testing locally with Docker containers.
category: devops
tags:
  - aws
  - docker
  - lambda
  - golang
author: hector
# paginate: true
---

AWS Lambda is a powerful serverless compute service that allows you to run code without provisioning or managing servers. However, testing Lambda functions in a cloud environment can be cumbersome and time-consuming. Fortunately, Docker provides a seamless way to simulate AWS Lambda locally, making the development and testing process much more efficient.

In this post, I'll guide you through setting up a Docker container to test your AWS Lambda functions written in Golang.

## Prerequisites

Before we dive in, make sure you have the following installed on your machine:

- Docker
- Docker Compose
- AWS CLI
- Golang

## Setting Up Your Environment

First, let's create a `docker-compose.yaml` file to define our Docker services. This file will set up a container that simulates the AWS Lambda environment.

```yaml
services:
  lessons-create:
    container_name: lessons-create
    image: public.ecr.aws/lambda/go:latest
    command: create
    ports:
      - 8080:8080
    volumes:
      - ./bin:/var/task
      - ${HOME}/.aws/:/root/.aws
    restart: always
```

### Configuration Explained

| Property | Description |
|----------|-------------|
| `image` | The public AWS Lambda image for Golang |
| `command` | The Lambda function handler name (`create`) |
| `ports` | Maps container port 8080 to host port 8080 |
| `volumes` | Mounts the compiled binary and AWS credentials |
| `restart` | Ensures the container restarts on failure |

The `./bin` volume is where your compiled Golang binary lives, and `${HOME}/.aws` allows the container to access your AWS credentials for any SDK calls.

## Compiling Your Golang Code

Ensure your Golang code is compiled for Linux (since the container runs Linux) and placed in the `./bin` directory:

```bash
GOOS=linux GOARCH=amd64 go build -o ./bin/create main.go
```

## Running the Docker Container

With your `docker-compose.yaml` ready and Golang code compiled, start the container:

```bash
docker-compose up
```

## Testing Your Lambda Function

With the container running, test your Lambda function by sending HTTP requests to the local endpoint. You can use `curl` or Postman.

```bash
curl -X POST http://localhost:8080/2015-03-31/functions/function/invocations \
  -d '{}'
```

For a more realistic test with an event payload:

```bash
curl -X POST http://localhost:8080/2015-03-31/functions/function/invocations \
  -d '{"key": "value"}'
```

## Conclusion

Using Docker to simulate AWS Lambda functions locally can significantly streamline your development and testing workflow. You get faster feedback loops, no deployment delays, and the ability to debug locally before pushing to the cloud.

## More Resources

- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [AWS Lambda Go Documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-golang.html)

