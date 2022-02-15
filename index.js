require("dotenv").config();

const fs = require("fs");
const process = require("process");
const fetch = require("node-fetch");

const core = require("@actions/core");
const { Client } = require("@notionhq/client");

const { toMarkdownString, pageToMarkdown } = require("./notion-to-markdown");
const commitReadme = require("./utils/commitReadme");
const buildReadme = require("./utils/buildReadme");

async function run() {
  try {
    const PAGE_ID = process.env.NOTION_PAGE_ID;
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const BLOG_API = process.env.BLOG_API;
    const SPOTIFY_API = process.env.SPOTIFY_API;
    const GITHUB_TOKEN = core.getInput("gh_token");

    const notion = new Client({ auth: NOTION_TOKEN });
    const mdblocks = await pageToMarkdown(notion, PAGE_ID);
    const mdString = toMarkdownString(mdblocks);

    // Get latest blog posts
    const blogPostLinks = await fetch(BLOG_API).then((r) =>
      r.json().then((data) => data.allNotas)
    );
    // Convert blog posts to markdown
    const postListMarkdown = blogPostLinks.map(
      (post) => `\n- [${post.title}](${post.url})`
    );
    // Add blog posts to Readme data
    const readmeWithBlogPosts = buildReadme(mdString, postListMarkdown);

    // Get current Spotify song if listening
    const spotifyData = await fetch(SPOTIFY_API).then((r) => r.json());
    // Add song if listening
    const currentSong = spotifyData.isPlaying
      ? `\n ${spotifyData.title} - by ${spotifyData.artist} on [Spotify](${spotifyData.songUrl})`
      : `\n Not listening to music right now.`;

    const newReadme = buildReadme(readmeWithBlogPosts, currentSong, "SPOTIFY");
    let changedReadme = false;
    const readmeData = fs.readFileSync("./README.md", "utf8");

    // If there's change in readme file, lets update it
    if (newReadme !== readmeData) {
      core.info("Writing to " + "./README.md");
      fs.writeFileSync("./README.md", newReadme);
      changedReadme = true;
    }

    if (changedReadme) {
      if (!process.env.TEST_MODE) {
        // Commit README changes
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
