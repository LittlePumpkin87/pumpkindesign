# 🎃 Little Pumpkin Design – Portfolio & Freelance Website

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Strapi](https://img.shields.io/badge/Strapi-2E7EEA?style=for-the-badge&logo=strapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

> **Welcome to the source code of my personal portfolio!** > This repository showcases a modern, next-gen full-stack architecture, combining a highly scalable frontend with a headless CMS, entirely containerized and self-hosted.

## ✨ Key Features & Technical Highlights

This project is built to reflect enterprise-level standards in web development:
* **Server-Side Rendering (SSR):** Optimized for flawless SEO and lightning-fast Initial Page Loads using the latest Angular features.
* **Atomic Design Architecture:** Frontend components are strictly separated into Atoms, Molecules, and Organisms for maximum reusability.
* **Headless CMS Integration:** Dynamic content management via Strapi (REST API).
* **Automated CI/CD:** Fully automated build and deployment pipelines using **GitHub Actions** (Push to GitHub Container Registry).
* **Enterprise Security:** * Strict Content Security Policies (CSP) with dynamic Nonces against XSS attacks.
  * Custom Nginx Reverse Proxy with rigorous file-extension whitelisting to block bots and malicious scanners.

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
Make sure you have the following installed on your machine:
* [Docker](https://www.docker.com/) & Docker Compose
* Node.js (for local frontend development)

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/littlepumpkindesign.git](https://github.com/yourusername/littlepumpkindesign.git)
   cd littlepumpkindesign

```

2. **Environment Variables:**
You have to create your own `.env` file. The easiest way is to copy the example file and fill in your secrets:

```bash
cp .env.example .env

```


3. **Spin up the environment:**
Start the entire stack (Frontend + Backend + Database) locally using Docker Compose:

```bash
docker compose --env-file .env -f docker-compose.dev.yml up -d --build --force-recreate

```


*For the production environment, replace `docker-compose.dev.yml` with `docker-compose.yml`.*

---

## 🏗️ Deployment & Hosting Strategy

Unlike standard static hosting platforms, the entire stack is architected for self-hosting to maintain full control over data and infrastructure:

* **Infrastructure:** Hosted on a local **Synology NAS** server environment.
* **Orchestration:** Multi-container deployment managed via **Docker Compose**.
* **Routing:** Served via an **Nginx Reverse Proxy** handling routing and SSL/TLS termination.

---

## 📁 Project Structure (Frontend Focus)

The Angular frontend follows a highly scalable architecture:

```text
pumpkindesign_ssr/
├── public/                 # Static assets
└── src/
    ├── app/
    │   ├── components/     # Atomic Design Architecture
    │   │   ├── atoms/      # Smallest building blocks (buttons, inputs)
    │   │   ├── molecules/  # Groups of atoms functioning together
    │   │   └── organisms/  # Complex UI components composed of molecules
    │   ├── interfaces/     # TypeScript interfaces and type definitions
    │   ├── mapper/         # Data mappers (API payload to frontend models)
    │   ├── services/       # Core business logic and API communication
    │   └── shared/         # Shared modules and global components
    ├── main.server.ts      # SSR entry point
    └── server.ts           # Express Node server setup (incl. CSP & Proxy)

```

### REST API Endpoints (Strapi)

* `/api/head` - Fetches global Header Data (Favicon, Logo, Navigation).
* `/api/page-by-path?path=/` - Fetches cleaned-up structural data for a specific page route.
* `/api/foot` - Fetches global Footer Data.

---

## 🛠️ Development Road Map & To-Dos

This project is under active development. Current focus areas:

* [x] Configure Headless Navigation Structure in Strapi.
* [x] Create and migrate initial Startpage content.
* [ ] **WIP:** Fix Docker volume mapping for displaying uploaded Strapi images in the frontend.
* [ ] Add portfolio case studies.

---

## 👩‍💻 About the Developer

I am a professional **Web Developer** currently working in an agency environment, specialized in modern frontend architectures and headless content management workflows.

* **Current Focus:** Angular, TypeScript, Headless CMS integration (Strapi, Webflow, FirstSpirit), and DevOps (Docker, CI/CD Pipelines).
* **Design Background:** With a strong background in Graphic Design, I focus heavily on pixel-perfect UI implementations and seamless UX/UI concepts.

📫 **Get in touch:** Let's connect on [Xing](https://www.xing.com/profile/Jennifer_Roob/web_profiles?nwt_nav=profile) or check out my live portfolio at [littlepumpkindesign.de](https://littlepumpkindesign.de).