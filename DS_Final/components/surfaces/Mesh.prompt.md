Fond maillé d'un écran. Un territoire = un maillage ; l'utilisateur sait où il est avant d'avoir lu un mot.

```jsx
<div style={{position:'relative',isolation:'isolate'}}>
  <Mesh territory="transforme" />
  <div style={{position:'relative',zIndex:3}}>…</div>
</div>
```

`nuit` sert à la console d'administration et au mode sombre. Sur écran large, `size={520}`.
