import { describe, expect, it } from "vitest";
import { genericGithubActionsFixApplied, hasDefaultsRunWorkingDirectory } from "./cicd";
import type { Scenario } from "../types";

describe("GitHub Actions workflow validation", () => {
  it("accepts defaults.run.working-directory", () => {
    expect(hasDefaultsRunWorkingDirectory(`
name: node-ci
jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - run: npm ci
`, "app")).toBe(true);
  });

  it("rejects misspelled defaults structure", () => {
    expect(hasDefaultsRunWorkingDirectory(`
name: node-ci
jobs:
  test:
    runs-on: ubuntu-latest
    default:
      fun:
        working-directory: app
    steps:
      - run: npm ci
`, "app")).toBe(false);
  });

  it("rejects a loose working-directory outside defaults.run", () => {
    expect(hasDefaultsRunWorkingDirectory(`
name: terraform-check
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - run: terraform fmt -check
        working-directory: infra/dev
`, "infra/dev")).toBe(false);
  });

  it("accepts multiline Jenkins credentials binding from Jenkinsfile", () => {
    const scenario = jenkinsScenarioWith(`
pipeline {
  agent any

  stages {
    stage('Publish image') {
      steps {
        sh 'docker build -t ghcr.io/acme/app:\${BUILD_NUMBER} .'
        withCredentials([
          usernamePassword(
            credentialsId: 'ghcr-push',
            usernameVariable: 'REGISTRY_USER',
            passwordVariable: 'REGISTRY_TOKEN'
          )
        ]) {
          sh '''
            echo "$REGISTRY_TOKEN" | docker login ghcr.io \\
              --username "$REGISTRY_USER" \\
              --password-stdin
          '''
          sh 'docker push ghcr.io/acme/app:\${BUILD_NUMBER}'
        }
      }
    }
  }
}
`);

    expect(genericGithubActionsFixApplied(scenario, "jenkinsMissingCredentialsBinding", "Jenkinsfile")).toBe(true);
  });

  it("rejects Jenkins credentials binding with shell references as variable names", () => {
    const scenario = jenkinsScenarioWith(`
pipeline {
  agent any

  stages {
    stage('Publish image') {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'ghcr-push',
            usernameVariable: '$REGISTRY_USER',
            passwordVariable: '$REGISTRY_TOKEN'
          )
        ]) {
          sh 'echo "$REGISTRY_TOKEN" | docker login ghcr.io --username "$REGISTRY_USER" --password-stdin'
          sh 'docker push ghcr.io/acme/app:\${BUILD_NUMBER}'
        }
      }
    }
  }
}
`);

    expect(genericGithubActionsFixApplied(scenario, "jenkinsMissingCredentialsBinding", "Jenkinsfile")).toBe(false);
  });
});

function jenkinsScenarioWith(jenkinsfile: string): Scenario {
  return {
    id: "jenkinsMissingCredentialsBinding",
    kind: "cicd",
    title: "Jenkins Missing Credentials Binding",
    description: "Test fixture.",
    files: {
      Jenkinsfile: jenkinsfile,
    },
    backend: {
      bucket: "jenkins",
      key: "Jenkinsfile",
      table: "builds",
      locked: false,
      lockId: null,
    },
    awsResources: [],
    stateResources: [],
    flags: {},
    solution: {
      summary: "Fix it.",
      steps: ["Bind credentials."],
      commands: ["jenkins rebuild"],
      explanation: "Use Jenkins credentials binding.",
      outcome: "Build passes.",
    },
  };
}
