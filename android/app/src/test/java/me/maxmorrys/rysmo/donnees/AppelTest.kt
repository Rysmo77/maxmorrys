package me.maxmorrys.rysmo.donnees

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE DÉCODAGE DU PROTOCOLE — la moitié de `Appel` qui n'a pas besoin de réseau.
 *
 * `lire()` est séparé du transport EXPRÈS : c'est là que vivent le relais mort, la table des
 * codes et l'ordre `result` / `data`, et aucun des trois ne se teste avec un serveur.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class AppelTest {

    private fun appel() = Appel(
        config = Configuration(),
        jetons = { null },
        reseau = { EtatReseau.INDETERMINE },
    )

    private fun erreurDe(statut: Int, succes: Boolean, corps: String): ErreurAppel = try {
        appel().lire("appMoi", statut, succes, corps)
        fail("cette réponse aurait dû lever")
        error("inatteignable")
    } catch (erreur: ErreurAppel) {
        erreur
    }

    // ── LE RELAIS MORT ────────────────────────────────────────────────────────────────

    @Test
    fun `du HTML nomme le relais mort au lieu de se deguiser en panne reseau`() {
        /*
         * ⛔ LE CAS QUI A COÛTÉ LE PAIEMENT DU CLUB. Un nom absent de `MIGRATED` part au relais
         * vers Cloud Functions, où plus rien n'est déployé : Google répond sa page HTML
         * « 404 Page not found ». Un décodeur naïf lève une erreur de syntaxe, qui se présente
         * comme une panne de réseau — et quelqu'un ira vérifier son forfait avant de soupçonner
         * une liste de configuration.
         */
        val erreur = erreurDe(404, false, "<!DOCTYPE html><html><title>Error 404</title>")
        assertEquals(CodeErreur.INTERNAL, erreur.code)
        assertTrue(erreur.message!!.contains("MIGRATED"))
        assertEquals("Le serveur a répondu quelque chose d'inattendu.", erreur.motif)
    }

    @Test
    fun `un corps vide est aussi un corps illisible`() {
        assertEquals(CodeErreur.INTERNAL, erreurDe(200, true, "").code)
    }

    // ── LA TABLE DES CODES ────────────────────────────────────────────────────────────

    @Test
    fun `le serveur ecrit MAJUSCULES_SOULIGNEES, jamais la forme a tirets`() {
        /* ⚠️ Un client qui comparerait à `resource-exhausted` ne reconnaîtrait RIEN, et tous
           les messages d'erreur deviendraient inexploitables sans qu'aucune exception ne se
           produise (`oncall.ts:60-62`). */
        assertEquals(CodeErreur.RESOURCE_EXHAUSTED, CodeErreur.depuisLeStatut("RESOURCE_EXHAUSTED"))
        assertEquals(CodeErreur.PERMISSION_DENIED, CodeErreur.depuisLeStatut("PERMISSION_DENIED"))
        assertEquals(CodeErreur.INCONNU, CodeErreur.depuisLeStatut("QUELQUE_CHOSE"))
        assertEquals(CodeErreur.INCONNU, CodeErreur.depuisLeStatut(null))
    }

    @Test
    fun `already-exists est branchable — c est le trou du port`() {
        /*
         * ⛔ LE PORT NE PORTAIT PAS CE CODE. Le serveur le lève sur trois des cinq callables de
         * PAIEMENT. Rien ne cassait — il retombait sur `inconnu` et le message du serveur
         * s'affichait — mais le client ne pouvait pas BRANCHER dessus, alors que c'est
         * précisément « tu es déjà membre actif du Club », qui doit mener ailleurs qu'à un
         * écran d'erreur.
         */
        val erreur = erreurDe(
            409, false,
            """{"error":{"status":"ALREADY_EXISTS","message":"Tu es déjà membre actif du Club."}}""",
        )
        assertEquals(CodeErreur.ALREADY_EXISTS, erreur.code)
        /* Et son motif est CELUI DU SERVEUR : un motif générique détruirait l'information. */
        assertEquals("Tu es déjà membre actif du Club.", erreur.motif)
        assertFalse(erreur.reprenable)
    }

    @Test
    fun `le message du serveur est prefere quand il existe`() {
        /* Les handlers écrivent en français POUR ÊTRE LUS : « Tu n'es pas inscrite à cette
           formation. » (`marquerLecon.ts:62`). */
        val erreur = erreurDe(400, false, """{"error":{"status":"FAILED_PRECONDITION","message":"Ton profil n'a pas de nom affiché."}}""")
        assertEquals("Ton profil n'a pas de nom affiché.", erreur.motif)
    }

    @Test
    fun `un code technique recoit un motif ecrit pour etre lu`() {
        val erreur = erreurDe(401, false, """{"error":{"status":"UNAUTHENTICATED","message":"Authentification requise."}}""")
        assertEquals("Ta session a expiré.", erreur.motif)
        /* La reprise passe par la reconnexion, pas par un bouton « Réessayer ». */
        assertFalse(erreur.reprenable)
    }

    @Test
    fun `les details de resource-exhausted sont conserves`() {
        /* C'est le seul endroit du serveur qui remplit `details`, et il le fait pour que le
           client PROPOSE L'ACHAT plutôt qu'un mur (`lib/rysmo-quota.ts:231-244`). */
        val erreur = erreurDe(
            429, false,
            """{"error":{"status":"RESOURCE_EXHAUSTED","message":"Quota atteint.","details":{"reason":"daily_limit","dailyLimit":10,"upgradeUrl":"/mon-espace/rysmo-store"}}}""",
        )
        assertEquals(CodeErreur.RESOURCE_EXHAUSTED, erreur.code)
        assertEquals("daily_limit", erreur.details!!["reason"]!!.jsonPrimitive.content)
    }

    @Test
    fun `un HTTP non 2xx sans corps error ne recoit pas de raison inventee`() {
        val erreur = erreurDe(503, false, "{}")
        assertEquals(CodeErreur.INCONNU, erreur.code)
        assertEquals("Le serveur a refusé la demande.", erreur.motif)
        assertTrue(erreur.reprenable)
    }

    // ── L'ENVELOPPE ───────────────────────────────────────────────────────────────────

    @Test
    fun `result est lu, et data ne reste qu un repli`() {
        /* ⚠️ `callableResult` n'écrit QUE `result` : aucun chemin du Worker ne produit une
           enveloppe `data`. Le repli protège d'un retour au SDK Firebase ; construire quoi que
           ce soit qui SUPPOSE `data` serait faux. */
        val charge = appel().lire("appMoi", 200, true, """{"result":{"vue":null,"releveA":"2026-09-05T00:00:00Z"}}""")
        assertEquals("2026-09-05T00:00:00Z", (charge as JsonObject)["releveA"]!!.jsonPrimitive.content)

        val repli = appel().lire("appMoi", 200, true, """{"data":{"vue":null,"releveA":"x"}}""")
        assertTrue(repli is JsonObject)
    }

    @Test
    fun `un handler qui ne renvoie rien produit result null, pas un corps vide`() {
        assertEquals(JsonNull, appel().lire("appMoi", 200, true, """{"result":null}"""))
    }

    // ── LE NOM DE LA CALLABLE ─────────────────────────────────────────────────────────

    @Test(expected = IllegalArgumentException::class)
    fun `un nom avec une barre oblique n est pas une callable`() {
        /* Le routeur refuse tout nom contenant un « / » (`index.ts:87`) : `/app/moi` est un
           404, seul `/appMoi` est une callable. Le dire ici évite un aller-retour pour
           l'apprendre. */
        appel().appelerBrut("app/moi", JsonObject(emptyMap()))
    }

    // ── LA CONFIGURATION ──────────────────────────────────────────────────────────────

    @Test
    fun `une construction incomplete nomme ce qui manque et ne propose pas de reprise`() {
        val incomplet = Appel(
            config = Configuration(valeursDeConstruction = mapOf("FIREBASE_API_KEY" to null, "FIREBASE_APP_ID" to "ok")),
            jetons = { null },
            reseau = { EtatReseau.INDETERMINE },
        )
        try {
            incomplet.appelerBrut("appMoi")
            fail("aurait dû lever avant tout réseau")
        } catch (erreur: ErreurAppel) {
            assertEquals(CodeErreur.FAILED_PRECONDITION, erreur.code)
            assertTrue(erreur.motif.contains("FIREBASE_API_KEY"))
            assertFalse(erreur.motif.contains("FIREBASE_APP_ID"))
            /* ⛔ Le port affichait « Réessayer » sur cette panne-là, avec une lambda VIDE. */
            assertFalse(erreur.reprenable)
        }
    }
}
