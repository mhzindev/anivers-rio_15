# Convite Digital · Festa de 15 anos da Marcella Karoline

Documento de referência do planejamento. O site ainda não foi construído: este arquivo serve de base para a implementação, que começa após a aprovação.

## 1. Dados do evento

| Item | Valor |
|---|---|
| Aniversariante | Marcella Karoline |
| Data | 10 de novembro de 2026 |
| Horário | 19h |
| Local | **Chapéu de Palha** |
| Complemento do local | Recanto Estrela da Manhã |
| Endereço | R. Seis, 5, Imperatriz - MA, 65913-726 |
| Link do mapa | https://www.google.com/maps/search/?api=1&query=Chapéu+de+Palha+R.+Seis,+5,+Imperatriz+-+MA,+65913-726 |
| Código de vestimenta | Não definido (ver seção 10) |
| Música | Nenhuma (sem áudio de abertura) |

## 2. Identidade visual

**Conceito:** "Jardim de Esmeralda". A página é um jardim que se abre conforme a rolagem. O local, Chapéu de Palha, traz um toque campestre e natural, combinado com o verde esmeralda e os brilhos do vestido.

**Paleta**

| Token | Hex | Uso |
|---|---|---|
| `--esmeralda` | `#0B5D3B` | Fundo principal |
| `--musgo` | `#2F6B4F` | Planos secundários e cartões |
| `--dourado` | `#C9A96E` | Ornamentos, filetes e botões |
| `--palha` | `#E8D5A3` | Toques campestres (bege palha) |
| `--marfim` | `#FBF7EE` | Textos e superfícies claras |

**Tipografia**
- Títulos: *Cormorant Garamond* ou *Playfair Display*
- Nome da aniversariante: *Great Vibes* ou *Pinyon Script*
- Texto de apoio: *Jost* ou *Montserrat*

**Adornos e textura**
- Ramos, folhas e flores em SVG com traço dourado, que "crescem" ao entrar na seção
- Chapéu de palha como ícone recorrente (separador entre seções e no portão)
- Glitter em overlay sutil, apenas em destaques (título e botão principal)
- Pétalas em segundo plano

## 3. Tecnologia

- HTML, CSS e JavaScript puros, sem build obrigatório, abrindo direto no navegador
- **GSAP** com os plugins `ScrollTrigger` (scroll vertical com `scrub` e scroll horizontal com `pin`)
- **CSS 3D** com GSAP (`perspective`, `rotationX`, `rotationY`) para o portão e os cartões de presente
- Three.js apenas se quisermos um campo de flores ou partículas em 3D; fica opcional
- **Supabase** para RSVP e lista de presentes (cliente JavaScript com a chave pública `anon`)
- Layout responsivo, pensado primeiro para celular, com 16px de margem lateral e sem scroll horizontal fora da seção de galeria
- Respeito à preferência de "reduzir movimento" do sistema (`prefers-reduced-motion`)

## 4. Sequência de seções

| # | Seção | Efeito (GSAP / 3D) | Conteúdo |
|---|---|---|---|
| 0 | **Portão de entrada** | Portão 3D que gira ao toque (`rotationY`) e revela a página | "Toque para entrar" |
| 1 | **Hero** | Timeline de entrada; fundo com fotos em Ken Burns e overlay com glitter | "Quinze primaveras", **Marcella Karoline**, data e subtítulo personalizado com o nome do convidado |
| 2 | **Carta de boas-vindas** | Texto revelado linha a linha (`stagger`) | Mensagem curta de boas-vindas |
| 3 | **Contagem regressiva** | Números com efeito de virada | Dias, horas, minutos e segundos até 10/11/2026, 19h |
| 4 | **Nossa história** | **Scroll horizontal com `pin`**; fotos avançam por idade | Cartões polaroid: infância → 15 anos → hoje |
| 5 | **Local e horário** | Parallax nas fotos do local | Nome do local, endereço, horário e botão "Abrir no Google Maps" |
| 6 | **Programação** | Itens acendem um a um conforme a rolagem | Chegada, cerimônia, valsa, jantar e festa |
| 7 | **Vestimenta / cores** | Amostras de verde esmeralda e dourado que se espalham ao rolar | Conteúdo a definir (ver seção 10) |
| 8 | **Lista de presentes** | Cartões 3D que viram ao toque | Itens da lista (seção 6), com status "já escolhido" e chave Pix (seção 7) |
| 9 | **Confirmação de presença (RSVP)** | Formulário com entrada escalonada e feedback animado | Nome, sim ou não, acompanhantes, restrições e mensagem |
| 10 | **Página de obrigado** | Chuva de pétalas ou confete dourado | Agradecimento, contagem regressiva e botão "Adicionar ao calendário" (.ics) |
| 11 | **Rodapé** | Fixo | Assinatura da família |

