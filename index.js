const fs = require("fs");
const process = require("process");

const core = require("@actions/core");
const { Client } = require("@notionhq/client");

const { toMarkdownString, pageToMarkdown } = require("./notion-to-markdown");
const commitReadme = require("./utils/commitReadme");

async function run() {
  try {
    const PAGE_ID = core.getInput("notion-page-id", { required: true });
    const NOTION_TOKEN = core.getInput("notion-token", { required: true });
    const GITHUB_TOKEN = core.getInput("gh_token");

    const notion = new Client({ auth: NOTION_TOKEN });
    const mdblocks = await pageToMarkdown(notion, PAGE_ID);
    const mdString = toMarkdownString(mdblocks);

    let changedReadme = false;

    const readmeData = fs.readFileSync("./README.md", "utf8");
    const newReadme = mdString;
    // if there's change in readme file update it
    if (newReadme !== readmeData) {
      core.info("Writing to " + "./README.md");
      fs.writeFileSync("./README.md", newReadme);
      changedReadme = true;
    }
    if (changedReadme) {
      if (!process.env.TEST_MODE) {
        // Commit to readme
        await commitReadme(GITHUB_TOKEN, "./README.md");
      }
    } else {
      core.info("No change detected, skipping");
    }
  } catch (e) {
    core.setFailed(e instanceof Error ? e.message : e + "");
  }
}

run();
