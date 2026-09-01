Carte de podcast ou de vidéo. La forme dit le format, et le poids est toujours affiché.

```jsx
<MediaCard format="audio" artHeight={190} titleSize={25}
  eyebrow="Podcast · épisode 1 · 6 août" title="Vendre sans budget pub, avec Fatou D."
  body="Gérante d'une boutique de cosmétiques aux Almadies."
  cost={['34:20','31 Mo','Transcription · 0 Mo']}
  actions={<><Button tone="transforme" size="sm">Écouter</Button><Button tone="quiet" size="sm">Lire la transcription</Button></>} />

<MediaCard format="video" badge="Vidéo · 16:9" eyebrow="Vidéo · 12 juillet"
  title="Trois heures avec un commerçant du marché Sandaga"
  cost={['18:04','96 Mo en HD','24 Mo en 480p']} />
```

Ne retirez jamais le poids de `cost` : c'est la seule information qui permet à quelqu'un dont le forfait est compté de décider. Pour une vidéo, donnez les deux qualités.
