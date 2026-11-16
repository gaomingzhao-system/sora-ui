# Changesets

Every user-visible change to `@your-scope/ui` or `@your-scope/theme` gets a changeset:

```bash
pnpm changeset
```

The two packages are versioned together (`fixed` in `config.json`). The gallery and the consumer
applications are private and are neither versioned nor published.

Releasing is described in [docs/release-checklist.md](../docs/release-checklist.md).
