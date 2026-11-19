import { daysFromNow } from '../utils/format';

export const DEMO_MEETINGS = [
  {
    id: 'demo-sprint-sync',
    isDemo: true,
    title: 'Campus Placement Portal — Sprint 4 Sync',
    date: daysFromNow(-2, 16),
    audioUri: null,
    summary:
      'The team locked the remaining Sprint 4 scope for the campus placement portal. Ananya will freeze the recruiter dashboard API contract tonight, Rohan will finish offline resume caching, and the group agreed to demo a working student–recruiter flow on Friday even if analytics stay stubbed.',
    key_decisions: [
      'Friday demo will cover student login, job listing, and one-click apply; analytics charts can stay placeholder.',
      'Recruiter dashboard uses REST + JWT; no GraphQL this semester.',
      'Offline demo mode stays on for the viva so faculty can evaluate without lab Wi-Fi.',
    ],
    speaker_segments: [
      {
        speaker: 'Speaker 1',
        timestamp: '00:12',
        text: 'Quick recap: faculty wants a live student-to-recruiter apply flow on Friday. Charts can wait.',
      },
      {
        speaker: 'Speaker 2',
        timestamp: '00:41',
        text: 'API contract is almost frozen. I will push the OpenAPI file tonight so Rohan can stop mocking job IDs.',
      },
      {
        speaker: 'Speaker 1',
        timestamp: '01:18',
        text: 'I still need cache for job cards when the hostel network drops. I can ship that by Thursday noon.',
      },
      {
        speaker: 'Speaker 2',
        timestamp: '02:05',
        text: 'Decision: we keep JWT, skip GraphQL, and keep the offline sample data toggle for the viva.',
      },
      {
        speaker: 'Speaker 1',
        timestamp: '02:36',
        text: 'I will also add two sample companies so the demo is never empty.',
      },
    ],
    action_items: [
      {
        id: 'demo-task-api-contract',
        task: 'Publish recruiter dashboard OpenAPI contract',
        assignee: 'Ananya',
        deadline: daysFromNow(0, 21),
        completed: false,
      },
      {
        id: 'demo-task-offline-cache',
        task: 'Finish offline job-card caching on student app',
        assignee: 'Rohan',
        deadline: daysFromNow(1, 12),
        completed: false,
      },
      {
        id: 'demo-task-seed-data',
        task: 'Seed two sample companies for the viva demo',
        assignee: 'Rohan',
        deadline: daysFromNow(-1, 18),
        completed: true,
      },
    ],
  },
  {
    id: 'demo-viva-prep',
    isDemo: true,
    title: 'Mobile Computing Viva Prep — MeetMaster',
    date: daysFromNow(-5, 11),
    audioUri: null,
    summary:
      'Faculty advisor reviewed MeetMaster against the Mobile Computing rubric. The team must show recording, Gemini minutes, grounded Q&A, PDF export, and Expo Go installation on a phone. Local persistence and reminder notifications are mandatory even if the Gemini key is missing during evaluation.',
    key_decisions: [
      'Evaluation will run on Expo Go; no Android Studio setup for the examiner.',
      'If campus Wi-Fi fails, switch Offline Demo Mode and walk through the two sample meetings.',
      'PDF minutes must include title, date, summary, decisions, speaker transcript, and action items.',
    ],
    speaker_segments: [
      {
        speaker: 'Speaker 1',
        timestamp: '00:08',
        text: 'For the viva we need a 4-minute path: dashboard, record or pick audio, Gemini JSON, then Q&A and PDF.',
      },
      {
        speaker: 'Speaker 2',
        timestamp: '00:47',
        text: 'Please keep a Gemini key in .env, but also keep Offline Demo Mode because the lab network is unreliable.',
      },
      {
        speaker: 'Speaker 1',
        timestamp: '01:22',
        text: 'Action items with deadlines should trigger local notifications. I will verify Android 13 permission tonight.',
      },
      {
        speaker: 'Speaker 2',
        timestamp: '02:11',
        text: 'Decided: examiner installs Expo Go, scans the QR, and we never mention Android Studio.',
      },
      {
        speaker: 'Speaker 1',
        timestamp: '02:40',
        text: 'I will print a one-page checklist of Expo Go pitfalls: mic permission, notification permission, and share sheet for PDF.',
      },
    ],
    action_items: [
      {
        id: 'demo-task-notification-perm',
        task: 'Verify Android 13 notification permission on Expo Go',
        assignee: 'Meera',
        deadline: daysFromNow(-3, 20),
        completed: false,
      },
      {
        id: 'demo-task-pdf-checklist',
        task: 'Prepare Expo Go pitfalls checklist for submission',
        assignee: 'Karan',
        deadline: daysFromNow(2, 17),
        completed: false,
      },
      {
        id: 'demo-task-script',
        task: 'Rehearse the 4-minute viva demo script',
        assignee: 'Meera',
        deadline: daysFromNow(3, 9),
        completed: false,
      },
    ],
  },
];
