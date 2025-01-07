const formattedDate = (isoDate: Date) => {
  // Create a Date object from the ISO string
  const date = new Date(isoDate);

  const result = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return result;
};

export default formattedDate;
