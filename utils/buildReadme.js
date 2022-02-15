const core = require("@actions/core");

const buildReadme = (previousContent, newContent, tagNameInput) => {
  const tagToLookFor = tagNameInput
    ? `<!-- ${tagNameInput}:`
    : `<!-- BLOG-POST-LIST:`;
  const closingTag = "-->";
  const startOfOpeningTagIndex = previousContent.indexOf(
    `${tagToLookFor}START`
  );
  const endOfOpeningTagIndex = previousContent.indexOf(
    closingTag,
    startOfOpeningTagIndex
  );
  const startOfClosingTagIndex = previousContent.indexOf(
    `${tagToLookFor}END`,
    endOfOpeningTagIndex
  );
  if (
    startOfOpeningTagIndex === -1 ||
    endOfOpeningTagIndex === -1 ||
    startOfClosingTagIndex === -1
  ) {
    // Exit with error if comment is not found on the readme
    core.error(
      `Cannot find the comment tag on the readme:\n${tagToLookFor}START -->\n${tagToLookFor}END -->`
    );
    process.exit(1);
  }
  return [
    previousContent.slice(0, endOfOpeningTagIndex + closingTag.length),
    newContent,
    "\n",
    previousContent.slice(startOfClosingTagIndex),
  ].join("");
};

module.exports = buildReadme;
