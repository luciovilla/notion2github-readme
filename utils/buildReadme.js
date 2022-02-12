const buildReadme = (previousContent, newContent) => {
  return [previousContent.slice(0), newContent].join("");
};

module.exports = buildReadme;
