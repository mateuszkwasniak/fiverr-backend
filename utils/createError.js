export const createError = (
  status = 500,
  message = "Something went wrong."
) => {
  const error = new Error();
  error.status = status;
  error.message = message;

  return error;
};
