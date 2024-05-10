---
# frontmatter
path: "/tutorial-couchbase-installation-options"
title: Couchbase Database Server Installation Options
short_title: Couchbase Installation
description: 
  - Learn about all the different ways you can install and use Couchbase
  - Compare Capella, Local Installation, Docker/Kubernetes Containerized Clusters, and in-VPC Cloud deployments to find the best solution for your needs
  - See how Couchbase Playground can provide quick temporary access to a Couchbase cluster for experimenting and testing
content_type: tutorial
filter: other
technology:
  - capella
  - server
tags:
  - Installation
  - Configuration
sdk_language:
  - any
length: 10 Mins
---

- [Couchbase Capella](#couchbase-capella)
- [Playground](#playground)
- [Local Installation](#local-installation)
- [Container Deployment](#container-deployment)
- [Cloud Deployment](#cloud-deployment)

## Couchbase Capella

Couchbase Capella provides a free 30 day trial of Couchbase cluster, it is the easiest and fastest way to get started with Couchbase. Be up and running in just under 10 minutes with a fully managed database-as-a-service (DBaaS) and 50GB of initial storage and no upfront payment needed. You can try out our N1QL query language (SQL for JSON) for free, eliminating database management efforts and reducing overall costs.

You can sign-up for Couchbase Capella following the link below:

- [Deploy with Couchbase Capella](https://developer.couchbase.com/tutorial-capella-sign-up-ui-overview?learningPath=learn/capella)

## Playground

With Couchbase Playground, developers can get a temporary sandbox Couchbase cluster to experiment for free with no download or installation required for the developer. A web browser is all you need to experiment with various SDKs. Couchbase Playground also enables developers to 'Test-Drive' their Couchbase Capella trial instance with code samples from 9 SDK for many programming languages. Developers can even modify these code examples and run them against a Couchbase database, all from within the browser.

Playground works in three different modes:

- Zero-friction session-less mode
- Short-lived sandbox session
- Long-lived Capella session

Try Couchbase Playground now by following the link below:

- <a href="https://cloud.couchbase.com/playground" target="_blank">Open Couchbase Playground</a> 

## Local Installation

Couchbase Database Server can be downloaded and installed locally on a developers' machine. The links below will guide you through the installation process in different development machines:

**Windows**

Couchbase Server can be installed on a Windows machine by following the link below.

- [Installing Couchbase Server on Windows](https://docs.couchbase.com/server/current/install/install-package-windows.html)
  
**macOS**

For macOS development please follow the link below:

**NOTE:** **Currently, we DO NOT support ARM based machines and the local installations will run in Rosetta. Due to this we don't support Container installation with docker on macOS with ARM processors.**

- [How to install Couchbase Server on macOS](https://docs.couchbase.com/server/current/install/macos-install.html)

**Linux**

- [Install on Red Hat Enterprise and CentOS](https://docs.couchbase.com/server/current/install/rhel-suse-install-intro.html)
- [Install on Ubuntu and Debian](https://docs.couchbase.com/server/current/install/ubuntu-debian-install.html)
- [Install on SUSE Enterprise](https://docs.couchbase.com/server/current/install/install_suse.html)
- [Install on Oracle Enterprise](https://docs.couchbase.com/server/current/install/install-oracle.html)
- [Install on Amazon Linux 2](https://docs.couchbase.com/server/current/install/amazon-linux2-install.html)

## Container Deployment

Developers can deploy Couchbase Server in a docker container for quick and easy access. The following guide can walk you through this process.

**Docker Container**

Docker installation could be achieved following the link below:

- [Installing Couchbase Database Server on Docker Container](https://docs.couchbase.com/server/current/install/getting-started-docker.html)

## Cloud Deployment

Couchbase Database Server can also be deployed in the cloud and accessed remotely. The following guide provides instructions with various cloud providers.

**AWS**

- [Deploy with AWS Marketplace](https://docs.couchbase.com/server/current/cloud/couchbase-aws-marketplace.html)
- [Deploy with Terraform](https://docs.couchbase.com/server/current/cloud/aws-terraform.html)

**Azure**

- [Deploy with Azure Marketplace](https://docs.couchbase.com/server/current/cloud/couchbase-azure-marketplace.html)

**GCP**

- [Deploy with GCP Marketplace](https://docs.couchbase.com/server/current/cloud/couchbase-gcp-cloud-launcher.html)
