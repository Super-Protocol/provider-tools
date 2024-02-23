`provider-tools` generated the following files in the `{{output}}` directory:
- .env
- docker-compose.yaml
- runner.sh

# Running the execution controller

## Option 1: Docker Desktop
If you have Docker Desktop installed on your Windows system, you can run the execution-controller using the following command:
```shell
$ docker-compose up -d
```

## Option 2: Via shell script
If you don’t have Docker Desktop or prefer not to use it, you can run the `runner.sh` shell script instead.

To run the `runner.sh` script, first install [Git Bash](https://git-scm.com/downloads) and [jq](https://jqlang.github.io/jq/).

Once **Git Bash** and **jq** are installed, open **Git Bash**, navigate to the directory `{{output}}`, and run the script:
```shell
$ sh runner.sh
```

