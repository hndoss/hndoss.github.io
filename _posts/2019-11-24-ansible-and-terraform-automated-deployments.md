---
layout: post
title: "Immutable Infrastructure with Terraform and Ansible Deployments, Part I"
description: Immutable infrastructure deployments
image: 'https://cdn.pixabay.com/photo/2015/04/05/16/12/lego-708088_960_720.jpg'
twitter_text:
category: 'devops'
introduction:
---

 I want to show you a way to deploy your application using `Ansible`, `Terraform` in `Google Cloud Platform`. I divided the topic in three parts:
- Part I: Creating an Environment
- Part II: Provisioning the Environment.
- Part III: CI/CD Deploy to GCP.


# Part I: Creating an Environment

# Tool: Terraform
[Terraform](https://www.terraform.io/index.html) is just magic. It is a fantastic tool created by [Hashicorp](https://www.hashicorp.com), for building, changing, and versioning infrastructure safely and efficiently.

For creating a development environment in GCP I needed several resources:
- Variables
- A Provider
- A Google Compute Instances
- A Firewall
- A Bucket
- DNS Records

---
## Variables
It's better to reduce static configurations as much as possible. Variables are a nice way to reduce their rigidness and make them more flexible—flexible enough to admit change without making your Ops team cry. For example, the names of resources can depend on variables; in that way, it is easy to reutilize the code by just changing the values.
```
# vars.tf

variable "name_prefix" {
  description = "Environment name."
  default     = "test"
}

variable "project_id" {
  description = "GCP project id."
}

variable "private_key_id" {
  description = "GCP private key id."
}

variable "private_key" {
  description = "GCP private key."
}

variable "client_email" {
  description = "GCP client email."
}

variable "client_id" {
  description = "GCP client id."
}
```
You will notice that the next resources' names depend on the variable `name_prefix`. Check the name of the google_compute_address resource: `${var.name_prefix}-static-ip`. Let's say the value of `environment` is `development`, and the value of `application` is `dummy`. name_prefix would then be `dummy-development`. Therefore, the name of the google_compute_address resource would be: `dummy-development-static-ip`.

---
## A Provider

A [provider](https://www.terraform.io/docs/providers/index.html) is responsible for understanding API interactions and exposing resources. I'm using [Google provider](https://www.terraform.io/docs/providers/google/provider_reference.html) and since we are adding this to the pipeline and sharing it in a git repository, I'm interpolating variables to avoid sensitive data exposure. All the variables should be declared in the variables section, therefore, keep in mind that all the `var.something`s needs to be defined in `vars.tf`. Google Provider helps manage the [GCP service account](https://cloud.google.com/compute/docs/access/service-accounts).

```
# provider.tf

provider "google" {
  credentials = <<CREDENTIALS
{
    "type": "service_account",
    "project_id": "${var.application_id}",
    "private_key_id": "${var.private_key_id}",
    "private_key": "${var.private_key}",
    "client_email": "${var.client_email}",
    "client_id": "${var.client_id}",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
} 
    CREDENTIALS
  project = "${var.application_id}"
  region = "us-west1"
}
```

---
## A Google Compute Instance
[Compute Engine](https://cloud.google.com/compute/) delivers virtual machines running in Google's innovative data centers and worldwide fiber network. Creating a new instance is really easy and straight forward.

```
# vm.tf

resource "google_compute_instance" "backend" {
  name         = "${var.name_prefix}"
  machine_type = "n1-standard-1"
  zone         = "us-west1-a"

  boot_disk {
    initialize_params {
      image = "gce-uefi-images/ubuntu-1804-lts"
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip = "${google_compute_address.static-ip.address}"
    }
  }

  tags = ["backend"]
  metadata = {
    ssh-keys = "ansible:${file("key.pub")}"
  }
}

resource "google_compute_address" "static-ip" {
  name = "${var.name_prefix}-static-ip"
}
```

Notice that in this piece of code there are two resource definitions: `google_compute_instance` and `google_compute_address`. To simplify the communication between the frontend and the backend, I'm using static IPs, now I can turn off the instances to save money and other resources, and the frontend will know exactly where to find the backend. Terraform will orchestrate the creation of these resources. Inside the `google_compute_instance` there is a section called `network_interface`. There, I'm configuring the virtual machine to use a static IP by just assigning the `nat_ip` to a given IP. The second resource has a property called address, which is a also static IP. 

`google_compute_instance.backend.network_interface.nat_ip` accepts IP addresses, and `google_compute_address.static-ip.address` is an IP. It's like having two lego pieces and joining them together. All the available configuration and arguments are explained in the [resource's documentation](https://www.terraform.io/docs/providers/google/r/compute_instance.html).

---
## A Firewall
Each network has its own [firewall](https://cloud.google.com/vpc/docs/firewalls) controlling access to and from the instances. The backend is run on port 5000. How do I apply this rule? Notice the `target_tags`; `backend` is the same tag I tagged my vm instance with.

```
# firewall.tf

resource "google_compute_firewall" "allow_5000" {
  name    = "${var.name_prefix}-allow-5000"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["5000"]
  }
  target_tags = ["backend"]
}
```

---
## A Bucket
This one is simple: just create an empty bucket and configure it to be public.

```
# bucket.tf

resource "google_storage_bucket" "bucket" {
    name = "${var.name_prefix}.${var.domain_name}"
    location = "US"
    project = "${var.application_id}"
    storage_class = "${var.bucket_storage_class}"
    force_destroy = true
    versioning {
        enabled = false
    }

    website {
        main_page_suffix = "index.html"
        not_found_page = "404.html"
    }
}

resource "google_storage_default_object_acl" "default_obj_acl" {
    bucket = "${google_storage_bucket.bucket.name}"
    role_entity = var.role_entity
}
```

---
## DNS Records
The frontend needs to know where the backend is. To simplify the networking and the API calls, I'm creating a DNS record, binding the backend's IP to a subdomain. This part needs previous configuration, you should own a domain name and Terraform's GCP service account should have all the needed permissions to perform this task. The second resource, cname, is required for static web sites in GCP buckets.

```
# dns.tf

resource "google_dns_record_set" "backend-dns-record" {
  name         = "${var.name_prefix}-api.hndoss.com."
  managed_zone = "gcp"
  type         = "A"
  ttl          = 300
  rrdatas      = ["${google_compute_instance.backend.network_interface.0.access_config.0.nat_ip}"]
}

resource "google_dns_record_set" "cname" {
  name         = "${var.name_prefix}.${var.domain_name}."
  managed_zone = "gcp"
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["c.storage.googleapis.com."]
}
```

# Conclusion
There are several ways to create infrastructure for a project, one of those is using Terraform. In a world that is continuously evolving we should evolve as well. This is no time to perform manual processes when all can be automated and shipped as value right away. 
