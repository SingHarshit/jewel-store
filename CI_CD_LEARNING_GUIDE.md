# 📘 Full-Stack CI/CD & EC2 Deployment Master Guide

> A practical handbook on deploying containerized React + Node.js + PostgreSQL + Redis applications to AWS EC2 using GitHub Actions and Amazon ECR — including every real-world error encountered and how we fixed it.

---

## 📑 Table of Contents

1. [End-to-End Architecture](#1-end-to-end-architecture)
2. [Prerequisites &amp; Repository Structure](#2-prerequisites--repository-structure)
3. [Step-by-Step CI/CD Blueprint](#3-step-by-step-cicd-blueprint)
4. [The Wall of Bummers: Real Failures, Root Causes &amp; Fixes](#4-the-wall-of-bummers-real-failures-root-causes--fixes)
   - [Bummer 1: Local Port 5432 Collision](#bummer-1-local-port-5432-collision)
   - [Bummer 2: Sensitive `.env` Committed to Git](#bummer-2-sensitive-env-committed-to-git)
   - [Bummer 3: CI Test Stage Failed (`ZodError: DATABASE_URL undefined`)](#bummer-3-ci-test-stage-failed-zoderror-database_url-undefined)
   - [Bummer 4: AWS Organization SCP Explicit Deny](#bummer-4-aws-organization-scp-explicit-deny)
   - [Bummer 5: Docker Hub Pull Access Denied (`heirest_backend:latest`)](#bummer-5-docker-hub-pull-access-denied-heirest_backendlatest)
   - [Bummer 6: SSH Action Froze for 17+ Minutes](#bummer-6-ssh-action-froze-for-17-minutes)
   - [Bummer 7: Git Merge Conflict Aborted Deployment on EC2](#bummer-7-git-merge-conflict-aborted-deployment-on-ec2)
   - [Bummer 8: Blank ECR Environment Variables in SSH Subshell](#bummer-8-blank-ecr-environment-variables-in-ssh-subshell)
5. [How to Re-create This Pipeline from Scratch](#5-how-to-re-create-this-pipeline-from-scratch)
6. [Why You Cannot Reach Your App via Public IP Yet &amp; Next Steps](#6-why-you-cannot-reach-your-app-via-public-ip-yet--next-steps)

---

## 1. End-to-End Architecture

```
[ Developer ] 
      │ git push origin main
      ▼
[ GitHub Repository ]
      │ triggers
      ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GitHub Actions Runner (4 vCPU / 16 GB RAM)                             │
│                                                                        │
│ 1. CI Stage:                                                           │
│    ├── Spawns ephemeral PostgreSQL 16 & Redis 7 service containers     │
│    ├── Syncs Prisma schema (npx prisma db push)                        │
│    ├── Seeds database & runs Vitest E2E Suite (42 tests)               │
│    └── Validates Frontend Vite/React build                             │
│                                                                        │
│ 2. Build & Push Stage:                                                 │
│    ├── Configures AWS credentials                                      │
│    ├── Builds multi-stage Docker images using Buildx layer caching     │
│    └── Pushes tagged images to Amazon ECR                              │
│                                                                        │
│ 3. Deploy Stage (SSH to EC2):                                          │
│    └── Connects to EC2 and triggers deploy.sh                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SSH (Port 22)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ AWS EC2 Host (Ubuntu 24.04 / t2.micro + 2GB Swap)                      │
│                                                                        │
│ deploy.sh:                                                             │
│    ├── Discards dirty local changes (git reset --hard origin/main)     │
│    ├── Logs Docker into Amazon ECR                                     │
│    ├── Pulls pre-built ECR images (Zero RAM consumed on EC2)           │
│    ├── Recreates ONLY backend & frontend containers                    │
│    │   (PostgreSQL, Redis & persistent volumes remain UNTOUCHED)       │
│    ├── Runs 15-attempt health check verification                       │
│    └── Prunes dangling images to preserve disk                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & Repository Structure

To make Docker Compose work for both **local development** and **remote cloud deployments**, the repository layout must separate concerns:

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated 3-stage CI/CD pipeline
├── backend/
│   ├── Dockerfile              # Multi-stage Node 20 + Prisma image
│   ├── docker-entrypoint.sh    # Waits for Postgres, pushes schema, seeds DB
│   └── src/ & prisma/
├── frontend/
│   ├── Dockerfile              # Multi-stage Node 20 builder + Nginx 1.27
│   ├── nginx.conf              # SPA routing fallback + /api/ reverse proxy
│   └── src/
├── .dockerignore
├── .env.example                # Template for environment variables
├── .gitignore                  # Prevents committing secrets & build outputs
├── deploy.sh                   # EC2 zero-downtime deployment script
└── docker-compose.yml          # Orchestrates backend, frontend, postgres, redis
```

---

## 4. The Wall of Bummers: Real Failures, Root Causes & Fixes

Here are the exact issues we faced during the setup, why they happened, and how to permanently prevent them.

---

### Bummer 1: Local Port 5432 Collision

- **What Happened**: Running `docker compose up` on the developer machine failed with:
  ```text
  Bind for 127.0.0.1:5432 failed: port is already allocated
  ```
- **Why It Happened**: The local machine was already running another PostgreSQL container (`event-store-db`) bound to host port `5432`.
- **The Fix**:
  In `docker-compose.yml`, made the host port configurable with a default fallback to `5433`:
  ```yaml
  ports:
    - "${POSTGRES_PORT:-5433}:5432"
  ```

  *Key Insight*: Inside the Docker bridge network, containers communicate via `postgres:5432`. Host port mappings only affect external connections from outside Docker. Changing the host port to `5433` avoids collisions without changing application connection strings.

---

### Bummer 2: Sensitive `.env` Committed to Git

- **What Happened**: The root `.env` file containing database passwords and test payment credentials was committed and pushed to GitHub.
- **Why It Happened**: There was no root `.gitignore` file in the workspace; only sub-folders had `.gitignore` files.
- **The Fix**:
  1. Created a root `.gitignore` containing `.env`, `node_modules/`, and `dist/`.
  2. Untracked the `.env` file from git index without deleting it locally:
     ```bash
     git rm --cached .env
     git commit -m "chore: untrack .env and add .gitignore"
     git push origin main
     ```

---

### Bummer 3: CI Test Stage Failed (`ZodError: DATABASE_URL undefined`)

- **What Happened**: The first GitHub Actions run failed during `npm run test` with:
  ```text
  ZodError: [
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["DATABASE_URL"],
      "message": "Invalid input: expected string, received undefined"
    }
  ]
  ```
- **Why It Happened**:
  1. In `backend/src/config/env.ts`, `DATABASE_URL: z.string().min(1)` had no `.default(...)`.
  2. On the local PC, `backend/.env` existed. In GitHub Actions cloud runners, `.env` is intentionally absent for security.
  3. The Vitest suite performs full integration tests against PostgreSQL and Redis, which were not running on the cloud runner.
- **The Fix**:
  1. Added a safe default in `backend/src/config/env.ts`:
     ```ts
     DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/heirest_jewelry?schema=public'),
     ```
  2. Added ephemeral `postgres:16-alpine` and `redis:7-alpine` service containers in the GitHub Actions `ci` job.
  3. Executed `npx prisma db push` and `npx tsx prisma/seed.ts` before running `npm run test` so the test suite ran against a real database.

---

### Bummer 4: AWS Organization SCP Explicit Deny

- **What Happened**: The `build-and-push` stage failed when authenticating with ECR:
  ```text
  Error: User: arn:aws:iam::993499103846:user/github-actions-heirest-deployer is not authorized to perform: ecr:GetAuthorizationToken on resource: * with an explicit deny in a service control policy: arn:aws:organizations::791316000757:policy/.../p-omyw8jtf
  ```
- **Why It Happened**:
  AWS Accounts managed within an AWS Organization (student labs, enterprise sandboxes) often have Service Control Policies (SCPs) that restrict API calls to specific regions or disable certain services. If the GitHub Secret `AWS_REGION` did not match the allowed region, the SCP explicitly denied the request.
- **The Fix**:
  Configured `AWS_REGION` to match the exact region where the EC2 instance and ECR repositories reside.

---

### Bummer 5: Docker Hub Pull Access Denied (`heirest_backend:latest`)

- **What Happened**: On EC2, deployment crashed with:
  ```text
  Error response from daemon: pull access denied for heirest_backend, repository does not exist or may require 'docker login'
  ```
- **Why It Happened**:
  1. `docker-compose.yml` had `image: ${BACKEND_IMAGE:-heirest_backend:latest}`.
  2. `BACKEND_IMAGE` was received as an empty string on EC2.
  3. Docker Compose fell back to the local name `heirest_backend:latest` and attempted to pull it from the public Docker Hub registry, where it does not exist.
- **The Fix**:
  1. Hard-rendered the full Amazon ECR URI (`993499103846.dkr.ecr.<region>.amazonaws.com/heirest-backend:latest`) directly in the SSH script.
  2. Added a defensive check in `deploy.sh`: only pull if `BACKEND_IMAGE` contains a `/` (indicating an external registry URI).

---

### Bummer 6: SSH Action Froze for 17+ Minutes

- **What Happened**: GitHub Actions stayed on `Trigger Remote Deployment via SSH` for over 17 minutes without printing anything after `Drone SSH version 1.8.0`.
- **Why It Happened**:
  1. The default connection timeout in `appleboy/ssh-action` is up to 30 minutes.
  2. If the EC2 instance is stopped and restarted, AWS assigns a **new Public IPv4 address**. The GitHub Secret `EC2_HOST` was still pointing to the old IP, causing SSH to hang indefinitely waiting for a TCP handshake.
- **The Fix**:
  1. Updated `EC2_HOST` secret with the current Public IPv4 address.
  2. Added strict timeouts to `deploy.yml`:
     ```yaml
     timeout: 60s
     command_timeout: 10m
     ```

     This prevents the runner from hanging if an IP is unreachable.

---

### Bummer 7: Git Merge Conflict Aborted Deployment on EC2

- **What Happened**: Deployment failed on EC2 with:
  ```text
  error: Your local changes to the following files would be overwritten by merge:
      deploy.sh
  Please commit your changes or stash them before you merge. Aborting
  ```
- **Why It Happened**:
  When testing manually on EC2, permissions were modified (`chmod +x deploy.sh`). Standard `git pull` considers permission/file modifications local changes and refuses to pull.
- **The Fix**:
  In `.github/workflows/deploy.yml`, changed the pull command to an authoritative reset:
  ```bash
  git fetch origin main
  git reset --hard origin/main
  ```

  *Key Insight*: In automated deployments, the cloud server should never have untracked manual edits. `git reset --hard origin/main` ensures the server always mirrors the exact state of the repository.

---

### Bummer 8: Blank ECR Environment Variables in SSH Subshell

- **What Happened**:
  ```text
  🚀 Deploying with images:
     Registry: 
     Backend:  
     Frontend: 
  ```
- **Why It Happened**:
  In GitHub Actions syntax, the `env` context is **not available** inside `jobs.<job_id>.outputs`. Passing dynamic step outputs between jobs often yields empty strings if context rules are violated.
- **The Fix**:
  Eliminated the fragile inter-job output chaining and used deterministic template variables directly in the deployment step:
  ```yaml
  export ECR_REGISTRY="${{ env.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com"
  export BACKEND_IMAGE="${{ env.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_BACKEND_REPO }}:latest"
  export FRONTEND_IMAGE="${{ env.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_FRONTEND_REPO }}:latest"
  ```

---

## 5. How to Re-create This Pipeline from Scratch

When starting a new project, follow these 5 steps:

1. **Dockerize Services**:
   - Multi-stage frontend Dockerfile: Node builder + Nginx static server.
   - Backend Dockerfile: Node + Prisma Client generation + entrypoint script to run migrations.
2. **Configure `docker-compose.yml`**:
   - Use dynamic images: `image: ${SERVICE_IMAGE:-service:latest}`.
   - Use healthchecks on database services so backend starts only when database is ready.
3. **Setup AWS ECR & IAM**:
   - Create private ECR repositories.
   - Create IAM user with `AmazonEC2ContainerRegistryPowerUser`.
4. **Prepare EC2**:
   - Enable 2GB swap space to prevent memory freezes on small instances.
   - Install Docker & Compose plugin, add `ubuntu` user to `docker` group.
   - Clone repo and create initial production `.env`.
5. **Add GitHub Actions Workflow & Secrets**:
   - Add secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.
   - Write `.github/workflows/deploy.yml` with CI testing, ECR build/push, and SSH deploy.

---

## 6. Why You Cannot Reach Your App via Public IP Yet & Next Steps

If your GitHub Actions pipeline succeeded with green checkmarks but opening `http://<EC2-PUBLIC-IP>` in your browser times out or does not load, here is why:

### Cause 1: EC2 Security Group Inbound Rule for Port 80 (HTTP) is Missing

- **The Reason**: By default, EC2 instances only open port 22 (SSH). Even if Nginx is listening on port 80 inside EC2, AWS firewall blocks outside traffic from reaching port 80 unless explicitly permitted.
- **How to Fix**:
  1. Open [AWS EC2 Console](https://console.aws.amazon.com/ec2/) -> Click **Instances** -> Select your instance.
  2. Click the **Security** tab below -> Click your **Security group** name.
  3. Click **Edit inbound rules** -> Click **Add rule**:
     - **Type**: `HTTP`
     - **Port range**: `80`
     - **Source**: Select `Anywhere-IPv4` (`0.0.0.0/0`)
  4. Click **Save rules**.

---

### Cause 2: Browser Automatically Redirected to `https://`

- **The Reason**: Modern browsers (Chrome, Edge, Brave) frequently auto-upgrade addresses to `https://`. Since SSL is not yet configured, port 443 refuses the connection.
- **How to Fix**:
  - Explicitly type **`http://`** before your IP in the address bar:
    ```
    http://YOUR_EC2_PUBLIC_IP/
    ```
  - Or test in an Incognito / Private window.

---

### Cause 3: Verifying Containers are Running on EC2

Connect to your EC2 instance via SSH and verify running containers:

```bash
ssh -i "path/to/heirest-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
cd ~/heirest
docker compose ps
```

All 4 containers (`heirest_frontend`, `heirest_backend`, `heirest_postgres`, `heirest_redis`) should show `Up`.

---

### What to Do Next After This

Once port 80 is accessible, the next logical steps for production hosting are:

1. **Assign an Elastic IP (EIP)**: Prevents the public IP from changing every time the EC2 instance is rebooted.
2. **Attach a Custom Domain**: Point your DNS (e.g. Route53, Namecheap, Cloudflare) via an `A record` to your Elastic IP.
3. **Configure Free SSL Certificate via Let's Encrypt / Certbot**: Enables secure `https://` traffic and Razorpay live payment gateways.

   for learning purpose only
