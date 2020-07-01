---
layout: post
title: "Prometheus Service Discovery on AWS EC2"
description: Consider human errors, the stack of other task we hide behind the Kanban board, and the fact that we all are a little bit lazy. I think I have made my point, we need to automate this process. 
image: 'https://cdn.pixabay.com/photo/2017/11/13/22/12/compass-2946959_960_720.jpg'
twitter_text: Consider human errors, the stack of other task we hide behind the Kanban board, and the fact that we all are a little bit lazy. I think I have made my point, we need to automate this process. 
category: 'devOops'
tags:
  - monitoring
author: hector
paginate: true
---

Cool, now you have Prometheus and Node Exporter up and running. What if you want to add a third EC2 instance? A trivial task, you only need to go back to Prometheus, update its static configuration and restart the service, manually. So, every time some change is needed, you might need to do it yourself or hire Bob ~~if your name is Bob, don't take it personal.~~ to work on that on the weekends. Also, consider human errors, the stack of other task we hide behind the Kanban board, and the fact that we all are a little bit lazy. I think I have made my point, we need to automate this process. Don't worry, Prometheus got our backs, now meet Prometheus Service Discovery feature. 

Well, in fact, there are many service discovery options out there. Check out the [list](https://github.com/prometheus/prometheus/tree/master/discovery). In our case we are going to use EC2 Service Discovery.

To continue reading follow these links:

* [Install Prometheus on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part1)
* [Prometheus Node Exporter on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part2)
* Prometheus Discovery Service on AWS EC2
* [Prometheus Alert Manager Sending Emails](https://codewizardly.com/prometheus-on-aws-ec2-part4)


## Create an IAM User

This part might be confusing if you are not familiar with AWS IAM just because the new terms behind what is needed. Let's talk about a few concepts first:

### User
> "An AWS Identity and Access Management (IAM) user is an entity that you create in AWS to represent the person or application that uses it to interact with AWS. A user in AWS consists of a name and credentials." [Read more](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)

### Policy
> "A policy is an object in AWS that, when associated with an identity or resource, defines their permissions. IAM policies define permissions for an action regardless of the method that you use to perform the operation." [Read more](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)

### Instructions

* First, select **IAM** from the AWS Services using the search bar.
[![Select IAM](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/15-select-iam.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/15-select-iam.png)

---
* Select **Users** from the sidebar menu.
[![Select User](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/16-select-users.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/16-select-users.png)

---
* Click on **Add user** button. 
[![Add User](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/17-add-user.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/17-add-user.png)

---
* Set user details. Pick a name of your preference for the new user and fill the blank space. Also, give the user just **Programmatic access**, our user will not login to AWS Console which is the user interface we are currently using. 
[![Set User Details](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/18-set-user-details.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/18-set-user-details.png)

---
* Set permissions for the new user. At this point, the new user is not capable to do nothing. Attach an existing policy using the filter and looking for **AmazonEC2ReadOnlyAccess**.
> "IAM enables security best practices by allowing you to grant unique security credentials to users and groups to specify which AWS service APIs and resources they can access. IAM is secure by default; users have no access to AWS resources until permissions are explicitly granted."

[![Set Permissions](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/19-set-permissions.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/19-set-permissions.png)

---
* Add tags. This step is optional but it is a good idea to add tags for future reference. The number of IAM users often grows without any control and without a reference is really hard to tell which user you actually need. Remember that every user means a potential target for attackers and it could be an open door to your AWS account.
[![UserTags](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/20-user-tags.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/20-user-tags.png)

---
* Review the details of the new user.
[![Review User](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/21-review-user.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/21-review-user.png)

---
* Save credentials in a safe place. It is really important to keep these values in a safe place. With this credentials anyone could use your AWS account and generate bills.
[![Save Credentials](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/22-get-credentials.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/22-get-credentials.png)


## Configure Prometheus Service Discovery

Now we need to go back to Prometheus and change the configuration again. Remember that `ec2-3-17-28.53.us-east-2.compute.amazonaws.com` is the DNS value I got from my configuration and yours should be something different.

* Start a session in the Prometheus host virtual machine.

```bash
ssh -i prometheus.pem ubuntu@ec2-3-17-28.53.us-east-2.compute.amazonaws.com
```

---
* Edit `/etc/prometheus/prometheus.yml` file. Notice the `region` property, this could be different in your setup.

```bash
global:
  scrape_interval: 1s
  evaluation_interval: 1s

scrape_configs:
  - job_name: 'node'
    ec2_sd_configs:
      - region: us-east-1
        access_key: PUT_THE_ACCESS_KEY_HERE
        secret_key: PUT_THE_SECRET_KEY_HERE
        port: 9100
```

---
* Restart Prometheus service.

``` 
sudo systemctl restart prometheus
```

## Try It Out
Let's see if Prometheus is finding our Node-Exporter instance. Go to `http://ec2-3-17-28.53.us-east-2.compute.amazonaws.com:9090/targets`. You might see other instances registered since Prometheus is looking up for all the EC2 instances in the same network.
[![Service Discovery](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/23-service-discovery.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/23-service-discovery.png)