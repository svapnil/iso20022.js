export const sanitize = (value: string, length: 35) => {
  return value.slice(0, length);
};
