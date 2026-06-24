# Building this Lemma pod

This directory is a **pod bundle**: plain files imported with `lemma pods import`.
The bundle is the source of truth. Edit files, then re-import.

## Layout (folder name MUST equal each resource's `name`)
```
support-triage/
  pod.json
  tables/<name>/<name>.json
  functions/<name>/<name>.json + code.py     # JSON carries permissions.grants
  agents/<name>/<name>.json    + instruction.md
  workflows/<name>/<name>.json
  schedules/<name>/<name>.json
  surfaces/<platform>/<platform>.json
  files/<folder>/.folder.json
```

## Scaffold more resources (then edit them)
```bash
lemma table init <name>        # tables/<name>/<name>.json
lemma function init <name>     # functions/<name>/<name>.json + code.py
lemma agent init <name>        # agents/<name>/<name>.json + instruction.md
lemma workflow init <name>     # workflows/<name>/<name>.json
```

## Rules that bite
- **Zero access by default.** Grant every table/folder/app an agent or function
  touches via `permissions.grants` in its JSON.
- Files referenced as `{"$file": "code.py"}` / `{"$json_file": "config.json"}`
  load from sibling files. Bundle JSON may contain `//` and `/* */` comments.
- Build order: tables -> files -> functions -> agents -> workflows -> schedules
  -> surfaces -> apps. Verify each layer before the next.
- `lemma pods import . --dry-run` validates everything without writing.
