/*
 * GÉNÉRÉ PAR `npm run ds:tokens` — NE PAS ÉDITER.
 * Source : les feuilles de src/design-system/css/tokens et css/overrides (AD-8).
 *
 * Modifier ce fichier à la main le fait diverger du CSS sans que rien ne le signale, et
 * `npm run ds:check` échouera à la prochaine exécution.
 */
package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Immutable

/**
 * Un glyphe, en données pures : des tracés SVG sur une boîte de 24 × 24.
 *
 * `traits` se rend au TRAIT (bouts et jointures ronds) ; `plein` se rend au
 * REMPLISSAGE. Un seul glyphe a un remplissage — `play` —
 * et c'est la seule différence de rendu du jeu.
 *
 * ⚠️ La spécification en annonçait DEUX (`play` et `star`). La donnée dit un : `star`
 * porte bien un tracé fermé, mais pas de drapeau `solid`, donc le kit le rend AU TRAIT.
 * La donnée gagne — c'est elle que le web dessine.
 *
 * `epaisseur` n'est écrite que quand le glyphe s'écarte du 2,2 par défaut du kit.
 * Les épaisseurs employées : 2, 2.4, 2.6, 3.4.
 */
@Immutable
data class Glyphe(
  val traits: List<String>,
  val plein: String? = null,
  val epaisseur: Float? = null,
)

private fun paquet0(): Map<String, Glyphe> = mapOf(
    "back" to Glyphe(traits = listOf("M15 19l-7-7 7-7")),
    "forward" to Glyphe(traits = listOf("M9 5l7 7-7 7")),
    "close" to Glyphe(traits = listOf("M18 6L6 18M6 6l12 12")),
    "bell" to Glyphe(traits = listOf("M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.7 21a2 2 0 01-3.4 0")),
    "search" to Glyphe(traits = listOf("M4,11a7,7 0 1,0 14,0a7,7 0 1,0 -14,0", "M20 20l-3.5-3.5"), epaisseur = 2.4f),
    "lock" to Glyphe(traits = listOf("M7,11H17A2,2 0 0 1 19,13V19A2,2 0 0 1 17,21H7A2,2 0 0 1 5,19V13A2,2 0 0 1 7,11Z", "M8 11V8a4 4 0 018 0v3"), epaisseur = 2.4f),
    "share" to Glyphe(traits = listOf("M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8", "M16 6l-4-4-4 4", "M12 2v14")),
    "chat" to Glyphe(traits = listOf("M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z")),
    "home" to Glyphe(traits = listOf("M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z")),
    "book" to Glyphe(traits = listOf("M4 5a2 2 0 012-2h12a2 2 0 012 2v16l-8-4-8 4z")),
    "users" to Glyphe(traits = listOf("M5.6,8a3.4,3.4 0 1,0 6.8,0a3.4,3.4 0 1,0 -6.8,0", "M2 20a7 7 0 0114 0")),
    "user" to Glyphe(traits = listOf("M8.4,8a3.6,3.6 0 1,0 7.2,0a3.6,3.6 0 1,0 -7.2,0", "M4 21a8 8 0 0116 0")),
    "star" to Glyphe(traits = listOf("M12 2l3 6 6 .8-4.5 4.3 1.2 6.4L12 16.5 6.3 19.5l1.2-6.4L3 8.8 9 8z")),
    "check" to Glyphe(traits = listOf("M4 12.5l5.5 5.5L20 7"), epaisseur = 3.4f),
    "alert" to Glyphe(traits = listOf("M11.3,17a0.7,0.7 0 1,0 1.4,0a0.7,0.7 0 1,0 -1.4,0", "M12 8v5", "M10.3 3.5L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.5a2 2 0 00-3.4 0z"), epaisseur = 2.6f),
    "card" to Glyphe(traits = listOf("M4,5H20A2,2 0 0 1 22,7V17A2,2 0 0 1 20,19H4A2,2 0 0 1 2,17V7A2,2 0 0 1 4,5Z", "M2 10h20")),
    "eye" to Glyphe(traits = listOf("M9.4,12a2.6,2.6 0 1,0 5.2,0a2.6,2.6 0 1,0 -5.2,0", "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z")),
    "download" to Glyphe(traits = listOf("M12 3v12M7 11l5 5 5-5M4 20h16")),
    "trash" to Glyphe(traits = listOf("M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13")),
    "doc" to Glyphe(traits = listOf("M4 5h16v14H4z", "M4 9h16")),
)

