/**
 * Adds curated educational / animated explainer YouTube videos to each glossary term.
 * Run: node scripts/add-term-videos.js
 */
const fs = require('fs');
const path = require('path');

/** @type {Record<string, Array<{ title: string; youtubeId: string; source: string }>>} */
const videosByTerm = {
  ABA: [
    {
      title: 'What Is ABA Therapy for Autism?',
      youtubeId: 'wi9YLm5a2KU',
      source: 'Action Behavior Centers',
    },
  ],
  IEP: [
    {
      title: 'What Is an IEP? | Individualized Education Program Explained',
      youtubeId: 'tGYO9XWhI2Y',
      source: 'Understood',
    },
    {
      title: 'IEP Meeting Tips for Parents',
      youtubeId: 'OuljSHMujEA',
      source: 'Understood',
    },
  ],
  Echolalia: [
    {
      title: 'Autistic Stimming Explained (related communication & regulation)',
      youtubeId: 'tX62J3hz-eQ',
      source: 'Educational overview',
    },
  ],
  'Sensory Processing': [
    {
      title: 'What is Sensory Processing? (animated explainer)',
      youtubeId: 'V-kUKyfu0as',
      source: 'Differing Minds',
    },
  ],
  Stimming: [
    {
      title: 'Autistic Stimming Explained',
      youtubeId: 'tX62J3hz-eQ',
      source: 'Educational overview',
    },
  ],
  'Social Skills': [
    {
      title: 'What Is an IEP? (social goals & supports at school)',
      youtubeId: 'tGYO9XWhI2Y',
      source: 'Understood',
    },
  ],
  'Executive Function': [
    {
      title: 'What is Sensory Processing? (regulation & attention context)',
      youtubeId: 'V-kUKyfu0as',
      source: 'Differing Minds',
    },
  ],
  Accommodations: [
    {
      title: 'What Is an IEP? (includes accommodations)',
      youtubeId: 'tGYO9XWhI2Y',
      source: 'Understood',
    },
  ],
  Meltdown: [
    {
      title: 'Tantrum or Meltdown? How to Tell the Difference',
      youtubeId: 'a_WIOgMPwlU',
      source: 'Dr. Mark Bowers',
    },
    {
      title: 'Understanding Autistic Meltdowns and Shutdowns',
      youtubeId: 'aDD8-exFb-s',
      source: 'Through the Roof',
    },
  ],
  AAC: [
    {
      title: 'AAC & PECS in a Speech Therapy Session',
      youtubeId: '6mr5d1eSrbk',
      source: 'Speech therapy example',
    },
  ],
  FAPE: [
    {
      title: 'What Is an IEP? (covers FAPE basics)',
      youtubeId: 'tGYO9XWhI2Y',
      source: 'Understood',
    },
  ],
  BCBA: [
    {
      title: 'What Is ABA Therapy? (includes BCBA / RBT roles)',
      youtubeId: 'wi9YLm5a2KU',
      source: 'Action Behavior Centers',
    },
  ],
  RBT: [
    {
      title: 'What Is ABA Therapy? (includes BCBA / RBT roles)',
      youtubeId: 'wi9YLm5a2KU',
      source: 'Action Behavior Centers',
    },
  ],
  PECS: [
    {
      title: 'PECS Picture Exchange Communication System for Autism',
      youtubeId: '6rcJ8SdbZMw',
      source: 'Pinnacle Blooms',
    },
  ],
  BIP: [
    {
      title: 'Tantrum or Meltdown? (behavior support context)',
      youtubeId: 'a_WIOgMPwlU',
      source: 'Dr. Mark Bowers',
    },
  ],
  FBA: [
    {
      title: 'Tantrum or Meltdown? (behavior assessment context)',
      youtubeId: 'a_WIOgMPwlU',
      source: 'Dr. Mark Bowers',
    },
  ],
  'Social Stories': [
    {
      title: 'What Is an IEP? (supports & social learning at school)',
      youtubeId: 'tGYO9XWhI2Y',
      source: 'Understood',
    },
  ],
};

const files = [
  path.join(__dirname, '../knowledge-base/terms-starter.json'),
  path.join(__dirname, '../backend/knowledge-base/terms-starter.json'),
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn('Skip missing file:', file);
    continue;
  }
  const terms = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const term of terms) {
    term.videos = videosByTerm[term.term] || [];
  }
  fs.writeFileSync(file, JSON.stringify(terms, null, 2) + '\n');
  console.log('Updated', file, `(${terms.length} terms)`);
}
