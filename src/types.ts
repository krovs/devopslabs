export type AwsResource = {
  type: string;
  name: string;
  id: string;
  status: "exists" | "drifted" | "failed" | string;
  note?: string;
};

export type StateResource = {
  address: string;
  id: string;
};

export type Backend = {
  bucket: string;
  key: string;
  table: string;
  locked: boolean;
  lockId: string | null;
};

export type ScenarioFlags = {
  initialized?: boolean;
  importedBucket?: boolean;
  importedRole?: boolean;
  cleanPlan?: boolean;
  secretsConfigured?: boolean;
  workflowFixed?: boolean;
  validationPassed?: boolean;
  securityPassed?: boolean;
  lintPassed?: boolean;
  runPassing?: boolean;
  networkConfigured?: boolean;
  iamValidated?: boolean;
  scpValidated?: boolean;
  reviewPassed?: boolean;
  secretsValidated?: boolean;
  dnsValidated?: boolean;
  configValidated?: boolean;
  observabilityValidated?: boolean;
  finopsValidated?: boolean;
  policyValidated?: boolean;
};

export type NetworkNode = {
  id: string;
  label: string;
  type: string;
  x: string;
  y: string;
  width?: string;
  height?: string;
  note?: string;
};

export type NetworkLink = {
  from: string;
  to: string;
  label: string;
  status?: string;
  controlIds?: string;
};

export type NetworkControl = {
  id: string;
  label: string;
  nodeId?: string;
  value: string;
  answer: string;
  options: string;
  inputType?: "select" | "text";
  placeholder?: string;
  note?: string;
};

export type NetworkTrace = {
  id: string;
  label: string;
  source: string;
  destination: string;
  port: string;
  path: string;
  failure: string;
  success?: string;
};

export type NetworkingModel = {
  nodes: NetworkNode[];
  links: NetworkLink[];
  controls: NetworkControl[];
  symptoms?: string[];
  traces?: NetworkTrace[];
};

export type PrFinding = {
  id: string;
  label: string;
  file: string;
  line: string;
  selected: boolean;
  required: boolean;
  note?: string;
};

export type PrReviewModel = {
  number: string;
  author: string;
  base: string;
  branch: string;
  expectedDecision: "approve" | "request_changes" | string;
  decision?: "approve" | "request_changes" | string;
  summary: string;
  risk: string;
  findings: PrFinding[];
};

export type ScenarioSolutionReplacement = {
  fileName: string;
  search: string;
  replace: string;
};

export type Scenario = {
  id: string;
  kind?: "terraform" | "terragrunt" | "cicd" | "networking" | "iam" | "scp" | "pr" | "secrets" | "dns" | "awsconfig" | "observability" | "finops" | "policy";
  title: string;
  description: string;
  primaryFile?: string;
  tips?: string[];
  solution?: {
    apply?: "networkingControls" | "prReview" | string;
    summary?: string;
    steps?: string[];
    commands?: string[];
    explanation?: string;
    outcome?: string;
    files?: Record<string, string>;
    replacements?: ScenarioSolutionReplacement[];
    focusFileName?: string;
  };
  files: Record<string, string>;
  backend: Backend;
  awsResources: AwsResource[];
  stateResources: StateResource[];
  flags: ScenarioFlags;
  networking?: NetworkingModel;
  prReview?: PrReviewModel;
};
