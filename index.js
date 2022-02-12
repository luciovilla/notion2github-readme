const fs = require("fs");
const process = require("process");

const core = require("@actions/core");
const { Client } = require("@notionhq/client");
const keepaliveWorkflow = require("keepalive-workflow");

const { toMarkdownString, pageToMarkdown } = require("./notion-to-markdown");
const commitReadme = require("./utils/commitReadme");
const buildReadme = require("./utils/buildReadme");

async function run() {
  const PAGE_ID = core.getInput("notion-page-id", { required: true });
  const NOTION_TOKEN = core.getInput("notion-token", { required: true });
  const GITHUB_TOKEN = core.getInput("gh_token");
  const ENABLE_KEEPALIVE = core.getInput("enable_keepalive") === "true";
  const committerUsername = core.getInput("committer_username");
  const committerEmail = core.getInput("committer_email");

  const notion = new Client({ auth: NOTION_TOKEN });
  const mdblocks = await pageToMarkdown(notion, PAGE_ID);
  const mdString = toMarkdownString(mdblocks);

  let changedReadmeCount = 0;
  let jobFailFlag = false; // Job status flag

  const readmeData = fs.readFileSync("./README.md", "utf8");
  const newReadme = buildReadme(readmeData, mdString);
  // if there's change in readme file update it
  if (newReadme !== readmeData) {
    core.info("Writing to " + "./README.md");
    fs.writeFileSync("./README.md", newReadme);
    changedReadmeCount = changedReadmeCount + 1;
  }
  if (changedReadmeCount > 0) {
    if (!process.env.TEST_MODE) {
      // Commit to readme
      await commitReadme(GITHUB_TOKEN, "./README.md").then(() => {
        // Making job fail if one of the source fails
        process.exit(jobFailFlag ? 1 : 0);
      });
    }
  } else {
    // Calculating last commit date, please see https://git.io/Jtm4V
    if (!process.env.TEST_MODE && ENABLE_KEEPALIVE) {
      // Do dummy commit if elapsed time is greater than 50 days
      const message = await keepaliveWorkflow.KeepAliveWorkflow(
        GITHUB_TOKEN,
        committerUsername,
        committerEmail,
        "dummy commit to keep the repository active, see https://git.io/Jtm4V",
        50
      );
      core.info(message);
    } else {
      core.info("No change detected, skipping");
    }
    process.exit(jobFailFlag ? 1 : 0);
  }
}

run();