private fun paquet1(): Map<String, Glyphe> = mapOf(
    "send" to Glyphe(traits = listOf("M5 12h14M13 6l6 6-6 6"), epaisseur = 2.6f),
    "bookmark" to Glyphe(traits = listOf("M6 3h12v18l-6-4.5L6 21z")),
    "comment" to Glyphe(traits = listOf("M4 4h16v13H8l-4 4z")),
    "dots" to Glyphe(traits = listOf("M9.8,12a2.2,2.2 0 1,0 4.4,0a2.2,2.2 0 1,0 -4.4,0", "M10.6,5a1.4,1.4 0 1,0 2.8,0a1.4,1.4 0 1,0 -2.8,0", "M10.6,19a1.4,1.4 0 1,0 2.8,0a1.4,1.4 0 1,0 -2.8,0")),
    "play" to Glyphe(traits = listOf(), plein = "M7 4 L20 12 L7 20 Z"),
    "bars" to Glyphe(traits = listOf("M4 18v-6M10 18V6M16 18v-9M22 18V3")),
    "globe" to Glyphe(traits = listOf("M12 2a9 9 0 100 18 9 9 0 000-18zM3 12h18", "M12 2a14 14 0 010 18 14 14 0 010-18z")),
    "chevron" to Glyphe(traits = listOf("M6 9l6 6 6-6")),
    "list" to Glyphe(traits = listOf("M4 6h16M4 12h16M4 18h10")),
    "calendar" to Glyphe(traits = listOf("M5,5H19A2,2 0 0 1 21,7V19A2,2 0 0 1 19,21H5A2,2 0 0 1 3,19V7A2,2 0 0 1 5,5Z", "M3 10h18M8 3v4M16 3v4")),
    "case" to Glyphe(traits = listOf("M4 7h16v13H4zM9 7V4h6v3")),
    "info" to Glyphe(traits = listOf("M3,12a9,9 0 1,0 18,0a9,9 0 1,0 -18,0", "M12 11v6M12 7.5v.5")),
    "plus" to Glyphe(traits = listOf("M12 3v18M3 12h18")),
    "heart" to Glyphe(traits = listOf("M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"), epaisseur = 2.0f),
    "repeat" to Glyphe(traits = listOf("m2 9 3-3 3 3", "M13 18H7a2 2 0 0 1-2-2V6", "m22 15-3 3-3-3", "M11 6h6a2 2 0 0 1 2 2v10"), epaisseur = 2.0f),
    "gift" to Glyphe(traits = listOf("M20 12v10H4V12", "M2 7h20v5H2z", "M12 22V7", "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z", "M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"), epaisseur = 2.0f),
    "copy" to Glyphe(traits = listOf("M11,9H20A2,2 0 0 1 22,11V20A2,2 0 0 1 20,22H11A2,2 0 0 1 9,20V11A2,2 0 0 1 11,9Z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"), epaisseur = 2.0f),
    "handshake" to Glyphe(traits = listOf("m11 17 2 2a1 1 0 1 0 3-3", "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4", "m21 3 1 11h-2", "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3", "M3 4h8"), epaisseur = 2.0f),
    "trophy" to Glyphe(traits = listOf("M6 9H4.5a2.5 2.5 0 0 1 0-5H6", "M18 9h1.5a2.5 2.5 0 0 0 0-5H18", "M4 22h16", "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22", "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22", "M18 2H6v7a6 6 0 0 0 12 0V2Z"), epaisseur = 2.0f),
    "crown" to Glyphe(traits = listOf("M11.56 3.27a.5.5 0 0 1 .88 0L15.39 8.87a1 1 0 0 0 1.52.29L21.18 5.5a.5.5 0 0 1 .8.52l-2.83 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.29z", "M5 21h14"), epaisseur = 2.0f),
)

