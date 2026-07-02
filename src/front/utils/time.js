export const getMatchEndTime = (startTime, durationMinutes = 90) => {
  if (!startTime) return "-";

  const [hours, minutes] = startTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return "-";
  }

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes + durationMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date.toTimeString().slice(0, 5);
};

export const getMatchTimeRange = (startTime, durationMinutes = 90) => {
  if (!startTime) return "-";

  const endTime = getMatchEndTime(startTime, durationMinutes);

  if (endTime === "-") return startTime;

  return `${startTime} - ${endTime}`;
};