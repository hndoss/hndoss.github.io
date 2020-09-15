---
layout: post
title: Prometheus Node Exporter on AWS EC2
description: In the previous topic we installed Prometheus and now is ready to receive metrics.
image: https://images.pexels.com/photos/256219/pexels-photo-256219.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940
twitter_text: In the previous topic we installed Prometheus and now is ready to receive metrics.
category: devops
tags:
 - monitoring

author: hector
paginate: true
---

In the [previous topic](https://codewizardly.com/prometheus-on-aws-ec2-part1) we installed Prometheus and now is ready to receive metrics. The next step is to launch a second AWS EC2 instance, install Prometheus Node Exporter in it and finally, configure Prometheus to collect its metrics.

To continue reading follow these links:

* [Install Prometheus on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part1)
* Prometheus Node Exporter on AWS EC2
* [Prometheus Discovery Service on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part3)
* [Prometheus Alertmanager Sending Emails](https://codewizardly.com/prometheus-on-aws-ec2-part4)

# Prometheus Node Exporter

There are many [exporters and integrations](https://prometheus.io/docs/instrumenting/exporters) available for Prometheus. As mentioned above, in this example we are going to install Prometheus Node Exporter in an AWS EC2 instance.  

> "Prometheus exporter for hardware and OS metrics exposed by *NIX kernels, written in Go with pluggable metric collectors." 

## Setup an EC2 Machine

The instructions are similar to the [steps we followed to create a Prometheus EC2 instance](https://codewizardly.com/prometheus-on-aws-ec2-part1/#create-an-aws-ec2-instance) with some light differences. 

One of these differences is that we don't need to create a new Key Pair since we already created one for Prometheus, as long we have this key safely stored we can choose it from the drop down.
[![Node Exporter Key Pair](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/14-node-exporter-key-pair.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/14-node-exporter-key-pair.png)

The second difference is that we also don't need to create a Security Group since we already created one with all the inbound and outbound rules defined for Prometheus and for the Node Exporter.
[![Node Exporter SG](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/13-node-exporter-security-group.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/13-node-exporter-security-group.png)

## Installation

Now we should have two AWS EC2 instances created, one Security group and one ssh key for both machines. In your case it will be different but I got the following:

| Machine | Public DNS | Port |
|---------|-----------|------|
|prometheus-server| ec2-3-17-28.53.us-east-2.compute.amazonaws.com | 9090 |
|prometheus-node-exporter| ec2-13-58-127-241.us-east-2.compute.amazonaws.com | 9100 |

---
* We need to start a session in the new virtual machine.

``` bash
ssh -i prometheus.pem ubuntu@ec2-13-58-127-241.us-east-2.compute.amazonaws.com
```

---
* Now let's create a user for Prometheus Node Exporter

``` bash
sudo useradd --no-create-home node_exporter
```

---
* We are ready to install Node Exporter binaries.

``` bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.0.1/node_exporter-1.0.1.linux-amd64.tar.gz
tar xzf node_exporter-1.0.1.linux-amd64.tar.gz
sudo cp node_exporter-1.0.1.linux-amd64/node_exporter /usr/local/bin/node_exporter
rm -rf node_exporter-1.0.1.linux-amd64.tar.gz node_exporter-1.0.1.linux-amd64
```

---
* Configure a service. Create `/etc/systemd/system/node-exporter.service` if it doesn't exist.

``` 
[Unit]
Description=Prometheus Node Exporter Service
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
```

---
* Configure systemd.
``` 
sudo systemctl daemon-reload
sudo systemctl enable node-exporter
sudo systemctl start node-exporter
sudo systemctl status node-exporter
```

## Configure Prometheus Server

Now we need to go back to the first AWS EC2 instance where we installed Prometheus and change its configuration to start receiving metrics from the Node Exporter we just installed and configured.

* Start a session in the Prometheus host virtual machine.
``` bash
ssh -i prometheus.pem ubuntu@ec2-3-17-28.53.us-east-2.compute.amazonaws.com
```

---
* Edit `/etc/prometheus/prometheus.yml` file.

```bash
global:
  scrape_interval: 15s
  external_labels:
    monitor: 'prometheus'

scrape_configs:

  - job_name: 'node_exporter'

    static_configs:

      - targets: ['ec2-13-58-127-241.us-east-2.compute.amazonaws.com:9100']
```

Remember that `ec2-13-58-127-241.us-east-2.compute.amazonaws.com` is the DNS value I got from my configuration and yours should be something different.

---
* Restart Prometheus service.
``` 
sudo systemctl restart prometheus
```

## Try It Out

Now in your browser navigate to `http://ec2-3-17-28.53.us-east-2.compute.amazonaws.com:9090/targets` . Remember to change the url accordingly to your Prometheus AWS EC2 instance details and you should see something similar to this:

[![Try it out](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/12-prometheus-node-exporter.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/12-prometheus-node-exporter.png)

## More Information

For more information you can visit [Prometheus Node Exporter guide](https://prometheus.io/docs/guides/node-exporter) or [the Node Exporter Github repository](https://github.com/prometheus/node_exporter). 
