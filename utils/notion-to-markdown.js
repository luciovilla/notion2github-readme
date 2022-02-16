const getBlockChildren = require("./utils/notion");
const {
  addTabSpace,
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
  divider,
  table,
} = require("./utils/markdown");

const toMarkdownString = (mdBlocks, nestingLevel = 0) => {
  let mdString = "";
  mdBlocks.forEach((mdBlocks) => {
    if (mdBlocks.parent) {
      mdString += `
${addTabSpace(mdBlocks.parent, nestingLevel)}
`;
    }
    if (mdBlocks.children && mdBlocks.children.length > 0) {
      mdString += toMarkdownString(mdBlocks.children, nestingLevel + 1);
    }
  });
  return mdString;
};

const pageToMarkdown = async (notion, id, totalPage = null) => {
  if (!notion) {
    throw new Error("Notion client is not provided.");
  }
  const blocks = await getBlockChildren(notion, id, totalPage);
  const parsedData = await blocksToMarkdown(notion, blocks);
  return parsedData;
};

const blocksToMarkdown = async (notion, blocks, mdBlocks = []) => {
  if (!blocks) return mdBlocks;

  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];

    if ("has_children" in block && block.has_children) {
      let child_blocks = await getBlockChildren(notion, block.id);
      mdBlocks.push({
        parent: await blockToMarkdown(notion, block),
        children: [],
      });

      let l = mdBlocks.length;
      await blocksToMarkdown(child_blocks, mdBlocks[l - 1].children);
      continue;
    }
    let tmp = await blockToMarkdown(notion, block);

    mdBlocks.push({ parent: tmp, children: [] });
  }
  return mdBlocks;
};

const blockToMarkdown = async (notion, block) => {
  if (!("type" in block)) return "";

  let parsedData = "";
  const { type } = block;

  switch (type) {
    case "image":
      {
        let blockContent = block.image;
        const image_caption_plain = blockContent.caption
          .map((item) => item.plain_text)
          .join("");
        const image_type = blockContent.type;
        if (image_type === "external")
          return image(image_caption_plain, blockContent.external.url);
        if (image_type === "file")
          return image(image_caption_plain, blockContent.file.url);
      }
      break;

    case "divider": {
      return divider();
    }

    case "equation": {
      return codeBlock(block.equation.expression);
    }

    case "video":
    case "file":
    case "pdf":
      {
        let blockContent;
        if (type === "video") blockContent = block.video;
        if (type === "file") blockContent = block.file;
        if (type === "pdf") blockContent = block.pdf;
        if (blockContent) {
          const file_type = blockContent.type;
          if (file_type === "external")
            return link("image", blockContent.external.url);
          if (file_type === "file") return link("image", blockContent.file.url);
        }
      }
      break;

    case "bookmark":
    case "embed":
    case "link_preview":
      {
        let blockContent;
        if (type === "bookmark") blockContent = block.bookmark;
        if (type === "embed") blockContent = block.embed;
        if (type === "link_preview") blockContent = block.link_preview;
        if (blockContent) return link(type, blockContent.url);
      }
      break;

    case "table": {
      const { id, has_children } = block;
      let tableArr;
      if (has_children) {
        const tableRows = await getBlockChildren(notion, id, 100);
        let rowsPromise =
          tableRows &&
          tableRows.map(async (row) => {
            const { type } = row;
            const cells = row[type]["cells"];

            let cellStringPromise = cells.map(
              async (cell) =>
                await blockToMarkdown({
                  type: "paragraph",
                  paragraph: { text: cell },
                })
            );

            const cellStringArr = await Promise.all(cellStringPromise);
            tableArr.push(cellStringArr);
          });
        await Promise.all(rowsPromise || []);
      }
      parsedData = table(tableArr);
      return parsedData;
    }

    default: {
      let blockContent = block[type].text || [];
      blockContent.map((content) => {
        const annotations = content.annotations;
        let plain_text = content.plain_text;

        plain_text = annotatePlainText(plain_text, annotations);

        if (content["href"]) plain_text = link(plain_text, content["href"]);

        parsedData += plain_text;
      });
    }
  }

  switch (type) {
    case "code":
      {
        parsedData = codeBlock(parsedData, block[type].language);
      }
      break;

    case "heading_1":
      {
        parsedData = heading1(parsedData);
      }
      break;

    case "heading_2":
      {
        parsedData = heading2(parsedData);
      }
      break;

    case "heading_3":
      {
        parsedData = heading3(parsedData);
      }
      break;

    case "quote":
      {
        parsedData = quote(parsedData);
      }
      break;

    case "callout":
      {
        parsedData = callout(parsedData, block[type].icon);
      }
      break;

    case "bulleted_list_item":
    case "numbered_list_item":
      {
        parsedData = bullet(parsedData);
      }
      break;

    case "to_do":
      {
        parsedData = todo(parsedData, block.to_do.checked);
      }
      break;
  }

  return parsedData;
};

const annotatePlainText = (text, annotations) => {
  if (text.match(/^\s*$/)) return text;

  const leadingSpaceMatch = text.match(/^(\s*)/);
  const trailingSpaceMatch = text.match(/(\s*)$/);

  const leading_space = leadingSpaceMatch ? leadingSpaceMatch[0] : "";
  const trailing_space = trailingSpaceMatch ? trailingSpaceMatch[0] : "";

  text = text.trim();

  if (text !== "") {
    if (annotations.code) text = inlineCode(text);
    if (annotations.bold) text = bold(text);
    if (annotations.italic) text = italic(text);
    if (annotations.strikethrough) text = strikethrough(text);
    if (annotations.underline) text = underline(text);
  }

  return leading_space + text + trailing_space;
};

module.exports = { toMarkdownString, pageToMarkdown };
