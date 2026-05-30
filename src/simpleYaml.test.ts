import { describe, expect, it } from "vitest";
import { parseSimpleYaml } from "./simpleYaml";

describe("parseSimpleYaml", () => {
  it("parses nested objects, booleans, null, and empty arrays", () => {
    expect(parseSimpleYaml(`
id: parserExample
backend:
  bucket: tf-state-training
  locked: false
  lockId: null
flags:
  initialized: true
awsResources: []
`)).toEqual({
      id: "parserExample",
      backend: {
        bucket: "tf-state-training",
        locked: false,
        lockId: null,
      },
      flags: {
        initialized: true,
      },
      awsResources: [],
    });
  });

  it("parses arrays of objects with inline first keys", () => {
    expect(parseSimpleYaml(`
resources:
  - type: s3_bucket
    name: logs
    status: exists
  - type: iam_role
    name: app
    status: drifted
`)).toEqual({
      resources: [
        { type: "s3_bucket", name: "logs", status: "exists" },
        { type: "iam_role", name: "app", status: "drifted" },
      ],
    });
  });

  it("parses quoted keys and block strings", () => {
    expect(parseSimpleYaml(`
files:
  "main.tf": |
    resource "aws_s3_bucket" "logs" {
      bucket = "training-logs"
    }
  'modules/s3/main.tf': |
    output "bucket_name" {
      value = aws_s3_bucket.this.bucket
    }
`)).toEqual({
      files: {
        "main.tf": 'resource "aws_s3_bucket" "logs" {\n  bucket = "training-logs"\n}',
        "modules/s3/main.tf": 'output "bucket_name" {\n  value = aws_s3_bucket.this.bucket\n}',
      },
    });
  });

  it("skips blank lines and comments", () => {
    expect(parseSimpleYaml(`
# top-level comment
id: comments

flags:
  # nested comment
  cleanPlan: false
`)).toEqual({
      id: "comments",
      flags: {
        cleanPlan: false,
      },
    });
  });
});
