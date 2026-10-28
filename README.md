# Barbearia Dom Bigode

Site de uma barbearia fictícia que resolve um problema comum: o cliente quer saber preço e horário sem precisar mandar três mensagens. Ele marca os serviços, vê o total na hora e abre o WhatsApp já com o pedido escrito.

**Site no ar:** https://barbearia-dom-bigode-one.vercel.app/

![Captura de tela do site](docs/screenshot.png)

_Troque a imagem acima por um print real do site publicado (crie a pasta `docs/` e salve o arquivo como `screenshot.png`)._

## O que o site faz

- Mostra se a barbearia está aberta agora, usando o fuso de São Paulo.
- Calcula o total dos serviços marcados.
- Grava o agendamento (nome, telefone, serviços, dia e horário) num banco de dados Supabase.
- Mostra só horários válidos: de 30 em 30 minutos, dentro do expediente, sem datas passadas, e com os já reservados em cinza.
- Valida nome e telefone (formato brasileiro, com DDD) e explica o que corrigir.
- Monta uma mensagem de agendamento e abre o WhatsApp com ela.
- Destaca o dia de hoje na tabela de horários.
- Funciona em celular e computador, respeita `prefers-reduced-motion` e tem foco visível para teclado.

## Regras de agendamento

- Um agendamento por dia e horário (regra no banco de dados).
- Atendimento: terça a sexta, 9h às 20h; sábado, 8h às 18h; domingo e segunda fechado. O último horário é 30 minutos antes de fechar.
- Os visitantes só conseguem criar agendamentos. Quem lê os dados é o dono, pelo painel do Supabase. O site só consulta quais horários estão ocupados, sem acesso a nome ou telefone.

## Tecnologias

HTML, CSS e JavaScript puro, empacotados com [Vite](https://vite.dev). Banco de dados no [Supabase](https://supabase.com), com regras de acesso (RLS) que permitem aos visitantes só criar agendamentos, nunca ler os de outros clientes.

## Rodar localmente

```bash
npm install
npm run dev      # servidor local com recarga automática
npm run build    # gera a pasta dist/, o mesmo comando que a plataforma de hospedagem usa
npm run preview  # abre a versão gerada pelo build
```

## Personalizar

- Número do WhatsApp: constante `WHATSAPP` em `src/main.js` (só dígitos, com 55 e DDD).
- Serviços e preços: lista em `index.html` (atributo `data-price`).
- Horários: objeto `HOURS` em `src/main.js` e tabela em `index.html`.

## Publicação

Importe o repositório na Vercel. Ela detecta o Vite sozinha: comando `npm run build` e pasta de saída `dist`.

## Segredos

O arquivo `.env` está no `.gitignore`. Use `.env.example` como modelo e cadastre os valores reais apenas no painel da plataforma.

---

Projeto de portfólio. Endereço, telefone e nome da barbearia são fictícios.
