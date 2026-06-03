import { describe, expect, it } from "vitest";
import { hasDefaultsRunWorkingDirectory } from "./cicd";

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
});
