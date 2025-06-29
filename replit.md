# Data Control Tower (DCT) - MVP Requirements

## Overview

The Data Control Tower (DCT) is a cloud-native platform designed to help enterprises and SMBs monitor, manage, and improve data quality, lineage, and governance. This MVP focuses on three core pillars: Data Discovery & Cataloging, Data Quality Monitoring, and Query Studio Interface.

The application is built as a full-stack TypeScript application with a React frontend and Express.js backend, utilizing PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful APIs with structured error handling
- **Development**: Hot reload with tsx for server-side development

### Database Schema
The application uses a PostgreSQL database with the following main entities:
- **users**: User authentication and management
- **dataSources**: Connected data sources (Snowflake, PostgreSQL, SQL Server, MySQL)
- **dataTables**: Discovered tables with metadata
- **dataFields**: Individual field information with data types and statistics
- **dataQualityRules**: User-defined data quality rules
- **dataQualityResults**: Results of quality rule executions
- **savedQueries**: User-saved SQL queries
- **activityLogs**: System activity tracking

## Key Components

### Data Discovery & Cataloging
- **Source Tree View**: Hierarchical display of connected data sources
- **Metadata Table**: Searchable table showing discovered data assets
- **Table Detail Modal**: Detailed view of table schema, fields, and business tags
- **Auto-scanning**: Automated schema discovery and metadata extraction

### Data Quality Monitoring
- **Rule Management**: Create and manage data quality rules (non-null, format, range checks)
- **Results Dashboard**: Visual representation of rule execution results
- **Scoring System**: Automated data quality scoring per table/source
- **Alert System**: Notifications for quality rule violations

### Query Studio
- **SQL Editor**: Code editor with syntax highlighting and auto-completion
- **Query Execution**: Execute queries against connected data sources
- **Results Display**: Tabular display of query results with export capabilities
- **Query Management**: Save and organize frequently used queries

### Dashboard & Analytics
- **KPI Cards**: Key metrics display (sources, tables, rules, quality scores)
- **Activity Feed**: Recent system activities and changes
- **Quality Trends**: Visual charts showing data quality over time

## Data Flow

1. **Data Source Connection**: Users configure connections to various data sources
2. **Schema Discovery**: System automatically scans and extracts metadata
3. **Catalog Population**: Discovered assets are stored and made searchable
4. **Quality Rule Creation**: Users define data quality rules for specific fields/tables
5. **Quality Monitoring**: Rules are executed and results tracked over time
6. **Query Execution**: Users can query data through the built-in SQL editor
7. **Activity Logging**: All system activities are logged for audit purposes

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database for production
- **Drizzle Kit**: Database migrations and schema management

### UI Components
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

### Runtime Dependencies
- **Express**: Web framework for API endpoints
- **React Query**: Server state management and caching
- **Zod**: Runtime type validation and schema definition

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Automatic reloading for both frontend and backend changes
- **Database**: Connection to Neon PostgreSQL via environment variables

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code for Node.js runtime
- **Static Serving**: Express serves built frontend assets
- **Environment**: Production configuration with optimized settings

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **Build Scripts**: Separate build processes for client and server

## Changelog
- June 27, 2025. Initial setup
- June 27, 2025. Redesigned interface to Excel-like format with ribbon toolbar, grid layouts, and technical styling for enterprise data management
- June 28, 2025. Implemented comprehensive stability, performance, and error handling improvements across all components
- June 28, 2025. Added advanced Rule Builder with template system, sample data preview, and test mode for data quality management
- June 28, 2025. Created comprehensive BI Tool Integration with Power BI/Tableau connection management, asset synchronization, and advanced lineage mapping capabilities
- June 28, 2025. Implemented Schema Discovery & Auto-Scanning system with PostgreSQL schema introspection, automated table/field detection, and bulk scanning capabilities
- June 28, 2025. Completed Data Quality Rule Execution Engine with automated rule execution, quality scoring algorithms, and real-time quality score cards
- June 28, 2025. Built Advanced Query Studio Performance Engine with real-time query analysis, optimization suggestions, execution plan visualization, and performance grading system
- June 28, 2025. Completed Advanced Data Catalog with intelligent search, metadata management, faceted filtering, relevance scoring, and comprehensive search analytics
- June 28, 2025. Completed System Integration & Production Optimization with comprehensive health monitoring, caching, rate limiting, security headers, and real-time system dashboard

## User Preferences

Preferred communication style: Simple, everyday language.