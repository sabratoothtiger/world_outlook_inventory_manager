import React from 'react';
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

export function formatTrackingUrl(trackingNumber) {
  const fedexUrl = `https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber=${trackingNumber}`;
  const upsUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
  const uspsUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

  const isFedex = trackingNumber.startsWith("4");
  const isUps = trackingNumber.startsWith("1Z");

  if (isFedex) {
    return (
      <a href={fedexUrl} target="_blank" rel="noreferrer">{trackingNumber}</a>
    );
  } else if (isUps) {
    return (
      <a href={upsUrl} target="_blank" rel="noreferrer">{trackingNumber}</a>
    );
  } else {
    return (
      <a href={uspsUrl} target="_blank" rel="noreferrer">{trackingNumber}</a>
    );
  }
};

export function parseTitleForLabel(title) {
  if (title.includes('#')) {
      title = title.split('#')[0].trim();
  }

  // Truncate the title at the space right before the 34th character
  const title1Length = Math.min(34, title.length);
  const spaceIndex = title.lastIndexOf(' ', title1Length);  // Find the last space before the limit
  const title1 = spaceIndex !== -1 ? title.slice(0, spaceIndex).trim() : title.slice(0, title1Length).trim();
  const title2 = spaceIndex !== -1 ? title.slice(spaceIndex).trim() : '';

  return { title1, title2 };
};