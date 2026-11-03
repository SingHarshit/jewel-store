# 🚀 Comprehensive EC2 Deployment & Hosting Guide

This guide provides step-by-step instructions for deploying the **Heirest Jewelry Store** full-stack application onto an AWS EC2 instance using **Docker** and **Docker Compose**.

---

## 🏛️ Architecture Overview

The application runs as 4 containerized services managed by Docker Compose:

```
                          ┌──────────────────────────────────────────────┐
                          │               AWS EC2 Host                   │
                          │                                              │
Internet (Port 80/443) ──►│  ┌────────────────────────────────────────┐  │
                          │  │           heirest_frontend             │  │
                          │  │          (Nginx Web Server)            │  │
                          │  │  • Serves React SPA static assets      │  │
                          │  │  • Reverse-proxies /api/ to backend   │  │
                          │  └───────────────────┬────────────────────┘  │
                          │                      │ (internal docker net) │
                          │                      ▼                       │
                          │  ┌────────────────────────────────────────┐  │
                          │  │           heirest_backend              │  │
                          │  │       (Node.js / Express API)          │  │
                          │  └───────────┬────────────────┬───────────┘  │
                          │              │                │              │
                          │              ▼                ▼              │
                          │  ┌────────────────┐    ┌─────────────────┐   │
                          │  │heirest_postgres│    │  heirest_redis  │   │
                          │  │ (PostgreSQL 16)│    │ (Redis 7 Cache) │   │
                          │  │ volume: db_data│    │ volume: rd_data │   │
                          │  └────────────────┘    └─────────────────┘   │
                          └──────────────────────────────────────────────┘
```

- **Frontend**: Nginx serving the production Vite build on port 80. Routes `/api/*` internally to Express.
- **Backend**: Express REST API on internal port 5000 (also mapped for direct access). Automatically syncs Prisma schemas on boot.
- **Database**: PostgreSQL 16 Alpine with persistent disk storage (`postgres_data`).
- **Cache**: Redis 7 Alpine with persistent disk storage (`redis_data`).

---

## 📋 Prerequisites & AWS EC2 Sizing

### Recommended Instance Type
- **Recommended**: `t3.small` (2 vCPU, 2 GiB RAM) or `t2.small` — offers smooth building and running without resource contention.
- **Free Tier**: `t2.micro` (1 vCPU, 1 GiB RAM) — **supported**, but you **must** configure 2 GiB swap space (step provided below) so Docker/npm builds do not run out of memory.
- **OS**: **Ubuntu 24.04 LTS** or **Ubuntu 22.04 LTS**.
- **Storage**: Minimum **20 GB gp3**.

---

## Step 1: Launch EC2 Instance & Configure Security Group

1. Log into your **AWS Management Console** and navigate to **EC2** > **Launch Instance**.
2. **Name**: `heirest-production-server`
3. **Application & OS Images**: Choose **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type**.
4. **Instance Type**: Select `t3.small` (or `t2.micro` with swap).
5. **Key Pair**: Select an existing key pair or click **Create new key pair** (`.pem` format), then download `heirest-key.pem`.
6. **Network Settings (Security Group)**:
   Create a Security Group with the following inbound rules:

   | Type | Port Range | Source | Purpose |
   | :--- | :--- | :--- | :--- |
   | **SSH** | `22` | My IP (or `0.0.0.0/0`) | SSH Terminal Access |
   | **HTTP** | `80` | `0.0.0.0/0` | Public Web Traffic (Frontend + API) |
   | **HTTPS** | `443` | `0.0.0.0/0` | Secure SSL Traffic |
   | **Custom TCP** | `5000` | `0.0.0.0/0` *(Optional)* | Direct backend testing |

7. **Storage**: Set size to **20 GiB** (General Purpose SSD gp3).
8. Click **Launch Instance**.

---

## Step 2: Connect to your EC2 Instance

Open your local terminal (PowerShell, Command Prompt, or bash) and navigate to the directory where your `.pem` key was downloaded.

### For Windows PowerShell:
```powershell
ssh -i "path\to\heirest-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### For Linux / macOS:
```bash
chmod 400 heirest-key.pem
ssh -i heirest-key.pem ubuntu@<EC2-PUBLIC-IP>
```
*(Replace `<EC2-PUBLIC-IP>` with the public IPv4 address of your instance from the AWS EC2 console).*

---

## Step 3: Configure 2GB Swap Memory (Recommended)

Swap memory acts as virtual RAM on disk, preventing the instance from freezing or crashing during Docker builds on small instances.

Run this on your EC2 instance:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is active
free -h
```

---

## Step 4: Install Docker & Docker Compose on Ubuntu

Run the following commands to install Docker Engine and the Docker Compose plugin:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install prerequisites
sudo apt install -y curl ca-certificates gnupg lsb-release

