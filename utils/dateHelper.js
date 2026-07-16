export function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

// Returns "D/M" format matching the results page search bar (e.g. "15/8")
export function slashDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
