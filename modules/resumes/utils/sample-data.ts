// Three complete, fictional resumes. The seed inserts all three, the home
// page and the templates gallery render them, and "Generate a sample" picks
// one at random. Browser-safe and pure.
import { ACCENTS, type ResumeDocument, type TemplateId } from '../types.ts';

export interface SampleResume { title: string; doc: ResumeDocument }

export const SAMPLE_RESUMES: readonly SampleResume[] = [
  {
    title: 'Backend roles 2026',
    doc: {
      template: 'classic',
      accent: ACCENTS[1].hex,
      profile: {
        fullName: 'Maya Okafor',
        headline: 'Senior Backend Engineer',
        email: 'maya@okafor.dev',
        phone: '+44 7700 900123',
        location: 'London, UK',
        website: 'okafor.dev',
        summary:
          'Backend engineer with nine years building payment and ledger systems at scale. Led the migration of a monolith to event-driven services handling 40k transactions per second, and mentor engineers who go on to lead their own teams.',
      },
      experience: [
        {
          company: 'Lumen Pay',
          role: 'Senior Backend Engineer',
          location: 'London',
          start: '2021-03',
          end: '',
          current: true,
          highlights:
            'Designed the double-entry ledger service (Go, Postgres) now settling 40k tx/s with zero reconciliation drift\nCut p99 payout latency from 2.1s to 180ms by moving fraud checks to an async pipeline\nRun the on-call rotation for payments and brought the pager volume down 70% in a year',
        },
        {
          company: 'Northwind Logistics',
          role: 'Backend Engineer',
          location: 'Manchester',
          start: '2017-06',
          end: '2021-02',
          current: false,
          highlights:
            'Built the route-pricing API (Node, Redis) used by 300 enterprise customers\nIntroduced contract tests across 14 services, dropping integration incidents by half\nShipped the first observability stack (OpenTelemetry, Grafana) and trained three teams on it',
        },
      ],
      education: [
        {
          school: 'University of Edinburgh',
          degree: 'BSc',
          field: 'Computer Science',
          start: '2013-09',
          end: '2017-05',
          notes: 'First-class honours. Dissertation on consistency models for distributed caches.',
        },
      ],
      projects: [
        {
          name: 'ledgerkit',
          link: 'github.com/mayaokafor/ledgerkit',
          description: 'An open-source double-entry ledger library for Go with 1.4k stars and production users in three fintechs.',
        },
      ],
      skills: ['Go', 'TypeScript', 'PostgreSQL', 'Kafka', 'Redis', 'Kubernetes', 'AWS', 'OpenTelemetry', 'System design'],
    },
  },
  {
    title: 'Product design portfolio',
    doc: {
      template: 'modern',
      accent: ACCENTS[3].hex,
      profile: {
        fullName: 'Jonas Lindqvist',
        headline: 'Product Designer',
        email: 'hello@jonaslindqvist.se',
        phone: '+46 70 123 45 67',
        location: 'Stockholm, Sweden',
        website: 'jonaslindqvist.se',
        summary:
          'Product designer who ships. Six years turning fuzzy problems into clear interfaces for B2B tools, with a bias for prototypes over decks and a habit of sitting in on support calls.',
      },
      experience: [
        {
          company: 'Fathom Analytics',
          role: 'Lead Product Designer',
          location: 'Remote',
          start: '2022-01',
          end: '',
          current: true,
          highlights:
            'Redesigned the dashboard builder, lifting weekly active editors from 31% to 58% of accounts\nBuilt and documented the design system (Figma plus web components) used by 12 engineers\nRun fortnightly research sessions with customers and turn them into a public roadmap',
        },
        {
          company: 'Klarna',
          role: 'Product Designer',
          location: 'Stockholm',
          start: '2019-02',
          end: '2021-12',
          current: false,
          highlights:
            'Owned checkout flows for the Nordics, shipping a one-tap return flow used by two million shoppers\nPaired with data science on experiments that raised conversion 4.2% in six months',
        },
      ],
      education: [
        {
          school: 'Konstfack',
          degree: 'MFA',
          field: 'Interaction Design',
          start: '2016-09',
          end: '2018-06',
          notes: '',
        },
      ],
      projects: [
        {
          name: 'Typeset',
          link: 'typeset.design',
          description: 'A free type-scale playground used by 20k designers a month.',
        },
        {
          name: 'Quiet Hours',
          link: 'quiethours.app',
          description: 'A tiny macOS app that mutes notifications on a schedule. Featured by Apple in 2024.',
        },
      ],
      skills: ['Figma', 'Prototyping', 'Design systems', 'User research', 'HTML and CSS', 'Accessibility', 'Motion design'],
    },
  },
  {
    title: 'Data science roles',
    doc: {
      template: 'minimal',
      accent: ACCENTS[2].hex,
      profile: {
        fullName: 'Priya Raghunathan',
        headline: 'Data Scientist',
        email: 'priya@raghunathan.io',
        phone: '+91 98765 43210',
        location: 'Bengaluru, India',
        website: 'raghunathan.io',
        summary:
          'Data scientist focused on forecasting and experimentation for marketplaces. Five years turning noisy operational data into models that ship, with a track record of pairing closely with product and finance to make the numbers matter.',
      },
      experience: [
        {
          company: 'Swift Basket',
          role: 'Senior Data Scientist',
          location: 'Bengaluru',
          start: '2022-07',
          end: '',
          current: true,
          highlights:
            'Built the demand forecasting system (Python, LightGBM, Airflow) that cut grocery waste 18% across 40 dark stores\nDesigned the experimentation platform used for 120 A/B tests a quarter, with sequential testing to halve decision time\nMentor four analysts and run the weekly modelling review',
        },
        {
          company: 'Harbor Insurance',
          role: 'Data Scientist',
          location: 'Pune',
          start: '2019-08',
          end: '2022-06',
          current: false,
          highlights:
            'Shipped a claims triage model that routed 30% of claims to straight-through processing\nReplaced a spreadsheet pricing workflow with a reproducible pipeline reviewed by actuaries',
        },
      ],
      education: [
        {
          school: 'IIT Madras',
          degree: 'MTech',
          field: 'Data Science',
          start: '2017-07',
          end: '2019-05',
          notes: 'Thesis on hierarchical forecasting for retail demand.',
        },
      ],
      projects: [
        {
          name: 'forecast-bench',
          link: 'github.com/priyar/forecast-bench',
          description: 'A benchmark suite comparing classical and gradient-boosted forecasters on public retail datasets.',
        },
      ],
      skills: ['Python', 'SQL', 'pandas', 'LightGBM', 'PyTorch', 'Airflow', 'dbt', 'Experiment design', 'Causal inference'],
    },
  },
];

/** One of the samples, chosen at random. */
export function randomSample(): SampleResume {
  return SAMPLE_RESUMES[Math.floor(Math.random() * SAMPLE_RESUMES.length)];
}

export function sampleFor(template: TemplateId): SampleResume {
  return SAMPLE_RESUMES.find((s) => s.doc.template === template) ?? SAMPLE_RESUMES[0];
}
