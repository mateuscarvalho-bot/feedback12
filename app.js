class MedStudyApp {
    constructor() {
        this.data = {
            disciplines: [],
            customDisciplines: [],
            studies: [],
            settings: {
                dailyGoal: 3
            }
        };

        this.loadData();
        this.bindEvents();
        this.updateUI();
    }

    // -------------------------
    // Persistência
    // -------------------------
    loadData() {
        try {
            const saved = localStorage.getItem('medstudy-data');
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        }
    }

    saveData() {
        try {
            localStorage.setItem('medstudy-data', JSON.stringify(this.data));
            return true;
        } catch (err) {
            console.error('Erro ao salvar dados:', err);
            return false;
        }
    }

    // -------------------------
    // Eventos
    // -------------------------
    bindEvents() {
        // Menu de navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Formulário de estudos
        const studyForm = document.getElementById('study-form');
        if (studyForm) {
            studyForm.addEventListener('submit', e => {
                e.preventDefault();
                this.addStudy();
            });
        }

        // Formulário de disciplina customizada
        const customDisciplineForm = document.getElementById('custom-discipline-form');
        if (customDisciplineForm) {
            customDisciplineForm.addEventListener('submit', e => {
                e.preventDefault();
                this.addCustomDiscipline();
            });
        }

        // Botão salvar meta
        const saveGoalsBtn = document.getElementById('save-goals');
        if (saveGoalsBtn) {
            saveGoalsBtn.addEventListener('click', () => this.saveGoals());
        }

        // Quando mudar disciplina, popula tópicos
        const disciplineSelect = document.getElementById('discipline');
        if (disciplineSelect) {
            disciplineSelect.addEventListener('change', (e) => {
                this.populateTopicSelect(e.target.value);
            });
        }

        // Quando mudar tópico, exibe/oculta o campo custom
        const topicSelect = document.getElementById('topic');
        if (topicSelect) {
            topicSelect.addEventListener('change', () => {
                const customGroup = document.getElementById('custom-topic-group');
                if (!customGroup) return;
                if (topicSelect.value === '_other') {
                    customGroup.classList.remove('hidden');
                    // foco no input
                    const i = document.getElementById('custom-topic');
                    if (i) i.focus();
                } else {
                    customGroup.classList.add('hidden');
                }
            });
        }

        // Botão export/import/clear podem continuar funcionando normalmente...
    }

    // -------------------------
    // UI
    // -------------------------
    switchTab(tab) {
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.remove('tab-content--active');
        });
        document.querySelector(`.tab-content[data-tab="${tab}"]`)?.classList.add('tab-content--active');

        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('nav-btn--active');
        });
        document.querySelector(`.nav-btn[data-tab="${tab}"]`)?.classList.add('nav-btn--active');
    }

    updateUI() {
        this.updateCustomDisciplinesList();
        this.populateDisciplineSelects();
        // popula tópicos do select de estudo com a disciplina atualmente selecionada (se houver)
        const sel = document.getElementById('discipline');
        this.populateTopicSelect(sel?.value || '');
    }

    // -------------------------
    // Estudos
    // -------------------------
    addStudy() {
        const form = document.getElementById('study-form');
        if (!form) return;

        const data = new FormData(form);

        // usa o tópico selecionado; se for "_other", pega o valor do input custom-topic
        let topicVal = data.get('topic');
        if (topicVal === '_other') {
            const custom = (document.getElementById('custom-topic')?.value || '').trim();
            topicVal = custom || 'Outros';
        }

        const study = {
            id: Date.now(),
            disciplina: data.get('discipline'),
            topico: topicVal,
            totalQuestoes: parseInt(data.get('totalQuestions'), 10) || 0,
            questoesCorretas: parseInt(data.get('correctAnswers'), 10) || 0,
            data: data.get('studyDate'),
            tempo: parseInt(data.get('studyTime'), 10) || 0,
            observacoes: data.get('observations') || ''
        };

        this.data.studies.push(study);

        if (this.saveData()) {
            form.reset();
            // esconder input custom-topic após reset
            const customGroup = document.getElementById('custom-topic-group');
            if (customGroup) customGroup.classList.add('hidden');

            this.showToast('Sucesso', 'Estudo cadastrado com sucesso!', 'success');
        }
    }

    // -------------------------
    // Disciplinas customizadas
    // -------------------------
    addCustomDiscipline() {
        const nameInput = document.getElementById('custom-discipline-name');
        const topicsInput = document.getElementById('custom-discipline-topics');
        if (!nameInput || !topicsInput) return;

        const name = nameInput.value.trim();
        const topics = topicsInput.value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        if (!name) {
            this.showToast('Aviso', 'Por favor, digite o nome da disciplina', 'warning');
            return;
        }

        const allDisciplines = [...this.data.disciplines, ...this.data.customDisciplines];
        if (allDisciplines.some(d => d.nome.toLowerCase() === name.toLowerCase())) {
            this.showToast('Aviso', 'Disciplina já existe', 'warning');
            return;
        }

        const newDiscipline = {
            id: Date.now(),
            nome: name,
            assuntos: topics.length ? topics : ['Geral'],
            isCustom: true
        };

        this.data.customDisciplines.push(newDiscipline);

        if (this.saveData()) {
            nameInput.value = '';
            topicsInput.value = '';
            this.updateCustomDisciplinesList();
            this.populateDisciplineSelects();
            this.showToast('Sucesso', 'Disciplina adicionada com sucesso!', 'success');
        }
    }

    updateCustomDisciplinesList() {
        const list = document.getElementById('disciplines-list');
        if (!list) return;

        list.innerHTML = '';

        if (this.data.customDisciplines.length === 0) {
            list.innerHTML = '<p class="empty-state">Nenhuma disciplina adicionada</p>';
            return;
        }

        this.data.customDisciplines.forEach(d => {
            const item = document.createElement('div');
            item.className = 'discipline-item';
            item.innerHTML = `
                <div class="discipline-info">
                    <h5>${d.nome}</h5>
                    <p class="discipline-topics">${d.assuntos.join(', ')}</p>
                </div>
                <div class="discipline-actions">
                    <button class="btn-delete" data-id="${d.id}">Excluir</button>
                </div>
            `;

            item.querySelector('.btn-delete').addEventListener('click', () => {
                this.deleteCustomDiscipline(d.id);
            });

            list.appendChild(item);
        });
    }

    deleteCustomDiscipline(id) {
        this.data.customDisciplines = this.data.customDisciplines.filter(d => d.id !== id);
        if (this.saveData()) {
            this.updateCustomDisciplinesList();
            this.populateDisciplineSelects();
            this.showToast('Sucesso', 'Disciplina excluída!', 'success');
        }
    }

    // -------------------------
    // Popula selects de disciplina e tópico
    // -------------------------
    populateDisciplineSelects() {
        const selects = document.querySelectorAll('select#discipline, select#history-discipline-filter');
        const allDisciplines = [...this.data.disciplines, ...this.data.customDisciplines];

        selects.forEach(select => {
            const currentValue = select.value;

            if (select.id === 'history-discipline-filter') {
                select.innerHTML = '<option value="">Todas as disciplinas</option>';
            } else {
                select.innerHTML = '<option value="">Selecione uma disciplina</option>';
            }

            allDisciplines.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.nome;
                opt.textContent = d.nome;
                select.appendChild(opt);
            });

            if ([...select.options].some(o => o.value === currentValue)) {
                select.value = currentValue;
            }
        });

        // atualizar select de tópicos do formulário de estudo
        const studyDisc = document.getElementById('discipline');
        this.populateTopicSelect(studyDisc?.value || '');
    }

    populateTopicSelect(disciplineName) {
        const topicSelect = document.getElementById('topic');
        const customGroup = document.getElementById('custom-topic-group');
        const customInput = document.getElementById('custom-topic');

        if (!topicSelect) return;

        // reset
        topicSelect.innerHTML = '<option value="">Selecione primeiro uma disciplina</option>';
        if (customGroup) customGroup.classList.add('hidden');
        if (customInput) customInput.value = '';

        if (!disciplineName) {
            // nada selecionado
            return;
        }

        const allDisciplines = [...this.data.disciplines, ...this.data.customDisciplines];
        const d = allDisciplines.find(dd => dd.nome === disciplineName);

        if (d && Array.isArray(d.assuntos)) {
            d.assuntos.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                topicSelect.appendChild(opt);
            });
        }

        // sempre adicionar a opção "Outro"
        const otherOpt = document.createElement('option');
        otherOpt.value = '_other';
        otherOpt.textContent = 'Outro (digitar)';
        topicSelect.appendChild(otherOpt);

        // define valor padrão vazio
        topicSelect.value = '';
    }

    // -------------------------
    // Metas
    // -------------------------
    saveGoals() {
        const goalInput = document.getElementById('daily-goal');
        if (!goalInput) return;

        const goal = parseInt(goalInput.value, 10) || 1;
        this.data.settings.dailyGoal = goal;

        if (this.saveData()) {
            this.showToast('Sucesso', 'Meta diária salva!', 'success');
        }
    }

    // -------------------------
    // Toast
    // -------------------------
    showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${title}</strong>
                <span class="toast-message">${message}</span>
                <button class="toast-close">×</button>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('toast--show'), 100);

        setTimeout(() => {
            toast.classList.remove('toast--show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('toast--show');
            setTimeout(() => toast.remove(), 300);
        });
    }
}

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    window.medStudyApp = new MedStudyApp();
});
