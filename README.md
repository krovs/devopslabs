# DevOpsLabs

A small Svelte + TypeScript web app for practicing DevOps and cloud troubleshooting scenarios.

The app simulates IaC, Terragrunt, GitHub Actions, GitOps, IaC security baselines, IAM, organization policy, policy as code, secrets management, DNS/TLS, PR review, AWS resources, Terraform state, backend locks, partial applies, imports, drift, pipeline failures, policy checks, and diagram-based networking designs. It does not call real Terraform, Terragrunt, AWS, GitHub, Argo CD, Flux, DNS, Kubernetes, Kyverno, Istio, Cilium, or certificate services.

## Features

- Three-zone troubleshooting workspace for command-driven labs:
  - Multi-file code editor with tabs
  - Fake terminal
  - Resource/state/context view or CI/CD pipeline dashboard
- Diagram-first networking workspace for VPN, Direct Connect, VPC, subnet, route table, security group, NACL, and WAF labs
- Diff-first PR review workspace with review decisions and finding selection
- GitOps scenarios for Argo CD Application and Flux Kustomization reconciliation failures
- Policy as Code scenarios for Kubernetes, Kyverno, Istio, and Cilium policy patterns
- Observability and FinOps scenarios for CloudWatch, logs, Cost Explorer, and cost-resource cleanup
- YAML-backed scenarios bundled at build time
- Collapsible side menu with completion counts
- Incident Mode to hide giveaway lab names and direct requirements
- Catppuccin Latte, Catppuccin Mocha, Dracula, and Cyberpunk Pink themes
- Command history with arrow keys
- Scenario reset and completion checks
- Saved progress in `localStorage`

## Tech Stack

- Svelte
- TypeScript
- Vite
- Plain CSS
- YAML scenario files loaded with Vite `?raw` imports

## Run

```bash
npm install
npm run dev
```

Then open the URL printed by Vite.

