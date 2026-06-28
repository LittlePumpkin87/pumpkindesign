# 🎃 Little Pumpkin Design – Fullstack Portfolio

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Strapi](https://img.shields.io/badge/Strapi-2E7EEA?style=for-the-badge&logo=strapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

🌐 **Live Demo:** [littlepumpkindesign.de](https://littlepumpkindesign.de)

> **Welcome to the source code of my personal portfolio!** > This repository showcases a modern, next-gen fullstack architecture, combining a highly scalable frontend with a headless CMS, entirely containerized and self-hosted.

## ✨ Key Features & Technical Highlights

This project is built to reflect enterprise-level standards in web development:

* **Server-Side Rendering (SSR):** Optimized for flawless SEO and lightning-fast Initial Page Loads using the latest Angular features.
* **Atomic Design Architecture:** Frontend components are strictly separated into Atoms, Molecules, and Organisms for maximum reusability.
* **Headless CMS Integration:** Dynamic content management via Strapi v4 (REST API).
* **Automated CI/CD:** Fully automated build and deployment pipelines using **GitHub Actions** (Push to GitHub Container Registry).
* **Enterprise Security:** Strict Content Security Policies (CSP) with dynamic nonces against XSS attacks, backed by a custom Nginx reverse proxy featuring rigorous file-extension whitelisting.
---

## 🏗️ Architecture & Hosting Strategy

Unlike standard static hosting platforms, the entire stack is architected for self-hosting to maintain full control over data and infrastructure:

```mermaid
graph LR
    %% Hinwege (Requests)
    User([User]) -->|HTTPS Request| Proxy[Nginx Reverse Proxy]
    Proxy -->|SSR Route| Frontend[Angular SSR Node]
    Proxy -->|Image/API Request| Backend[Strapi CMS]
    Frontend -->|Fetch Content| Backend
    Backend -->|Query| DB[(PostgreSQL)]

    %% Rückwege (Responses) - gestrichelt
    DB -.->|Raw Data| Backend
    Backend -.->|JSON| Frontend
    Backend -.->|Images| Proxy
    Frontend -.->|Rendered HTML| Proxy
    Proxy -.->|Website| User
```

* **Infrastructure:** Hosted on a local **Synology NAS** server environment.
* **Orchestration:** Multi-container deployment managed via **Docker Compose**.
* **Routing:** Served via an **Nginx Reverse Proxy** handling routing and SSL/TLS termination.

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

Make sure you have the following installed on your machine:

* [Docker](https://www.docker.com/) & Docker Compose
* Node.js (for local frontend development)

### Installation

**1. Clone the repository:**

```bash
git clone [https://github.com/LittlePumpkin87/pumpkindesign.git](https://github.com/LittlePumpkin87/pumpkindesign.git)
cd pumpkindesign

```

**2. Setup Environment Variables:**
Create your own `.env` file based on the provided example and fill in your secrets:

```bash
cp .env.example .env

```

**3. Spin up the environment:**
Start the entire stack (Frontend + Backend + Database) locally using Docker Compose:

```bash
docker compose --env-file .env -f docker-compose.dev.yml up -d --build --force-recreate

```
or use npm commands for quicker start/build/shutdown containers

```bash
npm run docker start
npm run docker recreate
npm run docker down

```

*(For the production environment, replace `docker-compose.dev.yml` with `docker-compose.yml`.)*

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
* `/api/navigation/render/main?type=TREE` - Fetches global Main navigation.

---

## 🛠️ Development Roadmap & To-Dos

This project is under active development. Current focus areas:

* [x] Configure Headless Navigation Structure in Strapi.
* [x] Create and migrate initial Startpage content.
* [x] Fix Docker volume mapping for uploaded Strapi images in production.
* [x] Integrate core backend components.
* [ ] **WIP:** Finalize interactive frontend components for all pages (e.g., Tech-Stack Spiderweb).
* [ ] **WIP:** Build dynamic portfolio case study pages.
* [ ] Populate Strapi with content.

---

## 👩‍💻 About the Developer

I am a professional **Web Developer** currently working in an agency environment, specialized in modern frontend architectures and headless content management workflows.

* **Current Focus:** Angular, TypeScript, Headless CMS integration (Strapi, Webflow, FirstSpirit), and DevOps (Docker, CI/CD Pipelines).
* **Design Background:** With a strong background in Graphic Design, I focus heavily on pixel-perfect UI implementations and seamless UX/UI concepts.

📫 **Get in touch:** Let's connect on [Xing](https://www.xing.com/profile/Jennifer_Roob/web_profiles?nwt_nav=profile) or check out my live portfolio at [littlepumpkindesign.de](https://littlepumpkindesign.de).