private fun paquet2(): Map<String, Glyphe> = mapOf(
    "medal" to Glyphe(traits = listOf("M7,17a5,5 0 1,0 10,0a5,5 0 1,0 -10,0", "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15", "M11 12 5.12 2.2", "m13 12 5.88-9.8", "M8 7h8", "M12 18v-2h-.5"), epaisseur = 2.0f),
    "video" to Glyphe(traits = listOf("M4,6H14A2,2 0 0 1 16,8V16A2,2 0 0 1 14,18H4A2,2 0 0 1 2,16V8A2,2 0 0 1 4,6Z", "m16 13 5.22 3.48a.5.5 0 0 0 .78-.41V7.87a.5.5 0 0 0-.75-.43L16 10.5"), epaisseur = 2.0f),
    "image" to Glyphe(traits = listOf("M5,3H19A2,2 0 0 1 21,5V19A2,2 0 0 1 19,21H5A2,2 0 0 1 3,19V5A2,2 0 0 1 5,3Z", "M7,9a2,2 0 1,0 4,0a2,2 0 1,0 -4,0", "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"), epaisseur = 2.0f),
    "mic" to Glyphe(traits = listOf("M12,2H12A3,3 0 0 1 15,5V12A3,3 0 0 1 12,15H12A3,3 0 0 1 9,12V5A3,3 0 0 1 12,2Z", "M12 19v3", "M19 10v2a7 7 0 0 1-14 0v-2"), epaisseur = 2.0f),
    "smile" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "M8 14s1.5 2 4 2 4-2 4-2", "M9 9h.01", "M15 9h.01"), epaisseur = 2.0f),
    "pin" to Glyphe(traits = listOf("M9,10a3,3 0 1,0 6,0a3,3 0 1,0 -6,0", "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"), epaisseur = 2.0f),
    "pencil" to Glyphe(traits = listOf("M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", "m15 5 4 4"), epaisseur = 2.0f),
    "clock" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "M12 6v6l4 2"), epaisseur = 2.0f),
    "target" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "M6,12a6,6 0 1,0 12,0a6,6 0 1,0 -12,0", "M10,12a2,2 0 1,0 4,0a2,2 0 1,0 -4,0"), epaisseur = 2.0f),
    "check-circle" to Glyphe(traits = listOf("M22 11.08V12a10 10 0 1 1-5.93-9.14", "m9 11 3 3L22 4"), epaisseur = 2.0f),
    "graduation" to Glyphe(traits = listOf("M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z", "M22 10v6", "M6 12.5V16a6 3 0 0 0 12 0v-3.5"), epaisseur = 2.0f),
    "external" to Glyphe(traits = listOf("M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"), epaisseur = 2.0f),
    "save" to Glyphe(traits = listOf("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21L17 13L7 13L7 21", "M7 3L7 8L15 8"), epaisseur = 2.0f),
    "bot" to Glyphe(traits = listOf("M6,8H18A2,2 0 0 1 20,10V18A2,2 0 0 1 18,20H6A2,2 0 0 1 4,18V10A2,2 0 0 1 6,8Z", "M12 8V4H8", "M2 14h2", "M20 14h2", "M15 13v2", "M9 13v2"), epaisseur = 2.0f),
    "dashboard" to Glyphe(traits = listOf("M4,3H9A1,1 0 0 1 10,4V11A1,1 0 0 1 9,12H4A1,1 0 0 1 3,11V4A1,1 0 0 1 4,3Z", "M15,3H20A1,1 0 0 1 21,4V7A1,1 0 0 1 20,8H15A1,1 0 0 1 14,7V4A1,1 0 0 1 15,3Z", "M15,12H20A1,1 0 0 1 21,13V20A1,1 0 0 1 20,21H15A1,1 0 0 1 14,20V13A1,1 0 0 1 15,12Z", "M4,16H9A1,1 0 0 1 10,17V20A1,1 0 0 1 9,21H4A1,1 0 0 1 3,20V17A1,1 0 0 1 4,16Z"), epaisseur = 2.0f),
    "settings" to Glyphe(traits = listOf("M9,12a3,3 0 1,0 6,0a3,3 0 1,0 -6,0", "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"), epaisseur = 2.0f),
    "award" to Glyphe(traits = listOf("M6,8a6,6 0 1,0 12,0a6,6 0 1,0 -12,0", "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"), epaisseur = 2.0f),
    "arrow-up-right" to Glyphe(traits = listOf("M7 7h10v10", "M7 17 17 7"), epaisseur = 2.0f),
    "help" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"), epaisseur = 2.0f),
    "chevron-right" to Glyphe(traits = listOf("m9 18 6-6-6-6"), epaisseur = 2.0f),
)

