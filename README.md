# Discord NSFW Media Bot

This is a lewd, explicitly NSFW Discord bot built on **Discord.js v14**. Its primary purpose is to scrape, fetch, and deliver hardcore pornographic images and animated GIFs directly into your Discord servers and DMs.

Instead of relying on a single slow database, this bot aggressively pulls media from several different adult APIs and CDNs (including NekoBot, Sex.com, Porngifs.com, Waifu.im, N-SFW.com, Purrbot, Oboobs, and Obutts) to ensure a massive, constantly refreshing variety of lewd content.

If Discord tries to block or fail an image preview, the bot downloads the raw file directly and uploads it as an attachment to guarantee you see the animation.

---

## 🔞 Available Slash Commands

The bot comes pre-loaded with a massive directory of specific fetishes, categories, and utility commands:

*   `/4k`
*   `/anal` *(Includes optional Real/Anime style filter)*
*   `/ass` *(Includes optional Real/Anime style filter)*
*   `/blowjob` *(Includes optional Real/Anime style filter)*
*   `/boobs` *(Includes optional Real/Anime style filter)*
*   `/breeding`
*   `/buttplug`
*   `/cages`
*   `/cum`
*   `/ecchi`
*   `/ero`
*   `/feet` *(Includes optional Real/Anime style filter)*
*   `/fuck`
*   `/gif` *(Randomized hardcore GIFs from massive CDN pools)*
*   `/gonewild`
*   `/help` *(Dynamic, searchable directory of all commands)*
*   `/hentai`
*   `/invite` *(Generates an OAuth2 link to add the bot)*
*   `/kitsune`
*   `/legs`
*   `/maid`
*   `/midriff`
*   `/milf`
*   `/neko`
*   `/paizuri`
*   `/petgirls`
*   `/ping` *(System diagnostics and latency metrics)*
*   `/pussy`
*   `/pussylick`
*   `/selfie`
*   `/smothering`
*   `/socks`
*   `/solo`
*   `/tentacle`
*   `/thigh` *(Includes optional Real/Anime style filter)*
*   `/threesome`
*   `/uniform`
*   `/waifu`
*   `/yuri`

*Note: All media commands are strictly restricted to NSFW-marked channels in servers. However, they will work completely unrestricted in Direct Messages (DMs) with the bot.*

---

## 🛠️ Configuration & Setup

This bot is designed to be hosted 24/7 on environments like Replit, Heroku, or a VPS. It requires specific environment variables to function correctly.

### Required Environment Variables (Secrets)
> **Note:** The use of `.env` files is strictly prohibited by the architecture. You must pass these variables directly into the process environment or via your host's secret manager.

*   `BOT_TOKEN`: Your Discord Developer Portal Bot Token.
*   `CLIENT_ID`: The unique Application ID of your bot (Required for the `@mention` intro listener and the `/invite` generator).
*   `WAIFU_IM_KEY`: The authorization token required to access the `v7` API of `waifu.im` for high-quality anime artwork.

### Optional Environment Variables
*   `TESTING_GUILD_ID`: (Optional) Provide a Discord Server ID to register experimental or in-development commands (those marked with `testOnly: true` in their script). If this variable is left blank, experimental commands will be safely ignored, preventing them from polluting the global slash command registry.

### Execution

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the application:
   ```bash
   node index.js
   ```