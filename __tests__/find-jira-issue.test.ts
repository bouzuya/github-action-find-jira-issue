import {
  extractIssueKeys,
  findJiraIssue,
  getInputs,
  getIssue,
  setOutputs,
} from "../src/find-jira-issue";
import nock from "nock";
import * as core from "@actions/core";

test("extractIssueKeys", () => {
  expect(extractIssueKeys("")).toStrictEqual([]);
  expect(extractIssueKeys("J-1")).toStrictEqual([]);
  expect(extractIssueKeys("JR-1")).toStrictEqual(["JR-1"]);
  expect(extractIssueKeys("JR-12")).toStrictEqual(["JR-12"]);
  expect(extractIssueKeys("JRA-1")).toStrictEqual(["JRA-1"]);
  expect(extractIssueKeys("bJRA-1a")).toStrictEqual(["JRA-1"]);
  expect(extractIssueKeys("refs/heads/JRA-1")).toStrictEqual(["JRA-1"]);
  expect(extractIssueKeys("JRA-1 issue summary")).toStrictEqual(["JRA-1"]);
  expect(extractIssueKeys("JRA-1JRA-2")).toStrictEqual(["JRA-1", "JRA-2"]);
});

test("getIssue", async () => {
  // fred:fred => ZnJlZDpmcmVk
  // https://developer.atlassian.com/server/jira/platform/basic-authentication/#construct-the-authorization-header
  const key = "JRA-1";
  const summary = "summary";
  nock("https://jira.atlassian.net", {
    reqheaders: {
      accept: "application/json",
      authorization: "Basic ZnJlZDpmcmVk",
    },
  })
    .get("/rest/api/2/issue/JRA-1")
    .reply(200, { key, fields: { summary } });
  const response = await getIssue(
    {
      baseUrl: "https://jira.atlassian.net",
      email: "fred",
      token: "fred",
    },
    "JRA-1"
  );
  expect(response).toStrictEqual({ key, summary });
});

test("getIssue (400)", async () => {
  nock("https://jira.atlassian.net").get("/rest/api/2/issue/JRA-1").reply(400);
  const response = await getIssue(
    {
      baseUrl: "https://jira.atlassian.net",
      email: "fred",
      token: "fred",
    },
    "JRA-1"
  );
  expect(response).toBeNull();
});

test("findJiraIssue", async () => {
  const key = "JRA-1";
  const summary = "summary";
  nock("https://jira.atlassian.net")
    .get("/rest/api/2/issue/JRA-1")
    .reply(200, { key, fields: { summary } });
  const debugSpy = jest.spyOn(core, "debug");
  const outputs = await findJiraIssue({
    jiraBaseUrl: "https://jira.atlassian.net",
    jiraUserEmail: "fred",
    jiraApiToken: "fred",
    string: "JRA-1",
  });
  expect(outputs).toStrictEqual({ key: "JRA-1", summary: "summary" });
  expect(debugSpy).toHaveBeenCalledWith("string: JRA-1");
});

test("findJiraIssue (issue keys not found)", async () => {
  const debugSpy = jest.spyOn(core, "debug");
  const outputs = await findJiraIssue({
    jiraBaseUrl: "https://jira.atlassian.net",
    jiraUserEmail: "fred",
    jiraApiToken: "fred",
    string: "",
  });
  expect(outputs).toStrictEqual({ key: "", summary: "" });
  expect(debugSpy).toHaveBeenCalledWith("string does not contain issue keys");
});

test("findJiraIssue (issue not found)", async () => {
  nock("https://jira.atlassian.net").get("/rest/api/2/issue/JRA-1").reply(400);
  const debugSpy = jest.spyOn(core, "debug");
  const outputs = await findJiraIssue({
    jiraBaseUrl: "https://jira.atlassian.net",
    jiraUserEmail: "fred",
    jiraApiToken: "fred",
    string: "JRA-1",
  });
  expect(outputs).toStrictEqual({ key: "", summary: "" });
  expect(debugSpy).toHaveBeenCalledWith("string: JRA-1");
});

test("getInputs", () => {
  const jiraApiToken = "jira-api-token1";
  const jiraBaseUrl = "jira-base-url1";
  const jiraUserEmail = "jira-user-email1";
  const string = "string1";
  jest.spyOn(core, "getInput").mockImplementation((name, _) => {
    if (name === "jira-api-token") return jiraApiToken;
    if (name === "jira-base-url") return jiraBaseUrl;
    if (name === "jira-user-email") return jiraUserEmail;
    if (name === "string") return string;
    throw new Error("unreacable");
  });
  expect(getInputs()).toStrictEqual({
    jiraApiToken,
    jiraBaseUrl,
    jiraUserEmail,
    string,
  });
});

test("setInputs", () => {
  const setOutputSpy = jest.spyOn(core, "setOutput");
  const key = "key1";
  const summary = "summary1";
  setOutputs({ key, summary });
  expect(setOutputSpy).toHaveBeenCalledWith("key", key);
  expect(setOutputSpy).toHaveBeenCalledWith("summary", summary);
});
