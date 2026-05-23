# Hardgif.com Extraction & Feasibility Study

## 1. Network Architecture Mapping
*   **Infrastructure:** The site implements infinite scrolling using standard asynchronous `XMLHttpRequest` evaluations against a backend PHP script.
*   **API Endpoint:** The dynamically loaded content is fetched by firing `GET` requests to `https://hardgif.com/backend.php`.
*   **Response Payload:** Unlike modern applications utilizing React or Vue (which pass clean JSON structures to be hydrated on the client), this endpoint returns raw, pre-rendered HTML snippets ready to be appended to the DOM.

## 2. State Persistence & Offsets
*   **The `p` Parameter:** Infinite scroll offsets are entirely tracked using a simplistic URL query parameter: `?p=`.
*   **Database Ceiling:** A binary search script targeting the `backend.php?p=` endpoint successfully identified the hard ceiling of the database. The endpoint returns HTML blocks up until `p=749`. Beyond that page, it returns a `0` length body.
*   **Total Inventory:** Assuming an average of 10 items per page, the site's media pool consists of approximately **7,490 active posts**.

## 3. Direct Media Access
*   **Media Extraction Paths:** Within the returned HTML, the actual video links are explicitly assigned to `data-src` properties within `<video>` and `<source>` elements.
*   **Target CDNs:** The site does not natively host the majority of its media files. Instead, the `data-src` property acts as a direct passthrough to unauthenticated `v.redd.it` mirrors (e.g., `https://v.redd.it/<ID>/CMAF_1080.mp4`).
*   **Format Constraints:** The media is consistently hosted as direct `.mp4` video files, rather than obfuscated `.m3u8` playlists or heavily encoded `.webp` blobs, allowing for rapid and simple Discord embedding.

## 4. Automation Strategy & Execution
*   **Security Posture:** The site's `backend.php` endpoint sits behind Cloudflare but is extremely permissive. It currently processes high-speed automated `GET` requests without invoking Captcha checks or HTTP 403 Forbidden blockers.
*   **Execution Strategy:** The extraction script can be built purely using lightweight `Axios` or `node-fetch` libraries. There is absolutely no requirement for a heavy headless browser framework (e.g., Puppeteer).
*   **Total Randomization Methodology (The 3-Step Process):**
    1.  **Generate Index:** Select a random integer between `1` and `749`.
    2.  **Fetch HTML:** Execute a GET request to `https://hardgif.com/backend.php?p=<RANDOM_INT>`.
    3.  **Extract & Parse:** Parse the raw HTML response via Regex to match `data-src="([^"]+\.mp4)"`. This will return an array of MP4 links for that page. Select one link randomly from the captured array to deliver to the Discord UI.