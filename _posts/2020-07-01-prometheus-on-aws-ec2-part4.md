---
layout: post
title: "Prometheus Alert Manager Sending Emails"
description: Let's face it, there will be something wrong at some point, and you need to know when it is happening. 
image: 'https://cdn.pixabay.com/photo/2018/03/22/02/37/email-3249062_960_720.png'
twitter_text: Let's face it, there will be something wrong at some point, and you need to know when it is happening. 
category: 'devOops'
tags:
  - monitoring
author: hector
paginate: true
---

Let's recap, we have a Prometheus instance on an AWS EC2 instance configured to discover services on port 9100 in the same network and one Node Exporter instance collecting OS metrics that can be easily upgraded to many Node Exporter instances as desired. 

Follow the whole history:
* [Install Prometheus on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part1)
* [Prometheus Node Exporter on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part2)
* [Prometheus Discovery Service on AWS EC2](https://codewizardly.com/prometheus-on-aws-ec2-part3)
* Prometheus Alert Manager Sending Emails

But we are not over, we don't want to be monitoring by ourselves. Prometheus can send us an alert when it finds something directly to an email. Let's configure some rules and the Prometheus Alert Manager with a Gmail account to accomplish this.

> "The Alertmanager handles alerts sent by client applications such as the Prometheus server. It takes care of deduplicating, grouping, and routing them to the correct receiver integrations such as email, PagerDuty, or OpsGenie. It also takes care of silencing and inhibition of alerts." [Read more](https://github.com/prometheus/alertmanager).


## Generate an App Password

* Go to your account: [https://myaccount.google.com](https://myaccount.google.com)

* From the left menu select **Security**

[![Security](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/24-security.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/24-security.png)

* Select the Signing in to Google panel select **App Passwords**. 

For this step it is also required the following:
1. 2fa Verification is set up for your account.
1. 2fa Verification is not set up for security keys only.
1. Your account is not through work, school, or other organization.
1. You’ve not turned on Advanced Protection for your account.

[![App Passwords](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/25-app-passwords.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/25-app-passwords.png)

* Create a new App password.

![[Select App Device](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/26-select-app-device.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/26-select-app-device.png)

* Choose a custom name for the App password.

[![Custom Name](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/27-custom-name.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/27-custom-name.png)

* Save the App password in a safe place.
[![Save Credentials](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/28-save-credentials.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/28-save-credentials.png)

## Install Alertmanager

* Login in the Prometheus instance. Don't forget to replace this line with your configuration. 

```bash
ssh -i prometheus.pem ubuntu@ec2-3-17-28.53.us-east-2.compute.amazonaws.com
```

---
* Install Alertmanager.

```bash
wget https://github.com/prometheus/alertmanager/releases/download/v0.21.0/alertmanager-0.21.0.linux-amd64.tar.gz
tar xvfz alertmanager-0.21.0.linux-amd64.tar.gz

sudo cp alertmanager-0.21.0.linux-amd64/alertmanager /usr/local/bin
sudo cp alertmanager-0.21.0.linux-amd64/amtool /usr/local/bin/
sudo mkdir /var/lib/alertmanager

rm -rf alertmanager*
```

* Add Alertmanager's configuration `/etc/prometheus/alertmanager.yml`.

```bash
route:
  group_by: [Alertname]
  receiver: email-me

receivers:
- name: email-me
  email_configs:
  - to: EMAIL_YO_WANT_TO_SEND_EMAILS_TO
    from: YOUR_EMAIL_ADDRESS
    smarthost: smtp.gmail.com:587
    auth_username: YOUR_EMAIL_ADDRESS
    auth_identity: YOUR_EMAIL_ADDRESS
    auth_password: APP_PASSWORD_YOU_GENERATED
```

---
* Configure Alertmanager as a service. `/etc/systemd/system/alertmanager.service`

```bash
[Unit]
Description=Alert Manager
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=/usr/local/bin/alertmanager \
  --config.file=/etc/prometheus/alertmanager.yml \
  --storage.path=/var/lib/alertmanager

Restart=always

[Install]
WantedBy=multi-user.target
```

* Configure Systemd

```bash
sudo systemctl daemon-reload
sudo systemctl enable alertmanager
sudo systemctl start alertmanager
```

## Create Rules

This is just a simple alert rule. In a nutshell it alerts when an instance has been down for more than 3 minutes. Add this file at `/etc/prometheus/rules.yml`.

```bash
groups:
- name: Down
  rules:
  - alert: InstanceDown
    expr: up == 0
    for: 3m
    labels:
      severity: 'critical'
    annotations:
      summary: "Instance {{ $labels.instance }} is down"
      description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 3 minutes."
```

## Configure Prometheus

* Let's change the permissions of the directories, files and binaries we just added to our system.

```bash
sudo chown -R prometheus:prometheus /etc/prometheus
```

* Update Prometheus configuration file. Edit `/etc/prometheus/prometheus.yml`.

```bash
global:
  scrape_interval: 1s
  evaluation_interval: 1s

rule_files:
 - /etc/prometheus/rules.yml

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - localhost:9093

scrape_configs:
  - job_name: 'node'
    ec2_sd_configs:
      - region: us-east-1
        access_key: PUT_THE_ACCESS_KEY_HERE
        secret_key: PUT_THE_SECRET_KEY_HERE
        port: 9100
```

* Reload Systemd

```bash
sudo systemctl restart prometheus
```

## Try It Out

* Turn off the Node Exporter AWS EC2 Instance

[![Stop EC2 Instance](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/29-stop-ec2-instance.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/29-stop-ec2-instance.png)

* Wait for 3 minutes and check the Alertmanager URL that is installed in your `prometheus-server` instance: `http://ec2-34-229-224-133.compute-1.amazonaws.com:9093/#/alerts`. As always, remember that you need to use a different URL depending on your AWS EC2 instance details.

* Check your email

[![Alert Email](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/30-email.png)](https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/30-email.png)

https://hndoss-blog-bucket.s3.amazonaws.com/prometheus-on-aws-ec2/1-launch-instance.png