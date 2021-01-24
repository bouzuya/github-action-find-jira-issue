# Find Jira Issue

A GitHub Action to find jira issue.

## Usage

```yaml
- id: find_jira_issue
  uses: bouzuya/github-action-find-jira-issue@v0.1
  with:
    jira-base-url: ${{ secrets.JIRA_BASE_URL }}
    jira-user-email: ${{ secrets.JIRA_USER_EMAIL }}
    jira-api-token: ${{ secrets.JIRA_API_TOKEN }}
    string: ${{ github.event.pull_request.title }}
- run: echo ${{ steps.find_jira_issue.outputs.key }} ${{ steps.find_jira_issue.outputs.summary }}
```
