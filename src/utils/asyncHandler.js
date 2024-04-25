exports.asyncHandler = (requresHandler) => (req, res, next) => {
  Promise.resolve(requresHandler(req, res, next)).catch((err) => next(err));
};
