---
layout: post
title: How To Deploy to AWS ECS Using The Same Docker Tag With Terraform
description: A workaround in case you have to reuse docker tags in AWS ECS and Terraform.
image: https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Telephone_booth_in_the_way_of_bicycle_tracks.jpg/800px-Telephone_booth_in_the_way_of_bicycle_tracks.jpg
twitter_text: Tricks Terraform into force a new deployment on AWS ECS.
category: devops
tags:
  - devops
  - aws
author: hector
paginate: true
---

Most of us have heard about [Terraform](https://www.terraform.io) and [AWS ECS](https://aws.amazon.com/ecs). One of the situations in which I have found myself is the fact that Terraform only makes changes to the infrastructure if needed, for this, it compares the infrastructure described in a [state](https://www.terraform.io/docs/language/state/index.html) and checks if it is necessary to add, update or delete something, otherwise, nothing is executed. In the case that it is needed to use the same docker image tag like `latest` over and over again,, it is difficult to automate deployments to ECS using Terraform. Since, even though the docker image is different, Terraform would not recognize any changes, since is using the same tag `latest`.


## Some Definitions

As a brief reminder, the components that makes AWS ECS work are as following:

* [ECS Cluster](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/clusters.html): Is a logical grouping of tasks or services. It can use EC2 instances as resources managed by the user, or can be a serverless compute engine for containers better known as [Fargate](https://aws.amazon.com/fargate).
* [Container Definition](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html): It is basically a docker container description where ports, docker image, cpu and others are defined.
* [Task Definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html): Is where other necessary configurations for containers are set with respect to AWS, such IAM roles, tags, data volumes and others.
* [Service](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html): Takes care that conditions are fulfilled. In other words, if a task definition has been defined, it can indicate how many replicas of out application to run, and in case something happens to a docker container, the service will be in charge of raining one again as long as the conditions indicated are met.

## ECS Task Definition
This is a task definition example that in turn contains a Container Definition. There can be more than one Container Definition per Task Definition.
``` 
resource "aws_ecs_task_definition" "task" {
  family                = "my service"
  execution_role_arn    = aws_iam_role.execution_role.arn # not described in this example 
  container_definitions = <<DEFINITION
[
    {
        "name": "my_container",
        "image": "my_docker_image:latest",
        "cpu": 10,
        "memoryReservation": 10,
        "links": [],
        "portMappings": [
            {
                "containerPort": 3000,
                "hostPort": 0,
                "protocol": "tcp"
            }
        ]-
        "essential": true,
        "entryPoint": [],
        "command": [],
        "environment": [
          {"name": "NODE_ENV", "value": "production"}
        ],
        "mountPoints": [],
        "volumesFrom": []
    }
]
DEFINITION

  tags = {
    Name        = "my_task_definition"
  }
}
```

## ECS Service
This service example will take care of having exactly `1` Task Definition replica available.
``` 
resource "aws_ecs_service" "service" {
  name            = local.name_prefix
  cluster         = "my_cluster"
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = 1

  tags = {
    Name        = "my_service"
  }
}
```

## Null Resource
If I had to describe what a [Null Resource](https://registry.terraform.io/providers/hashicorp/null/latest/docs/resources/resource) is in terraform, I would say that it is a logic or virtual component that allows to have an imaginary resource, meaning that, if something changes on it, Terraform will try to add, update or destroy it, but it doesn't represent a real piece of infrastructure. A [local-exec](https://www.terraform.io/docs/language/resources/provisioners/local-exec.html) provisioner type allows to execute commands in the instance where Terraform is being summoned. 

After briefly reviewing some concepts, this next example executes a command using `aws-cli` previously installed with enough permissions in the instance where Terraform is running. Terraform will always detect a change due to the trigger configuration which basically depends on a timestamp, always new and unrepeatable.

``` 
resource "null_resource" "cluster_update" {

  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "aws ecs update-service --cluster ${data.aws_ecs_cluster.ecs.cluster_name} --service ${aws_ecs_service.service.name} --force-new-deployment --region ${var.aws_region}"
  }
}
```

---
More links:
* Photo from [Flickr](https://www.flickr.com/photos/10361931@N06/4310495609)
* [What is Amazon Elastic Container Service?](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
