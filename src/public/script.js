// src/public/script.js
let allSuppliers = [];

async function fetchSuppliers() {
    try {
        console.log('Fetching suppliers...');
        const response = await fetch('/api/suppliers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allSuppliers = await response.json();
        console.log('Received suppliers:', allSuppliers);
        updateSupplierSelect();
        filterAndDisplaySuppliers();
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

function updateSupplierSelect() {
    const supplierSelect = document.getElementById('supplier');
    const uniqueSuppliers = [...new Set(allSuppliers.map(s => s.name))];
    
    supplierSelect.innerHTML = '<option value="all">Alle</option>';
    uniqueSuppliers.forEach(name => {
        supplierSelect.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

function filterAndDisplaySuppliers() {
    console.log('Filtering suppliers...');
    const marketType = document.getElementById('marketType').value;
    const energyType = document.getElementById('energyType').value;
    const selectedSupplier = document.getElementById('supplier').value;
    const container = document.getElementById('suppliers-container');
    
    container.innerHTML = '';
    
    const filteredSuppliers = allSuppliers.filter(supplier => {
        const marketTypeMatch = marketType === 'all' || supplier.market_type.toLowerCase() === marketType.toLowerCase();
        const energyTypeMatch = energyType === 'all' || supplier.energy_types.includes(energyType);
        const supplierMatch = selectedSupplier === 'all' || supplier.name === selectedSupplier;
        
        return marketTypeMatch && energyTypeMatch && supplierMatch;
    });

    console.log('Filtered suppliers:', filteredSuppliers);

    if (filteredSuppliers.length === 0) {
        container.innerHTML = `
            <div class="no-suppliers">
                Keine Lieferanten gefunden
            </div>
        `;
        return;
    }

    filteredSuppliers.forEach(supplier => {
        const card = document.createElement('div');
        card.className = 'supplier-card';
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${supplier.name}</h3>
                <span class="category">${supplier.category}</span>
            </div>
            
            <div class="supplier-info">
                <div class="type-group">
                    ${supplier.energy_types.map(type => 
                        `<span class="type-badge energy">${type}</span>`
                    ).join('')}
                    <span class="type-badge market">${supplier.market_type}</span>
                </div>
                <div class="type-group">
                    ${Array.isArray(supplier.measurement_types) ? 
                        supplier.measurement_types.map(type => 
                            `<span class="type-badge measurement">${type}</span>`
                        ).join('') 
                        : ''
                    }
                </div>
            </div>

            <div class="content-divider"></div>
            
            <div class="questions-container">
                <div class="question-item">
                    <div class="question-text">${supplier.question}</div>
                    ${Array.isArray(supplier.answers) ? 
                        supplier.answers.map(answer => 
                            `<div class="answer-text">${answer.answer_text}</div>`
                        ).join('') 
                        : ''
                    }
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Event Listener für Filter
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    fetchSuppliers();
    
    document.getElementById('marketType').addEventListener('change', filterAndDisplaySuppliers);
    document.getElementById('energyType').addEventListener('change', filterAndDisplaySuppliers);
    document.getElementById('supplier').addEventListener('change', filterAndDisplaySuppliers);
});