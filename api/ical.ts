import "isomorphic-fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createEvents, DateArray } from "ics";

async function getEvents(id, token) {
  if (!id || !token) {
    throw new Error("Please provide both your client ID and your token");
  }

  const response = await fetch(
    `https://shotter.component-driven.dev/api/fetch?url=https://sitzplatz.konzerthaus.at/api/seatdata&kunden_nr=${id}&token=${token}`
  ).then((res) => res.json());
  const { konzerte } = response;

  if (!Array.isArray(konzerte)) {
    throw new Error("No events found...");
  }

  const events = konzerte.map((event) => {
    const { konzertdaten } = event;
    const { eventdata } = konzertdaten;
    const { begin_date, parent_group, name, venue, url } = eventdata;
    const date = new Date(begin_date);
    return {
      title: name,
      description: parent_group,
      start: [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
      ] as DateArray,
      duration: { hours: 2, minutes: 30 },
      url,
      location: `${venue.name}, ${venue.location}, ${venue.street}, ${venue.cap} ${venue.city}`,
    };
  });

  const { error, value } = createEvents(events);

  if (error) {
    throw error;
  }

  return value;
}

export default async function (req: VercelRequest, res: VercelResponse) {
  const { token, id } = req.query;

  try {
    const events = await getEvents(id, token);
    res.setHeader("Content-Type", "text/calendar");
    res.status(200).end(events);
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  }
}
