import type { VercelRequest, VercelResponse } from "@vercel/node";
import "isomorphic-fetch";
import { createEvents, DateArray } from "ics";
import { findTimeZone, setTimeZone } from "timezone-support";
import { parseZonedTime } from "timezone-support/dist/parse-format";

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
    const localTZ = findTimeZone("Europe/Vienna");
    const parsedDate = parseZonedTime(begin_date, "YYYY-MM-DD[T]HH:mm:ss");
    const dateInTZ = setTimeZone(parsedDate, localTZ);
    const { year, month, day, hours, minutes } = dateInTZ;
    return {
      title: name,
      description: parent_group,
      start: [year, month, day, hours, minutes] as DateArray,
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
