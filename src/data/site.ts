export const site = {
  name: 'Florian Glöbl',
  url: 'https://floriangloebl.de',
  description:
    'Coaching für dich persönlich und für Führungskräfte, Mentoring, Unterstützung beim Gründen und der Weg von der Idee zum Prototyp. Florian Glöbl aus Laberweinting.',
  contact: {
    name: 'Florian Glöbl',
    street: 'Birkenweg 6',
    city: '84082 Laberweinting',
    phone: '0172/1718875',
    phoneHref: 'tel:+491721718875',
    email: 'f.gloebl@gmx.de',
  },
  // Indexierung erst zum Start aktivieren: PUBLIC_INDEXING=true beim Build setzen.
  indexing: import.meta.env.PUBLIC_INDEXING === 'true',
};

export const mailto = (subject?: string) =>
  `mailto:${site.contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

export const nav = [
  { label: 'Coaching', href: '/#coaching' },
  { label: 'Weitere Angebote', href: '/#weitere-angebote' },
  { label: 'Über mich', href: '/#ueber-mich' },
  { label: 'Gedanken', href: '/gedanken/' },
  { label: 'Kontakt', href: '/#kontakt' },
];

const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
});
export const formatDate = (d: Date) => dateFormat.format(d);
