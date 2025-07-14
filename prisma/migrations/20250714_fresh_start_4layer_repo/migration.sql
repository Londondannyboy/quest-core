-- Fresh Start: 4-Layer Quest Repo Architecture Migration
-- Drop existing tables and create comprehensive entity-centric schema

-- Drop existing tables (fresh start)
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Skill" CASCADE;
DROP TABLE IF EXISTS "TrinityStatement" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Core Entity Tables
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  website VARCHAR UNIQUE,
  domain VARCHAR, -- extracted from website
  industry VARCHAR,
  size_range VARCHAR,
  logo_url VARCHAR,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  category VARCHAR,
  subcategory VARCHAR,
  difficulty_level VARCHAR,
  market_demand_score INTEGER,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE educational_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  website VARCHAR,
  type VARCHAR, -- university, college, bootcamp, online
  country VARCHAR,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  issuing_organization VARCHAR,
  website VARCHAR,
  category VARCHAR,
  validity_period INTEGER, -- months
  description TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Professional Relationship Tables (Neo4j Ready)
CREATE TABLE professional_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR,
  linkedin_url VARCHAR,
  current_company_id UUID REFERENCES companies(id),
  current_title VARCHAR,
  phone VARCHAR,
  notes TEXT,
  relationship_strength INTEGER, -- 1-5 scale
  last_interaction_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Surface Repo Tables (Public Profile)
CREATE TABLE surface_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  username VARCHAR UNIQUE,
  public_bio TEXT,
  headline VARCHAR,
  location VARCHAR,
  website VARCHAR,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  title VARCHAR NOT NULL,
  employment_type VARCHAR, -- full-time, part-time, contract
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  achievements TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  skill_id UUID REFERENCES skills(id),
  proficiency_level VARCHAR, -- beginner, intermediate, advanced, expert
  years_of_experience INTEGER,
  is_showcase BOOLEAN DEFAULT false, -- show on public profile
  endorsements_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

CREATE TABLE user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  institution_id UUID REFERENCES educational_institutions(id),
  degree VARCHAR,
  field_of_study VARCHAR,
  start_date DATE,
  end_date DATE,
  gpa VARCHAR,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  certification_id UUID REFERENCES certifications(id),
  issued_date DATE,
  expiry_date DATE,
  credential_id VARCHAR,
  credential_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Working Repo Tables (Selective Portfolio)
CREATE TABLE working_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  title VARCHAR NOT NULL,
  description TEXT,
  banner_image VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE working_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  working_profile_id UUID REFERENCES working_profiles(id),
  title VARCHAR NOT NULL,
  company_id UUID REFERENCES companies(id),
  description TEXT,
  challenge TEXT,
  solution TEXT,
  impact TEXT,
  technologies JSONB,
  start_date DATE,
  end_date DATE,
  project_type VARCHAR, -- internal, client, personal, open-source
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE working_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  working_profile_id UUID REFERENCES working_profiles(id),
  title VARCHAR NOT NULL,
  description TEXT,
  context TEXT,
  quantified_impact JSONB, -- metrics, numbers, percentages
  skills_demonstrated JSONB, -- skill IDs and how they were used
  recognition TEXT,
  date_achieved DATE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE working_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  working_profile_id UUID REFERENCES working_profiles(id),
  project_id UUID REFERENCES working_projects(id),
  achievement_id UUID REFERENCES working_achievements(id),
  media_type VARCHAR, -- video, image, document, presentation, code
  title VARCHAR,
  description TEXT,
  file_url VARCHAR,
  file_size INTEGER,
  mime_type VARCHAR,
  thumbnail_url VARCHAR,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE working_access_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_profile_id UUID REFERENCES working_profiles(id),
  granted_to_email VARCHAR,
  granted_to_name VARCHAR,
  access_level VARCHAR, -- recruiter, collaborator, mentor, full
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT false,
  access_token VARCHAR UNIQUE -- for secure access without signup
);

CREATE TABLE working_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_profile_id UUID REFERENCES working_profiles(id),
  accessed_by_email VARCHAR,
  accessed_by_name VARCHAR,
  access_token VARCHAR,
  accessed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR,
  user_agent TEXT,
  pages_viewed JSONB -- track what sections were viewed
);

-- Personal Repo Tables (Private Development)
CREATE TABLE personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  goal_type VARCHAR, -- career, skill, personal
  title VARCHAR,
  description TEXT,
  target_date DATE,
  progress_percentage INTEGER,
  okrs JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE personal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  note_type VARCHAR,
  content TEXT,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deep Repo Tables (System-managed)
CREATE TABLE deep_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  insight_type VARCHAR,
  ai_analysis JSONB,
  confidence_score FLOAT,
  generated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trinity_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  quest_analysis JSONB,
  service_analysis JSONB,
  pledge_analysis JSONB,
  coherence_score FLOAT,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Professional Relationship Tables
CREATE TABLE work_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  work_experience_id UUID REFERENCES work_experiences(id),
  contact_id UUID REFERENCES professional_contacts(id),
  relationship_type VARCHAR, -- manager, direct_report, peer, client, vendor, mentor
  relationship_description TEXT,
  collaboration_context TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES working_projects(id),
  contact_id UUID REFERENCES professional_contacts(id),
  relationship_type VARCHAR, -- project_manager, team_member, client, stakeholder, vendor
  role_description TEXT,
  collaboration_details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE education_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  education_id UUID REFERENCES user_education(id),
  contact_id UUID REFERENCES professional_contacts(id),
  relationship_type VARCHAR, -- professor, mentor, classmate, advisor
  subject_area VARCHAR,
  interaction_context TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice Coaching Tables (Enhanced)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR UNIQUE,
  type VARCHAR, -- voice, text
  summary TEXT,
  emotions JSONB,
  repo_context JSONB, -- which repo layers were accessed
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR, -- user, assistant
  content TEXT,
  emotions JSONB,
  repo_references JSONB, -- which repo data was referenced
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_surface_profiles_username ON surface_profiles(username);
CREATE INDEX idx_surface_profiles_user_id ON surface_profiles(user_id);
CREATE INDEX idx_working_profiles_user_id ON working_profiles(user_id);
CREATE INDEX idx_work_experiences_user_id ON work_experiences(user_id);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_working_access_permissions_token ON working_access_permissions(access_token);
CREATE INDEX idx_professional_contacts_created_by ON professional_contacts(created_by);
CREATE INDEX idx_trinity_core_user_id ON trinity_core(user_id);