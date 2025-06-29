# Data Control Tower (DCT)

> **Enterprise-grade data governance platform for comprehensive data quality monitoring, cataloging, and management**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🎯 Overview

Data Control Tower (DCT) is a cloud-native platform designed to help enterprises and SMBs monitor, manage, and improve data quality, lineage, and governance. Built as a comprehensive solution for modern data teams who need to ensure data reliability across their organization.

### Key Features

- **📊 Data Discovery & Cataloging** - Automated schema discovery with searchable metadata
- **🔍 Advanced Data Quality Monitoring** - Rule-based quality assessment with real-time scoring
- **⚡ Query Studio Interface** - Enterprise SQL editor with performance optimization
- **🔗 BI Tool Integration** - Native Power BI and Tableau connectivity
- **📈 System Health Monitoring** - Production-grade performance tracking
- **🛡️ Data Governance** - Comprehensive compliance and lineage tracking

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development builds
- **Tailwind CSS + shadcn/ui** for consistent, accessible design
- **TanStack Query** for intelligent server state management
- **Wouter** for lightweight client-side routing

### Backend Stack
- **Node.js + Express** for robust API services
- **PostgreSQL + Neon** for scalable data persistence
- **Drizzle ORM** for type-safe database operations
- **Production optimization** with caching, rate limiting, and health monitoring

### Key Components

```
├── Data Discovery Engine    # Automated schema scanning & metadata extraction
├── Quality Rule Engine      # Real-time data quality assessment & scoring
├── Query Performance Engine # SQL optimization & execution plan analysis
├── Advanced Search Engine   # Intelligent catalog search with relevance scoring
├── System Health Monitor    # Production monitoring & alerting
└── BI Integration Hub      # Power BI/Tableau connectivity & lineage mapping
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/data-control-tower.git
cd data-control-tower
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy environment template
cp .env.example .env

# Configure your database connection
DATABASE_URL=postgresql://username:password@localhost:5432/dct_db
```

4. **Initialize the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio for database management |

## 🔧 Configuration

### Database Setup

The platform requires a PostgreSQL database. You can use:

- **Local PostgreSQL** - Traditional setup for development
- **Neon** - Serverless PostgreSQL (recommended for production)
- **Supabase** - Open source Firebase alternative
- **Railway** - Simple cloud database hosting

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Development
NODE_ENV=development

# Optional: External integrations
POWER_BI_CLIENT_ID=your_powerbi_client_id
TABLEAU_SERVER_URL=your_tableau_server
```

## 🌟 Core Features

### Data Discovery & Cataloging
- **Automated Schema Scanning** - Discovers tables, fields, and relationships
- **Metadata Management** - Rich descriptions, tags, and business glossary
- **Advanced Search** - Intelligent search with faceted filtering and relevance scoring
- **Data Lineage** - Visual mapping of data flows and dependencies

### Data Quality Monitoring
- **Rule Builder** - Create custom quality rules with templates
- **Real-time Scoring** - Automated quality assessment with trend analysis  
- **Alert System** - Proactive notifications for quality violations
- **Quality Dashboards** - Executive and operational reporting

### Query Studio
- **Advanced SQL Editor** - Syntax highlighting and auto-completion
- **Performance Analysis** - Real-time query optimization suggestions
- **Execution Plans** - Visual query plan analysis
- **Query Management** - Save and organize frequently used queries

### System Integration
- **BI Tool Connectivity** - Native Power BI and Tableau integration
- **API-First Design** - RESTful APIs for all platform functionality
- **Health Monitoring** - Production-grade system monitoring
- **Security** - Enterprise authentication and authorization

## 📊 Screenshots

### Main Dashboard
*Overview of data sources, quality metrics, and recent activity*

### Data Catalog
*Searchable inventory of all organizational data assets*

### Query Studio  
*Advanced SQL editor with performance optimization*

### Quality Monitoring
*Real-time data quality assessment and trend analysis*

## 🔒 Security

- **Authentication** - Secure user authentication with session management
- **Authorization** - Role-based access control for data governance
- **Data Protection** - Encrypted connections and secure data handling
- **Audit Logging** - Comprehensive activity tracking for compliance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📈 Roadmap

- [ ] **Advanced ML Integration** - Automated data profiling and anomaly detection
- [ ] **Multi-cloud Support** - AWS, Azure, and GCP native integrations
- [ ] **Data Mesh Architecture** - Distributed data governance capabilities
- [ ] **Real-time Streaming** - Live data quality monitoring for streaming data
- [ ] **Advanced Visualizations** - Interactive data lineage and impact analysis

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - [docs.datacontroltower.com](https://docs.datacontroltower.com)
- **Issues** - [GitHub Issues](https://github.com/yourusername/data-control-tower/issues)
- **Discussions** - [GitHub Discussions](https://github.com/yourusername/data-control-tower/discussions)

## 🏆 Acknowledgments

Built with modern web technologies and best practices for enterprise data management. Special thanks to the open source community for the amazing tools and libraries that make this project possible.

---

**Made with ❤️ for data teams everywhere**