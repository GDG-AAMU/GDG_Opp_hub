# GDG Opportunities Hub

> A modern student-shared platform for discovering and submitting job opportunities, internships, research positions, fellowships, and scholarships.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange)](https://ai.google.dev/)

## 🎯 Project Overview

The GDG Opportunities Hub is a comprehensive platform where GDG club members can discover and submit job opportunities. The platform leverages AI (Google Gemini) to automatically parse job postings and extract relevant information, making it easy for students to find opportunities sorted by deadline and filtered by type.

### Key Features

- ✅ **AI-Powered Link Parsing** - Automatically extract job details from URLs
- ✅ **Multiple Opportunity Types** - Internships, Full-time, Research, Fellowships, Scholarships
- ✅ **Smart Organization** - Sort by deadline, filter by type
- ✅ **User Submissions** - Students can contribute opportunities
- ✅ **Auto-Expiration** - Past deadlines automatically removed
- 🚧 **Resume Review** - Coming soon (AI-powered resume analysis)

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Service**: Google Gemini API
- **Web Scraping**: Cheerio
- **Cron Jobs**: Vercel Cron

### Hosting
- **Platform**: Vercel (free tier)
- **Database**: Supabase (free tier)
- **Cost**: $0/month (within free tier limits)

## 📁 Project Structure

```
gdg-opportunities-platform/
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── opportunities/
│   │   │   │   └── [id]/
│   │   │   └── page.tsx        # Homepage
│   │   ├── admin/              # Admin panel
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   ├── opportunities/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── submit/route.ts
│   │   │   └── parse/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/               # Auth components
│   │   ├── opportunities/     # Opportunity components
│   │   ├── admin/              # Admin components
│   │   └── layout/             # Layout components
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   ├── ai/                 # Gemini integration
│   │   └── utils.ts
│   ├── types/                  # TypeScript types
│   ├── hooks/                  # Custom React hooks
│   └── styles/                 # Global styles
│
├── backend/                     # Backend services
│   ├── services/
│   │   ├── ai-parser.ts
│   │   ├── web-scraper.ts
│   │   └── opportunity-service.ts
│   └── utils/
│
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql                # Seed data
│
└── README.md
```


## ✨ Core Features

### 1. Authentication
- Email/password sign up and sign in
- Session management
- Protected routes
- Admin role support

### 2. Homepage
- Modern, eye-catching hero section
- Statistics dashboard
- Quick filter buttons
- Featured opportunities carousel
- Smooth animations and gradients

### 3. Dashboard
- List all opportunities
- Filter by type (Internship, Full-time, Research, Fellowship, Scholarship)
- Sort by deadline (closest first)
- Opportunity cards with key information
- Submit new opportunity button

### 4. Link Submission
- Modal-based submission form
- URL input with validation
- AI-powered parsing (Gemini)
- Automatic data extraction:
  - Company name
  - Job title
  - Deadline
  - Requirements
  - Role type
  - Relevant majors
  - Location

### 5. Opportunity Details
- Full job description
- Requirements and qualifications
- Deadline (highlighted if approaching)
- Apply Now button (external link)
- Review Resume button (Coming Soon)
- Admin edit/delete controls

### 6. Admin Panel
- View all opportunities
- Edit opportunity details
- Delete opportunities
- Manual opportunity addition
- Statistics dashboard

### 7. Auto-Expire System
- Daily cron job (Vercel Cron)
- Automatically marks expired opportunities
- Filters out expired items from main view

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/session` - Get current session

### Opportunities
- `GET /api/opportunities` - List all (with filters, sorting)
  - Query params: `type`, `status`, `sort`, `limit`, `offset`
- `GET /api/opportunities/[id]` - Get single opportunity
- `POST /api/opportunities/submit` - Submit new opportunity with AI parsing
- `PUT /api/opportunities/[id]` - Update opportunity (admin only)
- `DELETE /api/opportunities/[id]` - Delete opportunity (admin only)

## 🤖 AI Integration

### Gemini API Usage
The platform uses Google Gemini API to parse job postings and extract structured data:

```typescript
// Example prompt structure
Extract the following information from this job posting:
- Company name
- Job title
- Opportunity type
- Role type
- Relevant majors
- Deadline
- Requirements
- Location
- Description
```

### Web Scraping Flow
1. Fetch URL content
2. Parse HTML with Cheerio
3. Extract main content
4. Send to Gemini API
5. Parse and validate response
6. Save to database

## 🎨 UI/UX Design

### Design Principles
- **Modern gradients** - Purple-blue color scheme
- **Clean typography** - Inter or Poppins fonts
- **Generous spacing** - Easy to scan
- **Smooth animations** - Professional feel
- **Mobile-first** - Responsive design
- **Accessible** - WCAG compliant

### Key Pages

**Homepage:**
- Hero section with value proposition
- Statistics and trust indicators
- Quick navigation

**Dashboard:**
- Clean, organized layout
- Prominent filter/sort controls
- Easy-to-scan opportunity cards

**Details Page:**
- Well-structured information
- Clear call-to-action
- Related opportunities (future)

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Project setup (Next.js, Supabase)
- [ ] Database schema and migrations
- [ ] Authentication system
- [ ] Basic UI layout and navigation

### Phase 2: Core Features (Week 2)
- [ ] Link submission modal
- [ ] AI parsing integration (Gemini)
- [ ] Opportunity listing
- [ ] Filtering and sorting
- [ ] Opportunity details page

### Phase 3: Admin & Polish (Week 3)
- [ ] Admin panel
- [ ] Auto-expire cron job
- [ ] Error handling
- [ ] Loading states
- [ ] Form validation
- [ ] Testing

### Phase 4: Launch Prep (Week 4)
- [ ] Seed initial data
- [ ] Deploy to Vercel
- [ ] Documentation
- [ ] User onboarding flow
- [ ] Launch to club members

## 🚧 Future Enhancements

- [ ] Resume review feature (AI-powered)
- [ ] Comments/notes per opportunity
- [ ] Major-based filtering
- [ ] Role-based filtering
- [ ] Search functionality
- [ ] Email notifications
- [ ] User profiles
- [ ] Application tracking
- [ ] Analytics dashboard

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GDG-AAMU/GDG_Opp_hub.git
   cd GDG_Opp_hub
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run migrations from `supabase/migrations/`
   - Configure authentication

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini API
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## 🤝 Contributing

This is a GDG AAMU club project. Contributions are welcome from club members.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is for internal GDG AAMU club use.

## 📞 Contact

For questions or support, contact the GDG AAMU leadership team.

---

**Built with ❤️ by GDG AAMU**
