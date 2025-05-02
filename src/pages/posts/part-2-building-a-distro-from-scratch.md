---
layout: '../../layouts/PostLayout.astro'
title: 'Part II: Building a Linux distribution from scratch'
pubDate: 2025-05-02
description: 'Building a package manager for my new distribution.'
author: 'SilverHairOrTwo'
tags: ['general']
---

First, a recap. In my [last post](/posts/part-1-building-a-distro-from-scratch), I had come up with a suitable package layout for our package manager (a 'simple' version of which I have developed in the time between publishing these two posts; it can be found at [https://github.com/SilverHairOrTwo/based](https://github.com/SilverHairOrTwo/based)). Since then, however, I have made some changes to the format, which I will gloss over before proceeding to explain how the inner-workings of this package manager.

### Package layout

The layout for a binary package remains the same:

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

However, the format of the `pkg.yml` file (in a source package) has changed. Underneath is the `pkg.yml` file for GNU Hello (repository: [https://github.com/SilverHairOrTwo/hello-package](https://github.com/SilverHairOrTwo/hello-package)):

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2FSilverHairOrTwo%2Fhello-package%2Fblob%2Fmain%2Fpkg.yml&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

For one, the `version` variable now contains a constant, instead of a script that would return the version. The value of this variable is accessible in each script via the `${pkgver}` environment variable.

Secondly, I have split the `build` script into two: a `build` script like earlier and a new `install` script. This is so that we can implement support for split packages in future (wherein each produced binary package would have different contents).

Lastly, there is a new `description` variable; this can come in handy when one wants to view a package's metadata.

### Package manager

Now, onto the package manager. I chose to name it `based` (based on the name of this distribution, Project Based: Build A Suckless unEssential Distribution). It can be found [here](https://github.com/SilverHairOrTwo/based). It is quite similar to `distrobox` in that each utility is its own script, all of which can be called using the `based` script (so `based install package1 package2` would be equivalent to running `based-install package1 package2`, for instance). In this section, I'll delve into each of its functions and how they are implemented.

I'll begin with `based-build`, the package building utility.

---

### based-build

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2FSilverHairOrTwo%2Fbased%2Fblob%2Fmain%2Fbased-build&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

As you have probably noticed, I'm not using `python` but rather a `bash` script for these utilities. This is so that we can have a functional self-hosting system (a system that can build itself) without packaging `python3` (although we will have to at some point, of course). Aside from `bash` and `coreutils`, this script only requires two other packages: `jq` and `goyq` (for parsing YAML files).

#### parse_pkgyml

This function parses the `pkg.yml` file to read the values of each of the following (using `yq`):

- name
- arch
- version
- revision
- description
- depends
- recommends
- conflicts
- pull
- build
- install
- install_hook
- remove_hook

#### validate_pkgyml

This function validates the package name, version and revision, while also checking to ensure the package supports the host's architecture.

#### build_package

This function runs the `pull`, `build` and `install` functions in the `pkg.yml` file, while making the following variables available to each function:

- $nproc
- $pkgver
- $pkgsrc
- $pkgdir

#### generate_package_manifest

This function generates the manifest.yml file for the binary package in the format underneath:

```yaml
name: ${name}
arch: ${arch}
version: ${version}-${revision}
description: ${description}
depends: ${depends}
recommends: ${recommends}
conflicts: ${conflicts}
```

#### generate_package

This function compresses the built package into a file with the extension `.based.tgz`, indicating that is a package file to be installed with `based`.

---

### based-install

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2FSilverHairOrTwo%2Fbased%2Fblob%2Fmain%2Fbased-install&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

#### resolve_packages

This function iterates through the list of packages to be installed and splits them into the list of packages that are to be downloaded, and those that already exist locally.

It is here that I plan to implement dependency resolution in future.

#### download_packages

This function downloads each package that was added to the list of packages to be downloaded in the previous function; or well, it is supposed to be. I am yet to implement remote repository support, meaning this is simply a placeholder function at the moment.

#### install_local_packages

This functions iterate through each package to be installed, making sure they each have a valid `manifest.yml` file. It then calls `install_local_package` for each package.

#### install_local_package

This function is executed for each package to be installed and does most of the work to copy the contents of each package to the host system, while ensuring there are no overlapping/conflicting files (as any sane package manager would).

#### run_hooks

This function runs the install hook shipped with each package.

---

### Next steps

Now that we have a somewhat-functional package manager, we can proceed onto packaging `glibc`, `bash`, `coreutils`, `gcc`, `jq`, `goyq` and all their various dependencies.

You can reach me at my email, as listed on my [homepage](/).
