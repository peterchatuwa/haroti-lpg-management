# Haroti Gas Website - Project Status

**Reference**: HG-TOR-WEB-001 (Terms of Reference dated 5 August 2026)

## Project Overview

Corporate website for Haroti Holdings Limited (T/A Haroti Gas) - a Malawian energy company operating LPG bulk import, storage, and retail distribution with the innovative Pay-As-You-Cook (PAYC) programme.

## Current Status: Phase 1 - Foundation Complete ✅

### Completed

#### Technical Foundation
- [x] React + TypeScript + Vite setup
- [x] Tailwind CSS v3 for styling
- [x] React Router for navigation
- [x] Mobile-first responsive design system
- [x] Brand colors configured (Haroti Blue, Orange, Green)
- [x] Project builds successfully

#### Core Components
- [x] **Header Component**
  - Top bar with contact information
  - Main navigation (desktop & mobile)
  - Mobile hamburger menu
  - Sticky header with shadow
  - Franchise CTA button
  
- [x] **Footer Component**
  - Company information and tagline
  - Social media links (Facebook, Twitter, LinkedIn, Instagram)
  - Quick links navigation
  - Resources section
  - Contact information
  - Copyright and legal links

- [x] **Layout Component**
  - Consistent header/footer across all pages
  - Content area with proper spacing

#### Pages Implemented

##### Home Page ✅ (Complete)
Comprehensive landing page featuring:
- **Hero Section**: Value proposition with USSD/App download CTAs
- **Stats Section**: Key metrics (150K households, 8 stations, 100% clean)
- **Features Grid**: 6 feature cards
  - Pay-As-You-Cook (PAYC)
  - Nationwide Network
  - Environmental Impact
  - Women & Youth Empowerment
  - Digital Innovation
  - Safety & Quality
- **Franchise CTA**: Prominent call-to-action for franchise applicants
- **News Preview**: Latest 3 news items (placeholder)
- **Final CTA**: Get started section

##### Other Pages (Placeholders)
- [ ] About Us
- [ ] Products & PAYC
- [ ] Find a Station
- [ ] Franchise Opportunities
- [ ] Impact & ESG
- [ ] Investors & Partners
- [ ] News & Updates
- [ ] Careers
- [ ] Contact Us
- [ ] Legal (Privacy Policy, Terms of Use)

### Design Features

