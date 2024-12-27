// src/public/script.js
let allSuppliers = [];
let categories = [];

async function fetchSuppliers() {
    try {
        const response = await fetch('/api/suppliers');
        const data = await response.json();
        
        // Gruppiere die Daten nach Lieferant und Markttyp
        const groupedData = data.reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = {
                    name: item.name,
                    spot_questions: [],
                    termin_questions: []
                };
            }
            
            if (item.market_type === 'spot') {
                acc[item.name].spot_questions.push({
                    category: item.category,
                    question: item.question,
                    answers: item.answers
                });
            } else if (item.market_type === 'termin') {
                acc[item.name].termin_questions.push({
                    category: item.category,
                    question: item.question,
                    answers: item.answers
                });
            }
            
            return acc;
        }, {});

        allSuppliers = Object.values(groupedData);
        updateSupplierFilter(allSuppliers);
        displaySuppliers(allSuppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

function updateSupplierFilter(suppliers) {
    const supplierSelect = document.getElementById('supplier');
    const currentValue = supplierSelect.value;
    
    // Clear existing options except "Alle"
    supplierSelect.innerHTML = '<option value="all">Alle</option>';
    
    // Add supplier options
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.name;
        option.textContent = supplier.name;
        supplierSelect.appendChild(option);
    });
    
    // Restore previous selection if it exists
    if (currentValue !== 'all') {
        supplierSelect.value = currentValue;
    }
}

function displaySuppliers(suppliers) {
    const container = document.getElementById('suppliers-container');
    const marketType = document.getElementById('marketType').value;
    const selectedSupplier = document.getElementById('supplier').value;
    
    container.innerHTML = '';
    
    suppliers.forEach(supplier => {
        if (selectedSupplier !== 'all' && supplier.name !== selectedSupplier) {
            return;
        }

        const supplierRow = document.createElement('div');
        supplierRow.className = 'supplier-card';
        
        const nameCell = document.createElement('div');
        nameCell.className = 'supplier-name';
        nameCell.textContent = supplier.name;
        
        const spotCell = document.createElement('div');
        spotCell.className = 'market-section';
        
        const terminCell = document.createElement('div');
        terminCell.className = 'market-section';
        
        if (marketType === 'all' || marketType === 'spot') {
            spotCell.innerHTML = `
                <h3>SPOT Fragen</h3>
                <div class="question-list">
                    ${createQuestionsList(supplier.spot_questions || [])}
                </div>
                <button class="add-button" onclick="handleAddQuestion('${supplier.name}', 'spot')">+</button>
            `;
        }
        
        if (marketType === 'all' || marketType === 'termin') {
            terminCell.innerHTML = `
                <h3>TERMIN Fragen</h3>
                <div class="question-list">
                    ${createQuestionsList(supplier.termin_questions || [])}
                </div>
                <button class="add-button" onclick="handleAddQuestion('${supplier.name}', 'termin')">+</button>
            `;
        }
        
        supplierRow.appendChild(nameCell);
        if (marketType === 'all' || marketType === 'spot') supplierRow.appendChild(spotCell);
        if (marketType === 'all' || marketType === 'termin') supplierRow.appendChild(terminCell);
        
        container.appendChild(supplierRow);
    });
}

function createQuestionsList(questions) {
    if (!questions || questions.length === 0) {
        return '<p>Keine Fragen vorhanden</p>';
    }
    
    return questions.map(q => `
        <div class="question-item">
            <p><strong>${q.category}:</strong> ${q.question}</p>
            <p>Antwort: ${q.answers[0].answer_text}</p>
        </div>
    `).join('');
}

function handleAddQuestion(supplierName, marketType) {
    const modal = document.getElementById('questionModal');
    const form = document.getElementById('questionForm');
    const closeBtn = modal.querySelector('.close');

    if (categories.length === 0) {
        fetchCategories();
    }

    modal.style.display = 'block';

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();

        const questionData = {
            supplier_name: supplierName,
            market_type: marketType,
            category: document.getElementById('category').value,
            question: document.getElementById('question').value,
            answer: document.getElementById('answer').value
        };

        try {
            const response = await fetch('/api/suppliers/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(questionData)
            });

            if (response.ok) {
                modal.style.display = 'none';
                form.reset();
                fetchSuppliers();
            } else {
                alert('Fehler beim Speichern der Frage');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Fehler beim Speichern der Frage');
        }
    };
}

async function fetchCategories() {
    try {
        const response = await fetch('/api/suppliers/categories');
        categories = await response.json();
        updateCategorySelect();
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function updateCategorySelect() {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = categories
        .map(cat => `<option value="${cat.name}">${cat.name}</option>`)
        .join('');
}

function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const closeBtn = modal.querySelector('.close');

    modal.style.display = 'block';

    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const categoryName = document.getElementById('newCategory').value;
        
        try {
            const response = await fetch('/api/suppliers/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: categoryName })
            });

            if (response.ok) {
                await fetchCategories();
                modal.style.display = 'none';
                form.reset();
            } else {
                alert('Fehler beim Speichern der Kategorie');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Fehler beim Speichern der Kategorie');
        }
    };
}

// Event Listener für Filter
document.getElementById('marketType').addEventListener('change', () => {
    displaySuppliers(allSuppliers);
});

document.getElementById('supplier').addEventListener('change', () => {
    displaySuppliers(allSuppliers);
});

// Initialer Load
document.addEventListener('DOMContentLoaded', () => {
    fetchSuppliers();
    fetchCategories();
});