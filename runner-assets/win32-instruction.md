`provider-tools` generated the following files in the `{{output}}` directory:
- .env
- runner.sh
- tool/spctl.exe
- tool/config.json

# Running the execution controller

The `runner.sh` script serves as the execution controller.

To run the `runner.sh` script, first install [Git Bash](https://git-scm.com/downloads) and [jq](https://jqlang.github.io/jq/).

Once **Git Bash** and **jq** are installed, open **Git Bash**, navigate to the directory `{{output}}`, and run the script:
```shell
$ bash runner.sh
```

