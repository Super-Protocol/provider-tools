`provider-tools` generated the following files in the `{{output}}` directory:
- .env
- docker-compose.yaml
- runner.sh

# Running the execution controller

## Option 1: Docker Desktop
If Docker is installed on your system, you can start the **execution-controller** with a single command. Open your terminal and navigate to the directory `{{output}}` and run the following command:
```shell
$ docker-compose up -d
```

## Option 2: Via shell script
If you prefer not to use Docker, you can run the `runner.sh` shell script instead.

To run the `runner.sh` script, first install **jq**. You can usually install it from the package manager of your Linux distribution. For example, on Ubuntu, you can install **jq** with the following command:
```shell
$ sudo apt-get install jq
```
Once jq is installed, open your terminal, navigate to the directory containing the runner.sh file, and run the script with the following command:
```shell
$ sh runner.sh
```

