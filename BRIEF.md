# Micro-site "Armazéns – Estrada da Estação, Loulé" — material e instruções

Material preparado para construir um site estático (GitHub Pages ou Render). Falta só a página.

## Conteúdo da pasta

- `modelo/armazens.glb` — modelo 3D leve (8 MB) para o visualizador no browser.
  - Unidades em metros, eixo Y para cima (glTF padrão).
  - Centro do terreno aproximadamente em x = 20, z = -20 (no Blender: x = 20, y = 20). Raio útil ~125 m.
  - Cores planas (sem texturas). Sem câmaras nem luzes: a página tem de criar a luz (sol de sudeste, manhã) e o céu.
  - Inclui os 4 armazéns (A–D) e a portaria, estacionamento, Rua Nova, N396, moradia vizinha, árvores e 6 viaturas.
- `imagens/` — renders aprovados (JPG):
  - `armazens_loule_panorama_rua_com_alfarrobeira.jpg` e `..._sem_alfarrobeira.jpg` (2560×1100) — vista ampla da rua; boa para o topo da página.
  - `armazens_loule_v2_aerea.jpg`, `_rua`, `_detalhe`, `_entrada`, `_poente` (1920×1080).
- `plantas/` — folhas do projeto de arquitetura submetido à CM Loulé (JPG, 150 dpi, A3):
  - `folha-05.jpg` — planta do piso e quadro de áreas
  - `folha-07.jpg` — cortes
  - `folha-08.jpg` — alçados e legenda de materiais
  - `folha-02.jpg` — implantação sobre levantamento topográfico (título a confirmar ao abrir)
  - `folha-06.jpg` — planta de cobertura (título a confirmar ao abrir)

## O que a página deve ter

1. Topo com o panorama da rua e o nome do projeto.
2. Visualizador 3D interativo (rodar, aproximar; funcionar no telemóvel).
3. Galeria com os renders.
4. Plantas com zoom.
5. Ficha do projeto: 4 armazéns + portaria, Loulé; materiais: chapa ondulada RAL 7022, painéis Viroc, ripado de madeira, alumínio anodizado, muros RAL 7038.

## Estilo pedido

"Vibe" de arquitetura, obra e projeto: aspeto de folha de projeto / gabinete de arquitetura. Paleta tirada do edifício: cinza RAL 7022 (#4E4C46), madeira, betão, branco. Tipografia sóbria, linhas finas, legendas tipo carimbo de desenho.

## Requisitos técnicos

- Site 100% estático (HTML, CSS, JS), sem servidor; caminhos relativos para funcionar em GitHub Pages.
- Visualizador com three.js (GLTFLoader + OrbitControls), ficheiros incluídos na pasta, sem depender de CDN se possível.
- Página leve: carregar o modelo só quando a secção 3D ficar visível.

## Notas

- As imagens são uma visualização, não um documento do projeto: muro baixo junto à rua, entradas, moradia vizinha e viaturas são aproximações.
- Em falta: nome comercial do projeto, contactos e logótipo a mostrar — `[NOME DO PROJETO]`, `[CONTACTO]`, `[LOGÓTIPO]`.
