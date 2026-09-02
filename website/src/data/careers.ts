export interface JobOpening {
  title: string;
  location: string;
  type: string;
  department: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

export const openPositions: JobOpening[] = [
  {
    title: 'Lease Agent',
    location: 'Lilongwe / Blantyre',
    type: 'Full-time',
    department: 'Sales & Customer Operations',
    summary:
      'Help customers access clean cooking through PAYC and cylinder lease programmes. You will onboard households, explain lease terms, and support renewals across our station network.',
    responsibilities: [
      'Enroll customers into PAYC and cylinder lease programmes at stations and community outreach points',
      'Explain pricing, safety requirements, and payment options clearly to new customers',
      'Maintain accurate customer records and follow up on pending applications',
      'Coordinate with station teams to ensure cylinders and equipment are ready for handover',
      'Report sales activity and customer feedback to the operations team',
    ],
    requirements: [
      'Certificate or diploma in sales, business, or a related field (or equivalent experience)',
      'Strong communication skills in English and Chichewa',
      'Comfortable working with mobile money and basic digital tools',
      'Valid motorcycle or car licence is an advantage for field visits',
      'Customer-focused, honest, and organised',
    ],
  },
  {
    title: 'Station Supervisor',
    location: 'Lilongwe / Blantyre',
    type: 'Full-time',
    department: 'Operations',
    summary:
      'Lead day-to-day operations at a Haroti Gas station — supervising staff, ensuring safe refills, stock control, and excellent customer service.',
    responsibilities: [
      'Supervise daily station activities including refills, PAYC top-ups, and customer service',
      'Enforce LPG safety procedures and ensure equipment is inspected and maintained',
      'Manage stock levels, cylinder inventory, and daily cash/mobile-money reconciliation',
      'Train and support station attendants on Haroti standards and PAYC processes',
      'Prepare daily reports and escalate operational or safety issues promptly',
    ],
    requirements: [
      'Minimum MSCE; diploma in logistics, business, or engineering is an advantage',
      '2+ years supervisory experience in retail, fuel, or LPG/gas operations',
      'Understanding of basic LPG safety and handling (training provided)',
      'Strong leadership, honesty, and problem-solving skills',
      'Willingness to work six days per week including some weekends',
    ],
  },
];
