import dayjs from "dayjs";

export function formatDate(timestamp) {
  const dateObj = new Date(timestamp);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(dateObj.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate
}

export function getFormattedTodayDate() {
  return dayjs();
}

export function formatFinancialData(cost) {
  return cost.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function generateTrackingUrl(trackingNumber) {
  const fedexUrl = `https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber=${trackingNumber}`;
  const upsUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
  const uspsUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

  const isFedex = trackingNumber.startsWith("4");
  const isUps = trackingNumber.startsWith("1Z");

  if (isFedex) {
    return fedexUrl;
  } else if (isUps) {
    return upsUrl;
  } else {
    return uspsUrl;
  }
}
