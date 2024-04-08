`provider-tools` generated the following files in the `{{output}}` directory:
- .env
- runner.sh
- tool/spctl
- tool/config.json

# Running the execution controller

The `runner.sh` script serves as the execution controller.

To run the `runner.sh` script, first install **jq**. You can usually install it from the package manager of your Linux distribution. For example, on Ubuntu, you can install **jq** with the following command:
```shell
$ sudo apt-get install jq
```
Once jq is installed, open your terminal, navigate to the directory containing the runner.sh file, and run the script with the following command:
```shell
$ bash runner.sh
```

