# Infrastructure scan

Work these sections top to bottom. Each one names what to find and the command
that finds it. Drop a section from the written map when it has nothing to
report; never pad it.

The recurring lesson: **the repository name tells you nothing about where the
infrastructure lives.** Verify each hop instead of inferring it.

## 1. Locate the repository

The repo may not be cloned, and the name may not match the product.

```bash
gh repo list <org> --limit 200 --json name,primaryLanguage,updatedAt \
  --jq '.[] | [.name, (.primaryLanguage.name // "-"), .updatedAt] | @tsv' | sort
gh repo clone <org>/<name>
```

`primaryLanguage` is the majority language, not the whole stack: a repo reported
as TypeScript can be a monorepo whose other half is PHP.

## 2. Repository shape

```bash
ls -A                                   # top-level layout; monorepo or single app
du -sh .git                             # clone cost
cat README.md
```

Per component, pin the runtime and package manager from the manifests, not from
the README:

```bash
grep -E '"(next|react|vue|svelte)"' */package.json
grep -E '"drupal/core[^"]*"|"php"' */composer.json
cat .nvmrc .tool-versions 2>/dev/null
```

When a Dockerfile and a version file disagree, the image wins at runtime. Say
which one is authoritative.

## 3. Branch and release model

```bash
gh repo view <org>/<repo> --json defaultBranchRef -q .defaultBranchRef.name
git branch -r
git log --oneline -10
```

Look for long-lived branches beside the default (`staging`, `prod`, `dev`) and
for a feature-branch naming convention keyed to ticket IDs. Record whether a
merge to a branch **is** a deploy — that is the single most dangerous thing a
new contributor can not know.

## 4. CI/CD

```bash
ls .github/workflows .circleci 2>/dev/null
sed -n '1,60p' .github/workflows/deploy.yml
```

Extract, from the workflow's own `env` block rather than from prose:

- which branches trigger which environment
- the image registry and tag scheme
- **the cloud project the workflow authenticates to** — frequently not the
  project named after the client
- the cluster and zone
- whether a GitHub environment gates the deploy

## 5. Cloud accounts, clusters, namespaces

Confirm the identity you are using and what it reaches:

```bash
gcloud auth list
gcloud config list
gcloud projects describe <project-id>
gcloud container clusters list --project=<project-id>
```

An empty cluster list is a finding, not an error: it usually means the workloads
run in a **shared platform project** while the client project holds only secrets
and service accounts. Follow the CI workflow's project id to the real cluster.

Then map environments to namespaces:

```bash
kubectl --context=<ctx> get ns | grep <prefix>
kubectl config get-contexts
```

Record any kubectl context a repo script requires **by name**, plus the command
that creates it — scripts routinely assume a context that only exists on the
author's machine:

```bash
kubectl config set-context <name> \
  --cluster=<cluster> --user=<user> --namespace=<ns>
```

## 6. Secrets and service accounts

Never print or copy a value. Inventory metadata only.

```bash
gcloud iam service-accounts list --project=<project-id>
gcloud secrets list --project=<project-id> --limit=20
gcloud iam service-accounts keys list --iam-account=<sa-email>
```

Write down: the exact service-account email (READMEs cite display names that no
longer match), which secret store the cluster reads, and the operator that
bridges them (External Secrets, Secrets Store CSI, sealed secrets). If the setup
requires a personal key, record where it belongs on disk, its key id, and the
one-line command that revokes it.

Check whether history already leaked anything:

```bash
ls .gitleaks.toml .gitleaksignore 2>/dev/null
```

A repo carrying a gitleaks allowlist has a leak story worth a line in Security.

## 7. Environments and URLs

Per environment, capture the public URL, the CMS or admin URL, and the namespace
serving it. Local hostnames are part of this: some organizations publish
wildcard DNS pointing at `127.0.0.1`, which means no `/etc/hosts` edit and is
worth stating so nobody adds one.

## 8. Local environment

Run it. Do not summarize the README's version of it.

Record, in order: prerequisites and whether they are already installed
(`command -v`), the exact script sequence, every interactive prompt and the
answer that works, and how the database gets seeded.

Watch for these, all of them observed in practice:

- A setup script that installs a controller but not the resource that activates
  it, leaving the stack silently unreachable.
- A prompt whose text and whose menu disagree about which option is which.
- A script that pipes data through its own stdin, eating the answers to its
  later prompts and exiting non-zero after the real work succeeded.
- Host port collisions with other local projects on the same machine, which make
  a load balancer hang in `pending` forever.

For each, write the symptom, the diagnosis, and the workaround. This section
saves the next person the hours it cost you.

## 9. Data and state

How a working dataset is obtained (upstream sync script, dump, fixtures),
whether the local store is ephemeral, and whether migrations run at boot or only
by hand. A rolling image swap is safe or unsafe depending on that answer.

## 10. Third-party systems

Systems of record beyond the repo — CRM, search, payments, mail, analytics — and
which direction data flows. Note which one owns a given entity when the repo
merely caches it.

## 11. Verify before writing

```bash
command -v <tool>                     # every prerequisite you claim
curl -s -o /dev/null -w '%{http_code}' <url>
```

Anything still unproven goes in the map as explicitly unverified, or does not go
in at all.
