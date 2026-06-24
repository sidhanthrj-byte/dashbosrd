export type NextStep = {
  action: string;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
  script?: string;
};

export type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  description: string;
};

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  new: {
    label: 'New Lead',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    description: 'Not yet contacted',
  },
  first_call_done: {
    label: 'First Call Done',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    description: 'Initial contact made',
  },
  call_back_requested: {
    label: 'Call Back Later',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    description: 'Asked to call back',
  },
  follow_up: {
    label: 'Follow Up',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    description: 'Active follow-up in progress',
  },
  meeting_scheduled: {
    label: 'Meeting Scheduled',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    description: 'Meeting booked',
  },
  proposal_sent: {
    label: 'Proposal Sent',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50 border-cyan-200',
    description: 'Quote / proposal shared',
  },
  negotiation: {
    label: 'Negotiating',
    color: 'text-pink-700',
    bg: 'bg-pink-50 border-pink-200',
    description: 'Discussing terms',
  },
  sample_sent: {
    label: 'Sample Sent',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
    description: 'Sample dispatched',
  },
  converted: {
    label: 'Converted',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    description: 'Order confirmed',
  },
  not_interested: {
    label: 'Not Interested',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    description: 'Closed — not interested',
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
    description: 'Paused for now',
  },
};

export function generateNextSteps(
  status: string,
  leadName: string,
  companyName: string,
  notes?: string,
  callbackDate?: string
): NextStep[] {
  const name = leadName.split(' ')[0];

  const steps: Record<string, NextStep[]> = {
    new: [
      {
        action: `Call ${name} at ${companyName} to introduce Pongs Stretch Ceilings`,
        timeframe: 'Today or tomorrow',
        priority: 'high',
        script: `"Hi, am I speaking with ${name}? This is [Your Name] from Pongs Stretch Ceilings. We specialize in premium stretch ceiling solutions for architectural projects. I'd love to share how we've worked with leading firms across India. Do you have 2 minutes?"`,
      },
      {
        action: 'Look up their recent projects on their website before calling',
        timeframe: 'Before the call',
        priority: 'medium',
      },
      {
        action: 'Connect with them on LinkedIn before or after the call',
        timeframe: 'This week',
        priority: 'low',
      },
    ],

    first_call_done: [
      {
        action: `Send a WhatsApp/email to ${name} with your product catalogue and case studies`,
        timeframe: 'Within 2 hours of the call',
        priority: 'high',
        script: `"Hi ${name}, great speaking with you! As promised, sharing our Pongs Stretch Ceiling catalogue and a few project case studies relevant to ${companyName}. Looking forward to your thoughts!"`,
      },
      {
        action: 'Schedule a follow-up call in 2–3 days',
        timeframe: '2–3 days',
        priority: 'high',
      },
      {
        action: 'Identify which product line suits their typical projects and highlight it',
        timeframe: 'Before follow-up',
        priority: 'medium',
      },
    ],

    call_back_requested: [
      {
        action: callbackDate
          ? `Call ${name} back on ${callbackDate} as requested`
          : `Call ${name} back next week as requested — set a calendar reminder now`,
        timeframe: callbackDate || 'Next week',
        priority: 'high',
        script: `"Hi ${name}, this is [Your Name] from Pongs — you'd asked me to call back. Is now a good time to show you what we've been working on for architects like yourself?"`,
      },
      {
        action: 'Send a brief message so they remember you before the callback',
        timeframe: '1 day before the callback',
        priority: 'medium',
        script: `"Hi ${name}, just a quick reminder — I'll be calling you tomorrow as we'd planned. Looking forward to the conversation!"`,
      },
    ],

    follow_up: [
      {
        action: `Check if ${name} viewed the catalogue and ask for feedback`,
        timeframe: 'Today',
        priority: 'high',
        script: `"Hi ${name}, I shared our catalogue last week — did you get a chance to go through it? Any questions or projects coming up where we could be useful?"`,
      },
      {
        action: 'Offer to schedule a demo or send a physical sample',
        timeframe: 'This call',
        priority: 'high',
      },
      {
        action: 'Share a project testimonial from a similar architecture firm',
        timeframe: 'This week',
        priority: 'medium',
      },
    ],

    meeting_scheduled: [
      {
        action: 'Prepare a custom presentation for the meeting with projects similar to theirs',
        timeframe: '1 day before',
        priority: 'high',
      },
      {
        action: 'Carry physical samples and a product price list to the meeting',
        timeframe: 'Before meeting',
        priority: 'high',
      },
      {
        action: `Send a confirmation message to ${name} the day before`,
        timeframe: '1 day before',
        priority: 'medium',
        script: `"Hi ${name}, looking forward to our meeting tomorrow! I'll have product samples and case studies ready for you. See you then!"`,
      },
    ],

    proposal_sent: [
      {
        action: `Follow up with ${name} on the proposal — ask if they have questions`,
        timeframe: '2–3 days after sending',
        priority: 'high',
        script: `"Hi ${name}, I sent over the proposal for the Pongs Stretch Ceiling solution. Did you get a chance to review it? Happy to clarify anything or adjust as needed."`,
      },
      {
        action: 'Offer to negotiate or customise the package if needed',
        timeframe: 'On follow-up call',
        priority: 'high',
      },
      {
        action: 'Check if there is a project timeline you can align with',
        timeframe: 'On follow-up call',
        priority: 'medium',
      },
    ],

    negotiation: [
      {
        action: 'Clarify their budget and project timeline',
        timeframe: 'Immediately',
        priority: 'high',
      },
      {
        action: 'Check with your manager on discount/bundle possibilities',
        timeframe: 'Today',
        priority: 'high',
      },
      {
        action: `Keep the conversation warm — share a success story similar to ${companyName}'s projects`,
        timeframe: 'This week',
        priority: 'medium',
      },
    ],

    sample_sent: [
      {
        action: `Call ${name} 3 days after sample delivery to get their feedback`,
        timeframe: '3 days post-delivery',
        priority: 'high',
        script: `"Hi ${name}, hope you received our Pongs Stretch Ceiling sample. What did you think of the quality and finish? Any specific colour/texture you'd like to explore?"`,
      },
      {
        action: 'Share the full sample catalogue so they can pick preferred options',
        timeframe: 'Same call',
        priority: 'medium',
      },
    ],

    converted: [
      {
        action: 'Send a thank you message and confirm order details in writing',
        timeframe: 'Immediately',
        priority: 'high',
        script: `"Hi ${name}, thank you for choosing Pongs! Excited to work with ${companyName} on this project. I'll send you the order confirmation shortly."`,
      },
      {
        action: 'Ask for a referral to other architects they know',
        timeframe: 'After delivery / project completion',
        priority: 'medium',
        script: `"${name}, really happy with how the project turned out. If you know any other architects who might benefit from Pongs, I'd really appreciate an introduction!"`,
      },
      {
        action: 'Schedule a check-in call 30 days after installation',
        timeframe: '30 days post-installation',
        priority: 'medium',
      },
    ],

    not_interested: [
      {
        action: `Mark a re-engagement reminder for ${name} in 3 months`,
        timeframe: '3 months',
        priority: 'low',
        script: `"Hi ${name}, completely understand. I'll touch base in a few months — projects and needs change. Hope to work together sometime!"`,
      },
      {
        action: 'Note the reason for disinterest — may reveal a product/price insight',
        timeframe: 'Now',
        priority: 'medium',
      },
    ],

    on_hold: [
      {
        action: `Re-ping ${name} in 2 weeks to check if the situation has changed`,
        timeframe: '2 weeks',
        priority: 'medium',
      },
      {
        action: 'Note why it is on hold so you can address the blocker on next call',
        timeframe: 'Now',
        priority: 'medium',
      },
    ],
  };

  return steps[status] || steps['new'];
}

export function getNextActionDate(status: string): string {
  const now = new Date();
  const days: Record<string, number> = {
    new: 1,
    first_call_done: 2,
    call_back_requested: 7,
    follow_up: 3,
    meeting_scheduled: 1,
    proposal_sent: 3,
    negotiation: 1,
    sample_sent: 3,
    converted: 30,
    not_interested: 90,
    on_hold: 14,
  };
  const d = days[status] ?? 3;
  now.setDate(now.getDate() + d);
  return now.toISOString().split('T')[0];
}
