

-- Opportunity 1: Google Internship (Active, Future Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000001',
  'https://careers.google.com/jobs/test-internship-1',
  'Google',
  'Software Engineering Intern',
  'internship',
  'Software Engineering',
  '["Computer Science", "Software Engineering", "Information Technology"]'::jsonb,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'Currently pursuing a BS/MS in Computer Science or related field. Strong programming skills in Java, C++, or Python. Understanding of data structures and algorithms.',
  'Mountain View, CA',
  'Join our team to work on cutting-edge technology that impacts billions of users worldwide. You will collaborate with experienced engineers on real projects.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://careers.google.com/jobs/test-internship-1');

-- Opportunity 2: Microsoft Full-time (Active, Future Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000002',
  'https://careers.microsoft.com/jobs/test-fulltime-1',
  'Microsoft',
  'Software Engineer - New Grad',
  'full_time',
  'Software Engineering',
  '["Computer Science", "Software Engineering"]'::jsonb,
  (CURRENT_DATE + INTERVAL '45 days')::date,
  'Bachelor''s degree in Computer Science or related field. Experience with C#, .NET, or Azure preferred.',
  'Seattle, WA',
  'Build innovative software solutions that empower people and organizations worldwide. Work on products used by millions.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://careers.microsoft.com/jobs/test-fulltime-1');

-- Opportunity 3: Meta Research Position (Active, Future Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000003',
  'https://www.meta.com/careers/jobs/test-research-1',
  'Meta',
  'Research Scientist Intern',
  'research',
  'Research',
  '["Computer Science", "Data Science", "Machine Learning"]'::jsonb,
  (CURRENT_DATE + INTERVAL '60 days')::date,
  'Pursuing PhD in Computer Science, Machine Learning, or related field. Strong research background in AI/ML.',
  'Menlo Park, CA',
  'Work on cutting-edge AI research projects. Collaborate with world-class researchers on problems that matter.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://www.meta.com/careers/jobs/test-research-1');

-- Opportunity 4: Fellowship (Active, Close Deadline - 5 days)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000004',
  'https://example.com/fellowship/test-1',
  'Tech Fellowship Program',
  'Tech Innovation Fellowship',
  'fellowship',
  'Product Management',
  '["Computer Science", "Business", "Product Management"]'::jsonb,
  (CURRENT_DATE + INTERVAL '5 days')::date,
  'Recent graduate or current student. Passion for technology and innovation. Strong communication skills.',
  'Remote',
  'Join a prestigious fellowship program focused on tech innovation. Work with startups and build your network.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/fellowship/test-1');

-- Opportunity 5: Scholarship (Active, Future Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000005',
  'https://example.com/scholarship/test-1',
  'Tech Scholarship Foundation',
  'STEM Excellence Scholarship',
  'scholarship',
  NULL,
  '["Computer Science", "Engineering", "Mathematics"]'::jsonb,
  (CURRENT_DATE + INTERVAL '90 days')::date,
  'Must be enrolled in a STEM program. Minimum 3.5 GPA. Submit essay and transcripts.',
  'N/A',
  'Annual scholarship program supporting outstanding STEM students. $10,000 award for tuition and expenses.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/scholarship/test-1');

-- Opportunity 6: Data Science Internship (Active, No Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000006',
  'https://example.com/jobs/data-science-intern',
  'DataCorp',
  'Data Science Intern',
  'internship',
  'Data Science',
  '["Data Science", "Statistics", "Computer Science"]'::jsonb,
  NULL,
  'Strong background in statistics and programming. Experience with Python, R, or SQL preferred.',
  'New York, NY',
  'Work with large datasets and build machine learning models. Gain experience in data analysis and visualization.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/jobs/data-science-intern');

-- Opportunity 7: Product Management Full-time (Active, Past Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000007',
  'https://example.com/jobs/pm-fulltime',
  'StartupCo',
  'Product Manager',
  'full_time',
  'Product Management',
  '["Business", "Computer Science", "Product Management"]'::jsonb,
  (CURRENT_DATE - INTERVAL '10 days')::date,
  '3+ years of product management experience. Technical background preferred.',
  'San Francisco, CA',
  'Lead product development for innovative SaaS platform. Work with engineering and design teams.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/jobs/pm-fulltime');

-- Opportunity 8: Expired Opportunity (For testing expired status)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status, expired_at
)
SELECT 
  '10000000-0000-0000-0000-000000000008',
  'https://example.com/jobs/expired-1',
  'OldCompany',
  'Software Engineer',
  'full_time',
  'Software Engineering',
  '["Computer Science"]'::jsonb,
  (CURRENT_DATE - INTERVAL '30 days')::date,
  'Bachelor''s degree required.',
  'Austin, TX',
  'This opportunity has expired.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'expired',
  (CURRENT_DATE - INTERVAL '30 days')::timestamp
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/jobs/expired-1');

-- Opportunity 9: Research Position (Active, Medium Deadline)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000009',
  'https://example.com/research/ai-research',
  'AI Research Lab',
  'AI Research Assistant',
  'research',
  'Research',
  '["Computer Science", "Artificial Intelligence", "Machine Learning"]'::jsonb,
  (CURRENT_DATE + INTERVAL '20 days')::date,
  'Graduate student in AI/ML. Strong publication record preferred.',
  'Boston, MA',
  'Assist with cutting-edge AI research projects. Opportunity to publish and present findings.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/research/ai-research');

-- Opportunity 10: Fellowship (Active, Very Close Deadline - 2 days)
INSERT INTO opportunities (
  id, url, company_name, job_title, opportunity_type, role_type,
  relevant_majors, deadline, requirements, location, description,
  submitted_by, status
)
SELECT 
  '10000000-0000-0000-0000-000000000010',
  'https://example.com/fellowship/leadership',
  'Leadership Fellowship',
  'Tech Leadership Fellowship',
  'fellowship',
  'Leadership',
  '["Business", "Computer Science", "Engineering"]'::jsonb,
  (CURRENT_DATE + INTERVAL '2 days')::date,
  'Demonstrated leadership experience. Interest in technology and innovation.',
  'Chicago, IL',
  'Develop leadership skills while working on tech projects. Network with industry leaders.',
  (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE url = 'https://example.com/fellowship/leadership');