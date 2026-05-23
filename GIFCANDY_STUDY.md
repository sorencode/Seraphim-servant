# Gifcandy.net Extraction & Feasibility Study

## 1. Network Architecture Mapping
*   **Infrastructure:** While the frontend operates on standard sequential HTML routing (e.g., `/page/1/`, `/page/2/`), the site is fundamentally built on WordPress and retains its core architectural signatures.
*   **Hidden API Interception:** A review of the network and architecture reveals that the application exposes the native, unauthenticated **WordPress REST API**. The primary feed data can bypass HTML scraping entirely by targeting **`https://gifcandy.net/wp-json/wp/v2/posts?_embed=true&page={X}`**.
*   **Data Delivery:** This endpoint delivers clean, structured JSON payloads representing the posts on a given page. The `_embed=true` parameter is critical as it instructs the backend to automatically serialize and embed the associated media details (the "featured media") directly into the post JSON.
*   **Security Posture:** The REST API is completely open. It requires no authentication (e.g., Bearer tokens), lacks rate limiting on standard intervals, and standard HTTP GET requests bypass any potential front-end HTML parsing blockers. A basic browser `User-Agent` spoof is sufficient.

## 2. State Persistence & Offsets
*   **Pagination Scaling & Hard Ceilings:** The WordPress REST API natively provides state data in the HTTP response headers. By inspecting the **`X-WP-TotalPages`** header returned from any request to the endpoint, the exact "hard ceiling" of the database is revealed (currently around `640` pages, representing thousands of posts).
*   **Total Randomization Strategy:** True mathematical randomization is achievable without crawling the front-end sequentially:
    1.  Perform a lightweight HEAD or GET request to `/wp-json/wp/v2/posts?page=1`.
    2.  Extract the value of the `X-WP-TotalPages` HTTP header.
    3.  Generate a random integer between `1` and the total pages value.
    4.  Make a subsequent GET request to `/wp-json/wp/v2/posts?_embed=true&page=<RANDOM_INT>` to drop directly into a random deep-history page offset.
    5.  Select a random post from the returned JSON array (typically 10 items per page).

## 3. Direct Media Access
*   **Post Architecture & Extraction:** Once a random post is selected from the JSON payload, the direct media link is nestled within the `_embedded` array. Specifically, the path to target is `post._embedded['wp:featuredmedia'][0].source_url`.
*   **CDN Integration & Formats:** The media is hosted directly on their own server (`https://gifcandy.net/wp-content/uploads/...`). Analysis confirms the primary high-quality media sources are served as **`.webp`** and **`.gif`** formats. The WebP sources support native animation.
*   **Filtering MP4s:** Because the API response includes a `mime_type` field (e.g., `image/webp`, `image/gif`, `video/mp4`) alongside the `source_url`, any post returning a `video/mp4` MIME type can be strictly filtered out before extraction or rendering, enforcing the requested constraint.

## 4. Automation Strategy & Execution
*   **Feasibility:** Highly Feasible. The platform is highly vulnerable to rapid, large-scale JSON extraction.
*   **Execution Strategy:** Headless browser automation (like Puppeteer or Playwright) is entirely unnecessary and would be inefficient. The extraction process can be cleanly handled using high-speed native Node.js HTTP clients (like `axios` or native `fetch`), bypassing HTML parsing completely by digesting the REST API JSON arrays.
*   **Bulk Scrappable Verification:** The open API architecture, combined with sequential page integers (1 to ~640) and straightforward JSON payloads, means an automated script could easily loop through all integer pages and harvest the entire media database (filtering out any MP4s along the way) rapidly and comprehensively.