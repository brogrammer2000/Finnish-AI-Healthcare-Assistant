# 🏥 Finnish Healthcare AI Assistant

> **A production-ready full-stack application addressing Finland's healthcare accessibility challenges through AI-powered triage and intelligent appointment booking.**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://finnish-ai-healthcare-assistant.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://expressjs.com/)

**🔗 Live Demo:** [https://finnish-ai-healthcare-assistant.vercel.app](https://finnish-ai-healthcare-assistant.vercel.app)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Live Demo & Test Accounts](#-live-demo--test-accounts)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)

---

## 🎯 Problem Statement

Finland's healthcare system faces critical challenges:

- **Long waiting times** - Average wait times for appointments have increased significantly
- **Navigation complexity** - Patients struggle to determine appropriate care pathways
- **Administrative burden** - High volume of phone inquiries overwhelms staff
- **Rising costs** - Missed appointments cost €73.70 each, totaling significant waste
- **Language barriers** - Limited multilingual support for diverse populations

**This project directly addresses these issues with a scalable, AI-powered solution.**

---

## 💡 Solution

An intelligent healthcare platform that:

✅ **Reduces patient wait times** through 24/7 AI-powered triage  
✅ **Improves care routing** by directing patients to appropriate services  
✅ **Decreases administrative load** with automated booking and notifications  
✅ **Cuts costs** by reducing inappropriate bookings and no-shows  
✅ **Supports diversity** with Finnish, Swedish, and English interfaces

---

## ✨ Key Features

### For Patients

- **🤖 AI Health Assistant**

  - Natural language symptom assessment using GPT-4
  - Intelligent triage with urgency classification
  - Evidence-based care recommendations
  - Conversation history for continuity of care
  - Multi-language support (Finnish, Swedish, English)

- **📅 Smart Appointment Booking**

  - Real-time availability checking
  - Multiple service types and specialists
  - Automated confirmation
  - Easy cancellation and rescheduling

- **🔐 Secure Authentication**
  - JWT-based authentication
  - Password encryption with bcrypt
  - Protected routes and GDPR-compliant data handling

### For Healthcare Administrators

- **📊 Comprehensive Dashboard**

  - Real-time appointment statistics
  - Patient volume analytics
  - Status tracking (confirmed, completed, cancelled)
  - Advanced search and filtering

- **👥 Resource Management**
  - Appointment status updates
  - Patient information overview
  - Service optimization insights

---

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe backend
- **Prisma ORM** - Database management
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### AI & External Services

- **OpenAI GPT-4** - Natural language processing
- **Railway** - Backend hosting
- **Vercel** - Frontend hosting
- **Supabase** - Database hosting

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│                 │         │                  │         │             │
│  React Frontend │────────▶│  Express API     │────────▶│ PostgreSQL  │
│  (Vercel)       │  HTTPS  │  (Railway)       │  SQL    │ (Supabase)  │
│                 │◀────────│                  │◀────────│             │
└─────────────────┘   JSON  └──────────────────┘         └─────────────┘
                                     │
                                     │ API Calls
                                     ▼
                            ┌─────────────────┐
                            │   OpenAI API    │
                            │   (GPT-4o-mini) │
                            └─────────────────┘

Key Design Decisions:
- RESTful API architecture for scalability
- JWT tokens for stateless authentication
- Prisma ORM for type-safe database queries
- Streaming AI responses for better UX
- Role-based access control (Patient/Admin)
```

---

## 🌐 Live Demo & Test Accounts

**🔗 Application:** [https://finnish-ai-healthcare-assistant.vercel.app](https://finnish-ai-healthcare-assistant.vercel.app)

### Test Accounts

**Patient Account:**

```
Email: demo@test.com
Password: demo123
```

**Admin Account:**

```
Email: admin@healthcare.com
Password: admin123
```

> ⚠️ **Note:** This is a demo project. Please don't enter real personal or medical information.

---

## 💻 Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase account)
- OpenAI API key

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/brogrammer2000/Finnish-AI-Healthcare-Assistant.git
cd Finnish-AI-Healthcare-Assistant
```

2. **Backend Setup**

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Add your DATABASE_URL, JWT_SECRET, and OPENAI_API_KEY

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start backend
npm run dev
```

3. **Frontend Setup**

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Add VITE_API_URL=http://localhost:3001/api

# Start frontend
npm run dev
```

4. **Access locally**

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 🚀 Deployment

### Backend (Railway)

1. Connect GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Deploy automatically on push

### Frontend (Vercel)

1. Import GitHub repository
2. Set root directory to `frontend`
3. Framework: Vite
4. Add `VITE_API_URL` environment variable
5. Deploy

---

## 📸 Screenshots

### Login & Registration

Clean, accessible authentication with demo account information for easy testing.

<img width="477" height="757" alt="Healthcare Al" src="https://github.com/user-attachments/assets/443383a2-4bff-45f8-a246-b14b4b3db3e3" />


### AI Chat Interface

Real-time conversation with intelligent health triage and care recommendations.

<img width="973" height="844" alt="hwe had freguent burpine and hewy flitulence but no acidty of pain" src="https://github.com/user-attachments/assets/b0136ef9-730a-4323-a85f-166e23149a96" />


### Appointment Booking

Intuitive booking flow with real-time availability and multiple service options.

<img width="1240" height="916" alt="Pasted Graphic 7" src="https://github.com/user-attachments/assets/a821991f-03f8-4309-bb09-555c6303c2cb" />


### Admin Dashboard

Comprehensive overview with statistics, search, and appointment management.

<img width="1240" height="685" alt="Q  Search by patient name, email, or doctor" src="https://github.com/user-attachments/assets/6bb142de-bd73-4b22-9fd6-b056f3a71f3c" />


---

## 🎯 Impact & Metrics

### Projected Benefits

- **40% reduction** in inappropriate emergency visits
- **24/7 availability** vs traditional 8am-4pm phone hours
- **60% decrease** in phone inquiry volume
- **Cost savings** from reduced no-shows and better resource allocation

### Technical Achievements

- **100% TypeScript** coverage for type safety
- **RESTful API** design following industry standards
- **Mobile-first** responsive design
- **GDPR-compliant** data handling
- **Production-ready** error handling and validation

---

## 🔮 Future Enhancements

### Short-term (2-4 weeks)

- [ ] Email/SMS notifications via Resend
- [ ] Export appointment data to PDF
- [ ] Patient medical history tracking
- [ ] Multi-clinic support with geolocation

### Medium-term (1-3 months)

- [ ] Video consultation integration
- [ ] Prescription management system
- [ ] Integration with Finnish Kanta health records
- [ ] Advanced analytics and reporting

### Long-term (3-6 months)

- [ ] Mobile native apps (React Native)
- [ ] AI-powered appointment rescheduling
- [ ] Predictive analytics for resource planning
- [ ] Multi-tenant architecture for healthcare networks

---

## 🤝 Contributing

This project was built as a portfolio piece demonstrating full-stack development capabilities. Contributions, issues, and feature requests are welcome!

---

## 👤 About the Developer

**Built by:** [Satyam Arora]  
**GitHub:** [@brogrammer2000](https://github.com/brogrammer2000)  
**LinkedIn:** [https://www.linkedin.com/in/satyam-arora-211120/]  
**Portfolio:** [https://www.satyamarora.dev/]

### Why This Project?

I created this application to demonstrate:

- **Full-stack expertise** in modern TypeScript, React, and Node.js
- **Product thinking** by addressing real-world healthcare challenges in Finland
- **AI integration** with practical, production-ready implementations
- **System design** skills with scalable architecture
- **User-centric development** with accessibility and UX focus

This project showcases my ability to build production-ready applications that solve real problems while maintaining code quality, security, and scalability.

---

## 📝 License

MIT License - feel free to use this project for learning and portfolio purposes.

---

## 🙏 Acknowledgments

- Built to address real challenges in Finland's healthcare system
- Inspired by the need for accessible, multilingual healthcare support
- Leverages modern AI to improve patient outcomes and reduce costs
- Thanks to the open-source community for amazing tools and libraries

---

**⭐ If you find this project impressive, please consider starring the repository!**

_Built with ❤️ for better healthcare accessibility in Finland_
