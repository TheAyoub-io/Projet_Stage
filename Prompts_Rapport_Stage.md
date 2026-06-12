# Prompts Détaillés pour la Rédaction du Rapport de Stage
**Projet :** Digitalisation du processus d'admission à l'internat du Lycée Technique Mohammed V de Béni Mellal (Web & Mobile)

Voici la liste des prompts très détaillés, organisés chapitre par chapitre. Copiez et collez chaque prompt à votre IA pour rédiger votre rapport section par section.

---

## 📄 Les Pages Préliminaires
**Prompt 0 : Les pages d'introduction**
> "Rédige-moi les pages préliminaires d'un rapport de stage de fin d'études : 
> 1. Un modèle de 'Dédicaces' professionnel.
> 2. Un modèle de 'Remerciements' adressé au corps professoral, à l'administration du Lycée Technique Mohammed V de Béni Mellal, et à la direction provinciale.
> 3. Un résumé (Abstract) du projet en Français et en Anglais détaillant l'objectif (modernisation de l'admission à l'internat), les technologies (React, FastAPI, PostgreSQL, Capacitor web-to-mobile) et le résultat final. Le ton doit être académique."

---

## 🏛️ Chapitre 1 : Contexte Général du Projet
**Prompt 1 : Présentation de l'organisme et problématique**
> "Rédige le Chapitre 1 (Contexte Général) de mon rapport de stage. 
> - **Section 1.1 - Présentation de l'organisme :** Décris le Lycée Technique Mohammed V de Béni Mellal et le rôle crucial de son internat pour les étudiants venant des zones rurales et lointaines.
> - **Section 1.2 - Étude de l'existant :** Explique la méthode de gestion de l'internat actuelle (dépôt physique de documents, gestion sur papier ou fichiers Excel basiques, lenteur de vérification, risque de perte, difficulté de communication).
> - **Section 1.3 - Problématique :** Mets en évidence les défis majeurs (perte de temps, traitement archaïque, manque de statistiques et de dashboarding pour l'administration, aucun suivi en temps réel pour l'étudiant).
> - **Section 1.4 - Solution proposée et Objectifs :** Présente le projet : une plateforme Web et Mobile permettant l'inscription en ligne, le dépôt de dossier, la signature numérique, la sélection automatisée, et un back-office pour l'administration."

---

## 🎯 Chapitre 2 : Analyse et Spécification des Besoins
**Prompt 2 : Acteurs, Besoins et Cas d'utilisation**
> "Rédige le Chapitre 2 sur l'Analyse des Besoins en suivant une démarche d'ingénierie logicielle.
> - **Section 2.1 - Identification des acteurs :** Identifie et décris précisément les deux acteurs du système : l'Administrateur (gestionnaire de l'internat) et le Candidat (l'élève).
> - **Section 2.2 - Besoins fonctionnels :** Détaille point par point : Pour l'étudiant (Création de compte, remplissage de formulaire dynamique selon la filière, signature électronique sur l'écran, téléchargement des attestations). Pour l'admin (Dashboard analytique, exportation Excel, validation des dossiers, affectation des chambres).
> - **Section 2.3 - Besoins non-fonctionnels :** Rédige un argumentaire technique sur l'importance de l'approche Mobile-First, la traduction multilingue (i18n), la sécurité des API (JWT), et la génération de PDF complexes.
> - **Section 2.4 - Diagramme de cas d'utilisation (UML) :** Donne-moi les descriptions textuelles complètes pour modéliser le diagramme de cas d'utilisation global. Prépare aussi le texte explicatif qui accompagnera ce diagramme dans le rapport."

---

## 💻 Chapitre 3 : Architecture et Choix Technologiques
**Prompt 3 : Les Outils et le Stack Technique**
> "Rédige le Chapitre 3 dédié à l'Architecture et aux Choix Technologiques.
> - **Section 3.1 - Architecture globale :** Explique le choix d'une architecture orientée services (Frontend séparé du Backend) communiquant via API RESTful.
> - **Section 3.2 - Choix du Backend :** Fais une présentation détaillée et justifiée de Python, FastAPI (pour la validation des données avec Pydantic et sa rapidité), SQLAlchemy (ORM) et PostgreSQL comme SGBD relationnel robuste.
> - **Section 3.3 - Choix du Frontend :** Présente React.js et Vite pour les performances, ainsi que Tailwind CSS pour une conception sur-mesure et réactive.
> - **Section 3.4 - La dimension Mobile (Capacitor) :** Explique la valeur ajoutée de réunir le monde web et mobile grâce à Capacitor JS, permettant de compiler le frontend vers une application Android installable.
> - Détaille les Outils annexes : GitHub (versionning), Postman/Swagger pour le test des API, etc."

