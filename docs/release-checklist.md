# Release checklist

## Once, before the first release

- [ ] Choose the npm scope and rename the placeholder:

  ```bash
  node scripts/set-scope.ts @your-real-scope
  ```

  ```bash
  pnpm install
  ```

- [ ] Decide the public Vue support statement. The peer dependency is the exact release candidate
      `3.6.0-rc.15`; widening it is a decision to make when Vapor is stable, together with a full
      re-verification.
- [ ] Add `repository`, `homepage` and `bugs` to both package manifests.
- [ ] Configure npm publishing credentials for the release workflow (an automation token or trusted
      publishing). Nothing in this repository publishes on its own.

## For every release

1. **Describe the change.** Every user-visible change has a changeset:

   ```bash
   pnpm changeset
   ```

2. **Start clean.**

   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Run the verification in order.** Each step must pass; this is what CI runs.

   ```bash
   pnpm generate:theme
   ```

   ```bash
   pnpm lint
   ```

   ```bash
   pnpm typecheck
   ```

   ```bash
   pnpm check:vapor
   ```

   ```bash
   pnpm check:locales
   ```

   ```bash
   pnpm test:unit
   ```

   ```bash
   pnpm test:browser
   ```

   ```bash
   pnpm build
   ```

   ```bash
   pnpm test:types
   ```

   ```bash
   pnpm check:package
   ```

   ```bash
   pnpm verify:consumer
   ```

   ```bash
   pnpm test:e2e
   ```

   ```bash
   pnpm measure:bundle
   ```

   ```bash
   pnpm docs:components --check
   ```

4. **Check by hand what the tools cannot.**
   - [ ] The gallery in light, dark, right-to-left and the pseudo-locale, at a phone and a desktop width.
   - [ ] Firefox and Safari, if CI did not run them.
   - [ ] A screen reader pass over the dialog, the menu, the combobox, the form with errors and the
         toasts (see "What has not been verified" in [accessibility.md](./accessibility.md)).
   - [ ] Keyboard only: every page of the gallery can be used without a pointer.

5. **Update the documents that contain measured numbers** ("Verified results" in
   [compatibility.md](./compatibility.md)) when they changed.

6. **Version.**

   ```bash
   pnpm release:version
   ```

   Review the generated changelogs and the version bumps, then commit.

7. **Inspect what will be published.** `pnpm check:package` already did this mechanically; a look at
   the file list is still worth it.

   ```bash
   pnpm --filter @your-scope/ui pack --dry-run
   ```

8. **Publish.**

   ```bash
   pnpm release:publish
   ```

   `release:publish` builds, runs `check:package` and then `changeset publish`. Release candidates of
   the library should be published under a dist-tag other than `latest` while Vue Vapor itself is a
   release candidate.

9. **Afterwards.** Install the published version in a fresh application (the two consumers in this
   repository show the minimal and the full setup) and tag the release.

## When a dependency changes

- Vue, a compiler or a Vue plugin: run `pnpm test:browser tests/browser/compat` first, then
  everything. Re-read "Known toolchain issues" in [compatibility.md](./compatibility.md) and remove
  workarounds that are no longer needed.
- Tailwind: rebuild and compare `dist/styles.css` (size, absence of `--tw-*` and utility classes are
  checked by `check:package`).
- Formisch, Valibot, petite-vue-i18n: `tests/browser/forms.test.ts`, `provider.test.ts` and the
  forms E2E tests cover the integration points.
