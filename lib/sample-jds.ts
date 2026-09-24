export interface SampleJobDescription {
  id: string;
  label: string;
  text: string;
}

export const SAMPLE_JDS: SampleJobDescription[] = [
  {
    id: 'react-frontend',
    label: 'React Frontend Developer',
    text: `About the Role
We are looking for a React Frontend Developer to join our product engineering team. You will build and maintain user-facing features for our web application, collaborating closely with designers and backend engineers.

Responsibilities
- Build responsive, accessible UI components using React and TypeScript
- Collaborate with designers to translate Figma mockups into pixel-perfect interfaces
- Optimize application performance (bundle size, rendering, Core Web Vitals)
- Write unit and integration tests (Jest, React Testing Library)
- Participate in code reviews and mentor junior engineers

Required Skills
- 3+ years of experience with React, TypeScript, and modern JavaScript (ES6+)
- Strong understanding of HTML5, CSS3, and responsive design principles
- Experience with state management (Redux, Zustand, or React Context)
- Familiarity with REST APIs and asynchronous data fetching
- Experience with Git and CI/CD workflows

Nice to Have
- Experience with Next.js and server-side rendering
- Familiarity with Tailwind CSS or CSS-in-JS libraries
- Experience with design systems and component libraries (Storybook)
- Exposure to GraphQL
- Basic knowledge of accessibility (WCAG) standards`,
  },
  {
    id: 'fullstack-node',
    label: 'Full Stack Node.js Engineer',
    text: `About the Role
We're hiring a Full Stack Engineer to design, build, and ship features across our Node.js backend and React frontend. You'll own features end-to-end, from database schema to UI polish.

Responsibilities
- Design and implement RESTful and/or GraphQL APIs using Node.js and Express/Fastify
- Build frontend features in React that consume those APIs
- Design and maintain relational database schemas (PostgreSQL or MySQL)
- Write automated tests across the stack (unit, integration, e2e)
- Deploy and monitor services in a cloud environment (AWS, GCP, or Azure)

Required Skills
- 4+ years of professional experience with Node.js and JavaScript/TypeScript
- Solid experience with React or another modern frontend framework
- Strong SQL skills and experience with an ORM (Prisma, TypeORM, Sequelize)
- Experience building and consuming REST APIs
- Familiarity with Docker and containerized deployments
- Experience with Git-based workflows and code review

Nice to Have
- Experience with microservices architecture
- Familiarity with message queues (RabbitMQ, SQS, Kafka)
- Experience with GraphQL (Apollo Server/Client)
- Exposure to AWS Lambda or other serverless platforms
- Experience with automated CI/CD pipelines (GitHub Actions, CircleCI)`,
  },
  {
    id: 'devops',
    label: 'DevOps Engineer',
    text: `About the Role
We're looking for a DevOps Engineer to help scale our infrastructure, improve deployment reliability, and build tooling that lets engineers ship faster and safer.

Responsibilities
- Design, build, and maintain CI/CD pipelines for multiple services
- Manage cloud infrastructure using Infrastructure as Code (Terraform, CloudFormation, or Pulumi)
- Operate and improve Kubernetes clusters running production workloads
- Implement monitoring, alerting, and observability (Prometheus, Grafana, Datadog)
- Improve security posture across CI/CD and cloud environments
- Participate in on-call rotation and incident response

Required Skills
- 3+ years of experience in a DevOps, SRE, or Platform Engineering role
- Strong experience with AWS, GCP, or Azure
- Hands-on experience with Docker and Kubernetes in production
- Proficiency with Infrastructure as Code (Terraform preferred)
- Scripting experience in Bash, Python, or Go
- Experience with CI/CD tools (GitHub Actions, Jenkins, GitLab CI)

Nice to Have
- Experience with service mesh technologies (Istio, Linkerd)
- Familiarity with GitOps tools (ArgoCD, Flux)
- Experience with cost optimization for cloud infrastructure
- Security certifications or experience with SOC 2 compliance
- Experience mentoring engineers on infrastructure best practices`,
  },
];
