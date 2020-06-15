---
layout: post
title: "Prometheus Node Exporter on AWS EC2"
description: Lets face it, there will be something wrong at some point, and you need to know when it is happening. 
image: 'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_960_720.jpg'
twitter_text: Lets face it, there will be something wrong at some point, and you need to know when it is happening. 
category: 'devOops'
introduction: Lets face it, there will be something wrong at some point, and you need to know when it is happening. 
---

Lets face it, there will be something wrong at some point, and you need to know when it is happening. That awesome application you had been working for 6 months and you care too much and you treat as your child is going to be in troubles someday. One of the key process to ensure quality is monitoring. Like a fire alarm in a building, monitoring tools alerts the team when something is not going well. Prometheus can help you with that and more. 

[Prometheus](https://prometheus.io) is an awesome open-source tool for monitoring. Designed for reliability, and meant to be the system you look for during an outage to allow you to quickly diagnose problems. In this example, we are going to use [Node Exporter](https://github.com/prometheus/node_exporter) to get metrics and know what is happening in real time:

> Prometheus exporter for hardware and OS metrics exposed by *NIX kernels, written in Go with pluggable metric collectors. 

## Setup EC2 Machines

AWS offers a Free Tier after creating an account and they are two main types of tiers I want to list:

* 12 Months Free: Starts after you create an account. 
* Always Free: Services and resources always free with some limits (e. g. AWS Lambda 1 Million free requests per month). 

This means that after creating an account you will have exactly 1 year of free usage of a list of services. To configure and test Prometheus in AWS you could create an account, if you don't have one already, and consume the Amazon EC2 750 Hours free per month. It is worth to mention that they are still some limits in the Free Tier plan and talking specifically of AWS EC2, if you want to stay within the Free Tier, you must use only EC2 Micro instances. We will review a few concepts along this post to clarify what I mean. 

We will need two AWS EC2 instances: one as a Prometheus Server and the other one will have Prometheus Node Exporter installed. To keep it simple, all the process is manual. 

## Instructions

Follow the next instructions to launch a new AWS EC2 instance for a Prometheus server. If you can't read the image, click on it to have a better view. Follow the same instructions for the second AWS EC2 instance where Prometheus Node Exporter will be installed with minor changes like the `Name` tag, Key-Pair step and also the Security Group. 

1. Go to AWS EC2 Dashboard in your [AWS Console](https://console.aws.amazon.com) and start the launch instance wizard. 

[![Laungh Instance](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/1-launch-instance.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/1-launch-instance.png)

1. Select `Ubuntu Server 20.04 AMI` or any Ubuntu distribution of your like. 

[![Select Ami](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/2-select-ami.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/2-select-ami.png)

1. Choose t2. micro as the desired instance type. Be careful selecting the instance type because not choosing wisely can lead to **serious consequences**. ~~Like paying. ~~ Notice that the next step is to click `Next: Configure Instance Details` button and not the `Review and Launch` button. 

[![Select Instance Type](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/3-select-instance-type.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/3-select-instance-type.png)

1. Configure the instance details. Notice that I selected the default VPC and the default subnet. You might see other ids but as long you select the default configuration the result is going to be the same. If you want to set a more complex, isolated and secured network is up to you.

[![Configure Instance Details](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/4-configure-instance-details.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/4-configure-instance-details.png)

1. Add storage, 8 GB is more than what we need for this example.

[![Add Storage](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/5-add-storage.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/5-add-storage.png)

1. Add a `Name` tag, this is the name of the EC2 instance. `prometheus-server` and `prometheus-node-exporter` for example. 

[![Add Tags](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/6-add-tags.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/6-add-tags.png)

1. Configure a Security Group, think of it like firewall rules. We will need port `9090` for Prometheus server and port `9091` for Prometheus Node Exporter. Please, give a proper name to the Security group. It is really annoying to find a `HUGE` list of `launch-wizard-${number}` . For this example, when creating the second AWS EC2 instance, select the Security Group you already made for the first instance instead of creating a new one. 

[![Configure Security Group](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/7-configure-security-group.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/7-configure-security-group.png)

1. Review instance launch.

[![Review Instance Launch](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/8-review-instance-launch.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/8-review-instance-launch.png)

1. Create a new Key Pair if necessary. This is an important step because without this key you wouldn't be able to connect to the AWS EC2 instance. After creating a Key Pair for the first AWS EC2 instance, you can select it for the second AWS EC2 instance.

[![Select a Key Pair](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/9-select-key-pair.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/9-select-key-pair.png)

1. Launch it.

[![Launch it](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/10-launch.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/10-launch.png)

1. Get the Public Ip.

[![Get Public Ip](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/11-get-public-ip.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/11-get-public-ip.png)

### Installation

Now that we have the infrastructure ready we can continue the process. Be aware that your Public Ips are going to be different since AWS assigns random IPs by default. 

| Machine | Public IP | Port |
|---------|-----------|------|
|prometheus-server| 3. 17. 28. 53 | 9090 |
|prometheus-node-exporter| 13. 58. 127. 241 | 9100 |

First, lets install the Node Exporter in one of the machines. 

``` bash
# connect to the prometheus-node-exporter instance
chmod 400 prometheus.pem 
ssh -i prometheus.pem ubuntu@13.58.127.241 

# download and run the node_exporter binary
wget https://github.com/prometheus/node_exporter/releases/download/v1.0.0/node_exporter-1.0.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.0.0.linux-amd64.tar.gz
cd node_exporter-1.0.0.linux-amd64
./node_exporter
```

Now, lets configure the Prometheus Server in the other machine. 

``` bash
ssh -i prometheus.pem ubuntu@3.17.28.53
wget https://github.com/prometheus/prometheus/releases/download/v2.19.0/prometheus-2.19.0.linux-amd64.tar.gz
tar xvfz prometheus-2.19.0.linux-amd64.tar.gz
cd prometheus-2.19.0.linux-amd64
./prometheus --version
```

Add/Replace the following file

``` 
# prometheus.yml
scrape_configs:
- job_name: 'node'
  static_configs:
  - targets: ['13.58.127.241:9100']
```

And finally, run prometheus. 

``` 
./prometheus --config.file=./prometheus.yml
```

Go the browser and look for http://3.17.28.53:9090/graph replacing the IP address of your Prometheus server, and you should see the EC2 instance we are monitoring. 
[![Prometheus Server](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/prometheus-server.png)](https://hndoss-blog-bucket.s3.amazonaws.com/2020-06-14-prometheus-how-to/prometheus-server.png)

## More Information

If you want to know more about Prometheus features, check [here.](https://prometheus.io/docs/introduction/overview/#features). Also consider [Grafana](https://grafana.com/) to improve the experience. Prometheus has a really good documentation site [here](https://prometheus.io/docs/visualization/grafana) and the documentation in general is really good, it also has a `Best Pratices`, `Concepts`, and an `Alerting` section.
