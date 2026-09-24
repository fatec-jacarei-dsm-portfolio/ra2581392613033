const paginas = [...document.querySelectorAll('.pagina')];
const links = [...document.querySelectorAll('.navegacao a')];
const nomes = { curriculo: 'Currículo', projetos: 'V-Tec Motors', scrum: 'Scrum Dungeon', lin0: 'LIN0' };

function atualizarPagina(evento) {
  if (evento && location.hash === '#conteudo') return;
  const ativa = paginas.find(pagina => `#${pagina.id}` === location.hash) || paginas[0];
  paginas.forEach(pagina => { pagina.hidden = pagina !== ativa; });
  document.body.dataset.pagina = ativa.id;
  links.forEach(link => {
    if (link.hash === `#${ativa.id}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `${nomes[ativa.id]} — Alef Gabriel`;
  if (evento) {
    ativa.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}
window.addEventListener('hashchange', atualizarPagina);
atualizarPagina();

const trilha = document.getElementById('trilha');
const controleSom = document.getElementById('controle-som');
const mutarSom = document.getElementById('mutar-som');
const volume = document.getElementById('volume');
const valorVolume = document.getElementById('valor-volume');
const avisoSom = document.getElementById('aviso-som');
let inicioAutomatico = true;
let volumeAnterior = 25;
trilha.volume = Number(volume.value) / 100;

const ondas = document.getElementById('ondas');
const desenho = ondas.getContext('2d');
let contextoAudio, analisador, amostras, quadro;

async function iniciarOndas() {
  if (!window.AudioContext || !desenho) return;
  try {
    contextoAudio ??= new window.AudioContext();
    await contextoAudio.resume();
    if (!analisador) {
      analisador = contextoAudio.createAnalyser();
      analisador.fftSize = 2048;
      amostras = new Float32Array(analisador.fftSize);
      const fonte = contextoAudio.createMediaElementSource(trilha);
      fonte.connect(analisador);
      analisador.connect(contextoAudio.destination);
    }
    desenharOndas();
  } catch {
    // Sem suporte à análise, o player continua funcionando normalmente.
  }
}

function desenharOndas() {
  cancelAnimationFrame(quadro);
  if (!desenho) return;
  const tocando = analisador && !trilha.paused && !trilha.muted && trilha.volume > 0;
  if (tocando) analisador.getFloatTimeDomainData(amostras);
  desenho.clearRect(0, 0, ondas.width, ondas.height);
  desenho.fillStyle = '#ff4b42';
  const barras = 48;
  for (let i = 0; i < barras; i++) {
    let pico = 0;
    if (tocando) {
      const inicio = Math.floor(i * amostras.length / barras);
      const fim = Math.floor((i + 1) * amostras.length / barras);
      for (let j = inicio; j < fim; j++) pico = Math.max(pico, Math.abs(amostras[j]));
    }
    const altura = Math.max(2, Math.min(1, Math.sqrt(pico * trilha.volume)) * (ondas.height - 8));
    desenho.fillRect(i * ondas.width / barras, (ondas.height - altura) / 2, 6, altura);
  }
  if (tocando) quadro = requestAnimationFrame(desenharOndas);
}

function atualizarSom() {
  const mudo = trilha.muted || trilha.volume === 0;
  controleSom.textContent = trilha.paused ? '▶' : '||';
  controleSom.setAttribute('aria-label', trilha.paused ? 'Reproduzir música' : 'Pausar música');
  controleSom.setAttribute('aria-pressed', String(!trilha.paused));
  mutarSom.textContent = mudo ? 'Mudo' : 'Som';
  mutarSom.setAttribute('aria-label', mudo ? 'Ativar som' : 'Silenciar música');
  mutarSom.setAttribute('aria-pressed', String(mudo));
  volume.value = String(Math.round(trilha.volume * 100));
  valorVolume.textContent = mudo ? '0%' : `${volume.value}%`;
  desenharOndas();
}
async function reproduzir(manual = false) {
  try {
    await trilha.play();
    inicioAutomatico = false;
    avisoSom.textContent = '';
  } catch {
    if (manual) avisoSom.textContent = 'Não foi possível tocar a música. Tente novamente no botão reproduzir.';
  }
  atualizarSom();
}
controleSom.addEventListener('click', () => {
  inicioAutomatico = false;
  if (trilha.paused) return reproduzir(true);
  trilha.pause();
  atualizarSom();
});
function definirVolume(valor) {
  trilha.volume = Math.max(0, Math.min(100, Number(valor))) / 100;
  trilha.muted = trilha.volume === 0;
  if (trilha.volume > 0) volumeAnterior = Math.round(trilha.volume * 100);
  atualizarSom();
}
volume.addEventListener('input', () => definirVolume(volume.value));
document.getElementById('diminuir-volume').addEventListener('click', () => definirVolume(trilha.volume * 100 - 10));
document.getElementById('aumentar-volume').addEventListener('click', () => definirVolume(trilha.volume * 100 + 10));
mutarSom.addEventListener('click', () => {
  inicioAutomatico = false;
  if (trilha.volume === 0) definirVolume(volumeAnterior);
  else trilha.muted = !trilha.muted;
  atualizarSom();
});
for (const evento of ['play', 'pause', 'volumechange']) trilha.addEventListener(evento, atualizarSom);
// Navegadores podem bloquear autoplay com som até a primeira interação.
for (const evento of ['pointerdown', 'keydown']) document.addEventListener(evento, e => {
  iniciarOndas();
  if (inicioAutomatico && !e.target.closest('.player')) reproduzir();
});
atualizarSom();
reproduzir();
