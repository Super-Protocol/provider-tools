`provider-tools` generated the following files in the `{{output}}` directory:
- .env
- runner.sh
- tool/spctl
- tool/config.json

# Running the execution controller

The `runner.sh` script serves as the execution controller.

To run the `runner.sh` script, first install **jq**. You can usually install it from Homebrew, a package manager for macOS:
```shell
$ brew install jq
```

If you don’t have Homebrew installed, you can install it from the [official website](https://jqlang.github.io/jq/).

Once **jq** is installed, open your terminal, navigate to the directory `{{output}}`, and run the script with the following command:
```shell
$ sh runner.sh
```

