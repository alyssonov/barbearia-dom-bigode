import { supabase } from "./supabase.js";

// Número do WhatsApp: só dígitos, com código do país (55) e DDD.
const WHATSAPP = "5562981894664";

// Horário de funcionamento por dia da semana (0 = domingo). Horas em formato 24h.
const HOURS = {
  0: null,
  1: null,
  2: [9, 20],
  3: [9, 20],
  4: [9, 20],
  5: [9, 20],
  6: [8, 18],
};

const DAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** Data e hora atuais no fuso de São Paulo, independente do fuso do visitante. */
function nowInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { day: weekdays.indexOf(get("weekday")), hour: Number(get("hour")) };
}

function updateStatus() {
  const el = document.getElementById("status");
  const { day, hour } = nowInSaoPaulo();
  const today = HOURS[day];
  const isOpen = today && hour >= today[0] && hour < today[1];

  el.dataset.open = String(Boolean(isOpen));
  if (isOpen) {
    el.textContent = `Aberto agora, fecha às ${today[1]}h`;
  } else {
    el.textContent = nextOpening(day, hour);
  }

  document.querySelectorAll(".hours tr").forEach((row) => {
    row.dataset.today = String(Number(row.dataset.days) === day);
  });
}

function nextOpening(day, hour) {
  const today = HOURS[day];
  if (today && hour < today[0]) return `Fechado agora, abre hoje às ${today[0]}h`;
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (HOURS[d]) {
      const when = i === 1 ? "amanhã" : `na ${DAYS[d]}`.replace("na sábado", "no sábado");
      return `Fechado agora, abre ${when} às ${HOURS[d][0]}h`;
    }
  }
  return "Fechado agora";
}

function validarHorario(valor) {
  if (!valor) return "Escolha o dia e o horário.";
  if (new Date(valor) <= new Date()) return "Escolha um horário no futuro.";

  const [data, hora] = valor.split("T");
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const funcionamento = HOURS[new Date(ano, mes - 1, dia).getDay()];

  if (!funcionamento) return "Não abrimos nesse dia da semana. Veja os horários abaixo.";
  const minutos = h * 60 + m;
  if (minutos < funcionamento[0] * 60 || minutos > funcionamento[1] * 60 - 30) {
    return `Nesse dia atendemos das ${funcionamento[0]}h às ${funcionamento[1]}h. O último horário é 30 minutos antes de fechar.`;
  }
  return null;
}

function preencherHorarios() {
  const dia = document.querySelector("input[name=dia]");
  const hora = document.querySelector("select[name=hora]");
  const pad = (n) => String(n).padStart(2, "0");
  const hoje = new Date();
  dia.min = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;

  dia.addEventListener("change", async () => {
    hora.innerHTML = "";
    if (!dia.value) {
      hora.add(new Option("Escolha o dia primeiro", ""));
      hora.disabled = true;
      return;
    }
    const [ano, mes, d] = dia.value.split("-").map(Number);
    const funcionamento = HOURS[new Date(ano, mes - 1, d).getDay()];
    if (!funcionamento) {
      hora.add(new Option("Fechado neste dia", ""));
      hora.disabled = true;
      return;
    }

    hora.add(new Option("Carregando horários…", ""));
    hora.disabled = true;
    const diaEscolhido = dia.value;
    const { data: ocupadosDia } = await supabase.rpc("horarios_ocupados", { dia: diaEscolhido });
    if (dia.value !== diaEscolhido) return; // o cliente mudou de dia enquanto carregava

    const ocupados = new Set((ocupadosDia ?? []).map((o) => new Date(o.data_hora).getTime()));
    hora.innerHTML = "";
    hora.add(new Option("Escolha o horário", ""));

    let livres = 0;
    for (let min = funcionamento[0] * 60; min <= funcionamento[1] * 60 - 30; min += 30) {
      const valor = `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
      const quando = new Date(`${diaEscolhido}T${valor}`);
      if (quando <= new Date()) continue;
      const ocupado = ocupados.has(quando.getTime());
      const opcao = new Option(ocupado ? `${valor} (ocupado)` : valor, valor);
      opcao.disabled = ocupado;
      hora.add(opcao);
      if (!ocupado) livres++;
    }

    if (livres === 0) hora.options[0].text = "Sem horários livres neste dia";
    hora.disabled = livres === 0;
  });
}

const money = (n) => `R$ ${n.toLocaleString("pt-BR")}`;

function setupBooking() {
  const form = document.getElementById("booking");
  const totalEl = document.getElementById("total");
  const wa = document.getElementById("wa");

  function refresh() {
    const checked = [...form.querySelectorAll("input[name=servico]:checked")];
    const total = checked.reduce((sum, i) => sum + Number(i.dataset.price), 0);
    totalEl.textContent = money(total);

    if (checked.length === 0) {
      wa.textContent = "Escolha um serviço";
      wa.setAttribute("aria-disabled", "true");
      wa.href = "#servicos";
      return;
    }

    const names = checked.map((i) => i.value).join(", ");
    const text = `Olá! Quero agendar: ${names} (total ${money(total)}). Quais horários vocês têm?`;
    wa.textContent = "Agendar pelo WhatsApp";
    wa.removeAttribute("aria-disabled");
    wa.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    wa.target = "_blank";
    wa.rel = "noopener";
  }

  form.addEventListener("change", refresh);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");
    const send = document.getElementById("send");
    const checked = [...form.querySelectorAll("input[name=servico]:checked")];
    if (checked.length === 0) {
      msg.textContent = "Marque pelo menos um serviço.";
      return;
    }
    const data = new FormData(form);
    const valor = data.get("dia") && data.get("hora") ? `${data.get("dia")}T${data.get("hora")}` : "";
    const erroHorario = validarHorario(valor);
    if (erroHorario) {
      msg.textContent = erroHorario;
      return;
    }
    send.disabled = true;
    msg.textContent = "Enviando…";
    const { error } = await supabase.from("agendamentos").insert({
      nome: data.get("nome").trim(),
      telefone: data.get("telefone").trim(),
      servicos: checked.map((i) => i.value),
      data_hora: new Date(valor).toISOString(),
      total: checked.reduce((s, i) => s + Number(i.dataset.price), 0),
    });
    send.disabled = false;
    if (error) {
      msg.textContent =
        error.code === "23505"
          ? "Esse horário já foi reservado. Escolha outro."
          : "Não foi possível agendar. Tente de novo ou use o WhatsApp.";
      console.error(error);
      if (error.code === "23505") {
        document.querySelector("input[name=dia]").dispatchEvent(new Event("change"));
      }
    } else {
      msg.textContent = "Agendado! Vamos confirmar pelo WhatsApp.";
      form.reset();
      refresh();
    }
  });

  refresh();
}

document.getElementById("year").textContent = new Date().getFullYear();
updateStatus();
setInterval(updateStatus, 60_000);
setupBooking();
preencherHorarios();