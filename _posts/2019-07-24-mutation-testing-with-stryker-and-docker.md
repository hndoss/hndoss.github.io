---
layout: post
title: "Mutation Testing with Stryker and Docker"
description: Get started right away with mutation testing. Tests for your tests.
image: 'https://cdn.pixabay.com/photo/2018/10/21/14/57/parrot-3762988_960_720.jpg'
twitter_text: How code coverage of 100% could mean only 60% is tested.
category: 'blog'
introduction: How do we know that we are writing quality code? How do we know that we are writing good tests?
---

How do we know that we are writing quality code? Mostly we rely on unit tests or integration tests to answer that question. But then, the question repeats itself. How do we know that we are writing good tests? Let me introduce you Stryker, it allows you to test your tests with mutation testing. Stryker guys have a complete explanation and got mostly everything covered on [their official site](https://stryker-mutator.io/) which you should visit.

Following an approach with [Docker](https://www.docker.com/), I found it easier to implement in old projects since it is not necessary to upgrade libraries or care about the version of a testing framework. Just a few steps are needed.

## Pre-requisites:
* angular-cli
* nodejs
* Jest

We are going to replace [Karma](https://www.npmjs.com/package/karma) with [Jest](https://jestjs.io/). Why should we do that? Well, [this](https://www.xfive.co/blog/testing-angular-faster-jest) blog entry has a great explanation.

---
## Steps:

* Start a dummy Angular project.
 ```
 # Just answer with the default configuration.
 ng new bear
 cd bear
 ```

* Replace Karma with Jest.
 ```
 # install jest dependencies
 npm install jest \
    jest-preset-angular \
    @types/jest \
    --save-dev
```

* Add Jest configuration.
```
echo "import 'jest-preset-angular';" > setupJest.ts
```

* Append Jest config in package.json.
```
...
,
"jest": {
    "preset": "jest-preset-angular",
    "setupFilesAfterEnv": ["<rootDir>/setupJest.ts"]
}
...
```

* Replace "test": "ng test" in package.json with:
```
"test": "jest",
```

* Remove Karma.
```
npm uninstall karma \
    karma-chrome-launcher \
    karma-coverage-istanbul-reporter \
    karma-jasmine karma-jasmine-html-reporter 
rm src/test.ts 
rm src/karma.conf.js
```
* Update src/tsconfig.spec.json.
```
{
    "extends": "../tsconfig.json",
    "compilerOptions": {
        "outDir": "../out-tsc/spec",
        "types": [
            "jest",
            "node"
        ]
    },
    "files": ["polyfills.ts"],
    "include": [
        "**/*.spec.ts",
        "**/*.d.ts"
    ]
}
```

* Add a valid `stryker.conf.js` on the project's root directory.
```
module.exports = function(config) {
    config.set({
        files: [
            "**/*",
            "!node_modules/**/*"
        ],
        mutate: [ "src/**/*.spec.ts"],
        mutator: "javascript",
        reporters: [
            "progress", 
            "clear-text", 
            "html",
            "dashboard"
        ],
        coverageAnalysis: "off"
    });
}
```

* Run Stryker in a docker container.
```
docker run \
    -v $(pwd):/srv \
    -w /srv \
    --rm -ti \
    hndoss/stryker-js:11-alpine run
```
* Check the results in `reports/`.

```
Ran all tests for this mutant.
Ran 0.80 tests per mutant on average.
-----------------------|---------|----------|-----------|------------|----------|---------|
File                   | % score | # killed | # timeout | # survived | # no cov | # error |
-----------------------|---------|----------|-----------|------------|----------|---------|
All files              |   46.67 |        4 |         3 |          8 |        0 |       0 |
 app.component.spec.ts |   46.67 |        4 |         3 |          8 |        0 |       0 |
-----------------------|---------|----------|-----------|------------|----------|---------|
15:53:38 (1) INFO DashboardReporter Dashboard report is not sent when not running on a build server
15:53:38 (1) INFO HtmlReporter Your report can be found at: file:///srv/reports/mutation/html/index.html
15:53:38 (1) INFO Stryker Done in 28 seconds.
```
And remember that:
>Bugs, or mutants, are automatically inserted into your production code. Your tests are ran for each mutant. If your tests fail then the mutant is killed. If your tests passed, the mutant survived. The higher the percentage of mutants killed, the more effective your tests are. - [Stryker Team](https://stryker-mutator.io/#what-is-mutation-testing).

## Why is this awesome?

Mutation testing requires a lot of compute resources and it is time consuming. Delegating the process to a detached docker container makes the task easier since it required some dependencies as pre-requisite that might not be the best idea to have right now in your projects. 
<br>
<br>
An example is hosted [here](https://github.com/hndoss/bear) and the dockerfile we used is [here](https://github.com/hndoss/stryker-js-11-alpine). If you have an idea about how to improve it, you are just about a Pull Request to cooperate.