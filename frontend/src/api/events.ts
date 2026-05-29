import { createEvent, listEvents } from './client';

export const eventsApi = {
  list: listEvents,
  create: createEvent,
};