**Brand Identity**:
- Primary: Haroti Blue (#0047AB)
- Accent: Haroti Orange (#FF6B35)
- Success: Haroti Green (#28A745)
- Neutral: Haroti Gray (#6C757D)

**Typography**:
- Font: Inter (Google Fonts)
- Hierarchy: Clear heading sizes (4xl, 3xl, 2xl, xl)

**UI Elements**:
- Custom button styles (primary, secondary, outline)
- Smooth transitions and hover effects
- Consistent spacing and padding
- Shadow elevations for depth
- Responsive grid layouts

**Mobile Optimization**:
- Mobile-first design approach
- Hamburger menu for small screens
- Responsive grid (1/2/3/4 columns)
- Touch-friendly button sizes
- Optimized text sizes

### Tech Stack

**Frontend Framework**:
- React 19
- TypeScript 5.6
- Vite 8.2 (build tool)

**UI & Styling**:
- Tailwind CSS 3.4
- PostCSS
- Custom CSS utilities

**Routing & State**:
- React Router DOM 7.6
- React Query (TanStack Query) 5.71
- Axios 2.0 (HTTP client)

**Forms & Validation**:
- React Hook Form 7.56
- Zod 3.28 (schema validation)
- @hookform/resolvers

**Icons**:
- Lucide React 0.468

### Project Structure

```
website/
├── public/                 # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   └── layout/        # Layout components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Layout.tsx
│   ├── pages/             # Page components
│   │   └── HomePage.tsx
│   ├── hooks/             # Custom React hooks (empty)
│   ├── utils/             # Utility functions (empty)
│   ├── types/             # TypeScript types (empty)
│   ├── data/              # Static data (empty)
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html             # HTML template with meta tags
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Next Steps (Remaining Work)

### Phase 2: Core Pages (In Progress)
- [ ] About Us Page
  - Company history
  - Vision/mission/values
  - Leadership team
  - Haroti Gas story
- [ ] Products & PAYC Page
  - LPG product catalog (6kg, 9kg, 13kg, 19kg, 48kg)
  - PAYC starter kit details
  - Micro-installment model explanation
  - USSD/App/payment channels
  - Safety information
- [ ] Find a Station Page
  - Station locator (list/map view)
  - Filter by district/town
  - Station details (address, hours, contact)
  - Integration with backend station data

### Phase 3: Forms & Applications
- [ ] Franchise Opportunities Page
  - Franchise model overview
  - Women & youth-led programme
  - Eligibility criteria
  - Online application form
- [ ] Careers Page
  - Current vacancies list
  - Job descriptions
  - Online application/CV submission form
- [ ] Contact Us Page
  - Office address/location
  - Phone/email/social media
  - Contact enquiry form
  - Map integration

### Phase 4: Impact & Investment
- [ ] Impact & ESG Page
  - Environmental/social/governance impact
  - Headline Impact KPIs
  - Carbon-finance partnership (WESM)
  - SDG alignment
  - Optional: Public-facing dashboard
- [ ] Investors & Partners Page
  - Investment proposition summary
  - Key facts from Business Proposal
  - Secure contact channel for lenders/DFIs/carbon off-takers

### Phase 5: Content & Legal
- [ ] News & Updates Page
  - Blog-style chronological posts
  - Company announcements
  - Press mentions
  - Milestones
- [ ] Privacy Policy
  - Data protection commitments
  - ESMS Framework compliance
- [ ] Terms of Use
  - Website usage terms
  - Legal disclaimers

### Phase 6: Backend Integration
- [ ] Form Handlers
  - Franchise enquiry → Franchise Compliance Manager
  - Careers application → HR/Safeguarding Lead
  - Investor enquiry → CFO/General Manager
  - General contact → Info inbox
  - Secure data handling per ESMS
- [ ] API Integration
  - Connect to existing LPG management system
  - Station data (8 stations)
  - Product pricing
  - Stock availability
  - Customer portal authentication

### Phase 7: CMS & Admin
- [ ] Content Management System
  - Non-technical staff interface
  - Edit text and images
  - Add/update News posts
  - Update franchise/station listings
  - User guide documentation

### Phase 8: Technical Requirements
- [ ] Hosting Setup
  - Domain configuration (harotiholdingslimited.com)
  - SSL/HTTPS
  - DNS setup
- [ ] Security
  - Form security
  - OWASP Top 10 protection
  - Multi-factor authentication for CMS
- [ ] Analytics & SEO
  - Google Analytics integration
  - Meta tags
  - XML sitemap
  - Structured data
- [ ] Backups
  - Automated backups
  - Restore procedure documentation
- [ ] Testing
  - Cross-browser testing
  - Mobile device testing (Android/iOS)
  - Performance optimization
  - Low-bandwidth optimization

### Phase 9: Handover & Launch
- [ ] Technical Documentation
  - Hosting details
  - Domain/DNS configuration
  - Admin credentials (secure handover)
  - System architecture summary
- [ ] CMS Training
  - Train 2 designated staff members
  - User guide documentation
- [ ] Source Code Handover
  - Full code repository
  - Custom components documentation
- [ ] Go-Live
  - Production deployment
  - 30-day warranty period
  - Bug fixes

## Deliverables Progress

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Discovery & sitemap document | ✅ Complete | Structure confirmed per ToR |
| Wireframes & visual design mockups | ✅ Complete | Home page implemented |
| Functional website - all pages | 🏗️ In Progress | Home page done, 10+ remaining |
| CMS access & user guide | ⏳ Pending | Phase 7 |
| Technical documentation | ⏳ Pending | Phase 9 |
| Source code handover | ⏳ Pending | Phase 9 |
| 30-day post-launch warranty | ⏳ Pending | After launch |

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Targets

- First Contentful Paint: < 2s
- Time to Interactive: < 4s
- Lighthouse Score: > 90
- Mobile-friendly: Yes
- Low-bandwidth optimized: Yes

## Timeline

**Original Estimate**: 10 weeks
**Phase 1 Complete**: Week 1 (Foundation)
**Current**: Beginning Phase 2
**Estimated Completion**: Week 8-9 (UAT), Week 10 (Launch)

---

**Last Updated**: August 5, 2026
**Developer**: IT Developer
**Client**: Haroti Holdings Limited (T/A Haroti Gas)
