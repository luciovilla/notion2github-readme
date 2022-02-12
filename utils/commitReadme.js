const { spawn } = require("child_process");
const core = require("@actions/core");

const exec = (cmd, args = [], options = {}) =>
  new Promise((resolve, reject) => {
    let outputData = "";
    const optionsToCLI = {
      ...options,
    };
    if (!optionsToCLI.stdio) {
      Object.assign(optionsToCLI, { stdio: ["inherit", "inherit", "inherit"] });
    }
    const app = spawn(cmd, args, optionsToCLI);
    if (app.stdout) {
      // Only needed for pipes
      app.stdout.on("data", function (data) {
        outputData += data.toString();
      });
    }

    app.on("close", (code) => {
      if (code !== 0) {
        return reject({ code, outputData });
      }
      return resolve({ code, outputData });
    });
    app.on("error", () => reject({ code: 1, outputData }));
  });

const commitReadme = async (githubToken, readmeFilePaths) => {
  // Getting config
  const committerUsername = core.getInput("committer_username");
  const committerEmail = core.getInput("committer_email");
  const commitMessage = core.getInput("commit_message");
  // Doing commit and push
  await exec("git", ["config", "--global", "user.email", committerEmail]);
  if (githubToken) {
    // git remote set-url origin
    await exec("git", [
      "remote",
      "set-url",
      "origin",
      `https://${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.git`,
    ]);
  }
  await exec("git", ["config", "--global", "user.name", committerUsername]);
  await exec("git", ["add", ...readmeFilePaths]);
  await exec("git", ["commit", "-m", commitMessage]);
  await exec("git", ["push"]);
  core.info("Readme updated successfully in the upstream repository");
};

module.exports = commitReadme;
