# Prompt Library - Product Requirements Document (PRD)

## Overview

A lightweight web application for storing, organizing, and managing prompt templates in the cloud with seamless access across devices.

---

## 1. Product Vision

**Problem**: Users currently store prompts in scattered notes, text files, or documents without easy search, organization, or cloud sync.

**Solution**: A dedicated prompt library with folder organization, cloud storage, and fast retrieval - accessible from anywhere.

**Target User**: Knowledge workers, developers, content creators, and AI power users who frequently reuse prompts.

---

## 2. Core Features (MVP - V1)

### 2.1 Authentication

- Email/password sign up and login (Supabase Auth)
- Session persistence
- Password reset flow

### 2.2 Folder Management

- Create folders (flat structure in V1)
- Rename folders
- Delete folders (with confirmation)
- Visual distinction (color picker or icon selector - optional)

### 2.3 Prompt Management

- Create new prompt within a folder
- Edit existing prompt
- Delete prompt (with confirmation)
- View prompt details
- Move prompt between folders (drag-drop or dropdown)

### 2.4 Prompt Fields

```
- Title (required, max 200 chars)
- Content (required, textarea, no limit)
- Tags (optional, comma-separated)
- Folder assignment (required)
- Timestamps (auto: created_at, updated_at)
```

### 2.5 Search & Discovery

- Full-text search across title and content
- Filter by folder
- Filter by tags
- Search results show folder context

### 2.6 Quick Actions

- Copy prompt to clipboard (one-click)
- Keyboard shortcuts:
  - `Cmd/Ctrl + K` - Quick search/command palette
  - `Cmd/Ctrl + N` - New prompt
  - `Cmd/Ctrl + /` - Focus search

### 2.7 Data Portability

- Export all prompts as JSON
- Import prompts from JSON

---

## 3. Technical Specifications

### 3.1 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **State Management**: React hooks + Server Components

### 3.2 Database Schema

```sql
-- Users (handled by Supabase Auth)

-- Folders
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[], -- array of strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX idx_folders_user_id ON folders(user_id);

-- Full-text search
CREATE INDEX idx_prompts_search ON prompts USING gin(to_tsvector('english', title || ' ' || content));

-- Row Level Security (RLS)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own folders"
  ON folders FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own prompts"
  ON prompts FOR ALL
  USING (auth.uid() = user_id);
```

### 3.3 API Routes (Next.js Server Actions)

- `createFolder(name, color?)`
- `updateFolder(id, name, color?)`
- `deleteFolder(id)`
- `createPrompt(folderId, title, content, tags?)`
- `updatePrompt(id, updates)`
- `deletePrompt(id)`
- `searchPrompts(query)`
- `exportPrompts()`
- `importPrompts(jsonData)`

---

## 4. User Interface