private fun paquet3(): Map<String, Glyphe> = mapOf(
    "chevron-left" to Glyphe(traits = listOf("m15 18-6-6 6-6"), epaisseur = 2.0f),
    "chevron-up" to Glyphe(traits = listOf("m18 15-6-6-6 6"), epaisseur = 2.0f),
    "sun" to Glyphe(traits = listOf("M8,12a4,4 0 1,0 8,0a4,4 0 1,0 -8,0", "M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"), epaisseur = 2.0f),
    "moon" to Glyphe(traits = listOf("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"), epaisseur = 2.0f),
    "logout" to Glyphe(traits = listOf("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M21 12L9 12", "M16 17L21 12L16 7"), epaisseur = 2.0f),
    "login" to Glyphe(traits = listOf("M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "M15 12L3 12", "M10 17L15 12L10 7"), epaisseur = 2.0f),
    "eye-off" to Glyphe(traits = listOf("M9.88 9.88a3 3 0 1 0 4.24 4.24", "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68", "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61", "M2 2L22 22"), epaisseur = 2.0f),
    "monitor" to Glyphe(traits = listOf("M4,3H20A2,2 0 0 1 22,5V15A2,2 0 0 1 20,17H4A2,2 0 0 1 2,15V5A2,2 0 0 1 4,3Z", "M8 21L16 21", "M12 17L12 21"), epaisseur = 2.0f),
    "smartphone" to Glyphe(traits = listOf("M7,2H17A2,2 0 0 1 19,4V20A2,2 0 0 1 17,22H7A2,2 0 0 1 5,20V4A2,2 0 0 1 7,2Z", "M12 18h.01"), epaisseur = 2.0f),
    "sparkles" to Glyphe(traits = listOf("m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z", "M5 3v4", "M19 17v4", "M3 5h4", "M17 19h4"), epaisseur = 2.0f),
    "tag" to Glyphe(traits = listOf("M7,7.5a0.5,0.5 0 1,0 1,0a0.5,0.5 0 1,0 -1,0", "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"), epaisseur = 2.0f),
    "menu" to Glyphe(traits = listOf("M4 12L20 12", "M4 6L20 6", "M4 18L20 18"), epaisseur = 2.0f),
    "command" to Glyphe(traits = listOf("M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"), epaisseur = 2.0f),
    "mail" to Glyphe(traits = listOf("M4,4H20A2,2 0 0 1 22,6V18A2,2 0 0 1 20,20H4A2,2 0 0 1 2,18V6A2,2 0 0 1 4,4Z", "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"), epaisseur = 2.0f),
    "inbox" to Glyphe(traits = listOf("M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z", "M22 12L16 12L14 15L10 15L8 12L2 12"), epaisseur = 2.0f),
    "shield" to Glyphe(traits = listOf("M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"), epaisseur = 2.0f),
    "upload" to Glyphe(traits = listOf("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M12 3L12 15", "M17 8L12 3L7 8"), epaisseur = 2.0f),
    "rotate" to Glyphe(traits = listOf("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"), epaisseur = 2.0f),
    "zap" to Glyphe(traits = listOf("M13 2L3 14L12 14L11 22L21 10L12 10L13 2Z"), epaisseur = 2.0f),
    "alert-circle" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "M12 8L12 12", "M12 16L12.01 16"), epaisseur = 2.0f),
)

