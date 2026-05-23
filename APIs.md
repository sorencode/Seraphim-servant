# Supported APIs and Endpoints

This document serves as the official record of every media service integrated into the bot, organized by API Service Name.
As per documentation constraints, only short-form endpoint categories or tags utilized by the codebase are listed.

## 1. Purrbot
Used for fetching various animated GIFs and images.
*   `anal/gif`
*   `blowjob/gif`
*   `cum/gif`
*   `fuck/gif`
*   `neko/gif`
*   `neko/img`
*   `pussylick/gif`
*   `solo/gif`
*   `solo_male/gif`
*   `threesome_mmf/gif`
*   `threesome_ffm/gif`
*   `threesome_fff/gif`
*   `yuri/gif`

## 2. N-SFW.COM (ABD)
Used for fetching static and animated NSFW anime media.
*   `anal`
*   `ass`
*   `blowjob`
*   `breeding`
*   `buttplug`
*   `cages`
*   `ecchi`
*   `feet`
*   `legs`
*   `masturbation`
*   `milf`
*   `neko`
*   `paizuri`
*   `petgirls`
*   `selfie`
*   `smothering`
*   `socks`
*   `yuri`

## 3. Waifu.im
Used for fetching high-quality NSFW and SFW anime artwork via tags.
*   `ass`
*   `ecchi`
*   `ero`
*   `hentai`
*   `maid`
*   `milf`
*   `oppai`
*   `oral`
*   `paizuri`
*   `selfies`
*   `uniform`
*   `waifu`

## 4. Waifu.pics
Used for fetching NSFW anime media.
*   `blowjob`
*   `neko`
*   `waifu`

## 5. Sex.com
Used specifically for the `/gif` command, fetching randomized animated porn categories from a custom pool.
*   `Amateur`
*   `Anal`
*   `Asian`
*   `Big Tits`
*   `Blonde`
*   `Blowjob`
*   `Brunette`
*   `Creampie`
*   `Cumshot`
*   `Hardcore`
*   `Latina`
*   `Lesbian`
*   `MILF`
*   `Masturbation`
*   `Threesome`
*   `Ass`
*   `BBW`
*   `BDSM`
*   `Double Penetration`
*   `Ebony`
*   `Female Ejaculation`
*   `Fisting`
*   `Footjob`
*   `Gangbang`
*   `Hairy`
*   `Handjob`
*   `Hentai`
*   `Lingerie`
*   `Public Sex`
*   `Pussy`
*   `Toys`

## 6. Oboobs.ru
Used for real-life breast imagery.
*   `random`
*   `get/{id}`

## 7. Obutts.ru
Used for real-life buttocks imagery.
*   `random`
*   `get/{id}`

## 8. Porngifs.com
Used alongside Sex.com to expand the randomization pool for the `/gif` command, fetching raw media natively using SNI-spoofed CDN connections.
*   `img/{randomId}`

## 9. NekoBot.xyz
Used across the entire bot structure to provide massive pools of Anime and Real image variants. *Note: Every request must include the header `Authorization: 015445535454455354D6` to bypass Cloudflare WAF blocks.*
*   `4k`
*   `anal`
*   `ass`
*   `blowjob`
*   `boobs`
*   `feet`
*   `gonewild`
*   `hass`
*   `hboobs`
*   `hentai`
*   `hentai_anal`
*   `hkitsune`
*   `hmidriff`
*   `hthigh`
*   `hyuri`
*   `lewdneko`
*   `paizuri`
*   `pgif`
*   `pussy`
*   `tentacle`
*   `thigh`