The default dev URL is usually:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run validate:scenarios
npm run test
npm run check
npm run build
```

## Deploy

The app is configured for GitHub Pages at:

```text
https://devopslabs.krovs.dev
```

Deployment runs from `.github/workflows/deploy.yml` on pushes to `main`. The custom domain is published through `public/CNAME`, which Vite copies into `dist/`.

## Project Structure

```text
index.html                 Vite entry HTML
styles.css                 Global app styling and themes
src/App.svelte             Main UI and simulator command logic
src/scenarios.ts           Imports and validates YAML scenarios
src/simpleYaml.ts          Small YAML parser for the supported scenario format
src/types.ts               Scenario/runtime TypeScript types
scenarios/*.yaml           Scenario definitions
```

## Supported Commands

The terminal is simulated. Current commands:

```text
terraform init
terraform plan
terraform apply
terraform validate
terraform state list
terraform state mv <source> <destination>
terraform import <address> <id>
terraform force-unlock <lock-id>
checkov -f main.tf
aws dynamodb scan --table-name tf-locks
aws s3 ls
terragrunt init
terragrunt validate
terragrunt plan
terragrunt run-all plan
terragrunt hclfmt
gh run view
gh run rerun
gh secret list
gh secret set <name>
argocd app get checkout
flux reconcile kustomization platform --with-source
aws iam simulate-principal-policy
aws sts assume-role-with-web-identity
aws kms decrypt
az role assignment list
aws organizations describe-policy
aws secretsmanager describe-secret
aws ssm get-parameter
aws acm describe-certificate
dig app.example.com
aws cloudwatch describe-alarms
aws logs describe-log-groups
aws ce get-cost-and-usage
aws ec2 describe-volumes
kyverno test .
kubectl apply --dry-run=server -f policy.yaml
check
help
```

## Included Scenarios

Scenarios are ordered in the menu from easier, single-signal fixes toward harder labs with more moving parts.

- Interrupted apply with a stuck DynamoDB state lock
- Existing IAM role missing from Terraform state
- Manual security group drift
- Terraform Checkov failure for a public S3 bucket
- Terraform validate failure from a bad resource reference
- Terraform module failure from a missing child-module output
- Terraform module failure from a wrong local source path
- Terraform module failure from a missing required input variable
- Terraform module Checkov failure from an unsafe security group default
- Terraform folder/module migration that requires a state address move
- IaC Security Baselines S3 baseline missing encryption, versioning, and public access block
- IaC Security Baselines RDS public access, weak backup retention, and deletion protection
- IaC Security Baselines CloudWatch log group missing retention
- IaC Security Baselines CloudTrail single-region trail without log validation
- IaC Security Baselines blank build for a secure S3 bucket baseline
- Terragrunt missing root include
- Terragrunt dependency output mismatch
- Terragrunt wrong module source reference
- Terragrunt HCL formatting gate
- Networking site-to-site VPN route design
- Networking Direct Connect multi-VPC routing design
- Networking VPC public/private subnet route table design
- Networking private subnet NAT egress design
- Networking database subnet isolation design
- Networking ALB to app security group design
- Networking NACL ephemeral return traffic design
- Networking WAF ALB protection design
- Networking SSH CIDR hardening design
- GitHub Actions deploy failure from a missing AWS role secret
- GitHub Actions AWS OIDC trust-policy mismatch
- GitHub Actions Terraform validation failure from a wrong working directory
- GitHub Actions Checkov security gate failure
- GitHub Actions actionlint failure for overbroad permissions
- GitHub Actions Node.js workflow failure from a wrong working directory/cache path
- GitHub Actions Docker registry publish failure from missing registry login
- GitHub Actions environment approval failure from a wrong environment name
- GitHub Actions matrix failure from an unsupported Node.js version
- Argo CD Application target revision drift
- Argo CD automated sync missing prune and self-heal
- Flux Kustomization pointing at the wrong environment path
- Flux Kustomization suspended after maintenance
- IAM S3 prefix least-privilege policy
- IAM GitHub OIDC environment trust policy
- IAM KMS encryption context policy
- IAM DynamoDB leading keys tenant isolation policy
- IAM Azure Blob Storage reader role assignment scope
- IAM blank build for Secrets Manager read-only access
- IAM blank build for CloudWatch Logs write access
- SCP deny leaving AWS Organization guardrail
- SCP region restriction with break-glass exception
- SCP blank build to deny root-user actions
- SCP blank build to require EC2 IMDSv2
- Kyverno require app label admission policy
- Kubernetes default deny ingress NetworkPolicy
- Istio AuthorizationPolicy requiring authenticated requests
- CiliumNetworkPolicy allowing DNS egress only
- Secrets Manager rotation and KMS configuration
- SSM Parameter Store environment path mismatch
- Secrets Manager resource policy public access hardening
- DNS/TLS CloudFront ACM certificate region and validation
- DNS Route 53 ALB alias target mismatch
- DNS/TLS ACM wildcard certificate public hosted-zone validation
- CloudWatch ALB 5xx alarm dimension mismatch
- CloudWatch Logs retention cost and compliance gap
- CloudWatch critical alarm missing notification action
- FinOps NAT Gateway cost spike from idle AZ gateways
- FinOps S3 lifecycle cost control for logs and temporary exports
- FinOps unattached EBS cleanup with snapshot-before-delete
- PR review for Terraform public S3 exposure
- PR review for GitHub Actions `write-all` permissions
- PR review for IAM wildcard policy
- PR review for security group admin CIDR exposure

## Add A Scenario

1. Create a new `.yaml` file in `scenarios/`.
2. Add its `id` to `scenarioOrder` in `src/scenarios.ts`.
3. Keep the same structure as the existing scenario YAML files.
4. Add simulator behavior in `src/App.svelte` if the lab needs new command output or completion checks.

Minimal shape:

```yaml
id: exampleScenario
title: Example Scenario
description: Short scenario description.
files:
  "main.tf": |
    provider "aws" {
      region = "eu-west-1"
    }
backend:
  bucket: tf-state-training
  key: example/app.tfstate
  table: tf-locks
  locked: false
  lockId: null
awsResources: []
stateResources: []
flags:
  initialized: false
  cleanPlan: false
```

Scenario kinds:

- Default or `kind: terraform`: uses Terraform-flavored commands, state, backend, and resource checks.
- `kind: awsconfig`: uses Terraform files plus `checkov -f main.tf` to spot missing AWS services or unsafe AWS settings.
- `kind: terragrunt`: uses Terragrunt commands and stack/source/dependency validation.
- `kind: cicd`: uses GitHub Actions commands and the pipeline dashboard.
- `kind: gitops`: uses Argo CD and Flux-style reconciliation commands for Kubernetes GitOps workflows.
- `kind: iam`: uses identity simulation or inspection commands and least-privilege checks across AWS and Azure-style exercises.
- `kind: scp`: uses AWS Organizations policy inspection and IAM-style simulation to model SCP deny guardrails.
- `kind: policy`: uses policy-as-code validation commands such as `kyverno test .` and Kubernetes server dry-run.
- `kind: secrets`: uses Secrets Manager or SSM Parameter Store validation commands.
- `kind: dns`: uses ACM and DNS lookup validation commands.
- `kind: observability`: uses CloudWatch alarm and log group inspection commands.
- `kind: finops`: uses Cost Explorer and cost-resource inspection commands.
- `kind: networking`: uses a diagram/design workspace instead of the terminal.
- `kind: pr`: uses a diff/review workspace instead of the normal resource panel.

Networking scenarios add a `networking` block with `nodes`, `links`, selectable `controls`, and optional packet `traces`. Traces are deterministic probes that show the intended packet path and the component-level failure without highlighting the exact control answer.

IAM scenarios use `kind: iam` and regular scenario files. They use the terminal for deterministic identity validation commands such as `aws iam simulate-principal-policy`, `aws sts assume-role-with-web-identity`, `aws s3 cp`, `aws kms decrypt`, and `az role assignment list`.

Policy as Code scenarios use `kind: policy` and model platform/workload guardrails rather than cloud organization guardrails. Current labs cover Kubernetes NetworkPolicy, Kyverno admission policy, Istio AuthorizationPolicy, and CiliumNetworkPolicy patterns.

GitOps scenarios use `kind: gitops` and model Kubernetes desired-state reconciliation through Argo CD Applications and Flux Kustomizations. Current labs cover target revision drift, automated prune/self-heal settings, wrong source paths, and suspended reconciliation.

Incident Mode is a menu option that hides unsolved lab names and direct scenario descriptions. It replaces them with generic incident context, changes tips into optional clues, and keeps solved labs visible for review.

PR review scenarios use `kind: pr` and a `prReview` block. They render a diff-oriented workspace where the user chooses a review decision and selects the findings that should block or approve the change.

Secrets scenarios use `kind: secrets` and model Secrets Manager or SSM Parameter Store failures. DNS/TLS scenarios use `kind: dns` and model Route 53, ACM, CloudFront certificate, and ALB alias issues. Observability scenarios use `kind: observability` for CloudWatch alarm and log-group checks. FinOps scenarios use `kind: finops` for cost signals and cleanup controls.

The current YAML parser intentionally supports only the subset used by these scenario files: nested objects, arrays of objects, booleans, `null`, empty arrays, strings, and block strings with `|`.

## Notes

This is a deterministic training simulator. Scenario behavior is currently implemented in `src/App.svelte`, keyed by scenario `id`. If you add a scenario that needs new command behavior, add that behavior to the command handlers there.
