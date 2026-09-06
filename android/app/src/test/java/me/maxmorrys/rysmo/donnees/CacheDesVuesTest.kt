package me.maxmorrys.rysmo.donnees

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES DEUX DÉFAUTS MESURÉS DU CACHE DU PORT — et la preuve qu'ils ne sont plus là.
 *
 * Ces deux cas ne sont pas hypothétiques : ils ont été relus dans `git 9c22076:mobile/donnees/
 * vue.ts`. Le premier coûtait un appel de plus sur un forfait compté ; le second faisait
 * MENTIR un nombre sur sa date, ce qui est la seule chose que tout ce dispositif existe pour
 * empêcher.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class CacheDesVuesTest {

    /** Une horloge monotone qu'on avance à la main : la fenêtre se teste sans attendre 30 s. */
    private class Horloge(var ms: Long = 0) : () -> Long {
        override fun invoke(): Long = ms
    }

    // ── 1 · LA CLÉ EST CANONIQUE ───────────────────────────────────────────────────────

    @Test
    fun `deux ordres de parametres donnent la meme cle`() {
        /*
         * ⛔ LE DÉFAUT EXACT DU PORT. `vue.ts:47` faisait un `JSON.stringify` direct, qui
         * PRÉSERVE L'ORDRE D'INSERTION. `{onglet, id}` et `{id, onglet}` produisaient deux
         * clés, donc deux entrées, donc un appel de plus — un doublon silencieux, masqué par
         * le fait que les hooks construisaient leurs littéraux dans un ordre stable.
         */
        val premier = buildJsonObject {
            put("onglet", JsonPrimitive("membre"))
            put("id", JsonPrimitive("x"))
        }
        val second = buildJsonObject {
            put("id", JsonPrimitive("x"))
            put("onglet", JsonPrimitive("membre"))
        }

        assertEquals(
            CacheDesVues.cle("u1", "appClubListe.membre", premier),
            CacheDesVues.cle("u1", "appClubListe.membre", second),
        )
    }

    @Test
    fun `le tri descend dans les objets imbriques`() {
        /* Trier le premier niveau seulement suffirait aujourd'hui — les paramètres du produit
           sont plats. La canonicité serait alors une propriété des appels d'aujourd'hui, pas
           de la fonction, et le premier paramètre imbriqué la perdrait en silence. */
        val premier = buildJsonObject {
            put("cible", buildJsonObject { put("type", JsonPrimitive("membre")); put("id", JsonPrimitive("a")) })
        }
        val second = buildJsonObject {
            put("cible", buildJsonObject { put("id", JsonPrimitive("a")); put("type", JsonPrimitive("membre")) })
        }
        assertEquals(CacheDesVues.cle("u1", "x", premier), CacheDesVues.cle("u1", "x", second))
    }

    @Test
    fun `un tableau garde son ordre`() {
        /* Un objet n'a pas d'ordre ; un tableau EN PORTE un. Les trier serait perdre une
           information, pas la normaliser. */
        val a = buildJsonObject { put("l", buildJsonArray { add(JsonPrimitive("b")); add(JsonPrimitive("a")) }) }
        val b = buildJsonObject { put("l", buildJsonArray { add(JsonPrimitive("a")); add(JsonPrimitive("b")) }) }
        assertTrue(CacheDesVues.cle(null, "x", a) != CacheDesVues.cle(null, "x", b))
    }

    @Test
    fun `une vue appartient a un compte`() {
        assertTrue(CacheDesVues.cle("u1", "appMoi") != CacheDesVues.cle("u2", "appMoi"))
    }

    // ── 2 · L'ESTAMPILLE DU SERVEUR SURVIT AU CACHE ────────────────────────────────────

    @Test
    fun `le chemin cache rend l estampille du SERVEUR, pas l horloge du telephone`() {
        /*
         * ⛔ LE DÉFAUT LE PLUS GRAVE DU PORT. Sur le chemin FRAIS, la provenance venait de
         * `reponse.releveA` — la date du serveur. Mais l'entrée stockait `Date.now()`
         * (`vue.ts:89`) et `depuisCache` reconstruisait la provenance depuis CETTE valeur
         * (`:111`). Le même écran produisait donc deux provenances de nature différente selon
         * qu'il avait touché le réseau, et sur un téléphone à l'heure fausse un nombre servi
         * du cache mentait sur sa date.
         *
         * On avance ici l'horloge LOCALE de dix secondes entre la pose et la lecture : si
         * l'estampille en dépendait d'une façon ou d'une autre, elle bougerait.
         */
        val horloge = Horloge(1_000)
        val cache = CacheDesVues(horloge = horloge)
        val duServeur = "2026-09-05T08:14:32.101Z"

        cache.poser(CacheDesVues.cle("u1", "appMoi"), "appMoi", JsonPrimitive("charge"), duServeur)
        horloge.ms += 10_000

        val entree = cache.lire(CacheDesVues.cle("u1", "appMoi"))
        assertNotNull(entree)
        assertEquals(duServeur, entree!!.releveA)
        /* Et les deux rôles sont bien SÉPARÉS : la date d'insertion existe, elle est locale,
           et elle ne prétend pas être l'estampille du serveur. */
        assertEquals(1_000L, entree.poseeA)
    }

    @Test
    fun `la fenetre se mesure sur l horloge locale, jamais sur l estampille du serveur`() {
        val horloge = Horloge(0)
        val cache = CacheDesVues(fenetreMs = 30_000, horloge = horloge)
        val cle = CacheDesVues.cle("u1", "appMoi")

        /* Une estampille serveur DÉLIBÉRÉMENT vieille : si la péremption la lisait, l'entrée
           serait périmée d'emblée. Ce sont deux mesures, et elles ne se confondent pas. */
        cache.poser(cle, "appMoi", JsonPrimitive("x"), "2020-01-01T00:00:00.000Z")

        horloge.ms = 29_999
        assertNotNull(cache.lire(cle))
        horloge.ms = 30_000
        assertNull(cache.lire(cle))
    }

    // ── 3 · CE QU'UNE ÉCRITURE PÉRIME, DEPUIS LE CONTRAT ───────────────────────────────

    @Test
    fun `marquerLecon perime les quatre vues que le contrat lui donne`() {
        val cache = CacheDesVues(horloge = Horloge(0))
        val vues = listOf("appEspace", "appLecon", "appCours", "appCertificats", "appMoi", "appClub")
        vues.forEach { cache.poser(CacheDesVues.cle("u1", it), it, JsonPrimitive("x"), "2026-09-05T00:00:00Z") }

        assertEquals(4, cache.perimerApres("marquerLecon"))
        assertNull(cache.lire(CacheDesVues.cle("u1", "appEspace")))
        /* Ce qui n'est pas périmé reste : une invalidation trop large annule le cache. */
        assertNotNull(cache.lire(CacheDesVues.cle("u1", "appMoi")))
    }

    @Test
    fun `bloquerMembre perime aussi les trois onglets de appClubListe`() {
        /* Bloquer vaut sur TOUT le Club : croiser le même nom sur une discussion la minute
           d'après annulerait le geste, et le cache de 30 s le ferait. */
        val cache = CacheDesVues(horloge = Horloge(0))
        val vues = Perime.PAR_ECRITURE.getValue("bloquerMembre")
        vues.forEach { cache.poser(CacheDesVues.cle("u1", it), it, JsonPrimitive("x"), "2026-09-05T00:00:00Z") }

        assertEquals(5, vues.size)
        assertEquals(5, cache.perimerApres("bloquerMembre"))
        assertEquals(0, cache.taille)
    }

    @Test(expected = IllegalStateException::class)
    fun `une ecriture inconnue du contrat refuse de perimer en silence`() {
        CacheDesVues(horloge = Horloge(0)).perimerApres("uneEcritureQuiNExistePas")
    }

    // ── 4 · LE VIDE, SES TROIS SENS, ET SA DATE ────────────────────────────────────────

    @Test
    fun `un tableau vide et un null sont vides, un objet ne l est pas`() {
        assertTrue(estVide(JsonNull))
        assertTrue(estVide(JsonArray(emptyList())))
        assertTrue(!estVide(buildJsonObject { put("a", JsonPrimitive(1)) }))
    }

    /**
     * ⛔ LE DÉFAUT QUE CETTE VÉRIFICATION EXISTE POUR EMPÊCHER FERMAIT LA PORTE À QUELQU'UN
     * QUI A LA CLÉ.
     *
     * Les neuf vues du Club déclarent `vueNulle: sansAcces` — juste, parce que chacune
     * commence par « pas d'abonnement, `vue: null` ». Mais le MÊME handler rend `vue: []`
     * quelques lignes plus bas quand l'abonnement est actif et la liste vide. Appliquer là
     * le sens du refus affichait l'écran verrouillé sur l'agenda d'un membre sans séance à
     * venir, sur son fil au premier jour, sur ses discussions avant la première.
     */
    @Test
    fun `un tableau vide n'est jamais un refus d'acces`() {
        assertEquals(
            SensDuVide.SANS_ACCES,
            sensDuVideServi("appClubAgenda", JsonNull),
        )
        assertEquals(
            SensDuVide.SANS_DONNEE,
            sensDuVideServi("appClubAgenda", JsonArray(emptyList())),
        )
        assertNull(sensDuVideServi("appClubAgenda", buildJsonObject { put("a", JsonPrimitive(1)) }))
    }

    @Test
    fun `les trois sens du vide viennent du contrat, pas de l ecran`() {
        /* ⛔ Le port aplatissait les trois en une phase unique. « Le Club est réservé aux
           membres » et « tu n'as encore rien ici » s'affichaient pareil. */
        assertEquals(SensDuVide.SANS_ACCES, sensDuVide("appClub"))
        assertEquals(SensDuVide.SANS_DONNEE, sensDuVide("appMoi"))
        assertEquals(SensDuVide.JAMAIS, sensDuVide("appCours"))
    }

    @Test(expected = IllegalStateException::class)
    fun `une vue hors contrat n a pas de sens du vide`() {
        sensDuVide("appQuelqueChose")
    }

    // ── 5 · LA BORNE ───────────────────────────────────────────────────────────────────

    @Test
    fun `le cache ne croit pas sans fin`() {
        val cache = CacheDesVues(plafond = 4, horloge = Horloge(0))
        repeat(10) { cache.poser(CacheDesVues.cle("u1", "appFormation", buildJsonObject { put("slug", JsonPrimitive("f$it")) }), "appFormation", JsonPrimitive("x"), "2026-09-05T00:00:00Z") }
        assertEquals(4, cache.taille)
    }

    @Test
    fun `vider efface tout — une vue appartient a un compte, pas a un appareil`() {
        val cache = CacheDesVues(horloge = Horloge(0))
        cache.poser(CacheDesVues.cle("u1", "appMoi"), "appMoi", JsonPrimitive("x"), "2026-09-05T00:00:00Z")
        cache.vider()
        assertEquals(0, cache.taille)
    }
}
