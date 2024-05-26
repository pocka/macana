The easiest and cleanest way to use Macana is CLI script (`cli.ts`).
Pass a URL of the script to `deno run` and provide parameters.
Use `--help` to see parameters and arguments.

```
$ deno run https://deno.land/x/macana@v0.1.2/cli.ts --help
```

The CLI script accepts taking a config JSON/JSONC file via `--config` option.
Most of the generation options are available both as a CLI parameter and config field.
You need to grant `read` permission for the config JSON/JSONC file.

```
$ deno run --allow-read=.macana.json https://deno.land/x/macana@v0.1.2/cli.ts --config .macana.json
```

See [Config reference](/en/References/Config) for available options.
