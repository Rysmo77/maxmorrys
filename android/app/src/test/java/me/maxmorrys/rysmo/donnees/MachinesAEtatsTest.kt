package me.maxmorrys.rysmo.donnees

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES TRANSITIONS — quatre interdits côté vue, deux côté session, et aucun n'est un détail.
 *
 * Chacun de ces interdits a une conséquence VISIBLE, et c'est pour ça qu'ils sont testés :
 * un clignotement, un bouton qui semble ne rien faire, un écran de démonstration qui masque
 * une panne, ou quelqu'un de connecté renvoyé vers la connexion.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class MachinesAEtatsTest {

    private val provenance = Provenance(Source.SERVEUR, "2026-09-05T00:00:00Z")
    private val servie = Etat.Servie("x", provenance)
    private val vide = Etat.Vide(provenance, SensDuVide.SANS_ACCES)
    private val panne = Etat.Panne("Le serveur ne répond pas.", CodeErreur.UNAVAILABLE, reprenable = true)
    private val panneMorte = Etat.Panne("Configuration incomplète.", CodeErreur.FAILED_PRECONDITION, reprenable = false)

    @Test
    fun `servie ne retombe pas en charge — c est le clignotement`() {
        assertFalse(servie.autorise(Etat.Charge))
    }

    @Test
    fun `une panne repart par charge, jamais directement en servie`() {
        /* L'écran doit VOIR que quelque chose repart, sinon « Réessayer » se comporte comme
           s'il n'avait rien fait. */
        assertFalse(panne.autorise(servie))
        assertFalse(panne.autorise(vide))
        assertTrue(panne.autorise(Etat.Charge))
    }

    @Test
    fun `la replique ne masque jamais une reponse arrivee ni une panne`() {
        /* ⛔ « Masquer un échec par du contenu de démonstration ferait croire l'application en
           bon état alors qu'elle ne lit rien. » */
        val replique = Etat.Replique("demo", Provenance(Source.REPLIQUE, "2026-09-05T00:00:00Z"))
        assertFalse(servie.autorise(replique))
        assertFalse(vide.autorise(replique))
        assertFalse(panne.autorise(replique))
        /* En revanche, combler un catalogue jamais lu avec un exemple reste permis. */
        assertTrue(Etat.Charge.autorise(replique))
    }

    @Test
    fun `une panne sans reprise est terminale`() {
        assertFalse(panneMorte.autorise(Etat.Charge))
        assertFalse(panneMorte.autorise(servie))
    }

    @Test
    fun `un succes de cache va droit a servie, sans passer par charge`() {
        assertTrue(Etat.Restauration.autorise(servie))
        assertTrue(Etat.Restauration.autorise(vide))
    }

    // ── LA SESSION ────────────────────────────────────────────────────────────────────

    @Test
    fun `restauration n est jamais reatteinte`() {
        /* ⚠️ C'est l'état d'AVANT le premier verdict. Y revenir ferait re-clignoter
           l'application au milieu d'une session ouverte. */
        val connectee = Session.Connectee("u1", "a@b.c", "Aïssatou")
        assertFalse(connectee.autorise(Session.Restauration))
        assertFalse(Session.Anonyme.autorise(Session.Restauration))
    }

    @Test
    fun `nonConfiguree est terminale`() {
        val morte = Session.NonConfiguree("Configuration de construction incomplète : FIREBASE_API_KEY.")
        assertFalse(morte.autorise(Session.Anonyme))
        assertFalse(morte.autorise(Session.Connectee("u1", null, null)))
        assertTrue(morte.autorise(morte))
    }

    @Test
    fun `on va et vient entre anonyme et connectee`() {
        val connectee = Session.Connectee("u1", null, null)
        assertTrue(Session.Restauration.autorise(connectee))
        assertTrue(Session.Restauration.autorise(Session.Anonyme))
        assertTrue(connectee.autorise(Session.Anonyme))
        assertTrue(Session.Anonyme.autorise(connectee))
    }

    @Test
    fun `l uid ne sort que d une session connectee`() {
        assertEquals("u1", Session.Connectee("u1", null, null).uid)
        assertEquals(null, Session.Restauration.uid)
        assertEquals(null, Session.Anonyme.uid)
    }

    // ── LES MOTIFS ────────────────────────────────────────────────────────────────────

    @Test
    fun `une panne reprenable et une panne morte se distinguent dans l etat, pas dans l ecran`() {
        assertTrue(estReprenable(CodeErreur.UNAVAILABLE))
        assertTrue(estReprenable(CodeErreur.DEADLINE_EXCEEDED))
        assertFalse(estReprenable(CodeErreur.PERMISSION_DENIED))
        assertFalse(estReprenable(CodeErreur.NOT_FOUND))
        assertFalse(estReprenable(CodeErreur.RESOURCE_EXHAUSTED))
        assertFalse(estReprenable(CodeErreur.ALREADY_EXISTS))
    }
}
