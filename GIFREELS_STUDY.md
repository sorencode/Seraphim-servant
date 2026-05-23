# Gifreels.com Extraction & Feasibility Study (API Edition)

## 1. Network Architecture Mapping
*   **Infrastructure:** While the frontend is a modern Server-Side Rendered (SSR) application, the core data is served by a dedicated backend REST API (`api.gifreels.com`).
*   **Data Delivery:** Discrete JSON API endpoints are exposed and accessible via standard XHR requests. The backend state does not need to be scraped from serialized HTML; it can be queried directly for clean, structured JSON.
*   **Routing & Querying:** Data retrieval is managed via standard URL query parameters on the API endpoints (e.g., `https://api.gifreels.com/post/feed-by-key?key=tag&value=masturbating&limit=20&skip=0`).

## 2. State Persistence & Offsets
*   **Pagination Scaling:** The API allows dynamic control over pagination through `limit` and `skip` query parameters, rather than relying on static HTML page paths.
*   **Deep Archive Access:** Randomization and deep archive access are achieved by injecting a random integer into the `skip` parameter. This instructs the database to bypass a specific number of recent posts and return a batch from deeper in the tag's history.
*   **Out of Bounds Handling:** Requesting a `skip` value that exceeds the available posts simply returns an empty `posts` array in the JSON response, avoiding complex HTTP `302` redirects or `404` error handling.

## 3. Direct Media Access
*   **Post Architecture:** The API response provides an array of post objects. Each object contains a unique identifier under the `uid` key (e.g., `d777`).
*   **CDN Integration:** By extracting the `uid` from the JSON payload, the system can programmatically construct the direct CDN delivery URL pointing to the primary media host: **`xcdn.tv`**.
*   **Format:** The primary payloads are served natively as short-form `.mp4` videos (e.g., `https://xcdn.tv/cdn/storage/production/gifreels/post/<UID>/gif.mp4`), making them immediately compatible with Discord embeds and custom web players without complex token negotiations.

## 4. Automation Strategy & Execution
*   **Security Posture:** The API is fronted by Cloudflare. However, standard `GET` requests with a spoofed browser `User-Agent` effortlessly bypass the gateway without triggering bot checks. Headless browser automation (Puppeteer) is entirely unnecessary.
*   **Total Randomization Methodology (Simplified Execution):**
    To achieve total randomization across tens of thousands of deeply buried posts, the extraction script executes the following highly efficient logic:
    1.  **Tag Selection:** Select a random tag from a predefined array (e.g., `riding`, `milf`, `amateur`).
    2.  **Offset Generation:** Generate a random integer (e.g., `0` to `500+`) to act as the `skip` value.
    3.  **API Request:** Fetch the JSON payload directly via `https://api.gifreels.com/post/feed-by-key?key=tag&value=<TAG>&limit=20&skip=<RANDOM_INT>`.
    4.  **Extraction:** Parse the JSON response, iterate through the `posts` array, extract the `uid` for each item, and construct the direct CDN delivery URLs (`https://xcdn.tv/cdn/storage/production/gifreels/post/<UID>/gif.mp4`).