### 4.1 Layout (3-Column)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Prompt Library           [User Menu] [Settings] │
├───────────┬─────────────────┬───────────────────────────┤
│           │                 │                           │
│  Folders  │  Prompt List    │   Prompt Editor/Viewer    │
│  Sidebar  │                 │                           │
│           │  [Search bar]   │   Title: ____________     │
│  📁 Work  │                 │                           │
│  📁 Code  │  ✓ Prompt 1     │   Content:                │
│  📁 Sales │    Prompt 2     │   ┌──────────────────┐   │
│           │    Prompt 3     │   │                  │   │
│  [+ New]  │                 │   │                  │   │
│           │  [+ New Prompt] │   │                  │   │
│           │                 │   └──────────────────┘   │
│           │                 │                           │
│           │                 │   Tags: ___________       │
│           │                 │                           │
│           │                 │   [Copy] [Save] [Delete]  │
└───────────┴─────────────────┴───────────────────────────┘
```

### 4.2 Key UI Components

- **Folder Sidebar**: Collapsible list, color dots, hover actions
- **Prompt List**: Card/list view toggle, search bar at top
- **Prompt Editor**: Auto-save (debounced), character count
- **Command Palette**: Cmd+K overlay for quick navigation
- **Empty States**: Friendly prompts when folders/prompts are empty

### 4.3 Responsive Design

- **Desktop**: 3-column layout
- **Tablet**: 2-column (sidebar toggleable)
- **Mobile**: Single column with bottom nav

---

## 5. User Flows

### 5.1 First-Time User

1. Sign up with email/password
2. See welcome screen with "Create your first folder" CTA
3. Create folder (e.g., "Work")
4. Prompted to add first prompt
5. See tutorial tooltips on key features

### 5.2 Daily Usage

1. Login → lands on last viewed folder/prompt
2. Use Cmd+K to quick-search for prompt
3. Click prompt → auto-copies to clipboard
4. Edit prompt → auto-saves after 1s debounce

### 5.3 Organization

1. Create new folder from sidebar
2. Create prompt, assign to folder
3. Drag prompt to different folder OR use dropdown
4. Use tags for cross-folder categorization

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Initial page load: < 2 seconds
- Search results: < 500ms
- Auto-save debounce: 1 second

### 6.2 Security

- All data scoped to authenticated user (RLS)
- HTTPS only
- XSS protection (sanitize inputs)
- Rate limiting on API routes

### 6.3 Accessibility

- Keyboard navigation for all features
- ARIA labels on interactive elements
- Color contrast ratio ≥ 4.5:1
- Screen reader compatible

### 6.4 Data Integrity

- Soft deletes with confirmation modals
- Auto-save prevents data loss
- Export functionality for backups

---

## 7. Out of Scope (V1)

### Future Features (V2+)

- **Nested folders** (parent_folder_id)
- **Sharing & collaboration** (folder_permissions table)
- **Version history** (prompt_versions table)
- **Variables/templates** ({{variable}} syntax support)
- **AI-powered search** (semantic search)
- **Browser extension** (quick capture from anywhere)
- **Public prompt marketplace**
- **Team workspaces**
- **Advanced permissions** (viewer, editor, admin)
- **Activity log** (audit trail)
- **Mobile apps** (iOS/Android)
- **Offline support** (PWA)

---

## 8. Success Metrics

### V1 Goals

- **Adoption**: 10 active users within first week
- **Engagement**: Average user creates 10+ prompts
- **Performance**: 95% of searches < 500ms
- **Reliability**: 99.5% uptime

### User Feedback Goals

- Ease of use: 4.5/5 rating
- Feature completeness (V1): 4/5 rating
- "Would recommend": 80%+ yes

---

## 9. Development Milestones

### Phase 1: Foundation (Day 1)

- [ ] Project setup (Next.js + Supabase)
- [ ] Database schema + RLS policies
- [ ] Auth pages (login, signup)
- [ ] Basic layout (3-column)

### Phase 2: Core Features (Day 1-2)

- [ ] Folder CRUD
- [ ] Prompt CRUD
- [ ] Search functionality
- [ ] Copy to clipboard

### Phase 3: Polish (Day 2-3)

- [ ] Keyboard shortcuts
- [ ] Command palette
- [ ] Import/export
- [ ] Empty states
- [ ] Loading states
- [ ] Error handling

### Phase 4: Deploy (Day 3)

- [ ] Vercel deployment
- [ ] Domain setup (optional)
- [ ] Basic analytics (Vercel Analytics)
- [ ] User testing

---

## 10. Open Questions

1. **Pricing model**: Free tier limits? Paid features?
2. **Public prompts**: Allow users to mark prompts as public/discoverable?
3. **Markdown support**: Should content support markdown formatting?
4. **AI integration**: Auto-tag prompts? Suggest improvements?
5. **Collaboration**: Priority for V2 or V3?

---

## Appendix: Tech Stack Justification

**Next.js 14**: Server components reduce client JS, App Router is modern standard
**Supabase**: Auth + DB + real-time in one, generous free tier, excellent DX
**Tailwind + Shadcn**: Fast styling, accessible components out-of-box
**Vercel**: Zero-config deployment, integrates seamlessly with Next.js
**TypeScript**: Type safety prevents bugs, better DX with autocomplete

---

**Document Owner**: Syd  
**Last Updated**: 2026-02-15  
**Version**: 1.0 (MVP Scope)
