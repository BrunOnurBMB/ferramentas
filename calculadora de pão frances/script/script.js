let historico = JSON.parse(localStorage.getItem('fermento_historico') || '[]');
    let currentMode = 'ambiente';
    let currentResult = null;

    function setMode(mode) {
      currentMode = mode;
      document.querySelectorAll('.tab').forEach((t, i) =>
        t.classList.toggle('active', (i === 0 && mode === 'ambiente') || (i === 1 && mode === 'camara'))
      );
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + mode).classList.add('active');
      calcAll();
    }

    function calcHoras() {
      const inicio = document.getElementById('hora-inicio').value;
      const fim = document.getElementById('hora-fim').value;
      if (!inicio || !fim) return 9.5;
      const [hi, mi] = inicio.split(':').map(Number);
      const [hf, mf] = fim.split(':').map(Number);
      let minI = hi * 60 + mi;
      let minF = hf * 60 + mf;
      if (minF <= minI) minF += 1440;
      return (minF - minI) / 60;
    }

    function formatHoras(h) {
      const hh = Math.floor(h);
      const mm = Math.round((h - hh) * 60);
      return mm > 0 ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
    }

    function calcAll() {
      const horas = calcHoras();
      const ajuste = Math.round((horas - 9.5) * 2);

      document.getElementById('duracao-txt').textContent = formatHoras(horas);
      const tag = document.getElementById('duracao-tag');
      if (horas < 7) { tag.textContent = 'curto'; tag.style.background = '#FAE8E6'; tag.style.color = '#A63D2F'; }
      else if (horas > 12) { tag.textContent = 'longo'; tag.style.background = '#E8F2EB'; tag.style.color = '#4A7C59'; }
      else { tag.textContent = 'padrão'; tag.style.background = ''; tag.style.color = ''; }

      const obs = horas < 7
        ? 'Tempo curto: o fermento precisa agir mais rápido — dose aumentada.'
        : horas > 12
          ? 'Tempo longo: fermentação lenta e controlada — dose reduzida.'
          : 'Tempo dentro da faixa habitual de 7h–12h.';
      document.getElementById('duracao-obs').textContent = obs;

      if (currentMode === 'ambiente') calcAmbiente(ajuste, horas);
      else calcCamara(ajuste, horas);
    }

    function calcAmbiente(ajuste, horas) {
      const temp = parseInt(document.getElementById('temp').value);
      const umid = parseInt(document.getElementById('umid').value);
      document.getElementById('temp-out').textContent = temp + '°C';
      document.getElementById('umid-out').textContent = umid + '%';

      let min, max, cls, label, desc;
      const alta = umid > 80;

      if (temp <= 18) {
        min = alta ? 100 : 90; max = alta ? 110 : 100; cls = 'ok'; label = 'Temperatura baixa';
        desc = alta ? 'Frio + umidade alta: fermento age devagar, use a faixa completa.' : 'Frio com umidade moderada: faixa levemente reduzida.';
      } else if (temp <= 21) {
        min = alta ? 95 : 85; max = alta ? 100 : 95; cls = 'warn'; label = 'Temperatura moderada';
        desc = alta ? 'Faixa intermediária — monitore o ponto de véu da massa.' : 'Temperatura média com umidade moderada.';
      } else {
        min = alta ? 80 : 70; max = alta ? 90 : 80; cls = 'hot'; label = 'Temperatura alta';
        desc = alta ? 'Calor + umidade alta: fermento muito ativo, use o mínimo.' : 'Alta temperatura com umidade baixa — atenção redobrada.';
      }

      min = Math.max(50, min - ajuste);
      max = Math.max(60, max - ajuste);

      const ajusteTexto = ajuste > 0
        ? `Descanso de ${formatHoras(horas)} → ${ajuste}g a menos que o padrão de 9h30.`
        : ajuste < 0
          ? `Descanso de ${formatHoras(horas)} → ${Math.abs(ajuste)}g a mais que o padrão de 9h30.`
          : 'Descanso no padrão de 9h30 — sem ajuste de tempo.';

      currentResult = { min, max, cls, label, temp, umid, horas, modo: 'ambiente' };
      renderResult('result-box', min, max, cls, label, desc, ajusteTexto, `${temp}°C · ${umid}% umidade · ${formatHoras(horas)} de descanso`);
    }

    function calcCamara(ajuste, horas) {
      const temp = parseInt(document.getElementById('temp-c').value);
      document.getElementById('temp-c-out').textContent = temp + '°C';

      let min = Math.max(60, 120 + Math.round(((10 - temp) / 2) * 5) - ajuste);
      let max = min + 15;
      const desc = temp <= 2 ? 'Câmara muito fria — fermentação super lenta, ideal para produção noturna.'
        : temp <= 6 ? 'Temperatura ideal de câmara. Boa margem de controle.'
          : 'Câmara mais quente — monitore para não fermentar demais.';
      const ajusteTexto = ajuste > 0
        ? `Descanso de ${formatHoras(horas)} → ${ajuste}g a menos que o padrão de 9h30.`
        : ajuste < 0
          ? `Descanso de ${formatHoras(horas)} → ${Math.abs(ajuste)}g a mais que o padrão de 9h30.`
          : 'Descanso no padrão de 9h30 — sem ajuste de tempo.';

      currentResult = { min, max, cls: 'cold', label: 'Câmara fria', temp, horas, modo: 'câmara' };
      renderResult('result-box-c', min, max, 'cold', 'Câmara fria', desc, ajusteTexto, `${temp}°C · ${formatHoras(horas)} de descanso`);
    }

    function renderResult(boxId, min, max, cls, label, desc, ajusteTexto, contexto) {
      document.getElementById(boxId).innerHTML = `
      <div class="result-card ${cls}">
        <div class="result-label">${label} · ${contexto}</div>
        <div class="result-range">${min} g – ${max} g</div>
        <div class="result-desc">${desc}</div>
        <div class="result-ajuste">${ajusteTexto}</div>
      </div>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Mínimo</div><div class="metric-val">${min} g</div></div>
        <div class="metric"><div class="metric-label">Máximo</div><div class="metric-val">${max} g</div></div>
      </div>`;
    }

    function salvarFornada() {
      if (!currentResult) return;
      const now = new Date();
      const entrada = {
        id: Date.now(),
        data: now.toLocaleDateString('pt-BR'),
        hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ...currentResult
      };
      historico.unshift(entrada);
      if (historico.length > 30) historico = historico.slice(0, 30);
      localStorage.setItem('fermento_historico', JSON.stringify(historico));
      renderHistorico();
    }

    function limparHistorico() {
      if (historico.length === 0) return;
      if (confirm('Limpar todo o histórico de fornadas?')) {
        historico = [];
        localStorage.setItem('fermento_historico', '[]');
        renderHistorico();
      }
    }

    function corDot(cls) {
      return cls === 'ok' ? '#4A7C59' : cls === 'warn' ? '#C17B2A' : cls === 'hot' ? '#A63D2F' : '#2B5BA1';
    }

    function renderHistorico() {
      const el = document.getElementById('historico-list');
      if (historico.length === 0) {
        el.innerHTML = '<div class="hist-empty">Nenhuma fornada registrada ainda.<br>Clique em "Salvar fornada" para começar.</div>';
        return;
      }
      el.innerHTML = '<div class="hist-list">' + historico.map(h => `
      <div class="hist-item">
        <div class="hist-dot" style="background:${corDot(h.cls)}"></div>
        <div class="hist-info">
          <strong>${h.data} às ${h.hora}</strong>
          ${h.modo === 'câmara' ? `Câmara ${h.temp}°C` : `${h.temp}°C · ${h.umid}% umidade`} · ${formatHoras(h.horas)} de descanso
        </div>
        <div class="hist-fermento">${h.min}–${h.max} g</div>
      </div>`).join('') + '</div>';
    }

    calcAll();
    renderHistorico();