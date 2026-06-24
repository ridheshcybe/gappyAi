# support-triage

TODO: what this pod does and who operates it.

## Build loop
```bash
lemma pods import ./support-triage --dry-run   # validate
lemma pods import ./support-triage             # upsert by resource name
```

## Non-bundled setup (do these after import)
- Upload any required files: `lemma files upload ./doc.pdf /pod/knowledge/doc.pdf`
- Connect connectors/accounts: `lemma connectors ...`
- Flip schedules/surfaces to active once their targets exist.

## Verify
```bash
lemma pods describe
lemma agents chat hello "what can you do in this pod?"
```
