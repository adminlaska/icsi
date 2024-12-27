// Globale Variablen für die Verwaltung
let categories = [];
let suppliers = [];
let energyTypes = ['Strom', 'Gas'];
let measurementTypes = ['RLM', 'SLP'];

function openAdminModal() {
    console.log('Opening admin modal...'); // Debug-Log
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'block';
        // Initial Daten laden
        loadSuppliers();
        loadCategories();
    } else {
        console.error('Admin Modal nicht gefunden');
    }
}

async function initializeAdminModal() {
    const modal = document.getElementById('adminModal');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('adminForm');

    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    form.onsubmit = handleFormSubmit;
    
    // Initial Daten laden
    await Promise.all([
        loadSuppliers(),
        loadCategories()
    ]);
}

async function loadSuppliers() {
    try {
        const response = await fetch('/api/suppliers');
        suppliers = await response.json();
        updateSupplierSelect();
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

function updateSupplierSelect() {
    const select = document.getElementById('adminSupplier');
    select.innerHTML = '<option value="">Lieferant auswählen</option>';
    
    // Nur eindeutige Lieferanten anzeigen
    const uniqueSuppliers = new Map();
    suppliers.forEach(supplier => {
        if (!uniqueSuppliers.has(supplier.name)) {
            uniqueSuppliers.set(supplier.name, supplier);
        }
    });
    
    uniqueSuppliers.forEach(supplier => {
        select.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
    });
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        updateCategorySelect();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateCategorySelect() {
    const select = document.getElementById('adminCategory');
    select.innerHTML = '<option value="">Kategorie auswählen</option>';
    categories.forEach(category => {
        select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
    });
}

function addAnswerInput() {
    const container = document.getElementById('answersContainer');
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer-input';
    answerDiv.innerHTML = `
        <div class="answer-row">
            <textarea placeholder="Antwort" required></textarea>
            <label class="checkbox-label">
                <input type="checkbox" class="correct-answer"> Korrekt
            </label>
            <button type="button" class="remove-answer" onclick="removeAnswer(this)">×</button>
        </div>
    `;
    container.appendChild(answerDiv);
}

function removeAnswer(button) {
    button.closest('.answer-input').remove();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        supplier_id: document.getElementById('adminSupplier').value,
        category_id: document.getElementById('adminCategory').value,
        energy_types: Array.from(document.querySelectorAll('input[name="energyType"]:checked')).map(cb => cb.value),
        measurement_types: Array.from(document.querySelectorAll('input[name="measurementType"]:checked')).map(cb => cb.value),
        question: document.getElementById('questionText').value,
        answers: Array.from(document.querySelectorAll('.answer-input')).map(answerDiv => ({
            text: answerDiv.querySelector('textarea').value,
            is_correct: answerDiv.querySelector('.correct-answer').checked
        }))
    };

    // Validierung
    if (!formData.supplier_id) {
        alert('Bitte wählen Sie einen Lieferanten aus');
        return;
    }
    if (!formData.category_id) {
        alert('Bitte wählen Sie eine Kategorie aus');
        return;
    }
    if (formData.energy_types.length === 0) {
        alert('Bitte wählen Sie mindestens einen Energietyp aus');
        return;
    }
    if (formData.measurement_types.length === 0) {
        alert('Bitte wählen Sie mindestens einen Messtyp aus');
        return;
    }
    if (!formData.answers.length) {
        alert('Bitte fügen Sie mindestens eine Antwort hinzu');
        return;
    }

    try {
        const response = await fetch('/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Fehler beim Speichern');

        // Erfolgreich gespeichert
        document.getElementById('adminModal').style.display = 'none';
        document.getElementById('adminForm').reset();
        document.getElementById('answersContainer').innerHTML = '';
        alert('Frage erfolgreich gespeichert!');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Fehler beim Speichern der Frage');
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', initializeAdminModal); 