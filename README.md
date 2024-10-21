# Vercel Clone

A self-hosted deployment platform inspired by Vercel, built with Node.js, Docker, Cloudflare R2, and React. This system allows you to build and deploy web applications with automated build processes and asset delivery.

## Here is Demo

https://github.com/user-attachments/assets/8c3aa809-d513-40de-b939-19ef1df4573a

# Project Architecture Overview

## Components

### 1. Build Server
- Containerized service that handles repository builds
- Primary functions:
  - Clones Git repositories
  - Executes builds within Docker containers
  - Uploads built assets and code to Cloudflare R2 object storage
  - Manages build lifecycle and artifacts

### 2. REST API Service
- Core orchestration service responsible for:
  - Managing Docker container lifecycle
  - Initiating and controlling builds
  - Providing real-time build logs via WebSocket connections
  - Coordinating between different system components

### 3. Client Application
- React-based web interface offering:
  - Repository management
  - Build monitoring and control
  - Real-time log viewing
  - Project configuration

### 4. Proxy Server
- Handles asset delivery through:
  - Streaming applications from R2 storage
  - HTTP proxy implementation for efficient content delivery
  - Request routing and caching

## Current Implementation Notes

While this implementation provides core functionality, there are several potential improvements:

### Cloud Platform Integration
Consider migrating container execution to managed services:
- Google Cloud Platform: Cloud Run for containerized workloads
- AWS: ECS on Fargate for serverless container management

### Additional Enhancements
- Implement project ID and URL persistence
- Add robust error handling
- Enhance logging and monitoring
- Implement caching strategies
- Add authentication and authorization







