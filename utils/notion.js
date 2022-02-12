const getBlockChildren = async (notionClient, block_id, totalPage) => {
  try {
    let result = [];
    let pageCount = 0;
    let start_cursor = undefined;

    do {
      const response = await notionClient.blocks.children.list({
        start_cursor,
        block_id: block_id,
      });
      result.push(...response.results);

      start_cursor = response.next_cursor;
      pageCount += 1;
    } while (
      start_cursor != null &&
      (totalPage == null || pageCount < totalPage)
    );
    return result;
  } catch (e) {
    console.log(e);
  }
};

module.exports = getBlockChildren;
