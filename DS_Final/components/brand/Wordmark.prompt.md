Le mot-symbole. **Trois marques, une par surface** — la prop `brand` n'est pas décorative.

```jsx
<Wordmark size={23} />                        {/* web : « Hello ! » en dégradé */}
<Wordmark brand="rysmo" size={26} />          {/* app mobile : Rysmo */}
<Wordmark brand="signature" size={20} />      {/* la personne : Max-Morrys */}
<Wordmark brand="rysmo" size={20} night tail="#fff" />   {/* sur fond sombre */}
```

Le dégradé de `hello` reprend, dans l'ordre, les trois couleurs qui portaient « Max » : bleu, orange, teal.

**Ne confondez pas** *Rysmo*, le nom de l'application, avec le **répétiteur IA** qui vit dedans — celui-ci s'appelle « Répétiteur » par défaut et chaque personne peut le renommer. Les deux noms ont longtemps été le même ; ils ne le sont plus. Pour afficher le nom du répétiteur, lisez-le dans les préférences, ne l'écrivez jamais en dur.
