/**
 * PPC Digital IFMS - JavaScript Principal
 * Instituto Federal de Mato Grosso do Sul
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ================================
     Navegação Mobile
  ================================ */
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('aberto');
      const expandido = navLinks.classList.contains('aberto');
      menuToggle.setAttribute('aria-expanded', expandido);
      menuToggle.textContent = expandido ? '✕' : '☰';
    });
  }

  /* ================================
     Seções Expansíveis
  ================================ */
  const secoesCabecalho = document.querySelectorAll('.secao-cabecalho');

  secoesCabecalho.forEach(cabecalho => {
    cabecalho.addEventListener('click', () => {
      const conteudo = cabecalho.nextElementSibling;
      const estaAberta = !conteudo.classList.contains('escondido');

      if (estaAberta) {
        conteudo.classList.add('escondido');
        cabecalho.classList.remove('aberta');
        cabecalho.setAttribute('aria-expanded', 'false');
      } else {
        conteudo.classList.remove('escondido');
        cabecalho.classList.add('aberta');
        cabecalho.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Expandir a primeira seção por padrão
  const primeiraSecao = document.querySelector('.secao-cabecalho');
  if (primeiraSecao) {
    primeiraSecao.click();
  }

  /* ================================
     Navegação com Scroll Spy
  ================================ */
  const secoes = document.querySelectorAll('.secao-ppc');
  const linksNav = document.querySelectorAll('.nav-links a, .sumario-lista a');

  const observarSecoes = new IntersectionObserver(
    (entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          const id = entrada.target.id;
          linksNav.forEach(link => {
            link.classList.remove('ativo');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('ativo');
            }
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  secoes.forEach(secao => observarSecoes.observe(secao));

  /* ================================
     Abrir Seção ao Clicar no Sumário
  ================================ */
  const linksSumario = document.querySelectorAll('.sumario-lista a');

  linksSumario.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        const cabecalhoTarget = target.querySelector('.secao-cabecalho');
        const conteudoTarget = target.querySelector('.secao-conteudo');

        if (conteudoTarget && conteudoTarget.classList.contains('escondido')) {
          conteudoTarget.classList.remove('escondido');
          if (cabecalhoTarget) {
            cabecalhoTarget.classList.add('aberta');
            cabecalhoTarget.setAttribute('aria-expanded', 'true');
          }
        }

        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    });
  });

  /* ================================
     Links de Navegação - Abre Seção
  ================================ */
  const linksNavPrincipal = document.querySelectorAll('.nav-links a[href^="#"]');

  linksNavPrincipal.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        const cabecalhoTarget = target.querySelector('.secao-cabecalho');
        const conteudoTarget = target.querySelector('.secao-conteudo');

        if (conteudoTarget && conteudoTarget.classList.contains('escondido')) {
          conteudoTarget.classList.remove('escondido');
          if (cabecalhoTarget) {
            cabecalhoTarget.classList.add('aberta');
          }
        }

        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // Fechar menu mobile após clique
        if (navLinks) {
          navLinks.classList.remove('aberto');
          if (menuToggle) menuToggle.textContent = '☰';
        }
      }
    });
  });

  /* ================================
     Botão Voltar ao Topo
  ================================ */
  const btnTopo = document.getElementById('btn-topo');

  if (btnTopo) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        btnTopo.classList.add('visivel');
      } else {
        btnTopo.classList.remove('visivel');
      }
    });

    btnTopo.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================================
     Busca no Conteúdo
  ================================ */
  const campoBusca = document.getElementById('campo-busca');
  const resultadoBusca = document.getElementById('resultado-busca');

  if (campoBusca) {
    let timerBusca;

    campoBusca.addEventListener('input', () => {
      clearTimeout(timerBusca);
      timerBusca = setTimeout(() => {
        const termo = campoBusca.value.trim().toLowerCase();
        realizarBusca(termo);
      }, 300);
    });

    campoBusca.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const termo = campoBusca.value.trim().toLowerCase();
        realizarBusca(termo);
      }
      if (e.key === 'Escape') {
        campoBusca.value = '';
        limparBusca();
      }
    });
  }

  function realizarBusca(termo) {
    // Remover marcações anteriores
    limparMarcacoes();

    if (!termo || termo.length < 2) {
      if (resultadoBusca) resultadoBusca.classList.remove('visivel');
      return;
    }

    const secoesPPC = document.querySelectorAll('.secao-ppc');
    let totalEncontrado = 0;
    const secoesEncontradas = [];

    secoesPPC.forEach(secao => {
      const texto = secao.textContent.toLowerCase();
      if (texto.includes(termo)) {
        const conteudo = secao.querySelector('.secao-conteudo');
        const cabecalho = secao.querySelector('.secao-cabecalho');
        const titulo = secao.querySelector('.secao-titulo');

        // Expandir a seção
        if (conteudo && conteudo.classList.contains('escondido')) {
          conteudo.classList.remove('escondido');
          if (cabecalho) cabecalho.classList.add('aberta');
        }

        // Marcar ocorrências no conteúdo
        if (conteudo) {
          const ocorrencias = marcarTexto(conteudo, termo);
          totalEncontrado += ocorrencias;
        }

        if (titulo) {
          secoesEncontradas.push(titulo.textContent.trim());
        }
      }
    });

    if (resultadoBusca) {
      if (totalEncontrado > 0) {
        resultadoBusca.innerHTML = `<strong>🔍 Busca:</strong> "${campoBusca.value}" — <strong>${totalEncontrado}</strong> ocorrência(s) encontrada(s) em: ${secoesEncontradas.join(', ')}. <button onclick="limparBusca()" style="margin-left:10px; padding:2px 10px; border:1px solid #999; border-radius:4px; cursor:pointer; background:#fff;">Limpar</button>`;
        resultadoBusca.classList.add('visivel');
      } else {
        resultadoBusca.innerHTML = `<strong>🔍 Busca:</strong> Nenhum resultado encontrado para "<em>${campoBusca.value}</em>". <button onclick="limparBusca()" style="margin-left:10px; padding:2px 10px; border:1px solid #999; border-radius:4px; cursor:pointer; background:#fff;">Limpar</button>`;
        resultadoBusca.classList.add('visivel');
      }
    }
  }

  function marcarTexto(elemento, termo) {
    const walker = document.createTreeWalker(
      elemento,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nos = [];
    let no;
    while ((no = walker.nextNode())) {
      if (no.textContent.toLowerCase().includes(termo)) {
        nos.push(no);
      }
    }

    let count = 0;
    nos.forEach(no => {
      const texto = no.textContent;
      const regex = new RegExp(escapeRegex(termo), 'gi');
      const matches = texto.match(regex);
      if (matches) count += matches.length;

      const span = document.createElement('span');
      span.innerHTML = texto.replace(regex, match => `<mark>${match}</mark>`);
      no.parentNode.replaceChild(span, no);
    });

    return count;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function limparMarcacoes() {
    document.querySelectorAll('mark').forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });

    document.querySelectorAll('span').forEach(span => {
      if (span.querySelector('mark') === null && span.dataset.busca) {
        const parent = span.parentNode;
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
      }
    });
  }

  // Expor para uso global (botão limpar)
  window.limparBusca = function() {
    limparMarcacoes();
    if (campoBusca) campoBusca.value = '';
    if (resultadoBusca) resultadoBusca.classList.remove('visivel');
  };

  /* ================================
     Acessibilidade - Tamanho de Fonte
  ================================ */
  const btnFonteNormal = document.getElementById('fonte-normal');
  const btnFonteGrande = document.getElementById('fonte-grande');
  const btnFonteMaior = document.getElementById('fonte-maior');

  function setFonte(tamanho) {
    document.body.classList.remove('fonte-grande', 'fonte-maior');
    if (tamanho === 'grande') document.body.classList.add('fonte-grande');
    if (tamanho === 'maior') document.body.classList.add('fonte-maior');
    localStorage.setItem('ppc-fonte', tamanho);
  }

  if (btnFonteNormal) btnFonteNormal.addEventListener('click', () => setFonte('normal'));
  if (btnFonteGrande) btnFonteGrande.addEventListener('click', () => setFonte('grande'));
  if (btnFonteMaior) btnFonteMaior.addEventListener('click', () => setFonte('maior'));

  // Restaurar preferência de fonte
  const fonteSalva = localStorage.getItem('ppc-fonte');
  if (fonteSalva) setFonte(fonteSalva);

  /* ================================
     Acessibilidade - Alto Contraste
  ================================ */
  const btnContraste = document.getElementById('alto-contraste');

  if (btnContraste) {
    btnContraste.addEventListener('click', () => {
      document.body.classList.toggle('alto-contraste');
      const ativo = document.body.classList.contains('alto-contraste');
      localStorage.setItem('ppc-contraste', ativo);
      btnContraste.textContent = ativo ? '◑ Contraste normal' : '◑ Alto contraste';
    });

    // Restaurar preferência de contraste
    if (localStorage.getItem('ppc-contraste') === 'true') {
      document.body.classList.add('alto-contraste');
      btnContraste.textContent = '◑ Contraste normal';
    }
  }

  /* ================================
     Sumário no Mobile
  ================================ */
  const btnSumario = document.getElementById('btn-sumario');
  const sumarioLateral = document.getElementById('sumario-lateral');

  if (btnSumario && sumarioLateral) {
    btnSumario.addEventListener('click', () => {
      sumarioLateral.classList.toggle('aberto');
    });
  }

  /* ================================
     Imprimir
  ================================ */
  const btnImprimir = document.getElementById('btn-imprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', () => {
      // Expandir todas as seções antes de imprimir
      document.querySelectorAll('.secao-conteudo').forEach(c => {
        c.classList.remove('escondido');
      });
      document.querySelectorAll('.secao-cabecalho').forEach(c => {
        c.classList.add('aberta');
      });
      window.print();
    });
  }

  /* ================================
     Expandir / Recolher Tudo
  ================================ */
  const btnExpandirTudo = document.getElementById('btn-expandir-tudo');
  const btnRecolherTudo = document.getElementById('btn-recolher-tudo');

  if (btnExpandirTudo) {
    btnExpandirTudo.addEventListener('click', () => {
      document.querySelectorAll('.secao-conteudo').forEach(c => {
        c.classList.remove('escondido');
      });
      document.querySelectorAll('.secao-cabecalho').forEach(c => {
        c.classList.add('aberta');
        c.setAttribute('aria-expanded', 'true');
      });
    });
  }

  if (btnRecolherTudo) {
    btnRecolherTudo.addEventListener('click', () => {
      document.querySelectorAll('.secao-conteudo').forEach(c => {
        c.classList.add('escondido');
      });
      document.querySelectorAll('.secao-cabecalho').forEach(c => {
        c.classList.remove('aberta');
        c.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ================================
     Atualizar Breadcrumb no Scroll
  ================================ */
  const breadcrumbSecao = document.getElementById('breadcrumb-secao');

  if (breadcrumbSecao) {
    window.addEventListener('scroll', () => {
      let secaoAtual = '';
      secoes.forEach(secao => {
        const topo = secao.getBoundingClientRect().top;
        if (topo < 100) {
          const titulo = secao.querySelector('.secao-titulo');
          if (titulo) secaoAtual = titulo.textContent.trim();
        }
      });
      breadcrumbSecao.textContent = secaoAtual || 'Início';
    });
  }

});