---

## 📊 Chapitre 4 : Modélisation et Conception Détaillée de la BDD
**Prompt 4 : Modélisation de Données**
> "Rédige le Chapitre 4 orienté Conception. En te basant sur un système d'admission, détaille la modélisation de la base de données.
> - **Section 4.1 - Dictionnaire de données :** Explique les principales entités (User, AdmissionRequest, Room, AcademicLevel).
> - **Section 4.2 - Diagramme de Classes ou Entité-Association :** Fournis les explications détaillées des attributs et des relations : Un utilisateur a une seule demande, une requête contient des informations personnelles, académiques et le bloc 'signature'.
> - **Section 4.3 - Diagramme de séquence HTTP :** Décris textuellement le flux réseau (diagramme de séquence UML) de l'authentification : l'envoi des identifiants (creds), la vérification en base avec hachage (Bcrypt), et le retour du Token JWT. Parle de la sécurité mise en place."

---

## 🎨 Chapitre 5 : Réalisation, UX/UI et Défis Techniques
**Prompt 5 : Description du Développement et des Interfaces**
> "Rédige le Chapitre 5 (Réalisation). C'est le chapitre le plus technique du rapport.
> - **Section 5.1 - Environnement de développement et charte graphique :** Explique le choix du thème visuel (bleu/indigo rappelant le monde académique) et le processus créatif derrière le Logo du projet (qui intègre la Kasbah et l'Aïn Asserdoun pour ancrer le projet dans l'identité de Béni Mellal).
> - **Section 5.2 - Présentation des interfaces (UI) :** Rédige des commentaires techniques détaillés pour accompagner les futures captures d'écran : La page de Login, le formulaire d'admission dynamique en étapes, et le Dashboard Admin incluant les graphiques (Recharts).
> - **Section 5.3 - L'Exploit Technique 1 - Signature Électronique :** Explique l'intégration de la librairie Canvas côté client, comment l'image de la signature est capturée, encodée et sauvegardée en base de données.
> - **Section 5.4 - L'Exploit Technique 2 - Attestation PDF et QR Code :** Explique le processus complexe pour générer une attestation au format Word modernisé, injecter les données, attacher un QR code d'authentification et exporter en PDF en toute sécurité de manière compatible CSS.
> - **Section 5.5 - i18n et Export Excel :** Détaille la mis en place de l'internationalisation dynamique et la fonctionnalité de génération de tableurs Excel pour les administrateurs."

---

## 🏁 Conclusion Générale et Bilan
**Prompt 6 : Conclusion**
> "Rédige la Conclusion Générale de mon rapport. 
> 1. Fais un bilan très positif sur la réussite de la digitalisation de l'internat du Lycée Technique Mohammed V. 
> 2. Parle de la montée en compétences que t'a apportée ce stage (développement fullstack, approche mobile). 
> 3. Ajoute une section 'Perspectives d'évolution' en proposant des idées comme : L'envoi automatisé de SMS/Emails de notification via API, un système d'algorithmes plus poussé pour le classement automatique des élèves par mérite, et un module de paiement de la cantine."

---

## 🎨 Prompt Bonus : Refonte & Intégration du Design Frontend

**Prompt 7 : Analyse, Refonte Visuelle & Intégration Frontend (Zero-Error)**

