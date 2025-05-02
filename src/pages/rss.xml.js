import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function GET(context) {
  return rss({
    title: 'SilverHairOrTwo | Blog',
    description: 'The incoherent ramblings of a madman with a silver hair follicle.',
    site: context.site,
    items: await pagesGlobToRssItems(import.meta.glob('./posts/*.md')),
    customData: `<language>en-us</language>`,
  });
}
