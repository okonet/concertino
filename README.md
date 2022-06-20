# concertino

Get an iCal with your concerts. In order to use, do "subscribe to a calendar" in your favorite calendar application using this link:

`https://concertino-ical.vercel.app/api/${VENUE}?token=${YOUR_TOKEN}&id=${YOUR_CUSTOMER_ID}`

Setup the calendar to refresh at some interval (once a day / week) to get automatic updates.

Supported endpoints (venues):

- `/api/konzerthaus` -- data from https://sitzplatz.konzerthaus.at. Get the token and customer id from your email.
