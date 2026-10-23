# Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please):

1. Commits on `master` follow [Conventional Commits](https://www.conventionalcommits.org/).
2. After CI passes on `master`, release-please opens or updates a release PR that bumps the
   version and updates `CHANGELOG.md`.
3. Merging that PR creates a GitHub release with the `.vsix` attached and publishes it to the
   VS Code Marketplace and Open VSX.

## One-time setup

### GitHub

Create two environments in the repository settings, both limited to the `master` branch:

- `marketplace` with the secrets `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`;
- `open-vsx` with the secret `OVSX_PAT`.

### VS Code Marketplace

The Marketplace no longer accepts global Azure DevOps personal access tokens after
December 1, 2026, so CI publishes with a Microsoft Entra ID managed identity through
`vsce publish --azure-credential`, without stored tokens.

1. In the [Azure portal](https://portal.azure.com), create a user-assigned managed identity.
   It needs an Azure subscription (a free one is enough) and a resource group; the identity
   itself is free.
2. On the identity, add a federated credential for the "GitHub Actions deploying Azure
   resources" scenario: organization `Quatters` (ID `73882772`), repository
   `select-and-run-without-debug` (ID `548962452`), entity `Environment`, environment
   `marketplace`. The subject has to be
   `repo:Quatters@73882772/select-and-run-without-debug@548962452:environment:marketplace`:
   the repository is opted into GitHub's
   [immutable OIDC subjects](https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens/)
   (`gh api repos/Quatters/select-and-run-without-debug/actions/oidc/customization/sub`).
3. Save the identity's client ID and tenant ID as `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`
   in the `marketplace` environment.
4. Run the "Marketplace identity" workflow manually and copy the profile ID it prints.
5. On the [publisher management page](https://marketplace.visualstudio.com/manage/publishers/quatters),
   add that ID as a member with the Contributor role.
6. Run "Marketplace identity" again: the "Check publish rights" step should pass.

### Open VSX

1. Sign in to [open-vsx.org](https://open-vsx.org) with GitHub.
2. In the profile settings, log in with an Eclipse account (create one at
   [eclipse.org](https://accounts.eclipse.org) with the same GitHub username) and sign the
   Open VSX Publisher Agreement.
3. Generate an access token in the settings and save it as `OVSX_PAT` in the `open-vsx`
   environment.
4. Create the namespace once: `pnpm exec ovsx create-namespace quatters -p <token>`.

After the first release, the token can be replaced with
[trusted publishing](https://github.com/eclipse-openvsx/openvsx/wiki/Trusted-Publishing)
once the namespace ownership is verified.
