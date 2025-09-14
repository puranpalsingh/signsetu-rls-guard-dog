# 🐕 RLS Guard Dog

A comprehensive school management system built with **Next.js**, **Supabase**, and **MongoDB Atlas** featuring Row-Level Security (RLS) policies for role-based access control.

## 🎯 Features

### **Role-Based Dashboard Views**
- **Students**: View only their own academic progress and scores
- **Teachers**: Manage their classrooms, edit student progress, and calculate class averages
- **Head Teachers**: Oversee all school operations and monitor complete student performance

### **Real-Time Functionality**
- ✅ **Real-time score editing** with instant Supabase Cloud updates
- ✅ **Class average calculation** with MongoDB Atlas integration
- ✅ **Interactive teacher selection** to view students by teacher
- ✅ **Protected routes** with authentication and authorization

### **Technical Features**
- 🔐 **Row-Level Security (RLS)** policies for data access control
- 🚀 **Edge Functions** for serverless MongoDB operations
- 📊 **MongoDB Atlas** for analytics and reporting data
- 🎨 **Modern UI** with Tailwind CSS and shadcn/ui components
- 📱 **Responsive design** for all device types

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- MongoDB Atlas account

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd signsetu-rls-guard-dog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   MONGODB_URI= your_mongodb_url
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 Demo Credentials

### **Students**
- **Email**: `student@test.com` | **Password**: `password123`
- **Email**: `student2@test.com` | **Password**: `password123`

### **Teachers**
- **Email**: `teacher@test.com` | **Password**: `password123`
- **Email**: `teacher2@test.com` | **Password**: `password123`

### **Head Teachers**
- **Email**: `headteacher@test.com` | **Password**: `password123`

## 🏗️ Architecture

### **Database Schema**
```
schools (id, name)
├── profile (id, role, school_id, full_name)
├── classroom (id, name, school_id, teacher_id)
└── progress (id, student_id, classroom_id, score, subject)
```

### **RLS Policies**
- **Students**: Can only access their own progress records
- **Teachers**: Can access records in their assigned classrooms
- **Head Teachers**: Can access all records within their school

### **Tech Stack**
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Analytics**: MongoDB Atlas
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth

## 📱 User Interface

### **Dashboard Views**

#### **Student Dashboard**
- Personal academic progress table
- Subject-wise scores with performance badges
- Real-time score updates

#### **Teacher Dashboard**
- Classroom management interface
- Student progress editing capabilities
- Class average calculation with MongoDB integration
- Interactive classroom selection

#### **Head Teacher Dashboard**
- Complete school overview
- Teaching staff management
- All student progress monitoring
- School-wide statistics and metrics

## 🔧 API Endpoints

### **Local API Routes**
- `POST /api/calculate-class-average-local` - Calculate class averages with MongoDB integration

### **Supabase Edge Functions**
- `POST /functions/v1/calculate-class-average` - Serverless class average calculation

## 🚀 Deployment

### **1. Deploy Supabase Edge Function**
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Function
supabase functions deploy calculate-class-average
```

### **2. Set Environment Variables**
In Supabase Dashboard → Edge Functions:
- **Key**: `MONGODB_URI`
- **Value**: `mongodb_url`

### **3. Deploy Next.js App**
Deploy to your preferred platform:
- **Vercel**: Connect GitHub repo
- **Netlify**: Connect GitHub repo
- **Railway**: Connect GitHub repo

### **4. Configure RLS Policies**
In Supabase Dashboard → Authentication → Policies:
- Create policies for students, teachers, and head teachers
- Ensure proper data access control

## 📊 MongoDB Atlas Integration

### **Data Storage**
Class averages are stored in MongoDB Atlas:
```json
{
  "classroom_id": "uuid",
  "average_score": 85.5,
  "last_calculated": "2024-01-15T10:30:00Z"
}
```

### **MongoDB Compass Connection**
```
mongodb_url
```

## 🛠️ Development

### **Project Structure**
```
├── app/
│   ├── dashboard/          # Main dashboard page
│   ├── teacher/           # Teacher portal
│   ├── login/             # Authentication
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   └── ThemeToggle.tsx    # Theme switcher
├── context/
│   ├── AuthContext.tsx    # Authentication context
│   └── ThemeContext.tsx   # Theme context
├── lib/
│   ├── supabaseClient.ts  # Supabase configuration
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── supabase/
    ├── functions/         # Edge Functions
    └── migrations/        # Database migrations
```

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🔒 Security Features

- **Row-Level Security (RLS)** policies in Supabase
- **JWT-based authentication** with Supabase Auth
- **Role-based access control** for all data operations
- **Protected API routes** with authentication checks
- **Environment variable protection** for sensitive data

## 📈 Performance

- **Server-side rendering** with Next.js
- **Edge Functions** for serverless operations
- **Optimized database queries** with proper indexing
- **Real-time updates** with Supabase subscriptions
- **Responsive design** for optimal mobile experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


##  Acknowledgments

- **Supabase** for backend infrastructure
- **MongoDB Atlas** for analytics storage
- **shadcn/ui** for beautiful UI components
- **Next.js** for the React framework
- **Tailwind CSS** for styling

---

**RLS Guard Dog** - Secure, scalable, and user-friendly school management system! 🐕🎓