private fun paquet4(): Map<String, Glyphe> = mapOf(
    "x-circle" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "m15 9-6 6", "m9 9 6 6"), epaisseur = 2.0f),
    "mic-off" to Glyphe(traits = listOf("M18.89 13.23A7.12 7.12 0 0 0 19 12v-2", "M5 10v2a7 7 0 0 0 12 5", "M15 9.34V5a3 3 0 0 0-5.68-1.33", "M9 9v3a3 3 0 0 0 5.12 2.12", "M2 2L22 22", "M12 19L12 22"), epaisseur = 2.0f),
    "volume" to Glyphe(traits = listOf("M15.54 8.46a5 5 0 0 1 0 7.07", "M19.07 4.93a10 10 0 0 1 0 14.14", "M11 5L6 9L2 9L2 15L6 15L11 19L11 5Z"), epaisseur = 2.0f),
    "volume-off" to Glyphe(traits = listOf("M22 9L16 15", "M16 9L22 15", "M11 5L6 9L2 9L2 15L6 15L11 19L11 5Z"), epaisseur = 2.0f),
    "megaphone" to Glyphe(traits = listOf("m3 11 18-5v12L3 14v-3z", "M11.6 16.8a3 3 0 1 1-5.8-1.6"), epaisseur = 2.0f),
    "boxes" to Glyphe(traits = listOf("M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z", "m7 16.5-4.74-2.85", "m7 16.5 5-3", "M7 16.5v5.17", "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z", "m17 16.5-5-3", "m17 16.5 4.74-2.85", "M17 16.5v5.17", "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z", "M12 8 7.26 5.15", "m12 8 4.74-2.85", "M12 13.5V8"), epaisseur = 2.0f),
    "route" to Glyphe(traits = listOf("M3,19a3,3 0 1,0 6,0a3,3 0 1,0 -6,0", "M15,5a3,3 0 1,0 6,0a3,3 0 1,0 -6,0", "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"), epaisseur = 2.0f),
    "phone" to Glyphe(traits = listOf("M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"), epaisseur = 2.0f),
    "quote" to Glyphe(traits = listOf("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", "M8 12a2 2 0 0 0 2-2V8H8", "M14 12a2 2 0 0 0 2-2V8h-2"), epaisseur = 2.0f),
    "square" to Glyphe(traits = listOf("M5,3H19A2,2 0 0 1 21,5V19A2,2 0 0 1 19,21H5A2,2 0 0 1 3,19V5A2,2 0 0 1 5,3Z"), epaisseur = 2.0f),
    "flame" to Glyphe(traits = listOf("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"), epaisseur = 2.0f),
    "layers" to Glyphe(traits = listOf("m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z", "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65", "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"), epaisseur = 2.0f),
    "store" to Glyphe(traits = listOf("m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7", "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4", "M2 7h20", "M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"), epaisseur = 2.0f),
    "cookie" to Glyphe(traits = listOf("M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5", "M8.5 8.5v.01", "M16 15.5v.01", "M12 12v.01", "M11 17v.01", "M7 14v.01"), epaisseur = 2.0f),
    "languages" to Glyphe(traits = listOf("m5 8 6 6", "m4 14 6-6 2-3", "M2 5h12", "M7 2h1", "m22 22-5-10-5 10", "M14 18h6"), epaisseur = 2.0f),
    "enter" to Glyphe(traits = listOf("M20 4v7a4 4 0 0 1-4 4H4", "M9 10L4 15L9 20"), epaisseur = 2.0f),
    "rss" to Glyphe(traits = listOf("M4,19a1,1 0 1,0 2,0a1,1 0 1,0 -2,0", "M4 11a9 9 0 0 1 9 9", "M4 4a16 16 0 0 1 16 16"), epaisseur = 2.0f),
    "bold" to Glyphe(traits = listOf("M14 12a4 4 0 0 0 0-8H6v8", "M15 20a4 4 0 0 0 0-8H6v8Z"), epaisseur = 2.0f),
    "italic" to Glyphe(traits = listOf("M19 4L10 4", "M14 20L5 20", "M15 4L9 20"), epaisseur = 2.0f),
    "heading-2" to Glyphe(traits = listOf("M4 12h8", "M4 18V6", "M12 18V6", "M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"), epaisseur = 2.0f),
)