> **Role:** Act as a Senior UI/UX Designer AND a Senior Frontend Developer with deep expertise in React, Vite, and Tailwind CSS.
>
> **Application Context:**
> This is **"Internat Mohammed V"** — a full-stack web & mobile platform for digitalizing the boarding school admission process at **Lycée Technique Mohammed V de Béni Mellal**. The platform serves two distinct user roles:
> - **Candidates (Students):** Multi-step admission form with dynamic fields per academic track, electronic signature capture, document upload, and real-time status tracking.
> - **Administrators:** Analytics dashboard (charts via Recharts), application review panel, room assignment manager (`RoomManager`), document viewer, notification center, and Excel/PDF export tools.
>
> **Tech Stack:**
> - **Frontend:** React 18 + Vite, Tailwind CSS, Capacitor (compiled to Android APK)
> - **Backend:** FastAPI (Python) with JWT authentication, PostgreSQL via SQLAlchemy
> - **Key Features Already Built:** i18n multilingual support (Arabic/French/English), dark/light theme toggle, real-time notifications (WebSocket/polling), electronic signature (Canvas), PDF/Word attestation generation with QR code
>
> **Current File Structure:**
> ```
> frontend/src/
> ├── pages/          → Home, Login, Register, ForgotPassword, ResetPassword, Apply, ApplyEnhanced, Dashboard, AdminDashboard
> ├── components/     → Navbar, Footer, ChatWindow, NotificationBell, ReviewPanel, RoomManager, AdminApplicationsList, AdminAnalyticsDashboard, LanguageSwitcher, ThemeToggle, IntegratedDocumentViewer...
> ├── hooks/          → Custom React hooks
> ├── utils/          → Helper functions
> ├── i18n.js         → Full i18n translations
> └── index.css       → Global styles
> ```
>
> ---
>
> **Your Mission — Execute in this exact order:**
>
> ### Phase 1 — Deep Analysis (Read Before Writing Any Code)
> Thoroughly read and understand every file in `frontend/src/`. Map out:
> - The complete routing logic in `App.jsx`
> - The authentication flow (JWT storage, protected routes)
> - All API calls and their expected response shapes
> - The existing Tailwind config and design tokens in `tailwind.config.js`
> - Every component's props, state, and side effects
> - Any existing bugs or display inconsistencies you spot
>
> ### Phase 2 — Design System Definition
> Before touching any component, define a unified, premium design system:
> - **Color Palette:** Academic yet modern — deep navy/indigo primary (`#1E3A5F`), gold accent (`#C9A84C` — referencing Moroccan heritage), clean whites and soft grays for backgrounds. Both light and dark themes must be fully coherent.
> - **Typography:** Use `Inter` or `Cairo` (for Arabic RTL support) via Google Fonts. Define a clear type scale (h1→caption).
> - **Spacing & Border Radius:** Establish consistent 4px-base spacing and rounded corners.
> - **Shadows & Glassmorphism:** Apply subtle `backdrop-blur` glass cards for dashboard panels.
> - **Animations:** Smooth page transitions, micro-interactions on buttons/inputs (scale on hover, focus rings), loading skeletons instead of spinners.
> - **RTL/LTR:** All layout changes must respect the active language direction (Arabic = RTL).
>
> ### Phase 3 — Component-by-Component Redesign & Integration
> Redesign and integrate the following, one by one, without breaking existing logic:
>
> | Component / Page | Design Priority | Key Constraint |
> |---|---|---|
> | `index.css` | Global tokens, resets, animations | Must be the single source of truth for CSS variables |
> | `Navbar.jsx` | Sticky glassmorphism bar, logo, nav links, theme/lang switcher | Responsive hamburger menu on mobile |
> | `Home.jsx` | Hero section, feature cards, CTA button | Engaging, convincing landing page |
> | `Login.jsx` / `Register.jsx` | Centered card with logo, animated inputs, clear error states | No layout shift on error display |
> | `Apply.jsx` / `ApplyEnhanced.jsx` | Vertical step-progress sidebar, animated step transitions | All form fields must be visible and usable on mobile |
> | `Dashboard.jsx` | Student portal: status timeline, document list, notification feed | Data must render correctly even when API returns empty arrays |
> | `AdminDashboard.jsx` | Tabbed layout: Analytics / Applications / Rooms / Settings | Each tab must lazy-load its content |
> | `AdminAnalyticsDashboard.jsx` | Recharts charts with custom themed colors | Charts must be responsive (`ResponsiveContainer`) |
> | `ReviewPanel.jsx` | Split view: document preview left, decision form right | Must handle PDF and image document types |
> | `RoomManager.jsx` | Grid of room cards with capacity indicators | Drag-to-assign or clear button-based assignment |
> | `NotificationBell.jsx` / `EnhancedNotificationCenter.jsx` | Slide-in drawer, unread badge, grouped by date | Mark-all-read must update UI instantly |
> | `ChatWindow.jsx` / `EnhancedChatWindow.jsx` | Modern chat bubble UI, timestamp, sender avatar | Input must stay pinned to the bottom |
> | `Footer.jsx` | Minimal, informational | Must not overlap content on mobile |
>
> ### Phase 4 — Quality Assurance (NON-NEGOTIABLE)
> After every change, verify:
> - ✅ **Zero console errors** — no undefined props, no missing keys, no failed imports
> - ✅ **Zero layout breaks** — test at 375px (mobile), 768px (tablet), 1440px (desktop)
> - ✅ **Zero white screens** — every route must render something, even during data loading (use skeleton loaders)
> - ✅ **RTL/LTR toggle works** — switch to Arabic and verify no element overflows or misaligns
> - ✅ **Dark/Light theme toggle works** — no hardcoded colors that ignore the theme
> - ✅ **All existing API integrations still work** — do NOT refactor API call logic, only wrap it in better UI states (loading, error, empty)
> - ✅ **Capacitor mobile compatibility** — avoid `hover`-only interactions that don't work on touch screens; prefer `active` states
>
> **Deliverable:** A pixel-perfect, production-ready frontend that makes the application look like a premium SaaS product, while keeping 100% of the existing business logic intact and error-free."
