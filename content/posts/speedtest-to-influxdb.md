+++
title = 'Speedtest to InfluxDB'
description = 'Forking an existing Speedtest project to support InfluxDB2'
date = '2024-09-15'
draft = false
tags = ['python', 'speedtest', 'ookla']
categories = ['Homelab']
featuredimage = '/images/projects/speedtest.png'
+++

## Background

For several years I have used a simple docker setup to schedule speedtest runs and store the result in InfluxDB.  The project has been great, with its own Grafana dashboard but I hit a couple issues.  That led me to fork the repo, extend it, and make available at <https://github.com/wwhitaker/speedtests>.

## New Features

Building on the old, adding a few new.

### InfluxDB version 2 support

For starters, I wanted to move away from the older InfluxDB and the current v2 version.  That required building a new server instance and installing InfluxDB2.  With help from other similar forks, the code was updated to save to the database with new syntax.

However, this created issues with Grafana.  Since the existing dashboard was written with v1 query language, it did not know how to read the new data.  To keep using the dashboard, a translation was needed.

```bash
root@vm:/# influx v1 dbrp create --db MyDatabase --rp MyDatabase-rp --bucket-id <bucketID>

root@vm:/# influx v1 auth create --username readOnlyUser --read-bucket <bucketID>
? Please type your password ****************
? Please type your password again ****************
```

This gave me datasource to add to grafana, speaking in the influxdb v1 language used by the existing dashboard.

### Migrate InfluxDB v1 to v2

To not lose old data, a migration was needed.  Various methods exist to migrate data, but the simple approach below worked for me.

1. From the InfluxDB v1 server, export speedtests data to a line protocol file.

    ```shell
    influx_inspect export -datadir /var/lib/influxdb/data \
      -waldir /var/lib/influxdb/wal -database speedtests \
      -out speedtests.lp -lponly
    ```

2. Copy the speedtests.lp file to the InfluxDB2 server.
3. Import speedtests data into the speedtests bucket.

    ```shell
    influx write --bucket speedtests --file speedtests.lp
    ```

### Multi-platform Container

The current container only offered one CPU architecture.  To run it on alternate platforms, it needs to be built and packaged differently.  So I built a new CI workflow to build on both amd64 and arm64, pushing to GitHub's container registry.

```yml
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # https://github.com/docker/setup-qemu-action
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      # https://github.com/docker/setup-buildx-action
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Uses the `docker/login-action` action to log in to the Container registry registry using the account and password that will publish the packages. Once published, the packages are scoped to the account defined here.
      - name: Log in to the Container registry
        uses: docker/login-action@65b78e6e13532edd9afa3aa52ac7964289d1a9c1
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # This step uses [docker/metadata-action](https://github.com/docker/metadata-action#about) to extract tags and labels that will be applied to the specified image. The `id` "meta" allows the output of this step to be referenced in a subsequent step. The `images` value provides the base name for the tags and labels.
      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@9ec57ed1fcdbf14dcef7dfbe97b2010124a938b7
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      # This step uses the `docker/build-push-action` action to build the image, based on your repository's `Dockerfile`. If the build succeeds, it pushes the image to GitHub Packages.
      # It uses the `context` parameter to define the build's context as the set of files located in the specified path. For more information, see "[Usage](https://github.com/docker/build-push-action#usage)" in the README of the `docker/build-push-action` repository.
      # It uses the `tags` and `labels` parameters to tag and label the image with the output from the "meta" step.
      - name: Build and push Docker image
        id: push
        # uses: docker/build-push-action@f2a1d5e99d037542a71f64918e516c093c6f3fc4
        uses: docker/build-push-action@v6
        with:
          platforms: linux/amd64,linux/arm64
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          outputs: type=image,name=target,annotation-index.org.opencontainers.image.description=Speedtest to InfluxDB2 multi-arch image
```

## Running the container

The new container image is available through GitHub Containers.  Builds for amd64 and arm64 are included. Environment variables point the container to the right influxdb server.

```shell
docker pull ghcr.io/wwhitaker/speedtests:latest
```
