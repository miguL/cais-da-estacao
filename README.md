# Armazéns — Estrada da Estação, Loulé · micro-site

Site 100% estático (HTML + CSS + JS). Abre `index.html` através de um servidor (os módulos JS e o modelo 3D não carregam com `file://`).

## Ver localmente

```bash
cd armazens-estacao
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicar

**GitHub Pages:** pôr o conteúdo desta pasta na raiz do repositório → Settings → Pages → Branch `main`, pasta `/ (root)`. O ficheiro `.nojekyll` já está incluído.

**Render:** New → Static Site → Publish directory `.` (sem build command).

## Estrutura

```
index.html          página
css/style.css       estilos (paleta RAL 7022, madeira, betão, branco)
js/main.js          panorama, galeria, plantas com zoom, carregamento diferido do 3D
js/viewer.js        visualizador three.js (luz, céu, vistas)
vendor/three/       three.js r187 local (sem CDN) + GLTFLoader, OrbitControls, RoomEnvironment
modelo/armazens.glb modelo 3D
imagens/, plantas/  originais; thumbs/ = versões leves geradas para a página
```

## Por preencher

Nada por preencher. Logótipos: `imagens/make_logo_escuro.png` (fundo claro, barra de topo) e `imagens/make_logo.png` (original, rodapé escuro).

## Afinar o 3D (`js/viewer.js`)

- `SUN_AZIMUTH` / `SUN_ELEV` — direção do sol (graus a partir do norte; norte = −Z).
- `VIEWS` — posições das vistas Aérea / Rua / Entrada / Planta (relativas ao centro dos armazéns).
