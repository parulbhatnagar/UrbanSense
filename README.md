# UrbanSense

**A voice-first mobile assistant for the visually impaired, now ready for deployment.**

UrbanSense is a mobile web application designed to help visually impaired users gain a better understanding of their immediate surroundings and navigate their environment. Through a simple, high-contrast interface and powerful voice commands, it provides real-time spatial awareness and navigational assistance.

This project is now structured for production deployment using Vite and can be easily hosted on services like Netlify.

## Core Features

-   **Voice-First Interface**: After an initial tap, the app enters a continuous listening loop for a hands-free experience.
-   **Explore Mode**: Say "Explore" to get a concise, AI-generated description of your surroundings.
-   **Advanced Navigation**:
    -   **Conversational Start**: Say "Navigate" and the app will ask for your destination. It uses OpenStreetMap to find real-world locations (no API key needed).
    -   **On-Demand Guidance**: During navigation, tap the screen at any time to get enhanced guidance that combines turn-by-turn directions with a real-time visual analysis of your path.
-   **SOS Emergency Call**: Say "SOS" or tap the dedicated button to initiate a phone call to a pre-configured emergency contact.
-   **Customizable Settings**: Set your emergency SOS contact and manage voice command preferences.
-   **Accessibility-Focused Design**: High-contrast, minimalist UI with large tappable areas and full audio feedback.

## Technical Stack

-   **Framework**: React (v19) with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini 2.5 Flash
-   **Maps & Location**: OpenStreetMap (Nominatim & OSRM)
-   **Speech APIs**: Browser's native Web Speech API
-   **Deployment**: Ready for Netlify

---

## Getting Started (Local Development)

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 18 or higher)
-   A package manager like `npm` or `yarn`

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

You need a Google Gemini API key for the AI features to work.

1.  Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
2.  Open `.env.local` in your editor.
3.  Replace `YOUR_API_KEY_HERE` with your actual Google Gemini API key.

    ```
    VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

### 4. Run the Development Server

```bash
npm run dev
```

The application will now be running on `http://localhost:5173` (or another port if 5173 is busy). Vite provides a fast development experience with Hot Module Replacement (HMR).

---

## Deployment to Netlify

### 1. Push Your Code to a Git Provider

Push the entire project, including the new build configuration files (`package.json`, `vite.config.ts`, `netlify.toml`, etc.), to a GitHub, GitLab, or Bitbucket repository.

### 2. Create a New Site on Netlify

1.  Log in to your Netlify account.
2.  Click **"Add new site"** -> **"Import an existing project"**.
3.  Connect to your Git provider and select the repository for this project.

### 3. Configure Build Settings

Netlify will automatically detect the correct settings from `netlify.toml`, so you typically don't need to change anything here. It should look like this:
-   **Build command**: `npm run build`
-   **Publish directory**: `dist`

### 4. Add the API Key Environment Variable

This is the most important step for the deployed site to work.

1.  In your new site's dashboard on Netlify, go to **Site configuration** -> **Build & deploy** -> **Environment**.
2.  Click **"Edit variables"** and add a new variable:
    -   **Key**: `VITE_GEMINI_API_KEY`
    -   **Value**: Paste your **actual Google Gemini API key** here.
3.  Click **"Save"**.

### 5. Deploy the Site

Go back to the "Deploys" tab for your site and trigger a new deploy by clicking **"Trigger deploy"** -> **"Deploy site"**. Netlify will now build and deploy your application. Once finished, your UrbanSense app will be live on the web!
