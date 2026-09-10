import { PAYC_USSD_DIAL } from './contact';

export const PAYC_BENEFITS = [
  {
    title: 'Low upfront cost',
    description: 'Get your starter kit with no large cylinder deposit — pay as you cook.',
  },
  {
    title: 'Pay-As-You-Cook',
    description: 'Top up with small amounts via mobile money whenever it suits your budget.',
  },
  {
    title: 'Clean cooking',
    description: 'No charcoal smoke — better health for your family and cleaner kitchens.',
  },
  {
    title: 'Safe smart-meter solution',
    description: 'Haroti PAYC smart meters with built-in safety features and remote monitoring.',
  },
  {
    title: 'Never run out of gas',
    description:
      'When your meter signals low fuel, we schedule a cylinder change at your convenience.',
  },
  {
    title: 'Customer support',
    description: 'Reach Haroti Gas by phone, USSD, or app — we are here when you need us.',
  },
] as const;

export const PAYC_ACQUISITION_STEPS = [
  {
    step: '01',
    title: 'Sign up for PAYC',
    description: `Dial ${PAYC_USSD_DIAL} or contact Haroti Gas to register for the Pay-As-You-Cook programme.`,
  },
  {
    step: '02',
    title: 'Customer vetting',
    description: 'A Haroti sales agent will contact you to confirm details and arrange installation.',
  },
  {
    step: '03',
    title: 'Free doorstep delivery',
    description:
      'We deliver and install your PAYC starter kit — cylinder, regulator, smart meter, and accessories.',
  },
  {
    step: '04',
    title: 'Top up with mobile money',
    description: 'Add credit via Airtel Money or TNM Mpamba using USSD, the Haroti Gas app, or at a station.',
  },
  {
    step: '05',
    title: 'Enjoy your cooking',
    description: 'Cook with clean LPG and pay only for the gas you use — no large upfront burden.',
  },
  {
    step: '06',
    title: 'Free scheduled cylinder change',
    description:
      'When your smart meter reports low fuel, our team schedules a cylinder swap at a time that suits you.',
  },
] as const;

export const PAYC_TOPUP_STEPS = [
  {
    step: 1,
    title: `Dial ${PAYC_USSD_DIAL}`,
    description: 'From any mobile phone — no smartphone or data required.',
  },
  {
    step: 2,
    title: 'Select Buy gas / Top up',
    description: 'Follow the on-screen menu to add credit to your PAYC account or meter.',
  },
  {
    step: 3,
    title: 'Enter your account details',
    description: 'Choose your own meter account or top up for another household if prompted.',
  },
  {
    step: 4,
    title: 'Enter amount & confirm payment',
    description: 'Select the top-up amount and approve with your Airtel Money or TNM Mpamba PIN.',
  },
  {
    step: 5,
    title: 'Confirm credit on your meter',
    description: 'Wait for the credit confirmation on your smart meter before you start cooking.',
  },
] as const;

export const PAYC_SAFETY = {
  detectLeak: {
    title: 'How to detect a gas leak',
    items: [
      'Pungent smell like rotten eggs',
      'Hissing sound near the cylinder or hose',
      'Bubbles when soapy water is applied to joints or the hose',
      'Gas flow indicator on the meter moving when the stove is off',
    ],
  },
  leakResponse: {
    title: 'What to do if you smell gas',
    items: [
      'Switch off the stove and meter valve immediately',
      'Open windows and doors for ventilation',
      'Do not light matches or switch electrical appliances on or off',
      'Check the gas flow indicator on your meter',
      'If the smell persists, contact Haroti Gas customer care',
    ],
  },
  fireEmergency: {
    title: 'What to do in a fire emergency',
    items: [
      'Switch off the stove and meter valve if it is safe to do so',
      'Move the cylinder to a safe area only if you can do so without risk',
      'Leave the house if the fire is significant',
      'Call Haroti Gas or emergency services for assistance',
    ],
  },
} as const;