# 3. Add Docker official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Set up the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine, CLI, and Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Allow the ubuntu user to run Docker without sudo
sudo usermod -aG docker $USER

# 7. Apply the new group membership
newgrp docker

# 8. Verify installation
docker --version
docker compose version
```

---

## Step 5: Transfer the Project to EC2

### Option A: Using Git (Recommended)
If your repository is on GitHub / GitLab:
```bash
cd ~
git clone <YOUR_REPOSITORY_URL> heirest
cd heirest
```

### Option B: Using SCP from your Local PC
From your local Windows terminal, copy the project folder to your EC2 instance:
```powershell
scp -i "path\to\heirest-key.pem" -r "D:\Frames\react\Jewel\New folder" ubuntu@<EC2-PUBLIC-IP>:~/heirest
```
Then on the EC2 terminal:
```bash
cd ~/heirest
```

---

## Step 6: Create the Production Environment File

Create the `.env` file from `.env.example`:

```bash
cp .env.example .env
nano .env
```

Review and adjust the values:
```ini
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_super_strong_database_password_here
POSTGRES_DB=heirest_jewelry

# Security
JWT_SECRET=generate_a_random_secret_with_openssl_rand_hex_32

# CORS (Allowed origins: * or your IP/domain)
FRONTEND_URL=*

# Razorpay (Optional test credentials)
RAZORPAY_KEY_ID=rzp_test_HeirestDemoKey2026
RAZORPAY_KEY_SECRET=heirest_razorpay_test_secret_2026
RAZORPAY_WEBHOOK_SECRET=heirest_webhook_secret_2026

# Seed initial catalog and demo users on first boot
AUTO_SEED=true
```

Save and exit `nano` with `Ctrl + O`, `Enter`, then `Ctrl + X`.

---

## Step 7: Build and Launch the Docker Containers

Run:
```bash
docker compose up -d --build
```

### What happens automatically on boot:
1. Docker builds the `frontend` container (React + Tailwind + Nginx).
2. Docker builds the `backend` container (Express + Prisma).
3. Docker pulls and starts `postgres` and `redis`.
4. The `backend` container waits for PostgreSQL to become healthy, automatically runs `prisma db push` to initialize tables, and seeds the initial catalog, pricing matrices, and demo users.
5. `frontend` listens on port `80`, routing static files and proxying `/api/*` requests to `backend:5000`.

---

## Step 8: Verify Deployment & Logs

Check container status:
```bash
docker compose ps
```
All 4 containers (`heirest_frontend`, `heirest_backend`, `heirest_postgres`, `heirest_redis`) should display `Up` / `healthy`.

View live application logs:
```bash
# View backend logs (including schema push and seed output)
docker compose logs -f backend

# View all container logs
docker compose logs -f
```

---

## Step 9: Access Your Application

Open your browser and navigate to:
```
http://<EC2-PUBLIC-IP>
```

You can also test the backend health endpoints:
- Root health check: `http://<EC2-PUBLIC-IP>/health`
- API v1 health check (with DB connection verification): `http://<EC2-PUBLIC-IP>/api/v1/health`

### Pre-loaded Demo Accounts:
| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@heirest.com` | `admin123` | Full Admin Dashboard (`/admin`) |
| **Customer** | `india@heirest.co` | `customer123` | Collector Vault, Orders & Saved Designs |

---

## 🛠️ Management & Maintenance Commands

### Restarting Services
```bash
docker compose restart
```

### Stopping the Services
```bash
docker compose down
```

### Rebuilding After Code Changes
When you push new code or pull changes:
```bash
git pull origin main
docker compose up -d --build
```

### Running Prisma Studio on EC2
To browse and edit the database using Prisma Studio through SSH tunnel:
```bash
docker compose exec backend npx prisma studio --port 5555 --browser none
```
Then on your local machine, run:
```powershell
ssh -i "path\to\heirest-key.pem" -L 5555:localhost:5555 ubuntu@<EC2-PUBLIC-IP>
```
Visit `http://localhost:5555` in your browser.

### Creating Database Backups
```bash
# Backup PostgreSQL database to a .sql file
docker compose exec -t postgres pg_dump -U postgres heirest_jewelry > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20261103.sql | docker compose exec -T postgres psql -U postgres heirest_jewelry
```

---

## 🔒 Optional: Add Free HTTPS / SSL with Certbot

Once you assign a domain name (e.g. `jewelry.yourdomain.com`) pointing to your EC2 Public IP:

1. Install Certbot on EC2:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. Request a free Let's Encrypt certificate:
   ```bash
   sudo certbot certonly --standalone -d jewelry.yourdomain.com
   ```
3. Mount the certificate directories (`/etc/letsencrypt`) into the `frontend` container or use a host-level Nginx reverse proxy.
