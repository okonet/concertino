import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createEvents, EventAttributes } from "ics";
import "isomorphic-fetch";

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

  const events = konzerte.map((event): EventAttributes => {
    const { konzertdaten, qr_access_code, tickets } = event;
    const { eventdata } = konzertdaten;
    console.log(eventdata);
    console.log(tickets);
    const { begin_date, parent_group, name, venue, url } = eventdata;
    const startDate = new Date(begin_date);
    return {
      title: name,
      description: `${parent_group ? `Abo: ${parent_group}\n` : ""}
Tickets:\n
${tickets
  .map(
    (ticket) =>
      `- ${ticket.sektor_name1} ${ticket.sektor_name2}, Reihe ${ticket.sipl_reihennr}Platz ${ticket.sipl_platznr}`
  )
  .join("\n")}
Info:\n${url}\n
Ticket portal: https://sitzplatz.konzerthaus.at/?token=${token}`,
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ],
      startInputType: "local",
      startOutputType: "local",
      endOutputType: "local",
      duration: { hours: 2 },
      url: `https://api.qrserver.com/v1/create-qr-code/?data=${qr_access_code}&ecc=H`,
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
