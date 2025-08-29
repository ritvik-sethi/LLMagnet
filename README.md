# Engineering Discoverability for the Next Generation of Search

Optimize your content to boost search rankings and earn more LLM citations. Our comprehensive suite of SEO tools helps you analyze, optimize, and improve your content's performance in search engines.

## 🚀 Overview

This platform is designed for the future of search - where AI and Large Language Models (LLMs) are becoming the primary way users discover content. Our tools help you engineer discoverability by optimizing your content for both traditional search engines and the emerging LLM-driven search landscape.

## ✨ Features

### 🔍 Query Optimizer
- **LLM Query Analysis**: Analyze and optimize queries for better LLM visibility
- **Modern Dashboard**: Professional UI displaying comprehensive SEO metrics
- **API Integration**: Real-time analysis using OpenAI's GPT-4
- **Auto-fill Integration**: Seamless transition to content rewriting

### 📊 Dashboard Features
- **Metrics Overview**: Citation likelihood, authority score, semantic understanding
- **Optimized Queries**: Detailed analysis of each query with implementation guidance
- **Implementation Plan**: Step-by-step optimization roadmap
- **Risk Assessment**: Comprehensive risk analysis and mitigation strategies
- **Success Metrics**: LLM-specific KPIs and measurement guidelines

### ✍️ Content Rewriting
- **Auto-populate**: Automatically fills content from Query Optimizer
- **Multiple Modes**: General, Semantic (HTML), and Query-based optimization
- **Real-time Processing**: Advanced content rewriting for LLM optimization

### 🎯 Additional Tools
- **Competitor Gap Analysis**: Identify opportunities your competitors are missing
- **Content SEO Score**: Evaluate and improve your content's SEO performance
- **Semantic SEO Score**: Optimize for semantic search and AI understanding
- **Trend Alerts**: Stay ahead with real-time trend monitoring

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **SCSS Modules** - Modular styling with CSS-in-JS approach

### State Management
- **Redux Toolkit** - Modern Redux with simplified patterns
- **RTK Query** - Data fetching and caching

### AI & APIs
- **OpenAI GPT-4** - Advanced language model integration
- **RESTful APIs** - Custom API routes for each tool

### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### UI/UX
- **React Icons** - Comprehensive icon library
- **Custom Components** - Tailored UI components
- **Responsive Design** - Mobile-first approach
- **Modern CSS** - CSS Grid, Flexbox, and custom properties

### Performance
- **Next.js Optimization** - Built-in performance features
- **Code Splitting** - Automatic route-based code splitting
- **Image Optimization** - Next.js Image component
- **Bundle Analysis** - Webpack bundle analyzer

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   
   Or run the setup script:
   ```bash
   node setup-env.js
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Dashboard: `http://localhost:3000/dashboard`
   - Query Optimizer: `http://localhost:3000/query-optimizer`
   - Content Rewriting: `http://localhost:3000/rewrite-for-llm`
   - Competitor Analysis: `http://localhost:3000/competitor-gap-analysis`
   - Content SEO Score: `http://localhost:3000/content-seo-score`
   - Semantic SEO Score: `http://localhost:3000/semantic-seo-score`
   - Trend Alerts: `http://localhost:3000/trend-alerts`

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Click "New Project" → Import your repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**:
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `your_actual_api_key`

4. **Connect Custom Domain** (GoDaddy):
   - In Vercel → Project Settings → Domains
   - Add your custom domain
   - In GoDaddy DNS, add these records:
     ```
     Type: A, Name: @, Value: 76.76.19.19
     Type: CNAME, Name: www, Value: cname.vercel-dns.com
     ```

### Deploy to Netlify

1. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub
   - Click "New site from Git" → Choose your repository

2. **Configure Environment Variables**:
   - In Netlify → Site Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `your_actual_api_key`

3. **Connect Custom Domain** (GoDaddy):
   - In Netlify → Site Settings → Domain Management
   - Add your custom domain
   - In GoDaddy DNS, add these records:
     ```
     Type: A, Name: @, Value: 75.2.60.5
     Type: CNAME, Name: www, Value: your-site-name.netlify.app
     ```

