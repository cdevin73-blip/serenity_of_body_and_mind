import { ACCESS_LEVELS } from "./constants";

export function getDaysRemaining(dateStr) {
  if (!dateStr) return 0;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getAccessInfo(client) {
  if (!client) return { ...ACCESS_LEVELS.active, daysLeft: null };
  const level = ACCESS_LEVELS[client.accessLevel] || ACCESS_LEVELS.active;
  const daysLeft = client.accessLevel === 'grace'
    ? getDaysRemaining(client.graceEndDate)
    : client.accessLevel === 'active'
    ? getDaysRemaining(client.programEndDate)
    : null;
  return { ...level, daysLeft };
}

// Counts messages the client actually sent in the last 7 days.
// Computed live from message rows so it can never drift out of sync
// the way a separately-stored counter can.
export function countMessagesThisWeek(messageList, clientId) {
  if (!messageList || !messageList.length) return 0;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return messageList.filter(m =>
    m.from === "client" &&
    m.created_at &&
    new Date(m.created_at) >= weekAgo
  ).length;
}
