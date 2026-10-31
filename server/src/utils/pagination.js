export const paginate = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const paginationMeta = (count, page, limit) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit),
});