### Galeria (seção 1 e seção 4)
- Espaço para as fotos já reservado no layout, sem imagens reais por enquanto
- Ordem sugerida: infância → 5 anos → 10 anos → 15 anos → hoje
- Substituição das imagens placeholder pelas fotos reais em uma etapa posterior

### Local (seção 5)
- Fotos do Chapéu de Palha: espaço reservado, a serem adicionadas depois
- Botão de mapa apontando para o endereço acima

## 5. Confirmação de presença (RSVP)

Campos do formulário:
- Nome completo (obrigatório)
- Vai comparecer? (sim ou não)
- Número de acompanhantes (0 a 5)
- Restrições alimentares (opcional)
- Mensagem para a aniversariante (opcional)

Após o envio, o convidado é levado à página de obrigado.

## 6. Lista de presentes

| Categoria | Item | Tamanho / detalhe |
|---|---|---|
| Beleza | Perfume ou creme de pele | — |
| Joias | Colar ou pulseira, dourada ou prata | Aço inoxidável ou prata 925 |
| Joias | Anel | Tamanho 18 |
| Cabelo | Produtos e acessórios de cabelo | — |
| Acessórios | Bolsa de lado | — |
| Roupas | Roupa | Tamanho 38 / M |
| Calçados | Sandália aberta | Tamanho 36 |
| Calçados | Sandália fechada | Tamanho 37 |

- Tamanhos visíveis para os convidados (confirmado)
- Cada item tem o botão **"Eu escolho este"**, que marca o presente como escolhido e evita que dois convidados comprem o mesmo item.

## 7. Pagamento via Pix

- Chave Pix: **99988036213** (telefone), exibida na seção de presentes com botão de copiar
- Seção só com botão de copiar, sem campos de valor

## 8. Modelo de dados (Supabase)

**Tabela `rsvps`**

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid | Chave primária, gerada automaticamente |
| `nome` | text | Obrigatório |
| `confirmado` | boolean | `true` para sim, `false` para não |
| `acompanhantes` | int | 0 a 5 |
| `restricoes` | text | Opcional |
| `mensagem` | text | Opcional |
| `criado_em` | timestamptz | Padrão `now()` |

**Tabela `presentes`**

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid | Chave primária |
| `titulo` | text | Nome do item |
| `categoria` | text | Beleza, Joias, Cabelo, Acessórios, Roupas, Calçados |
| `detalhe` | text | Tamanho ou observação |
| `escolhido_por` | text | Nulo enquanto estiver disponível |
| `escolhido_em` | timestamptz | Nulo enquanto estiver disponível |

**Segurança (RLS)**
- `rsvps`: convidados podem **inserir**; leitura restrita à família (painel autenticado)
- `presentes`: leitura pública; atualização apenas do campo "escolhido" (via função controlada, para que ninguém altere os outros campos)
- A chave `service_role` nunca vai para o navegador

## 9. Personalização por convidado

- Link com o nome do convidado, por exemplo `?nome=Ana`, que preenche o subtítulo do hero
- Sem o parâmetro, o hero exibe uma versão genérica

## 10. Pendências

- **Código de vestimenta:** não foi definido. A seção 7 foi reservada, mas o conteúdo depende da sua decisão. Sugestão: "Verde esmeralda e tons de verde e dourado", que combina com o vestido. Também podemos deixar a seção fora do convite.
- **Recanto Estrela da Manhã:** foi mantido como complemento do local. Se for o nome da propriedade e não quiser exibi-lo, removo essa linha.
- Fotos reais para a galeria e para o local (etapa posterior)

## 11. Próximos passos

1. Aprovação deste planejamento, com a decisão sobre o código de vestimenta
2. Estrutura base do projeto, com HTML, CSS e JavaScript, GSAP e cliente Supabase
3. Criação das tabelas e políticas de segurança no Supabase
4. Construção das seções na ordem da seção 4
5. Integração de RSVP e lista de presentes
6. Página de obrigado e testes em celular
