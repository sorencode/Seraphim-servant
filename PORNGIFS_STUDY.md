# Porngifs.com Extraction & Feasibility Study

## 1. Network Architecture Mapping
*   **Infinite Scrolling Mechanism:** The website operates its infinite scrolling by triggering a `POST` request to the endpoint `/ajax/scrolldown` every time the bottom of the viewport is approached.
*   **Payload Data:** The AJAX request simply sends a `loadcount` integer (and an optional `tag` string for category filtering) encoded as `application/x-www-form-urlencoded`.
*   **Response Handling:** The endpoint responds with a clean JSON array containing 20 media objects. For example:
    ```json
    [{"id":"22160","title":"","src":"22160","gif":"0"}]
    ```

## 2. State Persistence & Offsets
*   **The `loadcount` Parameter:** The `loadcount` acts exactly like a traditional pagination offset. For example, sending `loadcount=100` tells the backend to return items 100 through 120.
*   **Database Ceiling:** A binary search script was run against the `loadcount` parameter to find the hard ceiling of the database. The endpoint successfully returns arrays up to `loadcount=29951`. Any request past this limit returns a raw boolean `false`.
*   **Total Inventory:** This indicates the site's primary feed pool contains approximately ~30,000 indexable GIF entries.

## 3. Direct Media Access
*   **Pathing:** The JSON payload provides a `src` ID. This ID maps cleanly to the site's dedicated Content Delivery Network (CDN).
*   **URL Construction:** The media is located at `https://cdn.porngifs.com/img/<src>`.
*   **Native GIF Verification:** A cURL `HEAD` request against the CDN verified that the files are served directly with the `content-type: image/gif` header. There are no MP4 conversions, WebP obfuscations, or heavy media wrappers preventing direct extraction.

## 4. Automation Strategy & Execution
*   **Security Posture:** The site does not employ aggressive anti-bot middleware (such as Cloudflare Turnstile, captchas, or complex dynamic token signing) for its API endpoints.
*   **Execution Strategy:** Due to the lack of security hurdles and the clean JSON response structure, a heavy headless browser automation suite (like Puppeteer) is completely unnecessary. High-speed, lightweight `Axios` or `fetch` requests are perfectly sufficient for massive bulk extraction.
*   **Total Randomization Methodology:** True randomization without sequential scrolling can be achieved instantly. A script only needs to generate a random integer between `0` and `39239`, bypassing the `/ajax/scrolldown` endpoint entirely to blindly hit the CDN using sequence predictions.

## 5. Direct CDN Interaction (The Recommended Standard)
While the API is theoretically accessible, executing large-scale requests against `cdn.porngifs.com` in production environments (like Replit, Heroku, or VPS) often triggers **DNS-level poisoning blocks** (resolving to `127.0.0.1`), resulting in continuous empty responses. Furthermore, Discord's internal media proxy frequently fails to process extensionless image URLs (e.g., `https://cdn.porngifs.com/img/32132`), causing the Discord Embed to render a broken or static image.

To overcome this, the bot must abandon passing URLs to Discord and instead act as a **Server-Side Media Proxy**. The recommended standard methodology utilizes deep HTTP-level spoofing:

1.  **Dynamic IP Resolution (DNS Bypass):** At runtime, use native Node.js DNS utilities (`dns.lookup`) to find the true, underlying IP address of the target (`porngifs.com`).
2.  **Host Header Spoofing:** Connect `axios` directly to the raw, resolved IP address (e.g., `https://205.234.175.175/img/32132`) rather than the domain name. Manually inject a `Host: cdn.porngifs.com` header so the receiving Cloudflare/CDN edge server routes the IP traffic to the correct virtual host bucket.
3.  **SNI Configuration:** Provide a custom `https.Agent` configured with `servername: 'cdn.porngifs.com'`. Server Name Indication (SNI) is critical during the TLS handshake; without it, the edge server cannot present the correct SSL certificate for the raw IP connection, and the secure request will fail.
4.  **ArrayBuffer Extraction:** Because Discord fails to render the raw CDN URLs reliably, download the media payload directly into a server-side `arraybuffer`.
5.  **Native Attachment Integration:** Convert the buffer into a local Discord `AttachmentBuilder` object, explicitly declaring the file extension (e.g., `animation.gif`). By passing `embed.setImage('attachment://animation.gif')`, the bot forces Discord to handle the payload as a native animated file, bypassing the Discord Image Proxy failures completely.