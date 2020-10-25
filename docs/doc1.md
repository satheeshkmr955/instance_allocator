---
id: doc1
title: Setup
sidebar_label: Setup
---

## Repository

Use the code repository [git](https://git-scm.com/) to clone the repository.

```sh
git clone git@github.com:satheeshkmr955/instance_allocator.git
```

## Dependencies

Use the package manager [npm](https://nodejs.org/en/download/) to install the dependencies.

### change directory

```sh
cd instance_allocator
```

### npm

```sh
npm install
```

### yarn

```sh
yarn install
```

## Link

Run the cmd below to use as cli

### npm

```sh
npm link
```

### yarn

```sh
yarn link
```

## Start

Run the below cmd to get the optimizated CPU instance per region

```sh
instance_allocator -h 7 -c 214 -p 95
```
