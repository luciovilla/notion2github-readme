const inlineCode = (text) => {
  return `\`${text}\``;
};

const bold = (text) => {
  return `**${text}**`;
};

const italic = (text) => {
  return `_${text}_`;
};

const strikethrough = (text) => {
  return `~~${text}~~`;
};

const underline = (text) => {
  return `<u>${text}</u>`;
};

const link = (text, href) => {
  return `[${text}](${href})`;
};

const codeBlock = (text, language) => {
  return `\`\`\`${language}
${text}
\`\`\``;
};

const heading1 = (text) => {
  return `# ${text}`;
};

const heading2 = (text) => {
  return `## ${text}`;
};

const heading3 = (text) => {
  return `### ${text}`;
};

const quote = (text) => {
  // the replace is done to handle multiple lines
  return `> ${text.replace(/\n/g, "  \n>")}`;
};

const callout = (text, icon) => {
  let emoji;
  if (icon.type === "emoji") {
    emoji = icon.emoji;
  }

  // the replace is done to handle multiple lines
  return `> ${emoji ? emoji + " " : ""}${text.replace(/\n/g, "  \n>")}`;
};

const bullet = (text) => {
  return `- ${text}`;
};

const todo = (text, checked) => {
  return checked ? `- [x] ${text}` : `- [ ] ${text}`;
};

const image = (alt, href) => {
  return `![${alt}](${href})`;
};

const addTabSpace = (text, n = 0) => {
  const tab = "	";
  for (let i = 0; i < n; i++) {
    if (text.includes("\n")) {
      const multiLineText = text.split(/(?<=\n)/).join(tab);
      text = tab + multiLineText;
    } else text = tab + text;
  }
  return text;
};

const divider = () => {
  return "---";
};

const tableRowHeader = (row) => {
  let header = row.join("|");
  // eslint-disable-next-line no-unused-vars
  let divider = row.map((_) => "---").join("|");
  return `${header}\n${divider}`;
};

const tableRowBody = (row) => {
  return row.join("|");
};

const table = (cells) => {
  const tableRows = cells.map((row, i) =>
    !i ? tableRowHeader(row) : tableRowBody(row)
  );
  return tableRows.join("\n");
};

module.exports = {
  inlineCode,
  bold,
  italic,
  strikethrough,
  underline,
  codeBlock,
  link,
  heading1,
  heading2,
  heading3,
  quote,
  callout,
  bullet,
  todo,
  image,
  addTabSpace,
  divider,
  table,
};
