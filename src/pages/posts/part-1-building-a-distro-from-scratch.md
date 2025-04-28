---
layout: '../../layouts/PostLayout.astro'
title: 'Part I: Building a Linux distribution from scratch'
pubDate: 2025-04-28
description: 'My attempt at building a distribution from the ground-up.'
author: 'SilverHairOrTwo'
tags: ['general']
---

As someone that maintains several Linux distributions (each with varying degrees of popularity) in real life (under my real name), albeit those based on others, I have always wondered how enormous a task it would be to build a distribution from the ground-up, with its own package manager and unique feature set. I have attempted this in the past, but usually with limited success (primarily owing to a lack of time due to my aforementioned responsibilities and personal life); my LFS installation is the closest I have come to building such a system.

This series of blog posts, therefore, serves to document my thought-process, for my reference and your entertainment.

### The goal

My goal, then, is to build the lightest atomic Linux distribution that GNOME can possibly run on with Flatpak support (and distrobox), as a learning experiment.

The name? Project Based: Build A Suckless Excessive Distribution. Don't ask me why.

However, I cannot deny that there is a **long** way to go: I must begin by writing a package manager and package all of the core utilities (and glibc) one would expect, but even that would merely give us a barebones Linux *rootfs*; I also maintain a desktop environment, and so, the mere prospect of packaging the entirety of GNOME as a single individual is terrifying to me. Yet, one must start somewhere.

### Package format

The first step, then, would be to come up with a package layout; since this is a learning experiment, I would not like to reuse an existing package manager, no matter how tempting the prospect might be; besides, I have already developed package managers (for different purposes) in the past, so this should not be too arduous a task.

Here's what I'm thinking for the binary package layout:

```bash
$ tree
.
├── contents
│   └── usr
│       └── bin
│           └── example-program
├── hooks
│   ├── install
│   └── remove
└── pkg
    └── manifest.yml

6 directories, 4 files
```

Underneath are contents of `./pkg/manifest.yml`:

```yaml
name: example-pkg # package name
arch: 'any' # any | amd64 | aarch64
version: 1.0.0-1 # package version
depends: # package dependencies
  - 'another-package'
  - 'and-another-package'
  - 'yet-another-package'
recommends: # recommended packages
  - 'recommended-package'
conflicts: # conflicting packages
  - 'a-package-everyone-hates-on'
  - 'and-another'
```

This layout is quite similar to that of a `deb` package (a Debian binary package), albeit with a few differences. For one, my intent is to have every package comprise of merely a single tarball (unlike `deb` packages, which are themselves archives of multiple `ar` archives). It could also be likened to a Slackware package; however, my expertise does not extend to that distribution.

As for source packages? A single file ought to be sufficient (similar to a `PKGBUILD` file on Arch Linux), as shown underneath (which we may name `pkg.yml` for the sake of simplicity):

```yaml
name: 'example-pkg' # package name

arch: 'any' # any | amd64 | aarch64

revision: '1' # equivalent to pkgrel in a PKGBUILD file

depends: # package dependencies
  - 'another-package'
  - 'and-another-package'
  - 'yet-another-package'

recommends: # recommended packages
  - 'recommended-package'

conflicts: # conflicting packages
  - 'a-package-everyone-hates-on'
  - 'and-another'

makedepends: # packages required for build
  - 'gcc'
  - 'git'
  - 'wget'
  - 'make'

pull: | # a script to pull any code to be compiled/used in the next few steps
  git clone 'https://github.com/SomeUser/SomeProgram'
  cd SomeProgram; wget 'https://someprogram.org/logo.png'

version: | # a script that must print the version number of the package to stdout
  echo '1.0.0'

build: | # a script to build the package
  cd SomeProgram
  ./configure --prefix=/usr && make DESTDIR="${pkgdir}" install
```

Call it my paranoia, but I have opted to use YAML instead of a shell script so that we needn't bother with sourcing arbitrary package build scripts, given the security risk it so often poses.

The plan is to write the package manager in Python, meaning it is paramount that `python` and `python-yaml` be among the libraries we first package (in addition to `coreutils`, `gcc` and `glibc`).

