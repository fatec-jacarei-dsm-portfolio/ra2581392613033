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

function atualizarSom() {
  const mudo = trilha.muted || trilha.volume === 0;
  controleSom.textContent = trilha.paused ? '▶' : 'Ⅱ';
  controleSom.setAttribute('aria-label', trilha.paused ? 'Reproduzir música' : 'Pausar música');
  controleSom.setAttribute('aria-pressed', String(!trilha.paused));
  mutarSom.textContent = mudo ? 'Mudo' : 'Som';
  mutarSom.setAttribute('aria-label', mudo ? 'Ativar som' : 'Silenciar música');
  mutarSom.setAttribute('aria-pressed', String(mudo));
  volume.value = String(Math.round(trilha.volume * 100));
  valorVolume.textContent = mudo ? '0%' : `${volume.value}%`;
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
  if (inicioAutomatico && !e.target.closest('.player')) reproduzir();
}, { once: true });
atualizarSom();
reproduzir();
