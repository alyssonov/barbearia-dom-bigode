// Número de exemplo. Troque pelo seu, só dígitos, com código do país (55) e DDD.
const WHATSAPP = "5500000000000";

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
  form.addEventListener("submit", (e) => e.preventDefault());
  refresh();
}

document.getElementById("year").textContent = new Date().getFullYear();
updateStatus();
setInterval(updateStatus, 60_000);
setupBooking();
