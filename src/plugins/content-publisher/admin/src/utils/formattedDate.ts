// "2026-10-25T…" -> "October 25, 2026"
const formattedDate = (isoDate: Date) =>
  new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export default formattedDate;