private fun paquet5(): Map<String, Glyphe> = mapOf(
    "heading-3" to Glyphe(traits = listOf("M4 12h8", "M4 18V6", "M12 18V6", "M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2", "M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"), epaisseur = 2.0f),
    "list-ordered" to Glyphe(traits = listOf("M4 6h1v4", "M4 10h2", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1", "M10 6L21 6", "M10 12L21 12", "M10 18L21 18"), epaisseur = 2.0f),
    "link" to Glyphe(traits = listOf("M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"), epaisseur = 2.0f),
    "code" to Glyphe(traits = listOf("M16 18L22 12L16 6", "M8 6L2 12L8 18"), epaisseur = 2.0f),
    "construction" to Glyphe(traits = listOf("M3,6H21A1,1 0 0 1 22,7V13A1,1 0 0 1 21,14H3A1,1 0 0 1 2,13V7A1,1 0 0 1 3,6Z", "M17 14v7", "M7 14v7", "M17 3v3", "M7 3v3", "M10 14 2.3 6.3", "m14 6 7.7 7.7", "m8 6 8 8"), epaisseur = 2.0f),
    "flag" to Glyphe(traits = listOf("M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22L4 15"), epaisseur = 2.0f),
    "compass" to Glyphe(traits = listOf("M2,12a10,10 0 1,0 20,0a10,10 0 1,0 -20,0", "M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"), epaisseur = 2.0f),
    "camera" to Glyphe(traits = listOf("M9,13a3,3 0 1,0 6,0a3,3 0 1,0 -6,0", "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"), epaisseur = 2.0f),
    "brain" to Glyphe(traits = listOf("M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z", "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z", "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4", "M17.599 6.5a3 3 0 0 0 .399-1.375", "M6.003 5.125A3 3 0 0 0 6.401 6.5", "M3.477 10.896a4 4 0 0 1 .585-.396", "M19.938 10.5a4 4 0 0 1 .585.396", "M6 18a4 4 0 0 1-1.967-.516", "M19.967 17.484A4 4 0 0 1 18 18"), epaisseur = 2.0f),
)

/**
 * Les 109 glyphes du système, indexés par leur nom.
 *
 * ⛔ Le kit n'en déclare que 36 dans `components/brand/Icon.d.ts` ; les 73 autres
 * viennent du site et de la console. Ils sont tous émis parce que la source est unique :
 * trier ici demanderait de savoir, glyphe par glyphe, quel écran l'appelle — et ce tri
 * périmerait au premier écran ajouté.
 */
val GLYPHES: Map<String, Glyphe> = paquet0() + paquet1() + paquet2() + paquet3() + paquet4() + paquet5()
