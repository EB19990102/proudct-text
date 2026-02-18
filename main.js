document.addEventListener('DOMContentLoaded', () => {
    const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/pzuQWVrVe/';
    const imageUpload = document.getElementById('image-upload');
    const previewWrap = document.getElementById('preview-wrap');
    const previewImage = document.getElementById('preview-image');
    const analyzeBtn = document.getElementById('analyze-btn');
    const modelStatus = document.getElementById('model-status');
    const resultSummary = document.getElementById('result-summary');
    const predictionList = document.getElementById('prediction-list');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    let model = null;
    let selectedImageUrl = null;

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const isDark = theme === 'dark';
        themeToggleBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        themeToggleBtn.setAttribute('aria-label', isDark ? '화이트 모드로 전환' : '다크 모드로 전환');
    }

    function initTheme() {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            applyTheme(storedTheme);
            return;
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    async function loadModel() {
        if (model) {
            return model;
        }

        modelStatus.textContent = '모델을 불러오는 중입니다...';
        try {
            model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
            modelStatus.textContent = '모델 준비 완료';
            return model;
        } catch (error) {
            modelStatus.textContent = '모델 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.';
            throw error;
        }
    }

    function mapAnimalType(label) {
        const value = String(label).toLowerCase();
        if (value.includes('dog') || value.includes('강아지') || value.includes('개')) {
            return '강아지상';
        }
        if (value.includes('cat') || value.includes('고양이')) {
            return '고양이상';
        }
        return `${label} 타입`;
    }

    function renderPredictions(predictions) {
        predictionList.innerHTML = '';

        predictions.forEach((item) => {
            const percent = Math.round(item.probability * 100);
            const row = document.createElement('div');
            row.className = 'prediction-row';

            const label = document.createElement('div');
            label.className = 'prediction-label';
            label.textContent = `${mapAnimalType(item.className)} (${item.className})`;

            const barWrap = document.createElement('div');
            barWrap.className = 'prediction-bar-wrap';

            const bar = document.createElement('div');
            bar.className = 'prediction-bar';
            bar.style.width = `${percent}%`;

            const value = document.createElement('div');
            value.className = 'prediction-value';
            value.textContent = `${percent}%`;

            barWrap.appendChild(bar);
            row.appendChild(label);
            row.appendChild(barWrap);
            row.appendChild(value);
            predictionList.appendChild(row);
        });
    }

    async function analyzeImage() {
        if (!previewImage.src) {
            return;
        }

        analyzeBtn.disabled = true;
        modelStatus.textContent = '이미지를 분석 중입니다...';

        try {
            const loadedModel = await loadModel();
            const predictions = await loadedModel.predict(previewImage, false);
            predictions.sort((a, b) => b.probability - a.probability);

            renderPredictions(predictions);
            const top = predictions[0];
            const percent = Math.round(top.probability * 100);
            resultSummary.textContent = `결과: ${mapAnimalType(top.className)} (${percent}%)`;
            modelStatus.textContent = '분석이 완료되었습니다.';
        } catch (error) {
            resultSummary.textContent = '';
            predictionList.innerHTML = '';
            modelStatus.textContent = '분석 중 오류가 발생했습니다. 이미지나 네트워크 상태를 확인해주세요.';
        } finally {
            analyzeBtn.disabled = false;
        }
    }

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        if (selectedImageUrl) {
            URL.revokeObjectURL(selectedImageUrl);
        }

        selectedImageUrl = URL.createObjectURL(file);
        previewImage.src = selectedImageUrl;
        previewWrap.hidden = false;
        resultSummary.textContent = '';
        predictionList.innerHTML = '';
        analyzeBtn.disabled = false;
        modelStatus.textContent = '사진이 준비되었습니다. 분석 버튼을 눌러주세요.';
    });

    analyzeBtn.addEventListener('click', analyzeImage);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', nextTheme);
        applyTheme(nextTheme);
    });

    initTheme();
    loadModel().catch(() => {});
});