## 📖 Usage

1. **Enter Queries**: Add up to 6 LLM-style search queries
2. **Add Content**: Provide article heading and content
3. **Analyze**: Click "Analyze for LLM Optimization" to get comprehensive insights
4. **Review Dashboard**: Examine metrics, optimized queries, and implementation plan
5. **Rewrite**: Click "Rewrite for LLM-based SEO" to auto-fill the rewrite page

### Dashboard Sections

- **LLM SEO Metrics**: Key performance indicators for AI search optimization
- **Optimized Queries**: Detailed analysis with citation potential and authority signals
- **Implementation Plan**: Structured roadmap with timeline and success metrics
- **Risk Assessment**: Potential challenges and mitigation strategies

### Auto-fill Features

When transitioning from Query Optimizer to Rewrite page:
- **Heading**: Automatically populated from Query Optimizer input
- **Queries**: All queries are transferred and separated by pipes
- **Content**: Article content is preserved and ready for rewriting

## 🔌 API Endpoints

### Query Optimizer API
- **Endpoint**: `/api/query-optimizer`
- **Method**: POST
- **Input**: Current queries, search intent, user behavior
- **Output**: Comprehensive LLM SEO analysis and optimization recommendations

### Content SEO Score API
- **Endpoint**: `/api/content-seo`
- **Method**: POST
- **Input**: Content, target keywords, audience
- **Output**: SEO score and improvement recommendations

### Semantic SEO API
- **Endpoint**: `/api/semantic-seo`
- **Method**: POST
- **Input**: Content, semantic context
- **Output**: Semantic optimization score and suggestions

### Competitor Analysis API
- **Endpoint**: `/api/competitor-analysis`
- **Method**: POST
- **Input**: Competitor URLs, target keywords
- **Output**: Gap analysis and opportunity identification

### Trend Alerts API
- **Endpoint**: `/api/trend-alerts`
- **Method**: POST
- **Input**: Industry, keywords, time range
- **Output**: Trending topics and alert recommendations

## 🏗️ Project Structure

```
app/
├── api/                    # API routes
│   ├── competitor-analysis/
│   ├── content-seo/
│   ├── query-optimizer/
│   ├── rewrite-for-llm/
│   ├── semantic-seo/
│   └── trend-alerts/
├── dashboard/              # Main dashboard
├── query-optimizer/        # Query optimization page
├── rewrite-for-llm/        # Content rewriting page
├── competitor-gap-analysis/ # Competitor analysis
├── content-seo-score/      # Content SEO scoring
├── semantic-seo-score/     # Semantic SEO scoring
└── trend-alerts/          # Trend monitoring
store/
└── slices/                # Redux state management
    ├── competitorAnalysisSlice.ts
    ├── contentScoreSlice.ts
    ├── queryOptimizerSlice.ts
    ├── rewriteSlice.ts
    ├── semanticScoreSlice.ts
    └── trendAlertsSlice.ts
styles/                    # SCSS modules
components/                # Reusable components
```

## 🎯 Key Components

- **Dashboard**: Centralized overview of all tools and metrics
- **QueryOptimizer**: LLM query analysis and optimization
- **RewriteForLLM**: Content rewriting with multiple modes
- **CompetitorAnalysis**: Gap analysis and opportunity identification
- **ContentScore**: SEO performance evaluation
- **SemanticScore**: Semantic search optimization
- **TrendAlerts**: Real-time trend monitoring
- **Redux Slices**: State management for all tools
- **API Routes**: Backend integration with OpenAI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future of Search

As AI and LLMs continue to reshape how users discover content, our platform is designed to help you stay ahead of the curve. We're building for a future where:

- **Semantic Understanding** matters more than keyword matching
- **Citation Quality** determines content authority
- **AI-Friendly Content** ranks higher in LLM responses
- **Contextual Relevance** drives user engagement

Join us in engineering the future of discoverability. 🚀 