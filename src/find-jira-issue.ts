import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";

type Config = { baseUrl: string; email: string; token: string };
type Inputs = {
  jiraApiToken: string;
  jiraBaseUrl: string;
  jiraUserEmail: string;
  string: string;
};
type Issue = { key: string; summary: string };
type Outputs = { key: string; summary: string };

// export for testing
export async function getIssue(
  config: Config,
  issueKey: string
): Promise<Issue | null> {
  try {
    const client = new HttpClient("find-jira-issue");

    const url = `${config.baseUrl}/rest/api/2/issue/${issueKey}`;
    const response = await client.getJson<{
      key: string;
      fields: { summary: string };
    }>(url, {
      accept: "application/json",
      authorization: `Basic ${Buffer.from(
        `${config.email}:${config.token}`
      ).toString("base64")}`,
    });
    const { result } = response;
    if (result === null) return null;
    return { key: result.key, summary: result.fields.summary };
  } catch (_) {
    return null;
  }
}

// export for testing
export function extractIssueKeys(s: string): string[] {
  const match = s.match(/[A-Z][A-Z]+-[0-9]+/g);
  return match === null ? [] : match;
}

// export for testing
export async function findJiraIssue(inputs: Inputs): Promise<Outputs> {
  const { jiraApiToken, jiraBaseUrl, jiraUserEmail, string } = inputs;
  core.debug(`string: ${string}`);
  const issueKeys = extractIssueKeys(string);
  if (issueKeys.length === 0) {
    core.debug("string does not contain issue keys");
  } else {
    const config = {
      baseUrl: jiraBaseUrl,
      email: jiraUserEmail,
      token: jiraApiToken,
    };
    for (const issueKey of issueKeys) {
      const issue = await getIssue(config, issueKey);
      if (issue !== null) {
        return issue;
      }
    }
  }
  return { key: "", summary: "" };
}

// export for testing
export function getInputs(): Inputs {
  const jiraApiToken = core.getInput("jira-api-token", { required: true });
  const jiraBaseUrl = core.getInput("jira-base-url", { required: true });
  const jiraUserEmail = core.getInput("jira-user-email", { required: true });
  const string = core.getInput("string", { required: true });
  return {
    jiraApiToken,
    jiraBaseUrl,
    jiraUserEmail,
    string,
  };
}

// export for testing
export function setOutputs(outputs: Outputs): void {
  const { key, summary } = outputs;
  core.setOutput("key", key);
  core.setOutput("summary", summary);
}

export async function run(): Promise<void> {
  try {
    setOutputs(await findJiraIssue(getInputs()));
  } catch (error) {
    core.setFailed(error.message);
  }
}
