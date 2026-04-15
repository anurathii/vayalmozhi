/* ============================================================
   VayalMozhi — Disease Detection Module
   ============================================================ */

const Disease = (() => {
  let selectedFile = null;
  let initialized = false;

  function init() {
    if (initialized) return;
    setupEventListeners();
    initialized = true;
  }

  function setupEventListeners() {
    const uploadZone = document.getElementById('disease-upload-zone');
    const fileInput = document.getElementById('disease-file-input');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (!uploadZone || !fileInput) return;

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // Analyze button
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', analyzeImage);
    }
  }

  function handleFileSelect(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    
    if (!allowedTypes.includes(file.type)) {
      App.notify('Invalid File', 'Please upload a PNG, JPG, or WEBP image.', 'error');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      App.notify('File Too Large', 'Maximum file size is 16MB.', 'error');
      return;
    }

    selectedFile = file;

    // Show preview
    const preview = document.getElementById('disease-preview');
    const previewImg = document.getElementById('disease-preview-img');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.classList.add('visible');
    };
    reader.readAsDataURL(file);

    // Hide previous results
    const result = document.getElementById('disease-result');
    if (result) result.classList.remove('visible');
  }

  async function analyzeImage() {
    if (!selectedFile) {
      App.notify('No Image', 'Please select an image first.', 'error');
      return;
    }

    const loading = document.getElementById('disease-loading');
    const result = document.getElementById('disease-result');
    const analyzeBtn = document.getElementById('analyze-btn');

    // Show loading
    if (loading) loading.classList.add('visible');
    if (result) result.classList.remove('visible');
    if (analyzeBtn) analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/detect-disease', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      displayResult(data.disease);
    } catch (error) {
      App.notify('Analysis Failed', error.message, 'error');
    } finally {
      if (loading) loading.classList.remove('visible');
      if (analyzeBtn) analyzeBtn.disabled = false;
    }
  }

  function displayResult(disease) {
    const result = document.getElementById('disease-result');
    if (!result) return;

    // Disease name
    document.getElementById('disease-name').textContent = disease.name;

    // Description
    document.getElementById('disease-description').textContent = disease.description;

    // Confidence bar
    const confidenceFill = document.getElementById('confidence-fill');
    confidenceFill.style.width = '0%';
    requestAnimationFrame(() => {
      setTimeout(() => {
        confidenceFill.style.width = `${disease.confidence}%`;
        confidenceFill.textContent = `${disease.confidence}%`;
      }, 100);
    });

    // Color confidence bar based on value
    if (disease.confidence >= 90) {
      confidenceFill.style.backgroundColor = 'var(--color-green)';
    } else if (disease.confidence >= 70) {
      confidenceFill.style.backgroundColor = 'var(--color-orange)';
    } else {
      confidenceFill.style.backgroundColor = 'var(--color-red)';
    }

    // Organic treatments
    const organicList = document.getElementById('organic-treatments');
    organicList.innerHTML = disease.organic_treatments.map(t => 
      `<li>${t}</li>`
    ).join('');

    // Inorganic treatments
    const inorganicList = document.getElementById('inorganic-treatments');
    inorganicList.innerHTML = disease.inorganic_treatments.map(t => 
      `<li>${t}</li>`
    ).join('');

    // Show result
    result.classList.add('visible');
  }

  return { init };
})();

// Auto-init when page loads (for direct navigation)
document.addEventListener('DOMContentLoaded', () => {
  Disease.init();
});
