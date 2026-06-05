# 🎃 Little Pumpkin Design – Portfolio & Freelance Website

This repository contains the full source code for my personal portfolio and freelance website. To ensure a seamless, modern, and easily deployable architecture, the entire application is containerized using Docker, combining both the frontend and the backend into an **All-in-One** setup.

You have to create your own `.env file.` The easiest way is to copy the .env.example file and fill in your secrets.

To start all at once locally use the command `docker compose --env-file ./strapi_pumpkindesign_ssr/.env -f docker-compose.dev.yml up -d --build --force-recreate` as shell command

Replace `docker-compose.dev.yml` with `docker-compose.yml` for production environment or just use `docker compose --env-file ./strapi_pumpkindesign_ssr/.env -d --build`

make sure your docker engine is running!

---

## 🏗️ Project Status & Architecture Road Map

> **Note:** This project is currently **under active development (Work in Progress)**. I am migrating my legacy portfolio to a modern, next-gen full-stack architecture to reflect my daily tech stack in enterprise web development.

The project is split into two main parts, orchestrated to run together flawlessly:

* **Frontend (`pumpkindesign_ssr`):** Developed with **Angular (Latest Version)** using **SSR (Server-Side Rendering)** for optimal SEO and performance, along with TypeScript and SCSS.
* **Backend / CMS (`strapi_pumpkindesign_ssr`):** Powered by **Strapi (Headless CMS)**, allowing dynamic content management for portfolio projects, services, and blog posts.
* **DevOps / Deployment (`docker-compose.yml`):** **Docker & Docker Compose** are used to package the Angular production build (served via Nginx) and the Strapi instance into a unified, lightweight, and easily deployable environment.

---

## 🚀 Deployment & Hosting Strategy

Unlike standard static hosting platforms, the entire stack (both frontend SSR and backend CMS) is architected for self-hosting:

* **Target Infrastructure:** Hosted on a local **NAS** server environment.
* **Orchestration:** Multi-container deployment managed via **Docker Compose**.
* **Routing & Security:** Served via an **Nginx Reverse Proxy** with automated SSL/TLS termination.

---

## 📁 Project Structure (Frontend Focus)

The Angular frontend follows a highly scalable architecture inspired by **Atomic Design principles**, separating UI components by complexity and responsibility:

```text
pumpkindesign_ssr/
├── public/                 # Static assets
└── src/
    ├── app/
    │   ├── components/     # Atomic Design Architecture
    │   │   ├── atoms/      # Smallest building blocks (buttons, inputs, icons)
    │   │   ├── molecules/  # Groups of atoms functioning together
    │   │   └── organisms/  # Complex UI components composed of molecules
    │   ├── interfaces/     # TypeScript interfaces and type definitions
    │   ├── mapper/         # Data mappers (e.g., API response payload to frontend model)
    │   ├── services/       # Core business logic and API communication
    │   ├── shared/         # Shared modules and global components
    │   ├── utils/          # Helper functions and utilities
    │   ├── app.config.server.ts
    │   ├── app.config.ts
    │   ├── app.html
    │   ├── app.routes.server.ts
    │   ├── app.routes.ts
    │   ├── app.scss
    │   └── app.ts
    ├── environments/       # Environment-specific configurations
    ├── index.html
    ├── main.server.ts      # SSR entry point
    ├── main.ts             # Client entry point
    └── server.ts           # SSR Node server setup
```

## 👩‍💻 About the Developer

I am a professional **Web Developer** currently working in the agency environment, specialized in modern frontend architectures and headless content management workflows. 

* **Current Focus:** Angular, TypeScript, Headless CMS integration (Strapi, Webflow, FirstSpirit), and DevOps basics (Docker, CI/CD Pipelines).
* **Design Background:** With a background in Graphic Design, I focus heavily on pixel-perfect UI implementations and seamless UX/UI concepts.

---
