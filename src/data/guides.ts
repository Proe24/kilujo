export interface Guide {
  title: string;
  description: string;
  href: string;
  cover?: string;
  meta?: string;
}

// Add more guides by dropping the static files into `public/guides/<slug>/`
// and appending a new entry below.
export const guides: Guide[] = [
  {
    title: 'Barotrauma — Modded Campaign Guide',
    description:
      'A companion playbook for our submarine campaign: mod-by-mod walkthrough, plus a unified strategy guide.',
    href: '/guides/barotrauma/baro_index.html',
    meta: '17 mods · ~30 min read',
  },
];
