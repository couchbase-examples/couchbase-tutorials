---
# frontmatter
path: "/tutorial-node-exporter-setup"
title: Prometheus Node Exporter Setup
short_title: Node Exporter Setup
description: 
  - This step is optional, but enables system metric ingestion using the Node Exporter agent
  - Learn how to gather metrics from each server running Couchbase
content_type: tutorial
filter: observability
technology: 
  - server
tags:
  - Prometheus
  - Monitoring
  - Observability
  - Configuration
sdk_language:
  - any
length: 15 Mins
---

The Node Exporter is an agent that gathers system metrics and exposes them in a format which can be ingested by Prometheus. The Node Exporter is a project that is maintained through the Prometheus project. This is a completely optional step and can be skipped if you do not wish to gather system metrics. The following will need to be performed on each server that you wish to monitor system metrics for.

## Download Node Exporter

[Download](https://prometheus.io/download/) the Node Exporter binary to each Couchbase Server that you want to monitor. The Node Exporter will export system related stats.

```bash
wget \
  https://github.com/prometheus/node_exporter/releases/download/v1.0.1/node_exporter-1.0.1.linux-amd64.tar.gz
```

Visit the Prometheus [downloads page](https://prometheus.io/download/) for the latest version.

## Create User

Create a Node Exporter user, required directories, and make prometheus user as the owner of those directories.

```bash
sudo groupadd -f node_exporter
sudo useradd -g node_exporter --no-create-home --shell /bin/false node_exporter
sudo mkdir /etc/node_exporter
sudo chown node_exporter:node_exporter /etc/node_exporter
```

## Unpack Node Exporter Binary

Untar and move the downloaded Node Exporter binary

```bash
tar -xvf node_exporter-1.0.1.linux-amd64.tar.gz
mv node_exporter-1.0.1.linux-amd64 node_exporter-files
```

## Install Node Exporter

Copy `node_exporter` binary from `node_exporter-files` folder to `/usr/bin` and change the ownership to prometheus user.

```bash
sudo cp node_exporter-files/node_exporter /usr/bin/
sudo chown node_exporter:node_exporter /usr/bin/node_exporter
```

## Setup Node Exporter Service

Create a node_exporter service file.

```bash
sudo vi /usr/lib/systemd/system/node_exporter.service
```

Add the following configuration

```bash
[Unit]
Description=Node Exporter
Documentation=https://prometheus.io/docs/guides/node-exporter/
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
Restart=on-failure
ExecStart=/usr/bin/node_exporter \
  --web.listen-address=:9200

[Install]
WantedBy=multi-user.target
```

```bash
sudo chmod 664 /usr/lib/systemd/system/node_exporter.service
```

** Note: The default port for the `node_exporter` is actually `:9100` but that is the same port as the Couchbase Index Admin Port and cannot be used.

## Reload systemd and Start Node Exporter

Reload the `systemd` service to register the prometheus service and start the prometheus service.

```bash
sudo systemctl daemon-reload
sudo systemctl start node_exporter
```

Check the node exporter service status using the following command.

```bash
sudo systemctl status node_exporter
```

![Node Exporter Status](./assets/node_exporter-status.png)

Configure node_exporter to start at boot

```bash
sudo systemctl enable node_exporter.service
```

If `firewalld` is enabled and running, add a rule for port `9200`

```bash
sudo firewall-cmd --permanent --zone=public --add-port=9200/tcp
sudo firewall-cmd --reload
```

## Verify Node Exporter is Running

Verify the exporter is running by visiting the `/metrics` endpoint on the node on port `9200`

```bash
http://<node_exporter-ip>:9200/metrics
```

You should be able to see something similar to the following:

```bash
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0
go_gc_duration_seconds{quantile="0.25"} 0
go_gc_duration_seconds{quantile="0.5"} 0
go_gc_duration_seconds{quantile="0.75"} 0
go_gc_duration_seconds{quantile="1"} 0
go_gc_duration_seconds_sum 0
go_gc_duration_seconds_count 0
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 7
# HELP go_info Information about the Go environment.
# TYPE go_info gauge
go_info{version="go1.12.5"} 1
# HELP go_memstats_alloc_bytes Number of bytes allocated and still in use.
# TYPE go_memstats_alloc_bytes gauge
go_memstats_alloc_bytes 919280
...
```

## Clean Up

Remove the download and temporary files

```bash
rm -rf node_exporter-1.0.1.linux-amd64.tar.gz node_exporter-files
```
